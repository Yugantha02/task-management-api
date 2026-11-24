const db = require("../config/db-connection");


const getTaskComments = async (req, res) => {
    try {
        const taskId = req.params.id;

        
        const taskResult = await db.query(
            "SELECT id, user_id, is_private FROM tasks WHERE id = $1",
            [taskId]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        const task = taskResult.rows[0];

        
        if (task.is_private === true) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "Comments are not available for private tasks"
                }
            });
        }

        
        const commentsResult = await db.query(
            `SELECT comments.id, users.username, comments.content AS text, comments.created_at
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.task_id = $1
             ORDER BY comments.created_at DESC`,
            [taskId]
        );

       
        res.status(200).json({
            comments: commentsResult.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Server error"
            }
        });
    }
};


const addComment = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const text = req.body.text?.trim();

        if (!text) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Comment text is required",
                    details: { field: "text" }
                }
            });
        }

        const taskResult = await db.query(
            "SELECT id, user_id, is_private FROM tasks WHERE id = $1",
            [taskId]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        const task = taskResult.rows[0];

        if (task.is_private === true) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "Comments are not supported on private tasks"
                }
            });
        }

        if (task.user_id === userId) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "Task owner cannot comment on their own task"
                }
            });
        }

        const insertResult = await db.query(
            "INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at",
            [taskId, userId, text]
        );

        const newComment = insertResult.rows[0];

        const userResult = await db.query(
            "SELECT username FROM users WHERE id = $1",
            [userId]
        );

        res.status(201).json({
            comment: {
                id: newComment.id,
                username: userResult.rows[0].username,
                text: newComment.content,
                created_at: newComment.created_at
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Server error"
            }
        });
    }
};

module.exports = {
    getTaskComments,
    addComment
};