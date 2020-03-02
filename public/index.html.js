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
            var res = axios.post(apiRoot+"/createProgramme", {
                name: $("#programmeName").value,
                duration: $("#programmeDuration").value,
                idToken: user.idToken
            });
            console.log(res);
        });
        $("#createModule").on("click", () => {

        });
        $("#assignModule").on("click", () => {

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