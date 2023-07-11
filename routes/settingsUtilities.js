var fs = require('fs');
var Promise = require("bluebird");
Promise.promisifyAll(fs); // Promisifying the fs module

var ini = require('ini');
const pool = require('./databaseConnector');
const validator = require('validator');

/**
 * ! This function is deprecated, switch to readIniAsync instead !
 * @param {*} callback 
 */
function readIni(callback) {
    fs.readFile('./settings.ini', 'utf-8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            callback(ini.parse(data));
        }
    })
}

/**
 * Returns the .ini setting file as an Object
 * @returns {Object} Settings file as an Object 
 */
async function readIniAsync() {
    let data = await fs.readFileAsync('./settings.ini', 'utf-8');
    return ini.parse(data);
}

function getPassword(callback) {
    readIni((data) => {
        callback(data.General.masterPassword);
    })
}

function getRegistration(callback) {
    readIni((data) => {
        callback(parseInt(data.General.registrationOpen, 10));
    })
}

function getRegistrationDay(callback) {
    readIni((data) => {
        callback(data.General.registrationDay);
    })
}

/**
 * ! This function is deprecated, switch to getLimitAsync instead !
 * @param {*} callback 
 */
function getLimit(callback) {
    readIni((data) => {
        callback(parseInt(data.Time.limit, 10));
    })
}

/**
 * Returns the limit of commands for a time stamp
 * @returns {int} Limit of commands for a time stamp
 */
async function getLimitAsync() {
    let data = await readIniAsync();
    return parseInt(data.Time.limit, 10);
}

/**
 * ! This function is now deprecated, use getGlobalTimes instead !
 */
function getTimes(callback, onlyAvailable = false, connection = null) {
    conn = (connection) ? connection : pool;
    readIni((data) => {
        if (onlyAvailable) { // If we only want to times where there is still places (command limit not reach)
            getLimit((limit) => {
                conn.query('SELECT COUNT(*) AS count, time FROM spatulasUsers GROUP BY time', (err, rows, fields) => {  // We associate each time stamp with its number of commands
                    for (let i = 0; i < rows.length; i++) {
                        if (rows[i].count >= limit) { // If a commands count is above the limit for a timestamp
                            data.Time.array = data.Time.array.filter(time => time != rows[i].time)
                        }
                    }
                    callback(data.Time.array);
                })
            })
        } else {
            callback(data.Time.array);
        } 
    })
}

/**
 * ! This is a temporary function that will automatically add the "19h00" time stamp in case there is no time stamps to be found in the file
 */
