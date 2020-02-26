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
    // Setup variables
    const name = req.body.name;
    const duration = req.body.duration;
    const idToken = req.body.idToken;
    var uid;
    // Check duration is valid
    if(duration.isNaN() || duration < 1 || duration > 4){
        res.status(400).send("Duration must be a number between 1 and 4");
        return;
    }
    // Check authority of user (logged in)
    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        uid = decodedToken.uid;
    }).catch(function(error) {
        res.status(403).send("Authentication Failed");
        return;
    });
    // Check programme name is not already taken
    firestore.collection('programmes').where('name', '==', name).get().then(snapshot => {
        if(!snapshot.empty){
            res.status(409).send("A programme with this name already exists");
            return;
        }
    })
    // Create programme
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
            res.status(200).send(doc.data());
            return;
        })
    });
});

exports.createModule = functions.https.onRequest(async (req,res) => {
    // Setup variables
    const name = req.body.name;
    const semester = req.body.semester;
    const year = req.body.year;
    const idToken = req.body.idToken;
    var uid;
    // Check semester is value
    if(semester.isNaN || semester < 1 || semester > 2){
        res.status(400).send("Semester must be a number between 1 and 2");
        return;
    }
    // Check year is valid
    if(year.isNaN || year < 1 || year > 4){
        res.status(400).send("Year must be a number between 1 and 4");
        return;
    }
    // Check authority of user (logged in)
    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        uid = decodedToken.uid;
    }).catch(function(error) {
        res.status(401).send("Authentication Failed");
        return;
    });
    // Check module name not already taken
    firestore.collection('modules').where('name', '==', name).get().then(snapshot => {
        if(!snapshot.empty){
            res.status(409).send("A module with this name already exists");
            return;
        }
    })
    // Create module
    firestore.collection('modules').add({
        name: name,
        leader: uid,
        semester: semester,
        year: year,
        outcomes: [],
    }).then(documentRef => {
        documentRef.get().then(doc => {
            res.send(doc.data());
            return;
        })
    });
});

exports.assignModule = functions.https.onRequest(async (req,res) => {
    // Setup variables
    const programmeId = req.body.programmeId;
    const moduleId = req.body.moduleId;
    const idToken = req.body.idToken;
    var uid;
    var programmeDoc;
    var moduleDoc;
    // Check module exists
    firestore.collection('modules').doc(moduleId).get().then(snapshot => {
        if(snapshot.empty){
            res.status(400).send("Module not found");
            return;
        }else{
            moduleDoc = snapshot.docs[0].data();
        }
    });
    // Check programme exists
    firestore.collection('programmes').doc(programmeId).get().then(snapshot => {
        if(snapshot.empty){
            res.status(400).send("Programme not found");
            return;
        }else{
            programmeDoc = snapshot.docs[0].data();
        }
    });
    // Check authority of user (logged in + admin)
    admin.auth().verifyIdToken(idToken).then(decodedToken => {
        uid = decodedToken.uid;
        if(!programme.administrators.includes(uid)){
            res.status(401).send("User not permitted to perform this action");
            return;
        }
    }).catch(error => {
        res.status(401).send("Authentication failed");
        return;
    });
    // Check module not already assigned to programme
    if(programme.modules.includes(moduleId)){
        res.status(409).send("Module already assigned to this programme");
        return;
    }
    // Check module year is within program duration
    if(moduleDoc.year > programmeDoc.duration){
        res.status(400).send("Module year not within programme duration");
        return;
    }
    // Assign module
    firestore.collection('programmes').doc(programmeId).update({modules: programmeDoc.modules.append}).then(result => {
        res.status(200).send("Module assigned successfully")
        return;
    })
});