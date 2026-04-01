import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not set in the environment variables. Please check your .env file.');
}

// Resolve the path relative to the project root to ensure it works consistently
const absoluteServiceAccountPath = path.resolve(process.cwd(), serviceAccountPath);

class FcmAdminService {
    private isInitialized = false;

    constructor() {
        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert(absoluteServiceAccountPath)
                });
                this.isInitialized = true;
                console.log('Firebase Admin SDK Initialized.');
            } catch (error) {
                console.error('Firebase Admin SDK initialization error:', error);
                // Throw a more specific error if the file is missing at the resolved path
                if (error.code === 'ENOENT') {
                    throw new Error(`Service account file not found at path: ${absoluteServiceAccountPath}. Ensure the file exists and the build script copied it correctly.`);
                }
                throw error;
            }
        }
    }

    getMessaging() {
        if (!this.isInitialized) {
            console.error("Firebase Admin SDK has not been initialized.");
            return null;
        }
        return admin.messaging();
    }
}

export const fcmAdminService = new FcmAdminService();
