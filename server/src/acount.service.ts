import {BaseService} from './base.service';
import {tokenGenerator} from './tokens';
import nodemailer from 'nodemailer';
import config from './config.json';

export interface Account{
    userToken: string;
    authToken: string;
    email: string;
    phone: string;
}

class AccountService extends BaseService {
    async register(email, phone): Promise<string> {
		const userToken = tokenGenerator(25);
		const authToken = tokenGenerator(25);

		if (!phone)
			phone = null;

		if (!email)
			email = null;

		await this.executeQuery("insert into user_accounts (email, phone, uToken, aToken) values (?, ?, ?, ?)", [email, phone, userToken, authToken]);
		return authToken;
	}

	async sendAuthToken(email) {
		const results = await this.executeQuery("select authToken from user_accounts where email=?", [email]);

		if (results.length) {
			const authToken = results[0].authToken;
			console.log(`AuthToken:${authToken}`);
			var mailOptions = {
				from: config.mail.username,
				to: email,
				subject: 'Vehicle Maintenance Log',
				text: `Here is your login link:\n\nhttp://localhost:4200/login?email=${email}&authToken=${authToken}`
			  };
			this.sendEmail(mailOptions);
		}
	};

	async login(email: string, authToken: string): Promise<string|undefined> {
		const results = await this.executeQuery("select userToken from user_accounts where email=? and authToken=?", [email, authToken]);

		if (results.length) {
			return results[0].userToken;
		}

		return undefined
	};

	async generateValidationCode(userToken): Promise<string|undefined> {

		const account = await this.lookupUserByUserToken(userToken);
		if (!account) {
			return undefined;
		}

		let expires = new Date(Date.now() + (30*60*1000));
		let token = tokenGenerator(25);
		let code = tokenGenerator(5).toUpperCase();

		const results = this.executeQuery("insert into mfa (uToken, validationCode, token, expires) values (?, ?, ?, ?)", [account.userToken, code, token, expires]);
		console.log({ token: token, code: code });

		// if (config.plivo.enabled) {
		// 	plivo.messages.create(
		// 		config.plivo.phone,
		// 		phone,
		// 		'Your verification code is ' + code
		// 	).catch( e => console.log(e));
		// }
		
		return token;
	}

	async validateValidationCode(token: string, code: string): Promise<string|undefined> {
		const results = await this.executeQuery("select uToken from mfa where validationCode=? AND token=? AND UNIX_TIMESTAMP(expires)>?", [code, token, Date.now()/1000]);
		if (!results.length) {
			return results[0].uToken;
		}

		return undefined;
	}

	async lookupUserByAuthToken(userToken): Promise<Account|undefined> {
		const results = await this.executeQuery("select * from user_accounts where authToken=?", [userToken]);
		if (!results.length) {
			return undefined;;
		}

		return results[0] as Account;
	}

	async lookupUserByUserToken(userToken): Promise<Account|undefined> {
		const results = await this.executeQuery("select * from user_accounts where userToken=?", [userToken]);
		if (!results.length) {
			return undefined;;
		}

		return results[0] as Account;
	}


	async lookupUserByEmail(email): Promise<Account|undefined>  {
		const results = await this.executeQuery("select * from user_accounts where email=?", [email]);
		if (!results.length) {
			return undefined;;
		}

		return results[0] as Account;
	}

	async lookupUserByPhone(phone): Promise<Account|undefined>  {
		const results = await this.executeQuery("select * from user_accounts where phone=?", [phone]);
		if (results.length === 0) {
			return undefined;;
		}

		return results[0] as Account;
	}

	async sendEmail(mailOptions) {

		var transporter = nodemailer.createTransport({
			host: "hermes.petrocik.net",
			port: 25,
			secure: false,
			tls: {rejectUnauthorized: false},
			debug:true
		});
				
		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
			console.log(error);
		  } else {
			console.log('Email sent: ' + info.response);
		  }
		});	
	}

}

const accountService = new AccountService();

export { accountService }