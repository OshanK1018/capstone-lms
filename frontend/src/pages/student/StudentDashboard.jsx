import "./StudentDashboard.css";
import { Link } from "react-router-dom";
import { BookMarked, SquarePen, Brain, ChevronRight } from "lucide-react";

// Temporary frontend data until backend API integration is connected
import {
    studentProfile,
    enrolledCourses,
    upcomingAssignments,
    upcomingQuizzes,
    announcements,
    recentGrades,
} from "../../data/studentData";

function getDate(dateText) {
    return new Date(`${dateText}T00:00:00`);
}

function formatDisplayDate(dateText) {
    return getDate(dateText).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
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

function StudentDashboard() {
    // Temporary browser storage
    // Replace with the logged in student's enrolled courses from the backend API
    const savedCourses = localStorage.getItem("studentCourses");
    const studentCourses = savedCourses
        ? JSON.parse(savedCourses)
        : enrolledCourses;

    // Integration point: dashboard data will later be fetched from the backend API for the logged in student's enrolled courses
    const studentCourseCodes = studentCourses.map((course) => course.code);

    const dashboardAssignments = upcomingAssignments.filter((assignment) =>
        studentCourseCodes.includes(assignment.courseCode)
    );

    const dashboardQuizzes = upcomingQuizzes.filter((quiz) =>
        studentCourseCodes.includes(quiz.courseCode)
    );

    const dashboardAnnouncements = announcements.filter((announcement) =>
        studentCourseCodes.includes(announcement.courseCode)
    );

    const dashboardGrades = recentGrades.filter((grade) =>
        studentCourseCodes.includes(grade.courseCode)
    );

    return (
        <main className="dashboard">
            <section className="dashboard__header">
                <div>
                    <p className="dashboard__label">STUDENT PORTAL</p>

                    <h1 className="dashboard__title">
                        Welcome back, {studentProfile.name}
                    </h1>
                    
                    <p className="dashboard__description">
                        ID: {studentProfile.studentId}
                    </p>
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
                        <h2>Upcoming Assignments</h2>

                        {dashboardAssignments.length > 0 ? (
                            dashboardAssignments
                                .slice(0, 4)
                                .map((assignment) => (
                                    <div
                                        className="assignment-item"
                                        key={assignment.id}
                                    >
                                        <div>
                                            <h3>{assignment.title}</h3>
                                            <p>{assignment.courseCode}</p>
                                        </div>

                                        <span className="assignment-item__due">
                                            Due {formatDisplayDate(assignment.dueDate)}
                                        </span>
                                    </div>
                                ))
                        ) : (
                            <EmptyState
                                title="No upcoming assignments"
                                message="Assignments will appear here after you enroll in a course"
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
                            dashboardGrades
                                .slice(0, 4)
                                .map((grade) => (
                                    <div
                                        className="grade-item"
                                        key={grade.id}
                                    >
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