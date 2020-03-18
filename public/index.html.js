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