const express = require('express');
const commentController = require("../controllers/commentController");
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

//router.get("/:id/comments", commentController.getTaskComments);
router.post("/:id/comments", commentController.addComment);


module.exports = router;