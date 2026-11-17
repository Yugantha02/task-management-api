const http = require("http");
const taskController = require("./controllers/taskcontroller");
const userController = require("./controllers/usercontroller");

const server = http.createServer(async(req, res) => {
    res.setHeader("Content-Type", "application/json");
        
    if(req.url.startsWith("/api/tasks"))
    {
        await taskController(req, res);
    }

    else if (req.url.startsWith("/api/users"))
    {
        await userController(req, res);
    }
    else
    {
        res.writeHead(404);
        res.end(JSON.stringify({message:"Route not found"}));
    }
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});