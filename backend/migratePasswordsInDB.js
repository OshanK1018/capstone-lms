const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const connectionPool = mysql.createPool(
    {
        host: 'localhost',
        user: 'testuser',
        password: 'testpass',            
        database: 'capstone_db'
    }
);

async function hashExistingPasswords() {
    const [rows] = await connectionPool.query(
        'SELECT user_id, password FROM Users'
    );
    for (const user of rows) {
        if (user.password.startsWith('$2b$')) {
            continue;
        }

        const newHashedPassword = await bcrypt.hash(user.password, 12);
        await connectionPool.query(
            'UPDATE Users SET password = ? WHERE user_id = ?',
            [newHashedPassword, user.user_id]
        );
        console.log(`Updated user: ${user.user_id}`);
    }
    console.log("Migration completed\n");
    process.exit(0);
}

hashExistingPasswords().catch(console.error);