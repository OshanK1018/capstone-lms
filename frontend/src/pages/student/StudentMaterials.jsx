import "./CoursePages.css";
import "./StudentMaterials.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseById } from "../../../../backend/courseServices.js";

function StudentMaterials() {
    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [materialsLoading, setMaterialsLoading] = useState(true);
    const [materialsError, setMaterialsError] = useState("");

    // Loads the instructor provided course materials link
    useEffect(() => {
        async function loadMaterials() {
            const result = await getCourseById(courseId);

            if (!result.success) {
                setMaterialsError(
                    result.error || "Unable to load course materials."
                );
                setMaterialsLoading(false);
                return;
            }

            setCourse(result.data?.course || null);
            setMaterialsLoading(false);
        }

        loadMaterials();
    }, [courseId]);

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Course Materials</h1>

                {materialsLoading ? (
                    <p className="course-page__empty">
                        Loading course materials...
                    </p>
                ) : materialsError ? (
                    <p className="course-page__empty">
                        {materialsError}
                    </p>
                ) : course?.materials_url ? (
                    <div className="material-row">
                        <div>
                            <h2>{course.title} Materials</h2>
                            <p>Instructor-provided course resources</p>
                        </div>

                        <a
                            className="material-row__button"
                            href={course.materials_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </a>
                    </div>
                ) : (
                    <p className="course-page__empty">
                        No materials posted for this course
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentMaterials;