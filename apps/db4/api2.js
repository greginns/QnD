import {MVC} from '/~static/lib/client/core/mvc.js';
import {App} from '/~static/lib/client/core/app.js';

class Db4MVC extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.badMessage = '';
    this.model.errors = {
      app: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  fred() {
    this.model.contact = {};
  }
}

for (let el of document.querySelectorAll('[mvc-mvc]')) {
  App.MVC = new Db4MVC(el);

  console.log(el.querySelectorAll('db4-model'))
}

class Db4Table extends HTMLElement {
  constructor() {
    super();

    this._attributes = {};

    this._allowedAttributes = [
      'table',
      'model'
    ];

    this._init();
  }

  _init() {
    this._getAttributes();

    if (!this._testAttributes()) {
      alert('db4-table requires a table and model names');
      return;
    }

    this._recordTableAndModel()
  }

  _recordTableAndModel() {
    App.tableModels = App.tableModels || {};
    App.tableModels[this._attributes.table] = this._attributes.model;
    console.log(App.tableModels)
  }

  _getAttributes() {
    for (let attr of this.attributes) {
      this._attributes[attr.nodeName.toLowerCase()] = attr.nodeValue;
    }
  }

  _testAttributes() {
    for (let attr of this._allowedAttributes) {
      if (!(attr in this._attributes)) return false
    }

    return true;
  }
}

class Db4Model extends HTMLElement {
  constructor() {
    super();

    this._attributes = {};

    this._allowedAttributes = {
      'model': {required: true},
      'type': {required: false, values: ['object', 'array', 'string', 'number']}
    };

    this._init();
  }

  _init() {
    this._getAttributes();

    let errs = this._testAttributes();
    if (errs.length > 0) {
      alert(errs.join('\n'));

      return;
    }

    this._setupModels()
  }

  _setupModels() {
    console.log(this._attributes);

    let type = (this._attributes.type == 'object') ? {} : (this._attributes.type == 'array') ? [] : '';

    App.MVC.model[this._attributes.model] = type;
  }

  _getAttributes() {
    for (let attr of this.attributes) {
      this._attributes[attr.nodeName.toLowerCase()] = attr.nodeValue;
    }
  }

  _testAttributes() {
    let errs = [];

    if (!('model' in this._attributes)) {
      errs.push('model name is required');
    }

    if ('type' in this._attributes) {
      let type = this._attributes.type;
      let types = this._allowedAttributes.type.values;

      if (types.indexOf(type) == -1) {
        errs.push('Type must be one of ' + types.join(','));
      }
    }
    else {
      this._attributes.type = 'string';
    }

    return errs;
  }
}

class Db4Query extends HTMLElement {
  constructor() {
    super();
    
    this._allowedAtts = [
      'qid',
      'where',
      'query',
      'limit',
      'offset',
      'orderby',
      //'trigger',
      //'event'
    ]
    
    this._init();
  }
  
  _init() {
    this._getAttributes();
    //if (!this._testAttributes()) return;
    
    //this._setupWS();
    //this._setupTableAccess();
    //this._setupTableStore();          
  }
  
  _getAttributes() {
    this._atts = {};
    
    for (let attr of this.attributes) {
      let key = attr.nodeName.toLowerCase();

      if (this._allowedAtts.indexOf(key) == -1) {
        console.warn(`Invalid ${key} attribute in `, this)
      }
      else {
        this._atts[key] = attr.nodeValue;  
      }
    }
  }
  
  connectedCallback() {
  }        
}

customElements.define('db4-table', Db4Table);
customElements.define('db4-model', Db4Model);
customElements.define('db4-query', Db4Query);