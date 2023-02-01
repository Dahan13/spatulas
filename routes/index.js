var express = require('express');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector');
let { createDatabase, insertUser, getUsers, getBurgers, getFries, getDrinks, checkBurger, checkDrink, checkFries, searchUser, calculatePrice } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, checkTime, getTimeIndex, checkPassword } = require('./settingsUtilities');

createDatabase();

/* GET home page. */
router.get('/',
  query('error').trim().escape(),
  function(req, res, next) {
    getRegistration((registStatus) => {
      getRegistrationDay((day) => {
        pool.getConnection((err, conn) => {
          getBurgers((burgers, ) => {
            getFries((fries) => {
              getDrinks((drinks) => {
                getTimes((times) => {
                  checkPassword(req.cookies.spatulasPower, (auth) => {
                    res.render('home', { title: 'Home', admin: auth, registrationOpen: (registStatus || auth), userRegistrationOpen: registStatus, adminRegistrationOpen: auth, burgers: burgers, fries: fries, drinks: drinks, times: times, day: day, error: (req.query.error) ? req.query.error : null });
                  })
                }, true, conn)
              }, false, conn)
            }, false, conn)
          }, false, conn)
          pool.releaseConnection(conn);
        })
      })
    })
});

router.get('/queue', 
  query('first-name').trim().escape(),
  query('last-name').trim().escape(),
  query('index').trim().escape().toInt(),
  (req, res, next) => {
    checkPassword(req.cookies.spatulasPower, (auth) => {
      if (req.query['first-name'] || req.query['last-name']) {
        searchUser(req.query['first-name'], req.query['last-name'], (users) => {
          res.render('queue', { title: 'Queue', admin: auth, searching: true, users: users, notEmpty: (typeof users !== "undefined" && users.length > 0) ? true : false });
        })
      } else {
        getTimes((times) => {
          let index = (req.query.index && req.query.index < times.length && req.query.index >= 0) ? req.query.index : 0; // First we get our index and define it to 0 if the value is wrong
            getUsers((users) => {
              res.render('queue', { title: 'Queue', admin: auth, searching: false, users: users, notEmpty: (typeof users !== "undefined" && users.length > 0) ? true : false, timeStamp: times[index], previousTime: (index > 0) ? "/queue?index=" + (index - 1) : null, nextTime: (index < times.length - 1) ? "/queue?index=" + (index + 1) : null });
            }, 0, times[index])
        }, false)
      }
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
                  }, true, conn)
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
    conn.query("SELECT userId FROM spatulasUsers WHERE preparation=1 AND ready=0 AND delivered=0 ORDER BY time", (err, userPrep) => {
      conn.query("SELECT userId FROM spatulasUsers WHERE ready=1 AND delivered=0 ORDER BY time", (err, userReady) => {
        pool.releaseConnection(conn);
        res.render('room-display', { title: "Room display", userReady: userReady, userPreparation: userPrep })
      })
    })
  })
})

module.exports = router;
