const db = require("../config/db-connection");

//getalltasks (own tasks + other users' public tasks)
const getAllTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.is_private,
                    tasks.user_id, tasks.created_at, users.username
             FROM tasks
             JOIN users ON tasks.user_id = users.id
             WHERE tasks.user_id = $1 OR tasks.is_private = false
             ORDER BY tasks.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            tasks: result.rows
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

//get task by id
const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const result = await db.query(
            `SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.is_private, tasks.user_id, tasks.created_at, users.username
             FROM tasks
             JOIN users ON tasks.user_id = users.id
             WHERE tasks.id = $1`,
            [taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        const task = result.rows[0];

        if (task.is_private === true && task.user_id !== userId) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this private task"
                }
            });
        }

        res.status(200).json({
            task: {
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                is_private: task.is_private,
                created_at: task.created_at,
                username: task.username
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

//post task
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

        const result = await db.query(
            "INSERT INTO tasks (title, description, status, is_private, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [title, description, status, is_private, userId]
        );

        res.status(201).json({
            message: "Task created successfully",
            id: result.rows[0].id
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

//patch task details
const updateTask = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const updateData = req.body;

        const existingTask = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);

        if (existingTask.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        const currentTask = existingTask.rows[0];

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

        await db.query(
            "UPDATE tasks SET title = $1, description = $2, status = $3, is_private = $4 WHERE id = $5",
            [updatedTask.title, updatedTask.description, updatedTask.status, updatedTask.is_private, id]
        );

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

//delete task
const deleteTask = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;

        const existingTask = await db.query(
            "SELECT id, user_id FROM tasks WHERE id = $1",
            [id]
        );

        if (existingTask.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Task not found"
                }
            });
        }

        if (existingTask.rows[0].user_id !== userId) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete this task"
                }
            });
        }

        await db.query("DELETE FROM tasks WHERE id = $1", [id]);

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