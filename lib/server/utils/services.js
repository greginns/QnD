const root = process.cwd();

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

class modelService {
  constructor({model=''} = {}) {
    this.model = model;

    return this.build();
  }

  build() {
    const services = {
      getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
        // Get one or more rows
        return (where) 
          ? await this.model.where({pgschema, where, values, cols, limit, offset, orderby}) 
          : await this.model.select({pgschema, rec, cols, limit, offset, orderby});
      }.bind(this),
      
      getOne: async function({pgschema = '', rec = {}} = {}) {
        // Get specific row
        if ('id' in rec && rec.id == '_default') {
          let tm = new TravelMessage();
    
          tm.data = this.model.getColumnDefaults();
          tm.type = 'json';
    
          return tm;
        }
        
        return await this.model.selectOne({pgschema, pks: [rec.id] });
      }.bind(this),
        
      create: async function({pgschema = '', rec = {}} = {}) {
        // Insert row
        let tobj = new this.model(rec);
        let tm = await tobj.insertOne({pgschema});
    
        //if (tm.isGood()) {
        //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
        //}
    
        return tm;    
      }.bind(this),
      
      update: async function({pgschema = '', id = '', rec= {}} = {}) {
        // Update row
        rec.id = id;
    
        let tobj = new this.model(rec);
        let tm = await tobj.updateOne({pgschema});
    
        //if (tm.isGood()) {
        //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
        //}
        
        return tm;
      }.bind(this),
      
      delete: async function({pgschema = '', id = ''} = {}) {
        // Delete row
        let tobj = new this.model({ id });
        let tm = await tobj.deleteOne({pgschema});
    
        //if (tm.isGood()) {
        //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
        //}
    
        return tm;
      }.bind(this)
    }

    return services;
  }
}

module.exports = {
  modelService
}