const pool = require('./databaseConnector');

/**
 * This function will create all tables for the website to properly function, only if they are not already created.
 */
function createDatabase() {
    pool.query("CREATE TABLE IF NOT EXISTS spatulasUsers (userId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255), firstName VARCHAR(255), burger VARCHAR(255), fries VARCHAR(255), drink VARCHAR(255), time VARCHAR(5), preparation INT(1) DEFAULT 0, ready INT(1) DEFAULT 0, delivered INT(1) DEFAULT 0, price FLOAT)", (err, rows, fields) => {
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
function insertUser(lastName, firstName, burger, fries, drink, time, price, connection = null) {
    console.log(price);
    db = (connection) ? connection : pool
    db.execute('INSERT INTO spatulasUsers (lastName, firstName, burger, fries, drink, time, price) VALUES (?, ?, ?, ?, ?, ?, ?)', [lastName, firstName, burger, fries, drink, time, price], (err, rows, fields) => {
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
 * @param {int} deliveredOnly : 0 if you want users that have not received their command, 1 otherwise
 */
function getUsers(callback, deliveredOnly = 0, timeStamp = null, connection = null) {
    db = (connection) ? connection : pool
    if (timeStamp) {
        db.execute('SELECT * FROM spatulasUsers WHERE time=? AND delivered=?', [timeStamp, deliveredOnly], (err, rows, fields) => {
            if (err) {
                console.log(err);
            } else {
                callback(rows, fields);
            }
        })
    } else {
        db.execute('SELECT * FROM spatulasUsers WHERE delivered=?', [deliveredOnly],(err, rows, fields) => {
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

function clearUsers(connection = null) {
    db = (connection) ? connection : pool
    conn.execute('TRUNCATE TABLE spatulasUsers');
}   

/**
 * Returns a list containing all burgers
 * @param {function} callback 
 */
function getBurgers(callback, addURL = false, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasBurgers', (err, rows, fields) => {
        if (addURL) {
            for (let i = 0; i < rows.length; i++) {
                rows[i].url = '/spadmin/deleteBurger/' + rows[i].identifier;
            }
            callback(rows, fields);
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
function countBurgers(callback, toPrepareOnly = false, connection = null) {
    db = (connection) ? connection : pool;
    if (toPrepareOnly) {
        db.query('SELECT count(*) AS count, name FROM (SELECT burger, identifier, name FROM spatulasUsers INNER JOIN spatulasBurgers ON spatulasUsers.burger = spatulasBurgers.identifier WHERE spatulasUsers.preparation = 1 AND spatulasUsers.ready = 0) AS burgerClient GROUP BY name', (err, rows, fields) => {
            callback(rows);
        })
    } else {
        db.query('SELECT count(*) AS count, name FROM (SELECT burger, identifier, name FROM spatulasUsers INNER JOIN spatulasBurgers ON spatulasUsers.burger = spatulasBurgers.identifier) AS burgerClient GROUP BY name', (err, rows, fields) => {
            callback(rows);
        })
    }
}

/**
 * Count the number of each drink
 * @param {function} callback 
 * @param {*} connection 
 */
function countDrinks(callback, toPrepareOnly = false, connection = null) {
    db = (connection) ? connection : pool;
    if (toPrepareOnly) {
        db.query('SELECT count(*) AS count, name FROM (SELECT drink, identifier, name FROM spatulasUsers INNER JOIN spatulasDrinks ON spatulasUsers.drink = spatulasDrinks.identifier WHERE spatulasUsers.preparation = 1 AND spatulasUsers.ready = 0) AS drinkClient GROUP BY name', (err, rows, fields) => {
            callback(rows)
        })
    } else {
        db.query('SELECT count(*) AS count, name FROM (SELECT drink, identifier, name FROM spatulasUsers INNER JOIN spatulasDrinks ON spatulasUsers.drink = spatulasDrinks.identifier) AS drinkClient GROUP BY name', (err, rows, fields) => {
            callback(rows);
        })
    }
    
}


/**
 * Count the number of each fries
 * @param {function} callback 
 * @param {*} connection 
 */
function countFries(callback, toPrepareOnly = false, connection = null) {
    db = (connection) ? connection : pool;
    if (toPrepareOnly) {
        db.query('SELECT count(*) AS count, name FROM (SELECT fries, identifier, name FROM spatulasUsers INNER JOIN spatulasFries ON spatulasUsers.fries = spatulasFries.identifier WHERE spatulasUsers.preparation = 1 AND spatulasUsers.ready = 0) AS friesClient GROUP BY name', (err, rows, fields) => {
            callback(rows)
        })
    } else {
        db.query('SELECT count(*) AS count, name FROM (SELECT fries, identifier, name FROM spatulasUsers INNER JOIN spatulasFries ON spatulasUsers.fries = spatulasFries.identifier) AS friesClient GROUP BY name', (err, rows, fields) => {
            callback(rows);
        })
    }
}


/**
 * Returns a list containing all fries
 * @param {function} callback 
 */
function getFries(callback, addURL = false, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasFries', (err, rows, fields) => {
        if (addURL) {
            for (let i = 0; i < rows.length; i++) {
                rows[i].url = '/spadmin/deleteFries/' + rows[i].identifier;
            }
            callback(rows, fields);
        } else {
            callback(rows, fields);
        }
    })
}

/**
 * Returns a list containing all drinks
 * @param {function} callback 
 */
function getDrinks(callback, addURL = false, connection = null) {
    db = (connection) ? connection : pool
    db.query('SELECT * FROM spatulasDrinks', (err, rows, fields) => {
        if (addURL) {
            for (let i = 0; i < rows.length; i++) {
                rows[i].url = '/spadmin/deleteDrink/' + rows[i].identifier;
            }
            callback(rows, fields);
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
    }, false, conn)
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

/**
 * Delete the burger in the database with the specified Id
 * @param {String} burgerId 
 * @param {*} connection 
 */
function deleteBurger(burgerId, connection = null) {
    conn = (connection) ? connection : pool;
    conn.execute('DELETE FROM spatulasBurgers WHERE identifier = ?', [burgerId]);
}

/**
 * Delete the fries in the database with the specified Id
 * @param {String} friesId 
 * @param {*} connection 
 */
function deleteFries(friesId, connection = null) {
    conn = (connection) ? connection : pool;
    conn.execute('DELETE FROM spatulasFries WHERE identifier = ?', [friesId]);
}

/**
 * Delete the drink in the database with the specified Id
 * @param {String} drinkId 
 * @param {*} connection 
 */
function deleteDrink(drinkId, connection = null) {
    conn = (connection) ? connection : pool;
    conn.execute('DELETE FROM spatulasDrinks WHERE identifier = ?', [drinkId]);
}

function calculatePrice(burgerId, friesId, drinkId, callback, connection = null) {
    if (connection == null) {
        pool.getConnection((err, conn) => {
            conn.execute('SELECT price FROM spatulasBurgers WHERE identifier = ?', [burgerId], (err, burger, fields) => {
                conn.execute('SELECT price FROM spatulasFries WHERE identifier = ?', [friesId], (err, fries, fields) => {
                    conn.execute('SELECt price FROM spatulasDrinks WHERE identifier = ?', [drinkId], (err, drink, fields) => {
                        callback(burger[0].price + fries[0].price + drink[0].price);
                        pool.releaseConnection(conn);
                    })
                })
            })
        })
    } else {
        connection.execute('SELECT price FROM spatulasBurgers WHERE identifier = ?', [burgerId], (err, burger, fields) => {
            connection.execute('SELECT price FROM spatulasFries WHERE identifier = ?', [friesId], (err, fries, fields) => {
                connection.execute('SELECT price FROM spatulasDrinks WHERE identifier = ?', [drinkId], (err, drink, fields) => {
                    callback(burger[0].price + fries[0].price + drink[0].price);
                })
            })
        })
    }
}

/**
 * Given an array of Objects, convert all mention of food Id to corresponding food name
 * @param {[Object]} users 
 * @param {*} callback 
 * @param {*} conn 
 */
function convertFoodIdToFoodName(users, callback, conn = null) {
    db = (conn) ? conn : pool;
    db.query('SELECT identifier, name FROM spatulasBurgers', (err, burgers, fields) => {
        db.query('SELECT identifier, name FROM spatulasDrinks', (err, drinks, fields) => {
            db.query('SELECT identifier, name FROM spatulasFries', (err, fries, fields) => {
                let burgersFinder = {};
                for (let i = 0; i < burgers.length; i++) {
                    burgersFinder[burgers[i].identifier] = burgers[i].name;
                }

                let drinksFinder = {};
                for (let i = 0; i < drinks.length; i++) {
                    drinksFinder[drinks[i].identifier] = drinks[i].name;
                }

                let friesFinder = {};
                for (let i = 0; i < fries.length; i++) {
                    friesFinder[fries[i].identifier] = fries[i].name;
                }
                for (let i = 0; i < users.length; i++) {
                    users[i].burger = burgersFinder[users[i].burger];
                    users[i].fries = friesFinder[users[i].fries];
                    users[i].drink = drinksFinder[users[i].drink];
                }
                callback(users)
            })
        })
    })
    
}

module.exports = {
    createDatabase,
    insertUser,
    insertBurger,
    insertFries,
    insertDrink,
    getUsers,
    searchUser,
    clearUsers,
    getBurgers,
    countBurgers,
    getFries,
    countFries,
    getDrinks,
    countDrinks,
    checkBurger,
    checkFries,
    checkDrink,
    deleteBurger,
    deleteFries,
    deleteDrink,
    calculatePrice,
    convertFoodIdToFoodName
}