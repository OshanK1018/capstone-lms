import "./StudentAssignmentSubmission.css";
import { useState } from "react";
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

function StudentAssignmentSubmission() {
    const { courseId, assignmentId } = useParams();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState(null);

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
    // Later request this assignment from the backend API
    const selectedAssignment = upcomingAssignments.find(
        (assignment) =>
            String(assignment.id) === assignmentId &&
            assignment.courseCode === selectedCourse?.code
    );

    // Temporary browser storage
    // Replace this with assignment submission data from the backend API
    const savedSubmissions = JSON.parse(
        localStorage.getItem(assignmentSubmissionsKey) || "[]"
    );

    const existingSubmission = savedSubmissions.find(
        (submission) =>
            String(submission.assignmentId) === assignmentId &&
            String(submission.courseId) === courseId
    );

    const assignmentOverdue = selectedAssignment
        ? isAssignmentOverdue(selectedAssignment.dueDate)
        : false;

    function returnToAssignments() {
        navigate(`/student/course/${courseId}/assignments`);
    }

    function handleAttachment(attachment) {
        // Temporary mock attachment
        // Later the backend API will provide the real file download
        window.alert(
            `${attachment.fileName} will download when backend file storage is connected.`
        );
    }

    function handleSubmitAssignment(event) {
        event.preventDefault();

        if (assignmentOverdue) {
            window.alert(
                "This assignment is past its due date. Submissions are closed."
            );
            return;
        }

        if (
            existingSubmission &&
            !selectedAssignment.allowResubmission
        ) {
            window.alert(
                "You have already submitted this assignment."
            );
            return;
        }

        if (!selectedFile) {
            window.alert("Please choose a file before submitting.");
            return;
        }

        const assignmentSubmission = {
            assignmentId: selectedAssignment.id,
            courseId: selectedCourse.id,
            fileName: selectedFile.name,
            submittedAt: new Date().toISOString(),
            status: "Submitted",
        };

        const updatedSubmissions = existingSubmission
            ? savedSubmissions.map((submission) =>
                  String(submission.assignmentId) === assignmentId &&
                  String(submission.courseId) === courseId
                      ? assignmentSubmission
                      : submission
              )
            : [...savedSubmissions, assignmentSubmission];

        // Temporary browser persistence
        // Replace this with a POST or PATCH request to the backend API
        localStorage.setItem(
            assignmentSubmissionsKey,
            JSON.stringify(updatedSubmissions)
        );

        // Main backend integration point:
        // Later create or update the assignment submission through the backend API
        window.alert(
            existingSubmission
                ? `${selectedAssignment.title} resubmitted successfully.`
                : `${selectedAssignment.title} submitted successfully.`
        );

        returnToAssignments();
    }

    if (!selectedCourse || !selectedAssignment) {
        return (
            <main className="assignment-page">
                <section className="assignment-page__card">
                    <h1>Assignment Not Available</h1>

                    <button
                        type="button"
                        className="assignment-page__button"
                        onClick={returnToAssignments}
                    >
                        Return to Assignments
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="assignment-page">
            <section className="assignment-page__card">
                <p className="assignment-page__label">
                    ASSIGNMENT
                </p>

                <h1>{selectedAssignment.title}</h1>

                <p className="assignment-page__course">
                    {selectedAssignment.courseCode}
                </p>

                <div className="assignment-page__details">
                    <div>
                        <span>Due Date</span>
                        <strong>
                            {formatDisplayDate(
                                selectedAssignment.dueDate
                            )}
                        </strong>
                    </div>
                </div>

                <div className="assignment-page__section">
                    <h2>Instructions</h2>
                    <p>{selectedAssignment.description}</p>
                </div>

                {selectedAssignment.attachments.length > 0 && (
                    <div className="assignment-page__section">
                        <h2>Attachments</h2>

                        <div className="assignment-page__attachments">
                            {selectedAssignment.attachments.map(
                                (attachment) => (
                                    <button
                                        type="button"
                                        className="assignment-page__attachment"
                                        key={attachment.id}
                                        onClick={() =>
                                            handleAttachment(
                                                attachment
                                            )
                                        }
                                    >
                                        {attachment.fileName}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}

                <div className="assignment-page__submission">
                    <h2>Submission</h2>

                    {existingSubmission && (
                        <div className="assignment-page__submitted-file">
                            <span>Submitted File</span>
                            <strong>
                                {existingSubmission.fileName}
                            </strong>
                        </div>
                    )}

                    {assignmentOverdue ? (
                        <div className="assignment-page__message">
                            <strong>Submission Closed</strong>
                            <p>
                                This assignment is past its due date.
                            </p>
                        </div>
                    ) : existingSubmission &&
                      !selectedAssignment.allowResubmission ? (
                        <div className="assignment-page__message">
                            <strong>Assignment Submitted</strong>
                            <p>
                                Your assignment has been submitted.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitAssignment}>
                            <label htmlFor="assignment-file">
                                {existingSubmission
                                    ? "Choose New File"
                                    : "Assignment File"}
                            </label>

                            <input
                                id="assignment-file"
                                type="file"
                                onChange={(event) =>
                                    setSelectedFile(
                                        event.target.files[0]
                                    )
                                }
                            />

                            {existingSubmission && (
                                <p className="assignment-page__resubmit-note">
                                    You can resubmit this assignment
                                    before the due date.
                                </p>
                            )}

                            <div className="assignment-page__actions">
                                <button
                                    type="button"
                                    className="assignment-page__button assignment-page__button--secondary"
                                    onClick={returnToAssignments}
                                >
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    className="assignment-page__button"
                                >
                                    {existingSubmission
                                        ? "Resubmit Assignment"
                                        : "Submit Assignment"}
                                </button>
                            </div>
                        </form>
                    )}

                    {(assignmentOverdue ||
                        (existingSubmission &&
                            !selectedAssignment.allowResubmission)) && (
                        <div className="assignment-page__actions">
                            <button
                                type="button"
                                className="assignment-page__button assignment-page__button--secondary"
                                onClick={returnToAssignments}
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

export default StudentAssignmentSubmission;