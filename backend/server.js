require('dotenv').config();

const express = require('express');
const SQL = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const { verify, hash } = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { start } = require('repl');

const { isValidYYYYMMDD, isValidTime } = require('./helperFunctions.js');
const { error } = require('console');

const rehashings = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'mykey'

const app = express();
app.use(cors());
app.use(express.json());

const connectionPool = SQL.createPool(
    {
        host: 'localhost',
        user: 'testuser',
        password: 'testpass',            
        database: 'capstone_db', 
        waitForConnections: true,
        connectionLimit: 100,
        queueLimit: 0,
        multipleStatements: true
    }
);
const port = process.env.port || 3000;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Invalid token given" });
    }

    jwt.verify(
        token, 
        JWT_SECRET, 
        (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Invalid or expired token" });
            }
            req.user = decoded;
            next();
        }
    ); 
};

// creates new user
app.post('/api/Users',
    async (req, res) => {
        let { name, email, password, role } = req.body;
        name = name?.trim();
        email = email?.trim();
        password = password?.trim();
        role = role?.trim();

        if (!name)     { return res.status(400).json({ error: "No name given." }); }
        if (!email)    { return res.status(400).json({ error: "No email given." }); }
        if (!password) { return res.status(400).json({ error: "No password given." }); }
        if (!role)     { return res.status(400).json({ error: "No role given. "}); }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ error: "Email is not valid. " });
        }
        if (!(password.length > 8)) {
            return res.status(400).json({ error: "Password is too short. Must be more than 8 characters long." });
        }

        const [alreadyExistingEmail] = await connectionPool.query(
            'SELECT user_id FROM Users WHERE email = ? AND isArchived = 0', [email]
        );
        if (alreadyExistingEmail.length > 0) {
            return res.status(409).json({ error: "Email already exists." });
        }

        try { 
            const hashedPassword = await bcrypt.hash(password, rehashings);

            const [successfulInsertion] = await connectionPool.query(
                'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, role]
            );
            res.status(201).json({
                message: "Student " + name + " created",
                student: {
                    id: successfulInsertion.insertId,
                    name: successfulInsertion.name,
                    email: successfulInsertion.email,
                    role: successfulInsertion.role
                },
            });
        }
        catch (error) {
            console.error('Database error', error);
            res.status(500).json({ error: "Database error." });
        }
    }
);

