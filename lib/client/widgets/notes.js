import {MVC} from '/~static/lib/client/core/mvc.js';
import {Editor} from '/~static/project/editor.js';
import {utils} from '/~static/lib/client/core/utils.js';

class Notes extends MVC {
  constructor() {
    const template = document.getElementById('widget-notes');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    let editorEl = clone.querySelector('div.notesEditor');

    this.modal = new bootstrap.Modal(clone.querySelector('div.widget-notes-modal'));
    this.editor = new Editor(editorEl);
  }

  createModel() {
    this.model.topics = [];
    this.model.topic = '';
    this.model.subject = '';
    this.model.text = '';
    this.model.operator = '';
    this.model.datetime = '';
    
    this.resolve = '';
    this.reject = '';
  }

  edit(topics, topic, subject, operator, datetime, text) {
    this.model.topics = topics;
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
    let text = this.editor.getText();
    let topicDesc = '';

    for (let topic of this.model.topics) {
      if (topic.value == this.model.topic) {
        topicDesc = topic.text;
        break;
      }
    }

    this.noteHide();
    this.resolve({topic: this.model.topic, topicDesc, subject: this.model.subject, text});
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