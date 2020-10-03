import {MVC} from '/~static/lib/client/core/mvc.js';
import {Module} from '/~static/lib/client/core/module.js';

class Verror extends MVC {
  // Basic errors/clearing
  async clear(ev) {
    if (await this.canClear(ev)) {
      this.clearIt();
    }
  }

  clearIt() {
    this.clearErrors();
    this.setDefaults();   // in super
    this.clearList();     // in super

    this.model.existingEntry = false;

    Module.pager.clearQuery();
    window.scrollTo(0,0);
  }

  // Error rtns
  displayErrors(res) {
    if ('data' in res && 'errors' in res.data) {
      for (let key of Object.keys(res.data.errors)) {
        if (key == 'message') {
          this.setBadMessage(res.data.errors.message);  
        }
        else {
          if (!res.data.errors.message) this.model.badMessage = 'Please Correct any entry errors';

          for (let k in res.data.errors[key]) {
            this.model.errors[key][k] = res.data.errors[key][k];
          };  
        }
      }
    }
    
    this.model.errors._verify = res.data.errors._verify;
  }
  
  clearErrors() {
    for (let key of Object.keys(this.model.errors)) {
      if (this.model.errors[key] instanceof Object) {
        for (let key2 of Object.keys(this.model.errors[key])) {
          this.model.errors[key][key2] = '';
        }
      }
      else {
        this.model.errors[key] = '';
      }
    }

    this.model.badMessage = '';
  }

  setBadMessage(msg) {
    this.model.badMessage = msg;
  }
}

class ContactWithAddress extends Verror {
  async countryChanged(nv, ov) {
    if (!nv) return;

    this.model.regions = await this.address.getRegions(nv);
  }

  async postcodeChanged() {
    let self = this;
    this.model.errors.contact.postcode = '';

    let postcode = this.model.contact.postcode;
    if (!postcode) return;

    let country = this.model.contact.country;
    let formattedPostcode = this.address.formatPostcode(postcode, country);

    if (formattedPostcode == false) {
      this.model.errors.contact.postcode = 'Invalid Postal Code ' + postcode;
      this.model.contact.postcode = '';
      return;
    }

    this.model.contact.postcode = formattedPostcode;
    
    this.address.getACity(country, formattedPostcode, function(city, region) {
      if (city) self.model.contact.city = city;
      if (region) self.model.contact.region = region;
    });
  }

  async cityChanged() {
    let self = this;
    let city = this.model.contact.city;
    let region = this.model.contact.region;
    let country = this.model.contact.country;
    let postcode = this.model.contact.postcode;

    if (!city) return;

    if (!postcode) {
      this.address.getAPostcode(city, region, country, function(postcode, city, region) {
        if (postcode) self.model.contact.postcode = postcode;
        if (city) self.model.contact.city = city;
        if (region) self.model.contact.region = region;
      })
    }
    else {
      this.savePostalcode();
    }
  }

  savePostalcode() {
    // save postal code. 
    let city = this.model.contact.city;
    let region = this.model.contact.region;
    let country = this.model.contact.country;
    let postcode = this.model.contact.postcode;

    this.address.savePostcode(city, region, country, postcode);
  }
}

export {Verror, ContactWithAddress}