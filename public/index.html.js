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
            ready: false,
            years: [],
            user: null
        }
    },
    methods: {
        toggleCore: function(module) {
            var endpoint = apiRoot + (module.core ? "/setOptional" : "/setCore")
            this.user.getIdToken()
            .then(idToken => {
                return axios.post(endpoint, {
                    idToken: idToken,
                    programme: this.$route.params.id,
                    module: module.id
                });
            })
            .then(response => {
                var fromList = module.core ? this.core : this.optional;
                fromList = fromList[module.year - 1][module.semester - 1]
                var toList = module.core ? this.optional : this.core;
                toList = toList[module.year - 1][module.semester - 1]

                for(i=0;i<fromList.length;i++){
                    var target = fromList[i]
                    if(target.id === module.id){
                        toList.push(target);
                        fromList.splice(i, 1)
                        module.core = !module.core;
                        break;
                    }
                }
            });
        },
    },
    created: function() {
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        firebase.firestore().collection("programmes").doc(this.$route.params.id).get()
        .then(snapshot => {
            this.programme = snapshot.data();
            for(i=1;i<=this.programme.duration;i++){
                this.years.push(i);
                this.core.push([[],[]]);
                this.optional.push([[],[]]);
            }
            return axios.post(apiRoot+"/getUser",{
                uid: this.programme.leader
            })
        })
        .then(response => {
            this.leader = response.data;
            var promises = [];
            this.programme.administrators.forEach(admin => {
                promises.push(axios.post(apiRoot+"/getUser",{uid: admin}));
            })
            return Promise.all(promises);
        })
        .then(responses => {
            responses.forEach(response => {
                this.administrators.push(response.data);
            })
            var promises = [];
            this.programme.modules.forEach(module => {
                promises.push(firebase.firestore().collection("modules").doc(module).get());
            })
            return Promise.all(promises);
        })
        .then(snapshots => {
            for(i=0;i<snapshots.length;i++){
                var moduleDoc = snapshots[i].data();
                var year = moduleDoc.year - 1;
                var semester = moduleDoc.semester - 1;
                moduleDoc.id = this.programme.modules[i];
                if(this.programme.core.includes(moduleDoc.id)){
                    moduleDoc.core = true;
                    this.core[year][semester].push(moduleDoc)
                }else{
                    moduleDoc.core = false;
                    this.optional[year][semester].push(moduleDoc)
                }
            }
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
                        {{ programme.name }}
                    </h1>
                    <h2 class="subtitle">
                        Led by {{ leader.displayName }}
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
                                Administrators
                            </h1>
                            <div class="content is-medium">
                                <ul>
                                    <li v-for="a in administrators">
                                        {{ a.displayName }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="tile is-parent">
                        <div class="tile is-child is-warning notification">
                            <h1 class="title">
                                Outcomes
                            </h1>
                            <div class="content is-medium">
                                <ul>
                                    <li v-for="o in programme.outcomes">
                                        {{ o }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tile is-parent">
                    <div class="tile is-child is-danger notification">
                        <h1 class="title is-3">
                            Modules
                        </h1>
                        <div class="content is-medium">
                            <ul>
                                <li v-for="y in years">
                                    <h2 class="title is-4">Year {{ y }}</h2>
                                    <ul>
                                        <li v-for="s in [1,2]">
                                            <h3 class="title is-4">Semester {{ s }} </h3>
                                            <ul>
                                                <li v-for="type in ['Core', 'Optional']">
                                                    <h3 class="title is-4">{{ type }}</h3>
                                                    <ul>
                                                        <li v-for="m in type==='Core' ? core[y-1][s-1] : optional[y-1][s-1]">
                                                            <h3 class="title is-4">{{ m.name }}</h3>
                                                            <div class="subtitle is-6">
                                                                <router-link v-bind:to="'/modules/'+m.id"><i class="fas fa-edit"></i></router-link> -  
                                                                <a><i class="fas fa-trash-alt"></i></a> - 
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