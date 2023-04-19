var express = require('express');
const { body, query, check } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector');
let { createDatabase, insertUser, getUsers, getPreparationUsers, getReadyUsers, searchUser, calculatePrice, getUsersByStatus, getUsersByTime, getTables, insertTable, insertRow, checkTables, getValuesFromRequest, getTableNames } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, checkTime, getTimeIndex, checkPassword, getGlobalTimes, getTimeCount, checkAndRepairTimes } = require('./settingsUtilities');
let { sendTimeCount } = require('./webSocket');

async function init() {
  let conn = await pool.promise().getConnection();

  await createDatabase(conn);
  await insertTable("Burgers", "Cheeseburger", "This is a cheeseburger", 5, conn);
  await insertRow("Burgers", "Baconburger", "This is a baconBurger", 5, conn);
  await insertRow("Burgers", "Gourmet", "This is some serious gourmet shit !", 6, conn);
  await insertTable("Fries", "Frites paprika", "Miam !", 1, conn);
  await insertRow("Fries", "Sans frites", "Pas faim !", 0, conn);
  await insertTable("Drinks", "Canette", null, 1, conn);
  await insertRow("Drinks", "Pas soif", null, 0, conn);

  conn.release();
}
init();


// ! This is a temporary fix for the unlikely case all time stamps were removed, we add a new one set at "19h00" to prevent the system from breaking
checkAndRepairTimes();

/* GET home page. */
router.get('/',
  query('error').trim().escape(),
  function(req, res, next) {
    checkPassword(req.cookies.spatulasPower, (auth) => {
      getRegistration((registStatus) => {
        getRegistrationDay(async (day) => {
          // We will now access the MySQL database for all needed informations
          let conn = await pool.promise().getConnection()
          let tables = await getTables(conn);
          let times = await getGlobalTimes(conn);

          await conn.release(); // Releasing connection
          // Rendering home page
          res.render('home', { title: 'Home', admin: auth, registrationOpen: (registStatus || auth), userRegistrationOpen: registStatus, adminRegistrationOpen: auth, tables: tables, times: times, day: day, error: (req.query.error) ? req.query.error : null });
        })
      })
    })
});

router.get('/register', (req, res, next) => {
  res.render('error', { title: 'Error', message: "Wait ! You can't go there !", error: {status: 'You are probably using an incompatible browser, please try switching.', stack: 'If the error persists, please contact an administrator.'} });
})

router.get('/queue', 
  query('search-query').trim().escape(),
  (req, res, next) => {
    checkPassword(req.cookies.spatulasPower, async (auth) => {
      let connection = await pool.promise().getConnection();

      let users = await getUsersByTime(req.query["search-query"], "lastUpdated DESC", connection);
      let tables = await getTableNames(connection);
      let toEncodeUsers = await getUsers(null, connection);

      connection.release();

      res.render('queue', { title: 'Queue', admin: auth, searching: (req.query["search-query"]) ? true : false, users: users, tables: tables, jsTables: encodeURIComponent(JSON.stringify(tables)), jsUsers: encodeURIComponent(JSON.stringify(toEncodeUsers)) });
    })
})

router.post('/register', 
  body('lastName').trim().escape(), // Sanitizing user inputs
  body('firstName').trim().escape(),
  body("time").trim().escape(),
  body('accept').trim().escape(),
  (req, res, next) => {
    getRegistration((registStatus) => {
      checkPassword(req.cookies.spatulasPower, async (adminRegistStatus) => {
        if (registStatus || adminRegistStatus) { // Only allowing to post new commands if registrations are open or if it's an admin

          // We will now access the MySQL database for all needed informations
          let conn = await pool.promise().getConnection()
          let foods = await getValuesFromRequest(req.body, conn);
          let foodBoolean = await checkTables(foods, conn);
          let timeBool = await checkTime(req.body.time, conn);

          // Checking if the user filled all the fields and if the time stamp is valid
          if (req.body.lastName && req.body.lastName.length <= 32 && req.body.firstName && req.body.firstName.length <= 32 && req.body.time && req.body.accept == 'on' && timeBool && foodBoolean) {

            // Calculating the price of the order and inserting the user in the database
            let price = await calculatePrice(foods, conn);
            let insertResult = await insertUser(req.body.lastName, req.body.firstName, req.body.time, price, foods, conn);

            if (insertResult) { // If the user was successfully inserted in the database
              // Before sending user to queue, we send a message through websocket to inform of the change of remaining places on the time stamp
              getTimeCount((count) => {
                sendTimeCount(req.body.time, count);
                conn.release();
                res.redirect('/queue');
              }, req.body.time, conn)
            } else { // If the user was not successfully inserted in the database
              conn.release();
              res.redirect('/?error=true');
            }      
          } else { // If the user did not fill all the fields
            conn.release();
            res.redirect('/?error=true');
          }
        } else { // If the user tried to post a command while registrations were closed
          res.redirect('/');
        }
      })
    })
})

router.get('/terms', (req, res, next) => {
  checkPassword(req.cookies.spatulasPower, (auth) => {
    res.render('gtou', { title: "General Terms of Use", admin: auth });
  })
})

router.get('/cookies', (req, res, next) => {
  checkPassword(req.cookies.spatulasPower, (auth) => {
    res.render('cookies', { title: "Cookies", admin: auth });
  })
})

router.get('/credits', (req, res, next) => {
  checkPassword(req.cookies.spatulasPower, (auth) => {
    res.render('credits', { title: "Credits", admin: auth });
  })
})

router.get('/display', (req, res, next) => {
  pool.getConnection((err, conn) => {
    getPreparationUsers((userPrep) => {
      getReadyUsers((userReady) => {
        pool.releaseConnection(conn);
        res.render('room-display', { title: "Room display", userReady: userReady, userPreparation: userPrep })
      }, "lastUpdated", conn)
    }, "lastUpdated", conn)
  })
})

module.exports = router;
