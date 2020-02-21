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
    /*
    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        let uid = decodedToken.uid;
        const programme = {
            name: name,
            leader: firestore.doc("users/"+uid),
            duration: duration,
            modules: [],
            outcomes: [],
            core: []
        }
    }).catch(function(error) {
        // Handle error
    });
    */
    firestore.collection('programmes').add({
        name: name,
        leader: firestore.doc("users/"+idToken),
        duration: duration,
        modules: [],
        outcomes: [],
        core: [],
        administrators: [
            firestore.doc("users/"+idToken)
        ],
        mapping: []
    }).then(doc => {
        res.send(doc);
    });
});