// get user information
app.get('/api/Users/:userID',
    async (req, res) => {
        const userID = req.params.userID;
        const userIDasNum = Number(userID);
        
        if (!Number.isInteger(userIDasNum) || isNaN(userID)) {
            return res.status(400).json({ error: "No valid User ID given" });
        }

        try {
            const [user] = await connectionPool.query(
                'SELECT user_id, name, email, role FROM Users WHERE user_id = ? AND isArchived = 0',
                [userIDasNum]
            );
            if (user.length === 0) {
                return res.status(404).json({ error: `User with ID ${userIDasNum} not found`});
            }

            return res.status(200).json(
                {
                    success: true,
                    id: user[0].user_id,
                    name: user[0].name,
                    email: user[0].email,
                    role: user[0].role
                }
            );
        }
        catch (error) {
            console.error(`Could not fetch User with ID ${userIDasNum}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);


// authenticate login
app.post('/api/auth/login',
    async (req, res) => {
        let { email, password } = req.body;
        email = email?.trim();
        password = password?.trim();

        if (!email)    { return res.status(400).json({ error: "No email given." }); }
        if (!password) { return res.status(400).json({ error: "No password given." }); }

        try {
            const [isExistingUser] = await connectionPool.query(
                'SELECT user_id, name, password, role FROM Users WHERE email = ? AND isArchived = 0',
                [email]
            );
            if (isExistingUser.length === 0) {
                return res.status(401).json({ error: "Invalid credentials given" });
            }

            const thisUser = isExistingUser[0];

            if (!(await bcrypt.compare(password, thisUser.password))) {
                return res.status(401).json({ error: "Invalid credentials given" });
            }

            const jwtToken = jwt.sign(
                { user_id: thisUser.user_id, role: thisUser.role },
                JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json(
                {
                    message: 'Login successful',
                    jwtToken,
                    user: {
                        id: thisUser.user_id,
                        name: thisUser.name,
                        email: thisUser.email,
                        role: thisUser.role
                    }
                }
            );
        }
        catch (error) {
            console.log('Login error', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// get current user
app.get('/api/auth/me',
        authenticateToken,
        async (req, res) => {
            try {
                const [users] = await connectionPool.query(
                    'SELECT user_id, name, email, role FROM Users WHERE user_id = ? AND isArchived = 0',
                    [req.user.user_id]
                );

                if (users.length === 0) {
                    return res.status(404).json({ error: "Invalid user is logged in." });
                }

                res.json({ user: users[0] })
            }
            catch (error) {
                console.error('Error fetching user:', error);
                res.status(500).json({ error: "Internal server error" });
            }
        }
)

app.post('/api/auth/logout',
    async (req, res) => {
        res.json({ message: 'Logout successful, please delete the JWT token' });
    }
);


// get course for instructor and number of students
app.get('/api/courses/instructor/:instructorID',
    async (req, res) => {
        const instructorID = req.params.instructorID;
        const instructorIDasNum = Number(instructorID);

        if (!instructorIDAsNum || instructorIDAsNum < 0 || !(Number.isInteger(instructorIDAsNum))) {
            return res.status(400).json({ error: "No valid instructor ID given" });
        }

        try {
            const [isValidInstructor] = await connectionPool.query(
                'SELECT user_id, role FROM Users WHERE user_id = ? AND isArchived = 0',
                [instructorIDasNum]
            );
            if (isValidInstructor.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            if (isValidInstructor[0].role !== 'instructor') {
                return res.status(400).json({ error: `User with ID ${instructorID} is not an instructor`});
            }

            const [courses] = await connectionPool.query(
                `
                 SELECT Courses.*,
                 COUNT(DISTINCT Enrollments.student_id) AS student_count,
                 COUNT(DISTINCT Assignments.assignment_id) AS total_assignments,
                 COUNT(DISTINCT Quizzes.quiz_id) AS total_quizzes,     
                 COUNT(DISTINCT Announcements.announcement_id) AS total_announcements
                 FROM Courses
                 LEFT JOIN Enrollments ON Courses.course_id = Enrollments.course_id 
                 LEFT JOIN Assignments ON Courses.course_id = Assignments.course_id 
                 LEFT JOIN Quizzes ON Courses.course_id = Quizzes.course_id 
                 LEFT JOIN Announcements ON Courses.course_id = Announcements.course_id 
                 WHERE Courses.instructor_id = ? AND Courses.isArchived = 0
                 GROUP BY Courses.course_id
                `,
                [instructorIDasNum]
            );

             const [allStudentsUnderInstructor] = await connectionPool.query(
                `
                 SELECT COUNT(DISTINCT Enrollments.student_id) AS total_students
                 FROM Courses JOIN Enrollments ON Courses.course_id = Enrollments.course_id
                 WHERE Courses.instructor_id = ? AND Courses.isArchived = 0
                `,
                [instructorIDasNum]
            ); 

            const totalStudents = allStudentsUnderInstructor[0]?.total_students || 0;
            
            return res.status(200).json(
                {
                    success: true,
                    course_count: courses.length,
                    total_students: totalStudents,
                    courses: courses
                }
            );
        }
        catch (error) {
            console.error(`Could not fetch courses for instructor with ID ${instructorID}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// create new course with old term system
app.post('/api/Courses', 
    authenticateToken,
    async (req, res) => {
        let { title, term, instructor_id } = req.body;
        title = title?.trim();
        let formattedTerm = term?.trim().split(/\s+/);
        const instructorIDasNum = Number(instructor_id);

        if (!title) return res.status(400).json("No course name given.");
        if (!formattedTerm) return res.status(400).json("No course term given.");
        if (!instructorIDAsNum || instructorIDAsNum < 0 || !(Number.isInteger(instructorIDAsNum))) 
            return res.status(400).json({ error: "No valid instructor ID given." });

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserID !== instructorIDasNum) {
            return res.status(403).json({ error: 'Only admins can create courses for other instructors' });
        }
        
    
        const season = formattedTerm[0].toLowerCase();
        const year = Number(formattedTerm[1]);
        if (!season || !formattedTerm?.[1] || isNaN(year)) {
            return res.status(403).json({ error: "Invalid term format given please use 'Winter/Spring/Summer/Fall YYYY'" });
        }

        let start = '';
        let end = '';
        let isWinter = false;
        if      (season.includes('winter')) { start = '12-28'; end = '01-25'; isWinter = true; }
        else if (season.includes('spring')) { start = '01-28'; end = '05-25'; }
        else if (season.includes('summer')) { start = '05-28'; end = '08-25'; }
        else if (season.includes('fall')) { start = '08-28'; end = '12-25'; }
        else {
            return res.status(403).json({ error: "Invalid term format given please use 'Winter/Spring/Summer/Fall YYYY'" });
        }

        let startDate = `${year}-${start}`;
        let endDate = `${isWinter ? (year + 1) : (year)}-${end}`;

        const [isExistingInstructor] = await connectionPool.query(
            `SELECT user_id, role FROM Users WHERE user_id = ?`,
            [instructorIDasNum]
        );
        if (isExistingInstructor.length === 0) {
            return res.status(404).json({ error: `User with ID ${instructorIDasNum} does not exist.`});
        }
        if (isExistingInstructor[0].role != 'instructor' && isExistingInstructor[0].role != 'admin') {
            return res.status(403).json({ error: `User with ID ${instructorIDasNum} is not an instructor or admin.`});
        }

        const [alreadyExistingCourse] = await connectionPool.query(
            `SELECT title, start_date, end_date, instructor_id FROM Courses 
             WHERE title = ? AND start_date = ? AND end_date = ? AND instructor_id = ? AND isArchived = 0`,
            [title, startDate, endDate, instructorIDasNum] 
        ); 

        if (alreadyExistingCourse.length > 0) {
            return res.status(409).json({error: "Course already exists" });
        }

        try {
            const [successfullyCreatedCourse] = await connectionPool.query(
                `INSERT INTO Courses (title, start_date, end_date, instructor_id) VALUES (?, ?, ?, ?)`,
                [title, startDate, endDate, instructorIDasNum]
            );
            return res.status(200).json(
                {
                    success: true,
                    message: `Course ${title} created`,
                    course: {
                        course_id: successfullyCreatedCourse.insertId,
                        title: successfullyCreatedCourse.title,
                        start_date: successfullyCreatedCourse.start_date,
                        end_date: successfullyCreatedCourse.end_date,
                        instructor_id: successfullyCreatedCourse.instructor_id
                    }
                }
            );
        }  
        catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

app.post('/api/Courses/exactDate',
    authenticateToken,
    async (req, res) => {
        let { title, start_date, end_date, instructor_id } = req.body;
        title = title?.trim();
        start_date = start_date?.trim();
        end_date = end_date?.trim();
        const instructorIDAsNum = Number(instructor_id);

        if (!title) return res.status(400).json("No course name given.");
        if (!instructorIDAsNum || instructorIDAsNum < 0 || !(Number.isInteger(instructorIDAsNum))) 
            return res.status(400).json({ error: "No valid instructor ID given." });
        if (!isValidYYYYMMDD(start_date)) 
            return res.status(400).json({ error: "Invalid or no start date given. Please use YYYY-MM-DD format." });
        if (!isValidYYYYMMDD(end_date)) 
            return res.status(400).json({ error: "Invalid or no end date given. Please use YYYY-MM-DD format." });
        if (start_date >= end_date) {
            return res.status(400).json({ error: "Starting date given is not less than end date."});
        }

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserID !== instructorID) {
            return res.status(403).json({ error: 'Only admins can create courses for other instructors' });
        }

        const [isExistingInstructor] = await connectionPool.query(
            `SELECT user_id, role FROM Users WHERE user_id = ?`,
            [instructorIDAsNum]
        );
        if (isExistingInstructor.length === 0) {
            return res.status(404).json({ error: `User with ID ${instructorIDAsNum} does not exist.`});
        }
        if (isExistingInstructor[0].role != 'instructor' && isExistingInstructor[0].role != 'admin') {
            return res.status(403).json({ error: `User with ID ${instructorIDAsNum} is not an instructor or admin.`});
        }

        const [alreadyExistingCourse] = await connectionPool.query(
            `SELECT title, start_date, end_date, instructor_id FROM Courses 
             WHERE title = ? AND start_date = ? AND end_date = ? AND instructor_id = ?`,
            [title, start_date, end_date, instructorIDAsNum] 
        ); 

        if (alreadyExistingCourse.length > 0) {
            return res.status(409).json({ error: "Course already exists" });
        }

        try {
            const [successfullyCreatedCourse] = await connectionPool.query(
                `INSERT INTO Courses (title, start_date, end_date, instructor_id) VALUES (?, ?, ?, ?)`,
                [title, start_date, end_date, instructorIDAsNum] 
            );
            return res.status(201).json(
                {
                    success: true,
                    message: `Course ${title} created`,
                    course: {
                        course_id: successfullyCreatedCourse.insertId,
                        title: successfullyCreatedCourse.title,
                        start_date: successfullyCreatedCourse.start_date,
                        end_date: successfullyCreatedCourse.end_date,
                        instructor_id: successfullyCreatedCourse.instructor_id
                    }
                }
            );
        }  
        catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
) 

app.get('/api/courses/students/:courseID',
    async (req, res) => {
        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);
        
        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) {
            return res.status(400).json({ error: "No valid course ID given" });
        }

        try {
            const [isExistingCourse] = await connectionPool.query(
                `SELECT course_id FROM Courses WHERE course_id = ?`,
                [courseIDasNum]
            );
            if (isExistingCourse.length == 0) {
                return res.status(404).json({ error: `Course with ID ${courseIDasNum} not found`});
            }

            const [studentsInCourse] = await connectionPool.query(
                `SELECT Enrollments.student_id, Users.name, Users.email
                 FROM Enrollments INNER JOIN Users ON Enrollments.student_id = Users.user_id 
                 WHERE Enrollments.course_id = ?`,
                [courseIDasNum]
            );

            if (studentsInCourse.length === 0) {
                return res.status(201).json(
                    {
                        success: true,
                        message: `Course ${courseIDasNum} found, but no students have enrolled yet`
                    }
                );
            }

            const formattedStudents = studentsInCourse.map(
                student => (
                    {
                        id: student.student_id,
                        name: student.name,
                        email: student.email
                    }
                )
            );

            return res.status(201).json(
                {
                    success: true,
                    message: `Course ${courseIDasNum} found, here is the list of students:`,
                    student_list: formattedStudents
                }
            );

        }
        catch(error) {
            console.error(`Could not fetch students for course ${courseIDasNum}`, error);
            res.status(500).json({ error: "Database error" });
        }
    }
);


app.post('/api/Courses/remove', 
    authenticateToken,
    async (req, res) => {

    }
);

// enroll students
app.post('/api/enrollments/students/',
    async (req, res) => {
        let { student_id, course_id } = req.body;
        const studentIDasNum = Number(student_id);
        const courseIDasNum = Number(course_id);

        if (!studentIDasNum || !(Number.isInteger(studentIDasNum)) || studentIDasNum < 0) {
            return res.status(400).json({ error: "Student ID not given or is not an integer." })
        }
        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) {
            return res.status(400).json({ error: "Course ID not given or is not an integer." });
        }

        const [student] = await connectionPool.query(
            `SELECT user_id, role FROM Users WHERE user_id = ? AND isArchived = 0`,
            [studentIDasNum]
        );
        const [course] = await connectionPool.query(
            `SELECT course_id FROM Courses WHERE course_id = ? AND isArchived = 0`,
            [courseIDasNum]
        );        

        if (student.length === 0) {
            return res.status(404).json({ error: `Student with ID ${studentIDasNum} not found`});
        }
        if (student[0].role !== 'student') {
            return res.status(403).json({ error: `User with ID ${studentIDasNum} is not student`});
        }

        if (course.length === 0) {
            return res.status(404).json({ error: `Course with ID ${courseIDasNum} not found`});
        }

        try {
            const [successfulEnrollment] = await connectionPool.query(
                `INSERT INTO Enrollments (student_id, course_id, enrolled_at) VALUES (?, ?, CURRENT_TIMESTAMP())`,
                [studentIDasNum, courseIDasNum]
            );
            if (successfulEnrollment.length === 0) {
                return res.status(200).json(
                    {
                        success: true,
                        message: `Successfully enrolled student ${studentIDasNum} into course ${courseIDasNum}`,
                        enrollment: {
                            enrollment_id: successfulEnrollment.insertId,
                            course_id: successfulEnrollment.course_id,
                            student_id: successfulEnrollment.student_id,
                            enrolled_at: successfulEnrollment.enrolled_at
                        }
                    }
                );
            }
        }
        catch (error) {
            console.error(`Could not enroll student with ID ${studentIDasNum} into course with ID ${courseIDasNum}`, error);
            res.status(500).json({ error: 'Database error' });
        }
    }
);

// add new assignment--for instructor or admin
app.post('/api/Assignments',
    authenticateToken,
    async (req, res) => {
        let { course_id, title, due_date, max_points, assignment_link } = req.body;
        const courseIDasNum = Number(course_id);
        let maxPointsAsNum = Number(max_points);
        title = title?.trim();
        const assignmentLink = assignment_link?.trim();        
        const dueDate = due_date?.trim();

        
        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) 
            return res.status(400).json({ error: 'No course ID given'});
        if (!maxPointsAsNum) maxPointsAsNum = 100;
        if (!dueDate) return res.status(400).json({ error: 'No due date given'});
        if (!title) return res.status(400).json({ error: 'No title given' });
        if (!assignmentLink) return res.status(400).json({ error: 'No assignment link given' });

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserRole != 'instructor') {
            return res.status(403).json({ error: 'Only admins and instructors can create assignments' });
        }

        const [date, time] = dueDate.split(' ');       
        if (!isValidYYYYMMDD(date)) {
            return res.status(400).json({ error: `Invalid due date given please use 'YYYY/MM/DD' format`}); 
        }
        if (!isValidTime(time)) {
            return res.status(400).json({ error: `Invalid due time given please use 24-hour 'HH:MM:SS' format`}); 
        }

        const [existingAssignment] = await connectionPool.query(
            `SELECT assignment_id FROM Assignments 
             WHERE course_id = ? AND title = ? AND due_date = ? AND assignment_link = ? AND isArchived = 0`,
             [courseIDasNum, title, dueDate, assignmentLink]
        );
        if (existingAssignment.length !== 0) {
            return res.status(409).json({ error: 'Assignment already exists' });
        }

        let isActuallyYourCourse;
        if (currentUserRole === 'admin') {
            [isActuallyYourCourse] = await connectionPool.query(
                `SELECT course_id FROM Courses WHERE course_id = ? AND isArchived = 0`,
                 [courseIDasNum]
            );
        }
        else {
            [isActuallyYourCourse] = await connectionPool.query(
                `SELECT course_id FROM Courses WHERE course_id = ? AND instructor_id = ? AND isArchived = 0`,
                 [courseIDasNum, currentUserID]
            );
        }
        if (isActuallyYourCourse.length === 0) {
            return res.status(403).json({ error: `This course either doesn't exist or you're trying to post an assignment
                                                  for a course that you aren't an instructor for.` });
        }

        const [isActiveUser] = await connectionPool.query(
            `SELECT user_id FROM Users WHERE user_id = ? AND (role = 'instructor' OR role = 'admin') AND isArchived = 0`,
            [currentUserID]
        );
        if (isActiveUser.length === 0) {
            return res.status(404).json({ error: "Who the fuck are you bro" });
        }

        try {
            const [successfullyCreatedAssignment] = await connectionPool.query(
                `INSERT INTO Assignments (course_id, title, due_date, max_points, assignment_link) VALUES (?, ?, ?, ?, ?)`,
                [courseIDasNum, title, dueDate, maxPointsAsNum, assignmentLink]
            );
            return res.status(200).json(
                {
                    success: true,
                    message: `Successfully posted assignment to course ${courseIDasNum}`,
                    assignment: {
                        assignment_id: successfullyCreatedAssignment.insertId,
                        title: successfullyCreatedAssignment.title,
                        course_id: successfullyCreatedAssignment.course_id,
                        due_date: successfullyCreatedAssignment.due_date,
                        max_points: successfullyCreatedAssignment.maxPointsAsNum,
                        assignment_link: successfullyCreatedAssignment.assignment_link
                    }
                }
            );
        }
        catch (error) {
            console.log('Could not post assignment to course', error);
            return res.status(500).json({ error: 'Database error' });
        }
    }
);

