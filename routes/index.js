var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var db = require('../db');
var scoring = require('../scoring');
var authMiddleware = require('../middleware/authentication');
var compMiddleware = require('../middleware/competition');

router.use(compMiddleware.competitionOver);

/* GET scoreboard page. */
router.get('/', async function(req, res, next) {
	users = await db.getAllUsers();

    // Sort the users by score (descending)
	users.sort((a, b) => b.score - a.score);
    return res.render('index', { title: 'Scoreboard', users: users, user_id: req.session.user_id });
});

router.get('/login', async function(req, res, next) {
	return res.render('login', { title: 'Login' });
});

router.post('/login', async function(req, res, next) {
	const email = req.body.email;
	const password = req.body.password;

	const user = await db.getUserByEmail(email);
	if (!user) {
		return res.render('login', {
			title: 'Login',
			error: 'Invalid email or password.',
			user_id: req.session.user_id
		});
	}

	const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

	if (user.password !== hashedPassword) {
		return res.render('login', {
			title: 'Login',
			error: 'Invalid email or password.',
			user_id: req.session.user_id
		});
	}

	req.session.user_id = user.id;
	return res.redirect('/');
});

router.get('/register', async function(req, res, next) {
	return res.render('register', {
		title: 'Register',
		user_id: req.session.user_id
	});
});

router.post('/register', async function(req, res, next) {
	const name = req.body.name;
	const email = req.body.email;
	const password = req.body.password;

	const user = await db.getUserByEmail(email);
	if (user) {
		return res.render('register', {
			title: 'Register',
			error: 'User already exists.',
			user_id: req.session.user_id
		});
	}

	const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

	await db.createUser(name, email, hashedPassword);
	return res.redirect('/login');
});

router.get('/submit', authMiddleware.userAuthenticated, async function(req, res, next) {
	return res.render('submit', {
		title: 'Submit Flag',
		user_id: req.session.user_id
	});
});

router.post('/submit', authMiddleware.userAuthenticated, async function(req, res, next) {
	const flag = req.body.flag;
	const user_id = req.session.user_id;

	const user = await db.getUserById(user_id);
	if (!user) {
		return res.redirect('/login');
	}

	// Check if the flag is valid
	if (!scoring.isValidFlag(flag)) {
		return res.render('submit', {
			title: 'Submit Flag',
			error: 'Invalid flag.',
			user_id: user_id
		});
	}

	// Check if the user has already submitted this flag
	const submissions = await db.getUserSubmissions(user_id);
	if (submissions.find(s => s.flag === flag)) {
		return res.render('submit', {
			title: 'Submit Flag',
			error: 'Flag already submitted.',
			user_id: user_id
		});
	}

	const value = scoring.getFlagValue(flag);
	await db.submitFlag(user_id, flag, value);

	return res.render('submit', {
		title: 'Submit Flag',
		success: 'Flag submitted successfully!',
		user_id: user_id
	});
});

router.get('/logout', async function(req, res, next) {
	req.session.user_id = null;
	return res.redirect('/login');
});



module.exports = router;
