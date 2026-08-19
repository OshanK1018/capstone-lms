import "./CourseNavbar.css";
import { NavLink, useNavigate, useParams } from "react-router-dom";

// Temporary frontend data until backend API integration is connected
import { enrolledCourses } from "../../data/studentData";

function CourseNavbar() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // Temporary browser storage
    // Replace with the logged in student's enrolled courses from the backend API
    const savedCourses = localStorage.getItem("studentCourses");
    const studentCourses = savedCourses ? JSON.parse(savedCourses) : enrolledCourses;

    const selectedCourse = studentCourses.find(
        (course) => String(course.id) === courseId
    );

    function handleCourseChange(event) {
        navigate(`/student/course/${event.target.value}`);
    }

    if (!selectedCourse) {
        return null;
    }

    return (
        <section className="course-navbar">
            <div className="course-navbar__container">
                <div className="course-navbar__top">
                    <div>
                        <p className="course-navbar__label">{selectedCourse.code}</p>
                        <h1>{selectedCourse.title}</h1>
                    </div>

                    <select
                        value={String(selectedCourse.id)}
                        onChange={handleCourseChange}
                    >
                        {studentCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.code} - {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <nav className="course-navbar__links">
                    <NavLink end to={`/student/course/${courseId}`}>
                        Home
                    </NavLink>

                    <NavLink to={`/student/course/${courseId}/materials`}>
                        Materials
                    </NavLink>

                    <NavLink to={`/student/course/${courseId}/assignments`}>
                        Assignments
                    </NavLink>

                    <NavLink to={`/student/course/${courseId}/quizzes`}>
                        Quizzes
                    </NavLink>

                    <NavLink to={`/student/course/${courseId}/grades`}>
                        Grades
                    </NavLink>
                </nav>
            </div>
        </section>
    );
}

export default CourseNavbar;