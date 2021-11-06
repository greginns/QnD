import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Lodgphoto extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'lodgphoto';
    this.model.itemType = 'lodging';
    this.model.lodgphoto = {};
    this.model.errors.lodgphoto = {};

    this.lodgingCode = '';
    this.url = '/items/v1/lodgphoto';
    this.cloudURL = 'https://res.cloudinary.com/roam4/image/upload';
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.lodgingCode = params.code;
    let res = await Module.tableStores.lodging.getOne(params.code);
    this.lodging = res;
    this.model.title = this.lodging.name + ' Photos';
    this.cloudFolder = '/roam4/gm/L/' + this.lodgingCode;
    
    let uploadObj = {
      cloudName: 'roam4', 
      uploadPreset: 'zno8fjsj',
      folder: this.cloudFolder
    };

    this.uploader = cloudinary.createUploadWidget(uploadObj, this.saveImage.bind(this));

    this.getPhotos();
  }

  outView() {
    return true;  
  }

  async saveImage(error, result) {
    if (error) {
      Module.modal.alert('Image NOT uploaded.  Please try again. ' + error);
      return;
    }

    if (result && result.event == 'success') {
      let info = result.info;
      let lodgphoto = {};

      lodgphoto.lodging = this.lodgingCode;
      lodgphoto.path = info.public_id;

      let res = await Module.tableStores.lodgphoto.insert(lodgphoto);

      if (res.status == 200) {
        utils.modals.toast('Photo Uploaded', 2000);

        this.getPhotos();
      }
      else {
        Module.modal.alert('Image NOT uploaded.  Please try again. ' + res.error.message);
      }
    }
  }

  async getPhotos() {
    let filters = {lodging: this.lodgingCode}
    let res = await Module.data.lodgphoto.getMany({filters});

    if (res.status == 200) {
      this.model.photos = res.data;

      setTimeout(function() {
        this.showPhotos();
      }.bind(this), 500)
    }
  }

  showPhotos() {
    let photos = this.model.photos;

    for (let image of Array.from(this._section.querySelectorAll('div.photo'))) {
      const { clientWidth, clientHeight } = image;
      const idx = image.getAttribute('data-index');
      const path = photos[idx].path;
      const pixelRatio = 1;
  
      let width = 100 * Math.round(clientWidth * pixelRatio / 100);
      let height = 100 * Math.round(clientHeight * pixelRatio / 100);
      let opts = [];
      opts.push('w_' + width);
      opts.push('h_' + height);
      opts.push('c_fill');
      opts.push('f_auto');
      opts.push('g_auto');

      let url = `${this.cloudURL}/${opts.join(',')}/${path}`;

      image.style.backgroundImage = `url('${url}')`;
    };  
  }

  upload() {
    this.uploader.open();
  }

  async delete(obj) {
    if (await Module.modal.confirm('Are you sure you want to delete this photo?') != 0) return;

    let idx = obj.args[0];
    let photos = this.model.photos;
    let path = photos[idx].path;

    let lodgphoto = {};

    lodgphoto.lodging = this.lodgingCode;
    lodgphoto.path = path;

    let res = await Module.tableStores.lodgphoto.delete([lodgphoto.lodging, lodgphoto.path]);    

    if (res.status == 200) {
      this.getPhotos();
    }
    else {
      Module.modal.alert(res.error.msg);
    }
  }
  
  goBack() {
    Module.pager.go(`/lodging/${this.lodgingCode}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-lodgphoto');   // page html
let setup1 = new Lodgphoto('items-main-lodgphoto-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/lodging/:code/photos'], title: 'Photos', sections: [section1]});

Module.pages.push(page1);