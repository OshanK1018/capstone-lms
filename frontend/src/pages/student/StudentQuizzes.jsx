import "./CoursePages.css";
import "./StudentQuizzes.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuizzesForCourse, getQuizAttempts } from "../../../../backend/quizServices.js";

// Temporary frontend data until backend API integration is connected
// import {
//     enrolledCourses,
//     upcomingQuizzes,
// } from "../../data/studentData";

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

// Temporary frontend status check
// Later the backend should return the student's quiz status based on due date and attempt
function getQuizStatus(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (getDate(dueDate) < today) {
        return "Missed";
    }

    return "Upcoming";
}

function StudentQuizzes() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // Loads quizzes posted for this course from the backend.
    const [courseQuizzes, setCourseQuizzes] = useState([]);
    const [quizError, setQuizError] = useState("");
    const [quizzesLoading, setQuizzesLoading] = useState(true);
    const [backendAttempts, setBackendAttempts] = useState([]);

    useEffect(() => {
        async function loadQuizzes() {
            setQuizzesLoading(true);
            setQuizError("");

            const result =
                await getQuizzesForCourse(courseId);

            if (!result.success) {
                setQuizError(
                    result.error || "Unable to load quizzes."
                );
                setQuizzesLoading(false);
                return;
            }

            const normalizedQuizzes = (
                result.data?.quizzes || []
            ).map((quiz) => ({
                id: quiz.quiz_id ?? quiz.id,
                courseId:
                    quiz.course_id ?? Number(courseId),
                courseName: quiz.course_name,
                title: quiz.title,
                dueDate: quiz.due_date?.slice(0, 10),
            }));

            const attemptResults = await Promise.all(
                normalizedQuizzes.map(async (quiz) => {
                    const attemptResult =
                        await getQuizAttempts(quiz.id);

                    if (!attemptResult.success) {
                        return null;
                    }

                    const attempts =
                        attemptResult.data?.attempts || [];

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
                        attemptDate: latestAttempt.attempt_date,
                    };
                })
            );

            setBackendAttempts(attemptResults.filter(Boolean));
            setCourseQuizzes(normalizedQuizzes);
            setQuizzesLoading(false);
        }

        loadQuizzes();
    }, [courseId]);
    // Temporary browser storage
    // Replace this with enrolled course data returned by the backend API
    // const savedCourses = localStorage.getItem("studentCourses");
    // const studentCourses = savedCourses
    //     ? JSON.parse(savedCourses)
    //     : enrolledCourses;

    // Temporary browser storage
    // Later the backend will return the student's quiz attempts
    const savedAttempts = JSON.parse(
        localStorage.getItem(quizAttemptsKey) || "[]"
    );

    // Integration point: fetch and verify the selected course through the backend API
    // const selectedCourse = studentCourses.find(
    //     (course) => String(course.id) === courseId
    // );

    // // Integration point: fetch the available quizzes for this course from the backend API
    // const courseQuizzes = upcomingQuizzes.filter(
    //     (quiz) => quiz.courseId === selectedCourse?.id
    // );

    function getQuizAttempt(quizId) {
        const backendAttempt = backendAttempts.find(
            (attempt) =>
                String(attempt.quizId) === String(quizId) &&
                String(attempt.courseId) === String(courseId)
        );

        const localAttempt = savedAttempts.find(
            (attempt) =>
                String(attempt.quizId) === String(quizId) &&
                String(attempt.courseId) === String(courseId)
        );

        return backendAttempt || localAttempt;
    }

    function getSortStatus(quiz) {
        const attempt = getQuizAttempt(quiz.id);

        if (attempt?.status === "In Progress") {
            return 0;
        }

        if (!attempt && getQuizStatus(quiz.dueDate) === "Upcoming") {
            return 1;
        }

        if (!attempt && getQuizStatus(quiz.dueDate) === "Missed") {
            return 2;
        }

        if (attempt?.status === "Completed") {
            return 3;
        }

        return 1;
    }

    // In progress first, upcoming next, missed next, completed last
    const quizzes = [...courseQuizzes].sort(
        (firstQuiz, secondQuiz) => {
            const firstStatus = getSortStatus(firstQuiz);
            const secondStatus = getSortStatus(secondQuiz);

            if (firstStatus !== secondStatus) {
                return firstStatus - secondStatus;
            }

            return (
                getDate(firstQuiz.dueDate) -
                getDate(secondQuiz.dueDate)
            );
        }
    );

    function handleStartQuiz(quizId) {
        navigate(
            `/student/course/${courseId}/quizzes/${quizId}`
        );
    }

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Quizzes</h1>

                {quizzesLoading ? (
                    <p className="course-page__empty">
                        Loading quizzes...
                    </p>
                ) : quizError ? (
                    <p className="course-page__empty">
                        {quizError}
                    </p>
                ) : quizzes.length > 0 ? (
                    quizzes.map((quiz) => {
                        const attempt = getQuizAttempt(quiz.id);

                        let quizStatus;

                        if (attempt?.status === "Completed") {
                            quizStatus = "Completed";
                        } else if (
                            attempt?.status === "In Progress"
                        ) {
                            quizStatus = "In Progress";
                        } else {
                            quizStatus = getQuizStatus(
                                quiz.dueDate
                            );
                        }

                        return (
                            <div
                                className="quiz-row"
                                key={quiz.id}
                            >
                                <div className="quiz-row__info">
                                    <h2>{quiz.title}</h2>
                                    <p>{quizStatus}</p>
                                </div>

                                <div className="quiz-row__details">
                                    <div>
                                        <span>Due Date</span>

                                        <strong>
                                            {formatDisplayDate(
                                                quiz.dueDate
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                {attempt?.status ===
                                "Completed" ? (
                                    <div className="quiz-row__score">
                                        <span>Score</span>

                                        <strong>
                                            {attempt.percentage != null
                                                ? `${attempt.percentage}%`
                                                : attempt.score != null
                                                ? attempt.score
                                                : "Pending"}
                                        </strong>
                                    </div>
                                ) : quizStatus === "Missed" ? (
                                    <div className="quiz-row__score">
                                        <span>Score</span>
                                        <strong>0%</strong>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="quiz-row__button"
                                        onClick={() =>
                                            handleStartQuiz(
                                                quiz.id
                                            )
                                        }
                                    >
                                        {quizStatus ===
                                        "In Progress"
                                            ? "Continue"
                                            : "Start"}
                                    </button>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="course-page__empty">
                        No quizzes available for this course
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentQuizzes;