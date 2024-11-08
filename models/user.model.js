import { pool } from '../configs/database.config.js';
import mysql from 'mysql2';

class UserModel {
    /**
    * DOCU: Find user by email address <br>
    * Triggered: From login and registration process <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {string} email - User's email address
    * @returns {object} Response with user data if found
    * @author Aaron
    */
    findByEmail = async (email) => {
        let response_data = { status: false, result: {}, error: null };

        try {
            let find_user_query = mysql.format(`
                SELECT * 
                FROM users 
                WHERE email_address = ?
            `, [email]);

            let [user_result] = await pool.query(find_user_query);

            response_data.status = true;
            response_data.result = user_result[0];

            return response_data;
        }
        catch (error) {
            response_data.error = error;
            return response_data;
        }
    }

    /**
    * DOCU: Create new user record <br>
    * Triggered: From registration process <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {object} userData - User registration data
    * @returns {object} Response with inserted user ID
    * @author Aaron
    */
    createUser = async (userData) => {
        let response_data = { status: false, result: {}, error: null };
        const { first_name, last_name, email, password, salt } = userData;

        try {
            let create_user_query = mysql.format(`
                INSERT INTO users (
                    first_name, 
                    last_name, 
                    email_address, 
                    password, 
                    salt
                ) 
                VALUES (?, ?, ?, ?, ?)
            `, [first_name, last_name, email, password, salt]);

            let [result] = await pool.query(create_user_query);

            response_data.status = true;
            response_data.result = result.insertId;

            return response_data;
        }
        catch (error) {
            response_data.error = error;
            return response_data;
        }
    }
}

const userModel = new UserModel();
export default userModel; 