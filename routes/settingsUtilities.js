var fs = require('fs');
var ini = require('ini');

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

function getTimes(callback) {
    readIni((data) => {
        data.Time.array.sort();
        callback(data.Time.array);
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
    getTimes,
    setPassword,
    setRegistration,
    setRegistrationDay,
    addTime,
    removeTime
}