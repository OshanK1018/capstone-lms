require('dotenv').config();

const express = require('express');
const SQL = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const { verify, hash } = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const rehashings = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'mykey'

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

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Invalid token given" });
    }

    jwt.verify(
        token, 
        JWT_SECRET, 
        (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Invalid or expired token" });
            }
            req.user = decoded;
            next();
        }
    ); 
};

// creates new user
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
            const hashedPassword = await bcrypt.hash(password, rehashings);

            const [successfulInsertion] = await connectionPool.query(
                'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, role]
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

app.post('/api/auth/login',
    async (req, res) => {
        let { email, password } = req.body;
        email = email?.trim();
        password = password?.trim();

        if (!email)    { return res.status(400).json({ error: "No email given." }); }
        if (!password) { return res.status(400).json({ error: "No password given." }); }

        try {
            const [isExistingUser] = await connectionPool.query(
                'SELECT user_id, name, password, role FROM Users WHERE email = ?',
                [email]
            );
            if (isExistingUser.length === 0) {
                return res.status(401).json({ error: "Invalid credentials given" });
            }

            const thisUser = isExistingUser[0];

            if (!(await bcrypt.compare(password, thisUser.password))) {
                return res.status(401).json({ error: "Invalid credentials given" });
            }

            const jwtToken = jwt.sign(
                { userID: thisUser.user_id, role: thisUser.role },
                JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json(
                {
                    message: 'Login successful',
                    jwtToken,
                    user: {
                        id: thisUser.user_id,
                        name: thisUser.name,
                        email: thisUser.email,
                        role: thisUser.role
                    }
                }
            );
        }
        catch (error) {
            console.log('Login error', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

app.get('/api/auth/me',
        authenticateToken,
        async (req, res) => {
            try {
                const [users] = await connectionPool.query(
                    'SELECT user_id, name, email, role FROM Users WHERE user_id = ?',
                    [req.user.userID]
                );

                if (users.length === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.json({ users: users[0] })
            }
            catch (error) {
                console.error('Error fetching user:', error);
                res.status(500).json({ error: "Internal server error" });
            }
        }
)

app.post('/api/auth/logout',
    async (req, res) => {
        res.json({ message: 'Logout successful, please delete the JWT token' });
    }
);

app.listen(port,
    () => {
        console.log(`Backend server running at http://localhost:${port}`);
    }
);

