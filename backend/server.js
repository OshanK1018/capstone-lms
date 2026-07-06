/* 
    Assumes Sameer is going to be using MySQL, can be changed later if you want - Tori
    Sameer needs to create database env file 
*/

require('dotenv').config();

const express = require('express');
const SQL = require('mysql2/promise');

const app = express();

const connectionPool = SQL.createPool(
    {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections = true,
        connectionLimit = 100,
        queueLimit = 0
    }
);

const port = process.env.port || 3000;

