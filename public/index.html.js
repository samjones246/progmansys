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
initApp = function() {
    firebase.auth().onAuthStateChanged(user => {
      if(user){
        $("#createProgramme").on("click", () => {
            user.getIdToken().then(idToken => {
                axios.post(apiRoot+"/createProgramme", {
                    name: $("#programmeName").value,
                    duration: parseInt($("#programmeDuration").value),
                    idToken: idToken
                }).then(response => {
                    console.log(response.data)
                });
            });
        });
        $("#createModule").on("click", () => {
            user.getIdToken().then(idToken => {
                axios.post(apiRoot+"/createModule", {
                    name: $("#moduleName").val(),
                    year: parseInt($("#moduleYear").val()),
                    semester: parseInt($("#moduleSemester").val()),
                    credits: parseInt($("#moduleCredits").val()),
                    idToken: idToken
                }).then(response => {
                    console.log(response.data);
                });
            });
        });
        $("#assignModule").on("click", () => {
            user.getIdToken().then(idToken => {
                axios.post(apiRoot+"/assignModule", {
                    programmeId: $("#programmeId").val(),
                    moduleId: $("#moduleId").val(),
                    idToken: idToken
                }).then(response => {
                    console.log(response.data)
                });
            })
        });
        $("#logout").on("click", () =>{
            firebase.auth().signOut().then(()=>{
                location.reload();
            })
        })
        user.getIdToken().then(idToken => {
            $("#token").text(idToken);
        });
        $("#controls").show();
      }else{
        ui.start('#firebaseui-auth-container', uiConfig);
      }
    });
}
window.addEventListener("load", function(){
    initApp();
});
var app = new Vue({
    el: '#app',
    data: {
        functions: functionsSpec,
        selected: null
    },
    methods: {
        convertString: function (input) {
            input = input.replace(/([A-Z])/g, " $1");
            input = input.charAt(0).toUpperCase() + input.slice(1);
            return input;
        },
        sendRequest: async function () {
            if(!app.selected){
                $("#response").text("No function selected");
            }
            console.log(app.selected);
            $("#response").text("Processing...");
            var selectedObject = app.functions[app.selected];
            var data = {};
            for(k in selectedObject){
                if(selectedObject[k] === "text"){
                    data[k] = $("#"+k).val();
                }else{
                    data[k] = parseInt($("#"+k).val());
                }
            }
            firebase.auth().currentUser.getIdToken()
            .then(idToken => {
                data["idToken"] = idToken;
                return;
            })
            .then(() => {
                return axios.post(apiRoot+"/"+app.selected, data)
            })
            .then(response => {
                $("#response").text(JSON.stringify(response.data))
                console.log(response.data)
            })
            .catch(function (error) {
                if (error.response) {
                  $("#response").text(error.response.data);
                } else if (error.request) {
                  $("#response").text(error.request);
                } else {
                  $("#response").text(error.message);
                }
            });
        }
    }
});