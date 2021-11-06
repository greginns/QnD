import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Actphoto extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'actphoto';
    this.model.itemType = 'Activity';
    this.model.actphoto = {};
    this.model.errors.actphoto = {};

    this.activityCode = '';
    this.url = '/items/v1/actphoto';
    this.cloudURL = 'https://res.cloudinary.com/roam4/image/upload';
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.activityCode = params.code;
    let res = await Module.tableStores.activity.getOne(params.code);
    this.activity = res;
    this.model.title = this.activity.name + ' Photos';
    this.cloudFolder = '/roam4/gm/A/' + this.activityCode;
    
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
      let actphoto = {};

      actphoto.activity = this.activityCode;
      actphoto.path = info.public_id;

      let res = await Module.tableStores.actphoto.insert(actphoto);

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
    let filters = {activity: this.activityCode}
    let res = await Module.data.actphoto.getMany({filters});

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

    let actphoto = {};

    actphoto.activity = this.activityCode;
    actphoto.path = path;

    let res = await Module.tableStores.actphoto.delete([actphoto.activity, actphoto.path]);    

    if (res.status == 200) {
      this.getPhotos();
    }
    else {
      Module.modal.alert(res.error.msg);
    }
  }
  
  goBack() {
    Module.pager.go(`/activity/${this.activityCode}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-actphoto');   // page html
let setup1 = new Actphoto('items-main-actphoto-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/activity/:code/photos'], title: 'Photos', sections: [section1]});

Module.pages.push(page1);