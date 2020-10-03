class Editor {
  constructor(editorEl) {
    this.editorEl = editorEl;
    
    this.Delta = Quill.import('delta');

    this.quill = new Quill(this.editorEl, {
      theme: 'snow',
      toolbar: true,
    });

    this.changes = new this.Delta();

    this.quill.on('text-change', function(delta) {
      this.changes = this.changes.compose(delta);
    }.bind(this));
  }

  setText(text) {
    return this.quill.setText(text);
  }

  getText() {
    return this.quill.getText();
  }

  anyChanges() {
    return this.changes.length() > 0;
  }
}

export {Editor}