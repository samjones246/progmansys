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
                    this.modules.push(doc.data());
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
                <a>Edit</a> - <a>View</a>
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
            modules: null,
            administrators: null,
            ready: false
        }
    },
    created: function() {
        firebase.firestore().collection("programmes").doc(this.$route.params.id).get()
        .then(snapshot => {
            this.programme = snapshot.data();
            this.ready = true;
        })
    },
    template:
    `
    <div v-if="ready">
        <section class="hero is-primary">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        {{ programme.name }}
                    </h1>
                    <h2 class="subtitle">
                    </h2>
                </div>
            </div>
        </section>
    </div>
    `
}
const Module = {

}

const routes = [
    { path: '/programmes', component: ProgrammeList },
    { path: '/modules', component: ModuleList },
    { path: '/programmes/:id', component: Programme },
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