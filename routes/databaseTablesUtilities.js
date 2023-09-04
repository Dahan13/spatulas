const pool = require('./databaseConnector');

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

module.exports = {
    insertTable,
    insertRow,
    getTable,
    getTables,
    getTableInfos,
    getTablesInfos,
    checkTables,
    getTablesCount,
    deleteElement,
    deleteTable,
    calculatePrice,
}