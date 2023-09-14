const pool = require('./databaseConnector');
const validator = require('validator');
let { getCustomLimitStatus, getLimitAsync, getTimeFormat, getTimeStatus } = require('./settingsUtilities');

/**
 * Create the time database
 * @param {Connection} conn The connection to use
 */
async function createTimeDatabase(conn = null) {
    let db = (conn) ? conn : await pool.promise().getConnection();

    await db.query("CREATE TABLE IF NOT EXISTS spatulasTime (id INT PRIMARY KEY NOT NULL AUTO_INCREMENT, time DATETIME UNIQUE NOT NULL, time_limit INTEGER DEFAULT 0, enabled INT(1) DEFAULT 1, time_count INTEGER DEFAULT 0)")

    if (!conn) { // If no connection was supplied, we need to release it
        db.release();
    }
}

/**
 * Clear the time database by dropping then recreating it
 * @param {Connection} conn The connection to use
 */
async function clearTimeDatabase(conn = null) {
    let db = (conn) ? conn : await pool.promise().getConnection();

    await db.query("DROP TABLE IF EXISTS spatulasTime");
    await createTimeDatabase(db);

    if (!conn) { // If no connection was supplied, we need to release it
        db.release();
    }
}

/**
 * This function will return whether timestamps are enabled or not
 * Timestamps are considered not enabled if disabled within the settings, or if there are no timestamps in the database
 * @param {*} connection
 * @returns {boolean} True if timestamps are enabled, false otherwise
 */
async function timeEnabled(connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    if (await getTimeStatus()) {
        let times = await getTimes(db);
        if (times.length > 0) {
            return true;
        }
    }

    // If we are using a connection, we need to release it
    if (!connection) {
        db.release();
    }

    return false;
}

/**
 * This function will return a list containing object, each object containing the time, the number of commands, if it's full and the limit
 * @param {*} connection
 * @returns {[{id: int, time: DATETIME, time_count: int, time_limit: int, full: Boolean, enabled: Boolean}]} 
 */
async function getTimes(connection = null) {
    let conn = (connection) ? connection : await pool.promise().getConnection();
    
    // Getting our time table
    let format = (await getTimeFormat() == "day") ? "%d/%m/%Y %H:%i" : "%H:%i";
    let times = await conn.query("SELECT id, DATE_FORMAT(time,\"" + format + "\") AS time, time_limit, enabled, time_count  FROM spatulasTime")
    times = times[0];

    // Now we are gonna check if each time is full, and in the same time update the limit if it's the global limit that is enabled
    let limit;
    let customLimitEnabled = await getCustomLimitStatus();
    (!customLimitEnabled) ? limit = await getLimitAsync() : limit = null;
    for (let i = 0; i < times.length; i++) {
        // Keeping a backup of the custom limit
        times[i].custom_limit = times[i].time_limit;

        if (times[i].time_count >= times[i].time_limit) {
            times[i].full = true;
        } else {
            times[i].full = false;
        }
        if (!customLimitEnabled) {
            times[i].time_limit = limit;
        }

        
    }
    
    // If we are using a connection, we need to release it
    if (!connection) {
        conn.release();
    }

    return times
}

/**
 * This function will return the count of commands for a specific time
 * @param {int} timeId
 * @param {*} connection
 * @returns {int} The number of commands for the time. -1 if the time is not in the database
 */
async function getTimeCount(timeId, connection = null) {
    let conn = (connection) ? connection : pool.promise().getConnection();
    times = await getTimes(conn);

    // If we are using a connection, we need to release it
    if (!connection) {
        conn.release();
    }

    for (let i = 0; i < times.length; i++) {
        if (times[i].id == timeId) {
            return times[i].time_count;
        }
    }

    return -1;
}

/** 
 * This function will check if a timestamp's value is valid (i.e if it's in the list of time stamps)
 * @param {DATETIME} value
 * @param {*} connection
 * @returns {boolean}
 */
async function checkTimeValue(value, connection = null) {
    conn = (connection) ? connection : pool.promise().getConnection();

    times = await getTimes(conn)

    // If we are using a connection, we need to release it
    if (!connection) {
        conn.release();
    }

    for (let i = 0; i < times.length; i++) {
        if (value == times[i].time) {
            return true;
        }
    }
    return false;
}

/**
 * This function will check if a timestamp's id is valid (i.e if it's in the list of time stamps)
 */
async function checkTimeId(id, connection = null) {
    conn = (connection) ? connection : pool.promise().getConnection();

    id = parseInt(id, 10);
    times = await getTimes(conn)

    // If we are using a connection, we need to release it
    if (!connection) {
        conn.release();
    }

    for (let i = 0; i < times.length; i++) {
        if (id == times[i].id) {
            return true;
        }
    }
    return false;
}

/**
 * This function will return a timestamp's index in the database.
 * It will return null if the timestamp is not in the database
 * @param {DATETIME} value 
 * @param {*} connection 
 */
async function getTimeIndex(value, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let times = await getTimes(db);

    if (!connection) {
        db.release();
    }

    for (let i = 0; i < times.length; i++) {
        if (value == times[i].time) {
            return times[i].id;
        }
    }
    return null
}

