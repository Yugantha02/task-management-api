const express = require('express');
const cors = require('cors');
require('dotenv').config();
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

const PORT = process.env.PORT || 3000;


const main = express(); 



main.use(cors());
main.use(express.json());

main.use("/api/tasks", taskRoutes);
main.use("/api/auth", userRoutes);
main.use("/api/tasks",commentRoutes);


main.listen(PORT, () => {
    console.log('Server is running on ${PORT}!');
});