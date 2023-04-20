const pool = require('./databaseConnector');
const validator = require('validator');
let { getTimes, setRegistration, getGlobalTimes } = require('./settingsUtilities');

/**
 * This function will create all tables for the website to properly function, only if they are not already created.
 */
async function createDatabase(conn = null) {
    db = (conn) ? conn : await pool.promise().getConnection();

    // Creating the table that will contains all commands
    await db.query("CREATE TABLE IF NOT EXISTS spatulasCommands (commandId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, lastName VARCHAR(255) NOT NULL, firstName VARCHAR(255) NOT NULL, time VARCHAR(5) DEFAULT \'00h01\', preparation INT(1) DEFAULT 0, ready INT(1) DEFAULT 0, delivered INT(1) DEFAULT 0, price FLOAT DEFAULT 0.0, lastUpdated TIMESTAMP DEFAULT NOW())")

    // Creating the table that will contains all the names of each food table
    await db.query("CREATE TABLE IF NOT EXISTS spatulasTables (tableId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, foodName VARCHAR(255) NOT NULL)"); 

    // Creating the table that will contains all the checkboxes for the forms
    // A tick is caracterized by it's message, if it's mandatory, the money value it adds to the total price, and if it needs to be displayed in the admin command list
    await db.query("CREATE TABLE IF NOT EXISTS spatulasCheckboxes (checkboxId INT PRIMARY KEY NOT NULL AUTO_INCREMENT, message VARCHAR(255) NOT NULL, mandatory INT(1) DEFAULT 0, price FLOAT DEFAULT 0.0, display INT(1) DEFAULT 1)")

    // Release connection if it was not passed as a parameter
    if (!conn) {
        db.release();
    }
    return;
}

/**
 * Returns a list containing all rows of the given table. It returns null if the table is empty or does not exist
 * @param {string} tableName
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically. The connection must be able to handle promises
 */
async function getTable(tableName, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // Getting the table
    let queryResult = await db.query('SELECT * FROM ' + tableName);
    let rows = queryResult[0];

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    // Returning the table
    if (rows.length > 0) {
        return rows;
    } else {
        return null;
    }
}

/**
 * Returns a list containing all the names of the tables stored in the spatulasTables table.
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically. The connection must be able to handle promises
 * @returns {Array} A list containing all the names of the tables stored in the spatulasTables table
 */
async function getTableNames(connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // Getting the table names
    let queryResult = await db.query('SELECT * FROM spatulasTables');
    let rows = queryResult[0];

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    // Returning the table names
    return rows;
}

/**
 * Returns a list containing objects, containing names of each table with a list of all rows of the table stored in the spatulasTables table.
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 */
async function getTables(connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // Getting all the table names
    let tableName = await getTableNames(db);
    let tables = tableName;

    // Now getting all data
    let tablesContent = [];
        for (let i = 0; i < tables.length; i++) {
        let tableContent = {};
        tableContent.name = tables[i].foodName;
        tableContent.content = await getTable(tables[i].foodName, db);
        tablesContent.push(tableContent);
    }

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    // Returning the tables
    return tablesContent
}

/**
 * Inserts a row in spatulasTables with the given name, it will then create the table with the given name in the database, and add 3 columns : name (the primary key), description and price.
 * It will also add a first row to the table with the given name, description and price.
 * If a new table is created, it will also add to spatulasCommands a column with the name of the table.
 * @param {string} tableName
 * @param {string} name
 * @param {string} description
 * @param {float} price
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 */
async function insertTable(tableName, name, description = null, price = null, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // if the table already exists, return
    let tables = await db.query("SELECT * FROM spatulasTables WHERE foodName = ?", [tableName]);
    if (tables[0].length > 0) {
        return;
    } else {
        await db.query("DROP TABLE IF EXISTS " + tableName);
    }

    // Inserting the table name in the spatulasTables table
    await db.query('INSERT INTO spatulasTables (foodName) VALUES (?)', [tableName]);

    // Creating the table
    await db.query('CREATE TABLE ' + tableName + ' (name VARCHAR(255) PRIMARY KEY, description VARCHAR(255), price FLOAT DEFAULT 0.0)');
    
    // Adding the column to the spatulasCommands table
    await db.query('ALTER TABLE spatulasCommands ADD ' + tableName + ' VARCHAR(255) NOT NULL REFERENCES ' + tableName + '(name)');

    // Inserting the first row
    insertRow(tableName, name, description, price, db);

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    return;
}

