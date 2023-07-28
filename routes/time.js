var express = require('express');
var fs = require('fs');
var stringify = require('csv-stringify');
const validator = require('validator');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector')
let { clearUsers, purgeDatabase, getUsersByStatus, getTablesCount, createCommandFoodString, getCommands, getTablesInfos, insertTable, getTable, deleteElement, deleteTable, insertRow, getTableInfos, getTables, updateCommandsTime } = require("./databaseUtilities.js");
let { getRegistration, getRegistrationDay, getLimit, setRegistration, setRegistrationDay, setLimit, checkPassword, authenticate, setPassword, getKitchenLimit, setKitchenLimit, getCustomLimitStatus, getTimeFormat, toggleTime, toggleCustomLimit, toggleTimeFormat } = require('./settingsUtilities');
let { createTimeDatabase, getTimes, timeEnabled, insertTime, checkTimeId, removeTime } = require('./timeUtilities');

router.get('/', function(req, res, next) {
    authenticate(req, res, async () => {
        let conn = await pool.promise().getConnection();
        let times = await getTimes(conn);
        let timeEnabledBool = await timeEnabled(conn);
        let customLimitsEnabled = await getCustomLimitStatus();
        let dateFormatDay = (await getTimeFormat() == "day") ? true : false;
        conn.release();

        res.render('time', { title: 'Time manager', admin: true, time: times, timesBoolean: (times.length) ? true : false, timeEnabledBool: timeEnabledBool, customLimitsEnabled: customLimitsEnabled, dateFormatDay: dateFormatDay, error: req.query.error });
    }, "/spadmin")
})

router.post('/addTime', (req, res, next) => {
    authenticate(req, res, async () => {
        let conn = await pool.promise().getConnection();
        let dateFormat = await getTimeFormat();
        // Retreiving the time depending on the format
        let insertResult;
        if (dateFormat == "day") {
            let time = validator.escape(req.body.time);
            let date = validator.escape(req.body.date);

            // Formatting the date to fit the database
            let dateArray = date.split("-");
            if (dateArray.length != 3) return false;
            date = dateArray[2] + "/" + dateArray[1] + "/" + dateArray[0];

            let finalTime = date + " " + time;

            insertResult = await insertTime(finalTime, conn);
        } else if (dateFormat == "hour") {
            let time = validator.escape(req.body.time);
            insertResult = await insertTime(time, conn);
        }

        conn.release();
        if (insertResult) {
            res.redirect("/spadmin/time");
        } else {
            res.redirect("/spadmin/time?error=1");
        }
    }, "/spadmin")
})

router.get('/toggleTime', (req, res, next) => {
    authenticate(req, res, async () => {
        let conn = await pool.promise().getConnection();
        await toggleTime(conn);
        conn.release(); 
        res.redirect("/spadmin/time");
    }, "/spadmin")
})

router.get('/toggleCustomLimits', (req, res, next) => {
    authenticate(req, res, async () => {
        let conn = await pool.promise().getConnection();
        await toggleCustomLimit(conn);
        conn.release();
        res.redirect("/spadmin/time");
    }, "/spadmin")
})

router.get('/toggleDateFormat', (req, res, next) => {
    authenticate(req, res, async () => {
        let conn = await pool.promise().getConnection();
        await toggleTimeFormat(conn);
        await updateCommandsTime(conn);
        conn.release();
        res.redirect("/spadmin/time");
    }, "/spadmin")
})

router.get('/delete/:id', (req, res, next) => {
    authenticate(req, res, async () => {
        let conn = await pool.promise().getConnection();

        let id = validator.escape(req.params.id);
        if (await checkTimeId(id, conn)) {
            await removeTime(id, conn);
        }
        
        conn.release();
        res.redirect("/spadmin/time");
    }, "/spadmin")
})

module.exports = router;