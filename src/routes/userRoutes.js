const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();


router.post("/register", userController.registerUser);
router.post("/signin", userController.loginUser);

router.use(authMiddleware);
router.get("/me",  userController.getCurrentUser);





module.exports = router;