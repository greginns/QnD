const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {Contact, Company} = require(root + '/apps/contacts/models.js');
const {Activity, Lodging, Lodgunit, Meals, Area, Pmtterms, Tax, Glcode, Reseller, Supplier, PRIVILEGES} = require(root + '/apps/items/models.js');

const app = getAppName(__dirname);

const upper = function(x) {
  return String(x).toUpperCase();
}

const STATUSES = [
  {text: 'Active', value: 'A'},
  {text: 'Quote', value: 'Q'},
  {text: 'Cancelled', value: 'X'},
  {text: 'Internet', value: 'I'}
];

const SYSTEMS = [
  {text: 'Reservations', value: 'R'},
  {text: 'POS', value: 'P'},
];

const DISCBASIS = [
  {text: 'Percent', value: '%'},
  {text: 'Flat', value: 'F'},
  {text: 'Per Person', value: 'P'},
  {text: 'Per Person/Day', value: 'D'},
  {text: 'Open', value: 'B'},
]

const Include = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Rsvno'}),      
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        seq2: new Fields.Integer({notNull: true, verbose: 'Included Sequence'}),
        date: new Fields.Date({null: true, verbose: 'Date'}),
        dur: new Fields.Integer({notNull: true, default: 1, verbose: 'Duration'}),
        enddate: new Fields.Date({null: true, verbose: 'End Date'}),
        desc: new Fields.Char({null: true, maxLength: 50, verbose: 'Description'}),
        waitlist: new Fields.Boolean({default: false, verbose: 'Waitlist'}),
        infants: new Fields.Integer({notNull: true, verbose: 'Infants'}),
        children: new Fields.Integer({notNull: true, verbose: 'Children'}),
        youth: new Fields.Integer({notNull: true, verbose: 'Youth'}),
        adults: new Fields.Integer({notNull: true, verbose: 'Adults'}),
        seniors: new Fields.Integer({notNull: true, verbose: 'Seniors'}),
        ppl: new Fields.Integer({notNull: true, verbose: 'Total Ppl'}),
        noshow: new Fields.Integer({notNull: true, verbose: 'No Shows'}),
        qty: new Fields.Integer({notNull: true, default: 0, verbose: 'Qty'}),
        notes: new Fields.Text({null: true, verbose: 'Notes'}),
        cidate: new Fields.Date({null: true, verbose: 'Check-In Date'}),
        citime: new Fields.Time({null: true, verbose: 'Check-In Time'}),

        rateno: new Fields.Integer({notNull: true, verbose: 'Rateno'}),   
        tipamt: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tip Amount'}),     
        tipperc: new Fields.Boolean({default: true, verbose: 'Tip %'}),
        fv: new Fields.Boolean({default: true, verbose: 'Fixed Value'}),
        adj: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Adj Amount'}),     
        orprice: new Fields.Boolean({default: false, verbose: 'Prices O/R'}),
        prices: new Fields.Jsonb({verbose: 'Prices'}),        
        
        rslrseq2: new Fields.Integer({notNull: true, verbose: 'Reseller Included Sequence'}),
        supplier: new Fields.Char({null: true, maxLength: 8, verbose: 'Supplier Rsvno'}),
        suppseq1: new Fields.Integer({null: true, verbose: 'Supplier Item'}),

        charges: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Charges'}),
        comped: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Complementary'}),
        discount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Discount'}),
        tip: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tip'}),
        comm: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Commission'}),
        comm3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: '3rd Party Commission'}),
        sales: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Sales'}),
        taxes: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Taxes'}),
        total: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Total'}),        
      },      
      constraints: {
        pk: ['rsvno', 'seq1', 'seq2'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'item', columns: ['rsvno', 'seq1'], app, table: Item, tableColumns: ['rsvno', 'seq1'], onDelete: 'NO ACTION'},
          {name: 'supplier', columns: ['supplier'], app, table: Supplier, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1', 'seq2'],
      
      dbschema: '',
      app,
      desc: 'Include prototype'
    }
  }
};

