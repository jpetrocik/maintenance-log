const pool = require('./mysql');
const config = require("./config.json");
const exceptions = require('./exceptions.js');
const tokenGenerator = require('./tokens.js');
const plivo = require('./plivo.js');

var INVITATIONS_TABLE = "invitations";
var ACCOUNTS_TABLE = "user_accounts";
var VALIDATION_TABLE = "validation_codes";
var MFA_TABLE = "mfa";

var executeQuery = function(sqlStatement, sqlParams, callback) {
	// console.log(sqlStatement);
	// console.log(sqlParams);
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
    	if (error)
    		console.log(error);
		callback(error, results);
    });
};

var userMapper = function(err, results, callback) {
	if (err) {
		callback(exceptions.GENERIC_SQL_ERROR);
		return;
	}

	if (results.length === 0) {
		callback(exceptions.NO_SUCH_USER);
		return;
	}

	callback(err, { uToken: results[0].uToken, aToken: results[0].aToken, phone: results[0].phone, email: results[0].email } );
}

var invitations = {
	userInvitations: function(uToken, callback) {
		executeQuery("select oToken from " + INVITATIONS_TABLE + " where USER_TOKEN=?", [uToken], (err, results) => {
			let tokens = results.map(x => x.oToken);
			callback(err, tokens);
		});
	},

	resolveInvitation: function(iToken, callback) {
		executeQuery("select oToken, carId from " + INVITATIONS_TABLE + " where iToken=?", [iToken],  (err, results) => {
			carId = results.length ? results[0].carId : undefined
			oToken = results.length ? results[0].oToken : undefined
			callback(err, carId, oToken);
		});
	},

	createInvitation:  function(uToken, carId, carToken, callback) {
		let iToken = tokenGenerator(25);
		executeQuery("insert into " + INVITATIONS_TABLE + " (iToken, uToken, oToken, carId) values (?, ?, ?, ?)", [iToken, uToken, carToken, carId], (err, results) => {
			callback(err, iToken);
		});
	},

	register:  function(email, phone, callback) {
		let uToken = tokenGenerator(25);
		let aToken = tokenGenerator(25);

		if (!phone)
			phone = null;

		if (!email)
			email = null;

		executeQuery("insert into " + ACCOUNTS_TABLE + " (email, phone, uToken, aToken) values (?, ?, ?, ?)", [email, phone, uToken, aToken], (err, results) => { 
			if (err){
				if (err.code === 'ER_DUP_ENTRY') {
					callback(exceptions.USER_EXISTS);
				} else {
					callback(exceptions.GENERIC_SQL_ERROR);
				}
				return;
			}

			user = {};
			user.uToken = uToken;
			user.aToken = aToken;
			user.email = email;
			user.phone = phone;
			callback(err, user);
		});
	},

	createValidationCode:  function(uToken, callback) {
		let expires = new Date(Date.now() + (30*60*1000));
		let validationCode = tokenGenerator(5).toUpperCase();
		executeQuery("insert into " + VALIDATION_TABLE + " (uToken, validationCode, expires) values (?, ?, ?)", [uToken, validationCode, expires], (err, results) => { 
			callback(err, validationCode)
		});
	},

	validateCode:  function(validationCode, callback) {
		executeQuery("select uToken from " + VALIDATION_TABLE + " where validationCode=? AND UNIX_TIMESTAMP(expires)>?", [validationCode, Date.now()/1000], (err, results) => { 
			if (results.length == 0) {
				callback(err);
				return;
			}
			callback(err, results[0].uToken);

		});
	},

	sendAuth:  function(email, callback) {
		executeQuery("select aToken from " + ACCOUNTS_TABLE + " where email=?", [email], (err, results) => {
			if (err) {
				callback(err);
				return;
			}

			if (results.length === 0) {
				callback();
				return;
			}

			console.log("?aToken=" + results[0].aToken);
			callback();
		});

	},

	generateMfa:  function(phone, callback) {
		let expires = new Date(Date.now() + (30*60*1000));
		let token = tokenGenerator(25);
		let code = tokenGenerator(5).toUpperCase();

		this.lookupUserByPhone(phone, (err, user) => {
			if (!user) {
				callback(exceptions.NO_SUCH_USER);
				return;
			}

			executeQuery("insert into " + MFA_TABLE + " (uToken, validationCode, token, expires) values (?, ?, ?, ?)", [user.uToken, code, token, expires], (err, results) => {
				if (err) {
					callback(exceptions.GENERIC_SQL_ERROR);
					return;
				}

				console.log({ token: token, code: code });

				if (config.plivo.enabled) {
					plivo.messages.create(
						config.plivo.phone,
						phone,
						'Your verification code is ' + code
					).catch( e => console.log(e));
				}
				
				callback(err, token);

			});
		});
	},

	validateMfa:  function(mfa, callback) {
		executeQuery("select uToken from " + MFA_TABLE + " where validationCode=? AND token=? AND UNIX_TIMESTAMP(expires)>?", [mfa.code, mfa.token, Date.now()/1000], (err, results) => {
			if (err) {
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			if (results.length === 0) {
				callback(exceptions.INVALID_VALIDATION_CODE);
				return;
			}

			callback(err, results[0].uToken );
		});
	},

	validateUser:  function(req, res, callback) {
		let aToken = req.query.aToken;
		if (aToken === undefined) {
			aToken = req.cookies._aToken;
			if (aToken === undefined) {
				callback();
				return;
			}
		}

		executeQuery("select uToken from " + ACCOUNTS_TABLE + " where aToken=?", [aToken], (err, results) => {
			if (results.length === 0) {
				callback();
				return;
			}

			res.cookie('_aToken',aToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });
			callback(err, results[0].uToken);
		});
	},

	loginUser:  function(uToken, res, callback) {
		if (uToken === undefined) {
			callback("Login failed", false);
			return;
		}

		executeQuery("select aToken from " + ACCOUNTS_TABLE + " where uToken=?", [uToken], (err, results) => {
			if (results.length === 0) {
				callback("Login failed", false);
				return;
			}

			res.cookie('_aToken', results[0].aToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });
			callback(err, true);
		});
	},

	generateAuthToken:  function(uToken, callback) {
		let aToken = tokenGenerator(25);
		executeQuery("update " + ACCOUNTS_TABLE + " set aToken=? where uToken=?", [aToken, uToken], (err, results) => { 
			callback(err, aToken)
		});
	},

	/**
	 * Look up an existing user by email
	 * 
	 * @param {String} email email address of user
	 * @param {requestCallback} callback return user
	 */
	lookupUserByEmail:  function(email, callback) {
		if (!email) {
			callback(exceptions.msg(exceptions.REQUIRED_PARAMETER, "Email required"));
			return;
		}

		executeQuery("select uToken, aToken, phone, email from " + ACCOUNTS_TABLE + " where email=?", [email], (err, results) => {
			userMapper(err, results, callback);
		});
	},

	/**
	 * Look up an existing user by phone
	 * 
	 * @param {String} phone phone number of user
	 * @param {requestCallback} callback return user
	 */
	lookupUserByPhone:  function(phone, callback) {
		if (phone === undefined) {
			callback(exceptions.msg(exceptions.REQUIRED_PARAMETER, "Phone number required"));
			return;
		}

		executeQuery("select uToken, aToken, phone, email from " + ACCOUNTS_TABLE + " where phone=?", [phone], (err, results) => {
			userMapper(err, results, callback);
		});
	},


}

module.exports = invitations;
