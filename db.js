// Description: This file contains the database logic for the application.

var sqlite3 = require('sqlite3').verbose();
var logger = require('morgan');
var path = require('path');

var database = new sqlite3.Database(path.join(__dirname, 'users.db'), (err) => {
	if (err) {
      console.error(err.message);
    }
    console.log('Connected to the users database.');
});

/**
 * Get a user by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<Object>} - The user object.
 * @throws {Error} - Throws an error if the query fails.
 * @async
 */
async function getUserByEmail(email) {
	return new Promise((resolve, reject) => {
    	database.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        	if (err) {
          		return reject(err);
        	}
    		return resolve(row);
    	});
	});
}

/**
 * Get a user by their ID.
 * @param {number} id - The ID of the user.
 * @returns {Promise<Object>} - The user object.
 * @throws {Error} - Throws an error if the query fails.
 * @async
 */
async function getUserById(id) {
	return new Promise((resolve, reject) => {
		database.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
			if (err) {
		  		return reject(err);
			}
			return resolve(row);
		});
	});
}

/**
 * Get all users.
 * @returns {Promise<Array<Object>>} - An array of user objects.
 * @throws {Error} - Throws an error if the query fails.
 * @async
 */
async function getAllUsers() {
	return new Promise((resolve, reject) => {
		database.all('SELECT * FROM users', (err, rows) => {
			if (err) {
				return reject(err);
			}
			return resolve(rows);
		});
	});
}

/**
 * Create a new user.
 * @param {string} name - The name of the user.
 * @param {string} email - The email of the user.
 * @param {string} password - The SHA256 password hash of the user.
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if the query fails.
 * @async
 */
async function createUser(name, email, password) {
	return new Promise((resolve, reject) => {
		database.run('INSERT INTO users (name, email, password, score) VALUES (?, ?, ?, 0)', [name, email, password], (err) => {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});
}

/**
 * Get all submissions for a user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<Array<Object>>} - An array of submission objects.
 * @throws {Error} - Throws an error if the query fails.
 * @async
 */
async function getUserSubmissions(user_id) {
	return new Promise((resolve, reject) => {
		database.all('SELECT * FROM submitted_flags WHERE user_id = ?', [user_id], (err, rows) => {
    		if (err) {
    			return reject(err);
    		}
    		return resolve(rows);
    	});
	});
}

/**
 * Submit a flag for a user.
 * @param {number} user_id - The ID of the user.
 * @param {string} flag - The flag to submit.
 * @param {number} value - The value of the flag.
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if the query fails.
 * @async
 */
async function submitFlag(user_id, flag, value) {
	return new Promise((resolve, reject) => {
		database.run('INSERT INTO submitted_flags (user_id, flag) VALUES (?, ?)', [user_id, flag], (err) => {
			if (err) {
				return reject(err);
			}
			database.run('UPDATE users SET score = score + ?, num_flags = num_flags + 1 WHERE id = ?', [value, user_id], (err) => {
				if (err) {
					return reject(err);
				}
				return resolve();
			});
		});
	});
}

  
// Create the users and submitted_flags tables if they don't exist
database.serialize(() => {
	const create_users = `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
    	name TEXT NOT NULL,
    	email TEXT NOT NULL,
    	password TEXT NOT NULL,
    	score INTEGER NOT NULL,
		num_flags INTEGER DEFAULT 0
	);`;

	const create_submissions = `
	CREATE TABLE IF NOT EXISTS submitted_flags (
    	id INTEGER PRIMARY KEY AUTOINCREMENT,
    	user_id INTEGER NOT NULL,
    	flag TEXT NOT NULL,
    	FOREIGN KEY(user_id) REFERENCES users(id)
	);`;

	database.run(create_users);
  	database.run(create_submissions);

	// For initial testing
  	// database.run(populate_submissions);
  	// database.run(populate_users);
});

module.exports = {
	getUserByEmail,
	getUserById,
	getAllUsers,
	createUser,
	getUserSubmissions,
	submitFlag
};