const Includetaxes = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Rsvno'}),
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        seq2: new Fields.Integer({notNull: true, verbose: 'Included Sequence'}),
        taxcode: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tax Amount'}),
      },
      
      constraints: {
        pk: ['rsvno', 'seq1', 'seq2', 'taxcode'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'tax', columns: ['taxcode'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'rsvitem', columns: ['rsvno', 'seq1']},
          {name: 'tax', columns: ['taxcode']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1', 'seq2', 'taxcode'],
      
      dbschema: '',
      app,
      desc: 'Include Taxes'
    }
  }
};

const Includegls = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Rsvno'}),
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        seq2: new Fields.Integer({notNull: true, verbose: 'Included Sequence'}),
        glcode: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tax Amount'}),
      },
      
      constraints: {
        pk: ['rsvno', 'seq1', 'seq2', 'glcode'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'gl', columns: ['glcode'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'rsvitem', columns: ['rsvno', 'seq1']},
          {name: 'gl', columns: ['glcode']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1', 'seq2', 'glcode'],
      
      dbschema: '',
      app,
      desc: 'Include GLs'
    }
  }
};

const Daily = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Rsvno'}),      
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        seq2: new Fields.Integer({notNull: true, verbose: 'Included Sequence'}),
        day: new Fields.Integer({notNull: true, verbose: 'Day'}),
        date: new Fields.Date({null: true, verbose: 'Date'}),
        ppl: new Fields.Integer({notNull: true, verbose: 'Total Ppl'}),
        qty: new Fields.Integer({notNull: true, default: 0, verbose: 'Qty'}),
      },
      constraints: {
        pk: ['rsvno', 'seq1', 'seq2', 'day'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'item', columns: ['rsvno', 'seq1'], app, table: Item, tableColumns: ['rsvno', 'seq1'], onDelete: 'NO ACTION'},
        ],
        index: [
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1', 'seq2', 'day'],
      
      dbschema: '',
      app,
      desc: 'Daily prototype'
    }
  }
};

const Booked = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        booked: new Fields.Jsonb({null: true, verbose: 'Bookings'}) 
      },
      
      constraints: {
        fk: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Bookings'
    }
  }
};

