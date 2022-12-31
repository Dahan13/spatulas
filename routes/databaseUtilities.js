const pool = require('./databaseConnector');

/**
 * This function will create all tables for the website to properly function, only if they are not already created.
 */
function createDatabase() {
    pool.query("CREATE TABLE IF NOT EXISTS spatulasUsers (userId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255), firstName VARCHAR(255), burger VARCHAR(255), fries VARCHAR(255), drink VARCHAR(255), time VARCHAR(5), preparation INT(1) DEFAULT 0, ready INT(1) DEFAULT 0, delivered INT(1) DEFAULT 0)", (err, rows, fields) => {
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
function insertUser(lastName, firstName, burger, fries, drink, time, connection = null) {
    db = (connection) ? connection : pool
    db.execute('INSERT INTO spatulasUsers (lastName, firstName, burger, fries, drink, time) VALUES (?, ?, ?, ?, ?, ?)', [lastName, firstName, burger, fries, drink, time], (err, rows, fields) => {
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
function insertBurger(identifier, name, description = null, price = null, connection = null) {
    db = (connection) ? connection : pool
    db.execute('INSERT INTO spatulasBurgers VALUES (?, ?, ?, ?)', [identifier, name, description, price], (err, rows, fields) => {
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
function insertFries(identifier, name, description = null, price = null, connection = null) {
    db = (connection) ? connection : pool
    db.execute('INSERT INTO spatulasFries VALUES (?, ?, ?, ?)', [identifier, name, description, price], (err, rows, fields) => {
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
function insertDrink(identifier, name, description = null, price = null, connection = null) {
    db = (connection) ? connection : pool
    db.execute('INSERT INTO spatulasDrinks VALUES (?, ?, ?, ?)', [identifier, name, description, price], (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Returns a list containing all users
 * @param {function} callback 
 */
function getUsers(callback, timeStamp = null, connection = null) {
    db = (connection) ? connection : pool
    if (timeStamp) {
        db.execute('SELECT * FROM spatulasUsers WHERE time=?', [timeStamp], (err, rows, fields) => {
            if (err) {
                console.log(err);
            } else {
                callback(rows, fields);
            }
        })
    } else {
        db.query('SELECT * FROM spatulasUsers', (err, rows, fields) => {
            if (err) {
                console.log(err);
            } else {
                callback(rows, fields);
            }
        })
    }
}

/**
 * This function search for users according to last and first name.
 * MAKE SURE THAT FIRST AND LAST NAME ARE SANITIZED, THIS FUNCTION DO NOT USE PRE-COMPILED STATEMENTS
 * @param {String} firstName 
 * @param {String} lastName 
 * @param {function} callback 
 * @param {int} limit 
 * @param {*} connection 
 */
function searchUser(firstName, lastName, callback, limit = 20, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasUsers WHERE firstName LIKE \'' + firstName + '%\' AND lastName LIKE \'' + lastName + '%\' LIMIT 0, ?', [limit], (err, rows, fields) => {
        callback(rows, fields);
    })
}

/**
 * Returns a list containing all burgers
 * @param {function} callback 
 */
function getBurgers(callback, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasBurgers', (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            callback(rows, fields);
        }
    })
}

/**
 * Count the number of each burger
 * @param {function} callback 
 * @param {*} connection 
 */
function countBurgers(callback, connection = null) {
    db = (connection) ? connection : pool;
    db.query('SELECT count(*) AS count, name FROM (SELECT burger, identifier, name FROM spatulasUsers INNER JOIN spatulasBurgers ON spatulasUsers.burger = spatulasBurgers.identifier) AS burgerClient GROUP BY name', (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
        callback(rows)
    })
}

/**
 * Count the number of each drink
 * @param {function} callback 
 * @param {*} connection 
 */
function countDrinks(callback, connection = null) {
    db = (connection) ? connection : pool;
    db.query('SELECT count(*) AS count, name FROM (SELECT drink, identifier, name FROM spatulasUsers INNER JOIN spatulasDrinks ON spatulasUsers.drink = spatulasDrinks.identifier) AS drinkClient GROUP BY name', (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
        callback(rows)
    })
}


/**
 * Count the number of each fries
 * @param {function} callback 
 * @param {*} connection 
 */
function countFries(callback, connection = null) {
    db = (connection) ? connection : pool;
    db.query('SELECT count(*) AS count, name FROM (SELECT fries, identifier, name FROM spatulasUsers INNER JOIN spatulasFries ON spatulasUsers.fries = spatulasFries.identifier) AS friesClient GROUP BY name', (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
        callback(rows)
    })
}


/**
 * Returns a list containing all fries
 * @param {function} callback 
 */
function getFries(callback, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasFries', (err, rows, fields) => {
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
function getDrinks(callback, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasDrinks', (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            callback(rows, fields);
        }
    })
}

/**
 * Give to callback function a boolean indicating whether the identifier is in the database or not.
 * @param {*} value
 */
function checkBurger(value, callback, connection = null) {
    conn = (connection) ? connection : pool;
    getBurgers((rows) => {
        for (let i = 0; i < rows.length; i++) {
            if (value == rows[i].identifier) {
                callback(true);
                return;
            }
        }
        callback(false);
    }, conn)
}

/**
 * Give to callback function a boolean indicating whether the identifier is in the database or not.
 * @param {*} value
 */
function checkFries(value, callback, connection = null) {
    conn = (connection) ? connection : pool;
    getFries((rows) => {
        for (let i = 0; i < rows.length; i++) {
            if (value == rows[i].identifier) {
                callback(true);
                return;
            }
        }
        callback(false);
    }, conn)
}

/**
 * Give to callback function a boolean indicating whether the identifier is in the database or not.
 * @param {*} value
 */
function checkDrink(value, callback, connection = null) {
    conn = (connection) ? connection : pool;
    getDrinks((rows) => {
        for (let i = 0; i < rows.length; i++) {
            if (value == rows[i].identifier) {
                callback(true);
                return;
            }
        }
        callback(false);
    }, conn)
}

module.exports = {
    createDatabase,
    insertUser,
    insertBurger,
    insertFries,
    insertDrink,
    getUsers,
    searchUser,
    getBurgers,
    countBurgers,
    getFries,
    countFries,
    getDrinks,
    countDrinks,
    checkBurger,
    checkFries,
    checkDrink
}


