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

/////////////////// LOGIN SHIT ////////////////////////////

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


/////////////////// POST REQUESTS ////////////////////////////

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

        try {
            const [alreadyExistingEmail] = await connectionPool.query(
                'SELECT user_id FROM Users WHERE email = ? AND isArchived = 0', [email]
            );
            if (alreadyExistingEmail.length > 0) {
                return res.status(409).json({ error: "Email already exists." });
            }

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


// create new course with old term system
app.post('/api/Courses', 
    authenticateToken,
    async (req, res) => {
        let { title, term, instructor_id, max_seats, credits, materials_url } = req.body;
        title = title?.trim();
        let formattedTerm = term?.trim().split(/\s+/);
        const instructorIDasNum = Number(instructor_id);
        const maxSeatsAsNum = Number(max_seats);
        const creditsAsNum = Number(credits);
        materials_url = materials_url?.trim();
        

        if (!title) return res.status(400).json("No course name given.");
        if (!formattedTerm) return res.status(400).json("No course term given.");
        if (!instructorIDasNum || instructorIDasNum < 0 || !(Number.isInteger(instructorIDasNum))) 
            return res.status(400).json({ error: "No valid instructor ID given." });
        if (!maxSeatsAsNum || maxSeatsAsNum < 0 || !(Number.isInteger(maxSeatsAsNum)))
            return res.status(400).json({ error: "No valid maximum seats given." });
        if (!creditsAsNum || creditsAsNum < 1 || !(Number.isInteger(creditsAsNum)))
            return res.status(400).json({ error: "No credits for course given" });
        if (!materials_url) materials_url = null;

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

        try {
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

            if (alreadyExistingCourse.length !== 0) {
                return res.status(409).json({error: "Course already exists" });
            }

            const [successfullyCreatedCourse] = await connectionPool.query(
                `INSERT INTO Courses (title, start_date, end_date, instructor_id, credits, max_seats, seats_open, materials_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, startDate, endDate, instructorIDasNum, creditsAsNum, maxSeatsAsNum, maxSeatsAsNum, materials_url]
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
                        instructor_id: successfullyCreatedCourse.instructor_id,
                        credits: successfullyCreatedCourse.credits,
                        max_seats: successfullyCreatedCourse.max_seats,
                        seats_open: successfullyCreatedCourse.seats_open,
                        materials_url: successfullyCreatedCourse.materials_url
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
        let { title, start_date, end_date, instructor_id, credits, max_seats, materials_url } = req.body;
        title = title?.trim();
        start_date = start_date?.trim();
        end_date = end_date?.trim();
        const instructorIDasNum = Number(instructor_id);
        const maxSeatsAsNum = Number(max_seats);
        const creditsAsNum = Number(credits);
        materials_url = materials_url?.trim();

        if (!title) return res.status(400).json("No course name given.");
        if (!instructorIDasNum || instructorIDasNum < 0 || !(Number.isInteger(instructorIDasNum))) 
            return res.status(400).json({ error: "No valid instructor ID given." });
        if (!isValidYYYYMMDD(start_date)) 
            return res.status(400).json({ error: "Invalid or no start date given. Please use YYYY-MM-DD format." });
        if (!isValidYYYYMMDD(end_date)) 
            return res.status(400).json({ error: "Invalid or no end date given. Please use YYYY-MM-DD format." });
        if (start_date >= end_date) {
            return res.status(400).json({ error: "Starting date given is not less than end date."});
        }
        if (!maxSeatsAsNum || maxSeatsAsNum < 0 || !(Number.isInteger(maxSeatsAsNum)))
            return res.status(400).json({ error: "No valid maximum seats given." });
        if (!creditsAsNum || creditsAsNum < 1 || !(Number.isInteger(creditsAsNum)))
            return res.status(400).json({ error: "No credits given" });
        if (!materials_url) materials_url = null;

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserID !== instructorIDasNum) {
            return res.status(403).json({ error: 'Only admins can create courses for other instructors' });
        }

        try {
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
                 WHERE title = ? AND start_date = ? AND end_date = ? AND instructor_id = ?`,
                [title, start_date, end_date, instructorIDasNum] 
            ); 

            if (alreadyExistingCourse.length > 0) {
                return res.status(409).json({ error: "Course already exists" });
            }

            const [successfullyCreatedCourse] = await connectionPool.query(
                `INSERT INTO Courses (title, start_date, end_date, instructor_id, credits, max_seats, seats_open, materials_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, start_date, end_date, instructorIDasNum, creditsAsNum, maxSeatsAsNum, maxSeatsAsNum, materials_url]
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
                        instructor_id: successfullyCreatedCourse.instructor_id,
                        credits: successfullyCreatedCourse.credits,
                        max_seats: successfullyCreatedCourse.max_seats,
                        seats_open: successfullyCreatedCourse.seats_open,
                        materials_url: successfullyCreatedCourse.materials_url
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

        const connection = await connectionPool.getConnection();

        try {
            await connection.beginTransaction();

            const [student] = await connection.query(
                `SELECT user_id, role FROM Users WHERE user_id = ? AND isArchived = 0`,
                [studentIDasNum]
            );
            if (student.length === 0) {
                return res.status(404).json({ error: `Student with ID ${studentIDasNum} not found`});
            }
            if (student[0].role !== 'student') {
                return res.status(403).json({ error: `User with ID ${studentIDasNum} is not student`});
            }
            
            const [course] = await connection.query(
                `SELECT course_id, seats_open, end_date FROM Courses WHERE course_id = ? AND isArchived = 0 FOR UPDATE`,
                [courseIDasNum]
            );        
            if (course.length === 0) {
                return res.status(404).json({ error: `Course with ID ${courseIDasNum} not found`});
            }
            if (course[0].seats_open <= 0) {
                return res.status(403).json({ error: `Course is full, cannot enroll`});
            }

            const currentDay = new Date();
            if (currentDay > new Date(course[0].end_date)) {
                return res.status(403).json({ error: `Course is already over, cannot enroll` });
            }

            const [existingEnrollment] = await connection.query(
                `SELECT enrollment_id FROM Enrollments WHERE course_id = ? AND student_id = ? AND isArchived = 0`,
                [courseIDasNum, studentIDasNum]
            );
            if (existingEnrollment.length > 0) 
                return res.status(409).json({ error: 'Student already enrolled' });

            const [successfulEnrollment] = await connection.query(
                `INSERT INTO Enrollments (student_id, course_id, enrolled_at) VALUES (?, ?, CURRENT_TIMESTAMP())`,
                [studentIDasNum, courseIDasNum]
            );

            await connection.query(
                `UPDATE Courses SET seats_open = seats_open - 1 WHERE course_id = ?`,
                [courseIDasNum]
            );
            await connection.commit();

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
        catch (error) {
            await connection.rollback();
            console.error(`Could not enroll student with ID ${studentIDasNum} into course with ID ${courseIDasNum}`, error);
            res.status(500).json({ error: 'Database error' });
        }
        finally {
            connection.release();
        }
    }
);

// add new assignment--for instructor or admin
app.post('/api/Assignments',
    authenticateToken,
    async (req, res) => {
        let { course_id, title, due_date, max_points, assignment_link, allow_resubmission } = req.body;
        const courseIDasNum = Number(course_id);
        let maxPointsAsNum = Number(max_points);
        title = title?.trim();
        const assignmentLink = assignment_link?.trim();        
        const dueDate = due_date?.trim();
        allow_resubmission = (allow_resubmission ? true : false);

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

        try {
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

            const [successfullyCreatedAssignment] = await connectionPool.query(
                `INSERT INTO Assignments (course_id, title, due_date, max_points, assignment_link, allow_resubmission) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [courseIDasNum, title, dueDate, maxPointsAsNum, assignmentLink, allow_resubmission]
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
                        assignment_link: successfullyCreatedAssignment.assignment_link,
                        allow_resubmission: successfullyCreatedAssignment.allow_resubmission
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
            return res.status(403).json({ error: 'Only admins and instructors can create announcements' });
        }

        try {
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
        
        try {
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
  
            const [successfullyUploadedQuiz] = await connectionPool.query(
                `INSERT INTO Quizzes (course_id, title, due_date) VALUES (?, ?, ?)`,
                [courseIDasNum, title, dueDate]
            );
            return res.status(201).json(
                {
                    success: true,
                    message: `Successfully uploaded quiz to course ${courseIDasNum}`,
                    quiz: {
                        quiz_id: successfullyUploadedQuiz.insertId,
                        course_id: successfullyUploadedQuiz.course_id,
                        title: successfullyUploadedQuiz.title,
                        due_date: successfullyUploadedQuiz.due_date
                    }
                }
            );
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
        if (scoreAsNum < 0 || scoreAsNum === undefined || scoreAsNum === null)
            return res.status(400).json({ error: 'No valid score given' });
        
        try {
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

        
            const [successfulQuizAttempt] = await connectionPool.query(
                `INSERT INTO Quiz_Attempts (quiz_id, student_id, score, attempt_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP())`,
                [quizIDasNum, studentIDasNum, scoreAsNum] 
            );
            return res.status(201).json(
                {
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
            );
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
        if (scoreAsNum < 0 || scoreAsNum === undefined || scoreAsNum === null) scoreAsNum = null;

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin' && currentUserRole !== 'instructor') {
            return res.status(403).json({ error: 'Only admins and instructors can create quiz questions' });
        }

        try {
            const [isActiveQuiz] = await connectionPool.query(
                `SELECT quiz_id FROM Quizzes WHERE quiz_id = ? AND isArchived = 0`,
                [quizIDasNum]
            );
            if (isActiveQuiz.length === 0)
                return res.status(403).json({ error: `Quiz with ${quizIDasNum} not found or is inactive` });

        
            const [successfullyCreatedQuizQuestion] = await connectionPool.query(
                `INSERT INTO Quiz_Questions (quiz_id, question_text, correct_answer, score) VALUES (?, ?, ?, ?)`,
                [quizIDasNum, question_text, correct_answer, scoreAsNum]
            );
            return res.status(201).json(
                {
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
            );
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
        feedback = feedback?.trim()

        if (!assignmentIDasNum || assignmentIDasNum < 0 || !(Number.isInteger(assignmentIDasNum)))
            return res.status(400).json({ error: "No valid assignment ID given" });
        if (!studentIDasNum || studentIDasNum < 0 || !(Number.isInteger(studentIDasNum)))
            return res.status(400).json({ error: 'No valid quiz ID given' });
        if (score && score < 0)
            return res.status(400).json({ error: "Score must be greater than 0" });
        if (score === undefined || score === null) score = null;
        if (!submission_link) return res.status(400).json({ error: "No submission link given" });
        if (!feedback) feedback = null;

        try {
            const [isActiveStudent] = await connectionPool.query(
                `SELECT user_id FROM Users WHERE user_id = ? AND isArchived = 0`,
                [studentIDasNum]
            );
            if (isActiveStudent.length === 0)
                return res.status(404).json({ error: `Student with ${studentIDasNum} not found or is inactive` });
            const [isActiveAssignment] = await connectionPool.query(
                `SELECT assignment_id, due_date FROM Assignments WHERE assignment_id = ? AND isArchived = 0`,
                [assignmentIDasNum]
            );
            if (isActiveAssignment.length === 0)
                return res.status(404).json({ error: `Assignment with ${assignmentIDasNum} not found or is inactive` });

            const dueDateTime = new Date(isActiveAssignment[0].due_date);
            if (new Date() > dueDateTime) {
                return res.status(403).json({ error: 'Submission is too late'});
            }

            const [successfullyPostedSubmission] = await connectionPool.query(
                `INSERT INTO Submissions (assignment_id, student_id, submission_date, submission_link, score, feedback)
                 VALUES (?, ?, CURRENT_TIMESTAMP(), ?, ?, ?)`,
                 [assignmentIDasNum, studentIDasNum, submission_link, scoreAsNum, feedback]
            );
            return res.status(201).json(
                {
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
            );
        }
        catch (error) {
            console.log(`Could not create submission to assignment ${assignmentIDasNum}`, error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
)

app.post('/api/Course_Grades',
    authenticateToken,
    async (req, res) => {
        let { student_id, course_id, letter_grade, score } = req.body;
        const studentIDasNum = Number(student_id);
        const courseIDasNum = Number(course_id);
        const scoreAsNum = Number(score);
        letter_grade = letter_grade?.trim().toUpperCase();
        
        if (!studentIDasNum || studentIDasNum < 0 || !(Number.isInteger(studentIDasNum)))
            return res.status(400).json({ error: 'No valid student ID given' });
        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum)))
            return res.status(400).json({ error: "No valid course ID given to associate this grade with" }); 
        if (letter_grade !== 'A' &&
            letter_grade !== 'B' &&
            letter_grade !== 'C' &&
            letter_grade !== 'D' &&
            letter_grade !== 'F')
            return res.status(403).json({ error: "No valid letter grade given" });
        if (scoreAsNum < 0 || scoreAsNum === undefined || scoreAsNum === null) {
            if (letter_grade === 'A') score = 95;
            if (letter_grade === 'B') score = 85;
            if (letter_grade === 'C') score = 75;
            if (letter_grade === 'D') score = 65;
            if (letter_grade === 'F') score = 55;
        }
            

        try {
            const [existingUser] = await connectionPool.query(
                `SELECT user_id FROM Users WHERE user_id = ? AND role = 'student' AND isArchived = 0`,
                [studentIDasNum]
            );
            if (existingUser.length === 0)
                return res.status(404).json({ error: `Student with ID ${studentIDasNum} not found` });

            const [existingCourse] = await connectionPool.query(
                `SELECT course_id FROM Courses WHERE course_id = ? and isArchived = 0`,
                [courseIDasNum]
            );
            if (existingCourse.length === 0) 
                return res.status(404).json({ error: `Course with ID ${courseIDasNum} not found` });
            
            const [existingEnrollment] = await connection.query(
                `SELECT enrollment_id FROM Enrollments WHERE course_id = ? AND student_id = ? AND isArchived = 0`,
                [courseIDasNum, studentIDasNum]
            );
            if (existingEnrollment.length === 0) {
                return res.status(404).json({ error: `Student is not enrolled into course` });
            }

            const [existingGrade] = await connectionPool.query(
                `SELECT student_id, course_id FROM Course_Grades
                WHERE student_id = ? AND course_id = ? AND isArchived = 0`,
                [studentIDasNum, courseIDasNum] 
            );
            if (existingGrade.length !== 0)
                return res.status(409).json({ error: `Grade for student ${studentIDasNum} in course ${courseIDasNum} exists` });

            const [successfullyInsertedGrade] = await connectionPool.query(
                `INSERT INTO Course_Grades (student_id, course_id, letter_grade) VALUES (?, ?, ?)`,
                [studentIDasNum, courseIDasNum, letter_grade]
            );
            return res.status(201).json(
                {
                    success: true,
                    message: `Successfully uploaded Grade for student`,
                    grade: {
                        grade_id: successfullyInsertedGrade.insertId,
                        student_id: successfullyInsertedGrade.student_id,
                        course_id: successfullyInsertedGrade.course_id,
                        letter_grade: successfullyInsertedGrade.letter_grade
                    }
                }
            );
        }
        catch (error) {
            console.log('Could not add to Grade table', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
)

/////////////////// GET REQUESTS ////////////////////////////

// get user by ID
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

// get course for instructor and number of students
app.get('/api/courses/instructor/:instructorID',
    authenticateToken,
    async (req, res) => {
        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;

        const isAdmin = (currentUserRole === 'admin');

        const instructorID = req.params.instructorID;
        const instructorIDasNum = Number(instructorID);

        if (!instructorIDasNum || instructorIDasNum < 0 || !(Number.isInteger(instructorIDasNum))) {
            return res.status(400).json({ error: "No valid instructor ID given" });
        }

        try {
            const [isValidInstructor] = await connectionPool.query(
                `SELECT user_id, role FROM Users WHERE user_id = ? AND isArchived = 0 AND role = 'instructor'`,
                [instructorIDasNum]
            );
            if (isValidInstructor.length === 0) {
                return res.status(404).json({ error: "Instructor not found" });
            }

            if (instructorIDasNum !== currentUserID && !isAdmin)
                return res.status(403).json({ error: `You are not allowed to access the courses list of another instructor` });

            const [courses] = await connectionPool.query(
                `
                 SELECT Courses.course_id, Courses.title, Courses.start_date, Courses.end_date, Courses.credits, Courses.materials_url, Courses.max_seats, Courses.seats_open,
                 (SELECT Users.name FROM Users WHERE Users.user_id = Courses.instructor_id AND isArchived = 0) AS instructor_name,
                 (SELECT COUNT(DISTINCT student_id) FROM Enrollments WHERE course_id = Courses.course_id AND isArchived = 0) AS student_count,
                 (SELECT COUNT(DISTINCT assignment_id) FROM Assignments WHERE course_id = Courses.course_id AND isArchived = 0) AS total_assignments,
                 (SELECT COUNT(DISTINCT quiz_id) FROM Quizzes WHERE course_id = Courses.course_id AND isArchived = 0) AS total_quizzes,     
                 (SELECT COUNT(DISTINCT announcement_id) FROM Announcements WHERE course_id = Courses.course_id AND isArchived = 0) AS total_announcements
                 FROM Courses
                 WHERE Courses.instructor_id = ? AND Courses.isArchived = 0
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

// get courses for student
app.get('/api/courses/student/:studentID',
    authenticateToken,
    async (req, res) => {
        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;

        const isAdmin = (currentUserRole === 'admin');

        const studentID = req.params.studentID;
        const studentIDasNum = Number(studentID);

        if (!studentIDasNum || studentIDasNum < 0 || !(Number.isInteger(studentIDasNum))) {
            return res.status(400).json({ message: `No valid student ID has been given` });
        }

        try {
            const [isActiveStudent] = await connectionPool.query(
                `SELECT user_id FROM Users WHERE user_id = ? AND isArchived = 0 AND role = 'student'`,
                [studentIDasNum]
            );
            if (isActiveStudent.length === 0) {
                return res.status(404).json({ message: `Student does not exist` });
            }
           
            if (isActiveStudent[0].user_id !== currentUserID && !isAdmin) {
                return res.status(403).json({ message: `Student requesting resource that is not theirs` });
            }

            const [coursesStudentIsEnrolledIn] = await connectionPool.query(
                ` SELECT Courses.course_id, Courses.title, Courses.start_date, Courses.end_date, Courses.credits, Courses.materials_url, Courses.max_seats, Courses.seats_open,
                 (SELECT Users.name FROM Users WHERE Users.user_id = Courses.instructor_id AND isArchived = 0) AS instructor_name,
                 (SELECT COUNT(DISTINCT student_id) FROM Enrollments WHERE course_id = Courses.course_id AND isArchived = 0) AS student_count,
                 (SELECT COUNT(DISTINCT assignment_id) FROM Assignments WHERE course_id = Courses.course_id AND isArchived = 0) AS total_assignments,
                 (SELECT COUNT(DISTINCT quiz_id) FROM Quizzes WHERE course_id = Courses.course_id AND isArchived = 0) AS total_quizzes,     
                 (SELECT COUNT(DISTINCT announcement_id) FROM Announcements WHERE course_id = Courses.course_id AND isArchived = 0) AS total_announcements
                 FROM Courses
                 INNER JOIN Enrollments ON Courses.course_id = Enrollments.course_id
                 WHERE Enrollments.student_id = ? AND Enrollments.isArchived = 0 AND Courses.isArchived = 0`,
                 [studentIDasNum]
            );
        
            return res.status(200).json(
                {
                    success: true,
                    total_courses: coursesStudentIsEnrolledIn.length,
                    courses: coursesStudentIsEnrolledIn
                }
            );
            
        }
        catch (error) {
            console.error(`Cannot fetch courses for ${studentIDasNum}`);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
);

// get course information based off ID
app.get('/api/courses/:courseID',
    authenticateToken,
    async (req, res) => {
        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;

        const isAdmin = (currentUserRole === 'admin');

        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);

        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) {
            return res.status(400).json({ error: "No valid course ID given" });
        }

        try {            
            let sqlQuery;
            if (isAdmin) {
                sqlQuery = `SELECT Courses.*, 
                           (SELECT Users.name FROM Users WHERE Users.user_id = Courses.instructor_id AND isArchived = 0) AS instructor_name,
                           (SELECT COUNT(DISTINCT student_id) FROM Enrollments WHERE course_id = Courses.course_id AND isArchived = 0) AS student_count,
                           (SELECT COUNT(DISTINCT assignment_id) FROM Assignments WHERE course_id = Courses.course_id AND isArchived = 0) AS total_assignments,
                           (SELECT COUNT(DISTINCT quiz_id) FROM Quizzes WHERE course_id = Courses.course_id AND isArchived = 0) AS total_quizzes,     
                           (SELECT COUNT(DISTINCT announcement_id) FROM Announcements WHERE course_id = Courses.course_id AND isArchived = 0) AS total_announcements
                           FROM Courses
                           WHERE Courses.course_id = ? AND Courses.isArchived = 0`
            }
            else {
                sqlQuery = `SELECT Courses.course_id, Courses.title, Courses.start_date, Courses.end_date, Courses.credits, Courses.materials_url, Courses.max_seats, Courses.seats_open,
                           (SELECT Users.name FROM Users WHERE Users.user_id = Courses.instructor_id AND isArchived = 0) AS instructor_name,
                           (SELECT COUNT(DISTINCT student_id) FROM Enrollments WHERE course_id = Courses.course_id AND isArchived = 0) AS student_count,
                           (SELECT COUNT(DISTINCT assignment_id) FROM Assignments WHERE course_id = Courses.course_id AND isArchived = 0) AS total_assignments,
                           (SELECT COUNT(DISTINCT quiz_id) FROM Quizzes WHERE course_id = Courses.course_id AND isArchived = 0) AS total_quizzes,     
                           (SELECT COUNT(DISTINCT announcement_id) FROM Announcements WHERE course_id = Courses.course_id AND isArchived = 0) AS total_announcements
                           FROM Courses
                           WHERE Courses.course_id = ? AND Courses.isArchived = 0`
            }
            const [foundCourse] = await connectionPool.query(
                sqlQuery, [courseIDasNum]
            );

            if (foundCourse.length === 0) {
                res.status(404).json({ error: `Course with ID ${courseIDasNum} not found` });
            }

            return res.status(200).json(
                {
                    success: true,
                    course: foundCourse[0]
                }
            );
        }
        catch (error) {
            console.log(`Could not fetch information associated with course with ID ${courseIDasNum}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
) 

// get enrollment by ID


// get assignment by ID


// get announcement by ID


// get submission by ID


// get grade by ID


// get grade by student and course


// get quiz by ID
app.get('/api/Quizzes/:quizID',
    authenticateToken,
    async (req, res) => {

    }
)


// get quiz_attempt by ID


// get quiz_questions by quiz ID 
app.get('/api/Quizzes/quiz_questions/:quizID',
    
);


// get course grades for student by student ID


// get assignment grades


// get assigment list for course 
app.get('/api/courses/assignments/:courseID',
    authenticateToken,
    async (req, res) => {
        const currentUserRole = req.user.role;
        const currentUserID = req.user.user_id;

        const isAdmin = (currentUserRole === 'admin');
        const isStudent = (currentUserRole === 'student');
        const isInstructor = (currentUserRole === 'instructor');

        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);

        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) {
            return res.status(400).json({ error: "No valid course ID given" });
        }

        try {
            if (isInstructor) {
                const [isActuallyYourCourse] = await connectionPool.query(
                    `SELECT course_id, instructor_id FROM Courses WHERE course_id = ? AND instructor_id = ? AND isArchived = 0`,
                    [courseIDasNum, currentUserID]
                );
                if (isActuallyYourCourse.length === 0) {
                    return res.status(403).json({ error: `You can only access assignments that belong to your course` });
                }
            }

            if (isStudent) {
                const [areYouEnrolled] = await connectionPool.query(
                    `SELECT enrollment_id FROM Enrollments WHERE course_id = ? AND student_id = ?`,
                    [courseIDasNum, currentUserID]
                );
                if (areYouEnrolled.length === 0) {
                    return res.status(403).json({ error: `You are not enrolled in this course` });
                }
            }

            let sqlQuery;
            if (isAdmin) {
                sqlQuery = `SELECT * FROM Assignments where course_id = ?`;
            }
            else { 
                sqlQuery = `SELECT assignment_id, title, due_date, max_points, assignment_link, allow_resubmission
                           FROM Assignments WHERE course_id = ? AND isArchived = 0`;
            }
            
            const [foundCourseWithAssignments] = await connectionPool.query(
                sqlQuery, [courseIDasNum]
            );

            return res.status(200).json(
                {
                    success: true,
                    assignments: foundCourseWithAssignments
                }
            );

        }
        catch (error) {
            console.log(`Could not get list of assignments from course with ID ${courseIDasNum}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// get quizzes list for course
app.get('/api/courses/quizzes/:courseID',
    authenticateToken,
    async (req, res) => {
        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);
        const currentUserRole = req.user.role;
        const currentUserID = req.user.user_id;

        const isAdmin = (currentUserRole === 'admin');
        const isStudent = (currentUserRole === 'student');
        const isInstructor = (currentUserRole === 'instructor');

        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) {
            return res.status(400).json({ error: "No valid course ID given" });
        }

        try {
            if (isInstructor) {
                const [isActuallyYourCourse] = await connectionPool.query(
                    `SELECT course_id, instructor_id FROM Courses WHERE course_id = ? AND instructor_id = ? AND isArchived = 0`,
                    [courseIDasNum, currentUserID]
                );
                if (isActuallyYourCourse.length === 0) {
                    return res.status(403).json({ error: `You can only access quizzes that belong to your course` });
                }
            }

            if (isStudent) {
                const [areYouEnrolled] = await connectionPool.query(
                    `SELECT enrollment_id FROM Enrollments WHERE course_id = ? AND student_id = ?`,
                    [courseIDasNum, currentUserID]
                );
                if (areYouEnrolled.length === 0) {
                    return res.status(403).json({ error: `You are not enrolled in this course` });
                }
            }

            let sqlQuery;
            if (isAdmin) {
                sqlQuery = `SELECT * FROM Quizzes where course_id = ?`;
            }
            else { 
                sqlQuery =`SELECT Quizzes.quiz_id, Courses.course_id, Courses.title as course_name, Quizzes.title, Quizzes.due_date 
                           FROM Quizzes LEFT JOIN Courses ON Courses.course_id = Quizzes.course_id 
                           WHERE Quizzes.course_id = ?`;
            }

            const [foundCourseWithQuizzes] = await connectionPool.query(
                sqlQuery, [courseIDasNum]
            );

            return res.status(200).json(
                {
                    success: true,
                    quizzes: foundCourseWithQuizzes
                }
            );

        }
        catch (error) {
            console.log(`Could not get list of quizzes from course with ID ${courseIDasNum}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// get announcement list for course
app.get('/api/courses/announcements/:courseID',
    authenticateToken,
    async (req, res) => {
        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);
        const currentUserRole = req.user.role;
        const currentUserID = req.user.user_id;

        const isAdmin = (currentUserRole === 'admin');
        const isStudent = (currentUserRole === 'student');
        const isInstructor = (currentUserRole === 'instructor');

        if (!courseIDasNum || courseIDasNum < 0 || !(Number.isInteger(courseIDasNum))) {
            return res.status(400).json({ error: "No valid course ID given" });
        }

        try {
            if (isInstructor) {
                const [isActuallyYourCourse] = await connectionPool.query(
                    `SELECT course_id, instructor_id FROM Courses WHERE course_id = ? AND instructor_id = ? AND isArchived = 0`,
                    [courseIDasNum, currentUserID]
                );
                if (isActuallyYourCourse.length === 0) {
                    return res.status(403).json({ error: `You can only access announcements that belong to your course` });
                }
            }

            if (isStudent) {
                const [areYouEnrolled] = await connectionPool.query(
                    `SELECT enrollment_id FROM Enrollments WHERE course_id = ? AND student_id = ?`,
                    [courseIDasNum, currentUserID]
                );
                if (areYouEnrolled.length === 0) {
                    return res.status(403).json({ error: `You are not enrolled in this course` });
                }
            }

            let sqlQuery;
            if (isAdmin) {
                sqlQuery = `SELECT * FROM Announcements WHERE course_id = ?`;
            }
            else { 
                sqlQuery = `SELECT Announcements.announcement_id, Announcements.title, Announcements.message, Announcements.date_posted, Courses.title AS course_title 
                            FROM Announcements 
                            LEFT JOIN Courses ON Courses.course_id = Announcements.course_id
                            WHERE Announcements.course_id = ?`;
            }
            const [foundCourseWithAnnouncements] = await connectionPool.query(
                sqlQuery, [courseIDasNum]
            );

            return res.status(200).json(
                {
                    success: true,
                    announcements: foundCourseWithAnnouncements
                }
            );

        }
        catch (error) {
            console.log(`Could not get list of announcements from course with ID ${courseIDasNum}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// get attempt list of user
app.get('/api/students/quiz_attempts/:studentID',
    authenticateToken,
    async (req, res) => {
        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);
        const currentUserRole = req.user.role;
        const currentUserID = req.user.user_id;

        const isAdmin = (currentUserRole === 'admin');
        const isStudent = (currentUserRole === 'student');
        const isInstructor = (currentUserRole === 'instructor');
        
        if (!studentIDasNum || studentIDasNum < 0 || !(Number.isInteger(studentIDasNum))) {
            return res.status(400).json({ error: "No valid student ID given" });
        }
        
        try {
            const [isActiveStudent] = await connectionPool.query(
                `SELECT user_id FROM Users WHERE user_id = ? AND isArchived = 0`,
                [studentIDasNum]
            );
            if (isActiveStudent.length === 0) 
                return res.status(404).json({ error: `User with ID ${studentIDasNum} does not exist` });

            if (isStudent && currentUserID !== isActiveStudent[0].user_id) {
                return res.status(403).json({ error: `Students cannot accesss quiz attempts of another student` });
            }

            let sqlQuery;
            if (isAdmin) {
                sqlQuery = `SELECT * FROM Quiz_Attempts WHERE student_id = ?`
            }
            else {
                sqlQuery = `SELECT Quiz_Attempts.attempt_id, Quizzes.title AS quiz_title, Courses.title AS course_title,
                            Quiz_Attempts.score, Quiz_Attempts.attempt_date
                            FROM Quiz_Attempts
                            LEFT JOIN Quizzes ON Quizzes.quiz_id = Quiz_Attempts.quiz_id
                            LEFT JOIN Courses ON Courses.course_id = Quizzes.course_id
                            WHERE Quiz_Attempts.student_id = ?`
            }
            const [attemptList] = await connectionPool.query(
               sqlQuery, [studentIDasNum]
            );

            return res.status(200).json(
                {
                    success: true,
                    quiz_attempts: attemptList
                }
            );
        } 
        catch (error) {
            console.log(`Could not get list of quiz attempts from student with ID ${studentIDasNum}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// get list of students
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
                 WHERE Enrollments.course_id = ? AND Users.isArchived = 0 AND Enrollments.isArchived = 0`,
                [courseIDasNum]
            );

            if (studentsInCourse.length === 0) {
                return res.status(200).json(
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

            return res.status(200).json(
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



/////////////////// PATCH REQUESTS ////////////////////////////

// removals
app.patch('/api/Courses/:courseID/remove',
    authenticateToken,
    async (req, res) => {
        const course_id = Number(req.params.courseID);
        let { isArchived } = req.body;
    }
); 

// update student grade
app.patch('/api/Course_Grades/:studentID/:courseID/update',
    authenticateToken,
    async (req, res) => {
        const studentIDasNum = Number(req.params.studentID);
        const courseIDasNum = Number(req.params.courseID);

        let { letter_grade, score } = req.body;
        const scoreAsNum = Number(score);
        letter_grade = letter_grade?.trim().toUpperCase();

        const currentUserID = req.user.user_id;
        const currentUserRole = req.user.role;

        if (currentUserRole === 'student') {
            return res.status(403).json({ error: `lol study harder bro` });
        }

        if (!studentIDasNum) return res.status(400).json({ error: `No valid student ID given` });
        if (!courseIDasNum) return res.status(400).json({ error: `No valid course ID given` });
        if (letter_grade !== 'A' &&
            letter_grade !== 'B' &&
            letter_grade !== 'C' &&
            letter_grade !== 'D' &&
            letter_grade !== 'F')
            return res.status(403).json({ error: "No valid letter grade given" });
        if (scoreAsNum < 0 || scoreAsNum === undefined || scoreAsNum === null) {
            if (letter_grade === 'A') score = 95;
            if (letter_grade === 'B') score = 85;
            if (letter_grade === 'C') score = 75;
            if (letter_grade === 'D') score = 65;
            if (letter_grade === 'F') score = 55;
        }
         
        const connection = await connectionPool.getConnection();
        
        try {
            await connection.beginTransaction();

            const [existingStudent] = await connection.query(
                `SELECT user_id FROM Users WHERE user_id = ? AND isArchived = 0 AND role = 'student'`,
                [studentIDasNum]
            );
            if (existingStudent.length === 0)
                return res.status(404).json({ error: `Student with ID ${studentIDasNum} not found` });

            const [existingCourse] = await connection.query(
                `SELECT course_id, instructor_id FROM Courses WHERE course_id = ? AND isArchived = 0`,
                [courseIDasNum]
            );
            if (existingCourse.length === 0)
                return res.status(404).json({ error: `Course with ID ${courseIDasNum} not found`  });

            if (currentUserRole !== 'admin') {
                if (existingCourse[0].instructor_id !== currentUserID)
                    return res.status(403).json({ error: `You cannot update a course that is not your own`});
            }

            const [existingEnrollment] = await connection.query(
                `SELECT enrollment_id FROM Enrollments WHERE course_id = ? AND student_id = ? AND isArchived = 0`,
                [courseIDasNum, studentIDasNum]
            );
            if (existingEnrollment.length === 0) {
                return res.status(404).json({ error: `Student is not enrolled into course` });
            }

            const [existingGrade] = await connection.query(
                `SELECT grade_id FROM Course_Grades WHERE student_id = ? AND course_id = ? AND isArchived = 0`,
                [studentIDasNum, courseIDasNum]
            );
            if (existingGrade.length === 0) {
                return res.status(404).json({ error: `Grade for student doesn't exist, there is nothing to update. Please use a POST request to create one.` })
            }
            const gradeID = Number(existingGrade[0].grade_id);

            await connection.query(
                `UPDATE Course_Grades SET letter_grade = ?, score = ? WHERE course_id = ? AND student_id = ?`,
                [letter_grade, scoreAsNum, courseIDasNum, studentIDasNum]
            );
            
             const [updatedGrade] = await connection.query(
                `SELECT grade_id, student_id, course_id, letter_grade, score, isArchived
                 FROM Course_Grades
                 WHERE student_id = ? AND course_id = ? AND isArchived = 0`,
                [studentIDasNum, courseIDasNum]
            );

            await connection.commit();

            return res.status(200).json(
                {
                    success: true,
                    message: `Grade updated successfully`,
                    updated_grade: updatedGrade[0]
                }
            );
        }
        catch (error) {
            await connection.rollback();
            console.log('Could not update grade', error);
            return res.status(500).json({ error: `Internal server error` });
        }    
        finally {
            await connection.release();
        }
    }
);

app.listen(port,
    () => {
        console.log(`Backend server running at http://localhost:${port}`);
    }
);

