class TreeManager {
  constructor(el, data, ordering, opts) {
    /* data: []
      {id: '', name: '', desc: '', code: '', type: '', parent: '', active: true, new: false, changed: false, beingEdited: false},        
    */
    this.el = el;
    this.data = data;
    this.ordering = ordering;
    this.opts = opts || {};

    this.dataTemplate = {id: '', name: 'Untitled', desc: '', code: '', type: '', parent: '', folder: false, active: true, new: false, changed: false, beingEdited: false};
    this.idMap = {};
    this.newID = 0;
    this.idPrefix = 'tempID';
    this.deletedIDs = [];
    this.dragQueenLily;
    
    this.validateOpts();
    this.standardizeData();
    this.makeTree();
    this.displayTree();
    
    if (this.opts.reorder) {
      this.el.addEventListener('drop', this.drop.bind(this));
      this.el.addEventListener('dragover', this.allowDrop.bind(this));
    }
    
    this.el.classList.add('dropzone');  // this is still needed so that foreign elements can compare in allowDrop

    this.init();
  }
  
  init() {
  }
  
  validateOpts() {
    if (! ('newFolders' in this.opts)) this.opts.newFolders = true;
    if (! ('newFiles' in this.opts)) this.opts.newFiles = true;
    if (! ('reorder' in this.opts)) this.opts.reorder = true;
    if (! ('needActive' in this.opts)) this.opts.needActive = false;
    if (! ('editFiles' in this.opts)) this.opts.editFiles = true;
    if (! ('externalEdit' in this.opts)) this.opts.externalEdit = false;
  }
  
  save() {
    for (let tag of this.data) {
      if (tag.new) {
        console.log('NEW', tag)
      }
      else if (tag.changed) {
        console.log('CHG', tag)
      }
    }
    
    for (let id of this.deletedIDs) {
      console.log('DEL', id)
    }
    
    let ordering = this.buildOrdering();
    
    console.log(JSON.stringify(ordering))
  }

  createNewFolder(ev) {
    let parentLI = ev.target.closest('li');
    let parentSpan = ev.target.closest('span.li-contents');
    let parentID = parentSpan.getAttribute('node');
    let child = {name: 'New Category', parent: parentID, folder: true, active: true, new: true, changed: false, children: [], type: this.opts.passThru.functype};
    let firstUL = parentLI.querySelector('ul');

    this.insertEntry(child, parentID);

    let ul = this.createUL();
    let li = this.createLI();
    let span = this.createFolderSpan(child);
    
    ul.classList.add('d-none');
    li.appendChild(span);
    
    li.append(ul)
    firstUL.prepend(li);

    this.folderOpenDo(parentSpan);
    this.folderOpenDo(span);
    
    let textWrapper= span.querySelector('span.text-wrapper');
    this.entryEdit(textWrapper);
  }
  
  createNewFile(ev) {
    let parentLI = ev.target.closest('li');
    let parentSpan = ev.target.closest('span.li-contents');
    let parentNode = parentSpan.getAttribute('node');
    let child = {name: 'New File', parent: parentNode, active: true, folder: false, new: true, changed: false, beingEdited: true, type: this.opts.passThru.functype};
    let firstUL = parentLI.querySelector('ul');

    this.insertEntry(child, parentNode);  // sets node value

    let li = this.createLI();
    let span = this.createFileSpan(child);
    li.appendChild(span);
    
    this.folderOpenDo(parentSpan);
    
    firstUL.prepend(li);
    
    if (this.opts.externalEdit) {
      this.externalCreateFile(child);
    }
    else {
      let textWrapper = span.querySelector('span.text-wrapper');
      this.entryEdit(textWrapper);          
    }
  }
          
  entryEditEvent(ev) {
    let wrapper = ev.target;

    this.entryEdit(wrapper);
  }
  
