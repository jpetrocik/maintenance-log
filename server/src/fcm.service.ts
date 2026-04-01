import { BaseService } from './base.service';

class FcmService extends BaseService    {
    async saveToken(userToken: string, fcmToken: string): Promise<void> {
        const sql = 'INSERT INTO fcm_tokens (userToken, fcmToken) VALUES (?, ?) ON DUPLICATE KEY UPDATE fcmToken = ?';
        await this.executeQuery(sql, [userToken, fcmToken, fcmToken]);
    }

    async getTokens(userTokens: string[]): Promise<{ userToken: string, fcmToken: string }[]> {
        if (userTokens.length === 0) {
            return [];
        }

        const placeholders = userTokens.map(() => '?').join(',');
        const sql = `SELECT userToken, fcmToken FROM fcm_tokens WHERE userToken IN (${placeholders})`;

        const results = await this.executeQuery(sql, userTokens);
        return results as { userToken: string, fcmToken: string }[];
    }
}

export const fcmService = new FcmService();
