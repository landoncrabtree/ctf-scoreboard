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
		cb(null, req.session.uid + '_' + file.originalname)
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

router.use(compMiddleware.passConfig); // Pass the scoring configuration to the view
router.use(compMiddleware.checkCompetitionOver); // Freeze functionality after competition end date

/* GET scoreboard page. */
router.get('/', async function(req, res, next) {
	users = await db.getAllUsers();

    // Sort the users by score (descending)
	users.sort((a, b) => b.score - a.score);
    return res.render('index', {
		users: users
	});
});

/* GET login page. */
router.get('/login', async function(req, res, next) {
	return res.render('login');
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

		req.session.uid = user.id;
		return res.redirect('/');
	} catch (err) {
		return res.render('login', {
			error: err.message
		});
	}
});

/* GET register page. */
router.get('/register', async function(req, res, next) {
	return res.render('register');
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
			error: err.message
		});
	}
});

/* GET submit page. */
router.get('/submit', authMiddleware.userAuthenticated, async function(req, res, next) {
	return res.render('submit');
});

const cpUpload = upload.fields([{ name: 'writeup', maxCount: 1 }, { name: 'report', maxCount: 1 }])
router.post('/submit', cpUpload, authMiddleware.userAuthenticated, async function(req, res, next) {
	const flag = req.body.flag;
	const writeup = req.files['writeup'] ? req.files['writeup'][0] : null;
	const report = req.files['report'] ? req.files['report'][0] : null;
	const uid = req.session.uid;

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
				success: 'Document submitted successfully! Pending manual scoring.'
			});
		}

		// Handle flag submission
		if (flag) {
			// Check if the flag is valid
			if (!scoring.isValidFlag(flag)) {
				throw new Error('Invalid flag.');
			}

			// Check if the user has already submitted this flag
			const submissions = await db.getUserSubmissions(uid);
			if (submissions.find(s => s.flag === flag)) {
				throw new Error('Flag already submitted.');
			}

			const value = scoring.getFlagValue(flag);
			await db.submitFlag(uid, flag, value);

			return res.render('submit', {
				success: 'Flag submitted successfully!',
			});
		}
	} catch (err) {
		return res.render('submit', {
			error: err.message,
		});
	}
});

router.get('/logout', async function(req, res, next) {
	req.session.uid = null;
	return res.redirect('/login');
});

module.exports = router;
