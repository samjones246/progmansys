// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const FieldPath = require('firebase-admin').firestore.FieldPath;

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
    cors(req, res, () => {
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
                mapping: {},
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
            if(![1, 2].includes(semester)){
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
                outcomes: {},
                prerequisites: []
            });
        })
        .then(documentRef => {
            return documentRef.get();
        })
        .then(doc => {
            res.send({
                id: doc.id,
                data: doc.data()
            });
            return;
        })
        .catch(error => {
            res.status(400).send(error.message);
            return;
        });
    });
});

exports.assignModule = functions.https.onRequest(async (req,res) => {
    cors(req, res, () => {
        // Setup variables
        const programme = req.body.programme;
        const module = req.body.module;
        const idToken = req.body.idToken;
        var uid;
        var programmeDoc;
        var moduleDoc;
        // Check module exists
        firestore.collection('modules').doc(module).get()
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
            return firestore.collection('programmes').doc(programme).get();
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
            if(programmeDoc.modules.includes(module)){
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
            programmeDoc.modules.push(module);
            return firestore.collection('programmes').doc(programme).update({
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
});

exports.deleteModule = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const module = req.body.module;
        const idToken = req.body.idToken;
        var uid;
        var moduleRef;
        var moduleDoc;
        // Check module exists
        firestore.collection('modules').doc(module).get()
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
            return firestore.collection("programmes").where("modules", "array-contains", module).get();
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
});

exports.deleteProgramme = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const programme = req.body.programme;
        const idToken = req.body.idToken;
        var uid;
        var programmeRef;
        var programmeDoc;
        // Check programme exists
        firestore.collection('programmes').doc(programme).get()
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
});

exports.unassignModule = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const programme = req.body.programme;
        const module = req.body.module;
        const idToken = req.body.idToken;
        var uid;
        var programmeDoc;
        var moduleDoc;
        // Check module exists
        firestore.collection('modules').doc(module).get()
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
            return firestore.collection('programmes').doc(programme).get();
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
            if(!programmeDoc.modules.includes(module)){
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
            for(i in programmeDoc.mapping){
                delete programmeDoc.mapping[i][module]
            }
            return firestore.collection('programmes').doc(programme).update({
                modules: programmeDoc.modules.filter((value, index, arr) => value!= module),
                core: programmeDoc.core.filter((value, index, arr) => value!= module),
                mapping: programmeDoc.mapping
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
});

exports.addAdministrator = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
});

exports.removeAdministrator = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
});

exports.transferProgrammeOwnership = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
});

exports.transferModuleOwnership = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
});

exports.assignProgrammeOutcome = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
        // GRD3 - Outcome is a string
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
});

