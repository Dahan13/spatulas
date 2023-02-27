var express = require('express');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector');
let { createDatabase, insertUser, getUsers, getPreparationUsers, getReadyUsers, getBurgers, getFries, getDrinks, checkBurger, checkDrink, checkFries, searchUser, calculatePrice, getUsersByStatus, getUsersByTime } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, checkTime, getTimeIndex, checkPassword, getGlobalTimes } = require('./settingsUtilities');

createDatabase();

/* GET home page. */
router.get('/',
  query('error').trim().escape(),
  function(req, res, next) {
    checkPassword(req.cookies.spatulasPower, (auth) => {
      getRegistration((registStatus) => {
        getRegistrationDay((day) => {
          pool.getConnection((err, conn) => {
            getBurgers((burgers, ) => {
              getFries((fries) => {
                getDrinks((drinks) => {
                  getGlobalTimes((times) => {
                    res.render('home', { title: 'Home', admin: auth, registrationOpen: (registStatus || auth), userRegistrationOpen: registStatus, adminRegistrationOpen: auth, burgers: burgers, fries: fries, drinks: drinks, times: times, day: day, error: (req.query.error) ? req.query.error : null });
                  }, conn)
                }, false, conn)
              }, false, conn)
            }, false, conn)
            pool.releaseConnection(conn);
          })
        })
      })
    })
});

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
                  checkTime(req.body.time, (timeBool) => { // Checking that all inputs are in database
                    if (req.body.lastName && req.body.lastName.length <= 32 && req.body.firstName && req.body.firstName.length <= 32 && req.body.burger && req.body.fries && req.body.drink && req.body.time && req.body.accept == 'on' && burgerBool && drinkBool && friesBool && timeBool) {
                      calculatePrice(req.body.burger, req.body.fries, req.body.drink, (price) => {
                        insertUser(req.body.lastName, req.body.firstName, req.body.burger, req.body.fries, req.body.drink, req.body.time, price, conn);
                        getTimeIndex(req.body.time, (index) => {
                          pool.releaseConnection(conn);
                          res.redirect('/queue?index=' + index);
                        }, conn)
                      }, conn);
                    } else {
                      pool.releaseConnection(conn);
                      res.redirect('/?error=true');
                    }
                  }, (adminRegistStatus) ? null : true, conn)
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
