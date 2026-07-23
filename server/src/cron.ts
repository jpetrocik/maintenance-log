import { BaseService } from "./base.service";
import { fcmService } from "./fcm.service";
import { fcmAdminService } from "./fcm.admin.service";

interface UnreportedMileageRecord {
    carId: number;
    vehicle: string;
    invitationToken: string;
    userToken: string;
    daysSinceLastMileageReport: number;
}


class CronService extends BaseService {

	async unreportedMileage() {
		let sql = `
			SELECT 
				my_garage.id carId, 
				my_garage.name AS vehicle, 
				invitation.invitationToken, 
				invitation.userToken,
				DATEDIFF(NOW(), MAX(mileage_log.created_date)) AS daysSinceLastMileageReport 
			FROM 
				mileage_log 
			JOIN 
				my_garage ON mileage_log.carId = my_garage.id 
			JOIN 
				invitation ON invitation.objectToken = my_garage.token 
			JOIN 
				user_accounts ON invitation.userToken = user_accounts.usertoken 
			WHERE 
				my_garage.status = 'ACTIVE' 
				AND invitation.role = 10 
			GROUP BY 
				my_garage.id, 
				user_accounts.userToken, 
				invitation.invitationToken, 
				my_garage.name 
			HAVING 
				daysSinceLastMileageReport > 30`;

		const results = await this.executeQuery(sql, []) as UnreportedMileageRecord[];
        console.log(`Sending notifications for ${results.length} unreported mileage records...`);

        if (results.length === 0) {
            return;
        }

        const userTokens = [...new Set(results.map(record => record.userToken))];
        const fcmTokens = await fcmService.getTokens(userTokens);
        
        const tokenMap = new Map(fcmTokens.map(token => [token.userToken, token.fcmToken]));

        for (const record of results) {
            const fcmToken = tokenMap.get(record.userToken);

            if (fcmToken) {
                const message = {
                    notification: {
                        title: 'Maintenance Log',
                        body: `No mileage reported for ${record.vehicle} in over ${record.daysSinceLastMileageReport} days.`
                    },
                    data: {
                        invitationToken: record.invitationToken,
                        url: `/mileage/${record.invitationToken}`
                    },
                    token: fcmToken
                };

                try {
                    const messaging = fcmAdminService.getMessaging();
                    if (messaging) {
                        const response = await messaging.send(message);
                        console.log(`Successfully sent message to user ${record.userToken} for vehicle ${record.vehicle}`);
                    }
                } catch (error) {
                    console.error(`Error sending message to user ${record.userToken}:`, error);
                }
            }
        }
    }

	startCronJobs() {
		const now = new Date();
		const nextTuesday = new Date();
		const TUESDAY = 2; // Day of week: Sunday = 0, Tuesday = 2

		// Set the target time to 8:00:00 AM
		nextTuesday.setHours(8, 0, 0, 0);

		// Calculate days until next Tuesday
		const currentDay = now.getDay();
		let daysUntilTuesday = (TUESDAY - currentDay + 7) % 7;

		// If today is Tuesday but it's already past 8 AM, schedule for the following Tuesday
		if (daysUntilTuesday === 0 && now.getTime() > nextTuesday.getTime()) {
			daysUntilTuesday = 7;
		}

		nextTuesday.setDate(now.getDate() + daysUntilTuesday);

		const initialDelay = nextTuesday.getTime() - now.getTime();
		const weeklyInterval = 7 * 24 * 60 * 60 * 1000;

		console.log(`Scheduling unreported mileage job. First run at: ${nextTuesday}`);

		setTimeout(() => {
			console.log('Running scheduled job: unreportedMileage');
			cronService.unreportedMileage();

			// Schedule all subsequent runs every week
			setInterval(() => {
				console.log('Running scheduled job: unreportedMileage');
				cronService.unreportedMileage();
			}, weeklyInterval);
		}, initialDelay);
	}
}


export const cronService = new CronService();
