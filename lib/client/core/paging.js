import {Module} from '/~static/lib/client/core/module.js';

class Router {
  constructor(root) {
    root = Router._stripSlashes(root || '');

    this.paths = {};
    this.oldPath = '';
    this.currentPath = '';
    this.root = (root) ? root + '/' : '';
  }

  add(page) {
    let path = this.root + Router._stripSlashes(page.path);

    this.paths[path] = {page};
  }

  remove(page) {
    let path = this.root + Router._stripSlashes(page.path);

    delete this.paths[path];
  }

  start(dflt) {
    this.oldPath = '';
    this.currentPath = Router._stripSlashes(location.pathname + location.search);
    this._linkListener();
    this._locationListener();

    if (!this.currentPath || !this._getPageInfoByPath(this.currentPath) && dflt) {
      this.currentPath = this.root + dflt;
      this._pushState('/' + this.currentPath);
    }

    this._inView();
  }

  go(path, query) {
    if (this._outView() === false) return;

    this.currentPath = this.root + Router._stripSlashes(path);

    if (query) {
      this.currentPath = this.currentPath + '?' + query; //new URLSearchParams(query).toString();
    }

    this._pushState('/' + this.currentPath);
    this._inView();
  }

  goBack(path, query) {
    // same as go, but without calling inView
    if (this._outView() === false) return;

    this.currentPath = this.root + Router._stripSlashes(path);

    if (query) {
      this.currentPath = this.currentPath + '?' + query; //new URLSearchParams(query).toString();
    }
    this._pushState('/' + this.currentPath);
  }

  replace(path, query) {
    if (this._outView() === false) return;

    this.currentPath = this.root + Router._stripSlashes(path);

    if (query) {
      this.currentPath = this.currentPath + '?' + query; //new URLSearchParams(query).toString();
    }
    this._replaceState('/' + this.currentPath);
    this._inView();
  }

  back() {
    if (this._outView() === false) return;

    history.back();
  }

  replaceQuery(q) {
    this._replaceState('?' + q);
  }

  clearQuery() {
    this._replaceState(window.location.pathname);  // reset to path w/o query.
  }

  _inView() {
    // entering path
    var rec = this._getPageInfoByPath(this.currentPath);

    if (rec) {
      if (window.ga && window.ga.loaded) {
        ga('set', 'page', this.currentPath);
        ga('send', 'pageview');
      }

      rec.page.inView(rec.params);
      if (rec.page.title) window.document.title = rec.page.title;
    }
    else {
      // any 404 page?
      if ('404' in this.paths) { //} && this.paths['404'].in) {
        console.log('invoking 404 ' + this.currentPath)
        this.paths['404'].page.inView(this.paths['404'].params);
      }
      else {
        console.log('Ooopsie, ' + this.currentPath + ' page not found');
        console.log(this.paths)
      }
    }

    this.oldPath = this.currentPath;
  }

  _outView() {
    // leaving path
    var rec = this._getPageInfoByPath(this.oldPath);
    
    return rec.page.outView(rec.params);
  }

  _linkListener() {
    for (let el of document.getElementsByTagName('A')) {
      if (el.hasAttribute('mvc-nothandle')) {
        // ignore these
        continue;
      }

      if (el.hasAttribute('mvc-handle') || (!(el.getAttribute('mvc-href')) && el.href.indexOf('javascript') == -1 && el.href.indexOf('#') == -1)) {
        el.addEventListener('click', this._linkHandler.bind(this));
      }
    }
  }

  _locationListener() {
    window.addEventListener('popstate', function(ev) {
      if (this._outView() === false) return;

      this.currentPath = Router._stripSlashes(location.pathname);
      this._inView();
    }.bind(this));
  }

  _linkHandler(ev) {
    ev.preventDefault();

    if (this._outView() === false) return;

    var href = ev.target.href;

    if (href) {
      var pl = href.indexOf('/',8); // get past the protocol

      this.currentPath = this.root + Router._stripSlashes(href.substr(pl));

      this._inView();
      this._pushState('/' + this.currentPath);
    }
  }

  _pushState(path) {
    history.pushState({}, '', path);
  }

  _replaceState(path) {
    history.replaceState({}, '', path);
  }

  _getPageInfoByPath(path) {
    // compare path to stored paths
    // contact/5/view vs
    // contact/search
    // contact/:id/edit
    // contact/:id/view
    var x = path.split('?');

    var parts = x[0].split('/');
    var sch = (x.length > 1) ? x[1].split('&') : [];
    var paths = Object.keys(this.paths);

    for (var i=0,ppath,pparts,good; i<paths.length; i++) {
      ppath = paths[i];
      pparts = ppath.split('/');
      good = true;
      var params = {};

      if (parts.length == pparts.length || (parts.length == pparts.length -1 && pparts[pparts.length-1] == '')) {  // ['items', 'v31'] vs ['items', 'v31', ''] when url is /items/v31/
        for (var j=0; j<parts.length; j++) {
          if (parts[j] == pparts[j] || pparts[j].substr(0,1) == ':') {
            if (pparts[j].substr(0,1) == ':') {
              params[pparts[j].substr(1)] = parts[j];
            }
          }
          else {
            good = false;
            break;
          }
        }

        if (good) {
          sch.forEach(function(xy) {
            var z = xy.split('=');
            params[z[0]] = z[1];
          });

          this.paths[ppath].params = params;

          return this.paths[ppath];
        }
      }
    }

    return false;
  }
};

Router._stripSlashes = function(path) {
  return path.toString().replace(/\/$/, '').replace(/^\//, '');
};

/* ============================================= PAGES/PAGE/SECTIONS ======================================= */
class Pages {
  constructor({root='', pages=[]} = {}) {
    this.root = root;
    this.pages = pages;
  }

  async ready(path) {
    // Init All Page Sections
    var inits = [];

    for (let page of this.pages) {
      inits = inits.concat(page.ready());
    }

    try {
      await Promise.all(inits);
    }
    catch(e) {
      throw e;
    }
    
    this.initRouter(path);
  }

  initRouter(path) {
    // start router
    // setup all pages with router
    this.router = new Router(this.root);
    Module.pager = this.router;

    for (let page of this.pages) {
      this.router.add(page);
    }

    this.start(path);
  }

  start(path) {
    this.router.start(path);
  }
}

class Page {
  constructor({el='', path='', title='', sections=[]} = {}) {
    this.el = el;
    this.path = path;
    this.title = title;
    this.sections = sections;
    
    this.el.style.display = 'none';
    this.el.classList.remove('show');
  }

  ready() {
    var inits = [];

    for (let section of this.sections) {
      inits.push(section.ready());
    }

    return inits;
  }

  inView(params) {
    setTimeout(function() {
      this.el.style.display = 'block';
    }.bind(this), 250);

    this.el.classList.add('show');

    for (let section of this.sections) {
      section.inView(params);
    }
  }

  outView(params) {
    var success = true;

    for (let section of this.sections) {
      success == success && section.outView(params);
    }

    if (success) {
      setTimeout(function() {
        this.el.style.display = 'none';
      }.bind(this), 250);
      
      this.el.classList.remove('show');
    }
  }
}

class Section {
  constructor({mvc=null} = {}) {
    this.mvc = mvc;
  }

  ready() {
    return this.mvc.ready();
  }

  inView(params) {
    this.mvc.inView(params);
  }

  outView(params) {
    return this.mvc.outView(params);
  }
}

export {Router, Pages, Page, Section};