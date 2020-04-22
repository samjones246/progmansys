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
            searchString: "",
            programmes: [],
            filters: {
                role: {
                    leader: true,
                    admin: true,
                    none: true
                },
                state: {
                    published: true,
                    unpublished: true
                }
            }
        }
    },
    methods: {
        getProgrammes: function () {
            firebase.firestore().collection("programmes").get()
            .then(snapshot => {
                snapshot.docs.forEach(doc => {
                    var data = doc.data();
                    data.id=doc.id;
                    this.programmes.push(data);
                })
                return;
            })
        },
        role: function(programme){
            if(this.user.uid===programme.leader){
                return "Leader"
            }
            if(programme.administrators.includes(this.user.uid)){
                return "Administrator"
            }else return ""
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            if(user){
                this.user = user;
            }else{
                this.user = {uid:"-1"}
            }
            this.getProgrammes();
        })
    },
    computed: {
        validProgrammes: function(){
            return this.programmes
            .filter(p => this.searchString.length == 0 || p.name.toLowerCase().includes(this.searchString.toLowerCase()))
            .filter(p => this.filters.role.leader || !(p.leader==this.user.uid))
            .filter(p => this.filters.role.admin || !(p.administrators.includes(this.user.uid) && !(p.leader==this.user.uid)))
            .filter(p => this.filters.role.none || p.administrators.includes(this.user.uid))
            .filter(p => this.filters.state.published || !p.published)
            .filter(p => this.filters.state.unpublished || p.published)
        }
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
        <br>
        <div class="container">
            <div class="control has-icons-left">
                <input class="input" type="text" placeholder="Search" v-model="searchString">
                <span class="icon is-left">
                    <i class="fas fa-search"></i>
                </span>
            </div>
            <nav class="navbar">
                <div class="navbar-menu">
                    <div class="navbar-start">
                        <div class="navbar-item has-dropdown is-hoverable">
                            <a class="navbar-link">
                                <strong>My Role</strong>
                            </a>
                            <div class="navbar-dropdown">
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.role.leader">
                                        Leader
                                    </label>
                                </a>
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.role.admin">
                                        Administrator
                                    </label>
                                </a>
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.role.none">
                                        None
                                    </label>
                                </a>
                            </div>
                        </div>
                        <div class="navbar-item has-dropdown is-hoverable">
                            <a class="navbar-link">
                                <strong>Programme Status</strong>
                            </a>
                            <div class="navbar-dropdown">
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.state.published">
                                        Published
                                    </label>
                                </a>
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.state.unpublished">
                                        Unpublished
                                    </label>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
        <section v-for="p in validProgrammes" class="container is-primary is-light">
            <br>
            <router-link class="box" v-bind:to="'programmes/'+p.id">
            <div class="level">
                <div class="level-left">
                    <div>
                        <h1 class="title">{{ p.name }}</h1>
                        <h2 class="subtitle">{{ p.published ? "Published" : "Unpublished" }}</h2>
                    </div>
                </div>
                <div class="level-right">
                    <div>
                        <h1 class="title is-5">{{ role(p) }}</h1>
                    </div>
                </div>
            </div>
                
            </router-link>
        </section>
    </div>
    `
}
const ModuleList = {
    data: function(){
        return {
            user: null,
            searchString: "",
            modules: [],
            filters: {
                role: {
                    leader: true,
                    none: true
                }
            }
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
        },
        role: function(module){
            if(module.leader===this.user.uid){
                return "Leader"
            }else return ""
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
    computed: {
        validModules: function(){
            return this.modules
            .filter(m => this.searchString.length == 0 || m.name.toLowerCase().includes(this.searchString.toLowerCase()))
            .filter(m => this.filters.role.leader || !(m.leader==this.user.uid))
            .filter(m => this.filters.role.none || m.leader==this.user.uid)
        }
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
        <br>
        <div class="container">
            <div class="control has-icons-left">
                <input class="input" type="text" placeholder="Search" v-model="searchString">
                <span class="icon is-left">
                    <i class="fas fa-search"></i>
                </span>
            </div>
            <nav class="navbar">
                <div class="navbar-menu">
                    <div class="navbar-start">
                        <div class="navbar-item has-dropdown is-hoverable">
                            <a class="navbar-link">
                                <strong>My Role</strong>
                            </a>
                            <div class="navbar-dropdown">
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.role.leader">
                                        Leader
                                    </label>
                                </a>
                                <a class="navbar-item">
                                    <label class="label">
                                        <input type="checkbox" v-model="filters.role.none">
                                        None
                                    </label>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
        <section v-for="m in validModules" class="container is-primary is-light">
            <br>
            <router-link class="box" v-bind:to="'modules/'+m.id">
            <div class="level">
                <div class="level-left">
                    <div>
                        <h1 class="title">{{ m.name }}</h1>
                    </div>
                </div>
                <div class="level-right">
                    <div>
                        <h1 class="title is-5">{{ role(m) }}</h1>
                    </div>
                </div>
            </div>
            </router-link>
        </section>
    </div>
    `
}

