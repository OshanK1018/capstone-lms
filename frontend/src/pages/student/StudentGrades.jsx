import "./CoursePages.css";
import "./StudentGrades.css";
import { useState } from "react";
import { useParams } from "react-router-dom";

// Temporary frontend data until backend API integration is connected
import {
    detailedGrades,
    enrolledCourses,
} from "../../data/studentData";

const gradeFilters = ["All", "Graded", "Pending", "Missing"];

function getDate(dateText) {
    return new Date(`${dateText}T00:00:00`);
}

function formatDisplayDate(dateText) {
    return getDate(dateText).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });
}

function getGradePercent(grade) {
    if (grade.score === null) {
        return null;
    }

    return Math.round((grade.score / grade.pointsPossible) * 100);
}

function StudentGrades() {
    const { courseId } = useParams();
    const [filter, setFilter] = useState("All");

    // Integration point: fetch the student's enrolled course data from the backend API
    const selectedCourse = enrolledCourses.find(
        (course) => String(course.id) === courseId
    );

    // Integration point: fetch grades for the selected course from the backend API
    const grades = detailedGrades.filter(
        (grade) => grade.courseCode === selectedCourse?.code
    );

    const filteredGrades = grades.filter((grade) => {
        if (filter === "All") {
            return true;
        }

        return grade.status === filter;
    });

    return (
        <main className="course-page">
            <section className="course-page__card">
                <div className="course-page__header-row">
                    <h1>Grades</h1>

                    <div className="grade-filters">
                        {gradeFilters.map((gradeFilter) => (
                            <button
                                type="button"
                                className={filter === gradeFilter ? "active" : ""}
                                onClick={() => setFilter(gradeFilter)}
                                key={gradeFilter}
                            >
                                {gradeFilter}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredGrades.length > 0 ? (
                    filteredGrades.map((grade) => {
                        const gradePercent = getGradePercent(grade);

                        return (
                            <div className="grade-row" key={grade.id}>
                                <div>
                                    <h2>{grade.title}</h2>

                                    <p>
                                        {grade.category} • Due{" "}
                                        {formatDisplayDate(grade.dueDate)}
                                    </p>

                                    <p className="grade-row__feedback">
                                        Feedback: {grade.feedback}
                                    </p>
                                </div>

                                <div className="grade-row__details">
                                    <span
                                        className={`grade-row__status grade-row__status--${grade.status.toLowerCase()}`}
                                    >
                                        {grade.status}
                                    </span>

                                    <strong>
                                        {grade.score === null
                                            ? `-- / ${grade.pointsPossible}`
                                            : `${grade.score} / ${grade.pointsPossible}`}
                                    </strong>

                                    <p>
                                        {gradePercent === null
                                            ? "Not graded"
                                            : `${gradePercent}%`}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="course-page__empty">
                        No grade records match this filter.
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentGrades;