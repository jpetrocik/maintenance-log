var mysql     =    require('mysql');

var config = require("./config.json");

var pool = mysql.createPool(config.database);

var INVITATIONS_TABLE = "invitations";
var ACCOUNTS_TABLE = "user_accounts";
var VALIDATION_TABLE = "validation_codes";

var executeQuery = function(sqlStatement, sqlParams, callback) {
	// console.log(sqlStatement);
	// console.log(sqlParams);
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
    	if (error)
    		console.log(error);
		callback(error, results);
    });
};

var tokenGenerator = function(tokenSize) {
	let token = "";
	for (i=0; i < tokenSize ; i++) {
		let base = Math.floor(Math.random() * 62)
	if (base > 51 )
		token += (base - 52)
	else if (base > 25 )
		token += String.fromCharCode(39  + base);
	else
		token +=  String.fromCharCode(97 + base);
	}
	return token;
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
    	callback(err, results[0].carId);
    });
  },

  createInvitation:  function(uToken, car, callback) {
  	let iToken = tokenGenerator(25);
	executeQuery("insert into " + INVITATIONS_TABLE + " (iToken, uToken, oToken, carId) values (?, ?, ?, ?)", [iToken, uToken, car.token, car.id], (err, results) => {
		callback(err, iToken);
	});
  },

  register:  function(email, callback) {
  	let uToken = tokenGenerator(25);
  	let aToken = tokenGenerator(25);
	executeQuery("insert into " + ACCOUNTS_TABLE + " (email, uToken, aToken) values (?, ?, ?)", [email, uToken, aToken], (err, results) => { 
		callback(err, aToken)
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

		console.log(results);
		if (results.length === 0) {
			callback();
			return;
		}

		console.log("?aToken=" + results[0].aToken);
		callback();
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
		callback("Login succesful", true);
	});
  },

  generateAuthToken:  function(uToken, callback) {
  	let aToken = tokenGenerator(25);
	executeQuery("update " + ACCOUNTS_TABLE + " set aToken=? where uToken=?", [aToken, uToken], (err, results) => { 
		callback(err, aToken)
	});
  }

}

module.exports = invitations;