  async entryEdit(wrapper) {
    let self = this;
    let text = wrapper.innerText;
    let container = wrapper.closest('span.li-contents');
    let contLI = wrapper.closest('li');
    let node = container.getAttribute('node');
    let entry = this.getEntry(node);
    
    if (!node) return;
    
    let removeFunc = function() {
      container.classList.remove('d-none');  
      inputSpan.remove();
    }
    
    let saveFunc = async function() {
      let inp = inputContainer.querySelector('input.input-text');
      
      entry.name = inp.value;
      entry.changed = true;
      
      if (self.opts.needActive) {
        let checkbox = inputContainer.querySelector('input.input-checkbox');
        entry.active = checkbox.checked;
        
        if (checkbox.checked) wrapper.classList.remove('text-danger');
        else wrapper.classList.add('text-danger');
      } 

      if (entry.id.substring(0, self.idPrefix.length) == self.idPrefix) {
        let oldID = entry.id;
        let idx = self.idMap[oldID];  
        let ret = await self.create(entry);
        let newID = ret.id;
    
        self.data[idx].id = newID;
          
        delete self.idMap[oldID];
        self.idMap[newID] = idx;
        
        let span = self.el.querySelector('span[node="' + oldID + '"]');
        span.setAttribute('node', newID);
      }
      else {
        await self.update(entry);
      }
      
      if (entry.new) wrapper.classList.add('text-success');
        
      wrapper.innerText = inp.value;
      removeFunc();
    }
    
    let rejectFunc = function(ev) {
      if ('children' in entry && entry.children.length > 0) {
        alert('Cannot delete a node with children')  ;
        return;
      }
      
      if (entry.new) {
        //contLI.remove();
        self.deleteEntry(node);
      }

      removeFunc();
    }
              
    let trashFunc = function(ev) {
      if ('children' in entry && entry.children.length > 0) {
        alert('Cannot delete a node with children')  ;
      }
                  
      //contLI.remove();
      self.deleteEntry(node);

      removeFunc();
    }
    
    let inputSpan = this.makeEditor(entry, saveFunc, rejectFunc, trashFunc);
    let inputText = inputSpan.querySelector('input.input-text');
    let inputContainer = inputSpan.closest('span.input-container');
    
    inputText.addEventListener('keydown', function(ev) {
      if (ev.keyCode == 13) saveFunc();
      if (ev.keyCode == 27) rejectFunc();
    })
    
    container.classList.add('d-none');
    
    container.after(inputSpan);          
  }

  makeEditor(entry, acceptFunc, rejectFunc, trashFunc) {
    let span = this.createSpan();
    let checkboxSpan = this.createSpan();
    let checkSpan = this.createSpan();
    let rejectSpan = this.createSpan();
    let trashSpan = this.createSpan();          
    let checkIcon = this.createI();
    let rejectIcon = this.createI();
    let trashIcon = this.createI();
    let input = this.createInput(('children' in entry));
    
    input.value = entry.name;
    
    setTimeout(function() {
      input.select();  
    }, 10)
    
    if (this.opts.needActive) {
      let checkbox = this.createCheckbox();
      checkbox.checked = entry.active;
      checkbox.classList.add('ps-3', 'input-checkbox');
    }
    
    input.classList.add('input-text');
    span.classList.add('input-container');
    
    checkSpan.classList.add('ps-3', 'text-success');
    rejectSpan.classList.add('ps-3', 'text-warning');
    trashSpan.classList.add('ps-3', 'text-danger');
    
    checkIcon.classList.add("fas", "fa-check");
    rejectIcon.classList.add("fas", "fa-times");
    trashIcon.classList.add("far", "fa-trash-alt");
              
    if (this.opts.needActive) checkboxSpan.appendChild(checkbox);
    checkSpan.appendChild(checkIcon);
    rejectSpan.appendChild(rejectIcon);
    trashSpan.appendChild(trashIcon);
    
    span.appendChild(input);
    if (this.opts.needActive) span.appendChild(checkboxSpan);
    span.appendChild(checkSpan);
    span.appendChild(rejectSpan);
    span.appendChild(trashSpan);
    
    checkSpan.addEventListener('click', acceptFunc);
    rejectSpan.addEventListener('click', rejectFunc);
    trashSpan.addEventListener('click', trashFunc);
    
    return span;
  }        
  
/* === DRAG and DROP == */        
  startDrag(ev) {
    this.dragQueenLily = ev.target.closest('li');
    
    this.dragQueenLily.setAttribute('draggable', true);
  } 
  
