const { eq, or, desc, sql } = require("drizzle-orm");
const db = require("../db");
const { tasks, users } = require("../db/schema");

// Public tasks walata comments tika ganna reusable subquery eka
const commentsSubquery = sql`
    CASE
        WHEN ${tasks.is_private} = true THEN '[]'::json
        ELSE COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', c.id,
                        'username', cu.username,
                        'text', c.content,
                        'created_at', c.created_at
                    )
                    ORDER BY c.created_at DESC
                )
                FROM comments c
                JOIN users cu ON c.user_id = cu.id
                WHERE c.task_id = ${tasks.id}
            ),
            '[]'::json
        )
    END
`;

// getalltasks (own tasks + other users' public tasks with comments)
const getAllTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const allTasks = await db
            .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                status: tasks.status,
                is_private: tasks.is_private,
                user_id: tasks.user_id,
                created_at: tasks.created_at,
                username: users.username,
                comments: commentsSubquery
            })
            .from(tasks)
            .innerJoin(users, eq(tasks.user_id, users.id))
            .where(or(eq(tasks.user_id, userId), eq(tasks.is_private, false)))
            .orderBy(desc(tasks.created_at));

        res.status(200).json({
            tasks: allTasks
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

// get task by id (with comments if public)
const getTaskById = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        const userId = req.user.id;

        const [task] = await db
            .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                status: tasks.status,
                is_private: tasks.is_private,
                user_id: tasks.user_id,
                created_at: tasks.created_at,
                username: users.username,
                comments: commentsSubquery
            })
            .from(tasks)
            .innerJoin(users, eq(tasks.user_id, users.id))
            .where(eq(tasks.id, taskId));

        if (!task) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        if (task.is_private === true && task.user_id !== userId) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this private task"
                }
            });
        }

        res.status(200).json({ task });
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

// post task
const createTask = async (req, res) => {
    try {
        const title = req.body.title?.trim();
        const description = req.body.description?.trim() || "";
        const status = req.body.status || "pending";
        const is_private = req.body.is_private ?? false;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Title is required",
                    details: { field: "title" }
                }
            });
        }

        const [newTask] = await db
            .insert(tasks)
            .values({
                title,
                description,
                status,
                is_private,
                user_id: userId
            })
            .returning({ id: tasks.id });

        res.status(201).json({
            message: "Task created successfully",
            id: newTask.id
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

// patch task details
const updateTask = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.id;
        const updateData = req.body;

        const [currentTask] = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, id));

        if (!currentTask) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        if (currentTask.user_id !== userId) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You do not have permission to update this task"
                }
            });
        }

        const updatedTask = {
            title: updateData.title !== undefined ? updateData.title.trim() : currentTask.title,
            description: updateData.description !== undefined ? updateData.description.trim() : currentTask.description,
            status: updateData.status ?? currentTask.status,
            is_private: updateData.is_private ?? currentTask.is_private
        };

        await db
            .update(tasks)
            .set(updatedTask)
            .where(eq(tasks.id, id));

        res.status(200).json({ message: "Task updated successfully" });
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

// delete task
const deleteTask = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.id;

        const [existingTask] = await db
            .select({
                id: tasks.id,
                user_id: tasks.user_id
            })
            .from(tasks)
            .where(eq(tasks.id, id));

        if (!existingTask) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        if (existingTask.user_id !== userId) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete this task"
                }
            });
        }

        await db
            .delete(tasks)
            .where(eq(tasks.id, id));

        res.status(200).json({ message: "Task deleted successfully" });
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
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};