module.exports = async function (context, req, programmes) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        var name = req.query.name || req.body.name;
        var leader = req.query.leader || req.body.leader;
        var duration = req.query.duration || req.body.duration;
        var exists = false;
        for(var i=0;i<programmes.length;i++){
            if(programmes[i].name == name){
                exists = true;
                break;
            }
        }
        if(!exists){
            context.bindings.outputDocument = {
                name: name,
                leader: leader,
                administrators: [leader],
                duration: duration,
                modules: [],
                outcomes: [],
                compulsory: [],
                mapping: []
            }
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: JSON.stringify(ontext.bindings.outputDocument)
            };
        }else{
            context.res = {
                status: 409,
                body: "A programme with this name already exists"
            }
        }
    }
    catch (error) {
        context.res = {
            status: 400,
            body: error.toString()
        };
    }
};