importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDX0CRqfd5qQx0-mkRsELcHFOjRJ4MMzps",
  projectId: "raportykebab",
  messagingSenderId: "551696718074",
  appId: "1:551696718074:web:ae0bfaee9701ad7a125143",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Upewnij się, że masz jakiś plik logo.png lub icon.png w folderze public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
