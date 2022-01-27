class Edittable {
  constructor(table, mvc, saveFunc, deleteFunc) {
    /*
      requires: 2 tbodys.  One with 'each' data, one with the edit fields
      edit: hide edited row
            move the editing row to the spot occupied by the edited row.
            unhide editing row
      add:  set editing row data
            unhide editing row
      save: calls the save func, if true returned then success = call cancel
      cancel: just reverses everything from edit/add
              edit: move the editing row back, unhide edited row
              add:  hide editing row
    */

    this._table = (table.substr(0,1) == '#') ? document.getElementById(table.substr(1)) : table;
    this._mvc = mvc;
    this._saveFunc = saveFunc;
    this._deleteFunc = deleteFunc;
    this.editing = false;
    this._addorEdit = '';

    this._setup();
  }

  _setup() {
    // The 2 tbodys
    this._sourceTbody = this._table.querySelector('tbody.edittable-source');
    this._editorTbody = this._table.querySelector('tbody.edittable-editor');

    // the row to act as input 
    this._editorInputRow = this._editorTbody.querySelector('tr');

    // the source data model array name
    this._modelArray = this._sourceTbody.getAttribute('mvc-each');

    // the edited data model object name
    this._modelDestObject = this._editorTbody.getAttribute('data-edittable-dest');
  }

  add(obj) {
    // enter a new entry
    if (this.editing) return;

    // set edit data object to passed in data
    this._mvc.model[this._modelDestObject] = obj;

    // show editor Tbody
    this._editorInputRow.removeAttribute('data-edittable-index');
    this._editorTbody.style.display = '';

    this._addorEdit = 'add';

    this.editData();
  }

  edit(obj) {
    // edit an existing entry
    if (this.editing) return;

    // get row clicked on
    this._editorSourceRow = obj.target.closest('tr');

    // get index from that row
    let idx = obj.args[0] || this._editorSourceRow.getAttribute('data-edittable-index'); 

    // set edit data object to row's data
    let data = this._mvc.$readModel(this._modelArray);
    
    this._mvc.model[this._modelDestObject] = data[idx];

    // hide clicked-on row
    this._editorSourceRow.style.display= 'none';

    // put editing row in clicked-on row's place
    this._editorInputRow.setAttribute('data-edittable-index', idx);
    this._editorSourceRow.insertAdjacentElement('afterend', this._editorInputRow);

    this._addorEdit = 'edit';

    this.editData();
  }

  editData() {
    // save Orig version of data
    this._mvc[this._modelDestObject + 'Orig'] = this._mvc.model[this._modelDestObject].toJSON();
    
    this.editing = true;
  }

  async save() {
    let idx = this._editorInputRow.getAttribute('data-edittable-index');
    let fn = this._saveFunc.bind(this._mvc);

    if (await fn(idx)) this.cancel();
  }

  async delete(obj) {
    // delete an existing entry
    if (this.editing) return;

    // get row clicked on
    this._editorSourceRow = obj.target.closest('tr');

    // get index from that row
    let idx = this._editorSourceRow.getAttribute('data-edittable-index');     

    let fn = this._deleteFunc.bind(this._mvc);

    await fn(idx);
  }

  cancel() {
    if (this._addorEdit == 'edit') {
      this._editorSourceRow.style.display = '';
      this._editorTbody.appendChild(this._editorInputRow)
    }
    else {
      this._editorTbody.style.display = 'none';
    }

    this.editing = false;
  }
}

export {Edittable};