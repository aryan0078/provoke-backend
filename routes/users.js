var express = require('express');
const UserController = require('../controllers/user.controller');
var router = express.Router();

router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.post("/subscribe", UserController.subscribe);
router.post("/unsubscribe", UserController.unsubscribe);
router.get("/user", UserController.getUser);
router.post("/add-card", UserController.addCard);
module.exports = router;
