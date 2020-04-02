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
const apiRoot = "http://localhost:5001/progmansys-6f164/us-central1"
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
const Programme = {
    data: function() {
        return {
            programme: null,
            leader: null,
            core: [],
            optional: [],
            administrators: [],
            ready: true,
            years: [],
            user: null,
            pendingDelete: null,
            showAddModule: false,
            candidateModules: []
        }
    },
    computed: {
        userIsLeader: function(){
            return this.user && this.programme.leader === this.user.uid;
        },
        userIsAdmin: function(){
            return this.user && this.programme.administrators.includes(this.user.uid);
        }
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
            this.showAddModule = false;
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
                this.showAddModule=true;
            })
        },
        getProgramme: function() {
            return firebase.firestore().collection("programmes").doc(this.$route.params.id).get()
            .then(snapshot => {
                this.programme = snapshot.data();
            })
        },
        getLeader: function() {
            axios.post(apiRoot+"/getUser",{
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
            Promise.all(promises)
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
            Promise.all(promises)
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
            if(needsAuth && !this.user){
                return;
            }
            return this.user.getIdToken()
            .then(idToken => {
                data.idToken = idToken;
                return axios.post(apiRoot + "/" + endpoint, data);
            })
        }
    },
    created: function() {
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        this.getProgramme()
        .then(() => {
            this.getLeader();
            this.getAdministrators();
            this.getOutcomes();
            this.getModules();
        })
    },
    template:
    `
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        {{ programme.name }} <a v-if="userIsLeader"><i class="fas fa-edit"></i></a>
                    </h1>
                    <h2 class="subtitle">
                        Led by {{ leader.displayName }} <a v-if="userIsLeader"><i class="fas fa-edit"></i></a>
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
                                Administrators <a v-if="userIsLeader"><i class="fas fa-plus-circle"></i></a>
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
                                Outcomes <a v-if="userIsAdmin"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ul>
                                    <li v-for="o in programme.outcomes">
                                        {{ o }} <a v-if="userIsAdmin"><i class="fas fa-minus-circle"></i></a>
                                    </li>
                                </ul>
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
        <div class="modal" v-bind:class="{'is-active': pendingDelete}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click='pendingDelete=null'></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unassign from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click='unassignModule(pendingDelete)'>Unassign Module</button>
                <button class="button" v-on:click='pendingDelete=null'>Cancel</button>
            </footer>
            </div>
        </div>
        <div class="modal" v-bind:class="{'is-active': showAddModule}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Module</p>
                <button class="delete" aria-label="close" v-on:click='showAddModule=false'></button>
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
                                    <h1 class="title is-4">{{ module.name }} <a v-on:click="assignModule(module)"><i class="fas fa-plus-circle"></i></a></h1>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
                </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-on:click='showAddModule=false'>Cancel</button>
            </footer>
            </div>
        </div>
    </div>
    `
}
const Module = {
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

const routes = [
    { path: '/programmes', component: ProgrammeList },
    { path: '/modules', component: ModuleList },
    { path: '/programmes/:id', component: Programme },
    { path: '/modules/:id', component: Module }
]
const router = new VueRouter({
    routes
})
var app = new Vue({
    el: '#app',
    router,
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