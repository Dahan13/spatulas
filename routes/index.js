var express = require('express');
const { body, query, check } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector');
let { createDatabase, insertUser, getUsers, getPreparationUsers, getReadyUsers, checkBurger, searchUser, calculatePrice, getUsersByStatus, getUsersByTime, getTables, insertTable, insertRow } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, checkTime, getTimeIndex, checkPassword, getGlobalTimes, getTimeCount, checkAndRepairTimes } = require('./settingsUtilities');
let { sendTimeCount } = require('./webSocket');

async function init() {
  await createDatabase();
  await insertTable("Burgers", "Cheeseburger", "This is a cheeseburger", 5);
  await insertTable("Fries", "Frites paprika", "Miam !", 1);
  await insertRow("Fries", "Sans frites", "Pas faim !", 0);
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
        getRegistrationDay((day) => {
          pool.getConnection(async (err, conn) => {
            let tables = await getTables(conn);
            getGlobalTimes((times) => {
              pool.releaseConnection(conn);
              res.render('home', { title: 'Home', admin: auth, registrationOpen: (registStatus || auth), userRegistrationOpen: registStatus, adminRegistrationOpen: auth, tables: tables, times: times, day: day, error: (req.query.error) ? req.query.error : null });
            }, conn)
          })
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
    checkPassword(req.cookies.spatulasPower, (auth) => {
      getUsersByTime((users) => {
        res.render('queue', { title: 'Queue', admin: auth, searching: (req.query["search-query"]) ? true : false, users: users });
      }, req.query["search-query"], "lastUpdated DESC")
    })
})

router.post('/register', 
  body('lastName').trim().escape(), // Sanitizing user inputs
  body('firstName').trim().escape(),
  body('burger').trim().escape(),
  body('fries').trim().escape(),
  body('drink').trim().escape(),
  body('dessert').trim().escape(),
  body("time").trim().escape(),
  body('accept').trim().escape(),
  (req, res, next) => {
    getRegistration((registStatus) => {
      checkPassword(req.cookies.spatulasPower, (adminRegistStatus) => {
        if (registStatus || adminRegistStatus) { // Only allowing to post new commands if registrations are open or if it's an admin
          pool.getConnection((err, conn) => {
            checkBurger(req.body.burger, (burgerBool) => {
              checkDrink(req.body.drink, (drinkBool) => {
                checkFries(req.body.fries, (friesBool) => {
                  checkDessert(req.body.dessert, (dessertBool) => {
                    checkTime(req.body.time, (timeBool) => { // Checking that all inputs are in database
                      if (req.body.lastName && req.body.lastName.length <= 32 && req.body.firstName && req.body.firstName.length <= 32 && req.body.burger && req.body.fries && req.body.drink && req.body.time && req.body.accept == 'on' && burgerBool && drinkBool && friesBool && dessertBool && timeBool) {
                        calculatePrice(req.body.burger, req.body.fries, req.body.drink, req.body.dessert, (price) => {
                          insertUser(req.body.lastName, req.body.firstName, req.body.burger, req.body.fries, req.body.drink, req.body.dessert, req.body.time, price, conn);

                          // Before sending user to queue, we send a message through websocket to inform of the change of remaining places on the time stamp
                          getTimeCount((count) => {
                            sendTimeCount(req.body.time, count);
                            pool.releaseConnection(conn);
                            res.redirect('/queue');
                          }, req.body.time, conn)
                        
                        }, conn);
                      } else {
                        pool.releaseConnection(conn);
                        res.redirect('/?error=true');
                      }
                    }, (adminRegistStatus) ? null : true, conn)
                  }, conn)
                }, conn)
              }, conn)
            }, conn)
          })
        } else {
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
