var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var multer = require('multer');
var path = require('path');
var db = require('../db');
var scoring = require('../scoring');
var authMiddleware = require('../middleware/authentication');
var compMiddleware = require('../middleware/competition');

// Upload the file and change the name to include the user's id
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '../uploads'))
	},
	filename: function (req, file, cb) {
		cb(null, req.session.user_id + '_' + file.originalname)
	}
});

// Set up file upload
const upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		if (path.extname(file.originalname) !== '.pdf') {
			req.fileValidationError = 'Only PDF files are allowed!';
			return cb(null, false, req.fileValidationError);
		}
		cb(null, true);
	}
});

// Enforce competition end date on all routes
router.use(compMiddleware.competitionOver);

/* GET scoreboard page. */
router.get('/', async function(req, res, next) {
	users = await db.getAllUsers();

    // Sort the users by score (descending)
	users.sort((a, b) => b.score - a.score);
    return res.render('index', {
		title: 'Scoreboard',
		users: users,
		user_id: req.session.user_id
	});
});

/* GET login page. */
router.get('/login', async function(req, res, next) {
	return res.render('login', {
		title: 'Login'
	});
});

router.post('/login', async function(req, res, next) {
	const email = req.body.email;
	const password = req.body.password;

	try {
		const user = await db.getUserByEmail(email);
		if (!user) {
			throw new Error('Invalid email or password.');
		}

		const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

		if (user.password !== hashedPassword) {
			throw new Error('Invalid email or password.');
		}

		req.session.user_id = user.id;
		return res.redirect('/');
	} catch (err) {
		return res.render('login', {
			title: 'Login',
			error: err.message
		});
	}
});

/* GET register page. */
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

	try {
		const user = await db.getUserByEmail(email);
		if (user) {
			throw new Error('An account with this email already exists.');
		}

		const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

		await db.createUser(name, email, hashedPassword);
		return res.redirect('/login');
	} catch (err) {
		return res.render('register', {
			title: 'Register',
			error: err.message
		});
	}
});

/* GET submit page. */
router.get('/submit', authMiddleware.userAuthenticated, async function(req, res, next) {
	return res.render('submit', {
		title: 'Submit Flag',
		user_id: req.session.user_id
	});
});

const cpUpload = upload.fields([{ name: 'writeup', maxCount: 1 }, { name: 'report', maxCount: 1 }])
router.post('/submit', cpUpload, authMiddleware.userAuthenticated, async function(req, res, next) {
	const flag = req.body.flag;
	const writeup = req.files['writeup'] ? req.files['writeup'][0] : null;
	const report = req.files['report'] ? req.files['report'][0] : null;
	const user_id = req.session.user_id;

	try {

		if (req.fileValidationError) {
			throw new Error(req.fileValidationError);
		}

		// If no flag provided, a writeup or report is required
		if (!flag && !writeup && !report) {
			throw new Error('Nothing to submit.');
		}

		// Handle writeup/report submission
		if (writeup || report) {
			return res.render('submit', {
				title: 'Submit Flag',
				success: 'Document submitted successfully! Pending manual scoring.',
				user_id: user_id
			});
		}

		// Handle flag submission
		if (flag) {
			// Check if the flag is valid
			if (!scoring.isValidFlag(flag)) {
				throw new Error('Invalid flag.');
			}

			// Check if the user has already submitted this flag
			const submissions = await db.getUserSubmissions(user_id);
			if (submissions.find(s => s.flag === flag)) {
				throw new Error('Flag already submitted.');
			}

			const value = scoring.getFlagValue(flag);
			await db.submitFlag(user_id, flag, value);

			return res.render('submit', {
				title: 'Submit Flag',
				success: 'Flag submitted successfully!',
				user_id: user_id
			});
		}
	} catch (err) {
		return res.render('submit', {
			title: 'Submit Flag',
			error: err.message,
			user_id: user_id
		});
	}
});

router.get('/logout', async function(req, res, next) {
	req.session.user_id = null;
	return res.redirect('/login');
});

module.exports = router;
