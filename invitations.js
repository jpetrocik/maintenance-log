var config = require("./config.json");
const pool = require('./mysql.js');
const client = require('./plivo.js');
const exceptions = require('./execptions.js');
const tokenGenerator = require('./tokens.js');


var INVITATIONS_TABLE = "invitations";
var ACCOUNTS_TABLE = "user_accounts";
var VALIDATION_TABLE = "validation_codes";
var MFA_TABLE = "mfa";

var executeQuery = function(sqlStatement, sqlParams, callback) {
	console.log(sqlStatement);
	console.log(sqlParams);
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
    	// if (error)
    	// 	console.log(error);
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

let Role = {
	OWNER: 10,
	USER: 1
};

var invitations = {
	/**
	 * Returns a list of invitations for the provided user
	 * 
	 * @param {String} uToken user's token
	 * @param {requestCallback} callback  returns a list of invitations token for the user
	 */
  userInvitations: function(uToken, callback) {
    executeQuery("select iToken from " + INVITATIONS_TABLE + " where uToken=?", [uToken], (err, results) => {
			if (err){
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

    	let iTokens = results.map(x => x.iToken);
    	callback(err, iTokens);
    });
  },

	/**
	 * Returns a list of revokable invitations for the provided oToken
	 * 
	 * @param {String} oToken object token
	 * @param {requestCallback} callback  returns a list of revokable invitations token for an object
	 */
  objectInvitations: function(oToken, callback) {
		executeQuery("select email, phone, rToken from " + INVITATIONS_TABLE + " i join " + ACCOUNTS_TABLE + " a on i.uToken=a.uToken \
			where oToken=? and rToken is not null", [oToken], (err, results) => {
				if (err){
					callback(exceptions.GENERIC_SQL_ERROR);
					return;
				}

				let rTokens = results.map(x => { return {email: x.email, phone: x.phone, rToken: x.rToken} });
				callback(err, rTokens);
    });
	},

	/**
	 * Resolves an invitation to an object's token
	 * 
	 * @param {String} rToken 
	 * @param {String} gToken 
	 * @param {requestCallback} callback returns the object's token
	 */
  revokeInvitation: function(oToken, rToken, callback) {
    executeQuery("delete from " + INVITATIONS_TABLE + " where rToken=? and oToken=?", [rToken, oToken],  (err, results) => {
			if (err){
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			callback();
    });
  },

	/**
	 * Resolves an invitation to an object's token
	 * 
	 * @param {String} iToken 
	 * @param {requestCallback} callback returns the object's token
	 */
  resolveInvitation: function(iToken, roll, callback) {
    executeQuery("select oToken, uToken from " + INVITATIONS_TABLE + " where iToken=? and role>=?", [iToken, roll],  (err, results) => {
			if (err){
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			if (results.length == 0) {
				callback(exceptions.ACCESS_DENIED);
				return;
			}

			callback(err, results[0].oToken, results[0].uToken);
    });
  },

	/**
	 * Creates an inviation to the object for the given user.
	 * 
	 * @param {String} uToken user token
	 * @param {String} oToken object token
	 * @param {requestCallback} callback return the invitation token
	 */
  createInvitation:  function(uToken, oToken, revokeable, role, callback) {
		let iToken = tokenGenerator(25);
		let rToken = null;
		if (revokeable)
			rToken = tokenGenerator(25);

		executeQuery("insert into " + INVITATIONS_TABLE + " (iToken, uToken, oToken, rToken, role) values (?, ?, ?, ?, ?)", [iToken, uToken, oToken, rToken, role], (err, results) => {
			if (err){
				if (err.code === 'ER_DUP_ENTRY') {
					callback(exceptions.INVITATION_EXISTS);
				} else {
					callback(exceptions.GENERIC_SQL_ERROR);
				}
				return;
			}

			callback(err, iToken);
		});
  },

	/**
	 * Registers a new user, returns error is email already exists
	 * 
	 * @param {String} user { user.email, user.phone }
	 * @param {requestCallback} callback returns the auth token for the new user
	 */
  register:  function(user, callback) {
  	let uToken = tokenGenerator(25);
		let aToken = tokenGenerator(25);
		
		//TODO better international number support
		if (!user.phone.startsWith("1")) {
			user.phone = "1" + user.phone;
		}

		executeQuery("insert into " + ACCOUNTS_TABLE + " (email, phone, uToken, aToken) values (?, ?, ?, ?)", [user.email, user.phone, uToken, aToken], (err, results) => {

			if (err){
				if (err.code === 'ER_DUP_ENTRY') {
					callback(exceptions.USER_EXISTS);
				} else {
					callback(exceptions.GENERIC_SQL_ERROR);
				}
				return;
			}

			user.uToken = uToken;
			user.aToken = aToken;
			callback(err, user);
		});
  },

	/**
	 * Creates a validationCode to be used for validate the user
	 * 
	 * @param {String} uToken user token
	 * @param {requestCallback} callback returns the validationCode 
	 */
  createValidationCode:  function(uToken, callback) {
		let expires = new Date(Date.now() + (30*60*1000));
  	let validationCode = tokenGenerator(5).toUpperCase();
		executeQuery("insert into " + VALIDATION_TABLE + " (uToken, validationCode, expires) values (?, ?, ?)", [uToken, validationCode, expires], (err, results) => {
			if (err){
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			callback(err, validationCode)
		});
  },

	/**
	 * Validates the validationCode 
	 * 
	 * @param {String} validationCode validation code to validate
	 * @param {requestCallback} callback returns the user token assoicated with the validation code
	 */
  validateCode:  function(validationCode, callback) {
		executeQuery("select uToken from " + VALIDATION_TABLE + " where validationCode=? AND UNIX_TIMESTAMP(expires)>?", [validationCode, Date.now()/1000], (err, results) => {
			if (results.length == 0) {
				callback(exceptions.INVALID_VALIDATION_CODE);
				return;
			}
			callback(err, results[0].uToken);

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

				if (config.plivo.enabled) {
					client.messages.create(
						config.plivo.phone,
						phone,
						'Your verification code is ' + code
					).then(function(message_created) {
						callback(err, token);
					});
				} else {
					console.log({ token: token, code: code });
					callback(err, token);
				}
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


	/**
	 * Sends an email with an auth token to the email address provide
	 * 
	 * @param {String} email email address of a registered user
	 * @param {requestCallback} callback nothing is returned, so registered users can not be mined
	 */
  sendAuth:  function(email, callback) {

		executeQuery("select aToken from " + ACCOUNTS_TABLE + " where email=?", [email], (err, results) => {
			if (err) {
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			if (results.length === 0) {
				callback(exceptions.NO_SUCH_USER);
				return;
			}

			console.log("?aToken=" + results[0].aToken);
			callback();
		});

  },

	/**
	 * Determines the user from the request and returns the user token
	 * 
	 * @param {Request} req the current express request
	 * @param {Response} res the current express request
	 * @param {requestCallback} callback return the user token for the requesting user
	 */
  validateUser:  function(req, res, callback) {
		let aToken = req.query.aToken;
		if (aToken === undefined) {
			aToken = req.cookies._aToken;
			if (aToken === undefined) {
				callback(exceptions.LOGIN_FAILED);
				return;
			}
		}

		executeQuery("select uToken from " + ACCOUNTS_TABLE + " where aToken=?", [aToken], (err, results) => {
			if (err) {
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			if (results.length === 0) {
				callback(exceptions.LOGIN_FAILED);
				return;
			}

			res.cookie('_aToken',aToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });
			callback(err, results[0].uToken);
		});
  },

	/**
	 * Logins in the provide user so future calls only need to validate the user.
	 * 
	 * @param {String} uToken user token to login
	 * @param {Response} res the current express response 
	 * @param {requestCallback} callback return true if login was succesfully, otherwise false
	 */
  loginUser:  function(uToken, res, callback) {
		if (uToken === undefined) {
			callback(exceptions.LOGIN_FAILED, false);
			return;
		}

		executeQuery("select aToken from " + ACCOUNTS_TABLE + " where uToken=?", [uToken], 
		(err, results) => {
			if (results.length === 0) {
				callback(exceptions.LOGIN_FAILED, false);
				return;
			}

			res.cookie('_aToken', results[0].aToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });
			callback(undefined, true);
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

	/**
	 * Revokes the users auth token and generates a new auth token.
	 * 
	 * @param {String} uToken user token to login
	 * @param {requestCallback} callback return the new auth token
	 */
  generateNewAuthToken:  function(uToken, callback) {
  	let aToken = tokenGenerator(25);
		executeQuery("update " + ACCOUNTS_TABLE + " set aToken=? where uToken=?", [aToken, uToken], (err, results) => {
			if (err) {
				callback(exceptions.GENERIC_SQL_ERROR);
				return;
			}

			callback(err, aToken)
		});
  }

}

invitations.Role = Role;

module.exports = invitations;

/**
 * This callback is displayed as part of the Requester class.
 * @callback requestCallback
 * @param {error} msqlError
 * @param {string} responseMessage
 */