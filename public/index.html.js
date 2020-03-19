// FirebaseUI config.
var uiConfig = {
    signInSuccessUrl: 'index.html',
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: 'tos.html',
    privacyPolicyUrl: 'privacyPolicy.html'
};
var ui = new firebaseui.auth.AuthUI(firebase.auth());
const apiRoot = "http://localhost:5001/progmansys-6f164/us-central1"
var app = new Vue({
    el: '#app',
    data: {
        functions: functionsSpec,
        selected: null,
        user: null,
        response: ""
    },
    computed: {
        loggedIn: function () {
            return user ? true : false
        }
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
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
    }
});