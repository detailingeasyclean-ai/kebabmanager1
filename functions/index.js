const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

// Przypomnienie o 11:00 (Czas wejść na zmianę)
exports.przypomnienie11 = onSchedule({
  schedule: "0 11 * * *",
  timeZone: "Europe/Warsaw"
}, async (event) => {
  const payload = {
    notification: {
      title: "Czas zacząć zmianę! ⏱️",
      body: "Nie zapomnij odblokować pulpitu lokalu i odbić się na czytniku RCP.",
    },
  };
  const tokensSnap = await admin.firestore().collection('artifacts/kebab-manager/public/data/fcm_tokens').get();
  const tokens = tokensSnap.docs.map(doc => doc.data().token);
  if (tokens.length > 0) await admin.messaging().sendEachForMulticast({ tokens, ...payload });
});

// Przypomnienie o 18:00 (Zadania i stany)
exports.przypomnienie18 = onSchedule({
  schedule: "0 18 * * *",
  timeZone: "Europe/Warsaw"
}, async (event) => {
  const payload = {
    notification: {
      title: "Zbliża się wieczór! 📋",
      body: "Sprawdźcie listę zadań na górze ekranu i wrzućcie braki sosów do brudnopisu.",
    },
  };
  const tokensSnap = await admin.firestore().collection('artifacts/kebab-manager/public/data/fcm_tokens').get();
  const tokens = tokensSnap.docs.map(doc => doc.data().token);
  if (tokens.length > 0) await admin.messaging().sendEachForMulticast({ tokens, ...payload });
});

// Powiadomienie natychmiastowe o NOWYM ZADANIU z panelu
exports.nowezadanie = onDocumentCreated("artifacts/kebab-manager/public/data/tasks/{taskId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  
  const newTask = snap.data();
  const payload = {
    notification: {
      title: `Nowe zadanie: ${newTask.location === 'All' ? 'Cała sieć' : newTask.location} 🚨`,
      body: newTask.text,
    },
  };

  let query = admin.firestore().collection('artifacts/kebab-manager/public/data/fcm_tokens');
  if (newTask.location !== "All") {
    query = query.where("location", "==", newTask.location);
  }
  
  const tokensSnap = await query.get();
  const tokens = tokensSnap.docs.map(doc => doc.data().token);
  if (tokens.length > 0) await admin.messaging().sendEachForMulticast({ tokens, ...payload });
});