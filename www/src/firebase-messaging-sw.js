// Import and configure the Firebase SDK
// See: https://firebase.google.com/docs/web/messaging/js/receive
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD-DLGrdd-4csQXwhUOw9T_h5rT-BSuJrA",
    authDomain: "maintenancelog-b8c0a.firebaseapp.com",
    projectId: "maintenancelog-b8c0a",
    storageBucket: "maintenancelog-b8c0a.firebasestorage.app",
    messagingSenderId: "577229242700",
    appId: "1:577229242700:web:d8506609936b6ea8bbcfe9",
    measurementId: "G-ZKM98KNSYM"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
