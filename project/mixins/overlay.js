import {MVC} from '/static/lib/client/core/mvc.js';

Object.assign(MVC, {
  $alert(msg) {
    bootbox.alert(msg);
  },

  async $confirm(msg) {
    return new Promise(function(resolve) {
      bootbox.confirm(msg, function(res) {
        resolve(res);
      })
    })
  },

  async $prompt(msg) {
    return new Promise(function(resolve) {
      bootbox.prompt(msg, function(res) {
        resolve(res);
      })
    })
  },

  async $reConfirm(btn, msg) {
    var newBtn = document.createElement('button');
    
    newBtn.classList.add('btn', 'btn-dark', 'mb-2');
    newBtn.innerHTML = msg;

    btn.style.display = 'none';
    btn.insertAdjacentElement('afterend', newBtn);

    const restore = function() {
      newBtn.remove();
      btn.style.display = 'initial';
    }

    return new Promise(function(resolve) {
      newBtn.addEventListener('click', function() {
        restore();
        resolve(true);
      }, {once: true});

      setTimeout(function() {
        restore();
        resolve(false);
      }, 2500)
    })
  },

  $overlay(state) {
    document.getElementById('overlay').style.display = (state) ? 'block' : 'none';
  },

  $buttonSpinner(el, state, span) {
    if (state) {
      let span = document.createElement('span');
      span.classList.add('spinner-border', 'spinner-border-sm'); 

      el.prepend(span);
      return span;
    }
    else {
      el.removeChild(span);
    }
  },

  $toast(hdr, body, delay) {
    /*
      <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <!--img src="..." class="rounded mr-2" alt="..."-->
          ${hdr}
          <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="toast-body">
          ${body}
        </div>
      </div>
    */

    let toaster = document.getElementById('toaster');

    // create Elements
    let toast = document.createElement('div');
    let toastHeader = document.createElement('div');
    let toastBody = document.createElement('div');
    let strong = document.createElement('strong');
    let btn = document.createElement('button');
    let span = document.createElement('span');

    // Add classes and attributes
    toast.classList.add('toast', 'mr-2');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('data-delay', delay);
    toast.style['min-width'] = '200px';
    
    toastHeader.classList.add('toast-header');
    toastHeader.style['background-color'] = 'rgba(0,0,0,.03)';

    toastBody.classList.add('toast-body');

    strong.classList.add('mr-auto');

    btn.classList.add('ml-2', 'mb-2', 'close');
    btn.setAttribute('data-dismiss', 'toast');
    btn.setAttribute('aria-label', 'Close');

    span.setAttribute('aria-hidden', 'true');

    // build toast element
    span.innerHTML = '&times;';
    btn.append(span);
    strong.innerHTML = hdr;
    toastHeader.append(strong, btn);
    toastBody.innerHTML = body;

    toast.append(toastHeader, toastBody);

    toaster.prepend(toast);

    // show, hide
    $(toast).toast('show');

    toast.addEventListener('hidden.bs.toast', function () {
      toast.remove();
    }, {once: true});
  }
});