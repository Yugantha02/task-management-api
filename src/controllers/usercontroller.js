const db = require("../config/db-connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//signup
const registerUser = async (req ,  res) => {

    try{
        const { username, password} = req.body;

        if(!username || !password){
            return res.status(400).json({ message: "Username and password are required" });
        }

        const existingUserName = await db.query(
            "SELECT * FROM users WHERE username = $1",[username]);
        
        if(existingUserName.rows.length>0){
            return res.status(400).json({ message: "Username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at",
            [username, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0]
        });

    }

    catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


//user loging
const loginUser =  async (req  , res) => {

    try{

        const { username, password } = req.body;

        const result = await db.query(
            "SELECT * FROM users WHERE username = $1",
            [username]);
            
            if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

//jwt token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                username: user.username
            }
        });

    }

    catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, username, created_at FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "User not found"
                }
            });
        }

        res.status(200).json(result.rows[0]);
        
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
    registerUser,
    loginUser,
    getCurrentUser

};