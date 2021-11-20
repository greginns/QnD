const root = process.cwd();

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

class ModelService {
  constructor({model} = {}) {
    this.model = model;
    this.pks = ('getPKs' in model) ? model.getPKs() : [];
  }

  async getMany({database='', pgschema = '', user = {}, rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await this.model.where({database, pgschema, user, where, values, cols, limit, offset, orderby}) 
      : await this.model.select({database, pgschema, user, rec, cols, limit, offset, orderby});
  }
  
  async getOne({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    // Get specific row
    let pks = this.pks.map(function(x) {
      return rec[x];
    });

    return await this.model.selectOne({database, pgschema, user, pks});
  }

  async getDefaults() {
    // Get specific row
    let tm = new TravelMessage();

    tm.data = this.model.getColumnDefaults();
    tm.type = 'json';

    return tm;
  }

  async getColumns() {
    let tm = new TravelMessage();

    tm.data = this.model.getColumnsForPrint();
    tm.type = 'json';

    return tm;
  }

  async create({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    // Insert row
    let tobj = new this.model(rec);
    let tm = await tobj.insertOne({database, pgschema, user});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  }
  
  async update({database = '', pgschema = '', user = {}, pks = {}, rec= {}} = {}) {
    // Update row
    for (let k in pks) {
      rec[k] = pks[k];
    }

    let tobj = new this.model(rec);
    let tm = await tobj.updateOne({database, pgschema, user});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  }
  
  async delete({database = '', pgschema = '', user = {}, pks = {}} = {}) {
    // Delete row
    let tobj = new this.model(pks);
    let tm = await tobj.deleteOne({database, pgschema, user});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
}

module.exports = {
  ModelService
}