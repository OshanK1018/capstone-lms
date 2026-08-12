import "./CoursePages.css";
import "./StudentAssignments.css";
import { useParams } from "react-router-dom";

// Temporary frontend data until course API/database integration is connected
import {
    enrolledCourses,
    upcomingAssignments,
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

function sortByDueDate(items) {
    return [...items].sort((firstItem, secondItem) => {
        return getDate(firstItem.dueDate) - getDate(secondItem.dueDate);
    });
}

function StudentAssignments() {
    const { courseId } = useParams();

    // Integration point: the backend should return assignments for the selected course
    const selectedCourse = enrolledCourses.find(
        (course) => String(course.id) === courseId
    );

    const assignments = sortByDueDate(
        upcomingAssignments.filter(
            (assignment) => assignment.courseCode === selectedCourse?.code
        )
    );

    // Placeholder until assignment detail pages are connected
    function handleViewAssignment(assignmentTitle) {
        window.alert(`${assignmentTitle} details will open when assignment pages are connected.`);
    }
    // Placeholder until real file upload/submission functionality is connected
    function handleSubmitAssignment(assignmentTitle) {
        window.alert(`${assignmentTitle} submission will open when upload functionality is connected.`);
    }

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Assignments</h1>

                {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <div className="assignment-row" key={assignment.id}>
                            <div>
                                <h2>{assignment.title}</h2>
                                <p>Due {formatDisplayDate(assignment.dueDate)}</p>
                            </div>

                            <div className="assignment-row__actions">
                                <button
                                    type="button"
                                    className="assignment-row__button assignment-row__button--secondary"
                                    onClick={() => handleViewAssignment(assignment.title)}
                                >
                                    View
                                </button>

                                <button
                                    type="button"
                                    className="assignment-row__button"
                                    onClick={() => handleSubmitAssignment(assignment.title)}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="course-page__empty">
                        No assignments posted for this course.
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentAssignments;