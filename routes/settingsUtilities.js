var fs = require('fs');
var Promise = require("bluebird");
Promise.promisifyAll(fs); // Promisifying the fs module

var ini = require('ini');

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
        callback(parseInt(data.Limits.generalLimit, 10));
    })
}

/**
 * Returns the limit of commands for a time stamp
 * @returns {int} Limit of commands for a time stamp
 */
async function getLimitAsync() {
    let data = await readIniAsync();
    return parseInt(data.Limits.generalLimit, 10);
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

/**
 * Given a HTTP request, and its response, the function will execute the callback function if the user is properly authenticated.
 * If the user is not authenticated, it will redirect him to the redirectionURL
 * @param {*} req 
 * @param {*} res 
 * @param {*} callback 
 * @param {*} redirectionURL 
 */
function authenticate(req, res, callback, redirectionURL = '/') {
    if (req.cookies.spatulasPower) {
        getPassword((password) => {
            if (password == req.cookies.spatulasPower) {
                callback();
            } else {
                res.redirect(redirectionURL);
            }
        })
    } else {
        res.redirect(redirectionURL);
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
            data.Limits.generalLimit = newLimit;
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

// Add a new getter and setter for the new setting "kitchenLimit" that is an integer (and also exports the functions as well please)
function getKitchenLimit(callback) {
    readIni((data) => {
        callback(data.Limits.kitchenLimit);
    })
}

function setKitchenLimit(newLimit) {
    readIni((data) => {
        newLimit = parseInt(newLimit);
        if (newLimit) {
            data.Limits.kitchenLimit = newLimit;
            fs.writeFileSync('./settings.ini', ini.stringify(data));
        }
    })
}

/**
 * This function will indicate whether time is enabled or not on the website
 * @returns {boolean} True if time is enabled, false otherwise
 */
async function getTimeStatus() {
    let data = await readIniAsync();
    return (data.Time.toggled == "1") ? true : false;
}

/**
 * This function will toggle timestamps use globally on the website
 */
async function toggleTime() {
    let data = await readIniAsync();
    data.Time.toggled = (await getTimeStatus()) ? "0" : "1";
    fs.writeFileSync('./settings.ini', ini.stringify(data));
    return;
}

/**
 * This function will indicate whether time custom limits are enabled or not on the website
 * @returns {boolean} True if custom limits are enabled, false otherwise
 */
async function getCustomLimitStatus() {
    let data = await readIniAsync();
    return (data.Time.customLimits == "1") ? true : false;
}

/**
 * This function will toggle custom limits use globally on the website
*/
async function toggleCustomLimit() {
    let data = await readIniAsync();
    data.Time.customLimits = (await getCustomLimitStatus()) ? "0" : "1";
    fs.writeFileSync('./settings.ini', ini.stringify(data));
    return;
}

/**
 * This function return the current format of the website timestamps
 * @returns {string} The current format of the website timestamps : "day" or "hour"
 */
async function getTimeFormat() {
    let data = await readIniAsync();
    return data.Time.format;
}

/**
 * This function will set the format of the website timestamps
 */
async function toggleTimeFormat() {
    let format = await getTimeFormat();

    let data = await readIniAsync();
    data.Time.format = (format == "day") ? "hour" : "day";
    fs.writeFileSync('./settings.ini', ini.stringify(data));
    return;
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
    getLimitAsync,
    setPassword,
    checkPassword,
    setRegistration,
    setRegistrationDay,
    setLimit,
    authenticate,
    getTimeStatus,
    toggleTime,
    getCustomLimitStatus,
    toggleCustomLimit,
    getKitchenLimit,
    setKitchenLimit,
    getTimeFormat,
    toggleTimeFormat,
    getLogSizeLimit,
    setLogSizeLimit
}