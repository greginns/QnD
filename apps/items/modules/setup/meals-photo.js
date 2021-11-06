import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Mealphoto extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'mealphoto';
    this.model.itemType = 'Meal';
    this.model.mealphoto = {};
    this.model.errors.mealphoto = {};

    this.mealCode = '';
    this.url = '/items/v1/mealphoto';
    this.cloudURL = 'https://res.cloudinary.com/roam4/image/upload';
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.mealCode = params.code;
    let res = await Module.tableStores.meals.getOne(params.code);
    this.meal = res;
    this.model.title = this.meal.name + ' Photos';
    this.cloudFolder = '/roam4/gm/M/' + this.mealCode;
    
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
      let mealphoto = {};

      mealphoto.meal = this.mealCode;
      mealphoto.path = info.public_id;

      let res = await Module.tableStores.mealphoto.insert(mealphoto);

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
    let filters = {meal: this.mealCode}
    let res = await Module.data.mealphoto.getMany({filters});

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

    let mealphoto = {};

    mealphoto.meal = this.mealCode;
    mealphoto.path = path;

    let res = await Module.tableStores.mealphoto.delete([mealphoto.meal, mealphoto.path]);    

    if (res.status == 200) {
      this.getPhotos();
    }
    else {
      Module.modal.alert(res.error.msg);
    }
  }
  
  goBack() {
    Module.pager.go(`/meals/${this.mealCode}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-mealphoto');   // page html
let setup1 = new Mealphoto('items-main-mealphoto-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/meals/:code/photos'], title: 'Photos', sections: [section1]});

Module.pages.push(page1);