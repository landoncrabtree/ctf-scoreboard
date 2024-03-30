// Description: Middleware for competition related tasks.

var db = require('../db');
var scoring = require('../scoring');

/**
 * Provide the competition end date to the view.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const passConfig = async (req, res, next) => {
	res.locals.competition_end_date = scoring.competition_end_date.toISOString();
	res.locals.competition_name = scoring.competition_name;
	res.locals.total_flags = scoring.total_flags;
	res.locals.user_id = req.session.user_id;
	next();
}

/**
 * Check if the competition is over.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkCompetitionOver = async (req, res, next) => {
	users = await db.getAllUsers();
	users.sort((a, b) => b.score - a.score);
	if (new Date() > scoring.competition_end_date) {
		return res.render('index', {
			title: 'Scoreboard',
			users: users,
			error: 'The competition is over.',
			user_id: req.session.user_id
		});
	}
	next();
};

module.exports = {
	passConfig,
    checkCompetitionOver
}