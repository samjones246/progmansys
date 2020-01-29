module.exports = async function (context, req, user) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.email  && req.query.password || (req.body && req.body.email && req.body.password)) {
        if(user.length > 0){
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: user[0]
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