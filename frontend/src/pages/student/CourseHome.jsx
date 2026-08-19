import "./CourseHome.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAssignmentsForCourse } from "../../../../backend/assignmentServices.js";
import { getQuizzesForCourse, getQuizAttempts } from "../../../../backend/quizServices.js";
import { getAnnouncementsForCourse } from "../../../../backend/announcementServices.js";
import { getCourseById } from "../../../../backend/courseServices.js";

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

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseAssignments, setCourseAssignments] = useState([]);
    const [courseQuizzes, setCourseQuizzes] = useState([]);
    const [backendQuizAttempts, setBackendQuizAttempts] = useState([]);
    const [workLoading, setWorkLoading] = useState(true);
    const [workError, setWorkError] = useState("");
    const [courseAnnouncements, setCourseAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [announcementError, setAnnouncementError] = useState("");

    useEffect(() => {
        async function loadCourseWork() {
            setWorkLoading(true);
            setWorkError("");

            const [courseResult, assignmentsResult, quizzesResult] = await Promise.all([
                getCourseById(courseId),
                getAssignmentsForCourse(courseId),
                getQuizzesForCourse(courseId),
            ]);

            if (courseResult.success && courseResult.data?.course) {
                const course = courseResult.data.course;

                setSelectedCourse({
                    id: course.course_id,
                    code: `COURSE ${course.course_id}`,
                    title: course.title,
                    instructor:
                        course.instructor_name || "Instructor",
                });
            }

            if (
                !courseResult.success ||
                !assignmentsResult.success ||
                !quizzesResult.success
            ) {
                setWorkError(
                    courseResult.error ||
                    assignmentsResult.error ||
                    quizzesResult.error ||
                    "Unable to load course information"
                );
                setWorkLoading(false);
                return;
            }

            const assignments = (
                assignmentsResult.data?.assignments || []
            ).map((assignment) => ({
                id: assignment.assignment_id ?? assignment.id,
                courseId:
                    assignment.course_id ?? Number(courseId),
                title: assignment.title,
                dueDate: assignment.due_date?.slice(0, 10),
                assignmentLink: assignment.assignment_link,
                allowResubmission: Boolean(
                    assignment.allow_resubmission
                ),
            }));

            const quizzes = (
                quizzesResult.data?.quizzes || []
            ).map((quiz) => ({
                id: quiz.quiz_id ?? quiz.id,
                courseId: quiz.course_id ?? Number(courseId),
                title: quiz.title,
                dueDate: quiz.due_date?.slice(0, 10),
            }));

            const attemptResults = await Promise.all(
                quizzes.map(async (quiz) => {
                    const result = await getQuizAttempts(quiz.id);

                    if (!result.success) {
                        return null;
                    }

                    const attempts = result.data?.attempts || [];

                    if (attempts.length === 0) {
                        return null;
                    }

                    const latestAttempt = [...attempts].sort(
                        (first, second) =>
                            new Date(second.attempt_date) -
                            new Date(first.attempt_date)
                    )[0];

                    return {
                        id: latestAttempt.attempt_id,
                        quizId: quiz.id,
                        courseId: Number(courseId),
                        status: "Completed",
                        score: latestAttempt.score,
                    };
                })
            );

            setBackendQuizAttempts(attemptResults.filter(Boolean));
            setCourseAssignments(assignments);
            setCourseQuizzes(quizzes);
            setWorkLoading(false);
        }

        loadCourseWork();
    }, [courseId]);

    useEffect(() => {
        async function loadAnnouncements() {
            setAnnouncementsLoading(true);
            setAnnouncementError("");

            const result =
                await getAnnouncementsForCourse(courseId);

            if (!result.success) {
                setAnnouncementError(
                    result.error ||
                    "Unable to load announcements."
                );
                setAnnouncementsLoading(false);
                return;
            }

            const normalizedAnnouncements = (
                result.data?.announcements || []
            ).map((announcement) => ({
                id:
                    announcement.announcement_id ??
                    announcement.id,
                title: announcement.title,
                message: announcement.message,
                date:
                    announcement.date_posted?.slice(0, 10),
            }));

            setCourseAnnouncements(
                sortByNewestDate(normalizedAnnouncements)
            );
            setAnnouncementsLoading(false);
        }

        loadAnnouncements();
    }, [courseId]);

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
        const backendAttempt = backendQuizAttempts.find(
            (attempt) =>
                String(attempt.quizId) === String(quizId) &&
                String(attempt.courseId) === courseId
        );

        const localAttempt = quizAttempts.find(
            (attempt) =>
                String(attempt.quizId) === String(quizId) &&
                String(attempt.courseId) === courseId
        );

        return backendAttempt || localAttempt;
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

    function handleOpenWork(workItem) {
        const page =
            workItem.type === "Assignment"
                ? "assignments"
                : "quizzes";

        navigate(
            `/student/course/${courseId}/${page}/${workItem.id}`
        );
    }

    if (workLoading && !selectedCourse) {
        return (
            <main className="course-home">
                <section className="course-home__card">
                    <h1>Loading course...</h1>
                </section>
            </main>
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

                    {announcementsLoading ? (
                        <p className="course-home__empty">
                            Loading announcements...
                        </p>
                    ) : announcementError ? (
                        <p className="course-home__empty">
                            {announcementError}
                        </p>
                    ) : courseAnnouncements.length > 0 ? (
                        courseAnnouncements.map((announcement) => (
                            <div
                                className="course-home-item"
                                key={announcement.id}
                            >
                                <span>
                                    {formatDisplayDate(announcement.date)}
                                </span>

                                <h3>{announcement.title}</h3>

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