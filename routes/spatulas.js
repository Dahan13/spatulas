var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('auth', { title: 'Authentification', authentified: true });
});

router.get('/queue', (req, res, next) => {
  res.render('admin-queue', { title: 'Manage Queue', searching: true });
})

router.get('/manage', (req, res, next) => {
  res.render('admin', { title: 'Administration' });
})

router.get('/kitchen', (req, res, next) => {
  res.render('kitchen', { title: 'Kitchen tab' });
})

module.exports = router;