/**
 * Inserts a row in the given table with the given name, description and price (both are optional)
 * @param {string} tableName
 * @param {string} name
 * @param {string} description
 * @param {float} price
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 */
async function insertRow(tableName, name, description = null, price = null, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // We check if the table already exists
    let tables = await db.query("SELECT * FROM spatulasTables WHERE foodName = ?", [tableName]);
    if (tables[0].length == 0) {
        return;
    }

    // We check if the primary key is already taken
    let row = await db.query('SELECT * FROM ' + tableName + ' WHERE name = ?', [name]);
    if (row[0].length > 0) {
        return;
    }

    // Inserting the row
    await db.query('INSERT INTO ' + tableName + ' (name, description, price) VALUES (?, ?, ?)', [name, description, price]);
    return;
}

/**
 * Insert a user into the database, it will also close registration if all time stamps are full
 * Given good array must be in the same order as in spatulasTables
 * @param {string} lastName 
 * @param {string} firstName 
 * @param {int} time 
 * @param {float} price
 * @param {Array} foods
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @returns {boolean} True if the user was inserted, false if the user was not inserted
 */
async function insertUser(lastName, firstName, time, price, foods, connection = null) {
    db = (connection) ? connection : await pool.promise().getConnection();

    // First we need to get the number of columns in spatulasCommands
    let columnNumber = await db.query("SELECT Count(*) AS count FROM INFORMATION_SCHEMA.Columns where TABLE_NAME = \'spatulasCommands\'")

    // We check that the column number is consistent with the number of foods
    let tableNumber = await getTableNames(db);
    if (columnNumber[0][0].count != tableNumber.length + 9) {
        return false;
    }

    // Now we assemble the query
    let sqlQuery = 'INSERT INTO spatulasCommands'

    // We create the different variables for the query
    let columnNames = '(lastName, firstName, time, price, '
    let valuesString = '(?, ?, ?, ?, ';
    let valuesArray = [lastName, firstName, time, price];
    for (let i = 0; i < tableNumber.length; i++) {
        valuesArray.push(foods[i]);
        valuesString += '? ';
        columnNames += tableNumber[i].foodName;
        if (i != tableNumber.length - 1) {
            columnNames += ', ';
            valuesString += ', ';
        }
    }
    columnNames += ')';
    valuesString += ')';

    // Executing the query
    await db.execute('INSERT INTO spatulasCommands ' + columnNames + ' VALUES ' + valuesString, valuesArray)

    // Check if all time slots are full
    let times = await getGlobalTimes(db);

    for (let i = 0; i < times.length; i++) {
        if (!times[i].full) { // If at least one time slot is not full, we return
            return true;
        }
    }

    // If we are here, it means that all time slots are full, we close registration
    setRegistration(false);

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    return true;
}

/**
 * Returns a string adapted to be used in a query after the WHERE clause.
 * It takes in input a search string, words separated by spaces.
 * @param {string} searchString
 * @returns {string} A string that can be used in a query to find all the users that have each of their words in their first name or last name.
 */
function buildSearchStringForQuery(searchString = null) {
    if (!searchString) {
        return null;
    }

    let words = searchString.split(' ');
    let query = '(';
    for (let i = 0; i < words.length; i++) {
        let word = words[i].trim();
        query += '(firstName LIKE \'%' + word + '%\' OR lastName LIKE \'%' + word + '%\')';
        if (i != words.length - 1) {
            query += ' AND ';
        }
    }
    query += ')';
    return query;
}


