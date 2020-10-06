import {MVC} from '/~static/lib/client/core/mvc.js';
import {Editor} from '/~static/project/editor.js';
import {utils} from '/~static/lib/client/core/utils.js';

class Notes extends MVC {
  constructor() {
    const template = document.getElementById('widget-notes');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    let editorEl = clone.querySelector('div.editor-container');
    let toolbarEl = clone.querySelector('div.toolbar-container');

    this.modal = new bootstrap.Modal(clone.querySelector('div.widget-notes-modal'), {backdrop: 'static', keyboard: false});
    this.editor = new Editor(editorEl, toolbarEl);
  }

  createModel() {
    this.model.topics = [];
    this.model.topic = '';
    this.model.subject = '';
    this.model.text = '';
    this.model.operator = '';
    this.model.datetime = '';
    this.model.errors = {
      topic: '',
      subject: '',
      text: ''
    };
    
    this.resolve = '';
    this.reject = '';
  }

  setTopics(topics) {
    this.model.topics = topics;
  }

  edit(topic, subject, operator, datetime, text) {
    this.model.topic = topic;
    this.model.subject = subject;
    this.model.operator = operator;
    this.model.datetime = datetime;
    this.model.text = text;

    this.editor.setText(text);

    this.noteOpen();

    return new Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
  }

  save() {
    let topic = this.model.topic;
    let subject = this.model.subject;
    let text = this.editor.getText();
    let errors = false;

    this.model.errors.topic = '';
    this.model.errors.subject = '';

    if (!topic) {
      this.model.errors.topic = 'Required';
      errors = true;
    }

    if (!subject.trim()) {
      this.model.errors.subject = 'Required';
      errors = true;
    }

    if (!topic.trim()) {
      this.model.errors.text = 'Required';
      errors = true;
    }

    if (errors) return;

    this.noteHide();
    this.resolve({topic, subject, text});
  }

  async abort(ev) {
    let ret = true;

    if (this.editor.anyChanges()) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    if (ret) {
      this.noteHide();
      this.reject();
    }
  }

  noteHide() {
    this.modal.hide();
  }

  noteOpen() {
    this.modal.show();
  }
}

export {Notes};