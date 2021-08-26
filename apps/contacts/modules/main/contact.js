import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Multisel} from '/~static/lib/client/widgets/multisel.js';
import {Notes} from '/~static/lib/client/widgets/notes.js';
import {ContactWithAddress} from '/~static/project/subclasses/simple-entry.js';
import {io} from '/~static/lib/client/core/io.js';

class Contact extends ContactWithAddress {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.contact = {};
    this.model.contact2 = {};
    this.model.contacts = [];
    this.model.titles = [];
    this.model.groups = [];
    this.model.egroups = [];
    this.model.tagcats = [];
    this.model.tags = [];
    this.model.countries = [];
    this.model.regions = [];
    this.model.postcodes = [];
    this.model.config = [];
    this.model.tag = '';
    this.model.dymo = '';
    this.model.dymos = [];
    this.model.associate = {desc: '', assoc: ''};
    this.model.assoc = {};
    this.model.assoc.list = [];
    this.model.assoc.name = '';
    this.model.assocs = [];
    this.model.assocsx = [];
    this.model.assocNew = false;

    this.model.existingEntry = false;
    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      contact2: {},
      associate: {},
      message: ''
    };

    this.$addWatched('contact.country', this.countryChanged.bind(this));
        
    this.contactOrig = {};
    this.defaults = {doe: window.dayjs(), notes: []};
    this.contactListEl = document.getElementById('contactList');
    
    this.notesInst = new Notes();

    this.errorMessages = {
      '1': 'Email Address is already in use',
      '2': 'Description is required',
      '3': 'Contact ID is required',
      '4': 'Already Associated',
    }
  }

  async ready() {
    let self = this;

    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    let getNoteCats = async function() {
      // get the note categories
      let topics = [];

      let rec = await Module.tableStores.config.getOne('notecats');
      let data = rec.data || [];

      for (let cat of data) {
        topics.push({desc: cat});
      }

      self.notesInst.setTopics(topics);
    };

    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.title.addView(new TableView({proxy: this.model.titles, filterFunc}));

      Module.tableStores.contact.addView(new TableView({proxy: this.model.contacts}));
      Module.tableStores.group.addView(new TableView({proxy: this.model.groups, filterFunc}));
      Module.tableStores.egroup.addView(new TableView({proxy: this.model.egroups, filterFunc}));
      Module.tableStores.tagcat.addView(new TableView({proxy: this.model.tagcats}));
      Module.tableStores.tag.addView(new TableView({proxy: this.model.tags}));
      Module.tableStores.country.addView(new TableView({proxy: this.model.countries}));

      this.defaults.contact = await Module.data.contact.getDefault();

      Module.tableStores.config.addWatchedRecord('notecats', getNoteCats);
      getNoteCats();

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    if ('id' in params) {
      // update 
      let res = await Module.tableStores.contact.getOne(params.id);
      
      if (Object.keys(res).length > 0) {
        this.setContact(res);
      }
      else {
        alert('Missing Contact');
        Module.pager.go('/contact/search');
      }
    }
    else {
      // create
      this.clearIt();
      this.setDefaults();
    }
  }

  outView() {
    return true;  
  }

  // IO
  async save(ev) {
    var contact = this.model.contact.toJSON();
    var diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.contactOrig, contact);
      
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

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.contact.update(contact.id, diffs) : await Module.tableStores.contact.insert(contact);

    if (res.status == 200) {
      utils.modals.toast('CONTACT', (this.model.existingEntry) ? contact.fullname + ' Updated' : 'Created', 2000);
   
      this.contactOrig = this.model.contact.toJSON();

      if (!this.model.existingEntry) this.clearIt();
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let contact = this.model.contact.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.contact.delete(contact.id);

    if (res.status == 200) {
      utils.modals.toast('CONTACT', 'Contact Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  // Screen handling
  async canClear(ev) {
    let contact = this.model.contact.toJSON();
    let orig = this.contactOrig;
    let diffs = utils.object.diff(orig, contact);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }
  
  async setContact(contact) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.contact = contact;
this.model.contact.notes = this.model.contact.notes || [];
    this.contactOrig = this.model.contact.toJSON();
  }
  
  setDefaults() {
    // set contact to default value
    for (let k in this.defaults.contact) {
      this.model.contact[k] = this.defaults.contact[k];
    }

    this.contactOrig = this.model.contact.toJSON();
  }

  // Account
  accessAccount() {
    this.accessModal = new bootstrap.Modal(this._section.querySelectorAll('div.contacts-contact-account')[0]);
    this.accessModal.show();
  }

  saveAccount() {
    this.accessModal.hide();
  }

  // Tags
  formatTag(entry) {
    let span = document.createElement('span');
    let textspan = document.createElement('span');
    let xspan = document.createElement('span');

    let dt = dayjs(entry.date);
    let dtx = dt.format(App.dateFormat);
    let tmx = dt.format(App.timeFormat);

    xspan.classList.add('chipx');
    xspan.innerHTML = '&times;';
    xspan.addEventListener('click', this.delTag.bind(this));

    textspan.innerText = this.getTagDesc(entry.tag);

    span.classList.add('chip');
    span.classList.add('mb-2');
    span.title = dtx + ' ' + tmx;
    span.setAttribute('data-tag', entry.tag);
    span.setAttribute('data-toggle', 'tooltip');
    span.setAttribute('data-placement', 'top');
    span.appendChild(textspan);
    span.appendChild(xspan);

    (new bootstrap.Tooltip(span)).enable();

    return span;
  }

  getTagDesc(tag) {
    let desc = '';
    let cat = '';

    for (let t=0; t<this.model.tags.length; t++) {
      if (this.model.tags[t].id == tag) {
        desc += this.model.tags[t].desc;
        cat = this.model.tags[t].cat;
        break;
      }
    }

    if (cat) {
      for (let c=0; c<this.model.tagcats.length; c++) {
        if (this.model.tagcats[c].id == cat) {
          desc += '[' + this.model.tagcats[c].desc + ']';
          break;
        }
      }
    }

    return desc;
  }

  reorgTags() {
    // organize for multisel display
     /*{ 
       label: 'Group 1', 
       items: [{text: 'Item 1.1', value: '11'}, {text: 'Item 1.2', value: '12'}],
     },
     {
       label: 'Group 2',
       items: [{text: 'Item 2.1', value: '21'}, {text: 'Item 2.2', value: '22'}]
     }
   ];*/    
    let groups = [];

    for (let c=0; c<this.model.tagcats.length; c++) {
      if (this.model.tagcats[c].active) {
        groups.push({id: this.model.tagcats[c].id, label: this.model.tagcats[c].desc, items:[]});
      }
    }

    for (let t=0; t<this.model.tags.length; t++) {
      if (this.model.tags[t].active) {
        for (let g of groups) {
          if (g.id == this.model.tags[t].cat) {
            g.items.push({text: this.model.tags[t].desc, value: this.model.tags[t].id});
          }
        }
      }
    }

    return groups;
  }

  async addTag() {
    let tags = this.model.contact.tags.toJSON() || [];
    let groups = this.reorgTags();

    let ms = new Multisel('Tags', groups, []);
    let res = await ms.select();
    ms = undefined;

    if (res.length > 0) {
      let dt = (new Date).toJSON();

      for (let tag of res) {
        tags.push({tag, 'date': dt});
      }
    
      this.model.contact.tags = tags;
    }
  }

  delTag(ev) {
    let tags = this.model.contact.tags.toJSON() || [];
    let span = ev.target.closest('span.tag')
    let tag = span.getAttribute('data-tag');

    (bootstrap.Tooltip.getInstance(span)).dispose();

    for (let x=0; x<tags.length; x++) {
      if (tags[x].tag == tag) {
        tags.splice(x,1);
        break;
      }
    }

    this.model.contact.tags = tags;
  }
  
  // Egroups
  formatEgroup(entry) {
    let span = document.createElement('span');
    let textspan = document.createElement('span');
    let xspan = document.createElement('span');

    let dt = dayjs(entry.date);
    let dtx = dt.format(App.dateFormat);
    let tmx = dt.format(App.timeFormat);

    xspan.classList.add('chipx');
    xspan.innerHTML = '&times;';
    xspan.addEventListener('click', this.delEgroup.bind(this));

    textspan.classList.add('tagtext');
    textspan.innerText = this.getEgroupDesc(entry.egroup);

    span.classList.add('tag');
    span.classList.add('mb-2');
    span.title = dtx + ' ' + tmx;
    span.setAttribute('data-egroup', entry.egroup);
    span.setAttribute('data-toggle', 'tooltip');
    span.setAttribute('data-placement', 'top');
    span.appendChild(textspan);
    span.appendChild(xspan);

    (new bootstrap.Tooltip(span)).enable();

    return span;
  }

  getEgroupDesc(egroup) {
    let desc = '';

    for (let t=0; t<this.model.egroups.length; t++) {
      if (this.model.egroups[t].id == egroup) {
        desc = this.model.egroups[t].desc;
        break;
      }
    }

    return desc;
  }

  async addEgroup() {
    /*
    { 
      label: 'Group 1', 
      items: [{text: 'Item 1.1', value: '11'}, {text: 'Item 1.2', value: '12'}],
    },
    */

    let egroups = this.model.contact.egroups || [];
    let items = [];
    let groups = [];

    for (let t=0; t<this.model.egroups.length; t++) {
      items.push({text: this.model.egroups[t].desc, value: this.model.egroups[t].id});
    }

    groups.push({label: 'All Groups', items});

    let ms = new Multisel('E-Groups', groups, []);
    let res = await ms.select();
    ms = undefined;

    if (res.length > 0) {
      let dt = (new Date).toJSON();

      for (let egrp of res) {
        egroups.push({'egroup': egrp, 'date': dt});
      }
    }
    
    this.model.contact.egroups = egroups;
  }

  delEgroup(ev) {
    let egroups = this.model.contact.egroups;
    let span = ev.target.closest('span.tag')
    let egrp = span.getAttribute('data-egroup');

    (bootstrap.Tooltip.getInstance(span)).dispose();

    for (let x=0; x<egroups.length; x++) {
      if (egroups[x].egroup == egrp) {
        egroups.splice(x,1);
        break;
      }
    }

    this.model.contact.egroups = egroups;
  }

  async notesEdit(ev) {
    let notes = this.model.contact.notes.toJSON() || [];
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let note = notes[idx];

    try {
      let ret = await this.notesInst.edit(note.topic, note.subject, note.operator, note.datetime, note.text);

      notes[idx] = {topic: ret.topic, subject: ret.subject, operator: note.operator, datetime: ret.datetime || (new Date()).toJSON(), text: ret.text};
      this.model.contact.notes = notes;
    }
    catch(e) {
    }
  }

  async notesAdd() {
    let notes = this.model.contact.notes.toJSON() || [];
    let topic = '';
    let subject = '';
    let operator = App.USER.code;
    let datetime = (new Date()).toJSON();
    let text = '';

    try {
      let ret = await this.notesInst.edit(topic, subject, operator, datetime, text);

      notes.push({topic: ret.topic, subject: ret.subject, operator, datetime: ret.datetime || (new Date()).toJSON(), text: ret.text});
      
      this.model.contact.notes = notes;
    }
    catch(e) {
    }
  }

  // Email test
  async emailTest() {
    let email = this.model.contact.email;
    let cid = this.model.contact.id;

    this.model.errors.contact.email = '';

    if (!email) return;

    let filters = {email};
    let res = await Module.data.contact.getMany({filters});
    let selfOwn = true;

    if (res.status == 200) {
      if (res.data.length > 0) {
        for (let cont of res.data) {
          if (cont.id != cid) {
            selfOwn = false;
            break;
          }
        }
      }
    }

    if (!selfOwn) {
      this.model.errors.contact.email = this.errorMessages['1'];
      this.$select('contact.email');
    }
  }

  // Actions
  dymo() {
    const printers = dymo.label.framework.getPrinters();
    const dymos = [];
    
    for (let i = 0; i < printers.length; i++) {
      let printer = printers[i];

      if (printer.printerType == "LabelWriterPrinter") {
        dymos.push({text: printer.name, value: printer.name});
        
        if (i == 0) {
          this.model.dymo = printer.name;
        }
      }
    }

    this.model.dymos = dymos;

    this.dymoModal = new bootstrap.Modal(this._section.querySelectorAll('div.contacts-contact-dymo')[0]);
    this.dymoModal.show();    
  }

  dymoPrint() {
    let contact = this.model.contact.toJSON();
    let printer = this.model.dymo;

    let xml = `<?xml version="1.0" encoding="utf-8"?>
    <DieCutLabel Version="8.0" Units="twips">
      <PaperOrientation>Landscape</PaperOrientation>
      <Id>Address</Id>
      <PaperName>30252 Address</PaperName>
      <DrawCommands>
        <RoundRectangle X="0" Y="0" Width="1581" Height="5040" Rx="270" Ry="270" />
      </DrawCommands>
      <ObjectInfo>
        <AddressObject>
          <Name>Address</Name>
          <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          <BackColor Alpha="0" Red="255" Green="255" Blue="255" />
          <LinkedObjectName></LinkedObjectName>
          <Rotation>Rotation0</Rotation>
          <IsMirrored>False</IsMirrored>
          <IsVariable>True</IsVariable>
          <HorizontalAlignment>Left</HorizontalAlignment>
          <VerticalAlignment>Middle</VerticalAlignment>
          <TextFitMode>ShrinkToFit</TextFitMode>
          <UseFullFontHeight>True</UseFullFontHeight>
          <Verticalized>False</Verticalized>
          <StyledText>
            <Element>
              <Attributes>
                <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />
                <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
              </Attributes>
            </Element>
          </StyledText>
          <ShowBarcodeFor9DigitZipOnly>False</ShowBarcodeFor9DigitZipOnly>
          <BarcodePosition>BelowAddress</BarcodePosition>
          <LineFonts>
            <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />
            <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />
            <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />
          </LineFonts>
        </AddressObject>
        <Bounds X="332" Y="150" Width="4455" Height="1260" />
      </ObjectInfo>
    </DieCutLabel>`;

    let label = dymo.label.framework.openLabelXml(xml);
      
    let data = `${contact.first} ${contact.last}\n${contact.address1}\n${contact.address2}\n${contact.city} ${contact.region.substr(3)}  ${contact.postcode}`;
      
    label.setAddressText(0, data);
		label.print(printer);

    this.dymoModal.hide();
  }

  // Associations
  associated() {
    let descs = [];
    let contact = this.model.contact.toJSON();

    if (contact.cat == 'F') {
      descs.push({text: 'Spouse', value: 'Spouse'});
      descs.push({text: 'Dependent', value: 'Dependent'});
      descs.push({text: 'Relative', value: 'Relative'});
    }
    else {
      descs.push({text: 'Co-worker', value: 'Co-worker'});
    }

    this.model.assoc.list = descs;

    this.assocInit();

    this.dymoModal = new bootstrap.Modal(this._section.querySelectorAll('div.contacts-contact-assoc')[0]);
    this.dymoModal.show();    
  }

  assocInit() {
    let contact = this.model.contact.toJSON();
    
    this.model.associate = {contact: contact.id, desc: '', assoc: ''};    
    this.model.assoc.name = '';
    this.model.errors.contact2 = {};
    this.model.errors.associate = {};

    this.assocGather();
  }

  async assocTest() {
    let assoc = this.model.associate.assoc;
    let res = await Module.tableStores.contact.getOne(assoc);

    if (Object.keys(res).length == 0) {  // no such contact
      this.model.associate.assoc = '';
      this.model.assoc.name = '';
      this.$focus('associate.assoc');
    }
    else {
      this.model.assoc.name = res.first + ' ' + res.last;
    }
  }

  async assocAdd() {
    // make sure assoc is not already there.
    let assoc = this.model.associate.toJSON();
    let assocs = this.model.assocs;

    if (!assoc.desc) {
      this.model.errors.associate.desc = this.errorMessages['2'];
      return;
    }

    if (!assoc.assoc) {
      this.model.errors.associate.assoc = this.errorMessages['3'];
      return;
    }

    for (let ass of assocs) {
      if (assoc.assoc == ass.assoc) {
        this.model.errors.associate.assoc = this.errorMessages['4'];
        return;
      }
    }

    let res = await Module.data.associate.insert(assoc);

    if (res.status == 200) {
      this.assocInit();
      return true;
    }
    else {
      this.model.errors.associate = res.data.errors.associate;
      return false;
    }    
  }

  async assocDel(ev) {
    let id = ev.args[0];

    let ret = await Module.modal.confirm('Are you sure you wish to remove this Association?');
    if (ret != 0) return;

    ret = await Module.tableStores.associate.delete(id);
    if (ret.status != 200) {
      await Module.modal.alert('Deletion failed');
      return;
    }

    this.assocInit();
  }

  assocJump(ev) {
    let id = ev.args[0];

    window.open('/contactpage/contact/update/' + id, '_assoc');
  }

  async assocGather() {
    let contact = this.model.contact.toJSON();
    let assocs = [], assocsx = [];

    let query1 = {
      Associate: {
        columns: ['id', 'contact', 'desc', 'assoc'],
        leftJoin: [
          {Contact: {columns: ['first', 'last'], name: 'contact'}}
        ],
        where: '"contacts_Associate"."contact"=$1'
      }
    };

    let query2 = {
      Associate: {
        columns: ['id', 'contact', 'desc', 'assoc'],
        leftJoin: [
          {Contact: {columns: ['first', 'last'], name: 'assoc'}}
        ],
        where: '"contacts_Associate"."assoc"=$1'
      }
    }
    
    let values = [contact.id];

    // My associates
    let res = await Module.data.contact.query({query: query1, values})    

    if (res.status == 200 && res.data.length > 0) {
      for (let ass of res.data) {
        assocs.push(ass);
      }
    }

    this.model.assocs = assocs;

    // Who has me as an associate?
    res = await Module.data.contact.query({query: query2, values})    

    if (res.status == 200 && res.data.length > 0) {
      for (let ass of res.data) {
        assocsx.push(ass);
      }
    }

    this.model.assocsx = assocsx;    
  }

  assocNew() {
    const empties = ['first', 'last', 'email', 'phone', 'occupation'];
    const nullies = ['dob', 'doe'];
    const falsies = ['acct', 'massmail', 'massemail', 'masssms', 'allowbill', 'iscell'];
    let contact2 = this.model.contact.toJSON();
    
    delete contact2._pk;
    delete contact2.id;

    contact2.gender = 'U';

    empties.forEach(function(fld) {
      contact2[fld] = '';
    });

    nullies.forEach(function(fld) {
      contact2[fld] = null;
    });

    falsies.forEach(function(fld) {
      contact2[fld] = false;
    })

    this.model.contact2 = contact2;
    this.model.errors.contact2 = {};
    this.model.assocNew = true;
  }

  async assocAdd2(ev) {
    let contact2 = this.model.contact2.toJSON();
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // Save Contact
    let res = await Module.tableStores.contact.insert(contact2);

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);

    if (res.status == 200) {
      this.assocBail();
    }
    else {
      for (let k in res.data.errors.contact) {
        this.model.errors.contact2[k] = res.data.errors.contact[k];
      }

      return;
    }

    // Save Assoc
    this.model.associate.assoc = res.data._pk;
    this.assocAdd();
  }

  assocBail() {
    this.model.assocNew = false;
    this.model.errors.contact2 = {};
  }

  async assocEmailTest() {
    let email = this.model.contact2.email;
    this.model.errors.contact2.email = '';

    if (!email) return;

    let filters = {email};
    let res = await Module.data.contact.getMany({filters});

    if (res.status == 200) {
      if (res.data.length > 0) {
        this.model.errors.contact2.email = this.errorMessages['1'];
        this.$focus('contact2.email');
      }
    }
  }

  // GOTOs
  goto(ev) {
    let to = ev.target.getAttribute('to');
    let y = utils.findYPosition(this._section.getElementsByClassName(to)[0]);

    window.scrollTo({left: 0, top: y-60, behavior: 'smooth'});
  }

  // ghost methods
  clearList() {}

  test() {
    io.test()
  }

  testx() {
    const first = 'Greggie';

    let func = function(rec) {
      return rec.first == first;
    }

    let query = {
      Contact: {
        columns: ['*'],
        where: '"contacts_Contact"."first" = $1'
      }
    }

    let values = [first];
    let conditions = {'/contacts/contact': func};

    //new TableQuery({accessor: Module.data.contact, query, values, conditions});
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-contact-create');   // page html
let mvc1 = new Contact('contacts-contact-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/contact/create', title: 'Contact Create', sections: [section1]});

let el2 = document.getElementById('contacts-contact-update');   // page html
let mvc2 = new Contact('contacts-contact-update-section');
let section2 = new Section({mvc: mvc2});
let page2 = new Page({el: el2, path: '/contact/update/:id', title: 'Contact Update', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);