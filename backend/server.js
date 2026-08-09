require('dotenv').config();

const express = require('express');
const SQL = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const { verify, hash } = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
        for (value in req.body) {
            value = value.trim();
        }

        if (!name)     { return res.status(400).json({ error: "No name given." }); }
        if (!email)    { return res.status(400).json({ error: "No email given." }); }
        if (!password) { return res.status(400).json({ error: "No password given." }); }
        if (!role)     { return res.status(400).json({ error: "No role given. "}); }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ error: "Email is not valid. " });
        }
        if (!password.length > 8) {
            return res.status(400).json({ error: "Password is too short. Must be more than 8 characters long." });
        }

        const [alreadyExistingEmail] = await connectionPool.query(
            'SELECT user_id FROM Users WHERE email = ?', [email]
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
                    name: name,
                    email: email,
                    role: role
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
                'SELECT user_id, name, email, role FROM Users WHERE user_id = ?',
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
                'SELECT user_id, name, password, role FROM Users WHERE email = ?',
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
                { userID: thisUser.user_id, role: thisUser.role },
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

app.get('/api/auth/me',
        authenticateToken,
        async (req, res) => {
            try {
                const [users] = await connectionPool.query(
                    'SELECT user_id, name, email, role FROM Users WHERE user_id = ?',
                    [req.user.userID]
                );

                if (users.length === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.json({ users: users[0] })
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

        if (!Number.isInteger(instructorIDasNum) || instructorIDasNum <= 0) {
            return res.status(400).json({ error: "No valid instructor ID given" });
        }

        try {
            const [isValidInstructor] = await connectionPool.query(
                'SELECT user_id, role FROM Users WHERE user_id = ?',
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
                 WHERE Courses.instructor_id = ?
                 GROUP BY Courses.course_id
                `,
                [instructorIDasNum]
            );

             const [allStudentsUnderInstructor] = await connectionPool.query(
                `
                 SELECT COUNT(DISTINCT Enrollments.student_id) AS total_students
                 FROM Courses JOIN Enrollments ON Courses.course_id = Enrollments.course_id
                 WHERE Courses.instructor_id = ?
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

// create new course
app.post('/api/Courses', 
    authenticateToken,
    async (req, res) => {
        let { title, term, instructorID } = req.body;
        title = title?.trim();
        term = term?.trim();
        instructorID = instructorID?.trim();

        if (!title) return res.status(400).json("No course name given.");
        if (!term) return res.status(400).json("No course term given.");
        if (!instructorID || isNaN(instructorID)) return res.status(400).json({ error: "No valid instructor ID given." });

        const [isExistingInstructor] = await connectionPool.query(
            `SELECT user_id, role FROM Users WHERE user_id = ?`,
            [instructorID]
        );
        if (isExistingInstructor.length === 0) {
            return res.status(404).json({ error: `User with ID ${instructorID} does not exist.`});
        }
        if (isExistingInstructor[0].role != 'instructor' && isExistingInstructor[0].role != 'admin') {
            return res.status(403).json({ error: `User with ID ${instructorID} is not an instructor.`});
        }

        const [alreadyExistingCourse] = await connectionPool.query(
            `SELECT title, semester, instructor_id FROM Courses 
             WHERE title = ? AND semester = ? AND instructor_id = ?`,
            [title, term, instructorID] 
        ); 

        if (alreadyExistingCourse.length > 0) {
            return res.status(409).json({error: "Course already exists" });
        }

        try {
            const [successfullyCreatedCourse] = await connectionPool.query(
                `INSERT INTO Courses (title, semester, instructor_id) VALUES (?, ?, ?)`,
                [title, term, instructorID]
            );
            return res.status(201).json(
                {
                    success: true,
                    message: `Course ${title} created`,
                    course: {
                        course_id: successfullyCreatedCourse.insertId,
                        title: title,
                        semester: term,
                        instructor_id: instructorID
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

app.get('/api/courses/students/:courseID',
    async (req, res) => {
        const courseID = req.params.courseID;
        const courseIDasNum = Number(courseID);
        
        if (!Number.isInteger(courseIDasNum) || courseIDasNum <= 0) {
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

            if (studentsInCourse.length == 0) {
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


// enroll students
app.post('api/enrollments/students/',
    async (req, res) => {
        let { student_id, course_id } = req.body;
        
    }
);

// add new assignment
app.post('api/Assignments',
    authenticateToken,
    async (req, res) => {
        let { courseID, title, dueDate, maxPoints, assignementLink } = req.body;
        
    }
);

app.post('api/Announcements',
    authenticateToken,
    async (req, res) => {

    }
)

app.listen(port,
    () => {
        console.log(`Backend server running at http://localhost:${port}`);
    }
);