/* MAIN */
const Main = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Rsvno'}),
        contact: new Fields.Integer({notNull: true, verbose: 'Contact'}),
        status: new Fields.Char({notNull: true, maxLength: 2, default: 'A', choices: STATUSES, verbose: 'Status'}),
        cr8date: new Fields.Date({null: true, verbose: 'Create Date'}),
        cr8time: new Fields.Time({null: true, verbose: 'Create Time'}),
        cr8user: new Fields.Char({null: true, maxLength: 8, verbose: 'Create User'}),
        lastdate: new Fields.Date({null: true, verbose: 'Last Accessed Date'}),
        lasttime: new Fields.Time({null: true, verbose: 'Last Accessed Time'}),
        lastuser: new Fields.Char({null: true, maxLength: 8, verbose: 'Last Accessed By'}),
        arrdate: new Fields.Date({null: true, verbose: 'Arrival Date'}),
        depdate: new Fields.Date({null: true, verbose: 'Deprture Date'}),
        grpsize: new Fields.Integer({notNull: true, default: 1, verbose: 'Group Size'}),
        grpsizex: new Fields.Integer({notNull: true, default: 0, verbose: 'Group Size - Calced'}),
        client: new Fields.Char({null: true, maxLength: 40, verbose: 'Client Name'}),
        owner: new Fields.Char({null: true, maxLength: 30, verbose: 'Owner'}),
        area: new Fields.Char({notNull: true, maxLength: 2, verbose: 'Area'}),
        company: new Fields.Char({notNull: true, maxLength: 1, verbose: 'Company'}),
        allowfup: new Fields.Boolean({default: true, verbose: 'Follow Up'}),
        firm: new Fields.Boolean({default: true, verbose: 'Deposit Paid'}),
        system: new Fields.Char({notNull: true, maxLength: 2, default: 'R', choices: SYSTEMS, verbose: 'System'}),
        cidate: new Fields.Date({null: true, verbose: 'Check-In Date'}),
        citime: new Fields.Time({null: true, verbose: 'Check-In Time'}),
        ciuser: new Fields.Char({null: true, maxLength: 8, verbose: 'Check-In User'}),
        codate: new Fields.Date({null: true, verbose: 'Check-Out Date'}),
        cotime: new Fields.Time({null: true, verbose: 'Check-Out Time'}),
        couser: new Fields.Char({null: true, maxLength: 8, verbose: 'Check-Out User'}),

        taxable: new Fields.Boolean({default: true, verbose: 'Taxable'}),
        taxno: new Fields.Char({null: true, maxLength: 20, verbose: 'Tax#'}),
        pmtterms: new Fields.Char({null: true, maxLength: 8, verbose: 'Payment Terms'}),
        pmttermsx: new Fields.Char({null: true, maxLength: 8, verbose: 'Payment Terms - Calced'}),
        lockamts: new Fields.Boolean({default: false, verbose: 'Lock Pmt Amts'}),
        lockdates: new Fields.Boolean({default: false, verbose: 'Lock Pmt Dates'}),

        pmtdate1: new Fields.Date({null: true, verbose: 'Pmt-1 Date'}),
        pmtamt1: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-1 Amount'}),
        pmtapp1: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-1 Applied'}),
        pmtrem1: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-1 Remain'}),
        pmtbal1: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-1 Balance'}),
        pmtdate2: new Fields.Date({null: true, verbose: 'Pmt-2 Date'}),
        pmtamt2: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-2 Amount'}),
        pmtapp2: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-2 Applied'}),
        pmtrem2: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-2 Remain'}),
        pmtbal2: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-2 Balance'}),
        pmtdate3: new Fields.Date({null: true, verbose: 'Pmt-3 Date'}),
        pmtamt3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-3 Amount'}),
        pmtapp3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-3 Applied'}),
        pmtrem3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-3 Remain'}),
        pmtbal3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Pmt-3 Balance'}),

        charges: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Charges'}),
        comped: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Complementary'}),
        discount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Discount'}),
        tip: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tip'}),
        comm: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Commission'}),
        comm3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: '3rd Party Commission'}),
        sales: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Sales'}),
        taxes: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Taxes'}),
        total: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Total'}),

        cancdate: new Fields.Date({null: true, verbose: 'Cxl Date'}),
        cancwho: new Fields.Char({null: true, maxLength: 40, verbose: 'Cxl By'}),
        cancreas: new Fields.Char({null: true, maxLength: 8, verbose: 'Cxl Reason'}),
        cancfee: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Cxl Fee'}),

        xcharges: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Charges'}),
        xcomped: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Complementary'}),
        xdiscount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Discount'}),
        xtip: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tip'}),
        xcomm: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Commission'}),
        xcomm3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: '3rd Party Commission'}),
        xsales: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Sales'}),
        xtaxes: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Taxes'}),
        xtotal: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Total'}),
        xtaxdtls: new Fields.Jsonb({verbose: 'Tax Details'}),

        reseller: new Fields.Char({null: true, maxLength: 8, verbose: 'Reseller'}),
        rslrrsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Reseller Rsvno'}), 
      },
      
      constraints: {
        pk: ['rsvno'],
        fk: [
          {name: 'contact', columns: ['contact'], app, table: Contact, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'area', columns: ['area'], app, table: Area, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'company', columns: ['company'], app, table: Company, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'pmtterms', columns: ['pmtterms'], app, table: Pmtterms, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'pmttermsx', columns: ['pmttermsx'], app, table: Pmtterms, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'cancreas', columns: ['cancreas'], app, table: Cancreas, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'reseller', columns: ['reseller'], app, table: Reseller, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'contact', columns: ['contact']},
          {name: 'arrdate', columns: ['arrdate']},
          {name: 'depdate', columns: ['depdate']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno'],
      
      dbschema: '',
      app,
      desc: 'Reservations'
    }
  }
};

const Maintaxes = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Rsvno'}),
        taxcode: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tax Amount'}),
      },
      
      constraints: {
        pk: ['rsvno', 'taxcode'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'tax', columns: ['taxcode'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'rsvno', columns: ['rsvno']},
          {name: 'tax', columns: ['taxcode']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'taxcode'],
      
      dbschema: '',
      app,
      desc: 'Reservation Taxes'
    }
  }
};

const Maingls = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Rsvno'}),
        glcode: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tax Amount'}),
      },
      
      constraints: {
        pk: ['rsvno', 'glcode'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'gl', columns: ['glcode'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'rsvno', columns: ['rsvno']},
          {name: 'gl', columns: ['glcode']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'glcode'],
      
      dbschema: '',
      app,
      desc: 'Reservation GLs'
    }
  }
};

