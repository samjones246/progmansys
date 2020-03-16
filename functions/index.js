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
    // Check requesting user is an administrator
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
    // Check this module is assigned to this programme
    .then(() => {
        if(!programmeDoc.modules.includes(moduleId)){
            return Promise.reject(Error("Module not assigned to this programme"));
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
    // ACT1 - Unassign module
    .then(() => {
        return firestore.collection('programmes').doc(programmeId).update({
            modules: programmeDoc.modules.filter((value, index, arr) => value!= moduleId)
        });
    })
    .then(result => {
        res.status(200).send("Module unassigned successfully")
        return;
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
        return;
    });
});

exports.addAdministrator = functions.https.onRequest((req, res) => {
    // Setup variables
    const programme = req.body.programme;
    const targetUid = req.body.targetUid;
    const idToken = req.body.idToken;
    var uid;
    var programmeDoc;
    var programmeRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return Promise.resolve();
    })
    // GRD2 - Target user is a registered user
    .then(() => {
        return admin.auth().getUser(targetUid);
    })
    .then(userRecord => {
        return;
    })
    // GRD3 - Programme exists
    .then(() => {
        return firestore.collection('programmes').doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"))
        }
    })
    // GRD4 - Requesting user is programme leader
    .then(() => {
        if(programmeDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("User is not permitted to perform this action"));
        }
    })
    // GRD5 - Target user is not already an administrator
    .then(() => {
        if(programmeDoc.administrators.includes(targetUid)){
            return Promise.reject(Error("Target user is already an administrator"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD6 - Programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot edit a published programme"));
        }else{
            return Promise.resolve();
        }
    })
    // ACT1 - Add target user to administrators
    .then(() => {
        programmeDoc.administrators.push(targetUid);
        return programmeRef.update({
            administrators: programmeDoc.administrators
        })
    })
    .then(result => {
        res.send(targetUid + " is now an administrator for "+programmeDoc.name);
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.removeAdministrator = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const targetUid = req.body.targetUid;
    const programme = req.body.programme;
    var uid;
    var programmeDoc;
    var programmeRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Target user is a registered user
    .then(() => {
        return admin.auth().getUser(targetUid);
    })
    .then(userRecord => {
        return;
    })
    // GRD3 - Programme exists
    .then(() => {
        return firestore.collection("programmes").doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"));
        }
    })
    // GRD4 - Requesting user is programme leader
    .then(() => {
        if(programmeDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("User is not permitted to perform this action"));
        }
    })
    // GRD5 - Target user is an administrator
    .then(() => {
        if(!programmeDoc.administrators.includes(targetUid)){
            return Promise.reject(Error("Target user is not an administrator"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD6 - Requesting user is not the target user
    .then(() => {
        if(targetUid == uid){
            return Promise.reject(Error("Cannot remove self from administrators"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD7 - Programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot edit a published programme"));
        }else{
            return Promise.resolve();
        }
    })
    // ACT1 - Remove target user from administrators
    .then(() => {
        programmeDoc.administrators = programmeDoc.administrators.filter((value, index, arr) => value!=targetUid);
        return programmeRef.update({
            administrators: programmeDoc.administrators
        })
    })
    .then(result => {
        res.send(targetUid + " is no longer an administrator for " + programmeDoc.name);
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.transferProgrammeOwnership = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const targetUid = req.body.targetUid;
    const programme = req.body.programme;
    var uid;
    var programmeDoc;
    var programmeRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Target user is a registered user
    .then(() => {
        return admin.auth().getUser(targetUid);
    })
    .then(userRecord => {
        return;
    })
    // GRD3 - Programme exists
    .then(() => {
        return firestore.collection("programmes").doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"));
        }
    })
    // GRD4 - Requesting user is programme leader
    .then(() => {
        if(programmeDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Only the programme leader can perform this action"));
        }
    })
    // GRD5 - Target user is an administrator
    .then(() => {
        if(!programmeDoc.administrators.includes(targetUid)){
            return Promise.reject(Error("Target user is not an administrator"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD6 - Requesting user is not the target user
    .then(() => {
        if(targetUid == uid){
            return Promise.reject(Error("Cannot transfer ownership to self"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD7 - Programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot edit a published programme"));
        }else{
            return Promise.resolve();
        }
    })
    // ACT1 - Transfer programme ownership
    .then(() => {
        return programmeRef.update({
            leader: targetUid
        })
    })
    .then(result => {
        res.send("Ownership of " + programmeDoc.name + " transferred from " + uid + " to " + targetUid);
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.transferModuleOwnership = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const targetUid = req.body.targetUid;
    const module = req.body.module;
    var uid;
    var moduleDoc;
    var moduleRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Target user is a registered user
    .then(() => {
        return admin.auth().getUser(targetUid);
    })
    .then(userRecord => {
        return;
    })
    // GRD3 - Module exists
    .then(() => {
        return firestore.collection("modules").doc(module).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            moduleDoc = snapshot.data();
            moduleRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("module not found"));
        }
    })
    // GRD4 - Requesting user is module leader
    .then(() => {
        if(moduleDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Only the module leader can perform this action"));
        }
    })
    // GRD5 - Requesting user is not the target user
    .then(() => {
        if(targetUid == uid){
            return Promise.reject(Error("Cannot transfer ownership to self"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD6 - Module is not a member of any published programme
    // ACT1 - Transfer module ownership
    .then(() => {
        return moduleRef.update({
            leader: targetUid
        })
    })
    .then(result => {
        res.send("Ownership of " + moduleDoc.name + " transferred from " + uid + " to " + targetUid);
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.assignProgrammeOutcome = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const programme = req.body.programme;
    const outcome = req.body.outcome;
    var uid;
    var programmeDoc;
    var programmeRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Programme exists
    .then(() => {
        return firestore.collection("programmes").doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"));
        }
    })
    .then(() => {
        if(typeof outcome == 'string'){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Outcome must be a string"));
        }
    })
    // GRD4 - Requesting user is an administrator
    .then(() => {
        return admin.auth().verifyIdToken(idToken);
    })
    .then(decodedToken => {
        uid = decodedToken.uid; 
        if(!programmeDoc.administrators.includes(uid)){
            return Promise.reject(Error("Only a programme administrator can perform this action"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD5 - The outcome is not already an outcome of the programme
    .then(() => {
        for (element in programmeDoc.outcomes) {
            if(programmeDoc.outcomes[element] === outcome){
                return Promise.reject(Error("This programme has already been assigned an identical outcome"));
            }
        }
        return Promise.resolve();
    })
    // GRD6 - Programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot edit a published programme"));
        }else{
            return Promise.resolve();
        }
    })
    // ACT1 - Assign programme outcome
    .then(() => {
        var newId;
        var maxId = Object.keys(programmeDoc.outcomes).length;
        for(i=0;i<=maxId;i++){
            if(!programmeDoc.outcomes.hasOwnProperty(i.toString())){
                newId = i.toString();
                break;
            }
        }
        programmeDoc.outcomes[newId] = outcome;
        return programmeRef.update("outcomes."+newId, outcome);
    })
    .then(result => {
        res.send(programmeDoc.outcomes);
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.assignModuleOutcome = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const module = req.body.module;
    const outcome = req.body.outcome;
    var uid;
    var moduleDoc;
    var moduleRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Module exists
    .then(() => {
        return firestore.collection("modules").doc(module).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            moduleDoc = snapshot.data();
            moduleRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Module not found"));
        }
    })
    // GRD3 - The outcome is a module outcome
    .then(() => {
        if(typeof outcome == 'string'){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Outcome must be a string"));
        }
    })
    // GRD4 - Requesting user is module leader
    .then(() => {
        if(moduleDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Only the module leader can perform this action"));
        }
    })
    // GRD5 - The outcome is not already an outcome of the module
    .then(() => {
        var exists = false;
        moduleDoc.outcomes.forEach(element => {
            if(element === outcome){
                exists = true;
            }
        });
        if(exists){
            return Promise.reject(Error("This module has already been assigned an identical outcome"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD6 - Module is not a member of any published programme
    .then(() => {
        return firestore.collection('programmes').where("modules", "array-contains", module).get();
    })
    .then(snapshot => {
        snapshot.docs.forEach(element => {
            if(element.published){
                return Promise.reject("Cannot edit a module which is part of a published programme");
            }
        })
        return Promise.resolve();
    })
    // ACT1 - Assign module outcome
    .then(() => {
        moduleDoc.outcomes.push(outcome);
        return moduleRef.update({
            outcomes: moduleDoc.outcomes
        })
    })
    .then(result => {
        res.send(moduleDoc.outcomes);
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.unassignProgrammeOutcome = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const programme = req.body.programme;
    const outcomeId = req.body.outcomeId;
    var uid;
    var programmeDoc;
    var programmeRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Programme exists
    .then(() => {
        return firestore.collection("programmes").doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"));
        }
    })
    // GRD4 - Requesting user is an administrator
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
    // GRD5 - The outcome is an outcome of the programme
    .then(() => {
        if(outcomeId < programmeDoc.outcomes.length){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Invalid outcome ID"));
        }
    })
    // GRD6 - Programme is not published
    .then(() => {
        if(programmeDoc.published){
            return Promise.reject(Error("Cannot edit a published programme"));
        }else{
            return Promise.resolve();
        }
    })
    // ACT1 - Unassign programme outcome
    .then(() => {
        programmeDoc.outcomes.splice(outcomeId, 1);
        return programmeRef.update({
            outcomes: programmeDoc.outcomes
        })
    })
    .then(result => {
        res.send(programmeDoc.outcomes);
    })
    // ACT2 - Remove outcome mapping
    // ~code~
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.unassignModuleOutcome = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const module = req.body.module;
    const outcomeId = req.body.outcomeId;
    var uid;
    var moduleDoc;
    var moduleRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Module exists
    .then(() => {
        return firestore.collection("modules").doc(module).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            moduleDoc = snapshot.data();
            moduleRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("module not found"));
        }
    })
    // GRD4 - Requesting user is module leader
    .then(() => {
        if(moduleDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Only the module leader can perform this action"));
        }
    })
    // GRD5 - The outcome is an outcome of the module
    .then(() => {
        if(outcomeId < moduleDoc.outcomes.length){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Invalid outcome ID"));
        }
    })
    // GRD6 - Module is not a member of any published programme
    .then(() => {
        return firestore.collection('programmes').where("modules", "array-contains", module).get();
    })
    .then(snapshot => {
        snapshot.docs.forEach(element => {
            if(element.published){
                return Promise.reject("Cannot edit a module which is part of a published programme");
            }
        })
        return Promise.resolve();
    })
    // ACT1 - Unassign module outcome
    .then(() => {
        moduleDoc.outcomes.splice(outcomeId, 1);
        return moduleRef.update({
            outcomes: moduleDoc.outcomes
        })
    })
    .then(result => {
        res.send(moduleDoc.outcomes);
    })
    // ACT2 - Remove outcome mapping
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.mapOutcome = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const programme = req.body.programme;
    const programmeOutcome = req.body.programmeoutcome;
    const module = req.body.module;
    const moduleOutcome = req.body.moduleoutcome;
    var uid;
    var programmeDoc;
    var programmeRef;
    var moduleDoc;
    var moduleRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Programme exists
    .then(() => {
        return firestore.collection("programmes").doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"));
        }
    })
    // GRD3 & GRD8 - Programme outcome exists
    .then(() => {
        if(programmeOutcome < programmeDoc.outcomes.length){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Invalid programme outcome"))
        }
    })
    // GRD4 - Module exists
    .then(() => {
        return firestore.collection("modules").doc(module).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            moduleDoc = snapshot.data();
            moduleRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("module not found"));
        }
    })
    // GRD5 & GRD9 - Module outcome exists
    .then(() => {
        if(moduleOutcome < moduleDoc.outcomes.length){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Invalid module outcome"))
        }
    })
    // GRD6 - Module is a member of the programme
    .then(() => {
        if(programmeDoc.modules.includes(module)){
            return Promise.resolve();
        }else{
            return Promise.reject(Error(moduleDoc.name + " is not a member of " + programmeDoc.name));
        }
    })
    // GRD7 - Requesting user is an administrator of the programme
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
    // GRD10 - Mapping does not already exist
    .then(() => {
        if(programmeDoc.mapping[programmeOutcome] != null){
            if(programmeDoc.mapping[programmeOutcome][module] != null){
                if(programmeDoc.mapping[programmeOutcome][module].includes(moduleOutcome)){
                    return Promise.reject(Error("Mapping already exists"));
                }
            }
        }
        return Promise.resolve();
    })
    // ACT1 - Map Outcome
    .then(() => {
        programmeDoc.mapping[programmeOutcome][module].push(moduleOutcome);
        return programmeRef.update({
            mapping: programmeDoc.mapping
        })
    })
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.unmapOutcome = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const programme = req.body.programme;
    const programmeOutcome = req.body.programmeOutcome;
    const module = req.body.module;
    const moduleOutcome = req.body.moduleOutcome;
    var uid;
    var programmeDoc;
    var programmeRef;
    var moduleDoc;
    var moduleRef;
    // GRD1 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD2 - Programme exists
    .then(() => {
        return firestore.collection("programmes").doc(programme).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            programmeDoc = snapshot.data();
            programmeRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Programme not found"));
        }
    })
    // GRD3 - Programme outcome exists
    .then(() => {
        if(programmeOutcome < programmeDoc.outcomes.length){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Invalid programme outcome"))
        }
    })
    // GRD4 - Module exists
    .then(() => {
        return firestore.collection("modules").doc(module).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            moduleDoc = snapshot.data();
            moduleRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("module not found"));
        }
    })
    // GRD5 - Module outcome exists
    .then(() => {
        if(moduleOutcome < moduleDoc.outcomes.length){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Invalid module outcome"))
        }
    })
    // GRD6 - Module is a member of the programme
    .then(() => {
        if(programmeDoc.modules.includes(module)){
            return Promise.resolve();
        }else{
            return Promise.reject(Error(moduleDoc.name + " is not a member of " + programmeDoc.name));
        }
    })
    // GRD7 - Requesting user is an administrator of the programme
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
    // GRD8 - Programme outcome is assigned to programme
    // GRD9 - Module outcome is assigned to module
    // GRD10 - Mapping exists
    // ACT1 - Unmap Outcome
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
});

exports.assignPrerequisite = functions.https.onRequest((req, res) => {
    // Setup variables
    const idToken = req.body.idToken;
    const module1 = req.body.module1;
    const module2 = req.body.module2;
    var uid;
    var moduleDoc;
    var moduleRef;
    // GRD41 - Requesting user is logged in
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        uid = decodedToken.uid;
        return;
    })
    // GRD42 - Module 1 exists
    .then(() => {
        return firestore.collection("modules").doc(module1).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            moduleDoc = snapshot.data();
            moduleRef = snapshot.ref;
            return Promise.resolve();
        }else{
            return Promise.reject(Error("module not found"));
        }
    })
    // GRD43 - Module 2 exists
    .then(() => {
        return firestore.collection("modules").doc(module2).get();
    })
    .then(snapshot => {
        if(snapshot.exists){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("module not found"));
        }
    })
    // GRD44 - Requesting user is module leader of module 1
    .then(() => {
        if(moduleDoc.leader == uid){
            return Promise.resolve();
        }else{
            return Promise.reject(Error("Only the module leader can perform this action"));
        }
    })
    // GRD47 - Module 2 is not already a prerequisite of module 1
    // GRD48 - Module 1 is not module 2
    .then(() => {
        if(module1 == module2){
            return Promise.reject(Error("Cannot assign a module as a prerequisite of itself"));
        }else{
            return Promise.resolve();
        }
    })
    // GRD49 - Module is not a member of any published programme
    // GRD51 & GRD52 - Module 2 occurs before module 1
    // ACT41 - Assign Prerequisite
    // If a guard failed, respond with the error
    .catch(error => {
        res.status(400).send(error.message);
    });
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