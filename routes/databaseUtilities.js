const pool = require('./databaseConnector');
const validator = require('validator');
let { setRegistration, getGlobalTimes } = require('./settingsUtilities');

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
 * @param {int} tableId
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically. The connection must be able to handle promises
 */
async function getTable(tableId, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // Checking if the table exists in spatulasTables
    let queryResult = await db.query('SELECT * FROM spatulasTables WHERE tableId = ?', [tableId]);
    let rows = queryResult[0];
    if (rows.length == 0) {
        return null;
    }

    // Getting the table's content
    queryResult = await db.query('SELECT * FROM `' + rows[0].foodName + '`');
    rows = queryResult[0];

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
 * Returns the informations related to a table stored in spatulasTables.
 * @param {int} tableId
 * @param {Any} connection
 * @returns {Object} An object containing the infos of the table, or null if the table does not exist.
 * Object{foodName: string, id: int, count: int, empty: boolean}
 */
async function getTableInfos(tableId, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let infos = {};
    // First we check for the table existence in our system
    let queryResult = await db.query('SELECT * FROM spatulasTables WHERE tableId = ?', [tableId]);
    let rows = queryResult[0];
    if (rows.length == 0) {
        return null;
    } else {
        infos.foodName = rows[0].foodName;
        infos.tableId = rows[0].tableId;
    }

    // Now we get the table
    let table = await getTable(tableId, db);
    infos.count = (table?.length) ? table.length : 0;
    infos.empty = (table?.length) ? false : true;

    // Releasing the connection if it was not passed as a parameter
    if (!connection) db.release();

    return infos;
}

/**
 * Returns a list containing the infos of the tables stored in the spatulasTables table.
 * For now, it returns the name of each table (foodName), their id (id), the number of rows in each table (count) and if the table is empty or not (empty)
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically. The connection must be able to handle promises
 * @returns {Array} A list containing all the names of the tables stored in the spatulasTables table
 */
async function getTablesInfos(connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // Getting the table names and ids
    let queryResult = await db.query('SELECT * FROM spatulasTables');
    let rows = queryResult[0];

    // Now for each table, we will get it's number of rows and whether it's empty or not
    for (let i = 0; i < rows.length; i++) {
        let table = await getTable(rows[i].tableId, db);
        rows[i].count = (table?.length) ? table.length : 0;
        rows[i].empty = (table?.length) ? false : true;
    }

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    // Returning the table names
    return rows;
}

/**
 * Returns a list containing objects, containing infos of each table with a list of all rows of the table stored in the spatulasTables table.
 * 
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @return {Array} of Object{infos: Object{foodName: string, tableId: int, count: int, empty: boolean}, content: Array{Object{}}}
 */
async function getTables(connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // Getting all the table names
    let tablesInfos = await getTablesInfos(db);

    // Now getting all data
    let tablesContent = [];
    for (let i = 0; i < tablesInfos.length; i++) {
        let tableContent = {};
        tableContent.infos = tablesInfos[i];
        tableContent.content = await getTable(tablesInfos[i].tableId, db);
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
 * @returns {boolean} True if the table was created, false if the table already exists
 */
async function insertTable(tableName, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // if the table already exists, return
    let tables = await db.query("SELECT * FROM spatulasTables WHERE foodName = ?", [tableName]);
    if (tables[0].length > 0) {
        return false;
    } else {
        await db.query("DROP TABLE IF EXISTS `" + tableName + "`"); // Just in case the named table somehow exists in the database but is not stored within spatulasTables
    }

    // Inserting the table name in the spatulasTables table
    await db.query('INSERT INTO spatulasTables (foodName) VALUES (?)', [tableName]);

    // Creating the table
    await db.query('CREATE TABLE `' + tableName + '` (id INT PRIMARY KEY NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL, description VARCHAR(255) DEFAULT NULL, price FLOAT DEFAULT 0.0)');

    // Adding the column to the spatulasCommands table
    await db.query('ALTER TABLE spatulasCommands ADD `' + tableName + '` VARCHAR(255) DEFAULT NULL REFERENCES `' + tableName + '` (id)');

    // Releasing the connection if it was not passed as a parameter
    if (connection == null) {
        db.release();
    }

    return true;
}

/**
 * Inserts a row in the given table with the given name, description and price (both are optional)
 * @param {int} tableId
 * @param {string} name
 * @param {string} description
 * @param {float} price
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 */
async function insertRow(tableId, name, description = null, price = null, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    // We check if the table already exists
    let tables = await db.query("SELECT * FROM spatulasTables WHERE tableId = ?", [tableId]);
    if (tables[0].length == 0) {
        return;
    }

    // We check if the name is not null
    if (name == null) {
        return;
    }

    // Inserting the row
    await db.query('INSERT INTO `' + tables[0][0].foodName + '` (name, description, price) VALUES (?, ?, ?)', [name, description, price]);

    // Releasing the connection if it was not passed as a parameter
    if (connection == null) {
        db.release();
    }

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
    if (price < 0) {
        price = 0;
    }

    // Getting our tables infos
    let tableNumber = await getTablesInfos(db);

    // * Now we are gonna assemble our query

    // We create the different variables for the query
    let columnNames = '(lastName, firstName, time, price, '
    let valuesString = '(?, ?, ?, ?, ';
    let valuesArray = [lastName, firstName, time, price];
    let foodIndex = 0; // The index of the food we are currently adding, we keep it separate from i because we might skip some foods
    for (let i = 0; i < tableNumber.length; i++) {
        if (tableNumber[i].empty) continue; // If the table is empty, we skip it
        valuesArray.push(foods[foodIndex]);
        valuesString += '? ';
        columnNames += '`' + tableNumber[i].foodName + '`';
        if (foodIndex != foods.length - 1) {
            columnNames += ', ';
            valuesString += ', ';
        }
        foodIndex++;
        if (foodIndex == foods.length) break; // If we added all the foods, we stop
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
 * Returns a string adapted to be used in a query after the WHERE clause for spatulasCommands.
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
 * @param {boolean} convertFoodIdToName If true, the function will convert the foodId to the food name
 * @param {Any} connection An optional connection to the database, if none is provided, it will use the pool automatically
 * @returns {Array} An array containing all the commands matching the parameters
 */
async function getCommands(conditions = null, searchString = null, orderCriteria = null, limit = null, convertFoodIdToName = false, connection = null) {
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
    value = value[0]

    // We convert the food id to their name if needed
    // ! This operation is very costly, it is possible to bypass the need for it in the back end with a bit a witchcraft
    if (convertFoodIdToName) {
        let tablesInfos = await getTables(db);
        for (let i = 0; i < value.length; i++) { // for each command
            for (let k = 0; k < tablesInfos.length; k++) { // for each table
                if (value[i][tablesInfos[k].infos.foodName]) {
                    for (let j = 0; j < tablesInfos[k].content.length; j++) { // for each food
                        if (value[i][tablesInfos[k].infos.foodName] == tablesInfos[k].content[j].id) {
                            value[i][tablesInfos[k].infos.foodName] = tablesInfos[k].content[j].name;
                            break;
                        }
                    }
                }
            }

        }
    }

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    return value
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

    let untreatedUsers = await getCommands('preparation = 0 AND ready = 0 AND delivered = 0', searchString1, orderCriteria1, null, true, db);
    let preparationUsers = await getCommands('preparation = 1 AND ready = 0 AND delivered = 0', searchString2, orderCriteria2, null, true, db);
    let readyUsers = await getCommands('ready = 1 AND delivered = 0', searchString3, orderCriteria3, null, true, db);
    let deliveredUsers = await getCommands('delivered = 1', searchString4, orderCriteria4, null, true, db);


    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    return untreatedUsers.concat(preparationUsers).concat(readyUsers).concat(deliveredUsers);
}

/**
 * This function will, given a list of commands, add to each command a String containing all commands' food, separated by a given separator.
 * It adds to eah object in commands a new property called "foodString" containing the string.
 * @param {Array} commands
 * @param {String} separator
 * @param {*} connection
 * @return {void}
 */
async function createCommandFoodString(commands, separator = " ", connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();
    let tables = await getTablesInfos(db);

    for (let i = 0; i < commands.length; i++) {
        let commandString = "";
        let command = commands[i];

        for (let j = 0; j < tables.length; j++) {
            if (command[tables[j].foodName]) {
                commandString += command[tables[j].foodName];
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

        let commandsFound = await getCommands("time LIKE \'" + times[i].time + "\'", searchString, orderCriteria, null, false, db); // Get all commands that have been added at this time stamp (we use the getCommands function to do so)
        sortedcommands[i]["users"] = (commandsFound.length > 0) ? commandsFound : null; // If there are no commands, we set the value to null
    }

    if (!conn) db.release(); // If we created a new connection, we need to release it

    // Return the list
    return sortedcommands;
}

async function clearUsers(connection = null) {
    db = (connection) ? connection : await pool.promise().getConnection();

    // Dropping the table
    await db.query('TRUNCATE TABLE spatulasCommands');
    db.release();
}

/**
 * Count the number of each item (burger, fries, drink), in a list of lists
 * @param {function} callback
 * @param {*} connection
 * @param {String} queriesCondition
 * @returns {Array} => [ {infos: Object{foodName: String, id: int, count: int, empty: boolean}, count: [ {name, count} ] }, ...]
 */
async function getTablesCount(queriesCondition = "", limit = null, conn = null) {
    let db = (conn) ? conn : await pool.promise().getConnection(); // If a connection is provided, use it, otherwise create a new one. Note that we are using promises in this function, so we need to use the promise() function to get a promise-based connection

    // Adding the queries condition
    if (queriesCondition != "") queriesCondition = "WHERE " + queriesCondition; // Add WHERE if there is a condition (to avoid having to add it in the queries)
    if (limit) queriesCondition += " LIMIT 0, " + limit; // Add limit if there is one

    let items = [];

    // Getting table names
    let tables = await getTablesInfos(db);

    // Iterating over each table
    for (let i = 0; i < tables.length; i++) {
        let itemsFound = await db.query('SELECT count(*) AS count, id, name FROM (SELECT `' + tables[i].foodName + '`, id, name FROM spatulasCommands s INNER JOIN `' + tables[i].foodName + '` f ON s.`' + tables[i].foodName + '` = f.id ' + queriesCondition + ') AS tempClient GROUP BY id');
        items.push({ infos: tables[i], count: itemsFound[0] });
    }

    if (!conn) db.release(); // If we created a new connection, we need to release it
    return items;
}

/**
 * This function return wether or not the specified value is in the specified table
 * It checks whether or not the value is in the name or id column
 * @param {String} tableName
 * @param {String | int} value
 * @param {any} connection
 * @returns {boolean}
 */
async function checkTable(tableName, value, connection = null) {
    conn = (connection) ? connection : pool.promise().getConnection();

    let result = await conn.query('SELECT * FROM `' + tableName + '` WHERE name = ? OR id = ?', [value, value]);
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
    let tables = await getTablesInfos(db);

    // Now we check for each table if the respective value in values is in it
    let tablesIndex;
    let valuesIndex = 0; // * We will use different indexes for the tables and the values, because we may have empty tables. If we have an empty table, we don't increment the values index
    for (tablesIndex = 0; tablesIndex < tables.length; tablesIndex++) {
        if (tables[tablesIndex].empty) continue; // If the table is empty, we skip it
        if (!(await checkTable(tables[tablesIndex].foodName, values[valuesIndex], db))) {
            return false;
        }
        valuesIndex++; // We increment the values index
        if (valuesIndex == values.length) break; // If we reached the end of the values array, we stop the loop (we don't want to check tables that don't have a value in values)
    }
    return true;
}

/**
 * Retrieves from an HTTP request the values of all fields of tables stored in spatulasTables. The values will be automatically sanitized
 * @param {Any} body
 * @returns {Array} Array is in the same order as the table names in spatulasTables 
 */
async function getValuesFromRequest(body, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let values = [];
    let tables = await getTablesInfos(db);
    for (let i = 0; i < tables.length; i++) {
        if (!(tables[i].empty)) {
            let value = body[tables[i].foodName];
            value = validator.escape(value);
            values.push(value);
        }
    }
    return values;
}

/**
 * Deletes the specified table
 * @param {int} tableId
 * @param {*} connection
 */
async function deleteTable(tableId, connection = null) {
    let conn = (connection) ? connection : await pool.promise().getConnection();

    let tables = await getTablesInfos(conn);

    // Iterating over each table
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].tableId == tableId) { // If the table name is the same as the one we want to delete from
            // Delete the column in spatulasCommands
            await conn.execute('ALTER TABLE spatulasCommands DROP COLUMN `' + tables[i].foodName + '`');
            // Delete the name of the table in spatulasTables
            await conn.execute('DELETE FROM spatulasTables WHERE tableId = ?', [tableId]);
            // Delete the table
            await conn.execute('DROP TABLE `' + tables[i].foodName + '`');
            break;
        }
    }

    if (!connection) conn.release();

    return;
}

/**
 * Deletes the specified element from a specified table
 * @param {int} foodId
 * @param {int} tableId
 * @param {*} connection 
 */
async function deleteElement(foodId, tableId, connection = null) {
    conn = (connection) ? connection : await pool.promise().getConnection();

    let tables = await getTablesInfos(conn);

    // Iterating over each table
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].tableId == tableId) { // If the table name is the same as the one we want to delete from
            await conn.execute('DELETE FROM `' + tables[i].foodName + '` WHERE id = ?', [foodId]);
            break;
        }
    }

    if (!connection) conn.release();

    return;
}

/**
 * This function will calculate the price of all combined items and return it. The array must have elements in the same order as in spatulasTables
 * @param {Array} values 
 * @param {*} connection 
 * @returns {float} The price of all combined items
 */

async function calculatePrice(values, connection = null) {
    let db = (connection) ? connection : pool.promise().getConnection();
    let tables = await getTablesInfos(db);

    let price = 0.0;
    let valuesIndex = 0;
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].empty) continue; // If the table is empty, we skip it
        let result = await db.query('SELECT price FROM `' + tables[i].foodName + '` WHERE name = ? OR id = ?', [values[valuesIndex], values[valuesIndex]]);
        price += result[0][0].price;
        valuesIndex++;
    }

    if (!connection) db.release();

    return price;
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

/**
 * Destroy the database and recreate it
 * @param {*} connection 
 * @returns 
 */
async function purgeDatabase(connection = null) {
    let conn = (connection) ? connection : await pool.promise().getConnection();

    await conn.query('DROP TABLE IF EXISTS spatulasCommands');

    // Getting table names
    let tables = await getTablesInfos(conn);
    for (let i = 0; i < tables.length; i++) {
        await conn.query('DROP TABLE IF EXISTS `' + tables[i].foodName + '`');
    }

    await conn.query('DROP TABLE IF EXISTS spatulasTables');
    await conn.query('DROP TABLE IF EXISTS spatulasCheckboxes');

    await createDatabase(conn);
    conn.release();

    return;
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
    getTableInfos,
    getTablesInfos,
    checkTables,
    getValuesFromRequest,
    getTablesCount,
    deleteElement,
    deleteTable,
    calculatePrice,
    toggleCommandBoolean,
    purgeDatabase,
    refreshCommand,
}