const { count } = require('console');
var fs = require('fs');
var ini = require('ini');
const pool = require('./databaseConnector');

function readIni(callback) {
    fs.readFile('./settings.ini', 'utf-8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            callback(ini.parse(data));
        }
    })
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

function getLimit(callback) {
    readIni((data) => {
        callback(parseInt(data.Time.limit, 10));
    })
}

function getTimes(callback, onlyAvailable = false) {
    readIni((data) => {
        if (onlyAvailable) { // If we only want to times where there is still places (command limit not reach)
            pool.getConnection((err, conn) => {
                getLimit((limit) => {
                    conn.query('SELECT COUNT(*) AS count, time FROM spatulasUsers GROUP BY time', (err, rows, fields) => {  // We associate each time stamp with its number of commands
                        pool.releaseConnection(conn);
                        for (let i = 0; i < rows.length; i++) {
                            if (rows[i].count >= limit) { // If a commands count is above the limit for a timestamp
                                data.Time.array = data.Time.array.filter(time => time != rows[i].time)
                            }
                        }
                        data.Time.array.sort();
                        callback(data.Time.array);
                    })
                })   
            })  
        } else {
            data.Time.array.sort();
            callback(data.Time.array);
        } 
    })
}

function setPassword(password) {
    readIni((data) => {
        data.General.masterPassword = password;
        fs.writeFileSync('./settings.ini', ini.stringify(data));
    })
}

function setRegistration(boolean) {
    readIni((data) => {
        data.General.registrationOpen = boolean;
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
        data.Time.limit = newLimit;
        fs.writeFileSync('./settings.ini', ini.stringify(data));
    })
}

function addTime(timeValue) {
    if (timeValue.length == 5 && timeValue.split('h').length == 2) {
        readIni((data) => {
            if ((data.Time.array.filter(time => time == timeValue)).length == 0) {
                data.Time.array.push(timeValue);
                fs.writeFileSync('./settings.ini', ini.stringify(data));
            }
        })
    }
}

function removeTime(timeValue) {
    readIni((data) => {
        data.Time.array = data.Time.array.filter(time => time != timeValue);
        fs.writeFileSync('./settings.ini', ini.stringify(data));
    })
}

module.exports = {
    readIni,
    getPassword,
    getRegistration,
    getRegistrationDay,
    getLimit,
    getTimes,
    setPassword,
    setRegistration,
    setRegistrationDay,
    setLimit,
    addTime,
    removeTime
}