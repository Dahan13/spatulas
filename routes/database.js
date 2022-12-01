const mysql = require('mysql')
const waitPort = require('wait-port');

require('dotenv').config(); // ! Acquiring environnement variables
  
// Setting up parameters of the port we need to wait for
const params = {
    host : process.env.MYSQL_HOST,
    port : 3306
}

console.log("Gonna wait")
waitPort(params)
    .then(({ open, ipVersion }) => {
        if (open) {
            console.log(`The port is now open on IPv${ipVersion}!`);
            // ? Creating MySQL connection pool
            var pool      =    mysql.createPool({
                connectionLimit : 10,
                host     : process.env.MYSQL_HOST,
                user     : process.env.MYSQL_USER,
                password : process.env.MYSQL_PASSWORD,
                database : process.env.MYSQL_DB
            });    

            // Exporting our database connection pool for later use.
            console.log("Database connection established & exported !")
            module.exports = pool;
        }
        else console.log('The port did not open before the timeout...');
    })
    .catch((err) => {
        console.err(`An unknown error occured while waiting for the port: ${err}`);
    });


