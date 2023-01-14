var express = require('express');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector')
let { getUsers, getBurgers, getFries, getDrinks, searchUser, countBurgers, countFries, countDrinks, insertBurger, deleteBurger, deleteFries, deleteDrink, insertFries, insertDrink, clearUsers, convertFoodIdToFoodName, purgeDatabase } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, getLimit, setRegistration, setRegistrationDay, setLimit, addTime, removeTime, getPassword, checkPassword, authenticate, setPassword } = require('./settingsUtilities');

/* GET users listing. */
router.get('/', function(req, res, next) {
  checkPassword(req.cookies.spatulasPower, (result) => {
    res.render('auth', { title: 'Authentification', authentified: result });
  })
});

router.post('/', 
body('password').trim().escape(),
(req, res, next) => {
  checkPassword(req.body.password, (result) => {
    if (result) {
      res.cookie('spatulasPower', req.body.password);
    }
    res.redirect('/spadmin');
  })
})

router.get('/queue',
query('first-name').trim().escape(),
query('last-name').trim().escape(),
query('index').trim().escape().toInt(),
(req, res, next) => {
  authenticate(req, res, () => {
    pool.getConnection((err, conn) => {
      if (req.query['first-name'] && req.query['last-name']) {
        searchUser(req.query['first-name'], req.query['last-name'], (users) => {
          convertFoodIdToFoodName(users, (users) => {
            res.render('admin-queue', { title: 'Queue Manager', searching: true, users: users, notEmpty: users.length ? true : false });
            pool.releaseConnection(conn);
          }, conn)
        }, 0, 20, conn)
      } else {
        getTimes((times) => {
          let index = (req.query.index && req.query.index < times.length && req.query.index >= 0) ? req.query.index : 0; // First we get our index and define it to 0 if the value is wrong
            getUsers((users) => {
              convertFoodIdToFoodName(users, (users) => {
                res.render('admin-queue', { title: 'Queue Manager', searching: false, users: users, notEmpty: users.length ? true : false, timeStamp: times[index], previousTime: (index > 0) ? "/spadmin/queue?index=" + (index - 1) : null, nextTime: (index < times.length - 1) ? "/spadmin/queue?index=" + (index + 1) : null });
                pool.releaseConnection(conn);
              }, conn)
            }, 0, times[index], conn)
        }, false)
      }
    })
  })
})

router.get('/manage', (req, res, next) => {
  authenticate(req, res, () => {
    pool.getConnection((err, conn) => {
      getBurgers((burgers) => {
        getFries((fries) => {
          getDrinks((drinks) => {
            countBurgers((burgerCount) => {
              countFries((friesCount) => {
                countDrinks((drinkCount) => {
                  getTimes((times) => {
                    getRegistration((regisBool) => {
                      getRegistrationDay((day) => {
                        getLimit((limit) => {
                          res.render('admin', { title: 'Administration', limit: limit, day: day, regisBool: regisBool, times: times, drinkCount: drinkCount, friesCount: friesCount, burgerCount: burgerCount, burgers: burgers, drinks: drinks, fries: fries });
                          pool.releaseConnection(conn);
                        })
                      })
                    })
                  }, false, conn)
                }, false, conn)
              }, false, conn)
            }, false, conn)
          }, true, conn)
        }, true, conn)
      }, true, conn)
    })
  })
})

router.post('/changePassword', (req, res, next) => {
  authenticate(req, res, () => {
    setPassword(req.body.password);
    res.cookie('spatulasPower', req.body.password);
    res.redirect('/spadmin/manage');
  })
})

router.get('/kitchen', (req, res, next) => {
  authenticate(req, res, () => {
    pool.getConnection((err, conn) => {
      countBurgers((burgerCount) => {
        countFries((friesCount) => {
          res.render('kitchen', { title: 'Kitchen tab', length: burgerCount.length + friesCount.length, burgerCounts: burgerCount, friesCounts: friesCount });
          pool.releaseConnection(conn);
        }, 1, conn)
      }, 1, conn)
    })
  })
})

router.post('/updateRegistration', (req, res, next) => {
  authenticate(req, res, () => {
    getRegistration((oldValue) => {
      if (oldValue == 1) {
        setRegistration(0)
      }
      else {
        setRegistration(1)
      }
    })
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.post('/updateRegistrationDay', (req, res, next) => {
  authenticate(req, res, () => {
    setRegistrationDay(req.body.registrationDay);
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.post('/addTimeStamp', (req, res, next) => {
  authenticate(req, res, () => {
    addTime(req.body.addTimeStamp);
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.post('/removeTimeStamp', (req, res, next) => {
  authenticate(req, res, () => {
    removeTime(req.body.removeTimeStamp);
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.post('/updateLimit', (req, res, next) => {
  authenticate(req, res, () => {
    setLimit(req.body.limit);
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.get('/clearUsers', (req,res,next) => {
  authenticate(req, res, () => {
    clearUsers();
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.get('/clearDatabases', (req,res,next) => {
  authenticate(req, res, () => {
    purgeDatabase();
    res.redirect('/spadmin/manage');
  })
})

router.post('/AddBurger', (req, res, next) => {
  authenticate(req, res, () => {
    insertBurger(req.body.bIdentifier, req.body.bName, (req.body.bDesc) ? req.body.bDesc : null, parseFloat(req.body.bPrice) ? parseFloat(req.body.bPrice) : null);
    res.redirect('/spadmin/manage#burgerMenu');
  })  
})

router.get('/deleteBurger/:burgerId', (req, res, next) => {
  authenticate(req, res, () => {
    deleteBurger(req.params.burgerId);
    res.redirect('/spadmin/manage#burgerMenu');
  })
})

router.post('/AddFries', (req, res, next) => {
  authenticate(req, res, () => {
    insertFries(req.body.fIdentifier, req.body.fName, (req.body.fDesc) ? req.body.fDesc : null, parseFloat(req.body.fPrice) ? parseFloat(req.body.fPrice) : null);
    res.redirect('/spadmin/manage#friesMenu');
  })
})

router.get('/deleteFries/:friesId', (req, res, next) => {
  authenticate(req, res, () => {
    deleteFries(req.params.friesId);
    res.redirect('/spadmin/manage#friesMenu');
  })
})

router.post('/AddDrink', (req, res, next) => {
  authenticate(req, res, () => {
    insertDrink(req.body.dIdentifier, req.body.dName, (req.body.dDesc) ? req.body.dDesc : null, parseFloat(req.body.dPrice) ? parseFloat(req.body.dPrice) : null);
    res.redirect('/spadmin/manage#drinkMenu');
  })
})

router.get('/deleteDrink/:drinkId', (req, res, next) => {
  authenticate(req, res, () => {
    deleteDrink(req.params.drinkId);
    res.redirect('/spadmin/manage#drinkMenu');
  })
})

module.exports = router;