const RemoveModal = {
    props: {
        showing: Number,
        pending: Object,
    },
    template: `
        <div class="modal" v-bind:class="{'is-active': showing}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <slot></slot>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
            </div>
        </div>
    `
}
const ChangeModal = {
    data: function(){
        return {
            pending: ""
        }
    },
    created: function(){
        this.pending = this.current;
    },
    props: {
        showing: Number,
        title: String,
        current: [String, Number]
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">{{ title }}</p>
        </header>
        <section class="modal-card-body">
            <slot v-bind:pending="pending"></slot>
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0 || pending===current || showing == 2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const AddModal = {
    
}

// Programme Editor modals
const AddModule = {
    data: function(){
        return {
            searchString: ""
        }
    },
    props: {
        showing: Number,
        candidateModules: Array
    },
    computed: {
        pending: function(){
            var count = 0;
            for (module of this.candidateModules){
                if(module.state == 1){
                    count++;
                }
            }
            return count;
        }
    },
    methods: {
        submit(module){
            module.state=1;
            this.$emit('submit', module);
        },
        finish(){
            console.log("a")
            this.$forceUpdate();
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Module</p>
            </header>
            <section class="modal-card-body">
                <div class="content">
                    <p class="control has-icons-left">
                        <input class="input" type="text" placeholder="Search" v-model="searchString">
                        <span class="icon is-left">
                            <i class="fas fa-search"></i>
                        </span>
                    </p>
                    <ul>
                        <li v-for="(year, i) in candidateModules">
                            <h1 class="title is-4">Year {{ i+1 }}</h1>
                            <ul>
                                <li v-for="(semester, j) in year">
                                    <h1 class="title is-4">Semester {{ j+1 }}</h1>
                                    <ul>
                                        <li v-for="(module, k) in semester.filter(m => searchString.length == 0 || m.name.includes(searchString))">
                                            <h1 class="title is-4">
                                                {{ module.name }}
                                                <span v-show="module.state == 2"><i class="fas fa-check"></i></span>
                                                <span v-show="module.state == 1"><i class="fas fa-circle-notch fa-spin"></i></span>
                                                <a v-show="module.state == 0" v-on:click="submit(module)"><i class="fas fa-plus-circle"></i></a>
                                            </h1>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-bind:disabled="pending.length > 0" v-on:click="$emit('update:showing', 0)">Done</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnassignModule = {
    props: {
        showing: Number,
        pending: Object
    },
    watch: {
        showing: function(){
            if(this.showing == 0){
                this.$emit('update:pending', null)
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unassign {{ pending.name }} from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
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
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Programme name" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length === 0 || pending===programmeName || showing == 2" v-bind:class="{'is-loading':showing==2}">Submit</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number
    },
    template:`
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Add Learning Outcome</p>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Learning outcome" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length==0 || showing==2" v-bind:class="{'is-loading':showing==2}">Submit</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const EditOutcome = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Number,
        outcome: Object
    },
    watch: {
        showing: function(){
            if(this.showing==1){
                this.pending = this.outcome.text;
            }
        }
    },
    template:`
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Edit Learning Outcome</p>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Learning outcome" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', {'id': outcome.id, 'text':pending})" v-bind:disabled="pending.length==0 || showing==2" v-bind:class="{'is-loading':showing==2}">Submit</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}
const ConfirmRemoveOutcome = {
    props: {
        showing: Number,
        pending: Object
    },
    watch: {
        showing: function(){
            if(this.showing==0){
                this.$emit('update:pending', null);
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
            <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <p class="content is-medium">Are you sure you wish to remove learning outcome <strong>\"{{ pending.text }}\"</strong> from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button v-bind:disabled="showing==2" class="button" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
            </div>
        </div>
        `
}

const SetDescription = {
    data: function(){
        return {
            pending: ""
        }
    },
    props: {
        showing: Number,
        current: String
    },
    watch: {
        showing: function(){
            if(this.showing==1){
                this.pending = this.current;
            }
        }
    },
    template:`
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Edit Description</p>
        </header>
        <section class="modal-card-body">
            <textarea class="textarea" placeholder="Description" v-model="pending"></textarea>
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending === current || showing==2" v-bind:class="{'is-loading':showing==2}">Submit</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
        </footer>
        </div>
    </div>
    `
}

const MapOutcome = {
    data: function(){
        return {
            pendingM: null
        }
    },
    props: {
        showing: Number,
        pendingP: String,
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
                    if(this.mapping[this.pendingP]){
                        if(this.mapping[this.pendingP][module.id]){
                            if(this.mapping[this.pendingP][module.id].includes(j)){
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
    watch: {
        showing: function(){
            if(this.showing==0){
                this.$emit('update:pendingP', null);
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Map Learning Outcome</p>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <ul>
                        <li v-for="module in filteredModules">
                            {{ module.name }}
                            <ol>
                                <li v-for="(outcome, i) in module.outcomes" v-bind:value="i">
                                    {{ outcome }} 
                                    <a v-on:click="()=>{$emit('submit', {'moduleId':module.id, 'outcomeId':i});pendingM=module.name+':'+i}" v-if="showing==1">
                                        <i class="fas fa-plus-circle"></i>
                                    </a>
                                    <i v-if="showing==2 && pendingM==module.name+':'+i" class="fas fa-circle-notch fa-spin"></i> 
                                </li>
                            </ol>
                        </li>
                    </ul>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnmapOutcome = {
    props: {
        showing: Number,
        pending: Object
    },
    watch: {
        showing: function(){
            if(this.showing==0){
                this.$emit('update:pending', null);
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unmap module learning outcome {{ pending.module.name }}: {{ pending.moduleOutcome }} from programme learning outcome {{ pending.programmeOutcome }}: {{ pending.programmeOutcomeText }}?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Administrator</p>
            </header>
            <section class="modal-card-body">
                <input class="input" type="text" placeholder="Email" v-model="pending">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Submit</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmRemoveAdministrator = {
    props: {
        showing: Number,
        pending: Object
    },
    watch: {
        showing: function(){
            if(this.showing==0){
                this.$emit('update:pending', null);
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unassign administrator {{ pending.displayName }} ({{pending.email}}) from this programme?</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
        administrators: Array
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Transfer Programme Ownership</p>
            </header>
            <section class="modal-card-body">
            <div class="content is-medium">
            <p class="title is-5">Eligible Administrators:</p>
                <div v-for="admin in administrators">
                    <label class="radio" v-on:click="pending=admin.uid">
                        <input type="radio" name="answer" v-bind:disabled="showing==2">
                        <strong>{{ admin.displayName }}</strong> ({{ admin.email }})
                    </label>
                </div>
            </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="!pending || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
        current: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Programme Duration</p>
            </header>
            <section class="modal-card-body">
                <div class="control">
                    <label class="label">New Duration: </label>
                    <div class="select">
                        <select v-model="pending" v-bind:disabled="showing==2">
                            <option v-for="i in [1,2,3,4].filter(i => i != current)">
                                {{ i }}
                            </option>
                        </select>
                    </div>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', parseInt(pending))" v-bind:disabled="!pending || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
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

                    if(coreTotal + optionalTotal < 30){
                        this.problems.push("Insufficient credits available in <strong>Year "+y+", Semester "+s+"</strong>: "
                                          +(coreTotal + optionalTotal)+" credits available, must be at least 30");
                    }

                    if(coreTotal > 30){
                        this.problems.push("More than 30 credits awarded by core modules in <strong>Year "+y+", Semester "+s+"</strong>.")
                    }

                    for(module of this.optional[y-1][s-1]){
                        if(module.credits + coreTotal > 30){
                            this.problems.push("Module <strong>"+module.name+"</strong> in <strong>Year "+y+", Semester "+s+"</strong> awards "+module.credits+" credits, but only "+(30-coreTotal)+" credits are left to award after core modules.")
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
            if(this.showing == 1){
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
                <button class="button is-success" v-on:click="$emit('submit')" v-bind:disabled="!(ready && problems.length === 0) || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnpublishProgramme = {
    props: {
        showing: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to unpublish this programme? This will allow changes to be made to the programme.</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
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
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="!(confirm===programmeName) || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
        moduleName: String
    },
    created: function(){
        this.pending = this.moduleName;
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Rename Module</p>
        </header>
        <section class="modal-card-body">
            <input class="input" type="text" placeholder="Module name" v-model="pending">
        </section>
        <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="pending.length==0||pending===moduleName||showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Transfer Module Ownership</p>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <p>Enter the email of the user you would like to transfer module ownership to. Once you confirm the transfer, you will no longer be able to make changes to this module</p>
                </div>
                <input class="input" type="text" placeholder="Email" v-model="pending" v-bind:disabled="showing==2">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="!pending || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
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
        showing: Number,
        current: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Module Year</p>
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
                <button class="button is-success" v-on:click="$emit('submit', parseInt(pending))" v-bind:disabled="!pending || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ChangeModuleSemester = {
    props: {
        showing: Number,
        current: Number
    },
    computed:{
        pending: function(){
            return this.current === 1 ? 2 : 1
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Module Semester</p>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <p>
                        This module is currently designated to be studied in semester {{ current }}. Change to semester {{ pending }}?
                    </p>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', pending)" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ChangeModuleCredits = {
    data: function(){
        return {
            pending: null
        }
    },
    props: {
        showing: Number,
        current: Number
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Module Credits</p>
            </header>
            <section class="modal-card-body">
                <div class="control">
                    <label class="label">New number of credits awarded: </label>
                    <div class="select">
                        <select v-model="pending" v-bind:disabled="showing==2">
                            <option v-for="i in [7.5,15,22.5,30].filter(i => i != current)">
                                {{ i }}
                            </option>
                        </select>
                    </div>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" v-on:click="$emit('submit', parseFloat(pending))" v-bind:disabled="!pending || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const AssignPrerequisite = {
    data: function(){
        return {
            eligible: [],
            ready: false,
            searchString: ""
        }
    },
    props: {
        showing: Number,
        module: Object
    },
    methods: {
        getEligible(){
            var promises = [];
            promises.push(firebase.firestore().collection("modules").where("year", "<", this.module.year).get())
            promises.push(firebase.firestore().collection("modules").where("year", "==", this.module.year).where("semester", "<", this.module.semester).get())
            Promise.all(promises)
            .then(snapshots => {
                for(snapshot of snapshots){
                    for(doc of snapshot.docs){
                        if(!this.module.prerequisites.includes(doc.id)){
                            var data = doc.data();
                            data.id = doc.id;
                            data.state = 0;
                            this.eligible.push(data);
                        }
                    }
                }
                this.ready = true;  
            })
        },
        submit(module){
            this.$emit('submit', module);
            module.state=1;
        }
    },
    watch: {
        showing: function(){
            if(this.showing == 1){
                this.ready = false;
                this.eligible = [];
                this.getEligible();
            }
        }
    },
    computed: {
        pending: function(){
            var count = 0;
            for(module of this.eligible){
                if(module.state==1){
                    count++;
                }
            }
            return count;
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Assign Prerequisite</p>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium" v-if="ready">
                    <p class="control has-icons-left">
                        <input class="input" type="text" placeholder="Search" v-model="searchString">
                        <span class="icon is-left">
                            <i class="fas fa-search"></i>
                        </span>
                    </p>
                    <ul v-if="eligible.length > 0">
                        <li v-for="m in eligible.filter(m => searchString.length == 0 || m.name.includes(searchString))">
                            <h1 class="title is-4">
                                {{ m.name }}
                                <a v-show="m.state==0" v-on:click="submit(m)">
                                    <i class="fas fa-plus-circle"></i>
                                </a>
                                <span v-show="m.state==1"><i class="fas fa-circle-notch fa-spin"></i></span>
                                <span v-show="m.state==2"><i class="fas fa-check"></i></span>
                            </h1>
                        </li>
                    </ul>
                    <p v-else>No eligible modules</p>
                </div>
                <div v-else class="content is-medium">
                    <p>Processing, please wait...</p>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button" v-bind:disabled="pending > 0" v-on:click="$emit('update:showing', 0)">Done</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmUnassignPrerequisite = {
    props: {
        showing: Number,
        pending: Object
    },
    watch: {
        'showing': function () {
            if(this.showing == 1){
                this.getProblems();
            }
        }
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm Decision</p>
            </header>
            <section class="modal-card-body">
                <div class="content is-medium">
                    <p>Are you sure you wish to unassign prerequisite <strong>{{ pending.name }}</strong> from this module?</p>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
    `
}
const ConfirmDeleteModule = {
    data: function(){
        return {
            confirm: ""
        }
    },
    props: {
        showing: Number,
        moduleName: String
    },
    template: `
    <div class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
            <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Confirm decision</p>
            </header>
            <section class="modal-card-body">
                <p>Are you sure you wish to delete this module? This action cannot be undone. To confirm this decision, please type the name of the module in the box below.</p>
                <input class="input" type="text" placeholder="Module Name" v-model="confirm">
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger" v-on:click="$emit('submit')" v-bind:disabled="!(confirm===moduleName) || showing==2" v-bind:class="{'is-loading':showing==2}">Confirm</button>
                <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
            </footer>
        </div>
    </div>
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
            pendingEditOutcome: null,
            pendingUnmap: null,
            pendingRemoveAdmin: null,
            candidateModules: [],
            pendingProgrammeName: "",
            pendingOutcome: "",
            pendingMapOutcome: null,
            modals: {
                renameProgramme: 0,
                addModule: 0,
                confirmUnassignModule: 0,
                addOutcome: 0,
                removeOutcome: 0,
                mapOutcome: 0,
                unmapOutcome: 0,
                addAdministrator: 0,
                removeAdministrator: 0,
                transferOwnership: 0,
                changeDuration: 0,
                confirmPublishProgramme: 0,
                confirmUnpublishProgramme: 0,
                confirmDeleteProgramme: 0,
                editOutcome: 0,
                setDescription: 0
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
        'confirm-delete-programme': ConfirmDeleteProgramme,
        'edit-outcome': EditOutcome,
        'set-description': SetDescription
    },
    methods: {
        toggleCore: function(module) {
            module.isToggling = true;
            var endpoint = module.core ? "setOptional" : "setCore";
            this.sendRequest(endpoint, {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   return this.getModules();
               })
               .then(() => {
                module.isToggling = false;
               })
            })
            .catch(error => {
                module.isToggling = false;
                alert(error);
            })
        },
        unassignModule: function(module){
            this.modals.confirmUnassignModule = 2;
            this.sendRequest("unassignModule", {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   return this.getModules();
               })
               .then(() => {
                   this.modals.confirmUnassignModule = 0;
               })
            })
            .catch(error => {
                alert(error);
            })
        },
        assignModule: function(module){
            this.sendRequest("assignModule", {
                programme: this.$route.params.id,
                module: module.id
            })
            .then(response => {
                this.getProgramme()
               .then(() => {
                   return this.getModules();
               })
               .then(() => {
                   module.state=2;
                   this.$refs.addModule.finish();
               })
            })
            .catch(error => {
                module.state=2;
                this.$refs.addModule.finish();
                alert(error);
            })
        },
        renameProgramme: function(name){
            this.modals.renameProgramme = 2;
            this.sendRequest("renameProgramme", {
                programme: this.$route.params.id,
                name: name
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.modals.renameProgramme = 0;
                })
            })
            .catch(error => {
                this.modals.renameProgramme = 0;
                this.alertError(error)
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
                        data.state = 0;
                        this.candidateModules[data.year-1][data.semester-1].push(data);
                    }
                })
                this.modals.addModule=1;
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
                    moduleDoc.isToggling = false;
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
                    data.programme = this.$route.params.id
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
            this.modals.addOutcome = 2;
            this.sendRequest("assignProgrammeOutcome", {
                programme: this.$route.params.id,
                outcome: outcome
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.modals.addOutcome = 0;
                })
            })
            .catch(error => {
                this.modals.addOutcome = 0;
                alert(error);
            })
        },
        removeOutcome: function(outcomeId){
            this.modals.removeOutcome = 2;
            this.sendRequest("unassignProgrammeOutcome", {
                programme: this.$route.params.id,
                outcomeId: outcomeId
            })
            .then(response => {
                this.getProgramme()
                .then(()=>{
                    this.pendingDeleteOutcome = null;
                    this.modals.removeOutcome = 0;
                })
            }).catch(error => {
                this.pendingDeleteOutcome = null;
                this.modals.removeOutcome = 0;
                alert(error);
            })
        },
        mapOutcome: function(p_out, m_out, moduleId){
            this.modals.mapOutcome = 2;
            this.sendRequest("mapOutcome", {
                programme: this.$route.params.id,
                programmeOutcome: p_out,
                module: moduleId,
                moduleOutcome: m_out
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.pendingMapOutcome = null;
                    this.modals.mapOutcome = 0;
                })
            })
            .catch(error => {
                this.pendingMapOutcome = null;
                this.modals.mapOutcome = 0;
                this.alertError(error);
            })
        },
        unmapOutcome: function (programmeOutcome, module, moduleOutcome) {
            this.modals.unmapOutcome = 2;
            this.sendRequest("unmapOutcome", {
                programme: this.$route.params.id,
                programmeOutcome: programmeOutcome,
                module: module,
                moduleOutcome: moduleOutcome
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.pendingUnmap = null;
                    this.modals.unmapOutcome = 0;
                })
            })
            .catch(error => {
                this.pendingUnmap = null;
                this.modals.unmapOutcome = 0;
                this.alertError(error);
            })
        },
        addAdministrator: function (email) {
            this.modals.addAdministrator = 2;
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
                    return this.getAdministrators();
                })
                .then(() => {
                    this.modals.addAdministrator = 0;
                })
            })
            .catch(error => {
                this.modals.addAdministrator = 0;
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
            this.modals.removeAdministrator = 2;
            this.sendRequest("removeAdministrator", {
                programme: this.$route.params.id,
                targetUid: uid
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    return this.getAdministrators();
                })
                .then(() => {
                    this.pendingRemoveAdmin = null;
                    this.modals.removeAdministrator = 0;
                })
            })
            .catch(error => {
                this.pendingRemoveAdmin = null;
                this.modals.removeAdministrator = 0;
                this.alertError(error);
            })
        },
        transferOwnership: function(uid){
            this.modals.transferOwnership = 2;
            this.sendRequest("transferProgrammeOwnership", {
                programme: this.$route.params.id,
                targetUid: uid
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    return this.getLeader();
                })
                .then(() => {
                    this.modals.transferOwnership = 0;
                })
            })
            .catch(error => {
                this.modals.transferOwnership = 0;
                this.alertError(error);
            })
        },
        changeDuration: function(duration){
            this.modals.changeDuration = 2;
            this.sendRequest("changeDuration", {
                programme: this.$route.params.id,
                duration: duration
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    return this.getModules();
                })
                .then(() => {
                    this.modals.changeDuration = 0;
                })
            })
            .catch(error => {
                this.modals.changeDuration = 0;
                this.alertError(error);
            })
        },
        publishProgramme: function(){
            this.modals.confirmPublishProgramme = 2;
            this.sendRequest("publishProgramme", {
                programme: this.$route.params.id
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.modals.confirmPublishProgramme = 0;
                })
            })
            .catch(error => {
                this.modals.confirmPublishProgramme = 0;
                this.alertError(error);
            })
        },
        unpublishProgramme: function(){
            this.modals.confirmUnpublishProgramme = 2;
            this.sendRequest("unpublishProgramme", {
                programme: this.$route.params.id
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.modals.confirmUnpublishProgramme = 0;
                })
            })
            .catch(error => {
                this.modals.confirmUnpublishProgramme = 0;
                this.alertError(error);
            })
        },
        deleteProgramme: function(){
            this.modals.confirmDeleteProgramme = 2;
            this.sendRequest("deleteProgramme", {
                programme: this.$route.params.id
            })
            .then(response => {
                this.modals.confirmDeleteProgramme = 0;
                window.location.replace("/#/programmes")
            })
            .catch(error => {
                this.modals.confirmDeleteProgramme = 0;
                this.alertError(error);
            })
        },
        editOutcome(id, text){
            this.modals.editOutcome = 2;
            this.sendRequest("editProgrammeOutcome", {
                programme: this.$route.params.id,
                outcomeId: id,
                outcome: text
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.modals.editOutcome = 0;
                })
            })
            .catch(error => {
                this.modals.editOutcome = 0;
                this.alertError(error)
            })
        },
        setDescription: function(description){
            this.modals.setDescription = 2;
            this.sendRequest("setProgrammeDescription", {
                programme: this.$route.params.id,
                description: description
            })
            .then(response => {
                this.getProgramme()
                .then(() => {
                    this.modals.setDescription = 0;
                })
            })
            .catch(error => {
                this.modals.setDescription = 0;
                this.alertError(error)
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
    <div>
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <nav class="level">
                        <div class="level-left">
                            <div>
                                <h1 class="title">
                                    {{ programme.name }} <a v-if="userIsLeader && !programme.published" v-on:click="modals.renameProgramme=1" title="Rename Programme"><i class="fas fa-edit"></i></a>
                                </h1>
                                <h1 class="subtitle">
                                    Led by {{ leader.displayName }} <a v-if="userIsLeader && !programme.published" title="Transfer ownership" v-on:click="modals.transferOwnership=1"><i class="fas fa-edit"></i></a>
                                </h1>
                            </div>
                        </div>
                        <div class="level-right">
                            <div>
                                <h2 class="title is-5">
                                    Programme Duration: {{ programme.duration }} {{ programme.duration==1 ? "year" : "years" }} <a v-if="userIsAdmin && !programme.published"v-on:click="modals.changeDuration=1"><i class="fas fa-edit"></i></a>
                                </h2>
                                <h2 class="title is-5">
                                    <div v-if="programme.published">
                                        Published (<a v-if="userIsLeader" v-on:click="modals.confirmUnpublishProgramme = 1">Unpublish</a>)
                                    </div>
                                    <div v-else>
                                        Unpublished (<a v-if="userIsLeader" v-on:click="modals.confirmPublishProgramme = 1">Publish</a>)
                                    </div>
                                </h2>
                            </div>
                        </div>
                    </nav>
                    <div class="content is-medium">
                        <p>
                            <span v-if="programme.description.length === 0">No description set</span>
                            <span v-else>{{ programme.description }}</span>
                            <a v-if="userIsAdmin && !programme.published" v-on:click="modals.setDescription=1"><i class="fas fa-edit"></i></a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
        <div class="tile is-ancestor">
            <div class="tile is-parent is-vertical">
                <div class="tile is-parent">
                    <div class="tile is-parent">
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
                                                            <li v-for="m in type==='Core' ? core[y-1][s-1] : optional[y-1][s-1]" :key="m.id">
                                                                <h3 class="title is-4">
                                                                    <router-link v-bind:to="'/modules/'+m.id">{{ m.name }}</router-link> 
                                                                    <a v-if="userIsAdmin && !programme.published && !m.isToggling" v-on:click="function(){pendingDelete = m;modals.confirmUnassignModule=1}">
                                                                        <i class="fas fa-minus-circle"></i>
                                                                    </a>
                                                                    <i v-if="m.isToggling" class="fas fa-circle-notch fa-spin"></i>
                                                                </h3>
                                                                <div class="subtitle is-6" v-if="userIsAdmin && !programme.published && !m.isToggling">
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
                    </div>
                    <div class="tile is-parent">
                        <div class="tile is-child is-warning notification">
                            <h1 class="title">
                                Learning Outcomes <a v-if="userIsAdmin && !programme.published" v-on:click="modals.addOutcome=1"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ol>
                                    <li v-for="(o, i) in programme.outcomes" v-bind:value="i">
                                        {{ o }} 
                                        <a v-if="userIsAdmin && !programme.published" v-on:click="()=>{pendingDeleteOutcome = {'id':i,'text':o};modals.removeOutcome=1}">
                                            <i class="fas fa-minus-circle"></i>
                                        </a>
                                        <a v-if="userIsAdmin && !programme.published" v-on:click="()=>{pendingEditOutcome = {'id':i,'text':o};modals.editOutcome=1}">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                        <div class="subtitle is-6" v-if="userIsAdmin && !programme.published">
                                            <a v-on:click="()=>{pendingMapOutcome = i;modals.mapOutcome=1}">Map module outcome</a>
                                        </div>
                                        <ul>
                                            <li v-for="(m, j) in programme.mapping[i]" v-if="programme.mapping[i][j].length > 0">
                                                {{ getModuleById(j).name }}
                                                <ol>
                                                    <li v-for="o2 in programme.mapping[i][j]" v-bind:value="o2">
                                                        {{ getModuleById(j).outcomes[o2] }} <a v-if="userIsAdmin && !programme.published" v-on:click="()=>{pendingUnmap={'module':getModuleById(j),'moduleOutcome': o2,'programmeOutcome': i, 'programmeOutcomeText': o};modals.unmapOutcome=1}"><i class="fas fa-minus-circle"></i></a>
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
                    <div class="tile is-child is-success notification">
                        <h1 class="title">
                            Administrators <a v-if="userIsLeader && !programme.published" v-on:click="modals.addAdministrator = 1"><i class="fas fa-plus-circle"></i></a>
                        </h1>
                        <div class="content is-medium">
                            <ul>
                                <li v-for="a in administrators">
                                    {{ a.displayName }} ({{ a.email }}) <a v-if="userIsLeader && !programme.published" v-on:click="()=>{pendingRemoveAdmin=a;modals.removeAdministrator=1}"><i class="fas fa-minus-circle"></i></a>
                                </li>
                            </ul>
                        </div>
                    </div>
                <a v-if="userIsLeader && !programme.published" v-on:click="modals.confirmDeleteProgramme = 1">Delete Programme</a>
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
            ref="addModule"
            v-on:submit="assignModule($event)"
        />
        <confirm-unassign-module
            v-if="pendingDelete"
            v-bind:showing.sync="modals.confirmUnassignModule"
            v-bind:pending.sync="pendingDelete"
            v-on:submit="unassignModule(pendingDelete)"
        />
        <add-outcome 
            v-bind:showing.sync="modals.addOutcome"
            v-on:submit="addOutcome($event)"
        />
        <confirm-remove-outcome
            v-if="pendingDeleteOutcome"
            v-bind:showing.sync="modals.removeOutcome"
            v-bind:pending.sync="pendingDeleteOutcome"
            v-on:submit="removeOutcome(pendingDeleteOutcome.id)"
        />
        <map-outcome
            v-if="pendingMapOutcome"
            v-bind:showing.sync="modals.mapOutcome"
            v-bind:pendingP.sync="pendingMapOutcome"
            v-bind:modules="modules"
            v-bind:mapping="programme.mapping"
            v-on:submit="mapOutcome(pendingMapOutcome, $event.outcomeId, $event.moduleId)"
        />
        <confirm-unmap-outcome
            v-if="pendingUnmap"
            v-bind:showing.sync="modals.unmapOutcome"
            v-bind:pending.sync="pendingUnmap"
            v-on:submit="unmapOutcome(pendingUnmap.programmeOutcome, pendingUnmap.module.id, pendingUnmap.moduleOutcome)"
        />
        <add-administrator
            v-bind:showing.sync="modals.addAdministrator"
            v-on:submit="addAdministrator($event)"
        />
        <confirm-remove-administrator
            v-if="pendingRemoveAdmin"
            v-bind:showing.sync="modals.removeAdministrator"
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
        <edit-outcome
            v-bind:showing.sync="modals.editOutcome"
            v-bind:outcome="pendingEditOutcome"
            v-on:submit="editOutcome($event.id, $event.text)"
        />
        <set-description
            v-bind:showing.sync="modals.setDescription"
            v-bind:current="programme.description"
            v-on:submit="setDescription($event)"
        />
    </div>
    <div v-else>
        <br>
        <br>
        <section class="hero">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">Loading...</h1>
                    <progress class="progress is-primary" max="100"></progress>
                </div>
            </div>
        </section>
    </div>
    </div>
    `
}
const ModuleEditor = {
    data: function(){
        return {
            user: null,
            module: null,
            leader: null,
            prerequisites: [],
            programmes: [],
            ready: false,
            editable: true,
            pendingUnassignPrerequisite: null,
            pendingRemoveOutcome: null,
            pendingEditOutcome: null,
            modals: {
                addOutcome: 0,
                removeOutcome: 0,
                renameModule: 0,
                transferOwnership: 0,
                changeYear: 0,
                changeSemester: 0,
                changeCredits: 0,
                assignPrerequisite: 0,
                unassignPrerequisite: 0,
                confirmDeleteModule: 0,
                editOutcome: 0,
                setDescription: 0,
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
        'rename-module': RenameModule,
        'transfer-module-ownership': TransferModuleOwnership,
        'change-year': ChangeModuleYear,
        'change-semester': ChangeModuleSemester,
        'change-credits': ChangeModuleCredits,
        'confirm-remove-outcome': ConfirmRemoveOutcome,
        'confirm-delete-module': ConfirmDeleteModule,
        'assign-prerequisite': AssignPrerequisite,
        'confirm-unassign-prerequisite': ConfirmUnassignPrerequisite,
        'edit-outcome': EditOutcome,
        'set-description': SetDescription
    },
    methods: {
        getModule: function(){
            return firebase.firestore().collection("modules").doc(this.$route.params.id).get()
            .then(snapshot => {
                this.module = snapshot.data();
                if(!this.module.description){
                    this.module.description = ""
                }
            })
        },
        getLeader: function(){
            return axios.post(apiRoot+"/getUser",{
                uid: this.module.leader
            })
            .then(response => {
                this.leader = response.data;
            })
        },
        getPrerequisites: function(){
            var prerequisites = [];
            var promises = [];
            this.module.prerequisites.forEach(module => {
                promises.push(firebase.firestore().collection("modules").doc(module).get());
            })
            return Promise.all(promises)
            .then(snapshots => {
                for(i=0;i<snapshots.length;i++){
                    var moduleDoc = snapshots[i].data();
                    moduleDoc.id = snapshots[i].id;
                    prerequisites.push(moduleDoc)
                }
                this.prerequisites = prerequisites;
            });
        },
        getProgrammes: function(){
            programmes = [];
            return firebase.firestore().collection("programmes").where("modules","array-contains", this.$route.params.id).get()
            .then(snapshot => {
                var snapshots = snapshot.docs;
                for(i=0;i<snapshots.length;i++){
                    var programmeDoc = snapshots[i].data();
                    programmeDoc.id = snapshots[i].id;
                    if(programmeDoc.published){
                        this.editable = false;
                    }
                    programmes.push(programmeDoc)
                }
                this.programmes = programmes;
            })
        },
        update: function(){
            this.ready = false;
            this.getModule()
            .then(() => this.getLeader())
            .then(() => this.getPrerequisites())
            .then(() => this.getProgrammes())
            .then(() => this.ready = true)
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
        alertError: function (error) {
            if (error.response) {
                alert(error.response.data);
            } else {
                alert('Error: ' + error.message);
            }
        },
        addOutcome: function(outcome){
            this.modals.addOutcome = 2;
            this.sendRequest("assignModuleOutcome", {
                module: this.$route.params.id,
                outcome: outcome
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.addOutcome = 0;
                })
            })
            .catch(error => {
                this.modals.addOutcome = 0;
                this.alertError(error);
            })
        },
        removeOutcome: function(outcomeId){
            this.modals.removeOutcome = 2;
            this.sendRequest("unassignModuleOutcome", {
                module: this.$route.params.id,
                outcomeId: outcomeId
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.removeOutcome = 0;
                    this.pendingRemoveOutcome = null;
                })
            }).catch(error => {
                this.modals.removeOutcome = 0;
                this.pendingRemoveOutcome = null;
                this.alertError(error);
            })
        },
        assignPrerequisite: function(target){
            this.sendRequest("assignPrerequisite", {
                module1: this.$route.params.id,
                module2: target.id
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    return this.getPrerequisites()
                })
                .then(() => {
                    target.state=2;
                })
            })
            .catch(error => {
                target.state=2;
                this.alertError(error);
            })
        },
        unassignPrerequisite: function(target){
            this.modals.unassignPrerequisite = 2;
            this.sendRequest("unassignPrerequisite", {
                module1: this.$route.params.id,
                module2: target.id
            })
            .then(response => {
                this.getModule()
                .then(() => this.getPrerequisites())
                .then(() => {
                    this.modals.unassignPrerequisite = 0;
                    this.pendingUnassignPrerequisite = null;
                })
            })
            .catch(error => {
                this.modals.unassignPrerequisite = 0;
                this.pendingUnassignPrerequisite = null;
                this.alertError(error);
            })
        },
        renameModule: function(name){
            this.modals.renameModule = 2;
            this.sendRequest("renameModule", {
                module: this.$route.params.id,
                name: name
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.renameModule = 0;
                })
            })
            .catch(error => {
                this.modals.renameModule = 0;
                this.alertError(error);
            })
        },
        transferOwnership: function(target){
            this.modals.transferOwnership = 2;
            this.sendRequest("getUserByEmail", {
                email: target
            })
            .then(user => {
                return this.sendRequest("transferModuleOwnership", {
                    module: this.$route.params.id,
                    targetUid: user.data.uid
                });
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.transferOwnership = 2;
                })
            })
            .catch(error => {
                this.modals.transferOwnership = 2;
                this.alertError(error);
            })
        },
        changeYear: function(year){
            this.modals.changeYear = 2;
            this.sendRequest("changeYear", {
                module: this.$route.params.id,
                year: year
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.changeYear = 0;
                })
            })
            .catch(error => {
                this.modals.changeYear = 0;
                this.alertError(error);
            })
        },
        changeSemester: function(semester){
            this.modals.changeSemester = 2;
            this.sendRequest("changeSemester", {
                module: this.$route.params.id,
                semester: semester
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.changeSemester = 0;
                })
            })
            .catch(error => {
                this.modals.changeSemester = 0;
                this.alertError(error);
            })
        },
        changeCredits: function(credits){
            this.modals.changeCredits = 2;
            this.sendRequest("changeCredits", {
                module: this.$route.params.id,
                credits: credits
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.changeCredits = 0;
                })
            })
            .catch(error => {
                this.modals.changeCredits = 0;
                this.alertError(error);
            })
        },
        deleteModule: function(){
            this.modals.confirmDeleteModule = 2;
            this.sendRequest("deleteModule", {
                module: this.$route.params.id
            })
            .then(response => {
                this.modals.confirmDeleteModule = 0;
                window.location.replace("/#/modules")
            })
            .catch(error => {
                this.modals.confirmDeleteModule = 0;
                this.alertError(error);
            })
        },
        editOutcome: function(outcomeId, outcome){
            this.modals.editOutcome = 2;
            this.sendRequest("editModuleOutcome", {
                module: this.$route.params.id,
                outcomeId: outcomeId,
                outcome: outcome
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.editOutcome = 0;
                });
            })
            .catch(error => {
                this.modals.editOutcome = 0;
                this.alertError(error);
            })
        },
        setDescription: function(description){
            this.modals.setDescription = 2;
            this.sendRequest("setModuleDescription", {
                module: this.$route.params.id,
                description
            })
            .then(response => {
                this.getModule()
                .then(() => {
                    this.modals.setDescription = 0;
                })
            })
            .catch(error => {
                this.modals.setDescription = 0;
            })
        }
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
    <div>
    <div v-if="ready">
        <section class="hero is-info">
            <div class="hero-body">
                <div class="container">
                    <nav class="level">
                        <div class="level-left">
                            <div>
                                <h1 class="title">
                                    {{ module.name }} <a v-if="userIsLeader" v-on:click="modals.renameModule=1"><i class="fas fa-edit"></i></a>
                                </h1>
                                <h2 class="subtitle">
                                    Led by {{ leader.displayName }} <a v-if="userIsLeader" v-on:click="modals.transferOwnership=1"><i class="fas fa-edit"></i></a>
                                </h2>
                            </div>
                        </div>
                        <div class="level-right">
                            <div class="content is-medium">
                                <p class="title is-5">
                                    Year: {{ module.year }} <a v-if="userIsLeader" v-on:click="modals.changeYear=1"><i class="fas fa-edit"></i></a><br><br>
                                    Semester: {{ module.semester }} <a v-if="userIsLeader" v-on:click="modals.changeSemester=1"><i class="fas fa-edit"></i></a><br><br>
                                    Credits: {{ module.credits }} <a v-if="userIsLeader" v-on:click="modals.changeCredits=1"><i class="fas fa-edit"></i></a>
                                </p>
                            </div>
                        </div>
                    </nav>
                    <div class="content is-medium">
                        <p>
                            <span v-if="module.description.length">
                                {{ module.description }}
                            </span>
                            <span v-else>
                                No Description Set
                            </span>
                            <a v-if="userIsLeader && editable" v-on:click="modals.setDescription = 1"><i class="fas fa-edit"></i></a>
                        </p>
                    </div>
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
                                Learning Outcomes <a v-if="userIsLeader" v-on:click="modals.addOutcome=1"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ol v-if="Object.keys(module.outcomes).length > 0">
                                    <li v-for="(o, i) in module.outcomes" v-bind:value="i">
                                        {{ o }} 
                                        <a v-if="userIsLeader && editable" v-on:click="()=>{pendingRemoveOutcome={'id':i,'text':o};modals.removeOutcome=1}">
                                            <i class="fas fa-minus-circle"></i>
                                        </a>
                                        <a v-if="userIsLeader && editable" v-on:click="()=>{pendingEditOutcome={'id':i,'text':o};modals.editOutcome=1;}">
                                            <i class="fas fa-edit"></i>
                                        </a>
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
                                Prerequisites <a v-if="userIsLeader" v-on:click="modals.assignPrerequisite=1"><i class="fas fa-plus-circle"></i></a>
                            </h1>
                            <div class="content is-medium">
                                <ul v-if="prerequisites.length > 0">
                                    <li v-for="m in prerequisites">
                                        <router-link v-bind:to="'/modules/'+m.id">{{ m.name }}</router-link> <a v-if="userIsLeader && editable" v-on:click="()=>{pendingUnassignPrerequisite=m;modals.unassignPrerequisite=1}"><i class="fas fa-minus-circle"></i></a>
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
                    <a v-if="userIsLeader && editable" v-on:click="modals.confirmDeleteModule=1">Delete Module</a>
                </div>
            </div>
        </div>
        <rename-module
            v-bind:showing.sync="modals.renameModule"
            v-bind:moduleName="module.name"
            v-on:submit="renameModule($event)"
        />
        <transfer-module-ownership
            v-bind:showing.sync="modals.transferOwnership"
            v-on:submit="transferOwnership($event)"
        />
        <change-year
            v-bind:showing.sync="modals.changeYear"
            v-bind:current="module.year"
            v-on:submit="changeYear($event)"
        />
        <change-semester
            v-bind:showing.sync="modals.changeSemester"
            v-bind:current="module.semester"
            v-on:submit="changeSemester($event)"
        />
        <change-credits
            v-bind:showing.sync="modals.changeCredits"
            v-bind:current="module.credits"
            v-on:submit="changeCredits($event)"
        />
        <add-outcome 
            v-bind:showing.sync="modals.addOutcome"
            v-on:submit="addOutcome($event)"
        />
        <confirm-remove-outcome
            v-if="pendingRemoveOutcome"
            v-bind:showing.sync="modals.removeOutcome"
            v-bind:pending.sync="pendingRemoveOutcome"
            v-on:submit="removeOutcome(pendingRemoveOutcome.id)"
        />
        <assign-prerequisite
            v-bind:showing.sync="modals.assignPrerequisite"
            v-bind:module="module"
            v-on:submit="assignPrerequisite($event)"
        />
        <confirm-unassign-prerequisite
            v-if="pendingUnassignPrerequisite"
            v-bind:showing.sync="modals.unassignPrerequisite"
            v-bind:pending.sync="pendingUnassignPrerequisite"
            v-on:submit="unassignPrerequisite(pendingUnassignPrerequisite)"
        />
        <confirm-delete-module
            v-bind:showing.sync="modals.confirmDeleteModule"
            v-bind:moduleName="module.name"
            v-on:submit="deleteModule()"
        />
        <edit-outcome
            v-bind:showing.sync="modals.editOutcome"
            v-bind:outcome="pendingEditOutcome"
            v-on:submit="editOutcome($event.id, $event.text)"
        />
        <set-description
            v-bind:showing.sync="modals.setDescription"
            v-bind:current="module.description"
            v-on:submit="setDescription($event)"
        />
    </div>
    <div v-else>
        <br>
        <br>
        <section class="hero">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">Loading...</h1>
                    <progress class="progress is-primary" max="100"></progress>
                </div>
            </div>
        </section>
    </div>
    </div>
    `
}
const CreateModule = {
    data: function() {
        return {
            formData: {
                name: "",
                year: 1,
                semester: 1,
                credits: 7.5
            }
        }
    },
    props: {
        showing: Number
    },
    template: `
    <div id="create-module" class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Create Module</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name: </label>
              <div class="control">
                <input class="input" type="text" placeholder="EXMP1001 Example" v-model="formData.name">
              </div>
            </div>
            <div class="field">
              <label class="label">Year: </label>
              <div class="control">
                <div class="select">
                  <select v-model="formData.year">
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
                  <select v-model="formData.semester">
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
                  <select v-model="formData.credits">
                    <option>7.5</option>
                    <option>15</option>
                    <option>22.5</option>
                    <option>30</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" v-on:click="$emit('submit', formData)" v-bind:disabled="showing==2" v-bind:class="{'is-loading':showing==2}">Create</button>
            <button class="button" v-bind:disabled="showing==2" v-on:click="$emit('update:showing', 0)">Cancel</button>
          </footer>
        </div>
      </div>
    `
}
const CreateProgramme = {
    data: function() {
        return {
            formData: {
                name: "",
                duration: 1
            }
        }
    },
    props: {
        showing: Number
    },
    template: `
    <div id="create-programme" class="modal" v-bind:class="{'is-active': showing}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Create Programme</p>
            <button class="delete" aria-label="close" v-on:click="$emit('update:showing', false)"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name: </label>
              <div class="control">
                <input class="input" type="text" placeholder="BSc Something" v-model="formData.name">
              </div>
            </div>
            <div class="field">
              <label class="label">Duration: </label>
              <div class="control">
                <div class="select">
                  <select v-model="formData.duration">
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
            <button class="button is-success" v-on:click="$emit('submit', formData)">Create</button>
            <button class="button" v-on:click="$emit('update:showing', false)">Cancel</button>
          </footer>
        </div>
      </div>
    `
}
const SignIn = {
    created: function(){
        uiConfig.signInSuccessUrl = this.$route.query.redirect;
        ui.start('#firebaseui-auth-container', uiConfig);
    },
    template: `
    <div id="firebaseui-auth-container"></div>
    `
}

const Home = {
    data: function(){
        return {
            user: null
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
    },
    template: `
    <section class="hero is-medium is-dark">
        <div class="hero-body">
            <div class="container">
                <h1 class="title is-1">ProgManSys</h1>
                <h3 class="subtitle is-3">University <b>Prog</b>ramme <b>Man</b>agement <b>Sys</b>tem</h3>
            </div>
        </div>
    </section>
    `
}

const routes = [
    { path: '/programmes', component: ProgrammeList },
    { path: '/modules', component: ModuleList },
    { path: '/programmes/:id', component: ProgrammeEditor },
    { path: '/modules/:id', component: ModuleEditor },
    { path: '/signin', component: SignIn },
    { path: '/', component: Home}
]
const router = new VueRouter({
    routes
})
var app = new Vue({
    el: '#app',
    router,
    components: {
        'create-module': CreateModule,
        'create-programme': CreateProgramme,
        'remove-modal': RemoveModal
    },
    data: {
        user: null,
        modals: {
            createProgramme: 0,
            createModule: 0,
            genericTest: 0
        }
    },
    methods: {
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
        alertError: function (error) {
            if (error.response) {
                alert(error.response.data);
            } else {
                alert('Error: ' + error.message);
            }
        },
        logout: function () {
            firebase.auth().signOut();
            location.reload()
        },
        login: function () {
            ui.start('#firebaseui-auth-container', uiConfig);
        },
        createProgramme: function(name, duration){
            this.modals.createProgramme = 2;
            this.sendRequest("createProgramme", {
                name: name,
                duration: duration
            })
            .then(response => {
                this.modals.createProgramme = 0;
                window.location.assign("/#/programmes/"+response.data.id)
            })
            .catch(error => {
                this.modals.createProgramme = 0;
                this.alertError(error)
            })
        },
        createModule: function(name, year, semester, credits){
            this.modals.createModule = 2;
            this.sendRequest("createModule", {
                name: name,
                year: year,
                semester: semester,
                credits: credits
            })
            .then(response => {
                this.modals.createModule = 0;
                window.location.assign("/#/modules/"+response.data.id)
            })
            .catch(error => {
                this.modals.createModule = 0;
                this.alertError(error)
            })
        }
    },
    created: function(){
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
        })
    }
});