const {Pool} = require('pg');

const db = new Pool(
    {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    }
);
db.connect()
.then(()=> console.log("pogstreSQL database connected successfully"))
.catch((err)=> console.log("connection error",err.stack));

module.exports = db;