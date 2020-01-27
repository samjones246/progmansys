module.exports = async function (context, req, universities) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try{
        var name = req.query.name || req.body.name
        var domain = req.query.domain || req.body.domain
        var exists = false;
        for(var i=0;i<universities.length;i++){
            uni = universities[i];
            if(uni.name == name || uni.domain == domain){
                exists = true;
                break;
            }
        }
        if(exists){
            context.res = {
                status: 409,
                body: "A university with this name or domain already exists"
            };
        }
        else{
            context.bindings.outputDocument = {
                name: name,
                domain: domain
            }
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: name + " added successfully"
            };
        }
        
    }
    catch {
        context.res = {
            status: 400,
            body: "Please pass a name and domain on the query string or in the request body"
        };
    }
};