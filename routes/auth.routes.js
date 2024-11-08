import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { guest } from '../middleware/auth.middleware.js';

/** 
* DOCU: Auth routes configuration <br>
* Last Updated Date: November 17, 2024
* @author Aaron
*/
const router = express.Router();

/* Show login/register pages (only for guests) */
router.get('/login', guest, (req, res) => res.render('login'));
router.get('/register', guest, (req, res) => res.render('register'));

/* Handle login/register/logout */
router.post('/login', guest, AuthController.login);
router.post('/register', guest, AuthController.register);
router.get('/logout', AuthController.logout);

export default router; 