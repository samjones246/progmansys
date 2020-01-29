module.exports = async function (context, req, users, universities) {
    context.log('Register event fired');

    if (req.query.firstName && 
        req.query.lastName && 
        req.query.email &&
        req.query.password 
        || ( req.body && 
        req.body.firstName &&
        req.body.lastName &&
        req.body.email &&
        req.body.password
        )) 
    {
        var firstName = req.query.firstName || req.body.firstName
        var lastName = req.query.lastName || req.body.lastName
        var email = req.query.email || req.body.email
        var password = req.query.password || req.body.password
        var userExists = false;
        var university = null;
        var domain = email.split('@')[1];
        for(i=0;i<users.length;i++){
            if(users[i].email == email){
                userExists = true;
                break;
            }
        }
        for(i=0;i<universities.length;i++){
            if(universities[i].domain == domain){
                university = universities[i].id;
                break;
            }
        }
        if(userExists){
            context.res = {
                status: 409,
                body: "A user with this email already exists"
            }
        }else if(university==null){
            context.res = {
                status: 400,
                body: "Email domain does not match a registered university"
            }
        }else{
            console.log(university)
            context.bindings.outputDocument = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                university: university,
                about: "Nothing here yet"
            }
            console.log(context.bindings.outputDocument)
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: JSON.stringify({
                    id: context.bindings.outputDocument.id,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    university: university,
                    about: context.bindings.outputDocument.about
                })
            };
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
}