/* ITEM LEVEL */
const Item = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Rsvno'}),      
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        cat: new Fields.Char({notNull: true, maxLength: 1, onBeforeUpsert: upper, verbose: 'Category'}),
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        opt: new Fields.Integer({null: true, verbose: 'Option'}),
        date: new Fields.Date({null: true, verbose: 'Date'}),
        waitlist: new Fields.Boolean({default: false, verbose: 'Waitlist'}),
        infants: new Fields.Integer({notNull: true, verbose: 'Infants'}),
        children: new Fields.Integer({notNull: true, verbose: 'Children'}),
        youth: new Fields.Integer({notNull: true, verbose: 'Youth'}),
        adults: new Fields.Integer({notNull: true, verbose: 'Adults'}),
        seniors: new Fields.Integer({notNull: true, verbose: 'Seniors'}),
        ppl: new Fields.Integer({notNull: true, verbose: 'Total Ppl'}),
        disccode: new Fields.Char({null: true, maxLength: 8, verbose: 'Discount'}),
        rslrseq1: new Fields.Integer({notNull: true, verbose: 'Reseller Item Sequence'}),

        charges: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Charges'}),
        comped: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Complementary'}),
        discount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Discount'}),
        tip: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tip'}),
        comm: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Commission'}),
        comm3: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: '3rd Party Commission'}),
        sales: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Sales'}),
        taxes: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Taxes'}),
        total: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Total'}),        
      },

      constraints: {
        pk: ['rsvno', 'seq1'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'discount', columns: ['disccode'], app, table: Discount, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1'],
      
      dbschema: '',
      app,
      desc: 'Booked Items'
    }
  }
};

const Itemtaxes = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Rsvno'}),
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        taxcode: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tax Amount'}),
      },
      
      constraints: {
        pk: ['rsvno', 'seq1', 'taxcode'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'item', columns: ['rsvno', 'seq1'], app, table: Item, tableColumns: ['rsvno', 'seq1'], onDelete: 'NO ACTION'},
          {name: 'tax', columns: ['taxcode'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'rsvitem', columns: ['rsvno', 'seq1']},
          {name: 'tax', columns: ['taxcode']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1', 'taxcode'],
      
      dbschema: '',
      app,
      desc: 'Item Taxes'
    }
  }
};

const Itemgls = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        rsvno: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Rsvno'}),
        seq1: new Fields.Integer({notNull: true, verbose: 'Item Sequence'}),
        glcode: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Tax Amount'}),
      },
      
      constraints: {
        pk: ['rsvno', 'seq1', 'glcode'],
        fk: [
          {name: 'rsvno', columns: ['rsvno'], app, table: Main, tableColumns: ['rsvno'], onDelete: 'NO ACTION'},
          {name: 'item', columns: ['rsvno', 'seq1'], app, table: Item, tableColumns: ['rsvno', 'seq1'], onDelete: 'NO ACTION'},
          {name: 'gl', columns: ['glcode'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'rsvitem', columns: ['rsvno', 'seq1']},
          {name: 'gl', columns: ['glcode']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['rsvno', 'seq1', 'glcode'],
      
      dbschema: '',
      app,
      desc: 'Item GLs'
    }
  }
};

/* ACTIVITIES */
const Actinclude = class extends Include {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
      },

      constraints: {
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Activity Includes'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Acttaxes = class extends Includetaxes {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
      },

      constraints: {
        fk: [
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Actinclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Activity Taxes'
    }
  }
};

const Actgls = class extends Includegls {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
      },

      constraints: {
        fk: [
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Actinclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Activity GLs'
    }
  }
  
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Actdaily = class extends Daily {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
        time: new Fields.Time({null: true, verbose: 'Last Accessed Time'}),
      },

      constraints: {
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Actinclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Activity Daily'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Actbooked = class extends Booked {
  /* booked:
      31x [{time: {booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx}, ]}, }, ] 
      one {} for all times in a day, one {} for each rsv daily
  */
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
      },
      
      constraints: {
        pk: ['activity', 'year', 'month'],
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['activity', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Activity Bookings'
    }
  }
    
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};
  
