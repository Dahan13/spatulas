const pool = require('./databaseConnector');

/**
 * This function will create all tables for the website to properly function, only if they are not already created.
 */
function createDatabase() {
    pool.query("CREATE TABLE IF NOT EXISTS spatulasUsers (userId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255), firstName VARCHAR(255), burger VARCHAR(255), fries VARCHAR(255), drink VARCHAR(255), time INT, preparation INT(1) DEFAULT 0, ready INT(1) DEFAULT 0, delivered INT(1) DEFAULT 0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
    pool.query("CREATE TABLE IF NOT EXISTS spatulasBurgers (identifier VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), price FLOAT DEFAULT 0.0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
    pool.query("CREATE TABLE IF NOT EXISTS spatulasFries (identifier VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), price FLOAT DEFAULT 0.0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
    pool.query("CREATE TABLE IF NOT EXISTS spatulasDrinks (identifier VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), price FLOAT DEFAULT 0.0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Insert a user into the database
 * @param {string} lastName 
 * @param {string} firstName 
 * @param {string} burger 
 * @param {string} fries 
 * @param {string} drink 
 * @param {int} time 
 */
function insertUser(lastName, firstName, burger, fries, drink, time) {
    pool.execute('INSERT INTO spatulasUsers (lastName, firstName, burger, fries, drink, time) VALUES (?, ?, ?, ?, ?, ?)', [lastName, firstName, burger, fries, drink, time], (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Insert a burger into the database
 * @param {string} identifier 
 * @param {string} name 
 * @param {string} description 
 * @param {float} price 
 */
function insertBurger(identifier, name, description = null, price = null) {
    pool.execute('INSERT INTO spatulasBurgers VALUES (?, ?, ?, ?)', [identifier, name, description, price], (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Insert a fries into the database
 * @param {string} identifier 
 * @param {string} name 
 * @param {string} description 
 * @param {float} price 
 */
function insertFries(identifier, name, description = null, price = null) {
    pool.execute('INSERT INTO spatulasFries VALUES (?, ?, ?, ?)', [identifier, name, description, price], (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Insert a drink into the database
 * @param {string} identifier 
 * @param {string} name 
 * @param {string} description 
 * @param {float} price 
 */
function insertDrink(identifier, name, description = null, price = null) {
    pool.execute('INSERT INTO spatulasDrinks VALUES (?, ?, ?, ?)', [identifier, name, description, price], (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Returns a list containing all users
 * @param {function} callback 
 */
function getUsers(callback) {
    pool.query('SELECT * FROM spatulasUsers', (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            callback(rows, fields);
        }
    })
}

/**
 * Returns a list containing all burgers
 * @param {function} callback 
 */
function getBurgers(callback) {
    pool.query('SELECT * FROM spatulasBurgers', (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            callback(rows, fields);
        }
    })
}

/**
 * Returns a list containing all fries
 * @param {function} callback 
 */
function getFries(callback) {
    pool.query('SELECT * FROM spatulasFries', (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            callback(rows, fields);
        }
    })
}

/**
 * Returns a list containing all drinks
 * @param {function} callback 
 */
function getDrinks(callback) {
    pool.query('SELECT * FROM spatulasDrinks', (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            callback(rows, fields);
        }
    })
}

module.exports = {
    createDatabase,
    insertUser,
    insertBurger,
    insertFries,
    insertDrink,
    getUsers,
    getBurgers,
    getFries,
    getDrinks
}


