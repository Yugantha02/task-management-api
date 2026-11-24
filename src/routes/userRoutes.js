const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();


router.post("/signup", userController.registerUser);
router.post("/signin", userController.loginUser);



module.exports = router;