  abortDrag() {
    this.dragQueenLily.removeAttribute('draggable');
  } 
  
  drop(ev) {
    ev.preventDefault();

    this.abortDrag();

    let targetLI = ev.target.closest('li');
    let targetUL = ev.target.closest('ul');

    let targetNode = targetLI.querySelector('span.li-contents').getAttribute('node');
    let dragNode = this.dragQueenLily.querySelector('span.li-contents').getAttribute('node');

    let targetEl = this.data[this.idMap[targetNode]];
    let dragEl = this.data[this.idMap[dragNode]];
    
    targetUL.insertBefore(this.dragQueenLily, targetLI);
    
    if (targetEl.parent != dragEl.parent) this.changeParentEntry(dragNode, targetEl.parent);
    
    this.dragQueenLily = null;
  }
  
  allowDrop(ev) {
    // don't allow on title line
    if (ev.target.tagName == 'LI' && ev.target.querySelector('span.li-contents') && ev.target.querySelector('span.li-contents').getAttribute('node') == '') return;
    
    // must be in same tree - this only works if all drop zones are derived from same tree class
    if (!this.dragQueenLily) return;
    
    let dragRoot = this.dragQueenLily.closest('div.dropzone');
    let targetRoot = ev.target.closest('div.dropzone');

    if (dragRoot != targetRoot) return;

    ev.preventDefault();          
  }
  
/* === SHOW / HIDE FOLDER CONTENTS === */        
  showULs(el) {
    for (let child of el.children) {
      if (child.tagName == 'UL') child.classList.remove('d-none');
    }
  }
  
  hideULs(el) {
    for (let child of el.children) {
      if (child.tagName == 'UL') child.classList.add('d-none');
    }
  }
  
  folderOpen(ev) {
    let contents = ev.target.closest('span.li-contents');
    
    this.folderOpenDo(contents);
  }
  
  folderOpenDo(contents) {
    let close = contents.querySelector('span.icon-folder-close');
    let open = contents.querySelector('span.icon-folder-open');
    let drag = contents.querySelector('span.drag-icon');
    
    close.classList.add('d-none');
    open.classList.remove('d-none');
    if (drag) drag.classList.add('d-none');
    
    this.showULs(contents.closest('li'));
  }
  
  folderClose(ev) {
    let contents = ev.target.closest('span.li-contents');
    
    this.folderCloseDo(contents);
  }
  
  folderCloseDo(contents) {
    let close = contents.querySelector('span.icon-folder-close');
    let open = contents.querySelector('span.icon-folder-open');
    let drag = contents.querySelector('span.drag-icon');
    
    open.classList.add('d-none');
    close.classList.remove('d-none');
    if (drag) drag.classList.remove('d-none');
    
    this.hideULs(contents.closest('li'))          
  }
  
  
/* === BUILD FILE and FOLDER ENTRIES === */        
  createFileSpan(child) {
    let span = this.createSpan();
    let textSpan = this.createSpan();
    let text = this.createText(child.name);
    
    span.setAttribute('node', child.id);
    span.classList.add('li-contents');
    
    textSpan.classList.add('text-wrapper');
    if (child.new) textSpan.classList.add('text-success');
    if (!child.active) textSpan.classList.add('text-danger');
    
    textSpan.appendChild(text);
    span.appendChild(textSpan);
    
    if (this.opts.editFiles) {
      textSpan.addEventListener('click', this.entryEditEvent.bind(this));
    }
    else if (this.opts.externalEdit) {
      //let editicon = this.createEditIcon();
      
      //editicon.classList.add('ps-3', 'vis', 'vis-hover');
      
      //editicon.addEventListener('click', this.externalEditFile.bind(this));
      //span.appendChild(editicon);
      textSpan.addEventListener('click', this.externalEditFile.bind(this));
    }
    
    if (this.opts.reorder) {
      /*
      let dragicon = this.createDragIcon();
      
      dragicon.classList.add('ps-3', 'vis', 'vis-hover');
      span.appendChild(dragicon);
      
      dragicon.addEventListener('mousedown', this.startDrag.bind(this));
      dragicon.addEventListener('mouseup', this.abortDrag.bind(this));
      */
      
      textSpan.addEventListener('mousedown', this.startDrag.bind(this));
      textSpan.addEventListener('mouseup', this.abortDrag.bind(this));
    }
    
    span.addEventListener('mouseover', this.showTools.bind(this));
    span.addEventListener('mouseout', this.hideTools.bind(this));
      
    return span;
  }
  
