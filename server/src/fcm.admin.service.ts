import * as admin from 'firebase-admin';

import * as serviceAccount from './firebase-admin-sdk-config.json';

class FcmAdminService {
    private isInitialized = false;

    constructor() {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
            });
            this.isInitialized = true;
            console.log('Firebase Admin SDK Initialized.');
        }
    }

    getMessaging() {
        if (!this.isInitialized) {
            console.error("Firebase Admin SDK not initialized.");
            return null;
        }
        return admin.messaging();
    }
}

export const fcmAdminService = new FcmAdminService();
