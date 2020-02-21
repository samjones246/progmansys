// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
var admin = require("firebase-admin");

var serviceAccount = require("./progmansys-creds.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://progmansys-6f164.firebaseio.com"
});
const firestore = admin.firestore();
exports.createProgramme = functions.https.onRequest(async (req, res) => {
    const name = req.body.name;
    const duration = req.body.duration;
    const idToken = req.body.idToken;
    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        let uid = decodedToken.uid;
        firestore.collection('programmes').add({
            name: name,
            leader: uid,
            duration: duration,
            modules: [],
            outcomes: [],
            core: [],
            administrators: [
                uid
            ],
            mapping: []
        }).then(documentRef => {
            documentRef.get().then(doc => {
                res.send(doc.data());
            })
        });
    }).catch(function(error) {
        // Handle error
    });
});