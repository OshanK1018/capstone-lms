import "./CourseDetail.css";
import { Link, useNavigate, useParams } from "react-router-dom";

// Temporary frontend data until backend API integration is connected
import {
    enrolledCourses,
    upcomingAssignments,
    upcomingQuizzes,
    announcements,
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

function sortByNewestDate(items) {
    return [...items].sort((firstItem, secondItem) => {
        return getDate(secondItem.date) - getDate(firstItem.date);
    });
}

function CourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // Temporary browser storage
    // Replace this with the student's enrolled courses from the backend API
    const savedCourses = localStorage.getItem("studentCourses");

    const studentCourses = savedCourses
        ? JSON.parse(savedCourses)
        : enrolledCourses;

    // Temporary browser storage
    // Replace these reads with GET requests to the backend API
    const assignmentSubmissions = JSON.parse(
        localStorage.getItem(assignmentSubmissionsKey) || "[]"
    );

    const quizAttempts = JSON.parse(
        localStorage.getItem(quizAttemptsKey) || "[]"
    );

    // Integration point: fetch the logged in student's enrolled courses from the backend API
    const selectedCourse = studentCourses.find(
        (course) => String(course.id) === courseId
    );

    if (!selectedCourse) {
        return (
            <main className="course-home">
                <section className="course-home__card">
                    <h1>Course Not Found</h1>
                    <p>This course could not be found.</p>
                </section>
            </main>
        );
    }

    // Integration point: these will later be returned by course specific backend API calls
    const courseAssignments = upcomingAssignments.filter(
        (assignment) => assignment.courseCode === selectedCourse.code
    );

    const courseQuizzes = upcomingQuizzes.filter(
        (quiz) => quiz.courseCode === selectedCourse.code
    );

    function getAssignmentSubmission(assignmentId) {
        return assignmentSubmissions.find(
            (submission) =>
                String(submission.assignmentId) ===
                    String(assignmentId) &&
                String(submission.courseId) === courseId
        );
    }

    function getQuizAttempt(quizId) {
        return quizAttempts.find(
            (attempt) =>
                String(attempt.quizId) === String(quizId) &&
                String(attempt.courseId) === courseId
        );
    }

    const allCourseWork = [
        ...courseAssignments.map((assignment) => ({
            ...assignment,
            type: "Assignment",
            completed: Boolean(
                getAssignmentSubmission(assignment.id)
            ),
        })),

        ...courseQuizzes.map((quiz) => {
            const attempt = getQuizAttempt(quiz.id);

            return {
                ...quiz,
                type: "Quiz",
                completed: attempt?.status === "Completed",
                inProgress: attempt?.status === "In Progress",
            };
        }),
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDoWork = sortByDueDate(
        allCourseWork.filter((workItem) => {
            return (
                getDate(workItem.dueDate) >= today &&
                !workItem.completed
            );
        })
    );

    const overdueWork = sortByDueDate(
        allCourseWork.filter((workItem) => {
            return (
                getDate(workItem.dueDate) < today &&
                !workItem.completed
            );
        })
    );

    const courseAnnouncements = sortByNewestDate(
        announcements.filter(
            (announcement) =>
                announcement.courseCode === selectedCourse.code
        )
    );

    function handleOpenWork(workItem) {
        if (workItem.type === "Assignment") {
            navigate(
                `/student/course/${courseId}/assignments/${workItem.id}`
            );
        }

        if (workItem.type === "Quiz") {
            navigate(
                `/student/course/${courseId}/quizzes/${workItem.id}`
            );
        }
    }

    return (
        <main className="course-home">
            <div className="course-home__grid">
                <section className="course-home__card">
                    <h2>Announcements</h2>

                    {courseAnnouncements.length > 0 ? (
                        courseAnnouncements.map((announcement) => (
                            <div
                                className="course-detail-item"
                                key={announcement.id}
                            >
                                <span>
                                    {formatDisplayDate(
                                        announcement.date
                                    )}
                                </span>

                                <h3>{announcement.courseCode}</h3>

                                <p>{announcement.message}</p>
                            </div>
                        ))
                    ) : (
                        <p className="course-home__empty">
                            No announcements posted for this course.
                        </p>
                    )}
                </section>

                <div className="course-home__column">
                    <section className="course-home__card">
                        <h2>To Do</h2>

                        {toDoWork.length > 0 ? (
                            toDoWork.map((workItem) => (
                                <Link
                                    to={
                                        workItem.type === "Assignment"
                                            ? `/student/course/${courseId}/assignments/${workItem.id}`
                                            : `/student/course/${courseId}/quizzes/${workItem.id}`
                                    }
                                    className="course-work-item"
                                    key={`${workItem.type}-${workItem.id}`}
                                >
                                    <div>
                                        <h3>{workItem.title}</h3>
                                        <p>
                                            {workItem.type}
                                            {workItem.inProgress
                                                ? " · In Progress"
                                                : ""}
                                        </p>
                                    </div>

                                    <span>
                                        Due{" "}
                                        {formatDisplayDate(
                                            workItem.dueDate
                                        )}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <p className="course-home__empty">
                                No work to do for this course.
                            </p>
                        )}
                    </section>

                    <section className="course-home__card">
                        <h2>Overdue</h2>

                        {overdueWork.length > 0 ? (
                            overdueWork.map((workItem) => (
                                <div
                                    className="course-work-item"
                                    key={`${workItem.type}-${workItem.id}`}
                                    onClick={() =>
                                        handleOpenWork(workItem)
                                    }
                                >
                                    <div>
                                        <h3>{workItem.title}</h3>
                                        <p>{workItem.type}</p>
                                    </div>

                                    <span className="course-work-item__overdue">
                                        Due{" "}
                                        {formatDisplayDate(
                                            workItem.dueDate
                                        )}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="course-home__empty">
                                No overdue work for this course.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

export default CourseDetail;