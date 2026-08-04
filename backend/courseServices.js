const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3000/api"


export async function createCourse(newCourseName, newCourseSemester, instructorIDForCourse) {
    if (!instructorIDForCourse || isNaN(instructorIDForCourse)) {
        console.error("None or Invalid instructor ID given")
        return {
            success: false,
            message: "None or Invalid instructor ID given"
        };
    }

    try {
        const res = await fetch(`${API_URL}/Courses`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ newCourseName, newCourseSemester, instructorIDForCourse })
            }
        );
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error);
        }
        return data;
    }
    catch (error) {
        console.log("createCourse error", error.message);
        return null;
    }
}

export async function getStudentsInCourse(courseID) {
    
}