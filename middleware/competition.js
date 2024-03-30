// Description: Middleware for competition related tasks.

var db = require('../db');
var scoring = require('../scoring');

/**
 * Pass the competition configuration to the view locals so it can be rendered in the view.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const passConfig = async (req, res, next) => {
	res.locals.competitionEndDate = scoring.competitionEndDate.toISOString();
	res.locals.competitionName = scoring.competitionName;
	res.locals.competitionLogoURL = scoring.competitionLogoURL;
	res.locals.totalAvailableFlags = scoring.totalAvailableFlags;
	res.locals.uid = req.session.uid;
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
	if (new Date() > scoring.competitionEndDate) {
		return res.render('index', {
			users: users,
			error: 'The competition has ended.',
		});
	}
	next();
};

module.exports = {
	passConfig,
    checkCompetitionOver
}