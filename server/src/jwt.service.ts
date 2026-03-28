import * as jwt from 'jsonwebtoken';
import config from './config.json';

const secret = config.jwtSecret;

export class JwtService {
    generateToken(payload: object): string {
        return jwt.sign(payload, secret, { expiresIn: '15m' });
    }

    verifyToken(token: string): jwt.JwtPayload | null {
        try {
            return jwt.verify(token, secret) as jwt.JwtPayload;
        } catch (error) {
            return null;
        }
    }
}

export const jwtService = new JwtService();
