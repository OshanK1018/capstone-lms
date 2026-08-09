import { getToken } from "./userServices";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3000/api"

export async function getCoursesWithInstructor(instructorID) {
    if (!instructorID || isNaN(instructorID)) {
        console.error("Invalid instructor ID provided");
        return {
            success: false,
            error: "Invalid instructor ID provided"
        };
    }
    
    try {
        const res = await fetch(
            `${API_URL}/courses/instructor/${instructorID}`
        );

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to fetch courses for instructor ${instructorID}`);
        }

        const data = await res.json();
        return {
            success: true,
            courses_count: data.courses_count,
            total_students: data.total_students,
            courses: data.courses
        };
    }
    catch (error) {
        console.error("getCoursesWithInstructor error: ", error.message);
        return null;
    }
}