var express = require('express');
var router = express.Router();
let { createDatabase } = require("./databaseUtilities.js");

createDatabase();

/* GET home page. */
router.get('/', function(req, res, next) {
  const registrationOpen = true;
  res.render('home', { title: 'Home', registrationOpen: registrationOpen });
});

router.get('/queue', (req, res, next) => {
  res.render('queue', { title: 'queue', searching: false });
})

module.exports = router;