exports.assignModuleOutcome = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
        // GRD5 - This outcome is not already assigned to this module
        .then(() => {
            var exists = false;
            for(element in moduleDoc.outcomes) {
                if(moduleDoc.outcomes[element] === outcome){
                    return Promise.reject(Error("This module has already been assigned an identical outcome"));
                }
            }
            return Promise.resolve();
        })
        // GRD6 - Module is not a member of any published programme
        .then(() => {
            return firestore.collection('programmes').where("modules", "array-contains", module).get();
        })
        .then(snapshot => {
            snapshot.docs.forEach(element => {
                if(element.published){
                    return Promise.reject(Error("Cannot edit a module which is part of a published programme"));
                }
            })
            return Promise.resolve();
        })
        // ACT1 - Assign module outcome
        .then(() => {
            var newId;
            var maxId = Object.keys(moduleDoc.outcomes).length;
            for(i=0;i<=maxId;i++){
                if(!moduleDoc.outcomes.hasOwnProperty(i.toString())){
                    newId = i.toString();
                    break;
                }
            }
            moduleDoc.outcomes[newId] = outcome;
            return moduleRef.update("outcomes."+newId, outcome);
        })
        .then(result => {
            res.send(moduleDoc.outcomes);
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.unassignProgrammeOutcome = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
            if(programmeDoc.outcomes.hasOwnProperty(outcomeId)){
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
        // ACT1 & ACT2 - Unassign programme outcome, remove mapping
        .then(() => {
            delete programmeDoc.outcomes[outcomeId]
            return programmeRef.update("outcomes."+outcomeId, FieldValue.delete(), "mapping."+outcomeId, FieldValue.delete())
        })
        .then(result => {
            res.send(programmeDoc.outcomes);
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.unassignModuleOutcome = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const module = req.body.module;
        const outcomeId = req.body.outcomeId;
        var uid;
        var moduleDoc;
        var moduleRef;
        var programmes;
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
        // GRD4 - Requesting user is module leader
        .then(() => {
            return admin.auth().verifyIdToken(idToken);
        })
        .then(decodedToken => {
            uid = decodedToken.uid; 
            if(!moduleDoc.leader === uid){
                return Promise.reject(Error("User not permitted to perform this action"));
            }else{
                return Promise.resolve();
            }
        })
        // GRD5 - The outcome is an outcome of the module
        .then(() => {
            if(moduleDoc.outcomes.hasOwnProperty(outcomeId)){
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
                    return Promise.reject(Error("Cannot edit a module which is part of a published programme"));
                }
            })
            programmes = snapshot;
            return Promise.resolve();
        })
        // ACT1 - Unassign module outcome
        .then(() => {
            delete moduleDoc.outcomes[outcomeId]
            return moduleRef.update("outcomes."+outcomeId, FieldValue.delete(), "mapping."+outcomeId, FieldValue.delete())
        })
        // ACT2 - Remove mappings
        .then(result => {
            var batch = firestore.batch();
            programmes.forEach(document => {
                var mapping = document.data().mapping;
                for (programmeOutcome in mapping){
                    if(mapping[programmeOutcome][module]){
                        batch.update(document.ref, "mapping."+programmeOutcome+"."+module, FieldValue.arrayRemove(outcomeId));
                    }
                }
            })
            return batch.commit();
        })
        .then(result => {
            res.send(moduleDoc.outcomes);
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.mapOutcome = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
        // GRD3 & GRD8 - Programme outcome exists
        .then(() => {
            if(programmeDoc.outcomes.hasOwnProperty(programmeOutcome)){
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
            if(moduleDoc.outcomes.hasOwnProperty(moduleOutcome)){
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
            if(programmeDoc.mapping[programmeOutcome]){
                if(programmeDoc.mapping[programmeOutcome][module]){
                    if(programmeDoc.mapping[programmeOutcome][module].includes(moduleOutcome)){
                        return Promise.reject(Error("Mapping already exists"));
                    }
                }
            }
            return Promise.resolve();
        })
        // GRD11 - Programme is not published
        .then(() => {
            if(programmeDoc.published){
                return Promise.reject(Error("Cannot edit a published programme"));
            }else{
                return Promise.resolve();
            }
        })
        // ACT1 - Map Outcome
        .then(() => {
            if(!programmeDoc.mapping[programmeOutcome]){
                programmeDoc.mapping[programmeOutcome] = {};
            }
            if(!programmeDoc.mapping[programmeOutcome][module]){
                programmeDoc.mapping[programmeOutcome][module] = [];
            }
            programmeDoc.mapping[programmeOutcome][module].push(moduleOutcome)
            return programmeRef.update({
                mapping: programmeDoc.mapping
            })
        })
        .then(result => {
            res.send(programmeDoc.mapping);
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
            console.log(error)
        });
    });
});

exports.unmapOutcome = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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
        // GRD3 & GRD8- Programme outcome exists
        .then(() => {
            if(programmeDoc.outcomes.hasOwnProperty(programmeOutcome)){
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
            if(moduleDoc.outcomes.hasOwnProperty(moduleOutcome)){
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
            if(!programmeDoc.administrators.includes(uid)){
                return Promise.reject(Error("User not permitted to perform this action"));
            }else{
                return Promise.resolve();
            }
        })
        // GRD10 - Mapping exists
        .then(()=>{
            if(programmeDoc.mapping[programmeOutcome][module]){
                if(programmeDoc.mapping[programmeOutcome][module].includes(moduleOutcome)){
                    return Promise.resolve();
                }
            }
            Promise.reject(Error("Mapping does not exist"));
        })
        // GRD11 - Programme is not published
        .then(() => {
            if(programmeDoc.published){
                return Promise.reject(Error("Cannot edit a published programme"));
            }else{
                return Promise.resolve();
            }
        })
        // ACT1 - Unmap Outcome
        .then(() => {
            programmeDoc.mapping[programmeOutcome][module].push(moduleOutcome);
            return programmeRef.update("mapping."+programmeOutcome+"."+module, FieldValue.arrayRemove(moduleOutcome));
        })
        .then(result => {
            return programmeRef.get();
        }) 
        .then(snapshot => {
            res.send(snapshot.mapping);
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            console.log(error.stack);
            res.status(400).send(error.message);
            return;
        });
    });
});

exports.assignPrerequisite = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const module1 = req.body.module1;
        const module2 = req.body.module2;
        var uid;
        var module1Doc;
        var module2Doc;
        var module1Ref;
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
                module1Doc = snapshot.data();
                module1Ref = snapshot.ref;
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Module not found"));
            }
        })
        // GRD43 - Module 2 exists
        .then(() => {
            return firestore.collection("modules").doc(module2).get();
        })
        .then(snapshot => {
            if(snapshot.exists){
                module2Doc = snapshot.data();
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Module not found"));
            }
        })
        // GRD44 - Requesting user is module leader of module 1
        .then(() => {
            if(module1Doc.leader == uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only the module leader can perform this action"));
            }
        })
        // GRD47 - Module 2 is not already a prerequisite of module 1
        .then(() => {
            if(module1Doc.prerequisites.includes(module2)){
                return Promise.reject(Error("Prerequisite relation already exists"))
            }else{
                return Promise.resolve();
            }
        })
        // GRD48 - Module 1 is not module 2
        .then(() => {
            if(module1 == module2){
                return Promise.reject(Error("Cannot assign a module as a prerequisite of itself"));
            }else{
                return Promise.resolve();
            }
        })
        // GRD49 - Module1 is not a member of any published programme
        .then(() => {
            return firestore.collection('programmes').where("modules", "array-contains", module1).get();
        })
        .then(snapshot => {
            snapshot.docs.forEach(element => {
                if(element.published){
                    return Promise.reject(Error("Cannot edit a module which is part of a published programme"));
                }
            })
            return Promise.resolve();
        })
        // GRD51 & GRD52 - Module 2 occurs before module 1
        .then(() => {
            if(module2Doc.year <= module1Doc.year){
                if(module2Doc.semester < module1Doc.semester){
                    return Promise.resolve();
                }
            }
            return Promise.reject(Error("Module 2 must occur before module 1"));
        })
        // ACT41 - Assign Prerequisite
        .then(() => {
            return module1Ref.update("prerequisites", FieldValue.arrayUnion(module2));
        })
        .then(result => {
            return module1Ref.get();
        })
        .then(snapshot => {
            res.send(snapshot.data().prerequisites);
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.unassignPrerequisite = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const module1 = req.body.module1;
        const module2 = req.body.module2;
        var uid;
        var module1Doc;
        var module2Doc;
        var module1Ref;
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
                module1Doc = snapshot.data();
                module1Ref = snapshot.ref;
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Module not found"));
            }
        })
        // GRD43 - Module 2 exists
        .then(() => {
            return firestore.collection("modules").doc(module2).get();
        })
        .then(snapshot => {
            if(snapshot.exists){
                module2Doc = snapshot.data();
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Module not found"));
            }
        })
        // GRD44 - Requesting user is module leader of module 1
        .then(() => {
            if(module1Doc.leader == uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only the module leader can perform this action"));
            }
        })
        // GRD47 - Module 2 is a prerequisite of module 1
        .then(() => {
            if(module1Doc.prerequisites.includes(module2)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Prerequisite relation does not exist"))
            }
        })
        // GRD49 - Module1 is not a member of any published programme
        .then(() => {
            return firestore.collection('programmes').where("modules", "array-contains", module1).get();
        })
        .then(snapshot => {
            snapshot.docs.forEach(element => {
                if(element.published){
                    return Promise.reject(Error("Cannot edit a module which is part of a published programme"));
                }
            })
            return Promise.resolve();
        })
        // ACT41 - Assign Prerequisite
        .then(() => {
            return module1Ref.update("prerequisites", FieldValue.arrayRemove(module2));
        })
        .then(result => {
            return module1Ref.get();
        })
        .then(snapshot => {
            res.send(snapshot.prerequisites);
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.changeSemester = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const module = req.body.module;
        const semester = req.body.semester;
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
        // GRD3 - Requesting user is module leader
        .then(() => {
            if(moduleDoc.leader == uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only the module leader can perform this action"));
            }
        })
        // GRD4 - Semester is valid
        .then(() => {
            if([1,2].includes(semester)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Semester can only be 1 or 2"));
            }
        })
        // GRD5 - Semester is different from currently assigned semester
        .then(() => {
            if(semester === moduleDoc.semester){
                return Promise.reject(Error("Must specify a different semester to the one already assigned"))
            }else{
                return Promise.resolve();
            }
        })
        // GRD6 - Module will still occur after its prerequisites
        .then(() => {
            var promises = [];
            for(i=0;i<moduleDoc.prerequisites.length;i++){
                promises[i] = firestore.collection("modules").doc(moduleDoc.prerequisites[i]).get();
            }
            return Promise.all(promises);
        })
        .then(snapshots => {
            var reject = [];
            snapshots.forEach(prereq => {
                if(prereq.data().year === moduleDoc.year && prereq.data().semester >= semester){
                    reject.push(prereq.data().name);
                }
            })
            if(reject.length > 0){
                return Promise.reject(Error("Change would invalidate prerequisite relation with prerequisites: "+reject.toString()));
            }else{
                return Promise.resolve();
            }
        })
        // GRD7 - Module will still occur before its successors
        .then(() => {
            return firestore.collection("modules").where("prerequisites", "array-contains", module).get();
        })
        .then(snapshot => {
            var reject = [];
            snapshot.docs.forEach(successor => {
                if(successor.data().year === moduleDoc.year && successor.data().semester <= semester){
                    reject.push(successor.data().name);
                }
            })
            if(reject.length > 0){
                return Promise.reject(Error("Change would invalidate prerequisite relation with successors: "+reject.toString()));
            }else{
                return Promise.resolve();
            }
        })
        // GRD8 - Module is not a member of any published programme
        .then(() => {
            return firestore.collection('programmes').where("modules", "array-contains", module).get();
        })
        .then(snapshot => {
            snapshot.docs.forEach(element => {
                if(element.published){
                    return Promise.reject(Error("Cannot edit a module which is part of a published programme"));
                }
            })
            return Promise.resolve();
        })
        // ACT1 - Change semester
        .then(() => {
            return moduleRef.update("semester", semester);
        })
        .then(result => {
            return moduleRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.changeYear = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const module = req.body.module;
        const year = req.body.year;
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
        // GRD3 - Requesting user is module leader
        .then(() => {
            if(moduleDoc.leader == uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only the module leader can perform this action"));
            }
        })
        // GRD4 - Year is valid
        .then(() => {
            if([1,2,3,4].includes(year)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Year can only be 1-4"));
            }
        })
        // GRD5 - Year is different from currently assigned year
        .then(() => {
            if(year === moduleDoc.year){
                return Promise.reject(Error("Must specify a different year to the one already assigned"))
            }else{
                return Promise.resolve();
            }
        })
        // GRD6 - Module will still occur after its prerequisites
        .then(() => {
            var promises = [];
            for(i=0;i<moduleDoc.prerequisites.length;i++){
                promises[i] = firestore.collection("modules").doc(moduleDoc.prerequisites[i]).get();
            }
            return Promise.all(promises);
        })
        .then(snapshots => {
            var reject = [];
            snapshots.forEach(prereq => {
                if(prereq.data().year > year || (prereq.data().year === year && prereq.data().semester >= moduleDoc.semester)){
                    reject.push(prereq.data().name);
                }
            })
            if(reject.length > 0){
                return Promise.reject(Error("Change would invalidate prerequisite relation with prerequisites: "+reject.toString()));
            }else{
                return Promise.resolve();
            }
        })
        // GRD7 - Module will still occur before modules which it is a prerequisite of
        .then(() => {
            return firestore.collection("modules").where("prerequisites", "array-contains", module).get();
        })
        .then(snapshot => {
            var reject = [];
            snapshot.docs.forEach(successor => {
                if(successor.data().year < year || (successor.data().year === year && successor.data().semester <= moduleDoc.semester)){
                    reject.push(successor.data().name);
                }
            })
            if(reject.length > 0){
                return Promise.reject(Error("Change would invalidate prerequisite relation with successors: "+reject.toString()));
            }else{
                return Promise.resolve();
            }
        })
        // GRD8 - Module is not a member of any published programme
        .then(() => {
            return firestore.collection('programmes').where("modules", "array-contains", module).get();
        })
        .then(snapshot => {
            snapshot.docs.forEach(element => {
                if(element.published){
                    return Promise.reject(Error("Cannot edit a module which is part of a published programme"));
                }
            })
            return Promise.resolve();
        })
        // ACT1 - Change year
        .then(() => {
            return moduleRef.update("year", year);
        })
        .then(result => {
            return moduleRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.changeDuration = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const programme = req.body.programme;
        const duration = req.body.duration;
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
        // GRD3 - Duration is valid
        .then(() => {
            if([1,2,3,4].includes(duration)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Duration can only be 1-4"));
            }
        })
        // GRD4 - Requesting user is a programme administrator
        .then(() => {
            if(programmeDoc.administrators.includes(uid)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only a programme administrator can perform this action"));
            }
        })
        // GRD5 - Duration is different from currently assigned duration
        .then(() => {
            if(duration === programmeDoc.duration){
                return Promise.reject(Error("Must specify a different duration to the one already assigned"))
            }else{
                return Promise.resolve();
            }
        })
        // GRD6 - No modules on this programme have a year greater than the new duration
        .then(() => {
            var promises = [];
            for(i=0;i<programmeDoc.modules.length;i++){
                promises[i] = firestore.collection("modules").doc(programmeDoc.modules[i]).get();
            }
            return Promise.all(promises);
        })
        .then(snapshots => {
            var reject = [];
            snapshots.forEach(module => {
                console.log(module)
                if(module.data().year > duration){
                    reject.push(module.data().name);
                }
            })
            if(reject.length > 0){
                return Promise.reject(Error("Modules on this programme would fall outside the duration: "+reject.toString()));
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
        // ACT1 - Change duration
        .then(() => {
            return programmeRef.update("duration", duration);
        })
        .then(result => {
            return programmeRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.publishProgramme = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const programme = req.body.programme;
        var uid;
        var programmeDoc;
        var programmeRef;
        var modules;
        var core;
        var coreSums;
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
        // GRD3 - Requesting user is the programme leader
        .then(() => {
            if(programmeDoc.leader === uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only a programme administrator can perform this action"));
            }
        })
        // GRD4 - Programme is not already published
        .then(() => {
            if(programmeDoc.published){
                return Promise.reject(Error("Programme already published"));
            }else{
                return Promise.resolve();
            }
        })
        // GRD5 - All programme outcomes are mapped to by a module outcome
        .then(() => {
            var reject = [];
            for (o in programmeDoc.outcomes){
                if(!programmeDoc.mapping.hasOwnProperty(o)){
                    reject.push(o);
                }
            }
            if(reject.length > 0){
                return Promise.reject(Error("The following outcomes are not mapped to: "+reject.toString()))
            }else{
                return Promise.resolve();
            }
        })
        // GRD6 - All modules in the programme have their prerequiste modules included in the programme
        .then(() => {
            var promises = [];
            for (i=0;i<programmeDoc.modules.length;i++){
                promises[i] = firestore.collection("modules").doc(programmeDoc.modules[i]).get();
            }
            return Promise.all(promises);
        })
        .then(snapshots => {
            var reject = [];
            modules = snapshots;
            snapshots.forEach(_module => {
                var module = _module.data();
                if(!module.prerequisites.every(p => programmeDoc.modules.includes(p))){
                    reject.push(module.name);
                }
            });
            if(reject.length > 0){
                return Promise.reject(Error("The following modules do not have all their prerequisites met: "+reject.toString()))
            }else{
                return Promise.resolve();
            }
        })
        // GRD7 - All prerequisites of core modules are also core
        .then(() => {
            var promises = [];
            for (i=0;i<programmeDoc.core.length;i++){
                promises[i] = firestore.collection("modules").doc(programmeDoc.core[i]).get();
            }
            return Promise.all(promises);
        })
        .then(snapshots => {
            var reject = [];
            core = snapshots;
            snapshots.forEach(_module => {
                var module = _module.data();
                if(!module.prerequisites.every(p => programmeDoc.core.includes(p))){
                    reject.push(module.name);
                }
            });
            if(reject.length > 0){
                return Promise.reject(Error("The following core modules do not have all their prerequisites marked as core: "+reject.toString()))
            }else{
                return Promise.resolve();
            }
        })
        // GRD8 - There are not more than 60 credits worth of core modules in any semester
        .then(() => {
            var sums = [];
            for(y=1;y<=programmeDoc.duration;y++){
                sums[y] = []
            }
            var reject = [];
            core.forEach(_module => {
                var module = _module.data();
                sums[module.year][module.semester] += module.credits;
            })
            for (y=1;y<=programmeDoc.duration;y++){
                for(s=1;s<=2;s++){
                    if(sums[y][s] > 60){
                        reject.push("Year "+y+", Semester "+s+"\n")
                    }
                }
            }
            if(reject.length > 0){
                return Promise.reject(Error("More than 60 credits worth of core modules in the following semesters:" +reject.toString()));
            }else{
                coreSums = sums;
                return Promise.resolve();
            }
        })
        // GRD9 - There are at least 60 credits worth of modules in every semester
        .then(() => {
            var sums = [];
            for(y=1;y<=programmeDoc.duration;y++){
                sums[y] = []
            }
            var reject = [];
            modules.forEach(_module => {
                var module = _module.data();
                sums[module.year][module.semester] += module.credits;
            })
            for (y=1;y<=programmeDoc.duration;y++){
                for(s=1;s<=2;s++){
                    if(sums[y][s] < 60){
                        reject.push("Year "+y+", Semester "+s+"\n")
                    }
                }
            }
            if(reject.length > 0){
                return Promise.reject(Error("Less than 60 credits worth of modules in the following semesters:" +reject.toString()))
            }else{
                return Promise.resolve();
            }
        })
        // GRD10 - There are no optional modules with credits exceeding the number of credits which are not taken by core modules
        .then(() => {
            var reject = [];
            modules.forEach(_module => {
                var module = _module.data();
                if(module.credits + coreSums[module.year][module.semester] > 60){
                    reject.push(module.name)
                }
            })
            if(reject.length > 0){
                return Promise.reject(Error("The following modules award more credits than can be awarded in their semesters after core modules:" +reject.toString()))
            }else{
                return Promise.resolve();
            }
        })
        // ACT1 - Publish programme
        .then(() => {
            return programmeRef.update("published", true);
        })
        .then(result => {
            return programmeRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.unpublishProgramme = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
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
        // GRD3 - Requesting user is the programme leader
        .then(() => {
            if(programmeDoc.leader === uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only the programme leader can perform this action"));
            }
        })
        // GRD4 - Programme is published
        .then(() => {
            if(!programmeDoc.published){
                return Promise.reject(Error("Programme not published"));
            }else{
                return Promise.resolve();
            }
        })
        // ACT1 - Unpublish programme
        .then(() => {
            return programmeRef.update("published", false);
        })
        .then(result => {
            return programmeRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.setCore = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const programme = req.body.programme;
        const module = req.body.module;
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
        // GRD3 - Module exists
        .then(() => {
            return firestore.collection("modules").doc(module).get();
        })
        .then(snapshot => {
            if(snapshot.exists){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Module not found"));
            }
        })
        // GRD4 - Requesting user is an administrator
        .then(() => {
            if(programmeDoc.administrators.includes(uid)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only a programme administrator can perform this action"));
            }
        })
        // GRD5 - Module is a member of programme
        .then(() => {
            if(programmeDoc.modules.includes(module)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("This module is not a member of this programme"));
            }
        })
        // GRD6 - Module is not already core
        .then(() => {
            if(!programmeDoc.core.includes(module)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("This module is already core for this programme"));
            }
        })
        // GRD7 - Programme is not published
        .then(() => {
            if(!programmeDoc.published){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Cannot edit a published programme"));
            }
        })
        // ACT1 - Mark module as core for this programme
        .then(() => {
            return programmeRef.update("core", FieldValue.arrayUnion(module));
        })
        .then(result => {
            return programmeRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.setOptional = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const programme = req.body.programme;
        const module = req.body.module;
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
        // GRD3 - Module exists
        .then(() => {
            return firestore.collection("modules").doc(module).get();
        })
        .then(snapshot => {
            if(snapshot.exists){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Module not found"));
            }
        })
        // GRD4 - Requesting user is an administrator
        .then(() => {
            if(programmeDoc.administrators.includes(uid)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only a programme administrator can perform this action"));
            }
        })
        // GRD5 - Module is a member of programme
        .then(() => {
            if(programmeDoc.modules.includes(module)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("This module is not a member of this programme"));
            }
        })
        // GRD6 - Module is core
        .then(() => {
            if(programmeDoc.core.includes(module)){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("This module is not core for this programme"));
            }
        })
        // GRD7 - Programme is not published
        .then(() => {
            if(!programmeDoc.published){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Cannot edit a published programme"));
            }
        })
        // ACT1 - Mark module as core for this programme
        .then(() => {
            return programmeRef.update("core", FieldValue.arrayRemove(module));
        })
        .then(result => {
            return programmeRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

// Functions which affect system state but are not within the scope of the formal model
exports.renameProgramme = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Setup variables
        const idToken = req.body.idToken;
        const programme = req.body.programme;
        const name = req.body.name;
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
        // GRD3 - Requesting user is programme leader
        .then(() => {
            if(programmeDoc.leader === uid){
                return Promise.resolve();
            }else{
                return Promise.reject(Error("Only the programme leader can perform this action"));
            }
        })
        // ACT1 - Rename programme
        .then(() => {
            return programmeRef.update("name", name);
        })
        .then(result => {
            return programmeRef.get();
        })
        .then(snapshot => {
            res.send(snapshot.data());
            return;
        })
        // If a guard failed, respond with the error
        .catch(error => {
            res.status(400).send(error.message);
        });
    });
});

exports.renameModule = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
    });
});

// Helper functions, will not affect system state
exports.getUser = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        const uid = req.body.uid;
        admin.auth().getUser(uid)
        .then(userRecord => {
            res.send(userRecord.toJSON())
            return;
        })
        .catch(error => {
            res.send(error.message)
            return;
        })
    })
});
exports.getUserByEmail = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        const email = req.body.email;
        admin.auth().getUserByEmail(email)
        .then(userRecord => {
            res.send(userRecord)
            return;
        })
        .catch(error => {
            res.status(400).send("User not found");
            return;
        })
    });
});