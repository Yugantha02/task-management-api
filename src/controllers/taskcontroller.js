const db = require("../config/db-connection");


//getalltasks
const getAllTasks = async (req, res) => {
    try {
        const tasks = await db.query("SELECT * FROM tasks");
        res.status(200).json(tasks.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

//get task by id
const getTaskById = async (req, res) => {
    try {
        const id = req.params.id; // Express magic! ID eka kelinma gannawa
        
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

//post task
const createTask = async (req, res) => {
    try {
        const { title, description, status = "pending",is_private } = req.body; 

        const result = await db.query(
            "INSERT INTO tasks (title, description, status,is_private) VALUES ($1, $2, $3 $4) RETURNING *", 
            [title, description, status,is_private]
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
    deleteTask
};