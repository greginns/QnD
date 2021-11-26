import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class title extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.titles = [];
    this.model.groups = [];
    this.model.egroups = [];
    this.model.tags = [];
    this.model.tagcats = [];
    this.model.notecats = [];

    this.model.navbarTitle = 'Contact Setup';
    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let titles = new TableView({proxy: this.model.titles});
      let groups = new TableView({proxy: this.model.groups});
      let egroups = new TableView({proxy: this.model.egroups});
      let tags = new TableView({proxy: this.model.tags});
      let tagcats = new TableView({proxy: this.model.tagcats});

      Module.tableStores.title.addView(titles);
      Module.tableStores.group.addView(groups);
      Module.tableStores.egroup.addView(egroups);
      Module.tableStores.tag.addView(tags);
      Module.tableStores.tagcat.addView(tagcats);

      let rec = await Module.tableStores.config.getOne('notecats');
      this.model.notecats = rec.data || [];

      resolve();
    }.bind(this));
  }
  
  inView(params) {
  }

  outView() {
    return true;  
  }

  goto(ev) {
    let href = ev.target.closest('div').getAttribute('href');
  
    Module.pager.go(href);
  }
};

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-setup');   // page html
let setup1 = new title('contacts-setup-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/setup', title: 'Contact Setup', sections: [section1]});

Module.pages.push(page1);