/* LODGING */
const Lodginclude = class extends Include {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
      },

      constraints: {
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Lodging Includes'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Lodgtaxes = class extends Includetaxes {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
      },

      constraints: {
        fk: [
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Lodginclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Activity Taxes'
    }
  }
};

const Lodggls = class extends Includegls {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
      },

      constraints: {
        fk: [
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Lodginclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Activity GLs'
    }
  }
  
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Lodgdaily = class extends Daily {
  /*
    # one per day per qty booked.
    # Lodging:
    #   Unitized:
    #       Bookbybed:
    #           Qty = beds
    #       Else:
    #           Qty = 1
    #   Else:
    #       Qty = ppl
    #
    # Lodging can be unitized or not.  If so, qty = 1, else qty = ppl
    # Lodging can be booked by bed or not.  If so, qty=beds, else qty = 1
    # Beds belong to a unit, so beds have to have a unit and be unitized
  */
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
        seq3: new Fields.Integer({null: true, verbose: 'Per Unit Seq'}),
        unit: new Fields.Integer({null: true, verbose: 'Unit'}),
      },

      constraints: {
        pk: ['rsvno', 'seq1', 'seq2', 'day', 'seq3'],
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'lodgunit', columns: ['lodging', 'unit'], app, table: Lodgunit, tableColumns: ['lodging', 'seq'], onDelete: 'NO ACTION'},
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Lodginclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Lodging Daily'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Lodgbooked = class extends Booked {
  /* booked:
      31x [{unitseq: {booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx, seq3: xx}, ]}}, ] 
      one {} for all units, one {} for each rsv daily
      mostly have only one daily entry, except for non-unitized and book beds, where more than one item can be in the same unit.
  */
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
      },
      
      constraints: {
        pk: ['lodging', 'year', 'month'],
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['lodging', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Lodging Bookings'
    }
  }
    
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

/* MEALS */
const Mealinclude = class extends Include {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
      },

      constraints: {
        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Meal Includes'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Mealtaxes = class extends Includetaxes {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
      },

      constraints: {
        fk: [
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Mealinclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Meal Taxes'
    }
  }
};

const Mealgls = class extends Includegls {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
      },

      constraints: {
        fk: [
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Mealinclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Meal GLs'
    }
  }
  
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Mealdaily = class extends Daily {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
        time: new Fields.Time({null: true, verbose: 'Last Accessed Time'}),
      },

      constraints: {
        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'incl', columns: ['rsvno', 'seq1', 'seq2'], app, table: Actinclude, tableColumns: ['rsvno', 'seq1', 'seq2'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Meal Daily'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Mealbooked = class extends Booked {
  /* booked:
      31x [{time: xx, booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx}, ]}, ] 
      one {} for each time, one {} for each rsv daily
  */
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
      },
      
      constraints: {
        pk: ['meal', 'year', 'month'],
        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['meal', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Meal Bookings'
    }
  }
    
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

/* GENERAL */
const Cancreas = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code', helptext: '1-8 character code to identify this waiver'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Cancellation Reasons'
    }
  }
};

const Discount = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code', helptext: '1-8 character code to identify this waiver'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        basis: new Fields.Char({notNull: true, maxLength: 2, default: '%', choices: DISCBASIS, verbose: 'Basic'}),
        amount: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Amount'}),
        maxdisc: new Fields.Decimal({null: true, digits: 10, decimals: 2, default: '0.00', verbose: 'Maximum'}),
        privilege: new Fields.Char({notNull: true, maxLength: 5, default: 'rsvsA', choices: PRIVILEGES, verbose: 'Privilege'}),
        online: new Fields.Boolean({default: true, verbose: 'Allow Online'}),   
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Discounts'
    }
  }
};

module.exports = {
  Main, Maintaxes, Maingls,
  Item, Itemtaxes, Itemgls,
  Actinclude, Actdaily, Actbooked, Acttaxes, Actgls,
  Lodginclude, Lodgdaily, Lodgbooked, Lodgtaxes, Lodggls,
  Mealinclude, Mealdaily, Mealbooked, Mealtaxes, Mealgls,
  Cancreas, Discount
};