const { eq } = require("drizzle-orm");
const db = require("../db");
const { tasks, comments, users } = require("../db/schema");

const addComment = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
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

        // 1. Task eka thiyenawada balanna
        const [task] = await db
            .select({
                id: tasks.id,
                user_id: tasks.user_id,
                is_private: tasks.is_private
            })
            .from(tasks)
            .where(eq(tasks.id, taskId));

        if (!task) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

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

        // 2. Comment eka insert karanna
        const [newComment] = await db
            .insert(comments)
            .values({
                task_id: taskId,
                user_id: userId,
                content: text
            })
            .returning({
                id: comments.id,
                content: comments.content,
                created_at: comments.created_at
            });

        // 3. Comment dapu user ge username eka ganna
        const [user] = await db
            .select({ username: users.username })
            .from(users)
            .where(eq(users.id, userId));

        res.status(201).json({
            comment: {
                id: newComment.id,
                username: user.username,
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
    addComment
};