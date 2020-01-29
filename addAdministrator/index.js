module.exports = async function (context, req, programme, u1, u2) {
    if(!programme){
        context.res = {
            status: 400,
            body: "Programme does not exist"
        }
        context.done();
    }
    if(!u1){
        context.res = {
            status: 400,
            body: "Request sent by invalid user"
        }
        context.done();
    }
    if(!u2){
        context.res = {
            status: 400,
            body: "Target user does not exist"
        }
        context.done();
    }
    // Check u1 is programme leader
    if(!programme.leader == u1.id){
        context.res = {
            status: 400,
            body: "Administrators can only be managed by the programme leader"
        }
        context.done();
    }
    // Check u1 and u1 universities match
    if(!u1.university == u2.university){
        context.res = {
            status: 400,
            body: "Adminstrators must be from the same univeristy as the programme leader"
        }
        context.done();
    }
    // Check u2 not already an admin
    if(programme.administrators.includes(u2.id)){
        context.res = {
            status: 400,
            body: "User is already an admin"
        }
        context.done();
    }
    // Add u2 to admins list
    programme.administrators = programme.administrators.push(u2.id);
    context.bindings.outputDocument = programme;
    context.res = {
        body: "Administrator added successfully"
    }
    context.done();
};