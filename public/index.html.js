// FirebaseUI config.
var uiConfig = {
    signInFlow: 'popup',
    signInSuccessUrl: '/',
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: 'tos.html',
    privacyPolicyUrl: 'privacyPolicy.html'
};
var ui = new firebaseui.auth.AuthUI(firebase.auth());
const apiRoot = "http://localhost:5001/progmansys-6f164/us-central1";

const ProgrammeList = {
    data: function(){
        return {
            user: null,
            programmes: []
        }
    },
    methods: {
        getProgrammes: function () {
            firebase.firestore().collection("programmes").where("administrators", "array-contains", this.user.uid).get()
            .then(snapshot => {
                snapshot.docs.forEach(doc => {
                    var data = doc.data();
                    data.id=doc.id;
                    this.programmes.push(data);
                })
                return;
            })
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            if(user){
                this.getProgrammes();
            }
        })
    },
    template: 
    `
    <div>
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        Programmes
                    </h1>
                    <h2 class="subtitle">
                    </h2>
                </div>
            </div>
        </section>
        <section v-for="p in programmes" class="container is-primary is-light">
            <br>
            <p class="title">{{ p.name }}</p>
            <p class="subtitle">
                <router-link v-bind:to="'programmes/'+p.id">Edit</router-link> - <a>View</a>
            </p>
        </section>
    </div>
    `
}
const ModuleList = {
    data: function(){
        return {
            user: null,
            modules: []
        }
    },
    methods: {
        getModules: function () {
            firebase.firestore().collection("modules").get()
            .then(snapshot => {
                snapshot.docs.forEach(doc => {
                    var data = doc.data();
                    data.id=doc.id;
                    this.modules.push(data);
                })
                return;
            })
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            if(user){
                this.getModules();
            }
        })
    },
    template: 
    `
    <div>
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        Modules
                    </h1>
                    <h2 class="subtitle">
                    </h2>
                </div>
            </div>
        </section>
        <section v-for="m in modules" class="container is-primary is-light">
            <br>
            <p class="title">{{ m.name }}</p>
            <p class="subtitle">
                <a>Edit</a> - <router-link v-bind:to="'/modules/'+m.id">View</router-link>
            </p>
        </section>
    </div>
    `
}

