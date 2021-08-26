/*
  Test that adding a not null also adds a default
  Check all new attributes, default function, etc
  Verify tenant is proper

  https://stackoverflow.com/questions/27306539/at-what-level-do-postgres-index-names-need-to-be-unique      
*/

const quotedList = function(list) {
  return list.map(function(el) {
    return `"${el}"`;
  });
}
    
const compareTwoArrays = function(npk, opk) {
  // make sure number and order are same 
  if (opk.length != npk.length) return false;
  
  for (var i=0; i<opk.length; i++) {
    if (opk[i] != npk[i]) return false;
  }
  
  return true;      
};

const compareFKs = function(nfk, ofk) {
  // compares two fks with same name
  // {name: 'user', columns: ['user'], table: models.User, tableColumns: ['id'], onDelete: 'NO ACTION'}
  if (!compareTwoArrays(ofk.columns, nfk.columns)) return false;
  if (!compareTwoArrays(ofk.tableColumns, nfk.tableColumns)) return false;
  if (ofk.onDelete != nfk.onDelete) return false;
  if (ofk.table != nfk.table.name) return false;
  
  return true;      
};

const compareIndexes = function(nindex, oindex) {
  // compares two indexes with same name
  // {name: 'user', columns: ['user']}
  if (!compareTwoArrays(oindex.columns, nindex.columns)) return false;
  
  return true;      
}

class ModelBuild {
  constructor(model) {
    this.model = model;
  }

  create(pgschema) {
    var self = this;
    var tableName = this.model.getTableName({pgschema});
    var tableNameRaw = this.model.getTableName({naked: true});
    var colNames = this.model.getColumnNames({showHidden: true, includeDerived: false});
    var schema = this.model.getSchema();
    var constraints = this.model.getConstraints();
    var app = this.model.getApp().toLowerCase();
    var build = '', buildExtra = '';
    var errs = this.verify();
    var fks, indexes, uniques;

    if (errs.length > 0) {
      return [errs, '', ''];
    }

    var buildColumns = function() {
      let cols = colNames.map(function(col) {
        return schema[col].build(`"${col}"`);
      });

      return cols;
    };
    
    var buildPK = function() {
      let pk = '';

      if ('pk' in constraints) {
        pk = `PRIMARY KEY(${quotedList(constraints.pk).join(',')})`;
      }
      
      return pk;
    };
    
    var buildFKs = function() {
      let fks = [], fkeyName;

      if ('fk' in constraints && constraints.fk.length > 0) {
        constraints.fk.forEach(function(val) {
          fkeyName = self.model.makeFkeyName(`${app}_${tableNameRaw.toLowerCase()}`, val.name);
              
          fks.push(` ADD CONSTRAINT "${fkeyName}" FOREIGN KEY(${quotedList(val.columns).join(',')}) REFERENCES ${val.table.getTableName({pgschema})} (${quotedList(val.tableColumns).join(',')}) ON DELETE ${val.onDelete}`);
        })  
      }
      
      return fks;
    }

    var buildIndexes = function() {
      let indexes = [], indexName;

      if ('index' in constraints && constraints.index.length > 0) {
        constraints.index.forEach(function(val) {
          indexName = self.model.makeIndexName(`${app}_${tableNameRaw.toLowerCase()}`, val.name);
              
          indexes.push(` CREATE INDEX "${indexName}" ON ${tableName} (${val.columns.join(',')})`); // IF NOT EXISTS 
        })  
      }
      
      return indexes;
    }

    
    var buildUniques = function() {
      let uniques = [], uniqueName;

      if ('unique' in constraints && constraints.unique.length > 0) {
        constraints.unique.forEach(function(val) {
          uniqueName = self.model.makeUniqueName(`${app}_${tableNameRaw.toLowerCase()}`, val.name);
              
          uniques.push(` CREATE UNIQUE INDEX "${uniqueName}" ON ${tableName} (${val.columns.join(',')})`);
          //uniques.push(` ADD CONSTRAINT ${uniqueName} UNIQUE USING INDEX ${uniqueName}`); 
        })  
      }
      
      return uniques;
    }

    build += `CREATE TABLE IF NOT EXISTS ${tableName}`;
    build += ' (\n';
    build += buildColumns().join(',\n');
    build += ',\n';
    build += buildPK();
    build += '\n);';

    fks = buildFKs();
    indexes = buildIndexes();
    uniques = buildUniques();

    if (fks.length > 0) {
      buildExtra += `ALTER TABLE ${tableName}`;

      // FKs
      if (fks.length > 0) {
        buildExtra += fks.join(',')
      }

      buildExtra += ';';      
    }

    // Indexes
    if (indexes.length > 0) {
      buildExtra += indexes.join(',');
      buildExtra += ';';
    }

    // Uniques
    if (uniques.length > 0) {
      buildExtra += uniques.join(',');
      buildExtra += ';';
    }

    return [errs, build, buildExtra];
  }
  