  createFolderSpan(child) {
    let span = this.createSpan();
    let ficon = this.createFolderIcon();
    let textSpan = this.createSpan();
    let text = this.createText(child.name);
              
    span.setAttribute('node', child.id);   
    span.classList.add('li-contents');
              
    textSpan.classList.add('text-wrapper');
    if (child.new) textSpan.classList.add('text-success');
    if (!child.active) textSpan.classList.add('text-danger');

    textSpan.appendChild(text);
    span.appendChild(ficon);
    span.appendChild(textSpan);
    
    textSpan.addEventListener('click', this.entryEditEvent.bind(this));
    
    if (this.opts.newFolders) {
      let fpicon = this.createFolderPlusIcon();
      
      span.appendChild(fpicon);
      fpicon.classList.add('ps-3', 'vis', 'vis-hover');
      
      fpicon.addEventListener('click', this.createNewFolder.bind(this));  
    }
    
    if (this.opts.newFiles) {
      let flpicon = this.createFilePlusIcon();
      
      span.appendChild(flpicon);
      flpicon.classList.add('ps-3', 'vis', 'vis-hover');
      
      flpicon.addEventListener('click', this.createNewFile.bind(this));
    }
    
    if (child.id && this.opts.reorder) {  // no drag icon on the main folder
      /*
      let dragicon = this.createDragIcon();
      
      span.appendChild(dragicon);  
      dragicon.classList.add('ps-3', 'vis', 'vis-hover');
      
      dragicon.addEventListener('mousedown', this.startDrag.bind(this));
      dragicon.addEventListener('mouseup', this.abortDrag.bind(this));
      */
      
      textSpan.addEventListener('mousedown', this.startDrag.bind(this));
      textSpan.addEventListener('mouseup', this.abortDrag.bind(this));
    }
    
    span.addEventListener('mouseover', this.showTools.bind(this));
    span.addEventListener('mouseout', this.hideTools.bind(this));
    
    return span;
  }
  
  showTools(ev) {
    let el = ev.target.closest('span.li-contents');
    
    for (let child of el.querySelectorAll('.vis')) {
      child.classList.remove('vis-hover');
    }
  }
  
  hideTools(ev) {
    let el = ev.target.closest('span.li-contents');
    
    for (let child of el.querySelectorAll('.vis')) {
      child.classList.add('vis-hover');
    }
  }
  
  externalCreateFile(entry) {
    let self = this;
    let record = this.dataTemplate;
    let opts = this.opts.passThru;
    
    record.id = entry.id;
    record.name = entry.name;
    
    this.opts.externalEditor.create(record, opts, function(state, newRecord) {
      if (state == 'close') entry.beingEdited = false;
      else if (state == 'delete') self.deleteEntry(entry.id);
      else self.updateEntry(entry, newRecord);
    });
  }
  
  externalEditFile(ev) {
    let self = this;
    let el = ev.target.closest('span.li-contents');
    let node = el.getAttribute('node');
    let record = {};
    let opts = this.opts.passThru;

    for (let entry of this.data) {
      if (entry.id == node) {
        if (entry.beingEdited) break;
        
        entry.beingEdited = true;
        
        let record = entry;

        this.opts.externalEditor.update(record, opts, function(state, newRecord) {
          if (state == 'close') entry.beingEdited = false;
          else if (state == 'delete') self.deleteEntry(entry.id);
          else self.updateEntry(entry, newRecord);
        });
        
        break;
      }
    }          
  }

/* === CREATE ICONS == */
  createFolderIcon() {
    let span = this.createSpan();
    let spanClose = this.createSpan();
    let spanOpen = this.createSpan();
    let iclose = this.createI();
    let iopen = this.createI();
    
    span.classList.add('pe-2');
    spanClose.classList.add('text-warning', 'icon-folder-close');
    spanOpen.classList.add('text-warning', 'icon-folder-open', 'd-none');
    iclose.classList.add('fas', 'fa-folder');
    iopen.classList.add('fas', 'fa-folder-open');

    spanClose.appendChild(iclose);
    spanOpen.appendChild(iopen);
    span.appendChild(spanClose);
    span.appendChild(spanOpen);
    
    spanClose.addEventListener('click', this.folderOpen.bind(this));
    spanOpen.addEventListener('click', this.folderClose.bind(this));
    
    return span;
  }
  
