const pool = require('./databaseConnector');
let { getTimes, setRegistration } = require('./settingsUtilities');

/**
 * This function will create all tables for the website to properly function, only if they are not already created.
 */
function createDatabase(conn = null) {
    db = (conn) ? conn : pool
    db.query("CREATE TABLE IF NOT EXISTS spatulasUsers (userId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255), firstName VARCHAR(255), burger VARCHAR(255), fries VARCHAR(255), drink VARCHAR(255), time VARCHAR(5), preparation INT(1) DEFAULT 0, ready INT(1) DEFAULT 0, delivered INT(1) DEFAULT 0, price FLOAT, lastUpdated TIMESTAMP DEFAULT NOW())", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
    db.query("CREATE TABLE IF NOT EXISTS spatulasBurgers (identifier VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), price FLOAT DEFAULT 0.0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
    db.query("CREATE TABLE IF NOT EXISTS spatulasFries (identifier VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), price FLOAT DEFAULT 0.0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
    db.query("CREATE TABLE IF NOT EXISTS spatulasDrinks (identifier VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), price FLOAT DEFAULT 0.0)", (err, rows, fields) => {
        if (err) {
            console.log(err);
        }
    })
}

/**
 * Insert a user into the database, it will also close registration if all time stamps are full
 * @param {string} lastName 
 * @param {string} firstName 
 * @param {string} burger 
 * @param {string} fries 
 * @param {string} drink 
 * @param {int} time 
 */
async function insertUser(lastName, firstName, burger, fries, drink, time, price, connection = null) {
    db = (connection) ? connection : await pool.promise().getConnection()
    db.execute('INSERT INTO spatulasUsers (lastName, firstName, burger, fries, drink, time, price) VALUES (?, ?, ?, ?, ?, ?, ?)', [lastName, firstName, burger, fries, drink, time, price], (err, rows, fields) => {
        if (err) {
            console.log(err);
        }

        // Check if all time slots are full
        getTimes((times) => {
            if (!connection) { // releasing the connection if it was not passed as a parameter
                pool.releaseConnection(db);
            }
            // If all time slots are full, close registration
            if (times.length == 0) {
                setRegistration(0);
            }
        }, true, db)
    });
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
 * @param {string} orderCriteria
 */
function getUsers(callback, orderCriteria = null, connection = null) {
    let db = (connection) ? connection : pool
    if (orderCriteria) {
        db.query('SELECT * FROM spatulasUsers ORDER BY ' + orderCriteria, (err, rows, fields) => {
            callback(rows, fields);
        })
    } else {
        db.query('SELECT * FROM spatulasUsers', (err, rows, fields) => {
            callback(rows, fields);
        })
    }
}

/**
 * Returns a list containing all untreated users
 * @param {function} callback
 * @param {int} userLimit
 */
function getUntreatedUsers(callback, orderCriteria = null, connection = null) {
    let db = (connection) ? connection : pool
    if (orderCriteria) {
        db.query('SELECT * FROM spatulasUsers WHERE preparation=0 AND ready=0 AND delivered=0 ORDER BY ' + orderCriteria, (err, rows, fields) => {
            callback(rows, fields);
        })
    } else {
        db.query('SELECT * FROM spatulasUsers WHERE preparation=0 AND ready=0 AND delivered=0', (err, rows, fields) => {
            callback(rows, fields);
        })
    }
}

/** 
 * Returns a list containing all users in preparation
 * @param {function} callback
 * @param {int} userLimit
 */
function getPreparationUsers(callback, orderCriteria = null, connection = null) {
    db = (connection) ? connection : pool
    if (orderCriteria) {
        db.query('SELECT * FROM spatulasUsers WHERE preparation=1 AND ready=0 AND delivered=0 ORDER BY ' + orderCriteria, (err, rows, fields) => {
            callback(rows, fields);
        })
    } else {
        db.query('SELECT * FROM spatulasUsers WHERE preparation=1 AND ready=0 AND delivered=0', (err, rows, fields) => {
            callback(rows, fields);
        })
    }
}

/** 
 * Returns a list containing all users ready
 * @param {function} callback
 * @param {int} userLimit
 */
function getReadyUsers(callback, orderCriteria = null, connection = null) {
    db = (connection) ? connection : pool
    if (orderCriteria) {
        db.query('SELECT * FROM spatulasUsers WHERE ready=1 AND delivered=0 ORDER BY ' + orderCriteria, (err, rows, fields) => {
            callback(rows, fields);
        })
    } else {
        db.query('SELECT * FROM spatulasUsers WHERE ready=1 AND delivered=0', (err, rows, fields) => {
            callback(rows, fields);
        })
    }
}

/**
 * Returns a list containing all users delivered
 * @param {function} callback
 * @param {int} userLimit
 */
function getDeliveredUsers(callback, orderCriteria = null, connection = null) {
    db = (connection) ? connection : pool
    if (orderCriteria) {
        db.query('SELECT * FROM spatulasUsers WHERE delivered=1 ORDER BY ' + orderCriteria, (err, rows, fields) => {
            callback(rows, fields);
        })
    } else {
        db.query('SELECT * FROM spatulasUsers WHERE delivered=1', (err, rows, fields) => {
            callback(rows, fields);
        })
    }
}

/**
 * This function returns a list of users according to their status, it can optionally order each category of users according to a criteria, and convert food identifiers to food names
 * @param {function} callback
 * @param {boolean} convertFood
 * @param {string} orderCriteria1
 * @param {string} orderCriteria2
 * @param {string} orderCriteria3
 * @param {string} orderCriteria4
 */
function getUsersByStatus(callback, convertFood = false, orderCriteria1 = null, orderCriteria2 = null, orderCriteria3 = null, orderCriteria4 = null) {
    pool.getConnection((err, db) => {
        getUntreatedUsers((untreatedUsers, fields) => {
            getPreparationUsers((preparationUsers, fields) => {
                getReadyUsers((readyUsers, fields) => {
                    getDeliveredUsers((deliveredUsers, fields) => {
                        if (convertFood) {
                            convertFoodIdToFoodName(untreatedUsers, (untreatedUsers) => {
                                convertFoodIdToFoodName(preparationUsers, (preparationUsers) => {
                                    convertFoodIdToFoodName(readyUsers, (readyUsers) => {
                                        convertFoodIdToFoodName(deliveredUsers, (deliveredUsers) => {
                                            pool.releaseConnection(db);
                                            callback(untreatedUsers.concat(preparationUsers).concat(readyUsers).concat(deliveredUsers))
                                        }, db)
                                    }, db)
                                }, db)
                            }, db)
                        } else {
                            pool.releaseConnection(db);
                            callback(untreatedUsers.concat(preparationUsers).concat(readyUsers).concat(deliveredUsers))
                        }
                    }, orderCriteria4, db)
                }, orderCriteria3, db)
            }, orderCriteria2, db)
        }, orderCriteria1, db)    
    })
}

/**
 * This function returns a list of doublets, first containing the time stamp, then all users that have been added at this time stamp.
 * This function may also optionally search for users, given a string of names.
 * @param {function} callback
 * @param {string} searchString
 * @returns {Array} => [[time, [users]], [time, [users]], ...]
 */
async function getUsersByTime(callback, searchString = "", orderCriteria = "userId", conn) {
    let db = (conn) ? conn.promise() : await pool.promise().getConnection(); // If a connection is provided, use it, otherwise create a new one. Note that we are using promises in this function, so we need to use the promise() function to get a promise-based connection
    let sortedUsers = []
    getTimes(async (times) => {
        namesToSearch = searchString.split(" "); // Split the search string into an array of names, we will test all of them

        for (let i = 0; i < times.length; i++) {
            sortedUsers[i] = {}; // Create a new object for this time stamp
            sortedUsers[i]["timestamp"] = times[i]; // Add the time stamp to the list
            
            // Search for users that have been added at this time stamp
            let usersFound = await db.query('SELECT * FROM spatulasUsers WHERE time=? AND (firstName LIKE ? OR lastName LIKE ?) ORDER BY ' + orderCriteria, [times[i], namesToSearch[0] + "%", namesToSearch[0] + "%"]);
            usersFound = usersFound[0]; // The query returns an array of arrays, we only want the first one

            // If there are more than one name to search, we will intersect the results of each search to get the users that match all names
            for (let j = 1; j < namesToSearch.length; j++) {
                let newUsers = await db.query('SELECT * FROM spatulasUsers WHERE time=? AND (firstName LIKE ? OR lastName LIKE ?) ORDER BY ' + orderCriteria, [times[i], namesToSearch[j] + "%", namesToSearch[j] + "%"])
                newUsers = newUsers[0];

                // Intersect the two arrays
                usersFound = usersFound.filter(n => newUsers.some(n2 => n.userId == n2.userId));
            }
            // Add the users to the list
            sortedUsers[i]["users"] = (usersFound.length > 0) ? usersFound : null; // If there are no users, we set the value to null
        }
        if (!conn) db.release(); // If we created a new connection, we need to release it

        // Return the list
        callback(sortedUsers);
    }, false, db)
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
function searchUser(firstName, lastName, callback, deliveryStatus = null, limit = 20, connection = null) {
    db = (connection) ? connection : pool
    if (deliveryStatus) {
        db.query('SELECT * FROM spatulasUsers WHERE firstName LIKE \'' + firstName + '%\' AND lastName LIKE \'' + lastName + '%\' AND delivered=? ORDER BY time LIMIT 0, ?', [deliveryStatus, limit], (err, rows, fields) => {
            callback(rows, fields);
        })
    } else {
        db.query('SELECT * FROM spatulasUsers WHERE firstName LIKE \'' + firstName + '%\' AND lastName LIKE \'' + lastName + '%\' ORDER BY time LIMIT 0, ?', [limit], (err, rows, fields) => {
            callback(rows, fields);
        })
    }
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
    }, false, conn)
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
    }, false, conn)
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

function togglePrepare(userId, conn = null) {
    if (conn) {
        conn.execute('SELECT preparation FROM spatulasUsers WHERE userId=?', [userId], (err, rows, fields) => {
            conn.query('UPDATE spatulasUsers SET preparation = ? WHERE userId = ?', [(rows[0].preparation) ? 0 : 1, userId]); 
        })
    } else {
        pool.getConnection((err, conn) => {
            conn.execute('SELECT preparation FROM spatulasUsers WHERE userId=?', [userId], (err, rows, fields) => {
                conn.query('UPDATE spatulasUsers SET preparation = ? WHERE userId = ?', [(rows[0].preparation) ? 0 : 1, userId], () => {
                    pool.releaseConnection(conn);
                }); 
            })            
        })
    }
}

function toggleReady(userId, conn = null) {
    if (conn) {
        conn.execute('SELECT ready FROM spatulasUsers WHERE userId=?', [userId], (err, rows, fields) => {
            conn.query('UPDATE spatulasUsers SET ready = ? WHERE userId = ?', [(rows[0].ready) ? 0 : 1, userId]); 
        })
    } else {
        pool.getConnection((err, conn) => {
            conn.execute('SELECT ready FROM spatulasUsers WHERE userId=?', [userId], (err, rows, fields) => {
                conn.query('UPDATE spatulasUsers SET ready = ? WHERE userId = ?', [(rows[0].ready) ? 0 : 1, userId], () => {
                    pool.releaseConnection(conn);
                }); 
            })            
        })
    }
}

function toggleDelivered(userId, conn = null) {
    if (conn) {
        conn.execute('SELECT delivered FROM spatulasUsers WHERE userId=?', [userId], (err, rows, fields) => {
            conn.query('UPDATE spatulasUsers SET delivered = ? WHERE userId = ?', [(rows[0].delivered) ? 0 : 1, userId]); 
        })
    } else {
        pool.getConnection((err, conn) => {
            conn.execute('SELECT delivered FROM spatulasUsers WHERE userId=?', [userId], (err, rows, fields) => {
                conn.query('UPDATE spatulasUsers SET delivered = ? WHERE userId = ?', [(rows[0].delivered) ? 0 : 1, userId], () => {
                    pool.releaseConnection(conn);
                }); 
            })            
        })
    }
}

function purgeDatabase() {
    pool.getConnection((err, conn) => {
        conn.execute('DROP TABLE spatulasUsers', () => {
            conn.execute('DROP TABLE spatulasBurgers', () => {
                conn.execute('DROP TABLE spatulasFries', () => {
                    conn.execute('DROP TABLE spatulasDrinks', () => {
                        createDatabase(conn);
                        pool.releaseConnection(conn);
                    })
                });
            });
        })
    })
}

function refreshCommand(userId, callback, conn = null) {
    let db = (conn) ? conn : pool
    db.execute('UPDATE spatulasUsers SET lastUpdated = NOW() WHERE userId = ?', [userId], (err, rows) => {
        callback();
    }) 
}

module.exports = {
    createDatabase,
    insertUser,
    insertBurger,
    insertFries,
    insertDrink,
    getUsers,
    getUntreatedUsers,
    getPreparationUsers,
    getReadyUsers,
    getDeliveredUsers,
    getUsersByStatus,
    getUsersByTime,
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
    convertFoodIdToFoodName,
    togglePrepare,
    toggleReady,
    toggleDelivered,
    purgeDatabase,
    refreshCommand
}