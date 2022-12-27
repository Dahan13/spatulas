var express = require('express');
var router = express.Router();
let { createDatabase, insertUser, insertBurger, insertFries, insertDrink, getUsers, getBurgers, getFries, getDrinks } = require("./databaseUtilities.js");

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
  res.render('home', { title: 'Home', registrationOpen: registrationOpen });
});

router.get('/queue', (req, res, next) => {
  res.render('queue', { title: 'queue', searching: false });
})

module.exports = router;