// create an announcement--for instructor or admin
app.post('/api/Announcements',
    authenticateToken,
    async (req, res) => {
        let { course_id, title, message } = req.body;
        const courseIDasNum = Number(course_id);
        title = title?.trim();
        message = message?.trim();

        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) 
            return res.status(400).json({ error: 'Course ID given is not a number' });
        if (!title && !message) return res.status(400).json(
            { error: `Announcement must have at least either a title or a message` }
        );
        if (!title) title = "Untitled";
        if (!message) message = " ";

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserRole !== 'instructor') {
            return res.status(403).json({ error: 'Only admins and instructors can create assignments' });
        }

        let isActuallyYourCourse;
        if (currentUserRole === 'admin') {
            [isActuallyYourCourse] = await connectionPool.query(
                `SELECT course_id FROM Courses WHERE course_id = ? AND isArchived = 0`,
                [courseIDasNum]
            );
        }
        else {
            [isActuallyYourCourse] = await connectionPool.query(
                `SELECT course_id, instructor_id FROM Courses WHERE course_id = ? AND instructor_id = ? AND isArchived = 0`,
                [courseIDasNum, currentUserID]
            );
        }
        if (isActuallyYourCourse.length === 0) {
            return res.status(403).json({ error: `This course either doesn't exist or you're trying to post an assignment
                                                  for a course that you aren't an instructor for.` });
        }

        const [isActiveUser] = await connectionPool.query(
            `SELECT user_id FROM Users WHERE user_id = ? AND (role = 'instructor' OR role = 'admin') AND isArchived = 0`,
            [currentUserID]
        );
        if (isActiveUser.length === 0) {
            return res.status(404).json({ error: "Who the fuck are you bro" });
        }

        try {
            const [successfullyPostedAnnouncement] = await connectionPool.query(
                `INSERT INTO Announcements (course_id, title, message, date_posted) VALUES (?, ?, ?, CURRENT_TIMESTAMP())`,
                [courseIDasNum, title, message]
            );
            return res.status(201).json(
                {
                    success: true,
                    message: `Successfully posted announcement to course ${courseIDasNum}`,
                    assignment: {
                        announcement_id: successfullyPostedAnnouncement.insertId,
                        course_id: successfullyPostedAnnouncement.course_id,
                        title: successfullyPostedAnnouncement.title,
                        message: successfullyPostedAnnouncement.message,
                        date_posted: successfullyPostedAnnouncement.date_posted
                    }
                }
            );
        }
        catch (error) {
            console.log('Could not post announcement to course', error);
            return res.status(500).json({ error: 'Database error' });
        }

    }
)

