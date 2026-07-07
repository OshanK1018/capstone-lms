const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3000/api"
// messenger functions to encapsulate database accesses in server.js
// below are example functions

export async function createUser(name, email, password, role) {
    try {
        const res = await fetch(`${API_URL}/Users`, 
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({name, email, password, role})
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

export async function enrollStudentInCourse(id, courseID) {
    try {
        const res = await fetch("",
            {
            }
        )
    }
    catch {
        
    }
}
