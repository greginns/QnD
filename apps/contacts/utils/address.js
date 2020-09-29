import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {TableView} from '/~static/lib/client/core/data.js';

class Address extends MVC{
  constructor() {
    const template = document.getElementById('contacts-address-modal');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 
  }

  createModel() {
    this.countries = [];
    this.callback;
    this.chosenPostcode;
    this.model.postcodes = [];

    this.cityModal = new bootstrap.Modal(this._section.getElementsByClassName('contact-address-modal-city')[0]);
    this.pcModal = new bootstrap.Modal(this._section.getElementsByClassName('contact-address-modal-postcode')[0]);

    document.addEventListener('tablestoreready', async function() {
      // fill up on data
      Module.tableStores.country.addView(new TableView({proxy: this.countries}));
    }.bind(this), {once: true})    
  }

  async getACity(country, postcode, cb) {
    // called by external routine
    this.callback = cb;
    this.model.postcodes = await this.getPostcodes({country, postcode});
    this.handleCities();
  }

  async getAPostcode(city, region, country, cb) {
    // called by external routine
    this.callback = cb;
    this.model.postcodes = await this.getPostcodes({city, region, country});
    this.handlePostalCodes();
  }
  
  handleCities() {
    let pcs = this.model.postcodes;
    this.chosenPostcode = {};

    if (pcs.length == 0) {
      this.callback('', '');
      return;
    }

    if (pcs.length == 1) {
      let city = pcs[0].city;
      let region = pcs[0].region;

      this.chosenPostcode = pcs[0];

      this.callback(city, region);
      return;
    }

    // more than one city, pop open modal
    this.cityModalOpen();
  }

  handlePostalCodes() {
    let pcs = this.model.postcodes;
    this.chosenPostcode = {};

    if (pcs.length == 0) {
      this.callback('', '', '');
      return;
    }

    if (pcs.length == 1) {
      let postcode = pcs[0].postcode;
      let city = pcs[0].city;
      let region = pcs[0].region;
      this.chosenPostcode = pcs[0];

      this.callback(postcode, city, region);
      return;
    }

    // more than one PC, pop open modal
    this.postcodeModalOpen();
  }

  citySelected(ev) {
    let pcs = this.model.postcodes;
    let idx = ev.target.closest('li').getAttribute('data-index');

    let city = pcs[idx].city;
    let region = pcs[idx].region;
    this.chosenPostcode = pcs[idx];

    this.cityModalClose();

    this.callback(city, region);
  }

  cityNotSelected() {
    this.cityModalClose();
  }

  cityModalOpen() {
    this.cityModal.show();
  }

  cityModalClose() {
    this.cityModal.hide();
  }

  postcodeSelected(ev) {
    let pcs = this.model.postcodes;
    let idx = ev.target.closest('li').getAttribute('data-index');

    let postcode = pcs[idx].postcode;
    let city = pcs[idx].city;
    let region = pcs[idx].region;
    this.chosenPostcode = pcs[idx];

    this.postcodeModalClose();

    this.callback(postcode, city, region);    
  }

  postcodeNotSelected() {
    this.postcodeModalClose();
  }

  postcodeModalOpen() {
    this.pcModal.show();
  }

  postcodeModalClose() {
    this.pcModal.hide();
  }

  async getRegions(country) {
    let res = await Module.data.region.getMany({filters: {country}});

    return (res.status == 200) ? res.data : [];
  }

  async getPostcodes(filters) {
    let res = await Module.data.postcode.getMany({filters});

    return (res.status == 200) ? res.data : [];
  }

  formatPostcode(pc, country) {
    // CC - country code.
    // A - alpha
    // N - numeric
    // rest is literal
    let self = this;
    let formats;

    function getFormats() {
      // get, clean and sort formats by length, longest first
      let formats = [];

      for (let ctry of self.countries) {
        if (ctry.id == country) {
          formats = ctry.format.split(',');
          break;
        }
      }

      for (let f=0; f<formats.length; f++) {
        formats[f] = formats[f].trim();
      }

      formats.sort(function(a,b) {
        return (a.length < b.length) ? 1 : (a.length > b.length) ? -1 : 0;
      })

      return formats;
    };

    function cleanupPostcode(npc) {
      return npc.toUpperCase().replace(/\s/g, "");
    }

    function formatIt(pc, formats) {
      const alphas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const max = 15;
      let antiloop = 0;

      for (let format of formats) {
        let pcw = pc, pcf = '', pidx=-1, fidx=-1;

        if (format.substr(0,2) == 'CC' && pcw.substr(0,2) != country) pcw = country + pcw;

        while(true) {
          fidx++;
          pidx++;
          antiloop++;
          if (antiloop > max) break;

          if (pidx >= pcw.length) break;

          let p = pcw.substr(pidx,1);
          let f = format.substr(fidx,1) || '';

          switch (f) {
            case 'A':
              // valid alpha?
              if (alphas.indexOf(p) == -1) continue;  // invalid character, skip it
              pcf += p;
              break;

            case 'N':
              // valid numeric?
              if (numbers.indexOf(p) == -1) continue;  // invalid character, skip it
              pcf += p;
              break;

            case 'C':
              // country character?
              pcf += p;
              break;
              
            default:
              // literal
              pcf += f;
              pidx--;
              break;
          }
        }

        if (pcf.length == format.length) {
          return pcf;
        }
      }

      return false;
    }
    
    formats = getFormats();
    if (!formats[0]) return pc;

    pc = cleanupPostcode(pc);
    pc = formatIt(pc, formats);

    return pc;
  }

  savePostcode(city, region, country, postcode) {
    let rec = {};

    if ('id' in this.chosenPostcode) {
      this.chosenPostcode.city = this.model.contact.city;

      rec = this.chosenPostcode;
    }
    else {
      rec.country = country;
      rec.city = city;
      rec.region = region;
      rec.postcode = postcode;
    }

    if ('id' in rec) {
      Module.data.postcode.update(rec.id, rec);
    }
    else {
      Module.data.postcode.insert(rec);
    }
  }
}

export {Address}