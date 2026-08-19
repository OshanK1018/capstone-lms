import "./CourseNavbar.css";
import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../../../../backend/authServices.js";
import { getCoursesForStudent } from "../../../../backend/courseServices.js";

function CourseNavbar() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [studentCourses, setStudentCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [courseError, setCourseError] = useState("");

    // Loads the logged in student's enrolled courses for navigation
    useEffect(() => {
        async function loadStudentCourses() {
            const userResult = await getCurrentUser();

            if (!userResult.success) {
                setCourseError(
                    userResult.error ||
                    "Unable to load student."
                );
                setCoursesLoading(false);
                return;
            }

            const user = userResult.data?.user;
            const studentId =
                user?.user_id ?? user?.id;

            const coursesResult =
                await getCoursesForStudent(studentId);

            if (!coursesResult.success) {
                setCourseError(
                    coursesResult.error ||
                    "Unable to load courses."
                );
                setCoursesLoading(false);
                return;
            }

            const courses = (
                coursesResult.data?.courses || []
            ).map((course) => ({
                id: course.course_id,
                code: `COURSE ${course.course_id}`,
                title: course.title,
                instructor:
                    course.instructor_name || "Instructor",
            }));

            setStudentCourses(courses);
            setCoursesLoading(false);
        }

        loadStudentCourses();
    }, []);

    const selectedCourse = studentCourses.find(
        (course) => String(course.id) === courseId
    );

    function handleCourseChange(event) {
        navigate(`/student/course/${event.target.value}`);
    }

    if (coursesLoading) {
        return null;
    }

    if (courseError || !selectedCourse) {
        return null;
    }

    return (
        <section className="course-navbar">
            <div className="course-navbar__container">
                <div className="course-navbar__top">
                    <div>
                        <p className="course-navbar__label">
                            {selectedCourse.code}
                        </p>

                        <h1>{selectedCourse.title}</h1>
                    </div>

                    <select
                        value={String(selectedCourse.id)}
                        onChange={handleCourseChange}
                    >
                        {studentCourses.map((course) => (
                            <option
                                key={course.id}
                                value={course.id}
                            >
                                {course.code} - {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <nav className="course-navbar__links">
                    <NavLink
                        end
                        to={`/student/course/${courseId}`}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to={`/student/course/${courseId}/materials`}
                    >
                        Materials
                    </NavLink>

                    <NavLink
                        to={`/student/course/${courseId}/assignments`}
                    >
                        Assignments
                    </NavLink>

                    <NavLink
                        to={`/student/course/${courseId}/quizzes`}
                    >
                        Quizzes
                    </NavLink>

                    <NavLink
                        to={`/student/course/${courseId}/grades`}
                    >
                        Grades
                    </NavLink>
                </nav>
            </div>
        </section>
    );
}

export default CourseNavbar;