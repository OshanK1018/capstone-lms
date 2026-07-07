require('dotenv').config();

const fs = require('fs').promises;
const express = require('express');
const SQL = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const connectionPool = SQL.createPool(
    {
        host: 'localhost',
        user: 'testuser',
        password: 'testpass',            
        database: 'capstone_db', 
        waitForConnections: true,
        connectionLimit: 100,
        queueLimit: 0,
        multipleStatements: true
    }
);
const port = process.env.port || 3000;

// creates student
app.post('/api/Users',
    async (req, res) => {
        let { name, email, password, role } = req.body;
        for (value in req.body) {
            value = value.trim();
        }

        if (!name)     { return res.status(400).json({ error: "No name given." }); }
        if (!email)    { return res.status(400).json({ error: "No email given." }); }
        if (!password) { return res.status(400).json({ error: "No password given." }); }
        if (!role)     { return res.status(400).json({ error: "No role given. "}); }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ error: "Email is not valid. " });
        }
        if (!password.length > 8) {
            return res.status(400).json({ error: "Password is too short. Must be more than 8 characters long." });
        }


        const [alreadyExistingEmail] = await connectionPool.query(
            'SELECT user_id FROM Users WHERE email = ?', [email]
        );
        if (alreadyExistingEmail.length > 0) {
            return res.status(409).json({ error: "Email already exists." });
        }

        try { // has to be hashed--will add later
            const [successfulInsertion] = await connectionPool.query(
                'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, password, role]
            );
            res.status(201).json({
                message: "Student " + name + " created",
                student: {
                    id: successfulInsertion.insertId,
                    name: name,
                    email: email,
                    role: role
                },
            });
        }
        catch (error) {
            console.error('Database error', error);
            res.status(500).json({ error: "Database error." });
        }
    }
);

app.listen(port,
    () => {
        console.log(`Backend server running at http://localhost:${port}`);
    }
);

