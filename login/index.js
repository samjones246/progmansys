module.exports = async function (context, req, users) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.email  && req.query.password || (req.body && req.body.email && req.body.password)) {
        var userData = null;
        for(var i=0;i<users.length;i++){
            if(users[i].email==req.query.email||req.body.email && users[i].password==req.query.password||req.body.password){
                userData = users[i];
                break;
            }
        }
        if(userData!=null){
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: userData
            };
        }else{
            context.res = {
                status: 400,
                body: "Email or password incorrect"
            };
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
};