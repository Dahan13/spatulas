const mysql = require('mysql2')
const waitPort = require('wait-port');

require('dotenv').config(); // ! Acquiring environnement variables


// ? Creating MySQL connection pool
var pool = mysql.createPool({
    connectionLimit : 10,
    host: 'localhost', // process.env.MYSQL_HOST,
    user: 'root', // process.env.MYSQL_USER,
    password: 'password', // process.env.MYSQL_PASSWORD,
    database: 'spatulas', // process.env.MYSQL_DB
});    

/* This create a connection from the pool to ensure that everything is working correctly*/
pool.getConnection(function(err, connection) {
    if (err) {
        console.error('error creating a test connection: ' + err.stack);
        console.log('\x1b[31m%s\x1b[0m' , 'You can find database connection settings in /routes/databaseConnector.js')
        return;
    }
    connection.release();
});

/* Some functions that monitors connection states & give feedbacks in dev console */
pool.on('acquire', function (connection) {
    console.log('\x1b[32m%s\x1b[0m', 'Pool connection ' + connection.threadId + ' acquired');
});

pool.on('release', function (connection) {
    console.log('\x1b[32m%s\x1b[0m', 'Pool connection ' + connection.threadId + ' released');
});

pool.on('enqueue', function () {
    console.log('\x1b[31m%s\x1b[0m', 'A pool connection has been enqueued. Please ensure there is enough connections available for all users (default 10).\nIn case pool connections are stuck open, you need to restart the server');
});

module.exports = pool; // Exporting DB pool connection to all others docs.
setTimeout(() => {console.log('\x1b[33m%s\x1b[0m' ,'\n\n>> Database connection pool has been tested & exported !\n\n ========== \n')}, 1000);