var express = require('express');
var fs = require('fs');
var stringify = require('csv-stringify');
const { body, query } = require('express-validator');
const validator = require('validator');
var router = express.Router();
let pool = require('./databaseConnector')
let { purgeDatabase } = require("./databaseUtilities.js");
let { getTablesCount, insertTable, getTable, deleteElement, deleteTable, insertRow, getTableInfos, getTables } = require("./databaseTablesUtilities.js");
let { clearUsers, getUsersByStatus, createCommandFoodString, getCommands } = require("./databaseCommandsUtilities.js");
let { getRegistration, getRegistrationDay, getLimit, setRegistration, setRegistrationDay, setLimit, checkPassword, authenticate, setPassword, getKitchenLimit, setKitchenLimit } = require('./settingsUtilities');

/* GET users listing. */
router.get('/', function(req, res, next) {
  checkPassword(req.cookies.spatulasPower, (result) => {
    getRegistration((regisBool) => {
      res.render('auth', { title: 'Authentification', admin: result, authentified: result, registrationOpen: regisBool });
    })
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
    let conn = await pool.promise().getConnection();
    let users = await getUsersByStatus('commandId', req.query["search-query"], 'lastUpdated', req.query["search-query"], 'lastUpdated', req.query["search-query"], 'lastUpdated', req.query["search-query"], conn)
    await createCommandFoodString(users, ", ", conn);
    conn.release();
    res.render('admin-queue', { title: 'Queue Manager', admin: true, searching: (req.query["search-query"]) ? true : false, users: users, notEmpty: (typeof users !== "undefined" && users.untreated.length > 0 || users.preparation.length > 0 || users.ready.length > 0 || users.delivered.length > 0) ? true : false, orderCount: (typeof users !== "undefined" && users.untreated.length > 0 || users.preparation.length > 0 || users.ready.length > 0 || users.delivered.length > 0) ? users.untreated.length + users.preparation.length + users.ready.length + users.delivered.length : 0, untreatedCount: (typeof users !== "undefined" && users.untreated.length > 0) ? users.untreated.length : 0, preparationCount: (typeof users !== "undefined" && users.preparation.length > 0) ? users.preparation.length : 0, readyCount: (typeof users !== "undefined" && users.ready.length > 0) ? users.ready.length : 0, deliveredCount: (typeof users !== "undefined" && users.delivered.length > 0) ? users.delivered.length : 0 });
  })
})

router.get('/manage', (req, res, next) => {
  authenticate(req, res, async () => {

    // Getting all database related informations

    // Getting all settings related informations
    getRegistration((regisBool) => {
      getRegistrationDay((day) => {
        getLimit((limit) => {
          getKitchenLimit((kitchenLimit) => {
            res.render('settings', { title: 'Settings', admin: true, limit: limit, day: day, regisBool: regisBool, kitchenLimit: kitchenLimit});
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

router.get('/databases', (req, res, next) => {
  authenticate(req, res, async () => {
    let tables = await getTables();
    res.render('databases', { title: 'Databases', admin: true, tables: tables, classic_display: (req.cookies.theme == "classic") ? true : false, error: (req.query.error) ? req.query.error : null });
  })
})

router.post('/createDatabase',
body('foodName').trim().escape(),
(req, res, next) => {
  authenticate(req, res, async () => {

    let conn = await pool.promise().getConnection();

    // Checking if input is correct
    if (req.body.foodName && req.body.foodName.length < 32 && req.body.foodName.length > 0) {
      // Checking if a name for the first item was supplied or not
      let result = await insertTable(req.body.foodName, conn);
      if (result) {
        res.redirect('/spadmin/databases');
      } else {
        res.redirect('/spadmin/databases?error=true');
      }
    } else {
      res.redirect('/spadmin/databases?error=true');
    }
    conn.release()
  })
})

router.get('/database/:id', (req, res, next) => {
  authenticate(req, res, async () => {
    let conn = await pool.promise().getConnection();
    let table = await getTable(req.params.id, conn)
    let infos = await getTableInfos(req.params.id, conn);
    conn.release();

    if (infos) {
      res.render('database', { title: 'Database', admin: true, table: table, infos: infos });
    } else {
      res.redirect('/spadmin/databases');
    }
  })
})

router.get('/kitchen', (req, res, next) => {
  authenticate(req, res, async () => {
    let conn = await pool.promise().getConnection();
    getKitchenLimit(async (limit) => {
      let commands = await getCommands("preparation = 1 AND ready = 0 and delivered = 0", null, "lastUpdated", limit, true, conn);
      createCommandFoodString(commands, ", ", conn)
      let count = await getTablesCount("preparation = 1 AND ready = 0 AND delivered = 0 ORDER BY lastUpdated", limit, conn)
      conn.release();
      res.render('kitchen', { title: 'Preparation Tab', admin: true, commands: commands, count: count, limit: limit, notEmpty: (typeof commands !== "undefined" && commands.length > 0) ? true : false });
    })
  })
})

router.get('/updateRegistration', (req, res, next) => {
  authenticate(req, res, () => {
    getRegistration((oldValue) => {
      if (oldValue == 1) {
        setRegistration(0)
      }
      else {
        setRegistration(1)
      }
    })
    res.redirect('/spadmin/');
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
    res.redirect('/spadmin/time/');
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

router.get('/delete/:table/:food/:display', (req, res, next) => {
  authenticate(req, res, async () => {
    await deleteElement(req.params.food, req.params.table);
    if (req.params.display == "classic") {
      res.redirect('/spadmin/database/' + req.params.table);
    } else if (req.params.display == "minimized") {
      res.redirect('/spadmin/databases#' + req.params.table);
    } else {
      console.log('\x1b[31m%s\x1b[0m' , "Error: unknown display parameter. While this may not cause any server breaking issue, it could create bad user experience across the board.");
      res.redirect('/spadmin/databases#' + req.params.table);
    }
  })
})

router.get('/deleteDatabase/:table', (req, res, next) => {
  authenticate(req, res, async () => {
    await deleteTable(req.params.table);
    res.redirect('/spadmin/databases');
  })
})

router.post('/add/:table/:display',
body('name').trim().escape(),
body('description').trim().escape(),
(req, res, next) => {
  authenticate(req, res, async () => {
    req.body.price = parseFloat(validator.escape(req.body.price.replace(',', '.')));
    await insertRow(req.params.table, req.body.name, (req.body.description) ? req.body.description : null, (req.body.price) ? req.body.price : null);
    if (req.params.display == "classic") {
      res.redirect('/spadmin/database/' + req.params.table);
    } else if (req.params.display == "minimized") {
      res.redirect('/spadmin/databases#' + req.params.table);
    } else {
      console.log('\x1b[31m%s\x1b[0m' , "Error: unknown display parameter. While this may not cause any server breaking issue, it could create bad user experience across the board.");
      res.redirect('/spadmin/databases#' + req.params.table);
    }
  })
})

router.get('/downloadUsers', (req, res, next) => {
  authenticate(req, res, async () => {
    let rows = await getCommands(null, null, 'time', 999, true);
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
