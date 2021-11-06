//import {MVC} from '/~static/lib/client/core/mvc.js';
//import {Cloudinary, Transformation, Actions} from 'https://cdn.jsdelivr.net/npm/@cloudinary/url-gen@1.1.0/index.min.js'; ////"@cloudinary/url-gen";
import {Cloudinary} from 'https://cdn.jsdelivr.net/npm/@cloudinary/url-gen@1.1.0/instance/Cloudinary.min.js';
import * as Actions from 'https://cdn.jsdelivr.net/npm/@cloudinary/url-gen@1.1.0/actions.min.js';
//import * as ResizeFillAction from 'https://cdn.jsdelivr.net/npm/@cloudinary/url-gen@1.1.0/actions/resize/ResizeFillAction.js';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'roam4'
  }
}); 

//https://res.cloudinary.com/roam4/image/upload/v1636036424/samples/people/bicycle.jpg

/*
const myImage = cld.image('samples/people/bicycle');
const fred = document.getElementById('fred');

myImage
.resize(Actions.Resize.thumbnail().width(150).height(150).gravity('face'))
.format('png'); 

fred.src = myImage.toURL();
*/

var myUploader = cloudinary.createUploadWidget(
  {
    cloudName: 'roam4', 
    uploadPreset: 'zno8fjsj',
    folder: '/roam4/gm'
  }, 
  function(error, result) { 
console.log(error, result)    
    if (!error && result && result.event === "success") { 
      console.log('Done! Here is the image info: ', result.info); 
    }
  }
)

document.getElementById('uploadBtn').addEventListener('click', myUploader.open);

window.onload = function() {
  const pixelRatio = 1; //window.devicePixelRatio || 1.0;

  for (let image of Array.from(document.querySelectorAll('[data-bg]'))) {
    const { clientWidth, clientHeight } = image;
    const myImage = cld.image('/roam4/gm/peakyblinders');

    let width = 100 * Math.round(clientWidth * pixelRatio / 100);
    let height = 100 * Math.round(clientHeight * pixelRatio / 100)

    myImage
    .resize(Actions.Resize.fill().width(width).height(height).gravity('auto'))
    //.resize(ResizeFillAction.x(width).y(height).gravity('auto'))
    .format('auto');

    image.style.backgroundImage = `url('${myImage.toURL()}')`;
  };  
}