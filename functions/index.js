// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
var admin = require("firebase-admin");

var serviceAccount = require("./progmansys-creds.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://progmansys-6f164.firebaseio.com"
});

// Firestore reference
const firestore = admin.firestore();

// Enable CORS
const cors = require('cors')({origin: true});

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
            mapping: [],
            published: false
        });
    }).then(documentRef => {
        return documentRef.get();
    }).then(snapshot => {
        res.send(snapshot.data());
        return 0;
    }).catch(error => {
        res.status(400).send(error.message)
        return 0;
    });
});

exports.createModule = functions.https.onRequest(async (req,res) => {
    cors(req, res, () => {
        // Setup variables
        const name = req.body.name;
        const semester = req.body.semester;
        const year = req.body.year;
        const credits = req.body.credits;
        const idToken = req.body.idToken;
        var uid;
        // Check semester is valid
        new Promise((resolve, reject) => {
            if(semester < 1 || semester > 2){
                reject(Error("Semester must be a number between 1 and 2"));
            }else{
                resolve();
            }
        })
        // Check year is valid
        .then(() => {
            if(year < 1 || year > 2){
                return Promise.reject(Error("Year must be a number between 1 and 4"));
            }else{
                return Promise.resolve();
            }
        })
        // Check user is logged in
        .then(() => {
            return admin.auth().verifyIdToken(idToken);
        })
        .then(decodedToken => {
            uid = decodedToken.uid;
            return;
        })
        // Check module name is not taken
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
        // Create module
        .then(() => {
            return firestore.collection('modules').add({
                name: name,
                leader: uid,
                semester: semester,
                year: year,
                credits: credits,
                outcomes: [],
                prerequisites: []
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
            res.status(400).send(error.message);
            console.log(error.message);
            return;
        });
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
    firestore.collection('modules').doc(moduleId).get()
    .then(snapshot => {
        if(!snapshot.exists){
            return Promise.reject(Error("Module not found"));
        }else{
            moduleDoc = snapshot.data();
            return Promise.resolve();
        }
    })
    // Check programme exists
    .then(() => {
        return firestore.collection('programmes').doc(programmeId).get();
    })
    .then(snapshot => {
        if(!snapshot.exists){
            return Promise.reject(Error("Programme not found"));
        }else{
            programmeDoc = snapshot.data();
            return Promise.resolve();
        }
    })
    // Check user is authorised
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
    // Check this module is not already assigned to this programme
    .then(() => {
        if(programmeDoc.modules.includes(moduleId)){
            return Promise.reject(Error("Module already assigned to this programme"));
        }else{
            return Promise.resolve();
        }
    })
    // Check programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot edit a published programme"));
        }else{
            return Promise.resolve();
        }
    })
    // Check module year is within programme duration
    .then(() => {
        if(moduleDoc.year > programmeDoc.duration){
            return Promise.reject(Error("Module year not within programme duration"));
        }else{
            return Promise.resolve();
        }
    })
    // Assign module
    .then(() => {
        programmeDoc.modules.push(moduleId);
        return firestore.collection('programmes').doc(programmeId).update({
            modules: programmeDoc.modules
        });
    })
    .then(result => {
        res.status(200).send("Module assigned successfully")
        return;
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
        return;
    });
});

exports.deleteModule = functions.https.onRequest((req, res) => {
    // Setup variables
    const moduleId = req.body.moduleId;
    const idToken = req.body.idToken;
    var uid;
    var moduleRef;
    var moduleDoc;
    // Check module exists
    firestore.collection('modules').doc(moduleId).get()
    .then(snapshot => {
        if(!snapshot.exists){
            return Promise.reject(Error("Module not found"));
        }else{
            moduleRef = snapshot.ref;
            moduleDoc = snapshot.data();
            return Promise.resolve();
        }
    })
    // Check user is logged in
    .then(() => {
        return admin.auth().verifyIdToken(idToken);
    })
    // Check user is module leader
    .then(decodedToken => {
        uid = decodedToken.uid;
        if(!moduleDoc.leader == uid){
            return Promise.reject(Error("User not permitted to perform this action"));
        }else{
            return Promise.resolve();
        }
    })
    // Check module is not part of any programmes
    .then(() => {
        return firestore.collection("programmes").where("modules", "array-contains", moduleId).get();
    })
    .then(snapshot => {
        if(snapshot.empty){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Cannot delete module while it is a member of a programme"));
        }
    })
    // Delete module
    .then(() => {
        return moduleRef.delete();
    })
    .then(() => {
        res.send("Module deleted");
        return;
    })
    .catch(error => {
        res.status("400").send(error.message);
    });
});

exports.deleteProgramme = functions.https.onRequest((req, res) => {
    // Setup variables
    const programmeId = req.body.programmeId;
    const idToken = req.body.idToken;
    var uid;
    var programmeRef;
    var programmeDoc;
    // Check programme exists
    firestore.collection('programmes').doc(programmeId).get()
    .then(snapshot => {
        if(!snapshot.exists){
            return Promise.reject(Error("programme not found"));
        }else{
            programmeRef = snapshot.ref;
            programmeDoc = snapshot.data();
            return Promise.resolve();
        }
    })
    // Check user is logged in
    .then(() => {
        return admin.auth().verifyIdToken(idToken);
    })
    // Check user is programme leader
    .then(decodedToken => {
        uid = decodedToken.uid;
        if(!programmeDoc.leader == uid){
            return Promise.reject(Error("User not permitted to perform this action"));
        }else{
            return Promise.resolve();
        }
    })
    // Check programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot delete a published programme"));
        }else{
            return Promise.resolve();
        };
    })
    // Delete programme
    .then(() => {
        return programmeRef.delete();
    })
    .then(() => {
        res.send("Programme deleted");
        return;
    })
    .catch(error => {
        res.status("400").send(error.message);
    });
});

exports.unassignModule = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.addAdministrator = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.removeAdministrator = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.transferProgrammeOwnership = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.transferModuleOwnership = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.assignProgrammeOutcome = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.assignModuleOutcome = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.unassignProgrammeOutcome = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.unassignModuleOutcome = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.mapOutcome = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.unmapOutcome = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.assignPrerequisite = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.unassignPrerequisite = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.changeSemester = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.changeYear = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.changeDuration = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.publishProgramme = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.unpublishProgramme = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.setCore = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});

exports.setOptional = functions.https.onRequest((req, res) => {
    res.send("Not yet implemented");
});