import "./CoursePages.css";
import "./StudentGrades.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCurrentUser } from "../../../../backend/authServices.js";
import { getCourseGrade } from "../../../../backend/gradingServices.js";

function StudentGrades() {
    const { courseId } = useParams();

    const [grade, setGrade] = useState(null);
    const [gradeLoading, setGradeLoading] = useState(true);
    const [gradeError, setGradeError] = useState("");

    useEffect(() => {
        async function loadGrade() {
            setGradeLoading(true);
            setGradeError("");

            const userResult = await getCurrentUser();

            if (!userResult.success) {
                setGradeError(
                    userResult.error ||
                    "Unable to load student."
                );
                setGradeLoading(false);
                return;
            }

            const user = userResult.data?.user;
            const studentId =
                user?.user_id ?? user?.id;

            const gradeResult =
                await getCourseGrade(
                    studentId,
                    courseId
                );

            if (!gradeResult.success) {
                if (
                    gradeResult.error
                        ?.toLowerCase()
                        .includes("grade not found")
                ) {
                    setGrade(null);
                } else {
                    setGradeError(
                        gradeResult.error ||
                        "Unable to load grade."
                    );
                }

                setGradeLoading(false);
                return;
            }

            setGrade(gradeResult.data?.grade || null);
            setGradeLoading(false);
        }

        loadGrade();
    }, [courseId]);

    return (
        <main className="course-page">
            <section className="course-page__card">
                <h1>Grades</h1>

                {gradeLoading ? (
                    <p className="course-page__empty">
                        Loading grade...
                    </p>
                ) : gradeError ? (
                    <p className="course-page__empty">
                        {gradeError}
                    </p>
                ) : grade ? (
                    <div className="grade-row">
                        <div>
                            <h2>Overall Course Grade</h2>

                            <p>
                                Grade posted by your instructor
                            </p>
                        </div>

                        <div className="grade-row__details">
                            <span className="grade-row__status grade-row__status--graded">
                                Graded
                            </span>

                            <strong>
                                {grade.score !== null
                                    ? `${grade.score}%`
                                    : "No score"}
                            </strong>

                            <p>
                                Letter Grade:{" "}
                                {grade.letter_grade}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="course-page__empty">
                        No course grade has been posted yet.
                    </p>
                )}
            </section>
        </main>
    );
}

export default StudentGrades;