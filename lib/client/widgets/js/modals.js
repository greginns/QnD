import {QnD} from '/static/v1/lib/client/core/qnd.js';
import {MVC} from '/static/v1/lib/client/core/mvc.js';
import {utils} from '/static/v1/lib/client/core/utils.js';

class Modal extends MVC {
  constructor() {
    super('mvc-alert');
    
    var self = this;

    //this.modal = $('#' + this.element);
    this.modal = document.getElementById(this._element);

    this.spinner = {
      show: function() {
        self._modalOpen(document.getElementById('mvc-spinner'));
        //$('#mvc-spinner').modal({backdrop: 'static', keyboard: false, show: true});
      },
  
      hide: function() {
        self._modalClose(document.getElementById('mvc-spinner'));
        //$('#mvc-spinner').modal('hide');
      },  
    }
    
    this.createModel();
  }

  createModel() {
    this.model.opts = {
      type: '',
      title: '',
      text: '',
      value: '',
      buttons: [],
      defaultButton: 0,
      okayButton: 0,
    };

    this.model.isPrompt = false;
    this.backdropDiv;
    
    this.resolve = '';
    this.reject = '';
  }

  open() {
    this._modalOpen(this.modal);
    
    this.opened();
  }

  opened() {
    var self = this;

    setTimeout(function() {
      document.getElementById('mvc-alert-button-container').querySelector('button[data-index="' + self.model.opts.defaultButton + '"]').focus();
    },500)
  }

  close() {
    this._modalClose(this.modal);
  }

  common(type, resolve, reject, opts) {
    var self = this;
    opts.type = type;

    opts.buttons.forEach(function(btn, idx) {
      btn.value = btn.value || idx;
    })

    if (!('defaultButton') in opts || !opts.defaultButton) opts.defaultButton = '0';
    if (!('okayButton') in opts || !opts.okayButton) opts.okayButton = '0';

    this.resolve = resolve;
    this.reject = reject;
    this.model.opts = opts;

    this.open();
  }

  alert(options) {
    var self = this;
    this.model.isPrompt = false;

    return new Promise(function(resolve, reject) {
      options = options || '';

      if (utils.object.isObject(options) === false) {
        options = {text: options, buttons: [{text: 'Okay', class: 'btn-primary'}], defaultButton: 0, okayButton: 0};
      }

      self.common('alert', resolve, reject, options)
    })
  }

  prompt(options, value) {
    var self = this;
    this.model.isPrompt = true;

    return new Promise(function(resolve, reject) {
      options = options || '';

      if (utils.object.isObject(options) === false) {
        options = {text: options, value: value || '', buttons: [{text: 'Okay', class: 'btn-primary'}, {text: 'Cancel', class: 'btn-danger'}], defaultButton: 0, okayButton: 0};
      }

      self.common('prompt', resolve, reject, options)
    })
  }

  confirm(options) {
    var self = this;
    this.model.isPrompt = false;

    return new Promise(function(resolve, reject) {
      options = options || '';

      if (utils.object.isObject(options) === false) {
        options = {text: options, buttons: [{text: 'Okay', class: 'btn-primary'}, {text: 'Cancel', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
      }

      self.common('confirm', resolve, reject, options)
    })
  }
  
  clicked(ev) {
    var btnIdx = ev.target.closest('button').getAttribute('data-index');
    var btn = this.model.opts.buttons[btnIdx];

    if (this.model.opts.type == 'prompt') {
      if (btnIdx == this.model.opts.okayButton) {
        this.resolve(this.model.opts.value);
      }
      else {
        this.reject(btn.value);
      }
    }
    else {
      this.resolve(btn.value);
    }

    this.close();
  }
  
  _modalOpen(el) {
    el.className="modal fade show";
    el.style.display = 'block';
    el.style['padding-right'] = '17px';
    
    document.body.className = 'modal-open';
    document.body.style['padding-right'] = '17px';
    
    this.backdropDiv = document.createElement('div');
    this.backdropDiv.className='modal-backdrop fade show';
    document.body.appendChild(this.backdropDiv); 
  }
  
  _modalClose(el) {
    el.className="modal fade";
    el.style.display = 'none';
    el.style['padding-right'] = '0px';
    
    document.body.style['padding-right'] = '0px'
    document.body.className = '';   
    this.backdropDiv.remove();     
  }
}

QnD.widgets.modal = new Modal();

// let ret = await QnD.widgets.modal.confirm('blah');