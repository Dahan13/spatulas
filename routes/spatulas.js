var express = require('express');
var fs = require('fs');
var stringify = require('csv-stringify');
const { body, query } = require('express-validator');
var router = express.Router();
let pool = require('./databaseConnector')
let { countBurgers, deleteBurger, clearUsers, purgeDatabase, getUsersByStatus, getTablesCount, createCommandFoodString, getCommands } = require("./databaseUtilities.js");
let { getTimes, getRegistration, getRegistrationDay, getLimit, setRegistration, setRegistrationDay, setLimit, addTime, removeTime, getPassword, checkPassword, authenticate, setPassword, getKitchenLimit, setKitchenLimit, getGlobalTimes } = require('./settingsUtilities');

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
query('search-query').trim().escape(),
(req, res, next) => {
  authenticate(req, res, async () => {
    let users = await getUsersByStatus('commandId', req.query["search-query"], 'lastUpdated', req.query["search-query"], 'lastUpdated', req.query["search-query"], 'lastUpdated', req.query["search-query"])
    await createCommandFoodString(users, ", ")

    res.render('admin-queue', { title: 'Queue Manager', admin: true, searching: (req.query["search-query"]) ? true : false, users: users, notEmpty: (typeof users !== "undefined" && users.length > 0) ? true : false });
  })
})

router.get('/manage', (req, res, next) => {
  authenticate(req, res, async () => {

    // Getting all database related informations
    let conn = await pool.promise().getConnection();
    let times = await getGlobalTimes(conn);
    let count = await getTablesCount("delivered = 0", null, conn);

    // Getting all settings related informations
    getRegistration((regisBool) => {
      getRegistrationDay((day) => {
        getLimit((limit) => {
          getKitchenLimit((kitchenLimit) => {
            conn.release();
            res.render('admin', { title: 'Administration', admin: true, limit: limit, day: day, regisBool: regisBool, times: times, kitchenLimit: kitchenLimit,  count: count});
          })
        })
      })
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
  authenticate(req, res, async () => {
    let conn = await pool.promise().getConnection();
    getKitchenLimit(async (limit) => {
      let commands = await getCommands("preparation = 1 AND ready = 0 and delivered = 0", null, "lastUpdated", limit, conn);
      createCommandFoodString(commands, ", ", conn)
      let count = await getTablesCount("preparation = 1 AND ready = 0 AND delivered = 0 ORDER BY lastUpdated", limit, conn)
      conn.release();
      res.render('kitchen', { title: 'Kitchen Tab', admin: true, commands: commands, count: count, limit: limit, notEmpty: (typeof commands !== "undefined" && commands.length > 0) ? true : false });
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

router.post('/updateKitchenLimit', (req, res, next) => {
  authenticate(req, res, () => {
    setKitchenLimit(req.body.kitchenLimit);
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.get('/clearUsers', (req,res,next) => {
  authenticate(req, res, async () => {
    await clearUsers();
    res.redirect('/spadmin/manage#generalParameters');
  })
})

router.get('/clearDatabases', (req,res,next) => {
  authenticate(req, res, async () => {
    await purgeDatabase();
    res.redirect('/spadmin/manage');
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

router.post('/AddDessert', (req, res, next) => {
  authenticate(req, res, () => {
    req.body.dePrice = req.body.dePrice.replace(',', '.');
    insertDessert(req.body.deIdentifier, req.body.deName, (req.body.deDesc) ? req.body.deDesc : null, parseFloat(req.body.dePrice) ? parseFloat(req.body.dePrice) : null);
    res.redirect('/spadmin/manage#dessertMenu');
  })
})

router.get('/deleteDessert/:dessertId', (req, res, next) => {
  authenticate(req, res, () => {
    deleteDessert(req.params.dessertId);
    res.redirect('/spadmin/manage#dessertMenu');
  })
})

router.get('/downloadUsers', (req, res, next) => {
  authenticate(req, res, async () => {
    let rows = await getCommands(null, null, 'time');
    console.log(rows)
    stringify.stringify(rows, {
      header: true
    }, (err, output) => {
      fs.writeFile('./commands.csv', output, 'utf-8', () => {
        res.download('./commands.csv', () => {
          fs.unlink('./commands.csv', (err) => {
            if (err) {
              console.log(err);
            }
          });
        });
      })
    })
  })
})

module.exports = router;
