-- Creates the database
DROP DATABASE IF EXISTS capstone_db;
CREATE DATABASE capstone_db;
USE capstone_db;

-- 1. Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(100),
    role VARCHAR(50) 
);

-- 2. Courses Table
CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    semester VARCHAR(50),
    instructor_id INT,
    FOREIGN KEY (instructor_id) REFERENCES Users(user_id)
);

-- 3. Enrollments Table
CREATE TABLE Enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    FOREIGN KEY (student_id) REFERENCES Users(user_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- 4. Assignments Table
CREATE TABLE Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(100),
    due_date VARCHAR(50), 
    max_points INT,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- 5. Submissions Table
CREATE TABLE Submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT,
    student_id INT,
    submission_date VARCHAR(50),
    file_link VARCHAR(100),
    FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id),
    FOREIGN KEY (student_id) REFERENCES Users(user_id)
);

-- 6. Quizzes Table
CREATE TABLE Quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(100),
    due_date VARCHAR(50),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- 7. Quiz Questions Table
CREATE TABLE Quiz_Questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    question_text VARCHAR(255),
    correct_answer VARCHAR(100),
    FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
);

-- 8. Quiz Attempts Table
CREATE TABLE Quiz_Attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    student_id INT,
    score INT,
    attempt_date VARCHAR(50),
    FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id),
    FOREIGN KEY (student_id) REFERENCES Users(user_id)
);

-- 9. Grades Table
CREATE TABLE Grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    letter_grade VARCHAR(10),
    FOREIGN KEY (student_id) REFERENCES Users(user_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- 10. Announcements Table
CREATE TABLE Announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(100),
    message VARCHAR(255),
    date_posted VARCHAR(50),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- 11. Views for System Integration (Syncing with Instructor UI)

-- View for Instructor Dashboard Statistics
CREATE VIEW Instructor_Dashboard_Stats AS
SELECT 
    c.instructor_id,
    COUNT(DISTINCT c.course_id) AS active_courses,
    COUNT(DISTINCT e.student_id) AS total_students,
    COUNT(DISTINCT a.assignment_id) AS total_assignments
FROM Courses c
LEFT JOIN Enrollments e ON c.course_id = e.course_id
LEFT JOIN Assignments a ON c.course_id = a.course_id
GROUP BY c.instructor_id;

-- View for Instructor Gradebook
CREATE VIEW Student_Gradebook_Summary AS
SELECT 
    u.user_id AS student_id,
    u.name AS student_name,
    c.course_id,
    c.title AS course_title,
    g.letter_grade,
    c.instructor_id
FROM Grades g
JOIN Users u ON g.student_id = u.user_id
JOIN Courses c ON g.course_id = c.course_id;


-- Insert data into users and courses
INSERT INTO Users (name, email, password, role) VALUES 
('Jennifer Adams', 'jadams@hunter.cunny.edu', 'pass123', 'instructor'),
('David Chen', 'dchen@hunter.cuny.edu', 'pass456', 'instructor'),
('John Doe', 'jdoe@hunter.cuny.edu', 'pass789', 'student');

INSERT INTO Courses (title, semester, instructor_id) VALUES 
('MATH101 - Algebra I', 'Summer 2026', 2),
('PHYS101 -  Physics I', 'Summer 2026', 2);


-- Insert data into enrollements, assignments, announcements, quizzes

INSERT INTO Enrollments (student_id, course_id) VALUES 
(3, 1), 
(3, 2);

INSERT INTO Assignments (course_id, title, due_date, max_points) VALUES 
(1, 'HW #2', 'July 12, 2026', 50),
(2, 'Lab Report #1', 'June 24, 2026', 50);

INSERT INTO Announcements (course_id, title, message, date_posted)
VALUES (1, 'Welcome to Class!', 'Please read the syllabus before our first meeting.', 'June 1, 2026');

INSERT INTO Quizzes (course_id, title, due_date)
VALUES (1, 'Week 1 Quiz', 'June 25, 2026');

INSERT INTO Grades (student_id, course_id, letter_grade)
VALUES (3, 1, 'A');


-- Insert Data for submission, quiz_questions, quiz_attempts

INSERT INTO Submissions (assignment_id, student_id, submission_date, file_link)
VALUES (1, 3, 'July 11, 2026', 'hw1.pdf');

INSERT INTO Quiz_Questions (quiz_id, question_text, correct_answer)
VALUES (1, 'What is 2+2?', '4');

INSERT INTO Quiz_Attempts (quiz_id, student_id, score, attempt_date)
VALUES (1, 3, 100, 'June 24, 2026');
