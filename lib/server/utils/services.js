const root = process.cwd();

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

class ModelService {
  constructor({model}) {
    this.model = model;
  }

  async getMany({database='', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await this.model.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await this.model.select({database, pgschema, rec, cols, limit, offset, orderby});
  }
  
  async getOne({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = this.model.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await this.model.selectOne({database, pgschema, pks: [rec.id] });
  }
    
  async create({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new this.model(rec);
    let tm = await tobj.insertOne({database, pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  }
  
  async update({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new this.model(rec);
    let tm = await tobj.updateOne({database, pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  }
  
  async delete({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new this.model({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
}
/*
class modelService {
  constructor({model=''} = {}) {
    this.model = model;

    return this.build();
  }

  build() {
    const services = {
      getMany: async function({database='', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
        // Get one or more rows
        return (where) 
          ? await this.model.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
          : await this.model.select({database, pgschema, rec, cols, limit, offset, orderby});
      }.bind(this),
      
      getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
        // Get specific row
        if ('id' in rec && rec.id == '_default') {
          let tm = new TravelMessage();
    
          tm.data = this.model.getColumnDefaults();
          tm.type = 'json';
    
          return tm;
        }
        
        return await this.model.selectOne({database, pgschema, pks: [rec.id] });
      }.bind(this),
        
      create: async function({database = '', pgschema = '', rec = {}} = {}) {
        // Insert row
        let tobj = new this.model(rec);
        let tm = await tobj.insertOne({database, pgschema});
    
        //if (tm.isGood()) {
        //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
        //}
    
        return tm;    
      }.bind(this),
      
      update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
        // Update row
        rec.id = id;
    
        let tobj = new this.model(rec);
        let tm = await tobj.updateOne({database, pgschema});
    
        //if (tm.isGood()) {
        //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
        //}
        
        return tm;
      }.bind(this),
      
      delete: async function({database = '', pgschema = '', id = ''} = {}) {
        // Delete row
        let tobj = new this.model({ id });
        let tm = await tobj.deleteOne({database, pgschema});
    
        //if (tm.isGood()) {
        //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
        //}
    
        return tm;
      }.bind(this)
    }

    return services;
  }
}
*/

module.exports = {
  ModelService
}