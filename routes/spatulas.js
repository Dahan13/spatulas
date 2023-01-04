var express = require('express');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector')
let { getBurgers, getFries, getDrinks, searchUser, countBurgers, countFries, countDrinks, insertBurger, deleteBurger, deleteFries, deleteDrink, insertFries, insertDrink, clearUsers } = require("./databaseUtilities.js");
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

router.get('/queue', (req, res, next) => {
  authenticate(req, res, () => {
    res.render('admin-queue', { title: 'Manage Queue', searching: true });
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
