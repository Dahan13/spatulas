var express = require('express');
var fs = require('fs');
var stringify = require('csv-stringify');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector')
let { getUntreatedUsers, getPreparationUsers, getReadyUsers, getDeliveredUsers, getBurgers, getFries, getDrinks, searchUser, countBurgers, countFries, countDrinks, insertBurger, deleteBurger, deleteFries, deleteDrink, insertFries, insertDrink, clearUsers, convertFoodIdToFoodName, purgeDatabase, getUsersByStatus } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, getLimit, setRegistration, setRegistrationDay, setLimit, addTime, removeTime, getPassword, checkPassword, authenticate, setPassword } = require('./settingsUtilities');

/* GET users listing. */
router.get('/', function(req, res, next) {
  checkPassword(req.cookies.spatulasPower, (result) => {
    res.render('auth', { title: 'Authentification', admin: result, authentified: result });
  })
});

router.post('/', 
body('password').trim().escape(),
(req, res, next) => {
  if (req.body.password.length <= 100) {
    checkPassword(req.body.password, (result) => {
      if (result) {
        res.cookie('spatulasPower', req.body.password);
      }
      res.redirect('/spadmin');
    })
  } else {
    res.redirect('/spadmin');
  }
})

router.get('/disconnect', (req, res, next) => {
  res.cookie('spatulasPower', '');
  res.redirect('/');
})

router.get('/queue',
query('first-name').trim().escape(),
query('last-name').trim().escape(),
query('index').trim().escape().toInt(),
(req, res, next) => {
  authenticate(req, res, () => {
    if (req.query['first-name'] || req.query['last-name']) {
      pool.getConnection((err, conn) => {
        searchUser(req.query['first-name'], req.query['last-name'], (users) => {
          convertFoodIdToFoodName(users, (users) => {
            res.render('admin-queue', { title: 'Queue Manager', admin: true, searching: true, users: users, notEmpty: (typeof users !== "undefined" && users.length > 0) ? true : false });
            pool.releaseConnection(conn);
          }, conn)
        }, null, 999, conn)
      })
    } else {
      getUsersByStatus((users) => {  
        res.render('admin-queue', { title: 'Queue Manager', admin: true, searching: false, users: users, notEmpty: (typeof users !== "undefined" && users.length > 0) ? true : false });
      }, true, 'userId', 'lastUpdated', 'lastUpdated', 'lastUpdated');     
    }
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
                          res.render('admin', { title: 'Administration', admin: true, limit: limit, day: day, regisBool: regisBool, times: times, drinkCount: drinkCount, friesCount: friesCount, burgerCount: burgerCount, burgers: burgers, drinks: drinks, fries: fries });
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
          res.render('kitchen', { title: 'Kitchen tab', admin: true, length: burgerCount.length + friesCount.length, burgerCounts: burgerCount, friesCounts: friesCount });
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
    setTimeout(() => {
      res.redirect('/spadmin/manage');
    }, 1000) 
  })
})

router.post('/AddBurger', (req, res, next) => {
  authenticate(req, res, () => {
    req.body.bPrice = req.body.bPrice.replace(',', '.');
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
    req.body.fPrice = req.body.fPrice.replace(',', '.');
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
    req.body.dPrice = req.body.dPrice.replace(',', '.');
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

router.get('/downloadUsers', (req, res, next) => {
  authenticate(req, res, () => {
    pool.query('SELECT * FROM spatulasUsers ORDER BY time', (err, rows) => {
      stringify.stringify(rows, {
        header: true
      }, (err, output) => {
        fs.writeFile('./users.csv', output, 'utf-8', () => {
          res.download('./users.csv', () => {
            fs.unlink('./users.csv', (err) => {
              if (err) {
                console.log(err);
              }
            });
          });
        })
      })
    })
  })
})

module.exports = router;
