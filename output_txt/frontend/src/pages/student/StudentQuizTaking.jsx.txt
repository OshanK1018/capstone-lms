import "./StudentQuizTaking.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Clock3,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// Temporary frontend data until backend API integration is connected
import {
    enrolledCourses,
    upcomingQuizzes,
    quizQuestions,
} from "../../data/studentData";

const quizAttemptsKey = "quizAttempts";

function getDate(dateText) {
    return new Date(`${dateText}T00:00:00`);
}

function isQuizMissed(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return getDate(dueDate) < today;
}

function getTimeLimitInSeconds(timeLimit) {
    return timeLimit * 60;
}

function getRemainingTime(expiresAt) {
    const remainingTime = Math.ceil(
        (expiresAt - Date.now()) / 1000
    );

    return Math.max(remainingTime, 0);
}

function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

function StudentQuizTaking() {
    const { courseId, quizId } = useParams();
    const navigate = useNavigate();

    // Temporary browser storage
    // Replace this with enrolled course data returned by the backend API
    const savedCourses = localStorage.getItem("studentCourses");

    const studentCourses = savedCourses
        ? JSON.parse(savedCourses)
        : enrolledCourses;

    // Temporary mock lookup
    // Later the backend will verify that the student has access to this course
    const selectedCourse = studentCourses.find(
        (course) => String(course.id) === courseId
    );

    // Temporary mock lookup
    // Later request the available quiz from the backend API
    const selectedQuiz = upcomingQuizzes.find(
        (quiz) =>
            String(quiz.id) === quizId &&
            quiz.courseId === selectedCourse?.id
    );

    // Temporary mock quiz question data
    // Later these questions will be returned by the backend API
    // The real student API should not return correct answers
    const questions = quizQuestions.filter(
        (question) => question.quizId === selectedQuiz?.id
    );

    // Temporary browser storage
    // Later the backend will return the student's quiz attempt
    const savedAttempts = JSON.parse(
        localStorage.getItem(quizAttemptsKey) || "[]"
    );

    const savedAttempt = savedAttempts.find(
        (attempt) =>
            attempt.quizId === selectedQuiz?.id &&
            attempt.courseId === selectedCourse?.id
    );

    const [quizStarted, setQuizStarted] = useState(
        savedAttempt?.status === "In Progress"
    );

    const [currentQuestionIndex, setCurrentQuestionIndex] =
        useState(0);

    const [answers, setAnswers] = useState(
        savedAttempt?.answers || {}
    );

    const [showSubmitConfirm, setShowSubmitConfirm] =
        useState(false);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

    const [expiresAt, setExpiresAt] = useState(
        savedAttempt?.expiresAt || null
    );

    const [timeRemaining, setTimeRemaining] = useState(() => {
        if (savedAttempt?.expiresAt) {
            return getRemainingTime(
                savedAttempt.expiresAt
            );
        }

        return selectedQuiz
            ? getTimeLimitInSeconds(selectedQuiz.timeLimit)
            : 0;
    });

    // Start the student's quiz attempt after they click Begin Quiz
    useEffect(() => {
        if (
            !quizStarted ||
            !selectedQuiz ||
            !selectedCourse ||
            savedAttempt ||
            questions.length === 0 ||
            isQuizMissed(selectedQuiz.dueDate)
        ) {
            return;
        }

        const newExpiresAt =
            Date.now() +
            getTimeLimitInSeconds(
                selectedQuiz.timeLimit
            ) *
                1000;

        const newAttempt = {
            quizId: selectedQuiz.id,
            courseId: selectedCourse.id,
            status: "In Progress",
            expiresAt: newExpiresAt,
            answers: {},
        };

        const currentAttempts = JSON.parse(
            localStorage.getItem(quizAttemptsKey) || "[]"
        );

        const updatedAttempts = [
            ...currentAttempts,
            newAttempt,
        ];

        // Temporary browser persistence
        // Later the backend will create the student's quiz attempt
        localStorage.setItem(
            quizAttemptsKey,
            JSON.stringify(updatedAttempts)
        );

        setExpiresAt(newExpiresAt);

        setTimeRemaining(
            getTimeLimitInSeconds(selectedQuiz.timeLimit)
        );
    }, [
        quizStarted,
        selectedQuiz,
        selectedCourse,
        savedAttempt,
        questions.length,
    ]);

    // Temporary frontend grading simulation
    // Later remove this because the backend will grade the attempt
    function getMockQuizResult() {
        const score = questions.reduce(
            (total, question) => {
                if (
                    answers[question.id] ===
                    question.correctAnswer
                ) {
                    return total + 1;
                }

                return total;
            },
            0
        );

        return {
            score,
            totalQuestions: questions.length,
            percentage: Math.round(
                (score / questions.length) * 100
            ),
        };
    }

    function saveAnswers(updatedAnswers) {
        const attempts = JSON.parse(
            localStorage.getItem(quizAttemptsKey) || "[]"
        );

        const updatedAttempts = attempts.map(
            (attempt) => {
                if (
                    attempt.quizId === selectedQuiz.id &&
                    attempt.courseId === selectedCourse.id
                ) {
                    return {
                        ...attempt,
                        answers: updatedAnswers,
                    };
                }

                return attempt;
            }
        );

        // Temporary browser persistence
        // Later the backend will save the student's answers
        localStorage.setItem(
            quizAttemptsKey,
            JSON.stringify(updatedAttempts)
        );
    }

    function handleAnswer(choiceId) {
        const updatedAnswers = {
            ...answers,
            [currentQuestion.id]: choiceId,
        };

        setAnswers(updatedAnswers);
        saveAnswers(updatedAnswers);
    }

    function submitQuiz() {
        if (
            isSubmitting ||
            isSubmitted ||
            questions.length === 0
        ) {
            return;
        }

        setIsSubmitting(true);

        const result = getMockQuizResult();

        // Main backend integration point:
        // Later POST the student's quiz attempt to the backend API
        const quizAttempt = {
            courseId,
            quizId,
            answers,
        };

        console.log(
            "Temporary quiz attempt:",
            quizAttempt
        );

        const attempts = JSON.parse(
            localStorage.getItem(quizAttemptsKey) || "[]"
        );

        const updatedAttempts = attempts.map(
            (attempt) => {
                if (
                    attempt.quizId === selectedQuiz.id &&
                    attempt.courseId === selectedCourse.id
                ) {
                    return {
                        ...attempt,
                        status: "Completed",
                        answers,
                        score: result.score,
                        totalQuestions:
                            result.totalQuestions,
                        percentage: result.percentage,
                    };
                }

                return attempt;
            }
        );

        // Temporary browser persistence
        // Later the backend will save the completed quiz attempt
        localStorage.setItem(
            quizAttemptsKey,
            JSON.stringify(updatedAttempts)
        );

        setQuizResult(result);
        setIsSubmitted(true);
        setShowSubmitConfirm(false);
        setIsSubmitting(false);
    }

    // Keep the timer running from the original start time
    useEffect(() => {
        if (
            !expiresAt ||
            isSubmitted ||
            savedAttempt?.status === "Completed"
        ) {
            return;
        }

        const timer = window.setInterval(() => {
            setTimeRemaining(
                getRemainingTime(expiresAt)
            );
        }, 1000);

        return () => window.clearInterval(timer);
    }, [
        expiresAt,
        isSubmitted,
        savedAttempt?.status,
    ]);

    // Automatically submit when time runs out
    useEffect(() => {
        if (
            expiresAt &&
            timeRemaining === 0 &&
            !isSubmitted &&
            savedAttempt?.status !== "Completed"
        ) {
            submitQuiz();
        }
    }, [
        expiresAt,
        timeRemaining,
        isSubmitted,
        savedAttempt?.status,
    ]);

    function goToPreviousQuestion() {
        setCurrentQuestionIndex((index) =>
            Math.max(index - 1, 0)
        );
    }

    function goToNextQuestion() {
        setCurrentQuestionIndex((index) =>
            Math.min(
                index + 1,
                questions.length - 1
            )
        );
    }

    function returnToQuizzes() {
        navigate(`/student/course/${courseId}/quizzes`);
    }

    if (!selectedCourse || !selectedQuiz) {
        return (
            <main className="quiz-taking">
                <div className="quiz-taking__container">
                    <section className="message-card">
                        <h1>Quiz Not Available</h1>

                        <p className="message-card__text">
                            This quiz is not available
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    if (
        isQuizMissed(selectedQuiz.dueDate) &&
        !savedAttempt
    ) {
        return (
            <main className="quiz-taking">
                <div className="quiz-taking__container">
                    <section className="message-card">
                        <h1>Quiz Closed</h1>

                        <p className="message-card__text">
                            This quiz is past its due date and can no
                            longer be started
                        </p>

                        <button
                            type="button"
                            className="result-card__button"
                            onClick={returnToQuizzes}
                        >
                            Return to Quizzes
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    if (
        savedAttempt?.status === "Completed" &&
        !isSubmitted
    ) {
        return (
            <main className="quiz-taking">
                <div className="quiz-taking__container">
                    <section className="message-card">
                        <h1>Quiz Completed</h1>

                        <p className="message-card__text">
                            You have already submitted this quiz
                        </p>

                        <button
                            type="button"
                            className="result-card__button"
                            onClick={returnToQuizzes}
                        >
                            Return to Quizzes
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    if (questions.length === 0) {
        return (
            <main className="quiz-taking">
                <div className="quiz-taking__container">
                    <section className="message-card">
                        <h1>{selectedQuiz.title}</h1>

                        <p className="message-card__text">
                            No questions have been added for this quiz
                            yet
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    if (!quizStarted) {
        return (
            <main className="quiz-taking">
                <div className="quiz-taking__container">
                    <section className="message-card">
                        <h1>{selectedQuiz.title}</h1>

                        <p className="message-card__text">
                            Time Limit: {selectedQuiz.timeLimit} minutes
                        </p>

                        <button
                            type="button"
                            className="result-card__button"
                            onClick={() => setQuizStarted(true)}
                        >
                            Begin Quiz
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    const answeredCount = Object.keys(answers).length;

    const progressPercent =
        ((currentQuestionIndex + 1) /
            questions.length) *
        100;

    if (isSubmitted && quizResult) {
        return (
            <main className="quiz-taking">
                <div className="quiz-taking__container">
                    <section className="result-card">
                        <p className="result-card__label">
                            QUIZ COMPLETE
                        </p>

                        <h1>{selectedQuiz.title}</h1>

                        <div className="result-card__score">
                            <strong>
                                {quizResult.percentage}%
                            </strong>

                            <span>
                                {quizResult.score} of{" "}
                                {quizResult.totalQuestions} correct
                            </span>
                        </div>

                        <button
                            type="button"
                            className="result-card__button"
                            onClick={returnToQuizzes}
                        >
                            Return to Quizzes
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="quiz-taking">
            <div className="quiz-taking__container">
                <div className="quiz-taking__layout">
                    <section className="question-card">
                        <div className="question-card__header">
                            <div>
                                <p className="question-card__label">
                                    QUIZ
                                </p>

                                <h1>{selectedQuiz.title}</h1>

                                <p className="question-card__meta">
                                    Question{" "}
                                    {currentQuestionIndex + 1} of{" "}
                                    {questions.length}
                                    {" • "}
                                    {answeredCount} answered
                                </p>
                            </div>

                            <div
                                className={`quiz-taking__timer ${
                                    timeRemaining <= 300
                                        ? "quiz-taking__timer--warning"
                                        : ""
                                }`}
                            >
                                <Clock3 size={16} />

                                <div>
                                    <span>
                                        Time Remaining
                                    </span>

                                    <strong>
                                        {formatTimer(
                                            timeRemaining
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="question-progress">
                            <div
                                className="question-progress__bar"
                                style={{
                                    width: `${progressPercent}%`,
                                }}
                            />
                        </div>

                        <div className="question-content">
                            <h2>
                                {currentQuestion.question}
                            </h2>

                            <div className="question-content__choices">
                                {currentQuestion.choices.map(
                                    (
                                        choice,
                                        choiceIndex
                                    ) => {
                                        const isSelected =
                                            answers[
                                                currentQuestion.id
                                            ] === choice.id;

                                        return (
                                            <button
                                                type="button"
                                                className={`answer-choice ${
                                                    isSelected
                                                        ? "answer-choice--selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleAnswer(
                                                        choice.id
                                                    )
                                                }
                                                key={choice.id}
                                            >
                                                <span className="answer-choice__letter">
                                                    {String.fromCharCode(
                                                        65 +
                                                            choiceIndex
                                                    )}
                                                </span>

                                                <span>
                                                    {choice.text}
                                                </span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        </div>

                        <div className="question-card__actions">
                            <button
                                type="button"
                                className="question-nav question-nav--secondary"
                                onClick={goToPreviousQuestion}
                                disabled={
                                    currentQuestionIndex === 0
                                }
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            {currentQuestionIndex <
                            questions.length - 1 ? (
                                <button
                                    type="button"
                                    className="question-nav"
                                    onClick={goToNextQuestion}
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="question-nav"
                                    onClick={() =>
                                        setShowSubmitConfirm(
                                            true
                                        )
                                    }
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </section>

                    <aside className="question-sidebar">
                        <div className="question-sidebar__header">
                            <p>Progress</p>
                            <h2>Questions</h2>
                        </div>

                        <div className="question-sidebar__numbers">
                            {questions.map(
                                (question, index) => {
                                    const isAnswered =
                                        answers[
                                            question.id
                                        ] !== undefined;

                                    const isCurrent =
                                        index ===
                                        currentQuestionIndex;

                                    return (
                                        <button
                                            type="button"
                                            className={`question-number ${
                                                isCurrent
                                                    ? "question-number--current"
                                                    : ""
                                            } ${
                                                isAnswered
                                                    ? "question-number--answered"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setCurrentQuestionIndex(
                                                    index
                                                )
                                            }
                                            key={question.id}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <div className="question-sidebar__status">
                            <div>
                                <span className="question-status-dot question-status-dot--answered" />
                                Answered
                            </div>

                            <div>
                                <span className="question-status-dot" />
                                Not answered
                            </div>
                        </div>

                        <button
                            type="button"
                            className="question-sidebar__submit"
                            onClick={() =>
                                setShowSubmitConfirm(true)
                            }
                        >
                            Submit Quiz
                        </button>
                    </aside>
                </div>
            </div>

            {showSubmitConfirm && (
                <div className="submit-modal">
                    <section className="submit-modal__card">
                        <p className="submit-modal__label">
                            SUBMIT QUIZ
                        </p>

                        <h2>Ready to submit?</h2>

                        <p className="submit-modal__text">
                            You answered {answeredCount} of{" "}
                            {questions.length} questions.
                        </p>

                        {answeredCount <
                            questions.length && (
                            <p className="submit-modal__warning">
                                You still have{" "}
                                {questions.length -
                                    answeredCount}{" "}
                                unanswered question
                                {questions.length -
                                    answeredCount ===
                                1
                                    ? ""
                                    : "s"}
                                .
                            </p>
                        )}

                        <div className="submit-modal__actions">
                            <button
                                type="button"
                                className="submit-modal__button submit-modal__button--secondary"
                                onClick={() =>
                                    setShowSubmitConfirm(
                                        false
                                    )
                                }
                                disabled={isSubmitting}
                            >
                                Keep Working
                            </button>

                            <button
                                type="button"
                                className="submit-modal__button"
                                onClick={submitQuiz}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : "Submit Quiz"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default StudentQuizTaking;