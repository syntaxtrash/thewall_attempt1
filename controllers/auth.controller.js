import bcrypt from 'bcrypt';
import { pool } from '../configs/database.config.js';

/** 
 * @class
 * Class representing Authentication Controller
 */
class AuthController {
    constructor() {
        this.pool = pool;
    }

    /**
    * DOCU: Process user login authentication and create session <br>
    * Triggered: From login form submission <br>
    * Last Updated Date: March 14, 2024
    * @async
    * @function
    * @param {object} req - Express request object containing email and password
    * @param {object} res - Express response object
    * @returns {object} JSON response with status and message
    * @author Aaron
    */
    login = async (req, res) => {
        let response_data = { status: false, result: {}, error: null, message: "" };

        try {
            const { email, password } = req.body;

            /* Basic validation */
            if (!email || !password) {
                response_data.message = "All fields are required";
                return res.status(400).json(response_data);
            }

            /* Find user by email */
            const [rows] = await this.pool.query(
                'SELECT id, first_name, password, salt FROM users WHERE email_address = ?',
                [email]
            );

            const user = rows[0];

            if (!user) {
                response_data.message = "Invalid email or password";
                return res.status(401).json(response_data);
            }

            /* Verify password */
            const is_valid_password = await bcrypt.compare(password + user.salt, user.password);

            if (!is_valid_password) {
                response_data.message = "Invalid email or password";
                return res.status(401).json(response_data);
            }

            /* Set session data */
            req.session.user_id = user.id;
            req.session.user_name = user.first_name;

            response_data.status = true;
            response_data.message = "Login successful";
            res.json(response_data);
        }
        catch (error) {
            console.error(error);
            response_data.error = error;
            response_data.message = "Server error during login";
            res.status(500).json(response_data);
        }
    }

    /**
    * DOCU: Process new user registration <br>
    * Triggered: From registration form submission <br>
    * Last Updated Date: March 14, 2024
    * @async
    * @function
    * @param {object} req - Express request object containing user registration data
    * @param {object} res - Express response object
    * @returns {object} JSON response with status and message
    * @author Aaron
    */
    register = async (req, res) => {
        let response_data = { status: false, result: {}, error: null, message: "" };

        try {
            const { first_name, last_name, email, password, confirm_password } = req.body;

            /* Basic validation */
            if (!first_name || !email || !password || !confirm_password) {
                response_data.message = "Required fields missing";
                return res.status(400).json(response_data);
            }

            if (password !== confirm_password) {
                response_data.message = "Passwords do not match";
                return res.status(400).json(response_data);
            }

            /* Check if email already exists */
            const [existing_users] = await this.pool.query(
                'SELECT id FROM users WHERE email_address = ?',
                [email]
            );

            if (existing_users.length > 0) {
                response_data.message = "Email already registered";
                return res.status(400).json(response_data);
            }

            /* Create salt and hash password */
            const salt = await bcrypt.genSalt(10);
            const hashed_password = await bcrypt.hash(password + salt, 10);

            /* Create user */
            const [result] = await this.pool.query(
                'INSERT INTO users (first_name, last_name, email_address, password, salt) VALUES (?, ?, ?, ?, ?)',
                [first_name, last_name ?? null, email, hashed_password, salt]
            );

            response_data.status = true;
            response_data.message = "Registration successful";
            res.json(response_data);
        }
        catch (error) {
            console.error(error);
            response_data.error = error;
            response_data.message = "Server error during registration";
            res.status(500).json(response_data);
        }
    }

    /**
    * DOCU: Process user logout by destroying session <br>
    * Triggered: From logout button click <br>
    * Last Updated Date: March 14, 2024
    * @function
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    * @author Aaron
    */
    logout = (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    }
}

export default (function auth_controller() {
    return new AuthController();
})(); 