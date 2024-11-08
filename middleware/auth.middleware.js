/**
* DOCU: Authentication middleware to protect routes that require logged in users <br>
* Triggered: When accessing protected routes <br>
* Last Updated Date: March 14, 2024
* @function
* @param {object} req - Express request object
* @param {object} res - Express response object
* @param {function} next - Express next middleware function
* @returns {void} Redirects to login if not authenticated, otherwise continues to next middleware
* @author Aaron
*/
export const auth = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    next();
};

/**
* DOCU: Guest middleware to protect routes that should only be accessed by non-authenticated users <br>
* Triggered: When accessing guest-only routes like login and register pages <br>
* Last Updated Date: March 14, 2024
* @function
* @param {object} req - Express request object
* @param {object} res - Express response object
* @param {function} next - Express next middleware function
* @returns {void} Redirects to wall if already authenticated, otherwise continues to next middleware
* @author Aaron
*/
export const guest = (req, res, next) => {
    if (req.session.user_id) {
        return res.redirect('/wall');
    }
    next();
}; 