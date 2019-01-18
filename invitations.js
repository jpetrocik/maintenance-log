var mysql     =    require('mysql');

var config = require("./config.json");

var pool = mysql.createPool(config.database);

var INVITATIONS_TABLE = "CAR_INVITATIONS";
var ACCOUNTS_TABLE = "CAR_ACCOUNTS";

var executeQuery = function(sqlStatement, sqlParams, callback) {
	//console.log(sqlStatement);
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
    executeQuery("select OBJECT_TOKEN from " + INVITATIONS_TABLE + " where USER_TOKEN=?", [uToken], (err, results) => {
    	let tokens = results.map(x => x.OBJECT_TOKEN);
    	callback(err, tokens);
    });
  },

  resolveInvitation: function(iToken, callback) {
    executeQuery("select OBJECT_TOKEN from " + INVITATIONS_TABLE + " where INVITATION_TOKEN=?", [iToken],  (err, results) => {
    	callback(err, results[0].OBJECT_TOKEN);
    });
  },

  createInvitation:  function(uToken, oToken, callback) {
  	let iToken = tokenGenerator(25);
	executeQuery("insert into " + INVITATIONS_TABLE + " (USER_TOKEN, OBJECT_TOKEN, INVITATION_TOKEN) values (?, ?, ?)", [uToken, oToken, iToken], (err, results) => {
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

  validateUser:  function(req, callback) {
	let aToken = req.cookies._aToken;
	if (aToken == undefined || aToken == null) {
		return;
	}

	executeQuery("select uToken from " + ACCOUNTS_TABLE + " where aToken=?", [aToken], (err, results) => {
		callback(err, results[0].uToken);
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
