/** 
*   DOCU: Database configuration using mysql2 with connection pooling
*   Last updated at: March 14, 2024
*   @author Assistant
*/

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test the connection
try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
} catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Exit if we can't connect to database
} 