const { eq } = require("drizzle-orm");
const db = require("../db");
const { users } = require("../db/schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// signup
const registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.username, username));

        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [newUser] = await db
            .insert(users)
            .values({
                username,
                password: hashedPassword
            })
            .returning({
                id: users.id,
                username: users.username,
                created_at: users.created_at
            });

        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// user login
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username));

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // jwt token
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// get current user
const getCurrentUser = async (req, res) => {
    try {
        const [user] = await db
            .select({
                id: users.id,
                username: users.username,
                created_at: users.created_at
            })
            .from(users)
            .where(eq(users.id, req.user.id));

        if (!user) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "User not found"
                }
            });
        }

        res.status(200).json(user);
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