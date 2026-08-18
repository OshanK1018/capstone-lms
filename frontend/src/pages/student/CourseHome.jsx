import "./CourseHome.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAssignmentsForCourse } from "../../../../backend/assignmentServices.js";
import { getQuizzesForCourse } from "../../../../backend/quizServices.js";

// Announcements remain temporary until their backend route is fixed
import {
    enrolledCourses,
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
    return [...items].sort(
        (first, second) =>
            getDate(first.dueDate) - getDate(second.dueDate)
    );
}

function sortByNewestDate(items) {
    return [...items].sort(
        (first, second) =>
            getDate(second.date) - getDate(first.date)
    );
}

function CourseHome() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [courseAssignments, setCourseAssignments] = useState([]);
    const [courseQuizzes, setCourseQuizzes] = useState([]);
    const [workLoading, setWorkLoading] = useState(true);
    const [workError, setWorkError] = useState("");

    useEffect(() => {
        async function loadCourseWork() {
            setWorkLoading(true);
            setWorkError("");

            const [assignmentsResult, quizzesResult] =
                await Promise.all([
                    getAssignmentsForCourse(courseId),
                    getQuizzesForCourse(courseId),
                ]);

            if (
                !assignmentsResult.success ||
                !quizzesResult.success
            ) {
                setWorkError(
                    assignmentsResult.error ||
                    quizzesResult.error ||
                    "Unable to load course work"
                );
                setWorkLoading(false);
                return;
            }

            const assignments = (
                assignmentsResult.data?.assignments || []
            ).map((assignment) => ({
                id:
                    assignment.assignment_id ??
                    assignment.id,
                courseId:
                    assignment.course_id ??
                    Number(courseId),
                title: assignment.title,
                dueDate:
                    assignment.due_date?.slice(0, 10),
                assignmentLink:
                    assignment.assignment_link,
                allowResubmission: Boolean(
                    assignment.allow_resubmission
                ),
            }));

            const quizzes = (
                quizzesResult.data?.quizzes || []
            ).map((quiz) => ({
                id: quiz.quiz_id ?? quiz.id,
                courseId:
                    quiz.course_id ??
                    Number(courseId),
                title: quiz.title,
                dueDate: quiz.due_date?.slice(0, 10),
            }));

            setCourseAssignments(assignments);
            setCourseQuizzes(quizzes);
            setWorkLoading(false);
        }

        loadCourseWork();
    }, [courseId]);

    const savedCourses =
        localStorage.getItem("studentCourses");

    const studentCourses = savedCourses
        ? JSON.parse(savedCourses)
        : enrolledCourses;

    const selectedCourse = studentCourses.find(
        (course) => String(course.id) === courseId
    );

    const assignmentSubmissions = JSON.parse(
        localStorage.getItem(assignmentSubmissionsKey) || "[]"
    );

    const quizAttempts = JSON.parse(
        localStorage.getItem(quizAttemptsKey) || "[]"
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
                completed:
                    attempt?.status === "Completed",
                inProgress:
                    attempt?.status === "In Progress",
            };
        }),
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDoWork = sortByDueDate(
        allCourseWork.filter(
            (workItem) =>
                getDate(workItem.dueDate) >= today &&
                !workItem.completed
        )
    );

    const overdueWork = sortByDueDate(
        allCourseWork.filter(
            (workItem) =>
                getDate(workItem.dueDate) < today &&
                !workItem.completed
        )
    );

    const courseAnnouncements = selectedCourse
        ? sortByNewestDate(
              announcements.filter(
                  (announcement) =>
                      announcement.courseCode ===
                      selectedCourse.code
              )
          )
        : [];

    function handleOpenWork(workItem) {
        const page =
            workItem.type === "Assignment"
                ? "assignments"
                : "quizzes";

        navigate(
            `/student/course/${courseId}/${page}/${workItem.id}`
        );
    }

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

    return (
        <main className="course-home">
            <div className="course-home__grid">
                <section className="course-home__card">
                    <h2>Announcements</h2>

                    {courseAnnouncements.length > 0 ? (
                        courseAnnouncements.map(
                            (announcement) => (
                                <div
                                    className="course-home-item"
                                    key={announcement.id}
                                >
                                    <span>
                                        {formatDisplayDate(
                                            announcement.date
                                        )}
                                    </span>

                                    <h3>
                                        {
                                            announcement.courseCode
                                        }
                                    </h3>

                                    <p>
                                        {announcement.message}
                                    </p>
                                </div>
                            )
                        )
                    ) : (
                        <p className="course-home__empty">
                            No announcements posted for this course
                        </p>
                    )}
                </section>

                <div className="course-home__column">
                    <section className="course-home__card">
                        <h2>To Do</h2>

                        {workLoading ? (
                            <p className="course-home__empty">
                                Loading course work...
                            </p>
                        ) : workError ? (
                            <p className="course-home__empty">
                                {workError}
                            </p>
                        ) : toDoWork.length > 0 ? (
                            toDoWork.map((workItem) => (
                                <Link
                                    to={
                                        workItem.type ===
                                        "Assignment"
                                            ? `/student/course/${courseId}/assignments/${workItem.id}`
                                            : `/student/course/${courseId}/quizzes/${workItem.id}`
                                    }
                                    className="course-work-item"
                                    key={`${workItem.type}-${workItem.id}`}
                                >
                                    <div>
                                        <h3>
                                            {workItem.title}
                                        </h3>

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

                        {workLoading ? (
                            <p className="course-home__empty">
                                Loading course work...
                            </p>
                        ) : workError ? (
                            <p className="course-home__empty">
                                {workError}
                            </p>
                        ) : overdueWork.length > 0 ? (
                            overdueWork.map((workItem) => (
                                <div
                                    className="course-work-item"
                                    key={`${workItem.type}-${workItem.id}`}
                                    onClick={() =>
                                        handleOpenWork(workItem)
                                    }
                                >
                                    <div>
                                        <h3>
                                            {workItem.title}
                                        </h3>
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
                                No overdue work for this course
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

export default CourseHome;