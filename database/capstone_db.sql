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
    score INT,
    feedback VARCHAR(255),
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

-- Views for system integration
-- View for the instructor dashboard statistcs
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

-- View for the instructor gradebook
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

-- View to automate the student grade calculations
CREATE VIEW Automated_Grade_Calculations AS
SELECT 
    e.student_id,
    e.course_id,
    COUNT(s.submission_id) AS total_assignments_submitted,
    AVG(s.score) AS average_assignment_score,
    COUNT(qa.attempt_id) AS total_quizzes_taken,
    AVG(qa.score) AS average_quiz_score,
    (IFNULL(AVG(s.score), 0) + IFNULL(AVG(qa.score), 0)) / 2 AS estimated_overall_grade
FROM Enrollments e
LEFT JOIN Submissions s ON e.student_id = s.student_id 
    AND e.course_id = (SELECT course_id FROM Assignments WHERE assignment_id = s.assignment_id)
LEFT JOIN Quiz_Attempts qa ON e.student_id = qa.student_id 
    AND e.course_id = (SELECT course_id FROM Quizzes WHERE quiz_id = qa.quiz_id)
GROUP BY e.student_id, e.course_id;


-- Insert data into Users
INSERT INTO Users (name, email, password, role) VALUES 
('Jennifer Adams', 'jadams@hunter.cuny.edu', 'pass123', 'instructor'),
('David Chen', 'dchen@hunter.cuny.edu', 'pass456', 'instructor'),
('Alan Turing', 'aturing@hunter.cuny.edu', 'pass789', 'instructor'),
('John Doe', 'jdoe@hunter.cuny.edu', 'pass111', 'student'),
('Sameer Auluck', 'sauluck@hunter.cuny.edu', 'pass222', 'student'),
('Jai Auluck', 'jauluck@hunter.cuny.edu', 'pass333', 'student'),
('Olivia Ko', 'oko@hunter.cuny.edu', 'pass444', 'student');

-- Insert data into Courses
INSERT INTO Courses (title, semester, instructor_id) VALUES 
('MATH101 - Algebra I', 'Summer 2026', 2),
('PHYS101 - Physics I', 'Summer 2026', 2),
('CSCI49900 - Capstone Project', 'Summer 2026', 1),
('STAT31100 - Probability & Statistics', 'Summer 2026', 3),
('SPAN101 - Beginner Spanish', 'Summer 2026', 1);

-- Insert data into Enrollments
INSERT INTO Enrollments (student_id, course_id) VALUES 
(4, 1), (4, 2), 
(5, 3), (5, 4), (5, 5), 
(6, 1), (6, 4), 
(7, 3), (7, 4); 

-- Insert data into Assignments
INSERT INTO Assignments (course_id, title, due_date, max_points) VALUES 
(1, 'HW #2', 'July 12, 2026', 50),
(2, 'Lab Report #1', 'June 24, 2026', 50),
(3, 'Progress Report 2', 'July 15, 2026', 100),
(4, 'Youth Survey Data Eval', 'July 18, 2026', 100),
(5, 'Translation Drill', 'July 20, 2026', 25);

-- Insert data into Announcements
INSERT INTO Announcements (course_id, title, message, date_posted) VALUES 
(1, 'Welcome to Class!', 'Please read the syllabus before our first meeting.', 'June 1, 2026'),
(3, 'Capstone Teams', 'Please finalize your project groups by Friday.', 'June 5, 2026'),
(4, 'Regression Data', 'The dataset has been uploaded for the evaluation project.', 'July 10, 2026');

-- Insert data into Quizzes
INSERT INTO Quizzes (course_id, title, due_date) VALUES 
(1, 'Week 1 Quiz', 'June 25, 2026'),
(4, 'System Elimination Review', 'July 15, 2026'),
(5, 'Grammatical Cases Exam', 'July 22, 2026');

INSERT INTO Grades (student_id, course_id, letter_grade)
VALUES (3, 1, 'A');


-- Insert Data for submission, quiz_questions, quiz_attempts

INSERT INTO Submissions (assignment_id, student_id, submission_date, file_link)
VALUES (1, 3, 'July 11, 2026', 'hw1.pdf');

-- Insert Data for Quiz Questions
INSERT INTO Quiz_Questions (quiz_id, question_text, correct_answer) VALUES 
(1, 'What is 2+2?', '4'),
(2, 'What is the second equation in the linear system?', '2x-y+z'),
(2, 'What is the calculation result for the regression line?', '1775.7');

-- Insert Data for Quiz Attempts
INSERT INTO Quiz_Attempts (quiz_id, student_id, score, attempt_date) VALUES 
(1, 4, 100, 'June 24, 2026'),
(2, 5, 100, 'July 14, 2026'),
(2, 6, 85, 'July 14, 2026');
