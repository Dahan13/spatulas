var express = require('express');
var router = express.Router();
// const pool = require("./database.js")


/* GET home page. */
router.get('/', function(req, res, next) {
  const registrationOpen = true;
  res.render('home', { title: 'Home', registrationOpen: registrationOpen });
});

module.exports = router;
