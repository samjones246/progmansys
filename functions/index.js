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
    if(duration.isNaN() || duration < 1 || duration > 4){
        res.send("Duration must be a number between 1 and 4");
        return;
    }
    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        let uid = decodedToken.uid;
        firestore.collection('programmes').where('name', '==', name).get().then(snapshot => {
            if(snapshot.empty){
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
                        return;
                    })
                });
            }else{
                res.send("A programme with this name already exists");
                return;
            }
        })
    }).catch(function(error) {
        res.status(403).send("Authentication Failed");
        return;
    });
});