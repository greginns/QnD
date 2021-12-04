let addDropdown;

export default addDropdown = function(MVC) {
  MVC._addBinding('dropdown', function(el) {
    /* Something isn't working right with dropdowns and the ESC key
       hideIt is a work-around
    */
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
        //dd.hide();
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

  MVC._addBinding('dropper', function(el) {
    //This sort of replicates what the Dropdown does natively.  
    //But this homegrown version recognizes when the focus is lost off the dropdown
    let inps = ['INPUT', 'SELECT', 'TEXTAREA'];
    let func = el.getAttribute(MVC.prefix + '-dropper'); // supplied function that sets input value
    let tid =  el.getAttribute('data-template');
    let toggle = el.querySelector('[data-toggle]');
    let drop = el.querySelector('.R4dropper-content');
    let dropup = el.classList.contains('R4dropup');
    let isInput = inps.indexOf(toggle.tagName) > -1;
    let self = this;

    const escape = function(ev) {
      if (ev.code == 'Escape') {
        action(ev);
      }
    };
    
    const lostFocus = function(ev) {
      // off of the dropdown?
      if (ev.relatedTarget) {
        let target = ev.relatedTarget;
        if (target == drop) return;

        if (target.closest('div.R4dropper-content') != drop) {
          action(ev);
          return;
        }
      }
    };

    const external = function(ev) {
      // click somewhere.  If not on dropdown, then close
      if (!ev.target.closest('div.R4dropper-content')) {
        action(ev);
      }
    };

    const open = function() {
      if (isInput) toggle.disabled = true;
      
      drop.classList.add('show');
      if (dropup) drop.style.bottom = toggle.offsetHeight + 'px';

      document.addEventListener('click', external);
      document.addEventListener('keydown', escape);
    };

    const close = function() {
      if (isInput) toggle.disabled = false;   

      drop.classList.remove('show');

      document.removeEventListener('click', external);
      document.removeEventListener('keydown', escape);
      self[func]();
    };

    const focus = function() {
      setTimeout(function() {
        let focused = false;

        for (let el of Array.from(drop.querySelectorAll('*'))) {
          if (inps.indexOf(el.tagName) > -1) {
            el.focus();
            focused = true;
            break;
          }
        };

        if (!focused) drop.focus();
      }, 1);
    };

    const action = function(ev) {
      if (drop.classList.contains('show')) {
        // dropdown is showing, close
        close();
      }
      else {
        // dropdown not showing, open
        open();
        focus();
      }

      ev.stopPropagation();      
    }

    /* Initialize */
    // copy template html into dropdown
    let template = document.getElementById(tid);
    let clone = template.content.firstElementChild.cloneNode(true);

    drop.appendChild(clone);
    this._elementInit(drop);

    let diss = drop.querySelector('.dismiss');
    if (diss) {
      diss.addEventListener('click', action);
    }

    // permanent event handlers
    toggle.addEventListener('click', action);
    drop.addEventListener('focusout', lostFocus);
    toggle.addEventListener('focus', action);

    setTimeout(function() {
      self[func]();
    }, 1);
  });
};
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

    const lostFocus = function(ev) {
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
    drop.addEventListener('focusout', lostFocus);
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