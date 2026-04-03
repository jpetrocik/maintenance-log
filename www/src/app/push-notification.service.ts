import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private messaging!: Messaging;
  private vapidKey!: string;
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  constructor(private http: HttpClient) {
    this.initializationPromise = this.initializeFirebase();
  }

  private async initializeFirebase(): Promise<void> {
    try {
      const firebaseConfig = await firstValueFrom(this.http.get<any>('/api/firebase-config'));
      this.vapidKey = firebaseConfig.vapidKey;
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);
      this.isInitialized = true;
      console.log('Firebase Messaging Initialized.');
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
      this.isInitialized = false;
    }
  }

  public async requestPermissionAndToken(): Promise<void> {
    await this.initializationPromise;
    if (!this.isInitialized) {
      console.log('Firebase not initialized, cannot request permission.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await this.retrieveToken();
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (err) {
      console.error('An error occurred while requesting permission. ', err);
    }
  }

  private async retrieveToken(): Promise<void> {
    try {
      const currentToken = await getToken(this.messaging, { vapidKey: this.vapidKey });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        this.sendTokenToServer(currentToken);
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  }

  private sendTokenToServer(token: string) {
    this.http.post('/api/fcm/token', { token }).subscribe(
      () => console.log('Token sent to server successfully.'),
      error => console.error('Error sending token to server:', error)
    );
  }

  public async listenForMessages(): Promise<void> {
    await this.initializationPromise;
    if (!this.isInitialized) {
      console.log('Firebase not initialized, cannot listen for messages.');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received. ', payload);
      // Optional: Display a toast or update the UI
    });
  }
}
