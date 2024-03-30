// Description: Authentication middleware for user authentication.

/**
 * Middleware to check if a user is authenticated.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const userAuthenticated = (req, res, next) => {
	if (!req.session.uid) {
		return res.redirect('/login');
	}
	next();
}

module.exports = {
    userAuthenticated
}