const router = require("express").Router();
const controller = require("../controllers/verification");
const helper = require("../helpers/mailer");
const passport = require('passport');

router.post('/login', controller.login);
router.post('/signup', controller.signup);

module.exports = router;