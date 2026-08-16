import { getToken } from "./userServices";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function createCourseWithTerm(newCourseName, newCourseSemester, instructorIDForCourse = -1) {
    if (isNaN(instructorIDForCourse)) {
        return {
            success: false,
            error: "Invalid instructor ID has been given, not a number."
        }
    }

    const token = getToken();
    if (!token) {
        return {
            success: false,
            error: "Authentication token not found, instructor or admin has not logged in"
        }
    }

    if (instructorIDForCourse === -1) {
        const currentUserRes = await fetch(`${API_URL}/auth/me`,
            {
                method: 'GET',
                headers: { 
                    'Authorization' : `Bearer ${token}`
                }
            }
        );
        const userData = await currentUserRes.json();
        if (!currentUserRes.ok) {
            return {
                success: false,
                error: userData.error || 'Failed to fetch currently logged in user'
            }
        }

        instructorIDForCourse = userData.user.user_id;
    }

    try {
        const res = await fetch(`${API_URL}/Courses`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authorization' : `Bearer ${token}`
                },
                body: JSON.stringify(
                    { 
                        title: newCourseName, 
                        term: newCourseSemester, 
                        instructorID: instructorIDForCourse 
                    }
                )
            }
        );
        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                error: data.error || 'Failed to create course with Term'
            }
        }
        return data;
    }
    catch (error) {
        console.log("createCourse error", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function createCourseWithDate(newCourseName, startDate, endDate, instructorIDForCourse = -1) {
    if (isNaN(instructorIDForCourse)) {
        return {
            success: false,
            error: "Invalid instructor ID has been given, not a number."
        }
    }

    const token = getToken();
    if (!token) {
        return {
            success: false,
            error: "Authentication token not found, instructor or admin has not logged in"
        }
    }

    if (instructorIDForCourse === -1) {
        const currentUserRes = await fetch(`${API_URL}/auth/me`,
            {
                method: 'GET',
                headers: { 
                    'Authorization' : `Bearer ${token}`
                }
            }
        );
        const userData = await currentUserRes.json();
        if (!currentUserRes.ok) {
            return {
                success: false,
                error: userData.error || 'Failed to fetch currently logged in user'
            }
        }

        instructorIDForCourse = userData.user.user_id;
    }

    try {
        const res = await fetch(`${API_URL}/Courses`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                     'Authorization' : `Bearer ${token}`
                },
                body: JSON.stringify(
                    { 
                        title: newCourseName, 
                        startDate: startDate, 
                        endDate: endDate, 
                        instructorID: instructorIDForCourse 
                    }

                )

            }
        );
        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                error: data.error || 'Failed to create course with exacting date'
            }
        }
        return data;
    }
    catch (error) {
        console.log("createCourse error", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getStudentsInCourse(courseID) {
    if (!courseID || isNaN(courseID)) {
        console.error("None or Invalid course ID given");
        return {
            success: false,
            message: 'None of Invalid course ID given'
        }
    }

    try {
        const res = await fetch(`${API_URL}/courses/students/${courseID}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch list of students for course');
        }

        const data = await res.json();
        return {
            success: true,
            student_list: data.student_list
        }
    }
    catch (error) {
        console.log("getStudentsInCourse error", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}