/**
 * This function return the timestamps value given its id
 * @param {int} id
 * @param {*} connection
 * @returns {DATETIME} The timestamp's value
 */
async function getTimeValue(id, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let time = await db.execute("SELECT time FROM spatulasTime WHERE id = ?", [id]);
    if (time[0].length) {
        return time[0][0].time;
    } else {
        return null;
    }
}

/**
 * This function will insert a new timestamp in the database
 * The function can accept values in the format hh:mm or dd/mm/yyyy hh:mm.
 * The format parameter is used to find which format is used in input
 * @param {string} value
 * @param {*} connection
 * @returns {boolean} True if the value was inserted, false otherwise
 */
async function insertTime(inputValue, conn = null) {
    let db = (conn) ? conn : await pool.promise().getConnection();

    // We need to check if the value is in the correct format
    let format = await getTimeFormat();
    let value;
    if (format == "day") {
        // We need to check if the value is in the correct format
        value = inputValue.split(" ");
        if (value.length != 2) return false;
        let date = value[0].split("/");
        let time = value[1].split(":");
        if (date.length != 3 || time.length != 2) return false;

        // Now we will convert all values to int
        for (let i = 0; i < date.length; i++) {
            date[i] = parseInt(date[i]);
            if (i < time.length) {
                time[i] = parseInt(time[i]);
            }
        }

        // We need to check if the values are valid
        if (date[0] < 1 || date[0] > 31) return false;
        if (date[1] < 1 || date[1] > 12) return false;
        if (date[2] < 1970) return false;
        if (time[0] < 0 || time[0] > 23) return false;
        if (time[1] < 0 || time[1] > 59) return false;
    } else if (format == "hour") {
        value = inputValue.split(":");
        if (value.length != 2) return false;
        for (let i = 0; i < value.length; i++) {
            value[i] = parseInt(value[i]);
        }
        if (value[0] < 0 || value[0] > 23) return false;
        if (value[1] < 0 || value[1] > 59) return false;
    }

    // We need to check if the value is already in the database
    if (await checkTimeValue(inputValue, db)) return false;

    // We can insert the value in the database
    if (format == "day") {
        await db.query("INSERT INTO spatulasTime (time, time_limit) VALUES (STR_TO_DATE(?,'%d/%m/%Y %H:%i'), ?)", [inputValue, await getLimitAsync()]);
    } else if (format == "hour") {
        await db.query("INSERT INTO spatulasTime (time, time_limit) VALUES (STR_TO_DATE(?,'%H:%i'), ?)", [inputValue, await getLimitAsync()]);
    }
    return true;
}

/**
 * This function will remove a timestamp from the database, given its id
 * @param {int} id
 */
async function removeTime(id, conn = null) {
    let db = (conn) ? conn : pool.promise().getConnection();

    id = parseInt(id, 10);
    await db.query("DELETE FROM spatulasTime WHERE id = ?", [id]);
    return;
}

/**
 * This function will increment the time_count of a timestamp within the database, given its id
 * @param {int} timeId
 * @param {*} connection
 */
async function incrementTimeCount(timeId, conn = null) {
    let db = (conn) ? conn : pool.promise().getConnection();
    await db.query("UPDATE spatulasTime SET time_count = time_count + 1 WHERE id = ?", [timeId]);

    if (!conn) {
        db.release();
    }

    return;
}

/**
 * This function will decrement the time_count of a timestamp within the database, given its id
 * @param {int} timeId
 * @param {*} connection
 */
async function decrementTimeCount(timeId, conn = null) {
    let db = (conn) ? conn : pool.promise().getConnection();
    await db.query("UPDATE spatulasTime SET time_count = time_count - 1 WHERE id = ?", [timeId]);

    (!conn) ? db.release() : null;

    return;
}

/**
 * This function change the enabled status of the given timestamp, given its id
 * @param {int} timeId
 * @param {*} connection
 */
async function toggleTimeEnabled(timeId, conn = null) {
    let db = (conn) ? conn : pool.promise().getConnection();
    await db.query("UPDATE spatulasTime SET enabled = !enabled WHERE id = ?", [timeId]);

    if (!conn) {
        db.release();
    }

    return;
}

/**
 * This function will set the limit of the given timestamp, given its id
 * @param {int} timeId
 * @param {int} limit
 * @param {*} connection
 */
async function setTimeLimit(timeId, limit, conn = null) {
    let db = (conn) ? conn : pool.promise().getConnection();

    await db.query("UPDATE spatulasTime SET time_limit = ? WHERE id = ?", [limit, timeId]);

    if (!conn) {
        db.release();
    }

    return;
}

module.exports = { 
    createTimeDatabase,
    clearTimeDatabase,
    timeEnabled,
    getTimes,
    getTimeCount,
    checkTimeValue,
    checkTimeId,
    getTimeIndex,
    getTimeValue,
    insertTime,
    removeTime,
    incrementTimeCount,
    decrementTimeCount,
    getTimeFormat,
    toggleTimeEnabled,
    setTimeLimit
};