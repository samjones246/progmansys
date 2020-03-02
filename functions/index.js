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
    var name = req.body.name;
    var duration = req.body.duration;
    var idToken = req.body.idToken;
    var uid = null;

    // Check duration is valid
    if(![1,2,3,4].includes(duration)){
        res.status(400).send("Duration must be a number between 1 and 4");
        return;
    }
    // Check user token
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return null;
    })
    .then(() => {
        return firestore.collection('programmes').where('name', '==', name).get();
    })
    .then(snapshot => {
        if(snapshot.empty){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("A programme with this name already exists"));
        }
    })
    .then(() => {
        return firestore.collection("programmes").add({
            name: name,
            duration: duration,
            leader: uid,
            administrators: [
                uid
            ],
            modules: [],
            core: [],
            outcomes: [],
            mapping: []
        });
    }).then(documentRef => {
        return documentRef.get();
    }).then(snapshot => {
        res.send(snapshot.data());
        return 0;
    }).catch(error => {
        res.status(400).send(error)
        return 0;
    });
});

exports.createModule = functions.https.onRequest(async (req,res) => {
    // Setup variables
    const name = req.body.name;
    const semester = req.body.semester;
    const year = req.body.year;
    const idToken = req.body.idToken;
    var uid;
    // Check semester is valid
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
    admin.auth().verifyIdToken(idToken).then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    .then(() => {
        return firestore.collection('modules').where('name', '==', name).get();
    })
    .then(snapshot => {
        if(snapshot.empty){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("A module with this name already exists"))
        }
    })
    .then(() => {
        return firestore.collection('modules').add({
            name: name,
            leader: uid,
            semester: semester,
            year: year,
            outcomes: [],
        });
    })
    .then(documentRef => {
        return documentRef.get();
    })
    .then(doc => {
        res.send(doc.data());
        return;
    })
    .catch(error => {
        res.status(400).send(error);
        return;
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
            return Promise.reject(Error("Module not found"));
        }else{
            moduleDoc = snapshot.docs[0].data();
            return Promise.resolve();
        }
    })
    .then(() => {
        return firestore.collection('programmes').doc(programmeId).get();
    })
    .then(snapshot => {
        if(snapshot.empty){
            return Promise.reject(Error("Programme not found"));
        }else{
            programmeDoc = snapshot.docs[0].data();
            return Promise.resolve();
        }
    })
    .then(() => {
        return admin.auth().verifyIdToken(idToken);
    })
    .then(decodedToken => {
        uid = decodedToken.uid;
        if(!programmeDoc.administrators.includes(uid)){
            return Promise.reject(Error("User not permitted to perform this action"));
        }else{
            return Promise.resolve();
        }
    })
    .then(() => {
        if(programmeDoc.modules.includes(moduleId)){
            return Promise.reject(Error("Module already assigned to this programme"));
        }else{
            return Promise.resolve();
        }
    })
    .then(() => {
        if(moduleDoc.year > programmeDoc.duration){
            return Promise.reject(Error("Module year not within programme duration"));
        }else{
            return Promise.resolve();
        }
    }).then(() => {
        programmeDoc.modules.push(moduleId);
        return firestore.collection('programmes').doc(programmeId).update({
            modules: programmeDoc.modules
        });
    }).then(result => {
        res.status(200).send("Module assigned successfully")
        return;
    }).catch(error => {
        res.status(400).send(error);
        return;
    });
});