class CodeEditor {
  /*
    Limitation: Folder must have one file before other files can be dropped into folder
  */
  constructor(tabEl, contentEl) {
    this.tabEl = tabEl;
    this.contentEl = contentEl;
    
    ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/');
    
    this.editors = [];          
  } 
  
  createNewEditor(record, opts, cb) {
    let id = this.createTab(record.name || 'Untitled');
    let pane = this.createEditorPane();
    let contentArea = this.createTabContent(pane, id);
    let editor = this.createEditor(contentArea);
    
    this.setEditorContent(editor, record, contentArea);
    this.setEditorEvents(contentArea, id);
    this.setOpts(contentArea, opts);
    
    this.editors.push({id, contentArea, editor, cb, record});
  }
  
  createTab(text) {
    // de-activate all active tabs
    for (let btn of Array.from(this.tabEl.querySelectorAll('button.active'))) {
      btn.classList.remove('active');
    }
    
    // make new active tab
    let id = 'editorTab-' + (new Date).valueOf();
    let tab = document.createElement('li');
    let btn = document.createElement('button');
    
    tab.classList.add('nav-item');
    tab.setAttribute('data-tab-id', id)
    
    btn.classList.add('nav-link', 'active');
    btn.setAttribute('data-bs-toggle', 'tab');
    btn.setAttribute('data-bs-target', '#' + id);
    btn.innerText = text;
    
    tab.appendChild(btn);
    
    this.tabEl.appendChild(tab);
    
    return id;
  }
  
  updateTab(id, text) {
    let [tab, content, editorData] = this.getEditorData(id);
    let btn = tab.querySelector('button.nav-link');
    let span1 = editorData.contentArea.querySelector('span.editor-file-name');
    
    btn.innerText = text;         
    span1.innerText = text.replaceAll(' ', '_');
  }
  
  createEditorPane() {
    let template = document.getElementById('editorTemplate');
    let pane = template.content.cloneNode(true);
    
    return pane;
  }
  
  createTabContent(pane, id) {
    // de-activate all active content
    for (let div of Array.from(this.contentEl.querySelectorAll('div.active'))) {
      div.classList.remove('active');
    }
      
    // create new active content        
    let content = document.createElement('div');
    
    content.classList.add('tab-pane', 'active');
    content.setAttribute('id', id);
    
    content.appendChild(pane);
    
    return this.contentEl.appendChild(content);
  }
  
  createEditor(contentArea) {
    let el = contentArea.querySelector('div.ace-editor');
    let id = 'editorArea-' + (new Date).valueOf();
    el.setAttribute('id', id);
    
    let editor = ace.edit(id);
    editor.setTheme("ace/theme/textmate");
    editor.session.setMode("ace/mode/javascript");
    editor.setOptions({
      fontSize: "16px"
    });                    
    
    return editor;
  }
  
  setEditorContent(editor, record, contentArea) {
    editor.setValue(record.code);
    
    let func = contentArea.querySelector('input.editor-field-func');
    let desc = contentArea.querySelector('textarea.editor-field-desc');

    func.value = record.name;
    desc.value = record.desc;
  }
  
  setEditorEvents(contentArea, id) {
    let btn1 = contentArea.querySelector('button.btn-success');
    let btn2 = contentArea.querySelector('button.btn-warning');
    let btn3 = contentArea.querySelector('button.btn-danger');
    
    btn1.addEventListener('click', this.saveFile.bind(this, id));
    btn2.addEventListener('click', this.close.bind(this, id));
    btn3.addEventListener('click', this.delete.bind(this, id));
  }
  
  setOpts(contentArea, opts) {
    if ('functype' in opts) {
      // function paramters description
      for (let el of contentArea.querySelectorAll('code.functype')) {
        el.style.display = 'none';
      }
      
      contentArea.querySelector('code.functype' + opts.functype).style.display = 'block';
      
      // function parameters
      let func = contentArea.querySelector('input.editor-field-func');
      let name = func.value.replaceAll(' ', '_');
      let params;
      
      switch(opts.functype) {
        case 'CE':
          params = '(evObj)';
          break;
          
        case 'SR':
          params = '(dataObj)';
          break;
          
        case 'UT':
          params = '(obj)';
          break;
      }
      
      let span1 = contentArea.querySelector('span.editor-file-name');
      let span2 = contentArea.querySelector('span.editor-file-params');
      
      span1.innerText = name;
      span2.innerText = params;
    }
  }
  
  saveFile(id) {
    let [tab, content, editorData] = this.getEditorData(id);
    let input = editorData.contentArea.querySelectorAll('input.editor-field-func')[0];
    let textarea = editorData.contentArea.querySelectorAll('textarea.editor-field-desc')[0];
    let cb = editorData.cb;
    let record = editorData.record;
    
    record.name = input.value;
    record.desc = textarea.value;
    record.code = editorData.editor.getValue();

    this.updateTab(id, record.name);
    
    cb('save', record);
  }
  
  close(id) {
    let [tab, content, editorData] = this.getEditorData(id);
    let cb = editorData.cb;
    let newCode = editorData.editor.getValue();
    let oldCode = editorData.record.code;
    
    if (oldCode != newCode) {
      if (!confirm('Do you wish to abandon your changes?')) return;
    }
    
    this.tabClose(id);
    
    cb('close');
  }
  
  delete(id) {
    let [tab, content, editorData] = this.getEditorData(id);
    let cb = editorData.cb;
    
    if (!confirm('Are you sure?')) return;
    
    this.tabClose(id);
    
    cb('delete');          
  }
  
  tabClose(id) {
    let [tab, content, editorData] = this.getEditorData(id);
    
    tab.remove();
    content.remove();
    
    let tabs = this.tabEl.querySelectorAll('li');

    if (tabs.length > 0) {
      let cid = tabs[0].getAttribute('data-tab-id');
      tabs[0].querySelector('button.nav-link').classList.add('active');
      document.getElementById(cid).classList.add('active');
    }
  }
  
  getEditorData(id) {
    let tab = this.tabEl.querySelector('li[data-tab-id=' + id + ']');
    let content = document.getElementById(id);
    let editor;
    
    for (let entry of this.editors) {
      if (entry.id == id) {
        editor = entry;
        break;
      }
    }
    
    return [tab, content, editor];
  }
}

export {CodeEditor};