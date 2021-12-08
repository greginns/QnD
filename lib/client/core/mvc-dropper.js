let addDropper;

export default addDropper = function(MVC) {  
  MVC._addBinding('dropper', function(el) {
    //This sort of replicates what the Dropdown does natively.  
    //But this homegrown version recognizes when the focus is lost off the dropdown
    // blur is accept
    // Accept is accept
    // ESC is reject
    // Dismiss is reject
    const INPS = ['INPUT', 'SELECT', 'TEXTAREA'];
    let func = el.getAttribute(MVC.prefix + '-dropper'); // supplied function that sets input value
    let tid =  el.getAttribute('data-template') || null;
    let did = el.getAttribute('data-id') || null; // id associated with dropper
    let trigger = el.querySelector('[data-trigger]'); // what element triggers it
    let drop = el.querySelector('.dropper-content');  // dropper contents
    let dropup = el.classList.contains('dropup');  // drop up or drop down?
    let isInput = INPS.indexOf(trigger.tagName) > -1;
    let self = this;

    const action = function(ev, accept, reason) {
      // determine what's next
      if (drop.classList.contains('show')) {
        // dropdown is showing, close
        close(accept, reason);
      }
      else {
        // dropdown not showing, open
        open();
        focus();
      }

      ev.stopPropagation();      
    }

    const open = function() {
      if (isInput) trigger.disabled = true;
      
      drop.classList.add('show');
      if (dropup) drop.style.bottom = trigger.offsetHeight + 'px';

      document.addEventListener('click', external);
      document.addEventListener('keydown', escape);

      document.dispatchEvent(new CustomEvent('dropper-open', {detail: {did, el}, bubbles: false}));
      document.dispatchEvent(new CustomEvent('dropper-open-' + did, {detail: {el}, bubbles: false}));

      if (func) self[func]({el, state: 'open'});
    };

    const close = function(accept, reason) {
      if (isInput) trigger.disabled = false;   

      drop.classList.remove('show');

      document.removeEventListener('click', external);
      document.removeEventListener('keydown', escape);

      document.dispatchEvent(new CustomEvent('dropper-close', {detail: {did, el, accept, reason}, bubbles: false}));
      document.dispatchEvent(new CustomEvent('dropper-close-' + did, {detail: {el, accept, reason}, bubbles: false}));

      if (func) self[func]({el, state: 'close', accept, reason});
    };
    
    // 5 possible actions
    const accept = function(ev) {
      action(ev, true, 'accept');
    }

    const blur = function(ev) {
      // off of the dropdown?
      if (ev.relatedTarget) {
        let target = ev.relatedTarget;
        if (target == drop) return;

        if (target.closest('div.dropper-content') != drop) {
          action(ev, true, 'blur');
          return;
        }
      }
    };

    const dismiss = function(ev) {
      // Dismiss button clicked
      action(ev, false, 'dismiss');
    }

    const escape = function(ev) {
      // ESC pressed
      if (ev.code == 'Escape') {
        action(ev, false, 'esc');
      }
    };

    const external = function(ev) {
      // clicked somewhere.  If not on dropdown, then close
      if (!ev.target.closest('div.dropper-content')) {
        action(ev, false, 'click');
      }
    };

    // focus on the first input, if any.
    const focus = function() {
      setTimeout(function() {
        let focused = false;

        for (let el of Array.from(drop.querySelectorAll('*'))) {
          if (INPS.indexOf(el.tagName) > -1) {
            if (el.tagName == 'INPUT') {
              el.select();
            }
            else {
              el.focus();
            }

            focused = true;
            break;
          }
        };

        if (!focused) drop.focus(); // if no input at least shift focus to the dropdown
      }, 1);
    };

    /* Initialize */
    // copy template html into dropdown, initialize it.
    let template = document.getElementById(tid);
    let clone = template.content.firstElementChild.cloneNode(true);

    drop.appendChild(clone);
    this._elementInit(drop);

    // Accept button?
    let acc = drop.querySelector('.accept');
    if (acc) {
      acc.addEventListener('click', accept);
    }

    // Dismiss button?
    let diss = drop.querySelector('.dismiss');
    if (diss) {
      diss.addEventListener('click', dismiss);
    }

    // permanent event handlers
    trigger.addEventListener('click', action);
    trigger.addEventListener('focus', action);
    drop.addEventListener('focusout', blur);
    
    setTimeout(function() {
      if (func) self[func]({el, state: 'init'});

      document.dispatchEvent(new CustomEvent('dropper-init', {detail: {did, el}, bubbles: false}));
      document.dispatchEvent(new CustomEvent('dropper-init-' + did, {detail: {el}, bubbles: false}));
    }, 1);
  });
};
/*
  MVC._addBinding('dropdown', function(el) {
    // Something isn't working right with dropdowns and the ESC key
    //   hideIt is a work-around
    //
    let func = el.getAttribute(MVC.prefix + '-dropdown'); // supplied function that sets input value
    let tid =  el.getAttribute('data-template');
    let group = el.querySelector('div.form-label-group');
    let toggle = group.querySelector('[data-bs-toggle]');
    let drop = el.querySelector('div.dropdown-menu');
    let self = this;

    const hideIt = function() {
      drop.classList.remove('show');
      document.removeEventListener('keydown', escape);
      toggle.disabled = false;        
      self[func]();
    };

    const escape = function(ev) {
      if (ev.code == 'Escape') {
        hideIt();
      }
    };

    // Initializing
    let dd = new bootstrap.Dropdown(toggle);

    // copy template html into dropdown
    let template = document.getElementById(tid);
    let clone = template.content.firstElementChild.cloneNode(true);

    drop.appendChild(clone);
    this._elementInit(drop);

    // add event listeners
    toggle.addEventListener('hide.bs.dropdown', function() {
      document.removeEventListener('keydown', escape);
      toggle.disabled = false;        
      self[func]();
    });

    toggle.addEventListener('show.bs.dropdown', function() {
      document.addEventListener('keydown', escape);
      toggle.disabled = true;

      setTimeout(function() {
        let cbs = drop.querySelectorAll('input');
        if (cbs.length > 0) cbs[0].focus();
      }, 10)      
    });

    toggle.addEventListener('focus', function() {
      dd.show();
    });

    for (let diss of Array.from(clone.querySelectorAll('div.dismiss'))) {
      diss.addEventListener('click', function(ev) {
        hideIt();
        //dd.hide();
      })
    }

    // call function to set value
    setTimeout(function() {
      self[func]();
    }, 1);
  });
};
*/
/*
  MVC._addBinding('multiselect', function(el) {
    // make sure when input array is set that the data list array has checked = true for initial choices
    let group = el.querySelector('div.input-group');
    let inp = group.querySelector('input');
    let drop = el.querySelector('div.dropdown-menu');
    let srcPath = inp.getAttribute('data-source');
    let valPath = inp.getAttribute(MVC.prefix + '-value');

    // set initial checked values
    if (valPath && srcPath) {
      let srcData = this.$readModel(srcPath) || [];
      let valData = this.$readModel(valPath) || [];

      for (let entry of srcData) {
        let x = valData.indexOf(entry.value);
        entry.checked = x > -1;
      }
    }

    const blur = function(ev) {
      // off of the dropdown?
      if (ev.relatedTarget) {
        let target = ev.relatedTarget;
        if (target == drop) return;

        if (target.tagName != 'INPUT' || target.closest('div.dropdown-menu') != drop) {
          action(ev);
          return;
        }
      }
    }

    const external = function(ev) {
      // click somewhere.  If not on dropdown, then close
      if (!ev.target.closest('div.dropdown-menu')) {
        action(ev);
      }
    }

    const action = function(ev) {
      if (drop.classList.contains('show')) {
        // dropdown is showing, close
        inp.disabled = false;        
        drop.classList.remove('show');
        document.removeEventListener('click', external);
      }
      else {
        // dropdown not showing, open
        inp.disabled = true;
        drop.classList.add('show');
        document.addEventListener('click', external);

        let cbs = drop.querySelectorAll('input');
        cbs[0].focus();
      }

      ev.stopPropagation();      
    }

    group.addEventListener('click', action);
    drop.addEventListener('focusout', blur);
    inp.addEventListener('focus', action);
  })

  MVC._addProtoMethod('$checked2text', function(obj) {
    let dataPath = obj.args[0];
    let destPath = obj.args[1];
    let data = this.$readModel(dataPath);
    let text = [];

    for (let entry of data) {
      if (entry.checked) text.push(entry.value);
    }

    this.$updateModel(destPath, text);
  });

  MVC._addFilter('checked2text', function(el, value) {
    // value will be the chosen values from {text, value}
    // data is overall list of {text, value}
    let src = el.getAttribute('data-source') || null;
    let text = [];

    if (src && value.length) {
      let data = this.$readModel(src) || [];
      let keys = data.map(function(x) {   // list of values
        return x.value;
      })

      for (let val of value) {
        let x = keys.indexOf(val);

        if (x > -1) text.push(data[x].text);
      }
    }

    return text.join(', ');
  });
*/