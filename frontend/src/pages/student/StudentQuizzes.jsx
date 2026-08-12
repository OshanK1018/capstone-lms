import "./CoursePages.css";
import "./StudentQuizzes.css";
import { useParams } from "react-router-dom";

// Temporary frontend data until backend API integration is connected
import {
    enrolledCourses,
    upcomingQuizzes,
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

function getQuizStatus(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (getDate(dueDate) < today) {
        return "Overdue";
    }

    return "Upcoming";
}

function sortByDueDate(items) {
    return [...items].sort((firstItem, secondItem) => {
        return getDate(firstItem.dueDate) - getDate(secondItem.dueDate);
    });
}

function StudentQuizzes() {
    const { courseId } = useParams();

    // Integration point: fetch the student's enrolled course data from the backend API
    const selectedCourse = enrolledCourses.find(
        (course) => String(course.id) === courseId
    );

    // Integration point: fetch quizzes for the selected course from the backend API
    const quizzes = sortByDueDate(
        upcomingQuizzes.filter(
            (quiz) => quiz.courseCode === selectedCourse?.code
        )
    );

    // Placeholder until the real quiz taking page is connected
    function handleStartQuiz(quizTitle) {
        window.alert(
            `${quizTitle} will open when quiz functionality is connected.`
        );
    }

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Quizzes</h1>

                {quizzes.length > 0 ? (
                    quizzes.map((quiz) => {
                        const quizStatus = getQuizStatus(quiz.dueDate);

                        return (
                            <div className="quiz-row" key={quiz.id}>
                                <div className="quiz-row__info">
                                    <h2>{quiz.title}</h2>
                                    <p>{quizStatus}</p>
                                </div>

                                <div className="quiz-row__details">
                                    <div>
                                        <span>Due Date</span>
                                        <strong>
                                            {formatDisplayDate(quiz.dueDate)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Time Limit</span>
                                        <strong>{quiz.timeLimit}</strong>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="quiz-row__button"
                                    onClick={() => handleStartQuiz(quiz.title)}
                                >
                                    Start
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <p className="course-page__empty">
                        No quizzes available for this course.
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentQuizzes;