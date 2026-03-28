import { BaseService } from './base.service';
import { tokenGenerator } from './tokens';
import nodemailer from 'nodemailer';
import config from './config.json';
import { jwtService } from './jwt.service';
import { invitationService } from './invitation.service';
import * as crypto from 'crypto';

export interface Account {
    userToken: string;
    email: string;
    phone: string;
}

class AccountService extends BaseService {
    async register(email, phone): Promise<string> {
        const userToken = tokenGenerator(25);

        if (!phone)
            phone = null;

        if (!email)
            email = null;

        await this.executeQuery("insert into user_accounts (email, phone, userToken) values (?, ?, ?)", [email, phone, userToken]);
        return userToken;
    }

    async sendLoginLink(email: string) {
        const account = await this.lookupUserByEmail(email);
        if (account) {
            const token = tokenGenerator(50);
            const expires = new Date(Date.now() + (60 * 60 * 1000)); // 1 hout
            await this.executeQuery("insert into login_tokens (userToken, token, expires) values (?, ?, ?)", [account.userToken, token, expires]);

            const mailOptions = {
                from: config.mail.username,
                to: email,
                subject: 'Vehicle Maintenance Log - Login',
                text: `Here is your login link:\n\n${config.host}/login?token=${token}`
            };
            this.sendEmail(mailOptions);
        }
    }

    async verifyLoginToken(token: string): Promise<Account | undefined> {
        const results = await this.executeQuery("select * from login_tokens where token=? and not used and expires > NOW()", [token]);
        if (results.length) {
            await this.executeQuery("update login_tokens set used=true where token=?", [token]);
            return this.lookupUserByUserToken(results[0].userToken);
        }
        return undefined;
    }

    async generateRefreshToken(userToken: string): Promise<string> {
        const refreshToken = tokenGenerator(50);
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expires = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days
        await this.executeQuery("insert into refresh_tokens (userToken, token, expires) values (?, ?, ?)", [userToken, hashedToken, expires]);
        return refreshToken;
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string, newRefreshToken: string } | undefined> {
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const results = await this.executeQuery("select * from refresh_tokens where token=? and expires > NOW()", [hashedToken]);
        
        if (results.length) {
            const userToken = results[0].userToken;
            
            // Invalidate the old refresh token
            await this.executeQuery("delete from refresh_tokens where token=?", [hashedToken]);
            
            // Issue a new refresh token (rotation)
            const newRefreshToken = await this.generateRefreshToken(userToken);
            
            // Issue a new access token
            const invitationTokens = await invitationService.userInvitations(userToken);
            const accessToken = jwtService.generateToken({ userToken, invitationTokens });

            return { accessToken, newRefreshToken };
        }
        return undefined;
    }

    async logout(refreshToken: string) {
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await this.executeQuery("delete from refresh_tokens where token=?", [hashedToken]);
    }

    async lookupUserByUserToken(userToken): Promise<Account | undefined> {
        const results = await this.executeQuery("select * from user_accounts where userToken=?", [userToken]);
        if (!results.length) {
            return undefined;;
        }
        return results[0] as Account;
    }

    async lookupUserByEmail(email): Promise<Account | undefined> {
        const results = await this.executeQuery("select * from user_accounts where email=?", [email]);
        if (!results.length) {
            return undefined;;
        }
        return results[0] as Account;
    }

    async lookupUserByPhone(phone): Promise<Account | undefined> {
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
            tls: { rejectUnauthorized: false },
            debug: true
        });

        transporter.sendMail(mailOptions, function (error, info) {
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