/**
 * Returns a list containing all users, it also can optionally order the results, add some conditions for the query
 * It can also return only the users that match a search string (i.e each element of the search string is either in the first name or last name of the user).
 * @param {string} conditions
 * @param {string} orderCriteria
 * @param {string} searchString
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @returns {Array} An array containing all the users matching the parameters
 */
async function getUsers(conditions = null, searchString = null, orderCriteria = null, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();
    let queryString = "";

    searchString = buildSearchStringForQuery(searchString);
    console.log(searchString);
    // We check if we need to add conditions to the query as well as the search string
    if (conditions && searchString) {
        queryString += ' WHERE (' + conditions + ') AND ' + searchString;
    } else {
        if (conditions) {
            queryString += ' WHERE ' + conditions;
        } else if (searchString) {
            queryString += ' WHERE ' + searchString;
        }
    }

    // We check if we need to order the results
    if (orderCriteria) {
        queryString += ' ORDER BY ' + orderCriteria; // We add the order criteria to the query
    }

    // We execute the query
    let value = await db.query('SELECT * FROM spatulasCommands' + queryString);

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    } 

    return value[0]
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
function getPreparationUsers(callback, orderCriteria = null, limit = null, connection = null) {
    // Initialize variables
    db = (connection) ? connection : pool
    SQLquery = 'SELECT * FROM spatulasUsers WHERE preparation=1 AND ready=0 AND delivered=0'

    // Extend query depending on optional parameters
    if (orderCriteria != null) {
        SQLquery += ' ORDER BY ' + orderCriteria;
    }

    if (limit != null && limit > 0) {
        SQLquery += ' LIMIT ' + limit;
    }

    // Execute query
    db.query(SQLquery, (err, rows, fields) => {
        callback(rows, fields);
    })
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
function getUsersByStatus(callback, orderCriteria1 = null, orderCriteria2 = null, orderCriteria3 = null, orderCriteria4 = null) {
    pool.getConnection((err, db) => {
        getUntreatedUsers((untreatedUsers, fields) => {
            getPreparationUsers((preparationUsers, fields) => {
                getReadyUsers((readyUsers, fields) => {
                    getDeliveredUsers((deliveredUsers, fields) => {
                        db.release();
                        callback(untreatedUsers.concat(preparationUsers).concat(readyUsers).concat(deliveredUsers))
                    }, orderCriteria4, db)
                }, orderCriteria3, db)
            }, orderCriteria2, null, db)
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
async function getUsersByTime(searchString = "", orderCriteria = "userId", conn) {
    let db = (conn) ? conn : await pool.promise().getConnection(); // If a connection is provided, use it, otherwise create a new one. Note that we are using promises in this function, so we need to use the promise() function to get a promise-based connection
    let sortedUsers = [];
    let times = await getGlobalTimes(db);

    let namesToSearch = searchString.split(" "); // Split the search string into an array of names, we will test all of them

    for (let i = 0; i < times.length; i++) {
        sortedUsers[i] = {}; // Create a new object for this time stamp
        sortedUsers[i]["timeSettings"] = times[i]; // Add the time stamp to the list
        
        // Search for users that have been added at this time stamp
        let usersFound = await db.query('SELECT * FROM spatulasCommands WHERE time=? AND (firstName LIKE ? OR lastName LIKE ?) ORDER BY ' + orderCriteria, [times[i].time, namesToSearch[0] + "%", namesToSearch[0] + "%"]);
        usersFound = usersFound[0]; // The query returns an array of arrays, we only want the first one

        // If there are more than one name to search, we will intersect the results of each search to get the users that match all names
        for (let j = 1; j < namesToSearch.length; j++) {
            let newUsers = await db.query('SELECT * FROM spatulasCommands WHERE time=? AND (firstName LIKE ? OR lastName LIKE ?) ORDER BY ' + orderCriteria, [times[i].time, namesToSearch[j] + "%", namesToSearch[j] + "%"])
            newUsers = newUsers[0];

            // Intersect the two arrays
            usersFound = usersFound.filter(n => newUsers.some(n2 => n.userId == n2.userId));
        }
        // Add the users to the list
        sortedUsers[i]["users"] = (usersFound.length > 0) ? usersFound : null; // If there are no users, we set the value to null
    }

    if (!conn) db.release(); // If we created a new connection, we need to release it

    // Return the list
    return sortedUsers;
}
    




/**
 * This function search for users according to last and first name.
 * MAKE SURE THAT FIRST AND LAST NAME ARE SANITIZED, THIS FUNCTION DO NOT USE PRE-COMPILED STATEMENTS
 * ! This function is deprecated, will be removed soon
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
 * Count the number of each burger, it can optionally only count the burgers that are not ready yet
 * @param {function} callback 
 * @param {*} connection 
 */
function countBurgers(callback, toPrepareOnly = false, connection = null) {
    db = (connection) ? connection : pool;
    if (toPrepareOnly) {
        db.query('SELECT count(*) AS count, name FROM (SELECT burger, identifier, name FROM spatulasUsers INNER JOIN spatulasBurgers ON spatulasUsers.burger = spatulasBurgers.identifier WHERE spatulasUsers.preparation = 1 AND spatulasUsers.ready = 0 AND spatulasUsers.delivered = 0) AS burgerClient GROUP BY name', (err, rows, fields) => {
            callback(rows);
        })
    } else {
        db.query('SELECT count(*) AS count, name FROM (SELECT burger, identifier, name FROM spatulasUsers INNER JOIN spatulasBurgers ON spatulasUsers.burger = spatulasBurgers.identifier) AS burgerClient GROUP BY name', (err, rows, fields) => {
            callback(rows);
        })
    }
}

/**
 * Count the number of each item (burger, fries, drink), in a list of lists
 * @param {function} callback
 * @param {*} connection
 * @param {String} queriesCondition
 * @returns {Array} => [ [itemName, [ {name, count} ] ], ...]
 */
async function getAllItemsCount(callback, queriesCondition = "", limit = null, conn = null) {
    let db = (conn) ? conn.promise() : await pool.promise().getConnection(); // If a connection is provided, use it, otherwise create a new one. Note that we are using promises in this function, so we need to use the promise() function to get a promise-based connection
    if (queriesCondition != "") queriesCondition = "WHERE " + queriesCondition; // Add WHERE if there is a condition (to avoid having to add it in the queries)
    if (limit) queriesCondition += " LIMIT 0, " + limit; // Add limit if there is one
    let items = [];

    // Get burgers
    let burgers = await db.query('SELECT count(*) AS count, name FROM (SELECT burger, identifier, name FROM spatulasUsers INNER JOIN spatulasBurgers ON spatulasUsers.burger = spatulasBurgers.identifier ' + queriesCondition + ') AS burgerClient GROUP BY name');
    items.push({name: "Burgers", count: burgers[0]});

    // Get fries
    let fries = await db.query('SELECT count(*) AS count, name FROM (SELECT fries, identifier, name FROM spatulasUsers INNER JOIN spatulasFries ON spatulasUsers.fries = spatulasFries.identifier ' + queriesCondition + ') AS friesClient GROUP BY name');
    items.push({name: "Fries", count: fries[0]});

    // Get drinks
    let drinks = await db.query('SELECT count(*) AS count, name FROM (SELECT drink, identifier, name FROM spatulasUsers INNER JOIN spatulasDrinks ON spatulasUsers.drink = spatulasDrinks.identifier ' + queriesCondition + ') AS drinkClient GROUP BY name');
    items.push({name: "Drinks", count: drinks[0]});

    // Get desserts
    let desserts = await db.query('SELECT count(*) AS count, name FROM (SELECT dessert, identifier, name FROM spatulasUsers INNER JOIN spatulasDesserts ON spatulasUsers.dessert = spatulasDesserts.identifier ' + queriesCondition + ') AS dessertClient GROUP BY name');
    items.push({name: "Desserts", count: desserts[0]});

    if (!conn) db.release(); // If we created a new connection, we need to release it
    callback(items);
}

/**
 * This function return wether or not the specified value is in the specified table
 * @param {String} tableName
 * @param {String} value
 * @param {any} connection
 * @returns {boolean}
 */
async function checkTable(tableName, value, connection = null) {
    conn = (connection) ? connection : pool.promise().getConnection();

    let result = await conn.query('SELECT * FROM ' + tableName + ' WHERE name = ?', [value]);
    if (result[0].length > 0) {
        return true;
    } else {
        return false;
    }
}

/**
 * Given an array of values, this function will check if they are in the specified table. The values in the array are in the same order as the table names in spatulasTables
 * @param {Array} values
 * @returns {Boolean}
 */
async function checkTables(values, connection = null) {
    let db = (connection) ? connection : pool.promise().getConnection();

    // First we get all tables
    let tables = await getTableNames(db);

    // Now we check for each table if the respective value in values is in it
    if (values.length == tables.length) { // If the number of values is the same as the number of tables
        for (let i = 0; i < tables.length; i++) {
            if (!(await checkTable(tables[i].foodName, values[i], db))) {
                return false;
            }
        }
        return true;
    } else { // If the number of values is not the same as the number of tables
        return false;
    }
}

/**
 * Retrieves from an HTTP request the values of all fields of tables stored in spatulasTables. The values will be automatically sanitized
 * @param {Any} body
 * @returns {Array} Array is in the same order as the table names in spatulasTables 
 */
async function getValuesFromRequest(body, connection = null) {
    let db = (connection) ? connection : pool.promise().getConnection();
    
    let values = [];
    let tables = await getTableNames(db);
    for (let i = 0; i < tables.length; i++) {
        // TODO : Retrieve values from body and sanitize them
        let value = body[tables[i].foodName];
        value = validator.escape(value);
        values.push(value);
    }
    return values;
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
 * This function will calculate the price of all combined items and return it. The array must have as much elements as there are tables in spatulasTables and order must be the same
 * @param {Array} values 
 * @param {*} connection 
 * @returns {float} The price of all combined items
 */

async function calculatePrice(values, connection = null) {
    let db = (connection) ? connection : pool.promise().getConnection();
    let tables = await getTableNames(db);
    if (values.length == tables.length) { // If the number of values is the same as the number of tables
        let price = 0.0;
        for (let i = 0; i < tables.length; i++) {
            let result = await db.query('SELECT price FROM ' + tables[i].foodName + ' WHERE name = ?', [values[i]]);
            price += result[0][0].price;
        }
        return price;
    } else { // If the number of values is not the same as the number of tables
        return -1;
    } 
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
                    conn.release();
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
                    conn.release();
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
                    conn.release();
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
                        conn.execute('DROP TABLE spatulasDesserts', () => {
                            createDatabase(conn);
                            conn.release();
                        })
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
    insertTable,
    insertRow,
    getUsers,
    getUntreatedUsers,
    getPreparationUsers,
    getReadyUsers,
    getDeliveredUsers,
    getUsersByStatus,
    getUsersByTime,
    searchUser,
    clearUsers,
    getTable,
    getTables,
    getTableNames,
    checkTables,
    getValuesFromRequest,
    countBurgers,
    getAllItemsCount,
    deleteBurger,
    calculatePrice,
    togglePrepare,
    toggleReady,
    toggleDelivered,
    purgeDatabase,
    refreshCommand,
}