  alter(pgschema, old) {
    var self = this;
    var tableName = this.model.getTableName({naked: true});
    var tableNameFull = this.model.getTableName({pgschema, naked: false});
    var colNames = this.model.getColumnNames({showHidden: true, includeDerived: false});
    var schema = this.model.getSchema();
    var constraints = this.model.getConstraints();
    var oldColNames = Object.keys(old.schema);
    var alter = '', alters = [], fkeyName;
    var errs = this.verify();
    let app = this.model.getApp();

    if (errs.length > 0) {
      return [errs, ''];
    }

    var addColumns = function() {
      // entries in colNames not in old
      colNames.forEach(function(col) {
        if (oldColNames.indexOf(col) == -1) {
          alters.push('\nADD COLUMN ' + schema[col].build(`"${col}"`));
        }
      })      
    }
    
    var dropColumns = function() {
      // entries in old not in colNames
      oldColNames.forEach(function(col) {
        if (colNames.indexOf(col) == -1) {
          if (old.schema[col].type != 'Derived') {
            alters.push(`\nDROP COLUMN IF EXISTS "${col}"`);  
          }
        }
      })      
    };
    
    var alterColumns = function() {
      // entries in both colNames and old, but different type or defn
      var ntype, otype, ndefn, odefn;
      
      colNames.forEach(function(col) {
        if (oldColNames.indexOf(col) != -1) {
          ntype = schema[col].constructor.name;
          otype = old.schema[col].type;
          ndefn = schema[col].defn;
          odefn = old.schema[col];
          
          if (otype != ntype || odefn.maxLength != ndefn.maxLength || odefn.array != ndefn.array) {
            // change type 
            alters.push(`\nALTER COLUMN "${col}" TYPE` + schema[col].alterType(''));
          }

          if (odefn.notNull && !ndefn.notNull) {
            alters.push(`\nALTER COLUMN "${col}" DROP NOT NULL`);
          }
          
          if (ndefn.notNull && !odefn.notNull) {
            alters.push(`\nALTER COLUMN "${col}" SET NOT NULL`);  
          }
      
          if (odefn.null && !ndefn.null) {
            alters.push(`\nALTER COLUMN "${col}" DROP NULL`);   
          }
          
          if (ndefn.null && !odefn.null) {
            // Needs to set default here
            //alters.push(`\nALTER COLUMN "${col}" SET NULL`);  
          }
          
          if (odefn.default && !ndefn.default) {
            alters.push(`\nALTER COLUMN "${col}" DROP DEFAULT`);
          }
          
          if (ndefn.default && !odefn.default) {
            alters.push(`\nALTER COLUMN "${col}" SET DEFAULT '${ndefn.default}'`);
          }
        }
      })      
    }
    
    var alterConstraints = function() {
      // pk - redo
      if (constraints && old && 'constraints' in old && 'pk' in constraints && 'pk' in old.constraints) {
        if (!compareTwoArrays(constraints.pk || [], old.constraints.pk || [])) {
          alters.push(`\nDROP CONSTRAINT IF EXISTS "${tableName}_pkey"`);
          alters.push(`\nADD PRIMARY KEY(${quotedList(constraints.pk).join(',')})`);
        }
      }
      
      // fk - add, remove, change
      var conAdd = function() {
        // add fks in new, not in old, ie no name match
        let addCon;
        
        (constraints.fk || []).forEach(function(nval) {
          addCon = true;  
          
          (old.constraints.fk || []).forEach(function(oval) {
            // same name = don't add (maybe alter, below)
            if (nval.name == oval.name) {
              addCon = false;
            }
          })
          
          if (addCon) {
            fkeyName = self.model.makeFkeyName(`${app}_${tableName}`, nval.name);
          
            alters.push(`\nADD CONSTRAINT "${fkeyName}" FOREIGN KEY(${quotedList(nval.columns).join(',')}) REFERENCES ${nval.table.getTableName({pgschema})} (${quotedList(nval.tableColumns).join(',')}) ON DELETE ${nval.onDelete};`);
          }
        })
      };
      
      var conDrop = function() {
        // drop fks in old, not in new, ie no name match
        let dropCon;
        
        if ('constraints' in old && 'fk' in constraints) {
          (old.constraints.fk || []).forEach(function(oval) {
            dropCon = true;
            
            (constraints.fk || []).forEach(function(nval) {
              // same name = don't drop (maybe alter, below)
              if (nval.name == oval.name) {
                dropCon = false;
              }
            })
          
            if (dropCon) {
              fkeyName = self.model.makeFkeyName(`${app}_${tableName}`, oval.name);
              
              alters.push(`\nDROP CONSTRAINT IF EXISTS "${fkeyName}"`);
            }
          });
        }
      };
      
      var conAlter = function() {
        // drop/add same name different signature
        (constraints.fk || []).forEach(function(nval) {
          (old.constraints.fk || []).forEach(function(oval) {
            // same name and exact same signature
            if (nval.name == oval.name && !compareFKs(nval, oval)) {
              fkeyName = self.model.makeFkeyName(`${app}_${tableName}`, nval.name);

              alters.push(`\nDROP CONSTRAINT IF EXISTS "${fkeyName}"`);
              alters.push(`\nADD CONSTRAINT "${fkeyName}" FOREIGN KEY(${quotedList(nval.columns).join(',')}) REFERENCES ${nval.table.getTableName({pgschema})} (${quotedList(nval.tableColumns).join(',')}) ON DELETE ${nval.onDelete};`);
            }
          })
        })
      };
      
      // index - add, remove, change
      var indexAdd = function() {
        // add indexes in new, not in old, ie no name match
        let addIndex;
        
        (constraints.index || []).forEach(function(nval) {
          addIndex = true;  
          
          (old.constraints.index || []).forEach(function(oval) {
            // same name = don't add (maybe alter, below)
            if (nval.name == oval.name) {
              addIndex = false;
            }
          })
          
          if (addIndex) {
            let indexName = self.model.makeIndexName(`${app}_${tableName}`, nval.name);
            let jnvals = nval.columns.map(function(n) {
              return `"${n}"`;
            })
          
            alters.push(`\nCREATE INDEX "${indexName}" ON ${tableName} (${jnvals.join(',')})`); // IF NOT EXISTS 
          }
        })
      };
      
      var indexDrop = function() {
        // drop indexes in old, not in new, ie no name match
        let dropIndex;
        
        if ('constraints' in old && 'index' in constraints) {
          (old.constraints.index || []).forEach(function(oval) {
            dropIndex = true;
            
            (constraints.index || []).forEach(function(nval) {
              // same name = don't drop (maybe alter, below)
              if (nval.name == oval.name) {
                dropIndex = false;
              }
            })
          
            if (dropIndex) {
              let indexName = self.model.makeIndexName(`${app}_${tableName}`, oval.name);
              
              alters.push(`\nDROP INDEX IF EXISTS "${indexName}"`);
            }
          });
        }
      };
      
      var indexAlter = function() {
        // drop/add same name different signature
        (constraints.index || []).forEach(function(nval) {
          (old.constraints.index || []).forEach(function(oval) {
            // same name and exact same signature
            if (nval.name == oval.name && !compareIndexes(nval, oval)) {
              let indexName = self.model.makeIndexName(`${app}_${tableName}`, nval.name);

              alters.push(`\nDROP INDEX IF EXISTS "${indexName}"`);
              alters.push(`\nCREATE INDEX "${indexName}" ON ${tableName} (${nval.columns.join(',')})`); // IF NOT EXISTS 
            }
          })
        })
      };
      
      // index - add, remove, change
      var uniqueAdd = function() {
        // add uniques in new, not in old, ie no name match
        let addUnique;
        
        (constraints.unique || []).forEach(function(nval) {
          addUnique = true;  
          
          (old.constraints.unique || []).forEach(function(oval) {
            // same name = don't add (maybe alter, below)
            if (nval.name == oval.name) {
              addUnique = false;
            }
          })
          
          if (addUnique) {
            let uniqueName = self.model.makeUniqueName(`${app}_${tableName}`, nval.name);
            let jnvals = nval.columns.map(function(n) {
              return `"${n}"`;
            })

            alters.push(` CREATE UNIQUE INDEX "${uniqueName}" ON ${tableName} (${jnvals.columns.join(',')})`);
          }
        })
      };

      var uniqueDrop = function() {
        // drop indexes in old, not in new, ie no name match
        let dropUnique;
        
        if ('constraints' in old && 'unique' in constraints) {
          (old.constraints.unique || []).forEach(function(oval) {
            dropUnique = true;
            
            (constraints.unique || []).forEach(function(nval) {
              // same name = don't drop (maybe alter, below)
              if (nval.name == oval.name) {
                dropUnique = false;
              }
            })
          
            if (dropUnique) {
              let indexName = self.model.makeUniqueName(`${app}_${tableName}`, oval.name);
              
              alters.push(`\nDROP INDEX IF EXISTS "${indexName}"`);
            }
          });
        }
      };
      
      var uniqueAlter = function() {
        // drop/add same name different signature
        (constraints.unique || []).forEach(function(nval) {
          (old.constraints.unique || []).forEach(function(oval) {
            // same name and exact same signature
            if (nval.name == oval.name && !compareIndexes(nval, oval)) {
              let indexName = self.model.makeUniqueName(`${app}_${tableName}`, nval.name);

              alters.push(`\nDROP INDEX IF EXISTS "${indexName}"`);
              alters.push(`\nCREATE UNIQUE INDEX "${indexName}" ON ${tableName} (${nval.columns.join(',')})`); // IF NOT EXISTS 
            }
          })
        })
      };
      
      
      conAdd();
      conDrop();
      conAlter();             

      indexAdd();
      indexDrop();
      indexAlter();             

      uniqueAdd();
      uniqueDrop();
      uniqueAlter();                   
    }
    
    addColumns();
    dropColumns();
    alterColumns();
    alterConstraints();
console.log(alters)    
    if (alters.length > 0) {
      alter = `ALTER TABLE ${tableNameFull}`;
      alter += alters.join(',');
      alter += ';';
    }
    
    return [errs, alter];
  }
  
