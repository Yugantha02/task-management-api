const db = require("../config/db-connection");


//getalltasks
const getAllTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT id, title, description, status, is_private, user_id, created_at
             FROM tasks
             WHERE user_id = $1
             ORDER BY created_at DESC`,
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
        const id = req.params.id; 
        
        const task = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        
        if (task.rows.length > 0) {
            res.status(200).json(task.rows[0]);
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const getPublicTasks = async (req, res) => {
    try {
        const userId = req.user.id; 

        const result = await db.query(
            `SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.is_private, tasks.user_id, users.username, tasks.created_at
             FROM tasks
             JOIN users ON tasks.user_id = users.id
             WHERE tasks.is_private = false AND tasks.user_id != $1
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

//post task
const createTask = async (req, res) => {
    try {
        const { title, description, status = "pending", is_private = false } = req.body;
        const userId = req.user.id; 

        const result = await db.query(
            "INSERT INTO tasks (title, description, status, is_private, user_id) VALUES ($1, $2, $3, $4 ,$5) RETURNING *", 
            [title, description, status,is_private, userId]
        );

        res.status(201).json({ message: "Task created successfully", taskId: result.rows[0].id });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error",error:error });
    }
};


//patch task details
const updateTask = async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        const existingTask = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);

        if (existingTask.rows.length > 0) {
            const currentTask = existingTask.rows[0];
            const updatedTask = {
                title: updateData.title || currentTask.title,
                description: updateData.description || currentTask.description,
                status: updateData.status || currentTask.status
            };

            await db.query(
                "UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4",
                [updatedTask.title, updatedTask.description, updatedTask.status, id]
            );

            res.status(200).json({ message: "Task updated successfully" });
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

//delete  task
const deleteTask = async (req, res) => {
    try {
        const id = req.params.id;
        await db.query("DELETE FROM tasks WHERE id = $1", [id]);
        
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getPublicTasks
};