// Programme Editor modals
const AddModule = {
    props: {
        showing: Boolean,
        candidateModules: Array
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Module</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <div class="content">
                    <ul>
                        <li v-for="(year, i) in candidateModules">
                            <h1 class="title is-4">Year {{ i+1 }}</h1>
                            <ul>
                                <li v-for="(semester, j) in year">
                                    <h1 class="title is-4">Semester {{ j+1 }}</h1>
                                    <ul>
                                        <li v-for="(module, k) in semester">
                                            <h1 class="title is-4">{{ module.name }} <a v-on:click="$emit('submit', module)"><i class="fas fa-plus-circle"></i></a></h1>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnassignModule = {
    props: {
        pendingDelete: Object
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingDelete}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingDelete', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unassign {{ pendingDelete.name }} from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Unassign Module</button>
                <button class="button" v-on:click="$emit('update:pendingDelete', null)">Cancel</button>
            </footer>
            </div>
        </div>
    `
}
const RenameProgramme = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean,
        programmeName: String
    },
    created: function(){
        this.pending = this.programmeName;
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Rename Programme</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Programme name" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0 || pending===programmeName">Rename Programme</button>
            <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const AddOutcome = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean
    },
    template:`
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Add Learning Outcome</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Programme learning outcome" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0">Submit</button>
            <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const ConfirmRemoveOutcome = {
    props: {
        pendingDelete: String
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingDelete}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingDelete', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to remove outcome {{ pendingDelete }} from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Confirm</button>
                <button class="button" v-on:click="$emit('update:pendingDelete', null)">Cancel</button>
            </footer>
            </div>
        </div>
        `
}
const MapOutcome = {
    props: {
        pendingMapOutcome: String,
        modules: Array,
        mapping: Object
    },
    computed: {
        filteredModules: function () {
            var out = [];
            for(i in this.modules){
                var module = { ...this.modules[i]};
                var outcomes = {};
                for(j in module.outcomes){
                    var add = true;
                    if(this.mapping[this.pendingMapOutcome]){
                        if(this.mapping[this.pendingMapOutcome][module.id]){
                            if(this.mapping[this.pendingMapOutcome][module.id].includes(j)){
                                add = false;
                            }
                        }
                    }
                    if(add){
                        outcomes[j] = module.outcomes[j];
                    }
                }
                if(Object.keys(outcomes).length){
                    module.outcomes = outcomes;
                    out.push(module);
                }
            }
            return out;
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingMapOutcome}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Map Learning Outcome</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingMapOutcome', null)"></button>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <ul>
                        <li v-for="module in filteredModules">
                            {{ module.name }}
                            <ol>
                                <li v-for="(outcome, i) in module.outcomes" v-bind:value="i">
                                    {{ outcome }} <a v-on:click="$emit('submit', {'moduleId':module.id, 'outcomeId':i})"><i class="fas fa-plus-circle"></i></a>
                                </li>
                            </ol>
                        </li>
                    </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-on:click="$emit('update:pendingMapOutcome', null)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnmapOutcome = {
    props: {
        pendingUnmap: Object
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingUnmap}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingUnmap', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unmap module learning outcome {{ pendingUnmap.module.name }}: {{ pendingUnmap.moduleOutcome }} from programme learning outcome {{ pendingUnmap.programmeOutcome }}: {{ pendingUnmap.programmeOutcomeText }}?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Confirm</button>
                <button class="button" v-on:click="$emit('update:pendingUnmap', null)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const AddAdministrator = {
    data: function() {
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Administrator</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <input class="input" type="text" placeholder="Email" v-model="pending">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)">Submit</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmRemoveAdministrator = {

}

const ProgrammeEditor = {
    data: function() {
        return {
            programme: null,
            leader: null,
            core: [],
            optional: [],
            administrators: [],
            ready: false,
            years: [],
            user: null,
            pendingDelete: null,
            pendingDeleteOutcome: null,
            pendingUnmap: null,
            candidateModules: [],
            pendingProgrammeName: "",
            pendingOutcome: "",
            pendingMapOutcome: null,
            modals: {
                renameProgramme: false,
                addModule: false,
                addOutcome: false,
                mapOutcome: false,
                confirmUnassignModule: false,
                addAdministrator: false,
            }
        }
    },
    computed: {
        userIsLeader: function(){
            return this.user && this.programme.leader === this.user.uid;
        },
        userIsAdmin: function(){
            return this.user && this.programme.administrators.includes(this.user.uid);
        },
        modules: function(){
            var core = this.core.flat(Infinity);
            var optional = this.optional.flat(Infinity);
            var modules = core.concat(optional);
            return modules;
        }
    },
    components: {
        'map-outcome': MapOutcome,
        'add-module': AddModule,
        'confirm-unassign-module': ConfirmUnassignModule,
        'confirm-remove-outcome': ConfirmRemoveOutcome,
        'rename-programme': RenameProgramme,
        'add-outcome': AddOutcome,
        'confirm-unmap-outcome': ConfirmUnmapOutcome,
        'add-administrator': AddAdministrator,
        'confirm-remove-administrator': ConfirmRemoveAdministrator,
    },
    methods: {
        toggleCore: function(module) {
            var endpoint = module.core ? "setOptional" : "setCore";
            this.sendRequest(endpoint, {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   this.getModules();
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        unassignModule: function(module){
            this.pendingDelete = null;
            this.sendRequest("unassignModule", {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   this.getModules();
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        assignModule: function(module){
            this.modals.addModule = false;
            this.sendRequest("assignModule", {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   this.getModules();
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        renameProgramme: function(name){
            this.modals.renameProgramme = false;
            this.sendRequest("renameProgramme", {
                programme: this.$route.params.id,
                name: name
            })
            .then(response => {
                this.getProgramme();
            })
        },
        getCandidateModules: function(){
            this.candidateModules = [];
            for(i=0;i<this.programme.duration;i++){
                this.candidateModules.push([[],[]]);
            }
            firebase.firestore().collection("modules").where("year", "<=", this.programme.duration).get()
            .then(snapshot => {
                snapshot.docs.forEach(document => {
                    var data = document.data();
                    data.id = document.id;
                    if(!this.programme.modules.includes(data.id)){
                        this.candidateModules[data.year-1][data.semester-1].push(data);
                    }
                })
                this.modals.addModule=true;
            })
        },
        getProgramme: function() {
            return firebase.firestore().collection("programmes").doc(this.$route.params.id).get()
            .then(snapshot => {
                this.programme = snapshot.data();
                this.pendingProgrammeName = this.programme.name;
            })
        },
        getLeader: function() {
            return axios.post(apiRoot+"/getUser",{
                uid: this.programme.leader
            })
            .then(response => {
                this.leader = response.data;
            });
        },
        getAdministrators: function() {
            this.administrators=[];
            var promises = [];
            this.programme.administrators.forEach(admin => {
                promises.push(axios.post(apiRoot+"/getUser",{uid: admin}));
            })
            return Promise.all(promises)
            .then(responses => {
                responses.forEach(response => {
                    this.administrators.push(response.data);
                })
            });
        },
        getOutcomes: function() {

        },
        getModules: function() {
            var years=[];
            var core=[];
            var optional=[];
            for(i=1;i<=this.programme.duration;i++){
                years.push(i);
                core.push([[],[]]);
                optional.push([[],[]]);
            }
            var promises = [];
            this.programme.modules.forEach(module => {
                promises.push(firebase.firestore().collection("modules").doc(module).get());
            })
            return Promise.all(promises)
            .then(snapshots => {
                for(i=0;i<snapshots.length;i++){
                    var moduleDoc = snapshots[i].data();
                    var year = moduleDoc.year - 1;
                    var semester = moduleDoc.semester - 1;
                    moduleDoc.id = this.programme.modules[i];
                    if(this.programme.core.includes(moduleDoc.id)){
                        moduleDoc.core = true;
                        core[year][semester].push(moduleDoc)
                    }else{
                        moduleDoc.core = false;
                        optional[year][semester].push(moduleDoc)
                    }
                }
                this.years=years;
                this.core=core;
                this.optional=optional;
            });
        },
        sendRequest: function(endpoint, data, needsAuth=true){
            if(needsAuth){
                if(!this.user) return;
                return this.user.getIdToken()
                .then(idToken => {
                    data.idToken = idToken;
                    return axios.post(apiRoot + "/" + endpoint, data);
                })
            }
            else return axios.post(apiRoot + "/" + endpoint, data)
        },
        getModuleById: function(moduleId){
            for(i in this.modules){
                if(this.modules[i].id === moduleId){
                    return this.modules[i];
                }
            }
            return null;
        },
        addOutcome: function(outcome){
            this.modals.addOutcome = false;
            this.sendRequest("assignProgrammeOutcome", {
                programme: this.$route.params.id,
                outcome: outcome
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                alert(error);
            })
        },
        removeOutcome: function(outcomeId){
            this.pendingDeleteOutcome = null;
            this.sendRequest("unassignProgrammeOutcome", {
                programme: this.$route.params.id,
                outcomeId: outcomeId
            })
            .then(response => {
                this.getProgramme();
            }).catch(error => {
                alert(error);
            })
        },
        mapOutcome: function(p_out, m_out, moduleId){
            this.pendingMapOutcome = null;
            this.sendRequest("mapOutcome", {
                programme: this.$route.params.id,
                programmeOutcome: p_out,
                module: moduleId,
                moduleOutcome: m_out
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                alertError(error);
            })
        },
        unmapOutcome: function (programmeOutcome, module, moduleOutcome) {
            this.pendingUnmap = null;
            this.sendRequest("unmapOutcome", {
                programme: this.$route.params.id,
                programmeOutcome: programmeOutcome,
                module: module,
                moduleOutcome: moduleOutcome
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                alertError(error);
            })
        },
        addAdministrator: function (email) {
            this.modals.addAdministrator = false;
            this.sendRequest("getUserByEmail", {
                email: email
            })
            .then(user => {
                return this.sendRequest("addAdministrator", {
                    programme: this.$route.params.id,
                    targetUid: user.data.uid
                })
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.getAdministrators();
                })
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        alertError: function (error) {
            if (error.response) {
                alert(error.response.data);
            } else {
                alert('Error: ' + error.message);
            }
        }
    },
    created: function() {
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        this.getProgramme()
        .then(() => {
            return Promise.all([
                this.getLeader(),
                this.getAdministrators(),
                this.getOutcomes(),
                this.getModules(),
            ])
        }).then(() => {
            this.ready = true;
        })
    },
    template:
    `
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        {{ programme.name }} <a v-if="userIsLeader" v-on:click="modals.renameProgramme=true" title="Rename Programme"><i class="fas fa-edit"></i></a>
                    </h1>
                    <h2 class="subtitle">
                        Led by {{ leader.displayName }} <a v-if="userIsLeader" title="Transfer ownership"><i class="fas fa-edit"></i></a>
                    </h2>
                </div>
            </div>
        </section>
        <br>
        <div class="tile is-ancestor">
            <div class="tile is-parent is-vertical">
                <div class="tile is-parent">
                    <div class="tile is-parent">
                        <div class="tile is-child is-success notification">
                            <h1 class="title">
                                Administrators <a v-if="userIsLeader" v-on:click="modals.addAdministrator = true"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ul>
                                    <li v-for="a in administrators">
                                        {{ a.displayName }} <a v-if="userIsLeader"><i class="fas fa-minus-circle"></i></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="tile is-parent">
                        <div class="tile is-child is-warning notification">
                            <h1 class="title">
                                Outcomes <a v-if="userIsAdmin" v-on:click="modals.addOutcome=true"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ol>
                                    <li v-for="(o, i) in programme.outcomes" v-bind:value="i">
                                        {{ o }} <a v-if="userIsAdmin" v-on:click="pendingDeleteOutcome = i"><i class="fas fa-minus-circle"></i></a>
                                        <div class="subtitle is-6" v-if="userIsAdmin">
                                            <a v-on:click="pendingMapOutcome = i">Map module outcome</a>
                                        </div>
                                        <ul>
                                            <li v-for="(m, j) in programme.mapping[i]">
                                                {{ getModuleById(j).name }}
                                                <ol>
                                                    <li v-for="o2 in programme.mapping[i][j]" v-bind:value="o2">
                                                        {{ getModuleById(j).outcomes[o2] }} <a v-if="userIsAdmin" v-on:click="pendingUnmap={'module':getModuleById(j),'moduleOutcome': o2,'programmeOutcome': i, 'programmeOutcomeText': o}"><i class="fas fa-minus-circle"></i></a>
                                                    </li>
                                                </ol>
                                            </li>
                                        </ul>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tile is-parent">
                    <div class="tile is-child is-danger notification">
                        <h1 class="title is-3">
                            Modules <a v-if="userIsAdmin" v-on:click="getCandidateModules()"><i class="fas fa-plus-circle"></i></a>
                        </h1>
                        <div class="content is-medium">
                            <ul>
                                <li v-for="y in years">
                                    <h2 class="title is-4">Year {{ y }}</h2>
                                    <ul>
                                        <li v-for="s in [1,2]">
                                            <h3 class="title is-4">Semester {{ s }} </h3>
                                            <ul>
                                                <li v-for="type in ['Core', 'Optional']" v-if="(type==='Core' ? core[y-1][s-1] : optional[y-1][s-1]).length > 0">
                                                    <h3 class="title is-4">{{ type }}</h3>
                                                    <ul>    
                                                        <li v-for="m in type==='Core' ? core[y-1][s-1] : optional[y-1][s-1]">
                                                            <h3 class="title is-4">{{ m.name }}</h3>
                                                            <div class="subtitle is-6" v-if="userIsAdmin">
                                                                <router-link v-bind:to="'/modules/'+m.id"><i class="fas fa-edit"></i></router-link> -  
                                                                <a v-on:click="pendingDelete = m"><i class="fas fa-minus-circle"></i></a> - 
                                                                <a v-on:click="toggleCore(m)">Mark as {{ type==='Core' ? 'optional' : 'core' }}</a>
                                                            </div>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                            <br v-if="s==1">
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <rename-programme 
            v-bind:showing.sync="modals.renameProgramme" 
            v-bind:programmeName="programme.name"
            v-on:submit="renameProgramme($event)"
        />
        <add-module 
            v-bind:showing.sync="modals.addModule"
            v-bind:candidateModules="candidateModules"
            v-on:submit="assignModule($event)"
        />
        <confirm-unassign-module
            v-if="pendingDelete"
            v-bind:pendingDelete.sync="pendingDelete"
            v-on:submit="unassignModule(pendingDelete)"
        />
        <add-outcome 
            v-bind:showing.sync="modals.addOutcome"
            v-on:submit="addOutcome($event)"
        />
        <confirm-remove-outcome
            v-if="pendingDeleteOutcome"
            v-bind:pendingDelete.sync="pendingDeleteOutcome"
            v-on:submit="removeOutcome(pendingDeleteOutcome)"
        />
        <map-outcome
            v-if="pendingMapOutcome"
            v-bind:pendingMapOutcome.sync="pendingMapOutcome"
            v-bind:modules="modules"
            v-bind:mapping="programme.mapping"
            v-on:submit="mapOutcome(pendingMapOutcome, $event.outcomeId, $event.moduleId)"
        />
        <confirm-unmap-outcome
            v-if="pendingUnmap"
            v-bind:pendingUnmap.sync="pendingUnmap"
            v-on:submit="unmapOutcome(pendingUnmap.programmeOutcome, pendingUnmap.module.id, pendingUnmap.moduleOutcome)"
        />
        <add-administrator
            v-bind:showing.sync="modals.addAdministrator"
            v-on:submit="addAdministrator($event)"
        />
    </div>
    `
}
const ModuleEditor = {
    data: function(){
        return {
            module: null,
            leader: null,
            prerequisites: [],
            ready: false
        }
    },
    methods: {
        update: function () {
            this.module = null;
            this.leader = null;
            this.prerequisites = [];
            this.ready = false;
            firebase.firestore().collection("modules").doc(this.$route.params.id).get()
            .then(snapshot => {
                this.module = snapshot.data();
                console.log(snapshot.data())
                return axios.post(apiRoot+"/getUser",{
                    uid: this.module.leader
                })
            })
            .then(response => {
                this.leader = response.data;
                var promises = [];
                this.module.prerequisites.forEach(module => {
                    promises.push(firebase.firestore().collection("modules").doc(module).get());
                })
                return Promise.all(promises);
            })
            .then(snapshots => {
                for(i=0;i<snapshots.length;i++){
                    var moduleDoc = snapshots[i].data();
                    moduleDoc.id = this.module.prerequisites[i];
                    this.prerequisites.push(moduleDoc)
                }
                this.ready = true;
            })
        }
    },
    created: function(){
        this.update();
    },
    watch: {
        '$route': function () {
            this.update();
        }
    },
    template:
    `
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        {{ module.name }}
                    </h1>
                    <h2 class="subtitle">
                        Led by {{ leader.displayName }}
                    </h2>
                </div>
            </div>
        </section>
        <br>
        <div class="tile is-ancestor">
            <div class="tile is-parent">
                <div class="tile is-parent">
                    <div class="tile is-child is-warning notification">
                        <h1 class="title">
                            Outcomes
                        </h1>
                        <div class="content is-medium">
                            <ul>
                                <li v-for="o in module.outcomes">
                                    {{ o }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="tile is-parent">
                    <div class="tile is-child is-danger notification">
                        <h1 class="title is-3">
                            Prerequisites
                        </h1>
                        <div class="content is-medium">
                            <ul>
                                <li v-for="m in prerequisites">
                                    <router-link v-bind:to="'/modules/'+m.id">{{ m.name }}</router-link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}
const CreateModule = {
    data: function() {
        return {
            showing: false
        }
    },
    methods: {
        show: function() {
            this.showing = true;
        },
        hide: function() {
            this.showing = false;
        }
    },
    template: `
    <div id="create-module" class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Create Module</p>
            <button class="delete" aria-label="close" v-on:click="hide()"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name: </label>
              <div class="control">
                <input class="input" type="text" placeholder="EXMP1001 Example">
              </div>
            </div>
            <div class="field">
              <label class="label">Year: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Semester: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>1</option>
                    <option>2</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Credits: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>15</option>
                    <option>30</option>
                    <option>45</option>
                    <option>60</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="hide()">Create</button>
            <button class="button" v-on:click="hide()">Cancel</button>
          </footer>
        </div>
      </div>
    `
}
const CreateProgramme = {
    data: function() {
        return {
            showing: false
        }
    },
    methods: {
        show: function() {
            this.showing = true;
        },
        hide: function() {
            this.showing = false;
        }
    },
    template: `
    <div id="create-programme" class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Create Programme</p>
            <button class="delete" aria-label="close" v-on:click="hide()"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name: </label>
              <div class="control">
                <input class="input" type="text" placeholder="BSc Something">
              </div>
            </div>
            <div class="field">
              <label class="label">Duration: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="hide()">Create</button>
            <button class="button" v-on:click="hide()">Cancel</button>
          </footer>
        </div>
      </div>
    `
}

const routes = [
    { path: '/programmes', component: ProgrammeList },
    { path: '/modules', component: ModuleList },
    { path: '/programmes/:id', component: ProgrammeEditor },
    { path: '/modules/:id', component: ModuleEditor }
]
const router = new VueRouter({
    routes
})
var app = new Vue({
    el: '#app',
    router,
    components: {
        'create-module': CreateModule,
        'create-programme': CreateProgramme
    },
    data: {
        functions: functionsSpec,
        user: null,
        showCreateProgramme: false,
        showCreateModule: false
    },
    methods: {
        convertString: function (input) {
            input = input.replace(/([A-Z])/g, " $1");
            input = input.charAt(0).toUpperCase() + input.slice(1);
            return input;
        },
        sendRequest: async function () {
            if(!app.selected){
                this.response = "No function selected";
            }
            console.log(app.selected);
            this.response = "Processing...";
            var selectedObject = app.functions[app.selected];
            var data = {};
            for(k in selectedObject){
                if(selectedObject[k] === "text"){
                    data[k] = $("#"+k).val();
                }else{
                    data[k] = parseInt($("#"+k).val());
                }
            }
            this.user.getIdToken()
            .then(idToken => {
                data["idToken"] = idToken;
                return;
            })
            .then(() => {
                return axios.post(apiRoot+"/"+app.selected, data)
            })
            .then(response => {
                this.response = JSON.stringify(response.data)
                console.log(response.data)
            })
            .catch(function (error) {
                if (error.response) {
                  this.response = error.response.data;
                } else if (error.request) {
                  this.response = error.request;
                } else {
                  this.response = error.message;
                }
            });
        },
        logout: function () {
            firebase.auth().signOut();
            location.reload()
        },
        login: function () {
            ui.start('#firebaseui-auth-container', uiConfig);
        },
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        if (ui.isPendingRedirect()) {
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    }
});