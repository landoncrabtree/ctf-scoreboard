var sqlite3 = require('sqlite3').verbose();
var path = require('path');

var database = new sqlite3.Database(path.join(__dirname, 'users.db'), (err) => {
	if (err) {
      console.error(err.message);
    }
    console.log('Connected to the users database.');
});

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
