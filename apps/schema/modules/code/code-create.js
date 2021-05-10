import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Code_create extends MVC {
  constructor(element, crud) {
    super(element);

    this.crud = crud;
  }

  createModel() {
    this.model.code = {};
    this.model.params = '';
    this.model.codeId = '';
    this.editor;

    this.model.badMessage = '';
    this.model.errors = {
      app: {},
      message: ''
    };

    this.$addWatched('code.type', this.typeChanged.bind(this));
    this.$addWatched('code.name', this.nameTest.bind(this));
  }

  async ready() {
    return new Promise(async function(resolve) {
      ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/')

      this.editor = ace.edit('db4-code-' + this.crud + '-code');
      this.editor.setTheme("ace/theme/textmate");
      this.editor.session.setMode("ace/mode/javascript");
      this.editor.setOptions({
        fontSize: "16px"
      });

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    if ('id' in params) {
      this.model.codeId = params.id;
      this.model.code = await Module.tableStores.code.getOne(params.id);
      this.origCode = this.$copy(this.model.code);
    }
    else {
      this.model.codeId = '';
      this.model.code = {};
      this.model.code.type = 'CE';
    }    
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let diffs;
    let code = this.model.code.toJSON();

    code.code = this.editor.getValue();

    if (!code.name) {
      this.model.badMessage = 'Please Enter a Function Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    if (this.model.codeId) {
      diffs = utils.object.diff(this.origCode, code);
        
      if (Object.keys(diffs).length == 0) {
        this.model.badMessage = 'No Changes to Update';
        
        setTimeout(function() {
          this.model.badMessage = '';
        }.bind(this), 2500);

        return;
      }
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = (this.model.codeId) ? await Module.tableStores.code.update(this.model.codeId, diffs) : await Module.tableStores.code.insert(code);

    if (res.status == 200) {
      utils.modals.toast('Code', 'Created', 2000);
   
      this.gotoList();
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  typeChanged() {
    let type = this.model.code.type;
    let code = '';

    switch(type) {
      case 'CE':
        code += '(evObj) {';
        break;

      case 'UT':
        break;

      case 'SR':
        code += 'function(req) {\n\n}';
        break;
    }

    this.model.params = code;
  }

  nameTest(nv) {
    let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$_';
    let numer = '0123456789';
    let changed = false;

    if (alpha.indexOf(nv.substr(0,1)) == -1) {
      nv = nv.substr(1);
      changed = true;
    }

    for (let p=1; p<nv.length; p++) {
      if ((alpha+numer).indexOf(nv.substr(p,1)) == -1) {
        nv = nv.substring(0,p) + nv.substr(p+1);
        changed = true;
      }
    }

    if (changed) {
      setTimeout(function() {
        this.model.code.name = nv;
      }.bind(this), 5)
    }
  }

  cancel() {
    this.gotoList();
  }

  gotoList() {
    Module.pager.go(`/code`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('code-create');   // page html
let mvc1 = new Code_create('code-create-section', 'create');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/code/create', title: 'Code - Create', sections: [section1]});

Module.pages.push(page1);

let el2 = document.getElementById('code-update');   // page html
let mvc2 = new Code_create('code-update-section', 'update');
let section2 = new Section({mvc: mvc2});
let page2 = new Page({el: el2, path: '/code/:id/update', title: 'Code - Update', sections: [section2]});

Module.pages.push(page2);