import "./StudentDashboard.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, SquarePen, Brain, ChevronRight } from "lucide-react";
import { getCurrentUser } from "../../../../backend/authServices.js";
import { getCoursesForStudent } from "../../../../backend/courseServices.js";
import { getAssignmentsForCourse } from "../../../../backend/assignmentServices.js";
import { getQuizzesForCourse } from "../../../../backend/quizServices.js";

// Temporary frontend data until backend API integration is connected
import {
    studentProfile,
    //enrolledCourses,
    //upcomingAssignments,
    //upcomingQuizzes,
    announcements,
    recentGrades,
} from "../../data/studentData";

const assignmentSubmissionsKey = "assignmentSubmissions";
const quizAttemptsKey = "quizAttempts";

function getDate(dateText) {
    return new Date(`${dateText}T00:00:00`);
}

function formatDisplayDate(dateText) {
    return getDate(dateText).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });
}

function sortByDueDate(items) {
    return [...items].sort((firstItem, secondItem) => {
        return getDate(firstItem.dueDate) - getDate(secondItem.dueDate);
    });
}

function EmptyState({ title, message, actionText, actionLink }) {
    return (
        <div className="dashboard-empty">
            <h3>{title}</h3>
            <p>{message}</p>

            {actionText && actionLink && (
                <Link to={actionLink} className="dashboard-empty__button">
                    {actionText}
                </Link>
            )}
        </div>
    );
}

