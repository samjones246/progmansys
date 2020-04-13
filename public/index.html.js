// FirebaseUI config.
var uiConfig = {
    signInFlow: 'popup',
    signInSuccessUrl: '/',
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: 'tos.html',
    privacyPolicyUrl: 'privacyPolicy.html'
};
var ui = new firebaseui.auth.AuthUI(firebase.auth());
const apiRoot = "http://localhost:5001/progmansys-6f164/us-central1";

const ProgrammeList = {
    data: function(){
        return {
            user: null,
            programmes: []
        }
    },
    methods: {
        getProgrammes: function () {
            firebase.firestore().collection("programmes").where("administrators", "array-contains", this.user.uid).get()
            .then(snapshot => {
                snapshot.docs.forEach(doc => {
                    var data = doc.data();
                    data.id=doc.id;
                    this.programmes.push(data);
                })
                return;
            })
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            if(user){
                this.getProgrammes();
            }
        })
    },
    template: 
    `
    <div>
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        Programmes
                    </h1>
                    <h2 class="subtitle">
                    </h2>
                </div>
            </div>
        </section>
        <section v-for="p in programmes" class="container is-primary is-light">
            <br>
            <p class="title">{{ p.name }}</p>
            <p class="subtitle">
                <router-link v-bind:to="'programmes/'+p.id">Edit</router-link> - <a>View</a>
            </p>
        </section>
    </div>
    `
}
const ModuleList = {
    data: function(){
        return {
            user: null,
            modules: []
        }
    },
    methods: {
        getModules: function () {
            firebase.firestore().collection("modules").get()
            .then(snapshot => {
                snapshot.docs.forEach(doc => {
                    var data = doc.data();
                    data.id=doc.id;
                    this.modules.push(data);
                })
                return;
            })
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            if(user){
                this.getModules();
            }
        })
    },
    template: 
    `
    <div>
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        Modules
                    </h1>
                    <h2 class="subtitle">
                    </h2>
                </div>
            </div>
        </section>
        <section v-for="m in modules" class="container is-primary is-light">
            <br>
            <p class="title">{{ m.name }}</p>
            <p class="subtitle">
                <a>Edit</a> - <router-link v-bind:to="'/modules/'+m.id">View</router-link>
            </p>
        </section>
    </div>
    `
}

