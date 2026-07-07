const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3000/api"
// messenger functions to encapsulate database accesses in server.js
// below are example functions

export async function createStudent(name, email, password) {
    try {
        const res = await fetch("${API_URL}/students", 
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({name, email, password})
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }
            
            return data;
    }   
    catch {
        console.error("Error adding student");
        return null;
    }
}

export async function getAssignmentForStudent(assignmentID) {

}