// Loads the logged-in student and their real enrolled courses from the backend
// Courses are temporarily saved in localStorage so the existing course pages can use them
function StudentDashboard() {
    const [currentStudent, setCurrentStudent] = useState(null);
    const [studentCourses, setStudentCourses] = useState([]);
    const [dashboardAssignments, setDashboardAssignments] = useState([]);
    const [dashboardQuizzes, setDashboardQuizzes] = useState([]);
    const [studentError, setStudentError] = useState("");

    useEffect(() => {
        async function loadStudentDashboard() {
            const userResult = await getCurrentUser();

            if (!userResult.success) {
                setStudentError(
                    userResult.error ||
                    "Unable to load student information"
                );
                return;
            }

            const user = userResult.data?.user;

            if (user?.role?.toLowerCase() !== "student") {
                setStudentError(
                    "The logged-in account is not a student account"
                );
                return;
            }

            setCurrentStudent(user);

            const studentId = user.user_id ?? user.id;
            const coursesResult =
                await getCoursesForStudent(studentId);

            if (!coursesResult.success) {
                setStudentError(
                    coursesResult.error ||
                    "Unable to load enrolled courses"
                );
                return;
            }

            const courses = (
                coursesResult.data?.courses || []
            ).map((course) => ({
                id: course.course_id,
                code: `COURSE ${course.course_id}`,
                title: course.title,
                instructor:
                    course.instructor_name || "Instructor",
                credits: Number(course.credits || 0),
                seatsOpen: Number(course.seats_open || 0),
                materialsUrl: course.materials_url,
                startDate: course.start_date,
                endDate: course.end_date,
            }));

            setStudentCourses(courses);

            const [assignmentResults, quizResults] = await Promise.all([
                Promise.all(
                    courses.map(async (course) => {
                        const result = await getAssignmentsForCourse(course.id);

                        return (result.data?.assignments || []).map((assignment) => ({
                            id: assignment.assignment_id,
                            courseId: course.id,
                            courseCode: course.code,
                            title: assignment.title,
                            dueDate: assignment.due_date?.slice(0, 10),
                        }));
                    })
                ),
                Promise.all(
                    courses.map(async (course) => {
                        const result = await getQuizzesForCourse(course.id);

                        return (result.data?.quizzes || []).map((quiz) => ({
                            id: quiz.quiz_id,
                            courseId: course.id,
                            courseCode: course.code,
                            title: quiz.title,
                            dueDate: quiz.due_date?.slice(0, 10),
                        }));
                    })
                ),
            ]);

            setDashboardAssignments(assignmentResults.flat());
            setDashboardQuizzes(quizResults.flat());
            // Temporarily lets the other student pages use these real courses.
            localStorage.setItem(
                "studentCourses",
                JSON.stringify(courses)
            );

            window.dispatchEvent(
                new Event("studentCoursesUpdated")
            );
        }

        loadStudentDashboard();
    }, []);

    // Temporary browser storage
    // Replace with the logged in student's enrolled courses from the backend API
    // const savedCourses = localStorage.getItem("studentCourses");
    // const studentCourses = savedCourses
    //     ? JSON.parse(savedCourses)
    //     : enrolledCourses;

    // Temporary browser storage
    // Replace these reads with GET requests to the backend API
    const assignmentSubmissions = JSON.parse(
        localStorage.getItem(assignmentSubmissionsKey) || "[]"
    );

    const quizAttempts = JSON.parse(
        localStorage.getItem(quizAttemptsKey) || "[]"
    );

    const studentCourseCodes = studentCourses.map((course) => course.code);

    // const dashboardAssignments = upcomingAssignments.filter((assignment) =>
    //     studentCourseCodes.includes(assignment.courseCode)
    // );

    // const dashboardQuizzes = upcomingQuizzes.filter((quiz) =>
    //     studentCourseCodes.includes(quiz.courseCode)
    // );

    const dashboardAnnouncements = announcements.filter((announcement) =>
        studentCourseCodes.includes(announcement.courseCode)
    );

    const dashboardGrades = recentGrades.filter((grade) =>
        studentCourseCodes.includes(grade.courseCode)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dashboardToDo = sortByDueDate([
        ...dashboardAssignments
            .filter((assignment) => {
                const course = studentCourses.find(
                    (course) => course.code === assignment.courseCode
                );

                const submitted = assignmentSubmissions.find(
                    (submission) =>
                        String(submission.assignmentId) === String(assignment.id) &&
                        String(submission.courseId) === String(course?.id)
                );

                return getDate(assignment.dueDate) >= today && !submitted;
            })
            .map((assignment) => ({
                ...assignment,
                type: "Assignment",
                courseId: studentCourses.find(
                    (course) => course.code === assignment.courseCode
                )?.id,
            })),

        ...dashboardQuizzes
            .filter((quiz) => {
                const course = studentCourses.find(
                    (course) => course.code === quiz.courseCode
                );

                const attempt = quizAttempts.find(
                    (attempt) =>
                        String(attempt.quizId) === String(quiz.id) &&
                        String(attempt.courseId) === String(course?.id)
                );

                return (
                    getDate(quiz.dueDate) >= today &&
                    attempt?.status !== "Completed"
                );
            })
            .map((quiz) => ({
                ...quiz,
                type: "Quiz",
                courseId: studentCourses.find(
                    (course) => course.code === quiz.courseCode
                )?.id,
            })),
    ]);

    const studentName = currentStudent?.name || "Student";
    const studentId =
        currentStudent?.user_id ??
        currentStudent?.id ??
        (studentError ? "Unavailable" : "Loading...");

    return (
        <main className="dashboard">
            <section className="dashboard__header">
                <div>
                    <p className="dashboard__label">STUDENT PORTAL</p>

                    <h1 className="dashboard__title">
                        Welcome back, {studentName}
                    </h1>

                    <p className="dashboard__description">
                        ID: {studentId}
                    </p>

                    {studentError && (
                        <p className="dashboard__description">
                            {studentError}
                        </p>
                    )}
                </div>

                <div className="dashboard__term">
                    <span>TERM:</span>
                    <strong>{studentProfile.term}</strong>
                </div>
            </section>

            <section className="dashboard__summary">
                <article className="summary-card">
                    <div className="summary-card__icon summary-card__icon--courses">
                        <BookMarked size={22} />
                    </div>

                    <div>
                        <span>Courses Enrolled</span>
                        <strong>{studentCourses.length}</strong>
                    </div>
                </article>

                <article className="summary-card">
                    <div className="summary-card__icon summary-card__icon--assignments">
                        <SquarePen size={22} />
                    </div>

                    <div>
                        <span>Assignments</span>
                        <strong>{dashboardAssignments.length}</strong>
                    </div>
                </article>

                <article className="summary-card">
                    <div className="summary-card__icon summary-card__icon--quizzes">
                        <Brain size={22} />
                    </div>

                    <div>
                        <span>Upcoming Quizzes</span>
                        <strong>{dashboardQuizzes.length}</strong>
                    </div>
                </article>
            </section>

            <div className="dashboard__grid">
                <div className="dashboard__column">
                    <section className="dashboard__card">
                        <h2>My Courses</h2>

                        {studentCourses.length > 0 ? (
                            studentCourses.map((course) => {
                                const [subject, number] = course.code.split(" ");

                                return (
                                    <Link
                                        to={`/student/course/${course.id}`}
                                        className="course-item"
                                        key={course.id}
                                    >
                                        <div className="course-item__code">
                                            <span>{subject}</span>
                                            <span>{number}</span>
                                        </div>

                                        <div>
                                            <h3>{course.title}</h3>
                                            <p>{course.instructor}</p>
                                        </div>

                                        <span className="course-item__action">
                                            Enter Course
                                            <ChevronRight size={17} />
                                        </span>
                                    </Link>
                                );
                            })
                        ) : (
                            <EmptyState
                                title="No courses enrolled yet"
                                message="Once you enroll in a course, it will appear here"
                                actionText="Browse Courses"
                                actionLink="/student/enroll"
                            />
                        )}
                    </section>

                    <section className="dashboard__card">
                        <h2>To Do</h2>

                        {dashboardToDo.length > 0 ? (
                            dashboardToDo.slice(0, 4).map((workItem) => (
                                <Link
                                    to={
                                        workItem.type === "Assignment"
                                            ? `/student/course/${workItem.courseId}/assignments/${workItem.id}`
                                            : `/student/course/${workItem.courseId}/quizzes/${workItem.id}`
                                    }
                                    className="assignment-item"
                                    key={`${workItem.type}-${workItem.id}`}
                                >
                                    <div>
                                        <h3>{workItem.title}</h3>
                                        <p>
                                            {workItem.courseCode} · {workItem.type}
                                        </p>
                                    </div>

                                    <span className="assignment-item__due">
                                        Due {formatDisplayDate(workItem.dueDate)}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <EmptyState
                                title="Nothing to do"
                                message="You have no upcoming work to complete"
                            />
                        )}
                    </section>
                </div>

                <div className="dashboard__column">
                    <section className="dashboard__card">
                        <h2>Announcements</h2>

                        {dashboardAnnouncements.length > 0 ? (
                            dashboardAnnouncements
                                .slice(0, 4)
                                .map((announcement) => (
                                    <div
                                        className="announcement-item"
                                        key={announcement.id}
                                    >
                                        <span>
                                            {formatDisplayDate(announcement.date)}
                                        </span>
                                        <h3>{announcement.courseCode}</h3>
                                        <p>{announcement.message}</p>
                                    </div>
                                ))
                        ) : (
                            <EmptyState
                                title="No announcements"
                                message="Course announcements will show here after enrollment"
                            />
                        )}
                    </section>

                    <section className="dashboard__card">
                        <h2>Recent Grades</h2>

                        {dashboardGrades.length > 0 ? (
                            dashboardGrades.slice(0, 4).map((grade) => (
                                <div className="grade-item" key={grade.id}>
                                    <div>
                                        <h3>{grade.title}</h3>
                                        <p>{grade.courseCode}</p>
                                    </div>

                                    <strong>{grade.score}</strong>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                title="No grades yet"
                                message="Recent grades will appear here once coursework is graded"
                            />
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

export default StudentDashboard;