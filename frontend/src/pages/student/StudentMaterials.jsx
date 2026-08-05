import "./CoursePages.css";
import "./StudentMaterials.css";
import { useParams } from "react-router-dom";

import {
    enrolledCourses,
    courseMaterials,
} from "../../data/studentData";

function StudentMaterials() {
    const { courseId } = useParams();

    const selectedCourse = enrolledCourses.find(
        (course) => String(course.id) === courseId
    );

    const materials = courseMaterials.filter(
        (material) => material.courseCode === selectedCourse?.code
    );

    function handleViewMaterial(materialTitle) {
        window.alert(`${materialTitle} will open when course material files are connected.`);
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
                                onClick={() => handleViewMaterial(material.title)}
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