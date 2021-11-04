import {MVC} from '/~static/lib/client/core/mvc.js';
import {Cloudinary} from 'https://cdn.jsdelivr.net/npm/@cloudinary/url-gen@1.1.0/index.min.js'; ////"@cloudinary/url-gen";

class C extends MVC {
  constructor(el) {
    super(el);
  }

  createModel() {
    this.model.lodging = {
      unitized: false,
      bookbeds: true
    }

    console.log(Cloudinary)
  }
}

new C('test');