function checkAndRepairTimes() {
    readIni((data) => {
        if (!data.Time.array) { // If there is no time stamps at all
            data.Time.array = ["19h00"];
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

/**
 * This function will return a list containing object, each object containing the time, the number of commands, if it's full and the limit
 * @param {*} connection
 * @returns {[{time: "XXhXX", count: int, limit: int, full: Boolean}]} 
 */
async function getGlobalTimes(connection = null) {
    let conn = (connection) ? connection : await pool.promise().getConnection();
    let result = [];

    // Getting the limit and the data
    let limit = await getLimitAsync();
    let data = await readIniAsync();
    let queryResult = await conn.query("SELECT COUNT(*) as count, time FROM spatulasCommands GROUP BY time");
    let rows = queryResult[0];

    // For each time stamp in the settings file
    for (let i = 0; i < data.Time.array.length; i++) {
        let time = data.Time.array[i];
        let count = 0;
        let full = false;

        // For each time stamp in the database
        for (let j = 0; j < rows.length; j++) {
            if (rows[j].time == time) {
                count = rows[j].count;
                full = (count >= limit);
                break;
            }
        }
        
        result.push({
            time: time,
            count: count,
            limit: limit,
            full: full
        })
    }
    
    // If we are using a connection, we need to release it
    if (!connection) {
        conn.release();
    }

    return result
}

/**
 * This function will return the count of commands for a specific time
 * @param {string} timeValue
 * @param {function} callback
 * @param {*} connection
 */
async function getTimeCount(callback, timeValue, connection = null) {
    let conn = (connection) ? connection : pool.promise().getConnection();
    times = await getGlobalTimes(conn);

    // If we are using a connection, we need to release it
    if (!connection) {
        conn.release();
    }

    for (let i = 0; i < times.length; i++) {
        if (times[i].time == timeValue) {
            callback(times[i].count);
            return;
        }
    }
    callback(0);
}

/** 
 * This function will check if a time stamp is valid (i.e if it's in the list of time stamps)
 * @param {string} value
 * @param {*} connection
 * @returns {boolean}
 */
async function checkTime(value, connection = null) {
    conn = (connection) ? connection : pool.promise().getConnection();

    times = await getGlobalTimes(conn)

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

function getTimeIndex(value, callback, connection = null) {
    getTimes((times) => {
        for (let i = 0; i < times.length; i++) {
            if (value == times[i]) {
                callback(i);
            }
        }
    }, false, connection)
}

function setPassword(password) {
    readIni((data) => {
        data.General.masterPassword = password;
        fs.writeFileSync('./settings.ini', ini.stringify(data));
    })
}

function checkPassword(password, callback) {
    getPassword((realPassword) => {
        callback(password == realPassword);
    })
}

function authenticate(req, res, callback, redirectionURL = '/') {
    if (req.cookies.spatulasPower) {
        getPassword((password) => {
            if (password == req.cookies.spatulasPower) {
                callback();
            } else {
                res.redirect('/');
            }
        })
    } else {
        res.redirect('/');
    }
}

function setRegistration(boolean) {
    readIni((data) => {
        data.General.registrationOpen = parseInt(boolean, 10);
        fs.writeFileSync('./settings.ini', ini.stringify(data));
    })
}

function setRegistrationDay(day) {
    readIni((data) => {
        data.General.registrationDay = day;
        fs.writeFileSync('./settings.ini', ini.stringify(data));
    })
}

function setLimit(newLimit) {
    readIni((data) => {
        newLimit = parseInt(newLimit);
        if (newLimit) {
            data.Time.limit = newLimit;
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

function addTime(timeValue) {
    if (timeValue.length == 5 && timeValue.split('h').length == 2) {
        readIni((data) => {
            // We first check if the array already exists
            if (data.Time.array) {
                if ((data.Time.array.filter(time => time == timeValue)).length == 0) {
                    data.Time.array.push(timeValue);
                    data.Time.array.sort();
                    fs.writeFileSync('./settings.ini', ini.stringify(data));
                }
            } else {
                data.Time.array = [timeValue];
                fs.writeFileSync('./settings.ini', ini.stringify(data));
            }
        })
    }
}

function removeTime(timeValue) {
    readIni((data) => {
        if (data.Time.array && data.Time.array.length > 1) { // ! We don't want to remove the last time because it will crash the server. This is temporary until the system is more robust
            data.Time.array = data.Time.array.filter(time => time != timeValue);
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

// Add a new getter and setter for the new setting "kitchenLimit" that is an integer (and also exports the functions as well please)
function getKitchenLimit(callback) {
    readIni((data) => {
        callback(data.Time.kitchenLimit);
    })
}

function setKitchenLimit(newLimit) {
    readIni((data) => {
        newLimit = parseInt(newLimit);
        if (newLimit) {
            data.Time.kitchenLimit = newLimit;
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

function getLogSizeLimit(callback) {
    readIni((data) => {
        callback(data.Logs.logMaxSize);
    })
}

function setLogSizeLimit(newLimit) {
    readIni((data) => {
        newLimit = parseInt(newLimit);
        if (newLimit) {
            data.Logs.logMaxSize = newLimit;
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

module.exports = {
    readIni,
    getPassword,
    getRegistration,
    getRegistrationDay,
    getLimit,
    getTimes,
    checkAndRepairTimes,
    getGlobalTimes,
    getTimeCount,
    getTimeIndex,
    checkTime,
    setPassword,
    checkPassword,
    setRegistration,
    setRegistrationDay,
    setLimit,
    addTime,
    removeTime,
    authenticate,
    getKitchenLimit,
    setKitchenLimit,
    getLogSizeLimit,
    setLogSizeLimit
}