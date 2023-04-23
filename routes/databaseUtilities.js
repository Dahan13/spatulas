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
 * Insert a command into the database, it will also close registration if all time stamps are full
 * Given good array must be in the same order as in spatulasTables
 * @param {string} lastName 
 * @param {string} firstName 
 * @param {int} time 
 * @param {float} price
 * @param {Array} foods
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @returns {boolean} True if the command was inserted, false if the command was not inserted
 */
async function insertCommand(lastName, firstName, time, price, foods, connection = null) {
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

            // Releasing the connection if it was not passed as a parameter
            if (!connection) {
                db.release();
            }

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
 * Returns a list containing all commands, it also can optionally order the results, add some conditions for the query
 * It can also return only the commands that match a search string (i.e each element of the search string is either in the first name or last name of the user).
 * It can also limit the number of results returned.
 * @param {string} conditions
 * @param {string} orderCriteria
 * @param {string} searchString
 * @param {int} limit
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @returns {Array} An array containing all the commands matching the parameters
 */
async function getCommands(conditions = null, searchString = null, orderCriteria = null, limit = null, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();
    let queryString = "";

    searchString = buildSearchStringForQuery(searchString);
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

    if (limit) {
        queryString += ' LIMIT ' + limit;
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
 * This function returns a list of users according to their status, it can optionally order each category of users according to a criteria
 * @param {string} orderCriteria1
 * @param {string} orderCriteria2
 * @param {string} orderCriteria3
 * @param {string} orderCriteria4
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @returns {Array} An array containing all the users, non-treated, in preparation, ready and delivered, ordered with the given criteria
 */
async function getUsersByStatus(orderCriteria1 = null, searchString1 = null, orderCriteria2 = null, searchString2 = null, orderCriteria3 = null, searchString3 = null, orderCriteria4 = null, searchString4 = null, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let untreatedUsers = await getCommands('preparation = 0 AND ready = 0 AND delivered = 0', searchString1, orderCriteria1, null, db);
    let preparationUsers = await getCommands('preparation = 1 AND ready = 0 AND delivered = 0', searchString2, orderCriteria2, null, db);
    let readyUsers = await getCommands('ready = 1 AND delivered = 0', searchString3, orderCriteria3, null, db);
    let deliveredUsers = await getCommands('delivered = 1', searchString4, orderCriteria4, null, db);


    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    return untreatedUsers.concat(preparationUsers).concat(readyUsers).concat(deliveredUsers);
}

/**
 * This function will, given a list of commands, add to each command a String containing all commands' food, separated by a given separator
 * @param {Array} commands
 * @param {String} separator
 * @param {*} connection
 * @return {void}
 */
async function createCommandFoodString(commands, separator = " ", connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();
    let tables = await getTableNames(db);

    for (let i = 0; i < commands.length; i++) {
        let commandString = "";
        let command = commands[i];

        let food = await db.query('SELECT * FROM spatulasCommands WHERE commandId = ?', [command.commandId]);
        food = food[0];
        for (let j = 0; j < tables.length; j++) {
            if (food[0][tables[j].foodName]) {
                commandString += food[0][tables[j].foodName];
                if (j != tables.length - 1) {
                    commandString += separator;
                }
            }
        }

        command.foodString = commandString;
    }

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }
}

/**
 * This function returns a list of doublets, first containing the time stamp, then all commands that have been added at this time stamp.
 * This function may also optionally search for commands, given a string of names.
 * @param {function} callback
 * @param {string} searchString
 * @returns {Array} => [[time, [commands]], [time, [commands]], ...]
 */
async function getCommandsByTime(searchString = "", orderCriteria = "userId", conn) {
    let db = (conn) ? conn : await pool.promise().getConnection(); // If a connection is provided, use it, otherwise create a new one. Note that we are using promises in this function, so we need to use the promise() function to get a promise-based connection
    let sortedcommands = [];
    let times = await getGlobalTimes(db);

    for (let i = 0; i < times.length; i++) {
        sortedcommands[i] = {}; // Create a new object for this time stamp
        sortedcommands[i]["timeSettings"] = times[i]; // Add the time stamp to the list
        
        let commandsFound = await getCommands("time LIKE \'" + times[i].time + "\'", searchString, orderCriteria, null, db); // Get all commands that have been added at this time stamp (we use the getCommands function to do so)
        sortedcommands[i]["users"] = (commandsFound.length > 0) ? commandsFound : null; // If there are no commands, we set the value to null
    }

    if (!conn) db.release(); // If we created a new connection, we need to release it

    // Return the list
    return sortedcommands;
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
async function getTablesCount(queriesCondition = "", limit = null, conn = null) {
    let db = (conn) ? conn : await pool.promise().getConnection(); // If a connection is provided, use it, otherwise create a new one. Note that we are using promises in this function, so we need to use the promise() function to get a promise-based connection

    if (queriesCondition != "") queriesCondition = "WHERE " + queriesCondition; // Add WHERE if there is a condition (to avoid having to add it in the queries)
    if (limit) queriesCondition += " LIMIT 0, " + limit; // Add limit if there is one
    let items = [];

    // Getting table names
    let tables = await getTableNames(db);

    // Iterating over each table
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i].foodName;
        let itemsFound = await db.query('SELECT count(*) AS count, name FROM (SELECT ' + table + ', name FROM spatulasCommands INNER JOIN ' + table + ' ON spatulasCommands.' + table + ' = ' + table + '.name ' + queriesCondition + ') AS tempClient GROUP BY name');
        items.push({name: table, count: itemsFound[0]});
    }

    if (!conn) db.release(); // If we created a new connection, we need to release it
    return items;
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

/**
 * This function will toggle one of the status of a command. It will also update the lastUpdated field of the user
 * @param {String} userId
 * @param {String} statusToUpdate
 * @param {*} connection
 */
async function toggleCommandBoolean(userId, statusToUpdate, connection = null) {
    let db = (connection) ? connection : pool.promise().getConnection();
    let result = await db.query('SELECT ' + statusToUpdate + ' FROM spatulasCommands WHERE commandId = ?', [userId]);
    let status = result[0][0][statusToUpdate];
    await db.query('UPDATE spatulasCommands SET ' + statusToUpdate + ' = ? WHERE commandId = ?', [(status) ? 0 : 1, userId]);

    // We update the lastUpdated field of the user
    await refreshCommand(userId, db);

    if (!connection) db.release();

    return;
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

async function refreshCommand(userId, conn = null) {
    let db = (conn) ? conn : pool.promise.getConnection();
    await db.execute('UPDATE spatulasCommands SET lastUpdated = NOW() WHERE commandId = ?', [userId]);

    if (!conn) db.release();

    return;
}

module.exports = {
    createDatabase,
    insertCommand,
    insertTable,
    insertRow,
    getCommands,
    getUsersByStatus,
    getCommandsByTime,
    createCommandFoodString,
    clearUsers,
    getTable,
    getTables,
    getTableNames,
    checkTables,
    getValuesFromRequest,
    countBurgers,
    getTablesCount,
    deleteBurger,
    calculatePrice,
    toggleCommandBoolean,
    purgeDatabase,
    refreshCommand,
}