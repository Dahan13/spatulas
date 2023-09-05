const pool = require('./databaseConnector');
const validator = require('validator');
let { clearTimeDatabase, createTimeDatabase } = require('./timeUtilities');
let { getTablesInfos } = require('./databaseTablesUtilities');

/**
 * This function will create all tables for the website to properly function, only if they are not already created.
 */
async function createDatabase(conn = null) {
    db = (conn) ? conn : await pool.promise().getConnection();

    await createTimeDatabase(db); // Creating the time table

    // Creating the table that will contains all commands
    await db.query("CREATE TABLE IF NOT EXISTS spatulasCommands (commandId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255) NOT NULL, firstName VARCHAR(255) NOT NULL, unformated_time DATETIME, time VARCHAR(20), preparation INT(1) DEFAULT 0, ready INT(1) DEFAULT 0, delivered INT(1) DEFAULT 0, price FLOAT DEFAULT 0.0, lastUpdated TIMESTAMP DEFAULT NOW(), sessionKey VARCHAR(255))")

    // Creating the table that will contains all the names of each food table
    await db.query("CREATE TABLE IF NOT EXISTS spatulasTables (tableId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, foodName VARCHAR(255) NOT NULL)");

    // Release connection if it was not passed as a parameter
    if (!conn) {
        db.release();
    }
    return;
}

/**
 * Retrieves from an HTTP request the values of all fields of tables stored in spatulasTables. The values will be automatically sanitized
 * @param {Any} body
 * @returns {Array} Array is in the same order as the table names in spatulasTables 
 */
async function getValuesFromRequest(body, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let values = [];
    let tables = await getTablesInfos(db);
    for (let i = 0; i < tables.length; i++) {
        if (!(tables[i].empty)) {
            let value = body[tables[i].foodName];
            value = validator.escape(value);
            values.push(value);
        }
    }
    return values;
}

/**
 * Destroy the database and recreate it
 * @param {*} connection 
 * @returns 
 */
async function purgeDatabase(connection = null) {
    let conn = (connection) ? connection : await pool.promise().getConnection();

    await conn.query('DROP TABLE IF EXISTS spatulasCommands');

    // Getting table names
    let tables = await getTablesInfos(conn);
    for (let i = 0; i < tables.length; i++) {
        await conn.query('DROP TABLE IF EXISTS `' + tables[i].foodName + '`');
    }

    await conn.query('DROP TABLE IF EXISTS spatulasTables');

    await clearTimeDatabase(conn);
    await createDatabase(conn);
    conn.release();

    return;
}

module.exports = {
    createDatabase,
    getValuesFromRequest,
    purgeDatabase,
}