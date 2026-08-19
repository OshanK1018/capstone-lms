import "./CoursePages.css";
import "./StudentMaterials.css";
import { useParams } from "react-router-dom";

// Temporary frontend data until backend API integration is connected
import {
    enrolledCourses,
    courseMaterials,
} from "../../data/studentData";

function StudentMaterials() {
    const { courseId } = useParams();

    // Integration point: fetch the student's enrolled course data from the backend API
    const selectedCourse = enrolledCourses.find(
        (course) => String(course.id) === courseId
    );

    // Integration point: fetch materials for the selected course from the backend API
    const materials = courseMaterials.filter(
        (material) => material.courseCode === selectedCourse?.code
    );

    // Placeholder until real course material files are provided by the backend
    function handleViewMaterial(materialTitle) {
        window.alert(
            `${materialTitle} will open when course material files are connected.`
        );
    }

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Course Materials</h1>

                {materials.length > 0 ? (
                    materials.map((material) => (
                        <div className="material-row" key={material.id}>
                            <div>
                                <h2>{material.title}</h2>
                                <p>{material.type}</p>
                            </div>

                            <button
                                type="button"
                                className="material-row__button"
                                onClick={() =>
                                    handleViewMaterial(material.title)
                                }
                            >
                                View
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="course-page__empty">
                        No materials posted for this course.
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentMaterials;