var express = require('express');
var router = express.Router();
const pool = require("./database.js")


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title: 'Home' });
});

module.exports = router;
