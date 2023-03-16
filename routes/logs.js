var express = require('express');
const { body, query, check } = require('express-validator');
var router = express.Router();
const fs = require('fs');
let pool = require('./databaseConnector');
let { authenticate, getLogSizeLimit, setLogSizeLimit } = require('./settingsUtilities');

router.get('/', (req, res, next) => {
    authenticate(req, res, () => {
        getLogs((logs) => {
            getLogSizeLimit((limit) => {
                res.render('logs', { title: 'Logs', admin: req.cookies.spatulasPower, logs: logs, limit: limit });
            })
        })
    })
});

router.get('/downloadLog/:logName', (req, res, next) => {
    authenticate(req, res, () => {
        res.download('./logs/' + req.params.logName + '.log', (err) => {
            if (err) {
                console.log(err);
            }
        })
    })
});

router.get('/deleteLog/:logName', (req, res, next) => {
    authenticate(req, res, () => {
        // We only delete the log if it's not the current one being filled, meaning it's name does not correspond to the current date
        if (req.params.logName != (new Date()).getDate() + "-" + ((new Date()).getMonth() + 1) + "-" + (new Date()).getFullYear()) {
            fs.unlink('./logs/' + req.params.logName + '.log', (err) => {
                res.redirect('/logs');
            })
        } else {
            res.redirect('/logs');
        }
    })
});

router.post('/updateSizeLimit', (req, res, next) => {
    authenticate(req, res, () => {      
        setLogSizeLimit(req.body.SizeLimit);
        res.redirect('/logs');
    })
})

/**
 * This function is used to get the logs from the database
 */
function getLogs(callback) {
    fs.readdir('./logs', (err, files) => {
        files = files.filter((file) => { return file.split('.').pop() == 'log'}); // Only get the log files
        files = files.map((file) => { return { name: file.split('.')[0], current: (file.split('.')[0] == (new Date()).getDate() + "-" + ((new Date()).getMonth() + 1) + "-" + (new Date()).getFullYear()) ? true : false } }); // Remove the .log extension and tells if a log is the current one
        callback(files);
    })
}

/**
 * This function will delete all logs until the size of the logs folder is less than the specified size
 * @param {Number} maxSize The size in bytes that we need to stay under
 */
function deleteOldLogs(maxSize) {
    const delay = ms => new Promise(res => setTimeout(res, ms)); // We use this function to delay the execution of the next line of code
    // First we get all the log files
    fs.readdir('./logs', async (err, files) => {
        files = files.filter((file) => { return file.split('.').pop() == 'log'}); // Only get the log files

        // We get the size of the logs folder
        let folderSize = 0;
        for (let i = 0; i < files.length; i++){
            folderSize += (await fs.promises.stat('./logs/' + files[i])).size / (1024 * 1024); // We convert the size in bytes to Mb
        }

        console.log('\x1b[31m%s\x1b[0m' , `LOGS STATUS (${folderSize}Mb/${maxSize}Mb)`);
        // We delete the oldest logs until the size of the folder is less than the specified size
        while (folderSize > maxSize) {
            if (files.length > 1) { // We don't delete the current log
                fs.unlinkSync('./logs/' + files[0])
                files.shift(); // We remove the first element of the array
            } else { // If there is only one log, we will clear the file instead of deleting it
                fs.openSync('./logs/' + files[0], 'w');
            }

            folderSize = 0;
            for (let i = 0; i < files.length; i++){
                folderSize += (await fs.promises.stat('./logs/' + files[i])).size / (1024 * 1024); // We convert the size in bytes to Mb
            }
            console.log('\x1b[31m%s\x1b[0m' , `LOGS STATUS (${folderSize}Mb/${maxSize}Mb)`);
        }
    })
}

// 
getLogSizeLimit((limit) => {
    deleteOldLogs(limit);
    setInterval(() => {
        deleteOldLogs(limit);
    }, 1000 * 60 * 10); // We check every 10 minutes if we need to delete logs
})

module.exports = router;