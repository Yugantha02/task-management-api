const {Pool} = require('pg');

const db = new Pool(
    {
        user:'postgres',
        host:'localhost',
        database:'task_api_db',
        password:'',
        port:5432,
    }
);
db.connect()
.then(()=> console.log("pogstreSQL database connected successfully"))
.catch((err)=> console.log("connection error",error.stack));

module.exports = db;