  verify() {
    var tableName = this.model.getTableName();
    var colNames = this.model.getColumnNames({showHidden: true, includeDerived: false});
    var schema = this.model.getSchema();
    var constraints = this.model.getConstraints();
    var orderBy = this.model.getOrderBy();
    var errs = [], valArray, fkeyNames, indexNames;
    
    // test col defs
    colNames.forEach(function(col) {
      let ferrs = schema[col].verify();
      
      if (ferrs.length > 0) {
        errs.push(`${tableName} - ${col} : ${ferrs.join(', ')}`);
      }
    })
    
    // test constraints
    Object.keys(constraints).forEach(function(con) {
      switch(con) {
        case 'pk':
          if (!Array.isArray(constraints[con])) {
            errs.push(`${tableName} : PK must be an array of column name(s)`);
          }
          else {
            constraints[con].forEach(function(col) {
              if (colNames.indexOf(col) == -1) errs.push(`${tableName} - ${col} : PK not a defined column`);
            })
          }
          
          break;
          
        case 'fk':
          valArray = constraints[con];
          fkeyNames = [];
          
          if (!Array.isArray(valArray)) {
            errs.push('FK must be an array of objects');
          }
          else {
            valArray.forEach(function(val) {
              if (typeof val != 'object' || !val) {
                errs.push('FK must have an object definition');
              }
              else {
                if (! ('name' in val && val.name)) {
                  errs.push(`${tableName} : FK must have a Name`);
                }
                
                if (fkeyNames.indexOf(val.name.toLowerCase()) > -1) {
                  errs.push(`${tableName} : FK ${val.name} must be unique`);
                }
                
                if (! ('table' in val)) {
                  errs.push(`${tableName} : FK must have a Table value`);
                }
                else {
                  try {
                    val.table.getTableName();
                  }
                  catch(e) {
                    errs.push(`${tableName} : FK Table value must be a model class`);
                  }
                }
                
                if ('columns' in val && !val.columns) {
                  errs.push(`${tableName} : FK Columns must have a value`);
                }
                else {
                  if (!Array.isArray(val.columns)) {
                    errs.push(`${tableName} : FK Columns must be an array of column name(s)`);
                  }
                }
                
                if ('tableColumns' in val && !val.tableColumns) {
                  errs.push(`${tableName} : FK TableColumns must have a value`);
                }
                else {
                  if (!Array.isArray(val.tableColumns)) {
                    errs.push(`${tableName} : FK TableColumns must be an array of column name(s)`);
                  }
                  else {
                    // do the names exist
                    var fkCols = val.table.getColumnDefns();
                    
                    val.tableColumns.forEach(function(tbc) {
                      if (! (tbc in fkCols)) {
                        errs.push(`${tableName} : FK TableColumns - invalid field ${tbc}`);
                      }
                    })
                  }
                }
                
                if ('onDelete' in val && (val.onDelete != 'CASCADE' && val.onDelete != 'NO ACTION')) errs.push(`${tableName} : onDelete must be CASCADE or NO ACTION`);
                if ('onUpdate' in val && (val.onUpdate != 'CASCADE' && val.onUpdate != 'NO ACTION')) errs.push(`${tableName} : onUpdate must be CASCADE or NO ACTION`);
                
                fkeyNames.push(val.name);
              }            
            }) 
          }          
          
          break;

        case 'index' || 'unique':
          valArray = constraints[con];
          indexNames = [];
          
          if (!Array.isArray(valArray)) {
            errs.push('Index must be an array of objects');
          }
          else {
            valArray.forEach(function(val) {
              if (typeof val != 'object' || !val) {
                errs.push('Index must have an object definition');
              }
              else {
                if (! ('name' in val && val.name)) {
                  errs.push(`${tableName} : ${con} must have a Name`);
                }
                
                if (indexNames.indexOf(val.name.toLowerCase()) > -1) {
                  errs.push(`${tableName} : ${con} ${val.name} must be unique`);
                }

                if ('columns' in val && !val.columns) {
                  errs.push(`${tableName} : ${con} Columns must have a value`);
                }
                else {
                  if (!Array.isArray(val.columns)) {
                    errs.push(`${tableName} : ${con} Columns must be an array of column name(s)`);
                  }
                  else {
                    for (let col of val.columns) {
                      if (colNames.indexOf(col) == -1) {
                        errs.push(`${tableName} : ${con} Column ${col} must be a valid column name`);
                      }
                    }
                  }
                }
              }

              indexNames.push(val.name)
            })
          }

          break
      }
    });
    
    // test orderBy
    orderBy.forEach(function(col) {
      if (col.substr(0,1) == '-') col = col.substr(1);
      
      if (! (col in schema)) {
        errs.push(`${tableName} - ${col} : Invalid OrderBy column name`);
      }
    });

    return errs;
  }

  drop(pgschema, pswd) {
    // only for a table dropping itself
    var tableName = this.model.getTableName({pgschema});
    var dt = new Date();
    var pwd = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate();
    
    if (pwd != pswd) return false;
    
    return `DROP TABLE IF EXISTS ${tableName} CASCADE`;    
  }
  
  toJSON() {
    var defn = this.model.definition();
    var defk;
    var json = {};
    
    Object.keys(defn).forEach(function(k) {
      defk = defn[k];

      if (k == 'schema') {
        // convert field type to string
        var colList = defk, schema = {}, colDefn;
        
        Object.keys(colList).forEach(function(col) {
          colDefn = JSON.parse(JSON.stringify((colList[col].defn)));
          colDefn.type = colList[col].constructor.name
          schema[col] = colDefn;
        })
        
        json[k] = schema;
      }
      else if (k == 'constraints' && 'fk' in defk) {
        // convert fk table Class name to string
        var fk = [];

        defk.fk.forEach(function(f) {
          
          f.table = f.table.name;  
          fk.push(f);
        })
        
        defk.fk = fk;
        json[k] = defk;
      }
      else {
        json[k] = defk;
      }
    })
    
    return json;  
  }
}

module.exports = ModelBuild;