app.post('/api/Quizzes',
    authenticateToken,
    async (req, res) => {
        let { course_id, title, due_date } = req.body;
        const courseIDasNum = Number(course_id);
        title = title?.trim();
        const dueDate = due_date?.trim();
        
        const currentDay = new Date();
        
        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum)))
            return res.status(400).json({ error: "No valid course ID given to associate this quiz with"}); 
        
        if (!title) { title = "Untitled"; }
        if (!dueDate) { return res.status(400).json({ error: "No date was given goofy" }); }

        const [date, time] = dueDate.split(' ');
        if (!isValidYYYYMMDD(date)) { return res.status(403).json({ error: "No valid date given please use YYYY-DD-MM" }); }
        if (!isValidTime(time)) { return res.status(403).json({ error: "No valid time given please use HH:MM:SS" }); }
        if (date < currentDay) {
            return res.status(403).json({ error: "Date given is less than the current date" });
        }

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserRole !== 'instructor') {
            return res.status(403).json({ error: 'Only admins and instructors can create quizzes' });
        }
        
        let isActuallyYourCourse;
        if (currentUserRole === 'admin') {
            [isActuallyYourCourse] = await connectionPool.query(
                `SELECT course_id FROM Courses WHERE course_id = ? AND isArchived = 0`,
                [courseIDasNum]
            );
        }
        else {
            [isActuallyYourCourse] = await connectionPool.query(
                `SELECT course_id, instructor_id FROM Courses WHERE course_id = ? AND instructor_id = ? AND isArchived = 0`,
                [courseIDasNum, currentUserID]
            );
        }
        if (isActuallyYourCourse.length === 0)
            return res.status(403).json({ error: `This course either doesn't exist or you're trying to post an assignment
                                                  for a course that you aren't an instructor for.` });
        

        const [isActiveUser] = await connectionPool.query(
            `SELECT user_id FROM Users WHERE user_id = ? AND (role = 'instructor' OR role = 'admin') AND isArchived = 0`,
            [currentUserID]
        );

        try {
            const [successfullyUploadedQuiz] = await connectionPool.query(
                `INSERT INTO Quizzes (course_id, title, due_date) VALUES (?, ?, ?)`,
                [courseIDasNum, title, dueDate]
            );
            return {
                success: true,
                message: `Successfully uploaded quiz to course ${courseIDasNum}`,
                quiz: {
                    quiz_id: successfullyUploadedQuiz.insertId,
                    course_id: successfullyUploadedQuiz.course_id,
                    title: successfullyUploadedQuiz.title,
                    due_date: successfullyUploadedQuiz.due_date
                }
            }
        }
        catch (error) {
            console.log("Could not upload quiz", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

app.post('/api/Quiz_Attempts',
    async (req, res) => {
        let { quiz_id, student_id, score, attempt_date } = req.body;
        const quizIDasNum = Number(quiz_id);
        const studentIDasNum = Number(student_id);
        const scoreAsNum = Number(score);

        if (!quizIDasNum || quizIDasNum < 0 || !(Number.isInteger(quizIDasNum)))
            return res.status(400).json({ error: 'No valid quiz ID given' });
        if (!studentIDasNum || studentIDasNum < 0 || !(Number.isInteger(studentIDasNum)))
            return res.status(400).json({ error: 'No valid quiz ID given' });
        if (!scoreAsNum || scoreAsNum < 0)
            return res.status(400).json({ error: 'No valid score given' });
        
        const [isActiveQuiz] = await connectionPool.query(
            `SELECT quiz_id FROM Quizzes WHERE quiz_id = ? AND isArchived = 0`,
            [quizIDasNum]
        );
        if (isActiveQuiz.length === 0)
            return res.status(403).json({ error: `Quiz with ${quizIDasNum} not found or is inactive` });
        const [isActiveStudent] = await connectionPool.query(
            `SELECT user_id FROM Users WHERE user_id = ? AND isArchived = 0`,
            [studentIDasNum]
        );
        if (isActiveStudent.length === 0)
            return res.status(403).json({ error: `Student with ${studentIDasNum} not found or is inactive` });
        
        try {
            const [successfulQuizAttempt] = await connectionPool.query(
                `INSERT INTO Quiz_Attempts (quiz_id, student_id, score, attempt_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP())`,
                [quizIDasNum, studentIDasNum, scoreAsNum] 
            );
            return {
                success: true,
                message: 'Successfully logged quiz attempt',
                quiz_attempt: {
                    attempt_id: successfulQuizAttempt.insertId,
                    quiz_id: successfulQuizAttempt.quiz_id,
                    student_id: successfulQuizAttempt.student_id,
                    score: successfulQuizAttempt.score,
                    attempt_date: successfulQuizAttempt.attempt_date
                }
            }
        }
        catch(error) {
            console.log('Could not upload quiz attempt', error);
            res.status(500).json({ error: 'Internal server error' });
        }

    }
);

app.post('/api/Quiz_Questions',
    authenticateToken,
    async (req, res) => {
        let { quiz_id, question_text, correct_answer, score } = req.body;
        const quizIDasNum = Number(quiz_id);
        question_text = question_text?.trim();
        correct_answer = correct_answer?.trim();
        const scoreAsNum = Number(score);

        if (!quizIDasNum || quizIDasNum < 0 || !(Number.isInteger(quizIDasNum)))
            return res.status(400).json({ error: 'No valid quiz ID given' });
        if (!question_text) return res.status(400).json({ error: 'No question text given' });
        if (scoreAsNum && scoreAsNum < 0) return res.status(400).json({ error: 'Score must be greater than 0' });
        if (!scoreAsNum) scoreAsNum = 'NULL';

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserRole !== 'instructor') {
            return res.status(403).json({ error: 'Only admins and instructors can create quiz questions' });
        }

        const [isActiveQuiz] = await connectionPool.query(
            `SELECT quiz_id FROM Quizzes WHERE quiz_id = ? AND isArchived = 0`,
            [quizIDasNum]
        );
        if (isActiveQuiz.length === 0)
            return res.status(403).json({ error: `Quiz with ${quizIDasNum} not found or is inactive` });

        try {
            const [successfullyCreatedQuizQuestion] = await connectionPool.query(
                `INSERT INTO Quiz_Questions (quiz_id, question_text, correct_answer, score) VALUES (?, ?, ?, ?)`,
                [quizIDasNum, question_text, correct_answer, scoreAsNum]
            );
            return {
                success: true,
                message: `Successfully added quiz question to quiz with ID ${quizIDasNum}`,
                quiz_question: {
                    question_id: successfullyCreatedQuizQuestion.insertId,
                    quiz_id: successfullyCreatedQuizQuestion.quiz_id,
                    question_text: successfullyCreatedQuizQuestion.question_text,
                    correct_answer: successfullyCreatedQuizQuestion.correct_answer,
                    score: successfullyCreatedQuizQuestion.score
                }
            }
        }
        catch (error) {
            console.log(`Could not add quiz question to quiz ${quizIDasNum}`, error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
)

app.post('/api/Submissions',
    async(req, res) => {
        let { assignment_id, student_id, submission_date, submission_link, score, feedback } = req.body;
        const assignmentIDasNum = Number(assignment_id);
        const studentIDasNum = Number(student_id);
        const scoreAsNum = Number(score);
        submission_link = submission_link?.trim();
        feedback = feedback?.trim();

        if (!assignmentIDasNum || assignmentIDasNum < 0 || !(Number.isInteger(assignmentIDasNum)))
            return res.status(400).json({ error: "No valid assignment ID given" });
        if (!studentIDasNum || studentIDasNum < 0 || !(Number.isInteger(studentIDasNum)))
            return res.status(400).json({ error: 'No valid quiz ID given' });
        if (score && score < 0)
            return res.status(400).json({ error: "Score must be greater than 0" });
        if (!score) score = 'NULL';
        if (!submission_link) return res.status(400).json({ error: "No submission link given" });
        if (!feedback) feedback = 'NULL';

        const [isActiveStudent] = await connectionPool.query(
            `SELECT user_id FROM Users WHERE user_id = ? AND isArchived = 0`,
            [studentIDasNum]
        );
        if (isActiveStudent.length === 0)
            return res.status(403).json({ error: `Student with ${studentIDasNum} not found or is inactive` });
        const [isActiveAssignment] = await connectionPool.query(
            `SELECT assignment_id FROM Assignments WHERE assignment_id = ? AND isArchived = 0`,
            [assignmentIDasNum]
        );
        if (isActiveAssignment.length === 0)
            return res.status(403).json({ error: `Assignment with ${assignmentIDasNum} not found or is inactive` });


        try {
            const [successfullyPostedSubmission] = await connectionPool.query(
                `INSERT INTO Submissions (assignment_id, student_id, submission_date, submission_link, score, feedback)
                 VALUES (?, ?, CURRENT_TIMESTAMP(), ?, ?, ?)`,
                 [assignmentIDasNum, studentIDasNum, submission_link, scoreAsNum, feedback]
            );
            return {
                success: true,
                message: `Successfully created Submission to assignment ${assignmentIDasNum}`,
                submission: {
                    submission_id: successfullyPostedSubmission.insertId,
                    assignment_id: successfullyPostedSubmission.assignment_id,
                    student_id: successfullyPostedSubmission.student_id,
                    submission_date: successfullyPostedSubmission.submission_date,
                    submission_link: successfullyPostedSubmission.submission_link,
                    score: successfullyPostedSubmission.score,
                    feedback: successfullyPostedSubmission.feedback
                }
            }
        }
        catch (error) {
            console.log(`Could not create submission to assignment ${assignmentIDasNum}`, error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
)

app.listen(port,
    () => {
        console.log(`Backend server running at http://localhost:${port}`);
    }
);

