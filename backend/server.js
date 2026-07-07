/* 
    Assumes Sameer is going to be using MySQL, can be changed later if you want - Tori
    Sameer needs to create database env file 
*/

require('dotenv').config();

const express = require('express');
const SQL = require('mysql2/promise');
const cors = require('cors')

const app = express();
app.use(cors());
app.use(express.json());

const connectionPool = SQL.createPool(
    {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'lms',
        waitForConnections: true,
        connectionLimit: 100,
        queueLimit: 0
    }
);

const port = process.env.port || 3000;

app.post('/api/students', 
    async (req, res) => {
        const { name, email, password } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "No name given." });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ error: "No email given." });
        }
        if (!password || !password.trim()) {
            return res.status(400).json({ error: "No password given."})
        }
        
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPswd = password.trim();

        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            return res.status(400).json({ error: "Email is not valid. "});
        }
        if (!cleanPswd.length > 8) {
            return res.status(400).json({ error: "Password is too short. Must be more than 8 characters long."});
        }

        const [alreadyExistingEmail] = await connectionPool.query(
            'SELECT id FROM students WHERE email = ?', [cleanEmail]
        );
        if (alreadyExistingEmail.length > 0) {
            return res.status(409).json({ error: "Email already exists."});
        }

        try { // has to be hashed--will add later
            const [successfulInsertion] = await connectionPool.query(
                'INSERT INTO students (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
                [cleanName, cleanEmail, cleanPswd]
            );
            res.status(201).json({ 
                message: "Student " + cleanName + " created", 
                student: { 
                    id: successfulInsertion.insertId,
                    name: cleanName,
                    email: cleanEmail
                } }); 
        }
        catch(error) { 
            console.error('Database error', error);
            res.status(500).json( { error: "Database error." });
        }
    }
);


app.listen(port, 
    () => {
        console.log("Backend server running at http://localhost:${port}");
    }
);

