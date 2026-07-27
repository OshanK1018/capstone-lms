import "./StudentDashboard.css";
import { Link } from "react-router-dom";

import {
    BookMarked,
    SquarePen,
    Brain,
    ChevronRight
} from "lucide-react";

// Temporary sample data until backend integration is available
import {
    studentProfile,
    enrolledCourses,
    upcomingAssignments,
    upcomingQuizzes,
    announcements,
    recentGrades,
} from "../../data/studentData";

function StudentDashboard() {
    return (
        <main className="dashboard">
            <section className="dashboard__header">
                <div>
                    <p className="dashboard__label">Student Portal</p>
                    <h1 className="dashboard__title">
                        Welcome back, {studentProfile.name}
                    </h1>
                    <p className="dashboard__description">
                        ID: {studentProfile.studentId}
                    </p>
                </div>

                <div className="dashboard__term">
                    <span>Term:</span>
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
                        <strong>{enrolledCourses.length}</strong>
                    </div>
                </article>

                <article className="summary-card">
                    <div className="summary-card__icon summary-card__icon--assignments">
                        <SquarePen size={22} />
                    </div>

                    <div>
                        <span>Assignments</span>
                        <strong>{upcomingAssignments.length}</strong>
                    </div>
                </article>

                <article className="summary-card">
                    <div className="summary-card__icon summary-card__icon--quizzes">
                        <Brain size={22} />
                    </div>

                    <div>
                        <span>Upcoming Quizzes</span>
                        <strong>{upcomingQuizzes.length}</strong>
                    </div>
                </article>
            </section>

            <div className="dashboard__grid">
                <div className="dashboard__column">
                    <section className="dashboard__card">
                        <h2>My Courses</h2>

                        {enrolledCourses.map((course) => {
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
                                        <ChevronRight size={20} />
                                    </span>
                                </Link>
                            );
                        })}
                    </section>

                    <section className="dashboard__card">
                        <h2>Upcoming Assignments</h2>

                        {upcomingAssignments.slice(0, 4).map((assignment) => (
                            <div className="assignment-item" key={assignment.id}>
                                <div>
                                    <h3>{assignment.title}</h3>
                                    <p>{assignment.courseCode}</p>
                                </div>

                                <span className="assignment-item__due">
                                    Due {assignment.dueDate}
                                </span>
                            </div>
                        ))}
                    </section>
                </div>

                <div className="dashboard__column">
                    <section className="dashboard__card">
                        <h2>Announcements</h2>

                        {announcements.slice(0, 4).map((announcement) => (
                            <div className="announcement-item" key={announcement.id}>
                                <span>{announcement.date}</span>
                                <h3>{announcement.courseCode}</h3>
                                <p>{announcement.message}</p>
                            </div>
                        ))}
                    </section>

                    <section className="dashboard__card">
                        <h2>Recent Grades</h2>

                        {recentGrades.slice(0, 4).map((grade) => (
                            <div className="grade-item" key={grade.id}>
                                <div>
                                    <h3>{grade.title}</h3>
                                    <p>{grade.courseCode}</p>
                                </div>

                                <strong>{grade.score}</strong>
                            </div>
                        ))}
                    </section>
                </div>
            </div>
        </main>
    );
}

export default StudentDashboard;