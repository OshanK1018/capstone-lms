import "./CoursePages.css";
import "./StudentAssignments.css";
import { useNavigate, useParams } from "react-router-dom";

// Temporary frontend data until backend API integration is connected
import {
    enrolledCourses,
    upcomingAssignments,
} from "../../data/studentData";

const assignmentSubmissionsKey = "assignmentSubmissions";

function getDate(dateText) {
    return new Date(`${dateText}T00:00:00`);
}

function formatDisplayDate(dateText) {
    return getDate(dateText).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });
}

function isAssignmentOverdue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return getDate(dueDate) < today;
}

function sortByDueDate(items) {
    return [...items].sort((firstItem, secondItem) => {
        return getDate(firstItem.dueDate) - getDate(secondItem.dueDate);
    });
}

function StudentAssignments() {
    const { courseId } = useParams();
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

    // Temporary mock assignment data
    // Later request assignments for this course from the backend API
    const assignments = sortByDueDate(
        upcomingAssignments.filter(
            (assignment) => assignment.courseCode === selectedCourse?.code
        )
    );

    // Temporary browser storage
    // Replace this with assignment submission data from the backend API
    const savedSubmissions = JSON.parse(
        localStorage.getItem(assignmentSubmissionsKey) || "[]"
    );

    function getAssignmentStatus(assignment) {
        const submission = savedSubmissions.find(
            (savedSubmission) =>
                String(savedSubmission.assignmentId) ===
                    String(assignment.id) &&
                String(savedSubmission.courseId) === courseId
        );

        if (submission) {
            return "Submitted";
        }

        if (isAssignmentOverdue(assignment.dueDate)) {
            return "Overdue";
        }

        return "Not Submitted";
    }

    function handleOpenAssignment(assignmentId) {
        navigate(`/student/course/${courseId}/assignments/${assignmentId}`);
    }

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Assignments</h1>

                {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <div
                            className="assignment-row"
                            key={assignment.id}
                        >
                            <div className="assignment-row__info">
                                <h2>{assignment.title}</h2>
                            </div>

                            <div className="assignment-row__details">
                                <div>
                                    <span>Due Date</span>
                                    <strong>
                                        {formatDisplayDate(
                                            assignment.dueDate
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Status</span>
                                    <strong>
                                        {getAssignmentStatus(
                                            assignment
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="assignment-row__button"
                                onClick={() =>
                                    handleOpenAssignment(
                                        assignment.id
                                    )
                                }
                            >
                                Open
                            </button>
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