  createFolderPlusIcon() {
    let span = this.createSpan();
    let i = this.createI();
    
    span.classList.add('text-info');
    i.classList.add('fas', 'fa-folder-plus');
    
    span.appendChild(i);
    
    return span;
  }        
  
  createFilePlusIcon() {
    let span = this.createSpan();
    let i = this.createI();
    
    span.classList.add('text-info');
    i.classList.add('fas', 'fa-file-plus');
    
    span.appendChild(i);
    
    return span;
  }        
  
  createDragIcon() {
    let span = this.createSpan();
    let i = this.createI();
    
    span.classList.add('drag-icon');
    i.classList.add('fas', 'fa-arrows-v');
    
    span.style.cursor = 'move';
    
    span.appendChild(i);
    
    return span;
  }        
  
  createEditIcon() {
    let span = this.createSpan();
    let i = this.createI();
    
    span.classList.add('edit-icon');
    i.classList.add('fa-light', 'fa-pencil');
    
    span.appendChild(i);
    
    return span;
  }
  
/* === CREATE ELEMENTS == */        
  createUL() {
    return document.createElement('ul');
  }
  
  createLI() {
    return document.createElement('li');
  }
  
  createText(text) {
    return document.createTextNode(text);
  }
          
  createI() {
    return document.createElement('i');
  }
  
  createSpan() {
    return document.createElement('span');
  }
  
  createInput(folder) {
    let inp = document.createElement('input');
    
    inp.classList.add('tree-input');
    if (folder) inp.classList.add('tree-input-folder');
    inp.placeholder = 'Description';
    
    return inp;
  }
  
  createCheckbox() {
    let inp = document.createElement('input');
    inp.type = 'checkbox';
                        
    return inp;
  }
  
// ACCCESS DATA
  getEntry(id) {
    // return back an entry
    return this.data[this.idMap[id]];
  }
  
  insertEntry(child, pid) {
    child.id = this.createNewID();

    // create myself          
    this.data.push(child);
    this.idMap[child.id] = this.data.length-1;
    
    // update my parent
    let parentEl = this.getEntry(pid);

    ('children' in parentEl) ? parentEl.children.push(child) : parentEl.children = [child];
  }
  
  async updateEntry(child, newRecord) {
    // update file with new name and id
    // get permanent id and renumber
    let oldID = String(child.id);
    let newID;

    child.name = newRecord.name;
    child.desc = newRecord.desc;
    child.code = newRecord.code;

    if (oldID.substring(0, this.idPrefix.length) == this.idPrefix) {
      // temp file
      let idx = this.idMap[oldID];  
      let ret = await this.create(child);

      newID = ret.id;

      child.id = newID;
      
      delete this.idMap[oldID];
      this.idMap[newID] = idx;
    }
    else {
      newID = oldID;
      await this.update(child);
    }
    
    // name on screen
    let span = this.el.querySelector('span[node="' + oldID + '"]');
    let span2 = span.querySelector('span.text-wrapper');
    span2.innerText = child.name;

    if (newID != oldID) span.setAttribute('node', newID);
  }
  
  async deleteEntry(id) {
    let obj = this.getEntry(id);
    let idx = this.idMap[id];
    
    // remove myself
    await this.delete(id);

    delete this.idMap[id];
    this.data.splice(idx,1);

    // update my parent          
    let parentEl = this.data[this.idMap[obj.parent]];
    let cidx = parentEl.children.indexOf(obj);
    
    parentEl.children.splice(cidx,1);
    
    // remove from page
    let span = this.el.querySelector('span.li-contents[node="' + id + '"]');
    let li = span.closest('li');
    
    li.remove();
    
    // record deletion
    if (id.indexOf(this.idPrefix) == -1) this.deletedIDs.push(id);
  }
  