// Programme Editor modals
const AddModule = {
    props: {
        showing: Boolean,
        candidateModules: Array
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Module</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <div class="content">
                    <ul>
                        <li v-for="(year, i) in candidateModules">
                            <h1 class="title is-4">Year {{ i+1 }}</h1>
                            <ul>
                                <li v-for="(semester, j) in year">
                                    <h1 class="title is-4">Semester {{ j+1 }}</h1>
                                    <ul>
                                        <li v-for="(module, k) in semester">
                                            <h1 class="title is-4">{{ module.name }} <a v-on:click="$emit('submit', module)"><i class="fas fa-plus-circle"></i></a></h1>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnassignModule = {
    props: {
        pendingDelete: Object
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingDelete}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingDelete', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unassign {{ pendingDelete.name }} from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Unassign Module</button>
                <button class="button" v-on:click="$emit('update:pendingDelete', null)">Cancel</button>
            </footer>
            </div>
        </div>
    `
}
const RenameProgramme = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean,
        programmeName: String
    },
    created: function(){
        this.pending = this.programmeName;
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Rename Programme</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Programme name" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0 || pending===programmeName">Rename Programme</button>
            <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const AddOutcome = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean
    },
    template:`
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Add Learning Outcome</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Learning outcome" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0">Submit</button>
            <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const ConfirmRemoveOutcome = {
    props: {
        pendingDelete: String
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingDelete}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingDelete', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to remove outcome {{ pendingDelete }} from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Confirm</button>
                <button class="button" v-on:click="$emit('update:pendingDelete', null)">Cancel</button>
            </footer>
            </div>
        </div>
        `
}
const MapOutcome = {
    props: {
        pendingMapOutcome: String,
        modules: Array,
        mapping: Object
    },
    computed: {
        filteredModules: function () {
            var out = [];
            for(i in this.modules){
                var module = { ...this.modules[i]};
                var outcomes = {};
                for(j in module.outcomes){
                    var add = true;
                    if(this.mapping[this.pendingMapOutcome]){
                        if(this.mapping[this.pendingMapOutcome][module.id]){
                            if(this.mapping[this.pendingMapOutcome][module.id].includes(j)){
                                add = false;
                            }
                        }
                    }
                    if(add){
                        outcomes[j] = module.outcomes[j];
                    }
                }
                if(Object.keys(outcomes).length){
                    module.outcomes = outcomes;
                    out.push(module);
                }
            }
            return out;
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingMapOutcome}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Map Learning Outcome</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingMapOutcome', null)"></button>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <ul>
                        <li v-for="module in filteredModules">
                            {{ module.name }}
                            <ol>
                                <li v-for="(outcome, i) in module.outcomes" v-bind:value="i">
                                    {{ outcome }} <a v-on:click="$emit('submit', {'moduleId':module.id, 'outcomeId':i})"><i class="fas fa-plus-circle"></i></a>
                                </li>
                            </ol>
                        </li>
                    </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-on:click="$emit('update:pendingMapOutcome', null)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnmapOutcome = {
    props: {
        pendingUnmap: Object
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pendingUnmap}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pendingUnmap', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unmap module learning outcome {{ pendingUnmap.module.name }}: {{ pendingUnmap.moduleOutcome }} from programme learning outcome {{ pendingUnmap.programmeOutcome }}: {{ pendingUnmap.programmeOutcomeText }}?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Confirm</button>
                <button class="button" v-on:click="$emit('update:pendingUnmap', null)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const AddAdministrator = {
    data: function() {
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Administrator</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <input class="input" type="text" placeholder="Email" v-model="pending">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)">Submit</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmRemoveAdministrator = {
    props: {
        pending: Object
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': pending}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:pending', null)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unassign administrator {{ pending.displayName }} ({{pending.email}}) from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Confirm</button>
                <button class="button" v-on:click="$emit('update:pending', null)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const TransferOwnership = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean,
        administrators: Array
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Transfer Programme Ownership</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
            <div class="content is-medium">
            <p class="title is-5">Eligible Administrators:</p>
                <div v-for="admin in administrators">
                    <label class="radio" v-on:click="pending=admin.uid">
                        <input type="radio" name="answer">
                        <strong>{{ admin.displayName }}</strong> ({{ admin.email }})
                    </label>
                </div>
            </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="!pending">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ChangeDuration = {
    data: function(){
        return {
            pending: null
        }
    },
    props: {
        showing: Boolean,
        current: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Programme Duration</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <div class="control">
                    <label class="label">New Duration: </label>
                    <div class="select">
                        <select v-model="pending">
                            <option v-for="i in [1,2,3,4].filter(i => i != current)">
                                {{ i }}
                            </option>
                        </select>
                    </div>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', parseInt(pending))" v-bind:disabled="!pending">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmPublishProgramme = {
    data: function() {
        return {
            problems: [],
            asyncProcesses: [],
            registered: false,
            ready: false
        }
    },
    props: {
        showing: Boolean,
        programme: Object,
        core: Array,
        optional: Array
    },
    methods: {
        getProblems: function(){
            this.problems = [];
            this.asyncProcesses = [];
            this.registered = false;
            this.ready = false;
            for(y=1;y<=this.programme.duration;y++){
                for(s=1;s<=2;s++){
                    var coreTotal = this.totalCredits(this.core[y-1][s-1]);
                    var optionalTotal = this.totalCredits(this.optional[y-1][s-1]);

                    if(coreTotal + optionalTotal < 60){
                        this.problems.push("Insufficient credits available in <strong>Year "+y+", Semester "+s+"</strong>: "
                                          +(coreTotal + optionalTotal)+" credits available, must be at least 60");
                    }

                    if(coreTotal > 60){
                        this.problems.push("More than 60 credits awarded by core modules in <strong>Year "+y+", Semester "+s+"</strong>.")
                    }

                    for(module of this.optional[y-1][s-1]){
                        if(module.credits + coreTotal > 60){
                            this.problems.push("Module <strong>"+module.name+"</strong> in <strong>Year "+y+", Semester "+s+"</strong> awards "+module.credits+" credits, but only "+(60-coreTotal)+" credits are left to award after core modules.")
                        }
                        for(prereq of module.prerequisites){
                            if(!this.programme.modules.includes(prereq)){
                                pid = this.asyncProcesses.push(false) - 1;
                                console.log(pid + " registered");
                                firebase.firestore().collection("modules").doc(prereq).get().then(doc => {
                                    this.problems.push("Module <strong>"+module.name+"</strong> in <strong>Year "+y+", Semester "+s+"</strong> has a prerequisite module which is not on the programme: <strong>"+doc.data().name+"</strong>")
                                    this.complete(pid);
                                })
                            }
                        }
                    }
                    for(module of this.core[y-1][s-1]){
                        for(prereq of module.prerequisites){
                            if(!this.programme.modules.includes(prereq)){
                                let pid = this.asyncProcesses.push(false) - 1;
                                console.log(pid + " registered");
                                firebase.firestore().collection("modules").doc(prereq).get().then(doc => {
                                    this.problems.push("Module <strong>"+module.name+"</strong> in <strong>Year "+y+", Semester "+s+"</strong> has a prerequisite module which is not on the programme: <strong>"+doc.data().name+"</strong>")
                                    this.complete(pid);
                                })
                            }
                            if(!this.programme.core.includes(prereq)){
                                let pid = this.asyncProcesses.push(false) - 1;
                                console.log(pid + " registered");
                                firebase.firestore().collection("modules").doc(prereq).get().then(doc => {
                                    this.problems.push("Core module <strong>"+module.name+"</strong> in <strong>Year "+y+", Semester "+s+"</strong> has a prerequisite module which is not core for the programme: <strong>"+doc.data().name+"</strong>")
                                    this.complete(pid);
                                })
                            }
                        }
                    }
                }
            }
            for(po in this.programme.outcomes){
                var satisfied = false;
                try {
                    for(m in this.programme.mapping[po]){
                        if(this.programme.mapping[po][m].length > 0){
                            satisfied = true;
                        }
                    }
                } catch (error) {
                    // Ignored
                }
                if(!satisfied){
                    this.problems.push("Programme learning outcome <strong>"+po+": "+this.programme.outcomes[po]+"</strong> is not mapped to by any module learning outcomes")
                }
            }
            this.registered = true;
            if(this.asyncProcesses.length === 0){
                this.ready = true;
            }
        },
        totalCredits: function(semester){
            var total = 0;
            for(module of semester){
                total += module.credits;
            }
            return total;
        },
        complete: function(pid){
            this.asyncProcesses[pid] = true;
            console.log(pid+" finished");
            if(this.registered){
                for(p of this.asyncProcesses){
                    if (!p){
                        return;
                    }
                }
                this.ready = true;
            }
        }
    },
    watch: {
        'showing': function () {
            if(this.showing == true){
                this.getProblems();
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Publish Programme</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
            <div class="content is-medium">
                <p class="title is-5">Problems:</p>
                <div v-if="ready">
                    <ul v-if="problems.length > 0">
                        <li v-for="problem in problems">
                            <span v-html="problem"></span>
                        </li>
                    </ul>
                    <p v-else>No problems, ready to publish!</p>
                </div>
                <div v-else>
                    <p>Processing, please wait...</p>
                </div>
            </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit')" v-bind:disabled="!(ready && problems.length === 0)">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnpublishProgramme = {
    props: {
        showing: Boolean
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unpublish this programme? This will allow changes to be made to the programme.</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmDeleteProgramme = {
    data: function(){
        return {
            confirm: ""
        }
    },
    props: {
        showing: Boolean,
        programmeName: String
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to delete this programme? This action cannot be undone. To confirm this decision, please type the name of the programme in the box below.</p>
                <input class="input" type="text" placeholder="Programme Name" v-model="confirm">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="!(confirm===programmeName)">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const RenameModule = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean,
        moduleName: String
    },
    created: function(){
        this.pending = this.programmeName;
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Rename Module</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Module name" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0 || pending===moduleName">Confirm</button>
            <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const TransferModuleOwnership = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Boolean,
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Transfer Module Ownership</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium"
                    <p>Enter the email of the user you would like to transfer module ownership to. Once you confirm the transfer, you will no longer be able to make changes to this module</p>
                </div>
                <input class="input" type="text" placeholder="Email" v-model="pending">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="!pending">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ChangeModuleYear = {
    data: function(){
        return {
            pending: null
        }
    },
    props: {
        showing: Boolean,
        current: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Module Year</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <div class="control">
                    <label class="label">New year of study: </label>
                    <div class="select">
                        <select v-model="pending">
                            <option v-for="i in [1,2,3,4].filter(i => i != current)">
                                {{ i }}
                            </option>
                        </select>
                    </div>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', parseInt(pending))" v-bind:disabled="!pending">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ChangeModuleSemester = {
    props: {
        showing: Boolean,
        current: Number
    },
    computed:{
        pending: function(){
            return current === 1 ? 2 : 1
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Module Semester</p>
                <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <p>
                        This module is currently designated to be studied in semester {{ current }}. Change to semester {{ pending }}?
                    </p>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)">Confirm</button>
                <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const AssignPrerequisite = {
    data: function(){
        return {
            eligible: []
        }
    },
    props: {
        showing: Boolean,
        module: Object,
        ready: Boolean
    },
    methods: {
        getEligible(){
            firebase.firestore().collection("modules").where(FieldValue.id)
        }
    },
    watch: {
        showing: function(){
            if(showing === true){
                this.ready = false;
                this.eligible = [];
                this.getEligible();
            }
        }
    },
    template: `
    `
}
const ConfirmDeletePrerequisite = {
    props: {

    },
    template: `
    `
}
const ConfirmDeleteModule = {
    props: {

    },
    template: `
    `
}

const ProgrammeEditor = {
    data: function() {
        return {
            programme: null,
            leader: null,
            core: [],
            optional: [],
            administrators: [],
            ready: false,
            years: [],
            user: null,
            pendingDelete: null,
            pendingDeleteOutcome: null,
            pendingUnmap: null,
            pendingRemoveAdmin: null,
            candidateModules: [],
            pendingProgrammeName: "",
            pendingOutcome: "",
            pendingMapOutcome: null,
            modals: {
                renameProgramme: false,
                addModule: false,
                addOutcome: false,
                mapOutcome: false,
                confirmUnassignModule: false,
                addAdministrator: false,
                transferOwnership: false,
                changeDuration: false,
                confirmPublishProgramme: false,
                confirmUnpublishProgramme: false,
                confirmDeleteProgramme: false
            }
        }
    },
    computed: {
        userIsLeader: function(){
            return this.user && this.programme.leader === this.user.uid;
        },
        userIsAdmin: function(){
            return this.user && this.programme.administrators.includes(this.user.uid);
        },
        modules: function(){
            var core = this.core.flat(Infinity);
            var optional = this.optional.flat(Infinity);
            var modules = core.concat(optional);
            return modules;
        }
    },
    components: {
        'map-outcome': MapOutcome,
        'add-module': AddModule,
        'confirm-unassign-module': ConfirmUnassignModule,
        'confirm-remove-outcome': ConfirmRemoveOutcome,
        'rename-programme': RenameProgramme,
        'add-outcome': AddOutcome,
        'confirm-unmap-outcome': ConfirmUnmapOutcome,
        'add-administrator': AddAdministrator,
        'confirm-remove-administrator': ConfirmRemoveAdministrator,
        'transfer-ownership': TransferOwnership,
        'change-duration': ChangeDuration,
        'confirm-publish-programme': ConfirmPublishProgramme,
        'confirm-unpublish-programme': ConfirmUnpublishProgramme,
        'confirm-delete-programme': ConfirmDeleteProgramme
    },
    methods: {
        toggleCore: function(module) {
            var endpoint = module.core ? "setOptional" : "setCore";
            this.sendRequest(endpoint, {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   this.getModules();
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        unassignModule: function(module){
            this.pendingDelete = null;
            this.sendRequest("unassignModule", {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   this.getModules();
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        assignModule: function(module){
            this.modals.addModule = false;
            this.sendRequest("assignModule", {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   this.getModules();
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        renameProgramme: function(name){
            this.modals.renameProgramme = false;
            this.sendRequest("renameProgramme", {
                programme: this.$route.params.id,
                name: name
            })
            .then(response => {
                this.getProgramme();
            })
        },
        getCandidateModules: function(){
            this.candidateModules = [];
            for(i=0;i<this.programme.duration;i++){
                this.candidateModules.push([[],[]]);
            }
            firebase.firestore().collection("modules").where("year", "<=", this.programme.duration).get()
            .then(snapshot => {
                snapshot.docs.forEach(document => {
                    var data = document.data();
                    data.id = document.id;
                    if(!this.programme.modules.includes(data.id)){
                        this.candidateModules[data.year-1][data.semester-1].push(data);
                    }
                })
                this.modals.addModule=true;
            })
        },
        getProgramme: function() {
            return firebase.firestore().collection("programmes").doc(this.$route.params.id).get()
            .then(snapshot => {
                this.programme = snapshot.data();
                this.pendingProgrammeName = this.programme.name;
            })
        },
        getLeader: function() {
            return axios.post(apiRoot+"/getUser",{
                uid: this.programme.leader
            })
            .then(response => {
                this.leader = response.data;
            });
        },
        getAdministrators: function() {
            this.administrators=[];
            var promises = [];
            this.programme.administrators.forEach(admin => {
                promises.push(axios.post(apiRoot+"/getUser",{uid: admin}));
            })
            return Promise.all(promises)
            .then(responses => {
                responses.forEach(response => {
                    this.administrators.push(response.data);
                })
            });
        },
        getOutcomes: function() {

        },
        getModules: function() {
            var years=[];
            var core=[];
            var optional=[];
            for(i=1;i<=this.programme.duration;i++){
                years.push(i);
                core.push([[],[]]);
                optional.push([[],[]]);
            }
            var promises = [];
            this.programme.modules.forEach(module => {
                promises.push(firebase.firestore().collection("modules").doc(module).get());
            })
            return Promise.all(promises)
            .then(snapshots => {
                for(i=0;i<snapshots.length;i++){
                    var moduleDoc = snapshots[i].data();
                    var year = moduleDoc.year - 1;
                    var semester = moduleDoc.semester - 1;
                    moduleDoc.id = this.programme.modules[i];
                    if(this.programme.core.includes(moduleDoc.id)){
                        moduleDoc.core = true;
                        core[year][semester].push(moduleDoc)
                    }else{
                        moduleDoc.core = false;
                        optional[year][semester].push(moduleDoc)
                    }
                }
                this.years=years;
                this.core=core;
                this.optional=optional;
            });
        },
        sendRequest: function(endpoint, data, needsAuth=true){
            if(needsAuth){
                if(!this.user) return;
                return this.user.getIdToken()
                .then(idToken => {
                    data.idToken = idToken;
                    return axios.post(apiRoot + "/" + endpoint, data);
                })
            }
            else return axios.post(apiRoot + "/" + endpoint, data)
        },
        getModuleById: function(moduleId){
            for(i in this.modules){
                if(this.modules[i].id === moduleId){
                    return this.modules[i];
                }
            }
            return null;
        },
        addOutcome: function(outcome){
            this.modals.addOutcome = false;
            this.sendRequest("assignProgrammeOutcome", {
                programme: this.$route.params.id,
                outcome: outcome
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                alert(error);
            })
        },
        removeOutcome: function(outcomeId){
            this.pendingDeleteOutcome = null;
            this.sendRequest("unassignProgrammeOutcome", {
                programme: this.$route.params.id,
                outcomeId: outcomeId
            })
            .then(response => {
                this.getProgramme();
            }).catch(error => {
                alert(error);
            })
        },
        mapOutcome: function(p_out, m_out, moduleId){
            this.pendingMapOutcome = null;
            this.sendRequest("mapOutcome", {
                programme: this.$route.params.id,
                programmeOutcome: p_out,
                module: moduleId,
                moduleOutcome: m_out
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        unmapOutcome: function (programmeOutcome, module, moduleOutcome) {
            this.pendingUnmap = null;
            this.sendRequest("unmapOutcome", {
                programme: this.$route.params.id,
                programmeOutcome: programmeOutcome,
                module: module,
                moduleOutcome: moduleOutcome
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        addAdministrator: function (email) {
            this.modals.addAdministrator = false;
            this.sendRequest("getUserByEmail", {
                email: email
            })
            .then(user => {
                return this.sendRequest("addAdministrator", {
                    programme: this.$route.params.id,
                    targetUid: user.data.uid
                })
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.getAdministrators();
                })
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        alertError: function (error) {
            if (error.response) {
                alert(error.response.data);
            } else {
                alert('Error: ' + error.message);
            }
        },
        removeAdministrator: function(uid){
            this.pendingRemoveAdmin = null;
            this.sendRequest("removeAdministrator", {
                programme: this.$route.params.id,
                targetUid: uid
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.getAdministrators();
                })
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        transferOwnership: function(uid){
            this.modals.transferOwnership = false;
            this.sendRequest("transferProgrammeOwnership", {
                programme: this.$route.params.id,
                targetUid: uid
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.getLeader();
                })
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        changeDuration: function(duration){
            this.modals.changeDuration = false;
            this.sendRequest("changeDuration", {
                programme: this.$route.params.id,
                duration: duration
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.getModules();
                })
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        publishProgramme: function(){
            this.modals.confirmPublishProgramme = false;
            this.sendRequest("publishProgramme", {
                programme: this.$route.params.id
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        unpublishProgramme: function(){
            this.modals.confirmUnpublishProgramme = false;
            this.sendRequest("unpublishProgramme", {
                programme: this.$route.params.id
            })
            .then(response => {
                this.getProgramme();
            })
            .catch(error => {
                this.alertError(error);
            })
        },
        deleteProgramme: function(){
            this.modals.confirmDeleteProgramme = false;
            this.sendRequest("deleteProgramme", {
                programme: this.$route.params.id
            })
            .then(response => {
                window.location.replace("/#/programmes")
            })
            .catch(error => {
                this.alertError(error);
            })
        }
    },
    created: function() {
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        this.getProgramme()
        .then(() => {
            return Promise.all([
                this.getLeader(),
                this.getAdministrators(),
                this.getOutcomes(),
                this.getModules(),
            ])
        }).then(() => {
            this.ready = true;
        })
    },
    template:
    `
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <nav class="level">
                        <div class="level-left">
                            <div>
                                <h1 class="title">
                                    {{ programme.name }} <a v-if="userIsLeader && !programme.published" v-on:click="modals.renameProgramme=true" title="Rename Programme"><i class="fas fa-edit"></i></a>
                                </h1>
                                <h2 class="subtitle">
                                    Led by {{ leader.displayName }} <a v-if="userIsLeader && !programme.published" title="Transfer ownership" v-on:click="modals.transferOwnership=true"><i class="fas fa-edit"></i></a>
                                </h2>
                            </div>
                        </div>
                        <div class="level-right">
                            <div>
                                <h2 class="title is-5">
                                    Programme Duration: {{ programme.duration }} {{ programme.duration==1 ? "year" : "years" }} <a v-if="userIsAdmin && !programme.published"v-on:click="modals.changeDuration=true"><i class="fas fa-edit"></i></a>
                                </h2>
                                <h2 class="title is-5">
                                    <div v-if="programme.published">
                                        Published (<a v-if="userIsLeader" v-on:click="modals.confirmUnpublishProgramme = true">Unpublish</a>)
                                    </div>
                                    <div v-else>
                                        Unpublished (<a v-if="userIsLeader" v-on:click="modals.confirmPublishProgramme = true">Publish</a>)
                                    </div>
                                </h2>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </section>
        <div class="tile is-ancestor">
            <div class="tile is-parent is-vertical">
                <div class="tile is-parent">
                    <div class="tile is-parent">
                        <div class="tile is-child is-success notification">
                            <h1 class="title">
                                Administrators <a v-if="userIsLeader && !programme.published" v-on:click="modals.addAdministrator = true"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ul>
                                    <li v-for="a in administrators">
                                        {{ a.displayName }} ({{ a.email }}) <a v-if="userIsLeader && !programme.published" v-on:click="pendingRemoveAdmin=a"><i class="fas fa-minus-circle"></i></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="tile is-parent">
                        <div class="tile is-child is-warning notification">
                            <h1 class="title">
                                Learning Outcomes <a v-if="userIsAdmin && !programme.published" v-on:click="modals.addOutcome=true"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ol>
                                    <li v-for="(o, i) in programme.outcomes" v-bind:value="i">
                                        {{ o }} <a v-if="userIsAdmin && !programme.published" v-on:click="pendingDeleteOutcome = i"><i class="fas fa-minus-circle"></i></a>
                                        <div class="subtitle is-6" v-if="userIsAdmin && !programme.published">
                                            <a v-on:click="pendingMapOutcome = i">Map module outcome</a>
                                        </div>
                                        <ul>
                                            <li v-for="(m, j) in programme.mapping[i]">
                                                {{ getModuleById(j).name }}
                                                <ol>
                                                    <li v-for="o2 in programme.mapping[i][j]" v-bind:value="o2">
                                                        {{ getModuleById(j).outcomes[o2] }} <a v-if="userIsAdmin && !programme.published" v-on:click="pendingUnmap={'module':getModuleById(j),'moduleOutcome': o2,'programmeOutcome': i, 'programmeOutcomeText': o}"><i class="fas fa-minus-circle"></i></a>
                                                    </li>
                                                </ol>
                                            </li>
                                        </ul>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tile is-parent is-vertical">
                    <div class="tile is-child is-danger notification">
                        <h1 class="title is-3">
                            Modules <a v-if="userIsAdmin && !programme.published" v-on:click="getCandidateModules()"><i class="fas fa-plus-circle"></i></a>
                        </h1>
                        <div class="content is-medium">
                            <ul>
                                <li v-for="y in years">
                                    <h2 class="title is-4">Year {{ y }}</h2>
                                    <ul>
                                        <li v-for="s in [1,2]">
                                            <h3 class="title is-4">Semester {{ s }} </h3>
                                            <ul v-if="core[y-1][s-1].length > 0 || optional[y-1][s-1].length > 0">
                                                <li v-for="type in ['Core', 'Optional']" v-if="(type==='Core' ? core[y-1][s-1] : optional[y-1][s-1]).length > 0">
                                                    <h3 class="title is-4">{{ type }}</h3>
                                                    <ul>    
                                                        <li v-for="m in type==='Core' ? core[y-1][s-1] : optional[y-1][s-1]">
                                                            <h3 class="title is-4">{{ m.name }}</h3>
                                                            <div class="subtitle is-6" v-if="userIsAdmin && !programme.published">
                                                                <router-link v-bind:to="'/modules/'+m.id"><i class="fas fa-edit"></i></router-link> -  
                                                                <a v-on:click="pendingDelete = m"><i class="fas fa-minus-circle"></i></a> - 
                                                                <a v-on:click="toggleCore(m)">Mark as {{ type==='Core' ? 'optional' : 'core' }}</a>
                                                            </div>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                            <div v-else>
                                                <p>No modules assigned</p>
                                            </div>
                                            <br v-if="s==1">
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <a v-if="userIsLeader && !programme.published" v-on:click="modals.confirmDeleteProgramme = true">Delete Programme</a>
                </div>
            </div>
        </div>
        <rename-programme 
            v-bind:showing.sync="modals.renameProgramme" 
            v-bind:programmeName="programme.name"
            v-on:submit="renameProgramme($event)"
        />
        <add-module 
            v-bind:showing.sync="modals.addModule"
            v-bind:candidateModules="candidateModules"
            v-on:submit="assignModule($event)"
        />
        <confirm-unassign-module
            v-if="pendingDelete"
            v-bind:pendingDelete.sync="pendingDelete"
            v-on:submit="unassignModule(pendingDelete)"
        />
        <add-outcome 
            v-bind:showing.sync="modals.addOutcome"
            v-on:submit="addOutcome($event)"
        />
        <confirm-remove-outcome
            v-if="pendingDeleteOutcome"
            v-bind:pendingDelete.sync="pendingDeleteOutcome"
            v-on:submit="removeOutcome(pendingDeleteOutcome)"
        />
        <map-outcome
            v-if="pendingMapOutcome"
            v-bind:pendingMapOutcome.sync="pendingMapOutcome"
            v-bind:modules="modules"
            v-bind:mapping="programme.mapping"
            v-on:submit="mapOutcome(pendingMapOutcome, $event.outcomeId, $event.moduleId)"
        />
        <confirm-unmap-outcome
            v-if="pendingUnmap"
            v-bind:pendingUnmap.sync="pendingUnmap"
            v-on:submit="unmapOutcome(pendingUnmap.programmeOutcome, pendingUnmap.module.id, pendingUnmap.moduleOutcome)"
        />
        <add-administrator
            v-bind:showing.sync="modals.addAdministrator"
            v-on:submit="addAdministrator($event)"
        />
        <confirm-remove-administrator
            v-if="pendingRemoveAdmin"
            v-bind:pending.sync="pendingRemoveAdmin"
            v-on:submit="removeAdministrator(pendingRemoveAdmin.uid)"
        />
        <transfer-ownership
            v-bind:showing.sync="modals.transferOwnership"
            v-bind:administrators="administrators.filter(a => a.uid != leader.uid)"
            v-on:submit="transferOwnership($event)"
        />
        <change-duration
            v-bind:showing.sync="modals.changeDuration"
            v-bind:current="programme.duration"
            v-on:submit="changeDuration($event)"
        />
        <confirm-publish-programme
            v-bind:showing.sync="modals.confirmPublishProgramme"
            v-bind:programme="programme"
            v-bind:core="core"
            v-bind:optional="optional"
            v-on:submit="publishProgramme()"
        />
        <confirm-unpublish-programme
            v-bind:showing.sync="modals.confirmUnpublishProgramme"
            v-on:submit="unpublishProgramme()"
        />
        <confirm-delete-programme
            v-bind:showing.sync="modals.confirmDeleteProgramme"
            v-bind:programmeName="programme.name"
            v-on:submit="deleteProgramme()"
        />
    </div>
    `
}
const ModuleEditor = {
    data: function(){
        return {
            module: null,
            leader: null,
            prerequisites: [],
            programmes: [],
            ready: false,
            editable: true,
            modals: {
                addOutcome: false,
            }
        }
    },
    computed: {
        userIsLeader: function(){
            return this.user && this.module && this.user.uid === this.module.leader;
        },
    },
    components: {
        'add-outcome': AddOutcome,
    },
    methods: {
        update: function () {
            this.module = null;
            this.leader = null;
            this.prerequisites = [];
            this.ready = false;
            firebase.firestore().collection("modules").doc(this.$route.params.id).get()
            .then(snapshot => {
                this.module = snapshot.data();
                return axios.post(apiRoot+"/getUser",{
                    uid: this.module.leader
                })
            })
            .then(response => {
                this.leader = response.data;
                var promises = [];
                this.module.prerequisites.forEach(module => {
                    promises.push(firebase.firestore().collection("modules").doc(module).get());
                })
                return Promise.all(promises);
            })
            .then(snapshots => {
                for(i=0;i<snapshots.length;i++){
                    var moduleDoc = snapshots[i].data();
                    moduleDoc.id = snapshots[i].id;
                    this.prerequisites.push(moduleDoc)
                }
                return firebase.firestore().collection("programmes").where("modules","array-contains", this.$route.params.id).get();
            })
            .then(snapshot => {
                var snapshots = snapshot.docs;
                for(i=0;i<snapshots.length;i++){
                    var programmeDoc = snapshots[i].data();
                    programmeDoc.id = snapshots[i].id;
                    if(programmeDoc.published){
                        this.editable = false;
                    }
                    this.programmes.push(programmeDoc)
                }
                this.ready = true;
            })
        },
        sendRequest: function(endpoint, data, needsAuth=true){
            if(needsAuth){
                if(!this.user) return;
                return this.user.getIdToken()
                .then(idToken => {
                    data.idToken = idToken;
                    return axios.post(apiRoot + "/" + endpoint, data);
                })
            }
            else return axios.post(apiRoot + "/" + endpoint, data)
        },
        addOutcome: function(outcome){
            this.modals.addOutcome = false;
            this.sendRequest("assignModuleOutcome", {
                module: this.$route.params.id,
                outcome: outcome
            })
            .then(response => {
                this.update();
            })
            .catch(error => {
                alert(error);
            })
        },
        removeOutcome: function(outcomeId){
            this.pendingDeleteOutcome = null;
            this.sendRequest("unassignModuleOutcome", {
                module: this.$route.params.id,
                outcomeId: outcomeId
            })
            .then(response => {
                this.update();
            }).catch(error => {
                alert(error);
            })
        },
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        this.update();
    },
    watch: {
        '$route': function () {
            this.update();
        }
    },
    template:
    `
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <nav class="level">
                        <div class="level-left">
                            <div>
                                <h1 class="title">
                                    {{ module.name }} <a v-if="userIsLeader"><i class="fas fa-edit"></i></a>
                                </h1>
                                <h2 class="subtitle">
                                    Led by {{ leader.displayName }} <a v-if="userIsLeader"><i class="fas fa-edit"></i></a>
                                </h2>
                            </div>
                        </div>
                        <div class="level-right">
                            <div>
                                <h2 class="title is-5">
                                    Year: {{ module.year }} <a v-if="userIsLeader"><i class="fas fa-edit"></i></a>
                                </h2>
                                <h2 class="title is-5">
                                    Semester: {{ module.semester }} <a v-if="userIsLeader"><i class="fas fa-edit"></i></a>
                                </h2>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </section>
        <br>
        <div class="container is-fluid" v-if="userIsLeader && !editable">
            <p class="content is-medium">Module is not editable <a><i class="fas fa-info-circle"></i></a></p>
        </div>
        <div class="tile is-ancestor">
            <div class="tile is-parent is-vertical">
                <div class="tile is-parent">
                    <div class="tile is-parent">
                        <div class="tile is-child is-warning notification">
                            <h1 class="title">
                                Learning Outcomes <a v-if="userIsLeader" v-on:click="modals.addOutcome=true"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ol v-if="Object.keys(module.outcomes).length > 0">
                                    <li v-for="(o, index) in module.outcomes" v-bind:value="index">
                                        {{ o }} <a v-if="userIsLeader && editable"><i class="fas fa-minus-circle"></i></a>
                                    </li>
                                </ol>
                                <div v-else>
                                    <p>No learning outcomes assigned</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tile is-parent">
                        <div class="tile is-child is-danger notification">
                            <h1 class="title is-3">
                                Prerequisites <a v-if="userIsLeader"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ul v-if="prerequisites.length > 0">
                                    <li v-for="m in prerequisites">
                                        <router-link v-bind:to="'/modules/'+m.id">{{ m.name }}</router-link>
                                    </li>
                                </ul>
                                <div v-else>
                                    <p>No prerequisite modules assigned</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tile is-parent">
                        <div class="tile is-child is-success notification">
                            <h1 class="title is-3">
                                Programmes
                            </h1>
                            <div class="content is-medium">
                                <ul v-if="programmes.length > 0">
                                    <li v-for="p in programmes">
                                        <router-link v-bind:to="'/programmes/'+p.id">{{ p.name }}</router-link>
                                    </li>
                                </ul>
                                <div v-else>
                                    <p>This module is not assigned to any programmes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tile is-parent">
                    <a v-if="userIsLeader && editable">Delete Module</a>
                </div>
            </div>
        </div>
        <add-outcome 
            v-bind:showing.sync="modals.addOutcome"
            v-on:submit="addOutcome($event)"
        />
    </div>
    `
}
const CreateModule = {
    data: function() {
        return {
            showing: false
        }
    },
    methods: {
        show: function() {
            this.showing = true;
        },
        hide: function() {
            this.showing = false;
        }
    },
    template: `
    <div id="create-module" class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Create Module</p>
            <button class="delete" aria-label="close" v-on:click="hide()"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name: </label>
              <div class="control">
                <input class="input" type="text" placeholder="EXMP1001 Example">
              </div>
            </div>
            <div class="field">
              <label class="label">Year: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Semester: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>1</option>
                    <option>2</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Credits: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>15</option>
                    <option>30</option>
                    <option>45</option>
                    <option>60</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="hide()">Create</button>
            <button class="button" v-on:click="hide()">Cancel</button>
          </footer>
        </div>
      </div>
    `
}
const CreateProgramme = {
    data: function() {
        return {
            showing: false
        }
    },
    methods: {
        show: function() {
            this.showing = true;
        },
        hide: function() {
            this.showing = false;
        }
    },
    template: `
    <div id="create-programme" class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Create Programme</p>
            <button class="delete" aria-label="close" v-on:click="hide()"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name: </label>
              <div class="control">
                <input class="input" type="text" placeholder="BSc Something">
              </div>
            </div>
            <div class="field">
              <label class="label">Duration: </label>
              <div class="control">
                <div class="select">
                  <select>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="hide()">Create</button>
            <button class="button" v-on:click="hide()">Cancel</button>
          </footer>
        </div>
      </div>
    `
}

const routes = [
    { path: '/programmes', component: ProgrammeList },
    { path: '/modules', component: ModuleList },
    { path: '/programmes/:id', component: ProgrammeEditor },
    { path: '/modules/:id', component: ModuleEditor }
]
const router = new VueRouter({
    routes
})
var app = new Vue({
    el: '#app',
    router,
    components: {
        'create-module': CreateModule,
        'create-programme': CreateProgramme
    },
    data: {
        functions: functionsSpec,
        user: null,
        showCreateProgramme: false,
        showCreateModule: false
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
        },
        logout: function () {
            firebase.auth().signOut();
            location.reload()
        },
        login: function () {
            ui.start('#firebaseui-auth-container', uiConfig);
        },
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
        if (ui.isPendingRedirect()) {
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    }
});