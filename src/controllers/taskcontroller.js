const db = require("../db-connection");

const handleTasks = async (req, res) => {
//get
if(req.url === "/api/tasks" && req.method === "GET")
{
    const tasks = await db.query("SELECT * FROM tasks");
    res.writeHead(200);
    res.end(JSON.stringify(tasks.rows));

}

// get task by id
else if(req.url.startsWith("/api/tasks/") && req.method === "GET")
    {
    const id = req.url.split("/")[3];

    const task = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if(task.rows.length > 0)
    {
        res.writeHead(200);
        res.end(JSON.stringify(task.rows[0]));
    }
    else
    {
        res.writeHead(404);
        res.end(JSON.stringify({message:"Task not found"}));
    }
}

//post
else if (req.url === "/api/tasks" && req.method === "POST")
{
    let body = "";
    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        const newTask = JSON.parse(body);
        const status = newTask.status || "pending";

        const result = await db.query("INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *", 
            [newTask.title, newTask.description, status]
        );

        res.writeHead(201);
        res.end(JSON.stringify({message:"Task created successfully", taskId: result.rows[0].id}));
    });
}

//patch
else if (req.url.startsWith("/api/tasks/") && req.method === "PATCH")
{   
    const id = req.url.split("/")[3];
    let body = "";
    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        const updateData = JSON.parse(body);
        const existingTask = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);

        if(existingTask.rows.length > 0)
        {
            const currentTask = existingTask.rows[0];
            const updatedTask = {
                title: updateData.title || currentTask.title,
                description: updateData.description || currentTask.description,
                status: updateData.status || currentTask.status
                };

                await db.query(
                    "UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4",
                    [updatedTask.title, updatedTask.description, updatedTask.status, id]);

                res.writeHead(200);
                res.end(JSON.stringify({message:"Task updated successfully"}));
        }
        else
        {
            res.writeHead(404);
            res.end(JSON.stringify({message:"Task not found"}));
        }
    });
}

//delete
else if (req.url.startsWith("/api/tasks/") && req.method === "DELETE")
{
    const id = req.url.split("/")[3];
    const task = await db.query("DELETE FROM tasks WHERE id = $1", [id]);

    res.writeHead(200);
    res.end(JSON.stringify({message:"Task deleted successfully"}))

}
else
{
    res.writeHead(404);
    res.end(JSON.stringify({message:"Route not found"}));

}
};

module.exports = handleTasks;





