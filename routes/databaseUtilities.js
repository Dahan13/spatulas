const pool = require('./databaseConnector');


function createDatabase() {
    pool.query("CREATE TABLE IF NOT EXISTS spatulasUsers (userId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255), firstName VARCHAR(255), burger VARCHAR(255), fries VARCHAR(255), drink VARCHAR(255), time INT, preparation INT(1), ready INT(1), delivered INT(1))", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

module.exports = {
    createDatabase
}


