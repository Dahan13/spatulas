const pool = require('./databaseConnector');
const crypto = require('crypto');
let { setRegistration } = require('./settingsUtilities');
let { getTimes, timeEnabled, getTimeFormat } = require('./timeUtilities');
let { getTablesInfos, getTables } = require('./databaseTablesUtilities');

/**
 * This function will update all commands time given their datetime and the current format
 * @param {*} connection
 */
async function updateCommandsTime(connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();

    let format = (await getTimeFormat() == "day") ? "%d/%m/%Y %H:%i" : "%H:%i";
    await db.query("UPDATE spatulasCommands SET time = IF(unformated_time IS NOT NULL, DATE_FORMAT(unformated_time, ?), NULL)", [format]);

    if (!connection) connection.release();

    return;
}

/**
 * This function will generate a random string of characters, and will append it to a given id and a list of values.
 * Length is fixed at 30 characters
 * @param {int} id 
 * @param {Array} values Usually food values, the values should be chosen so that the resulting string is unique
 * @returns {string} A string containing the id and the random string
 */
function generateRandomString(id, values) {
    let randomString = crypto.getRandomValues(new Uint32Array(3)).join("");
    return "" + id + randomString + values.join("");
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
 * @returns {String | int} the session key of the command
 */
async function insertCommand(lastName, firstName, time, price, foods, connection = null) {
    db = (connection) ? connection : await pool.promise().getConnection();
    if (price < 0) {
        price = 0;
    }

    // Checking if timestamps are enabled
    let timeEnabledBool = await timeEnabled(db);
    if (!timeEnabledBool) {
        time = null; // If timestamps are not enabled, we set the time to null
    }

    // Getting our tables infos
    let tableNumber = await getTablesInfos(db);

    // * Now we are gonna assemble our query

    // We create the different variables for the query
    let columnNames = '(lastName, firstName, unformated_time, price'
    let valuesString = '(?, ?, ?, ?';
    let valuesArray = [lastName, firstName, time, price];
    let foodIndex = 0; // The index of the food we are currently adding, we keep it separate from i because we might skip some foods
    for (let i = 0; i < tableNumber.length; i++) {
        if (tableNumber[i].empty) continue; // If the table is empty, we skip it
        valuesArray.push(foods[foodIndex]);
        valuesString += ', ? ';
        columnNames += ', `' + tableNumber[i].foodName + '`';
        foodIndex++;
        if (foodIndex == foods.length) break; // If we added all the foods, we stop
    }
    columnNames += ')';
    valuesString += ')';

    // Executing the query
    let insertResult = await db.execute('INSERT INTO spatulasCommands ' + columnNames + ' VALUES ' + valuesString, valuesArray)

    // We will generate a random string using the id and foods, and we will add it to the row
    let id = insertResult[0].insertId;
    let randomString = generateRandomString(id, foods);
    await db.execute('UPDATE spatulasCommands SET sessionKey = ? WHERE commandId = ?', [randomString, id]);

    // Handling the time stamps and its format
    if (time != null) {
        let format = (await getTimeFormat() == "day") ? "%d/%m/%Y %H:%i" : "%H:%i";
        await db.execute('UPDATE spatulasCommands SET time=DATE_FORMAT(unformated_time, ?)', [format]);
    }

    // Check if all time slots are full
    if (timeEnabledBool) {
        let times = await getTimes(db);
        for (let i = 0; i < times.length; i++) {
            if (!times[i].full) { // If at least one time slot is not full, we return
                // Releasing the connection if it was not passed as a parameter
                if (!connection) {
                    db.release();
                }
                return randomString;
            }
        }
        // If we are here, it means that all time slots are full, we close registration
        setRegistration(false);
    }
    

    // Releasing the connection if it was not passed as a parameter
    if (!connection) {
        db.release();
    }

    return randomString;
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
                commandString += separator;
            }
        }

        command.foodString = commandString.substring(0, commandString.length - separator.length);
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

    let timeStatus = await timeEnabled(db);
    if (timeStatus) {
        let sortedcommands = [];
        let times = await getTimes(db);
    
        for (let i = 0; i < times.length; i++) {
            sortedcommands[i] = {}; // Create a new object for this time stamp
            sortedcommands[i]["timeSettings"] = times[i]; // Add the time stamp to the list
    
            let commandsFound = await getCommands("time LIKE \'" + times[i].time + "\'", searchString, orderCriteria, null, false, db); // Get all commands that have been added at this time stamp (we use the getCommands function to do so)
            sortedcommands[i]["users"] = (commandsFound.length > 0) ? commandsFound : null; // If there are no commands, we set the value to null
        }
    
        if (!conn) db.release(); // If we created a new connection, we need to release it
    
        // Return the list
        return sortedcommands;
    } else {
        let commandsFound = await getCommands(null, searchString, orderCriteria, null, false, db); // Get all commands that have been added at this time stamp (we use the getCommands function to do so)
        if (!conn) db.release(); // If we created a new
        return commandsFound;
    }
}

async function clearUsers(connection = null) {
    db = (connection) ? connection : await pool.promise().getConnection();

    // Dropping the table
    await db.query('TRUNCATE TABLE spatulasCommands');
    db.release();
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

async function refreshCommand(userId, conn = null) {
    let db = (conn) ? conn : pool.promise.getConnection();
    await db.execute('UPDATE spatulasCommands SET lastUpdated = NOW() WHERE commandId = ?', [userId]);

    if (!conn) db.release();

    return;
}

/**
 * Given a session ID, the system will check if there is a command under this ID, if it is, it returns the command, otherwise it returns null
 * @param {String} sessionKey
 * @param {*} connection
 * @returns {Object | null} The command if it exists, null otherwise
 */
async function checkSession(sessionKey, connection = null) {
    let db = (connection) ? connection : await pool.promise().getConnection();
    let result = await getCommands('sessionKey = \'' + sessionKey + '\'', null, null, null, true, db);

    if (!connection) db.release();

    return (result.length > 0) ? result[0] : null;
}

module.exports = {
    insertCommand,
    updateCommandsTime,
    getCommands,
    getUsersByStatus,
    getCommandsByTime,
    createCommandFoodString,
    clearUsers,
    toggleCommandBoolean,
    refreshCommand,
    generateRandomString,
    checkSession
}