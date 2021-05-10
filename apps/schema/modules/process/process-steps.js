import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {io} from '/~static/lib/client/core/io.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Process_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.bizprocess = {};
    this.model.steps = [];
    this.model.step = {};
    this.model.stepState = '';
    this.stepIndex;
    this.model.actionSelect = [];
    this.model.subActionSelect = [];

    this.model.badMessage = '';
    this.model.errors = {
      app: {},
      message: ''
    };

    this.triggerDescs = {
      'P': 'Post',
      'E': 'Event',
      'T': 'Timer'
    };

    this.$addWatched('step.action', this.actionChanged.bind(this));
    this.$addWatched('step.subaction', this.subActionChanged.bind(this));

    this.stepModal = new bootstrap.Modal(document.getElementById('process-step-popup'), {backdrop: 'static', keyboard: false, focus: true});

    this.dropAllow = this.dropAllow.bind(this);   // when event listener is removed it must be exact event
    this.drop = this.drop.bind(this);
    this.dragStart = this.dragStart.bind(this);
  }

  async ready() {
    return new Promise(async function(resolve) {
      let res;

      res = await io.get({}, '/schema/v1/bizprocess/groups');
      this.actionGroup = res.data;

      res = await io.get({}, '/schema/v1/bizprocess/actions');
      this.actionList = res.data;

      this.buildSelect();

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let id = params.id || '';

    if (!id) this.gotoList();

    let res = await Module.tableStores.bizprocess.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.bizprocess = res;
      this.origProcess = res;
      this.model.steps = res.steps;

      if (this.model.bizprocess.steps.length == 0) this.createNewProcessSteps();

      this.setupDragAndDrop();
    }
    else {
      alert('Missing Process');

      this.gotoList();
    }            
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let steps = [];
    
    for (let step of this.model.steps.toJSON()) {
      let obj = {
        title: step.title,
        action: step.action || '',
        subaction: step.subaction || '',
        values: {},
        hide: step.hide,
        hideDelete: step.hideDelete,
        hideSelect: step.hideSelect,
        draggable: step.draggable,
        droppable: step.droppable,
        actionDesc: step.actionDesc || '',
        subActionDesc: step.subActionDesc || ''
      };

      for (let d in step.values) {
        obj.values[d] = step.values[d];
      }

      steps.push(obj);
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = await Module.tableStores.bizprocess.update(this.model.bizprocess.id, {steps});

    if (res.status == 200) {
      utils.modals.toast('Process', 'Updated', 2000);
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  cancel() {
    this.gotoList();
  }

  stepAdd(ev) {
    this.initNewStep();

    this.stepIndex = parseInt(ev.target.closest('button').getAttribute('data-index')) + 1;
    this.model.stepState = 'Add';
    
    this.stepOpen();
  }

  stepEdit(ev) {
    this.initNewStep();

    this.stepIndex = ev.target.closest('div.card').getAttribute('data-index');
    this.model.stepState = 'Edit';
    this.model.steps[this.stepIndex].data = [];

    this.model.step = this.model.steps[this.stepIndex];

    this.stepOpen();
  }

  stepSave() {
    // re-value values
    let values = {};

    for (let inp of this.model.step.data) {
      values[inp.name] = inp.value;
    }

    this.model.step.values = values;    

    // descriptions
    this.model.step.actionDesc = this.getActionDesc(this.model.step.action);
    this.model.step.subActionDesc = this.getSubActionDesc(this.model.step.subaction);

    // where to save it
    if (this.model.stepState == 'Edit') {
      // edit
      this.model.steps[this.stepIndex] = this.model.step;
    }
    else {
      // add
      this.model.steps.splice(this.stepIndex, 0, this.model.step);
      this.setupDragAndDrop();
    }

    this.initNewStep();
    this.stepClose();
  }

  async stepDelete(ev) {
    let ret = confirm('Confirm Deletion?');

    if (!ret) return;

    let stepIndex = ev.target.closest('div.card').getAttribute('data-index');

    this.model.steps.splice(stepIndex, 1);

    this.initNewStep();
  }

  stepExit() {
    this.initNewStep();
    this.stepClose();
  }

  stepOpen() {
    this.stepModal.show(); 
  }

  stepClose() {
    this.stepModal.hide(); 
  }

  initNewStep() {
    let step = {
      title: 'New Step',
      action: '',
      subaction: '',
      data: [],
      values: {},
      hide: false,
      hideDelete: false,
      hideSelect: false,
      draggable: true,
      droppable: true,
    }

    this.model.step = step;
  }

  createNewProcessSteps() {
    let step;

    step = {
      title: 'Initial step from ' + this.triggerDescs[this.model.bizprocess.trigger],
      action: '_initial',
      subaction: '_initial',
      actionDesc: 'Initial',
      subActionDesc: 'Handle Incoming Process',
      data: [{'input': this.makeInput({prompt: 'Incoming Data', type: 'object'}, 0), 'value': '', 'name': '_initial'}],
      values: {'_initial': ''},
      hide: false,
      hideDelete: true,
      hideSelect: true,
      draggable: false,
      droppable: false,
    };

    this.model.steps.push(step);
    
    step = {
      title: 'Return to Caller',
      action: '_final',
      subaction: '_final',
      actionDesc: 'Final',
      subActionDesc: 'Return Process Data',
      data: [{'input': this.makeInput({prompt: 'Return Data', type: 'object'}, 0), 'value': '', 'name': '_final'}],
      values: {'_final': ''},
      hide: true,
      hideDelete: true,
      hideSelect: true,
      draggable: false,
      droppable: true,
    };
    
    this.model.steps.push(step);
  }

  buildSelect() {
    // Main Action Select
    let actions = [{desc: 'No Action', items: [{value: '', text: 'No Action'}]}];

    for (let group of this.actionGroup) {
      let obj = {desc: group.text, items: []};

      for (let item of this.actionList) {
        if (item.group == group.value) {
          obj.items.push(item);
        }
      }

      actions.push(obj);
    }

    
    this.model.actionSelect = actions;
  }

  getActionDesc(id) {
    for (let action of this.model.actionSelect) {
      for (let item of action.items) {
        if (item.value == id) return item.text;
      }
    }

    return '';
  }

  getSubActionDesc(id) {
    for (let subact of this.model.subActionSelect) {
      if (subact.value == id) return subact.text;
    }

    return '';
  }

  async actionChanged(nv, ov) {
    if (!nv) return;

    let actions = [{value: '', text: 'No Subaction'}];

    let res = await io.get({}, '/db4/v1/bizprocess/actions/' + nv);

    if (res.status == 200) {
      for (let subact of res.data) {
        actions.push({value: subact.value, text: subact.text});
      }
    }

    this.model.subActionSelect = actions;
  }

  async subActionChanged(nv, ov) {
    if (!nv) return;

    let action = this.model.step.action;
    let subaction = this.model.step.subaction;
    let idx=-1;

    this.model.step.data = [];

    let res = await io.get({}, `/db4/v1/bizprocess/${action}/${subaction}`);

    if (res.status == 200) {
      // build inputs
      for (let key in res.data) {
        ++idx;
        let input = {'input': this.makeInput(res.data[key], idx), 'value': this.model.step.values[key], 'name': key};

        this.model.step.data.push(input);
      }
    }
  }

  makeInput(obj, idx) {
    let inp;

    switch (obj.type) {
      case 'string':
      case 'number':
        inp = `
          <div class="form-label-group">
            <input type="text" xid="process-step-data-${idx}" mvc-value="step.data.${idx}.value" class="form-control" />
            <label>${obj.prompt}</label>
          </div>
      
          <div mvc-show='errors.step.data.${idx}.error'>
            <small class='text-danger' mvc-text='errors.step.data.${idx}'></small>
          </div>
        `;

        break;

      case 'object':
      case 'array':
      case 'text':
        inp = `
          <div class="form-label-group">
            <textarea xid="process-step-data-${idx}" mvc-value="step.data.${idx}.value" class="form-control"></textarea>
            <label>${obj.prompt}</label>
          </div>
    
          <div mvc-show='errors.step.data.${idx}.error'>
            <small class='text-danger' mvc-text='errors.step.data.${idx}'></small>
          </div>
        `;

      break;
    }

    return inp;
  }

  setupDragAndDrop() {
    for (let el of this._section.querySelectorAll('div[draggable=true]')) {
      el.removeEventListener('dragstart', this.dragStart);
      el.addEventListener('dragstart', this.dragStart);
    }

    for (let el of this._section.querySelectorAll('div[droppable=true]')) {
      el.removeEventListener('drop', this.drop);
      el.removeEventListener('dragover', this.dropAllow);

      el.addEventListener('drop', this.drop);
      el.addEventListener('dragover', this.dropAllow);
    }
  }

  dragStart(ev) {
    this.dragActionIndex = parseInt(ev.target.closest('div.card').getAttribute('data-index'));
  }

  dropAllow(ev) {
    ev.preventDefault();
  }

  drop(ev) {
    ev.preventDefault();
    let zone = parseInt(ev.target.closest('div.card').getAttribute('data-index'));
    let temp = {};          // object to keep array the same length;
    let steps = this.model.steps.toJSON();   // work with copy so that data-index will get reset when this.model.steps array is reset
    let objectToMove = steps.splice(this.dragActionIndex, 1, temp)[0];  // replace dragged object with {}

    steps.splice(zone, 0, objectToMove);        // put dropped object into position
    steps.splice(steps.indexOf(temp), 1);       // remove temp obj

    this.model.steps = steps;
    this.setupDragAndDrop();
  }

  gotoList() {
    Module.pager.go(`/`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('process-steps');   // page html
let mvc1 = new Process_create('process-steps-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: ':id/steps', title: 'Process - Steps', sections: [section1]});

Module.pages.push(page1);