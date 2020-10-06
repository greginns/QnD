class Editor {
  constructor(editorEl, toolbarEl) {
    //let Delta = Quill.import('delta');
    this.originalText = '';
    
    this.quill = new Quill(editorEl, {
      modules: {
        toolbar: toolbarEl
      },
      theme: 'snow'
    });

    //this.changes = new Delta();

    //this.quill.on('text-change', function(delta) {
    //  this.changes = this.changes.compose(delta);
    //}.bind(this));
  }

  setText(text) {
    this.originalText = text;

    return this.quill.setText(text);
  }

  getText() {
    return this.quill.getText();
  }

  anyChanges() {
    return this.getText().trim() != this.originalText.trim();    
    //return this.changes.length() > 0;
  }
}

export {Editor}