import "./CourseEnrollment.css";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

// Temporary frontend data until backend API integration is connected
import {
    courseCatalog,
    enrolledCourses,
} from "../../data/studentData";

const studentCoursesKey = "studentCourses";
const catalogCoursesKey = "catalogCourses";

const semesterOptions = [
    "All Semesters",
    "Fall 2026",
    "Winter 2026",
    "Spring 2027",
];

// Temporary browser storage
// Replace these reads with GET requests to the backend API
function getSavedData(key, fallbackData) {
    const savedData = localStorage.getItem(key);

    if (savedData) {
        return JSON.parse(savedData);
    }

    return fallbackData;
}

// Temporary browser persistence
// Replace these writes with POST, PATCH, or DELETE requests to the backend API
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Temporary initialization using mock enrollment data
// Fetch the student's enrolled courses from the backend API
function getInitialStudentCourses() {
    return courseCatalog.filter((catalogCourse) => {
        return enrolledCourses.some(
            (course) => course.id === catalogCourse.id
        );
    });
}

function CourseEnrollment() {
    const [searchTerm, setSearchTerm] = useState("");
    const [semesterFilter, setSemesterFilter] =
        useState("All Semesters");

    const [studentCourses, setStudentCourses] = useState(() =>
        getSavedData(
            studentCoursesKey,
            getInitialStudentCourses()
        )
    );

    const [catalogCourses, setCatalogCourses] = useState(() =>
        getSavedData(
            catalogCoursesKey,
            courseCatalog
        )
    );

    const [selectedAction, setSelectedAction] = useState(null);

    const hasSearchStarted =
        searchTerm.trim().length > 0;

    const totalCredits = studentCourses.reduce(
        (total, course) => total + course.credits,
        0
    );

    const searchResults = useMemo(() => {
        if (!hasSearchStarted) {
            return [];
        }

        const searchValue =
            searchTerm.toLowerCase();

        return catalogCourses.filter((course) => {
            const matchesSearch =
                course.code
                    .toLowerCase()
                    .includes(searchValue) ||
                course.title
                    .toLowerCase()
                    .includes(searchValue) ||
                course.instructor
                    .toLowerCase()
                    .includes(searchValue);

            const matchesSemester =
                semesterFilter === "All Semesters" ||
                course.semester === semesterFilter;

            const alreadyEnrolled =
                studentCourses.some((studentCourse) => {
                    return studentCourse.id === course.id;
                });

            const isClosed =
                course.availability === "Closed";

            return (
                matchesSearch &&
                matchesSemester &&
                !alreadyEnrolled &&
                !isClosed
            );
        });
    }, [
        catalogCourses,
        hasSearchStarted,
        searchTerm,
        semesterFilter,
        studentCourses,
    ]);

    // After a successful enrollment or drop API request, update or refetch the student's courses from the backend
    function updateStudentCourses(updatedCourses) {
        setStudentCourses(updatedCourses);
        saveData(studentCoursesKey, updatedCourses);

        window.dispatchEvent(
            new Event("studentCoursesUpdated")
        );
    }

    // Seat availability should be returned and validated by the backend
    function updateCatalogCourses(updatedCourses) {
        setCatalogCourses(updatedCourses);
        saveData(catalogCoursesKey, updatedCourses);
    }

    function openActionModal(actionType, course) {
        setSelectedAction({
            type: actionType,
            course: course,
        });
    }

    function closeActionModal() {
        setSelectedAction(null);
    }

    // Main backend integration point: call the appropriate enroll or drop API endpoint here
    function confirmAction() {
        const course = selectedAction.course;

        if (selectedAction.type === "enroll") {
            // Temporary frontend enrollment simulation
            // The backend should validate and create the enrollment
            const updatedStudentCourses = [
                ...studentCourses,
                course,
            ];

            // Temporary frontend seat count update
            // The backend should handle this as part of the enrollment transaction
            const updatedCatalogCourses =
                catalogCourses.map((catalogCourse) => {
                    if (catalogCourse.id !== course.id) {
                        return catalogCourse;
                    }

                    const updatedSeatsOpen = Math.max(
                        catalogCourse.seatsOpen - 1,
                        0
                    );

                    return {
                        ...catalogCourse,
                        seatsOpen: updatedSeatsOpen,
                        availability:
                            updatedSeatsOpen === 0
                                ? "Closed"
                                : "Open",
                    };
                });

            updateStudentCourses(updatedStudentCourses);
            updateCatalogCourses(updatedCatalogCourses);
        }

        if (selectedAction.type === "drop") {
            // Temporary frontend drop simulation
            // The backend should remove the enrollment
            const updatedStudentCourses =
                studentCourses.filter((studentCourse) => {
                    return studentCourse.id !== course.id;
                });

            // Temporary frontend seat count update
            // The backend should update availability as part of the drop transaction
            const updatedCatalogCourses =
                catalogCourses.map((catalogCourse) => {
                    if (catalogCourse.id !== course.id) {
                        return catalogCourse;
                    }

                    return {
                        ...catalogCourse,
                        seatsOpen:
                            catalogCourse.seatsOpen + 1,
                        availability: "Open",
                    };
                });

            updateStudentCourses(updatedStudentCourses);
            updateCatalogCourses(updatedCatalogCourses);
        }

        closeActionModal();
    }

    function getActionTitle() {
        if (selectedAction.type === "drop") {
            return "Drop Course";
        }

        return "Enroll";
    }

    function getActionMessage() {
        if (selectedAction.type === "drop") {
            return "Dropping this course will remove it from your current schedule";
        }

        return "Review the course information before adding it to your schedule";
    }

    function getActionButtonText() {
        if (selectedAction.type === "drop") {
            return "Drop";
        }

        return "Enroll";
    }

    return (
        <main className="enrollment">
            <div className="enrollment__container">
                <header className="enrollment__header">
                    <p className="enrollment__label">
                        Course Enrollment
                    </p>

                    <h1>Build your schedule</h1>

                    <p className="enrollment__description">
                        Search for available courses and manage
                        your current schedule
                    </p>
                </header>

                <div className="enrollment__layout">
                    <section className="catalog">
                        <div className="catalog__header">
                            <div>
                                <h2>Find a course</h2>

                                <p>
                                    Browse available classes
                                </p>
                            </div>

                            {hasSearchStarted && (
                                <span className="catalog__count">
                                    {searchResults.length} found
                                </span>
                            )}
                        </div>

                        <div className="catalog__filters">
                            <input
                                type="text"
                                placeholder="Course code, title, or instructor"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />

                            <select
                                value={semesterFilter}
                                onChange={(event) => setSemesterFilter(event.target.value)}
                            >
                                {semesterOptions.map((semester) => (
                                    <option key={semester} value={semester}>
                                        {semester}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="catalog__list">
                            {hasSearchStarted &&
                                searchResults.length === 0 && (
                                    <p className="catalog__no-results">
                                        No courses found
                                    </p>
                                )}

                            {searchResults.map((course) => (
                                <div
                                    className="course-card"
                                    key={course.id}
                                >
                                    <div className="course-card__top">
                                        <span className="course-card__code">
                                            {course.code}
                                        </span>

                                        <span
                                            className={`course-card__status course-card__status--${course.availability.toLowerCase()}`}
                                        >
                                            {course.availability}
                                        </span>
                                    </div>

                                    <h3>
                                        {course.title}
                                    </h3>

                                    <p className="course-card__instructor">
                                        {course.instructor}
                                    </p>

                                    <div className="course-card__details">
                                        <span>
                                            {course.credits} credits
                                        </span>

                                        <span>
                                            {course.semester}
                                        </span>

                                        <span>
                                            {course.seatsOpen} seats open
                                        </span>
                                    </div>

                                    <div className="course-card__bottom">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openActionModal(
                                                    "enroll",
                                                    course
                                                )
                                            }
                                        >
                                            Enroll
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="schedule">
                        <div className="schedule__header">
                            <div>
                                <p>Schedule</p>
                                <h2>Enrolled Courses</h2>
                            </div>

                            <span>
                                {totalCredits} credits
                            </span>
                        </div>

                        <div className="schedule__courses">
                            {studentCourses.length > 0 ? (
                                studentCourses.map((course) => (
                                    <div
                                        className="schedule-course"
                                        key={course.id}
                                    >
                                        <div className="schedule-course__top">
                                            <span>
                                                {course.code}
                                            </span>

                                            <button
                                                type="button"
                                                className="schedule-course__drop"
                                                onClick={() =>
                                                    openActionModal(
                                                        "drop",
                                                        course
                                                    )
                                                }
                                                title="Drop course"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>

                                        <h3>
                                            {course.title}
                                        </h3>

                                        <p>
                                            {course.instructor}
                                        </p>

                                        <div className="schedule-course__details">
                                            <span>
                                                {course.credits} credits
                                            </span>

                                            <span>
                                                {course.semester}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="schedule__empty">
                                    No enrolled courses
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {selectedAction && (
                <div className="enrollment-modal">
                    <section className="enrollment-modal__card">
                        <p className="enrollment-modal__label">
                            {getActionTitle()}
                        </p>

                        <h2>
                            {selectedAction.course.title}
                        </h2>

                        <p className="enrollment-modal__description">
                            {selectedAction.course.code} •{" "}
                            {selectedAction.course.semester}
                        </p>

                        <div className="enrollment-modal__details">
                            <div>
                                <span>Instructor</span>
                                <strong>
                                    {selectedAction.course.instructor}
                                </strong>
                            </div>

                            <div>
                                <span>Credits</span>
                                <strong>
                                    {selectedAction.course.credits}
                                </strong>
                            </div>

                            <div>
                                <span>Seats Open</span>
                                <strong>
                                    {selectedAction.course.seatsOpen}
                                </strong>
                            </div>
                        </div>

                        <p className="enrollment-modal__message">
                            {getActionMessage()}
                        </p>

                        <div className="enrollment-modal__actions">
                            <button
                                type="button"
                                className="enrollment-modal__button enrollment-modal__button--secondary"
                                onClick={closeActionModal}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={`enrollment-modal__button ${
                                    selectedAction.type === "drop"
                                        ? "enrollment-modal__button--drop"
                                        : ""
                                }`}
                                onClick={confirmAction}
                            >
                                {getActionButtonText()}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default CourseEnrollment;