  async changeParentEntry(id, stepParentId) {
    let el = this.getEntry(id);
    let idx = this.idMap[id];
    
    // say goodbye to my bio parent          
    let bioParentEl = this.data[this.idMap[el.parent]];
    let cidx = bioParentEl.children.indexOf(el);            
    
    bioParentEl.children.splice(cidx,1);

    // say hello to my step parent 
    let stepParentEl = this.data[this.idMap[stepParentId]];
    ('children' in stepParentEl) ? stepParentEl.children.push(el) : stepParentEl.children = [el];
    
    el.parent = stepParentId;

    // save to file
    if (el.id.indexOf(this.idPrefix) == -1) {
      // new
      await this.create(el);
    }
    else {
      await this.update(el);
    }    
  }

// MISC        
  buildOrdering() {
    let ordering = {};
    
    const recurse = function(ul) {
      let arr = [];

      for (let li of ul.childNodes) {
        let span = li.querySelector('span.li-contents');
        let cul = li.querySelector('ul');
        let node = span.getAttribute('node');
        
        if (cul) {
          ordering[node] = recurse(cul);
        }

        arr.push(node);
      }
      
      return arr;
    }
    
    recurse(this.el.querySelector('ul'));
    
    return ordering;
  }

  createNewID() {
    return this.idPrefix + String(++this.newID);
  }
  
  sortByName() {
    // alpha sort, folders at top
    const recurse = function(rows) {
      for (let row of rows) {
        if ('children' in row) {
          recurse(row.children);
          
          row.children.sort(function(a,b) {
            let sorta = a.name, sortb = b.name;
            
            if (! ('children' in a)) sorta = 'ZZZZZZZZ' + sorta;
            if (! ('children' in b)) sortb = 'ZZZZZZZZ' + sortb;
            
            return (sorta < sortb) ? -1 : (sorta > sortb) ? 1 : 0;
          })
        }             
      }
    }
    
    recurse(this.tree);
  }
  
  standardizeData() {
    // {id: '', name: '', desc: '', code: '', type: '', parent: '', folder: false, active: true, new: false, changed: false, beingEdited: false},                  
    for (let data of this.data) {
      if (!('active' in data)) data.active = true;
      if (!('new' in data)) data.new = false;
      if (!('changed' in data)) data.changed = false;
      if (!('beingEdited' in data)) data.beingEdited = false;            
    }
  }
  
  makeTree() {
    let root;
    
    for (let i=0; i<this.data.length; i++) {
      this.idMap[this.data[i].id] = i;
    }

    for (let i=0, parentEl; i<this.data.length; i++) {
      let el = this.data[i];

      if (el.parent === null) {
        root = el;
        continue;
      }

      parentEl = this.data[this.idMap[el.parent]];

      if (! ('children' in parentEl)) {
        parentEl.children = [];
      }
      
      let idx = -1;
      
      if (this.ordering && parentEl.id in this.ordering) {
        idx = this.ordering[parentEl.id].indexOf(el.id);
      }
      
      (idx != -1) ? parentEl.children[idx] = el : parentEl.children.push(el);
    }

    this.tree = [root];
    if (!this.ordering) this.sortByName();
  }
  
  displayTree() {
    const self = this;
    
    const buildUL = function(children) {
      let ul = self.createUL();
      ul.classList.add('d-none');

      for (let child of children) {
        let li = self.createLI();

        if (child.folder) {
          li.appendChild(self.createFolderSpan(child)); 
          li.appendChild(buildUL(child.children || []));
        }
        else {
          li.appendChild(self.createFileSpan(child));  
        }              
        
        ul.appendChild(li);
      }

      return ul;
    }
    
    this.el.appendChild(buildUL(this.tree));
    
    this.showULs(this.el);
    
    let contents = this.el.querySelector('span.li-contents');

    this.folderOpenDo(contents);
  }
}

export {TreeManager};