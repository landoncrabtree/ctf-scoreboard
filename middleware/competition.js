var db = require('../db');
var scoring = require('../scoring');

const competitionOver = async (req, res, next) => {
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
    competitionOver
}