var express = require('express');
var router = express.Router();
let pool = require('./databaseConnector')
let { createDatabase, insertUser, insertBurger, insertFries, insertDrink, getUsers, getBurgers, getFries, getDrinks } = require("./databaseUtilities.js");
let { getTimes } = require('./settingsUtilities');

createDatabase();
// insertUser('Doe', 'John', 'classico', 'paprika', 'coca', 1900);
// insertBurger('classico', 'Classico', 'Steak, cheddar, homemade sauce', 5.0);
// insertBurger('chevre', 'Chèvre', 'Steak, goat cheese, honey, homemade sauce', 5.0);
// insertBurger('vege', 'Végé', 'Vegetarian steak, raclette, homemade sauce', 5.0);
// insertFries('paprika', 'Frites paprika');
// insertDrink('coca', 'Coca Cola');
// insertDrink('orangina', 'Orangina');
// insertDrink('nodrink', 'No drink', null, -0.5)

/* GET home page. */
router.get('/', function(req, res, next) {
  const registrationOpen = true;
  pool.getConnection((err, conn) => {
    getBurgers((burgers, ) => {
      getFries((fries) => {
        getDrinks((drinks) => {
          getTimes((times) => {
            res.render('home', { title: 'Home', registrationOpen: registrationOpen, burgers: burgers, fries: fries, drinks: drinks, times: times });
          }, conn)
        }, conn)
      }, conn)
    }, conn)
    pool.releaseConnection(conn);
  })
});

router.get('/queue', (req, res, next) => {
  getUsers((users) => {
    res.render('queue', { title: 'queue', searching: false, users: users, notEmpty: users.length ? true : false });
  })
})

router.post('/register', (req, res, next) => {
  if (req.body.lastName && req.body.firstName && req.body.burger && req.body.fries && req.body.drink && req.body.time && req.body.accept == 'on') {
    insertUser(req.body.lastName, req.body.firstName, req.body.burger, req.body.fries, req.body.drink, req.body.time)
    res.redirect('/queue');
  } else {
    res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }
  
})
module.exports = router;
