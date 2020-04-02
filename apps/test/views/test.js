// main
var pages = new QnD.classes.Pages({root: '/test', pages: QnD.pages});

(async function() {
  try {
    await pages.init('bindings');
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
})();