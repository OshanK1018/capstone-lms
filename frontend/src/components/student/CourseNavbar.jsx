import "./CourseNavbar.css";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { enrolledCourses } from "../../data/studentData";

function CourseNavbar() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const selectedCourse = enrolledCourses.find(
        (course) => String(course.id) === courseId
    );

    function handleCourseChange(event) {
        navigate(`/student/course/${event.target.value}`);
    }

    return (
        <section className="course-navbar">
            <div className="course-navbar__container">
                <div className="course-navbar__top">
                    <div>
                        <p className="course-navbar__label">{selectedCourse?.code}</p>
                        <h1>{selectedCourse?.title}</h1>
                    </div>

                    <select
                        value={selectedCourse ? String(selectedCourse.id) : ""}
                        onChange={handleCourseChange}
                    >
                        {enrolledCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.code} - {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <nav className="course-navbar__links">
                    <NavLink end to={`/student/course/${courseId}`}>Home</NavLink>
                    <NavLink to={`/student/course/${courseId}/materials`}>Materials</NavLink>
                    <NavLink to={`/student/course/${courseId}/assignments`}>Assignments</NavLink>
                    <NavLink to={`/student/course/${courseId}/quizzes`}>Quizzes</NavLink>
                    <NavLink to={`/student/course/${courseId}/grades`}>Grades</NavLink>
                </nav>
            </div>
        </section>
    );
}

export default CourseNavbar;