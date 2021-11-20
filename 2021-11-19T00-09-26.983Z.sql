CREATE TABLE IF NOT EXISTS "gm"."reservations_Lodginclude" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"date" DATE NULL,
"dur" INT DEFAULT '1' NOT NULL,
"enddate" DATE NULL,
"desc" VARCHAR(50) NULL,
"waitlist" BOOLEAN DEFAULT 'false',
"infants" INT NOT NULL,
"children" INT NOT NULL,
"youth" INT NOT NULL,
"adults" INT NOT NULL,
"seniors" INT NOT NULL,
"ppl" INT NOT NULL,
"noshow" INT NOT NULL,
"qty" INT DEFAULT '0' NOT NULL,
"notes" TEXT NULL,
"cidate" DATE NULL,
"citime" TIME WITHOUT TIME ZONE NULL,
"rateno" INT NOT NULL,
"tipamt" NUMERIC(10,2) DEFAULT '0.00' NULL,
"tipperc" BOOLEAN DEFAULT 'true',
"fv" BOOLEAN DEFAULT 'true',
"adj" NUMERIC(10,2) DEFAULT '0.00' NULL,
"orprice" BOOLEAN DEFAULT 'false',
"prices" JSONB,
"rslrseq2" INT NOT NULL,
"supplier" VARCHAR(8) NULL,
"suppseq1" INT NULL,
"charges" NUMERIC(10,2) DEFAULT '0.00' NULL,
"comped" NUMERIC(10,2) DEFAULT '0.00' NULL,
"discount" NUMERIC(10,2) DEFAULT '0.00' NULL,
"tip" NUMERIC(10,2) DEFAULT '0.00' NULL,
"comm" NUMERIC(10,2) DEFAULT '0.00' NULL,
"comm3" NUMERIC(10,2) DEFAULT '0.00' NULL,
"sales" NUMERIC(10,2) DEFAULT '0.00' NULL,
"taxes" NUMERIC(10,2) DEFAULT '0.00' NULL,
"total" NUMERIC(10,2) DEFAULT '0.00' NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("rsvno","seq1","seq2")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Lodgdaily" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"day" INT NOT NULL,
"date" DATE NULL,
"ppl" INT NOT NULL,
"qty" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"seq3" INT NULL,
"unit" INT NULL,
PRIMARY KEY("rsvno","seq1","seq2","day","seq3")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Lodgbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("lodging","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Lodgtaxes" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"taxcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","seq2","taxcode")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Lodggls" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"glcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","seq2","glcode")
);
ALTER TABLE "gm"."reservations_Lodginclude"
 ADD CONSTRAINT "reservations_lodginclude_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodginclude_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodginclude_supplier_fkey" FOREIGN KEY("supplier") REFERENCES "gm"."items_Supplier" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodginclude_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Lodgdaily"
 ADD CONSTRAINT "reservations_lodgdaily_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodgdaily_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodgdaily_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodgdaily_lodgunit_fkey" FOREIGN KEY("lodging","unit") REFERENCES "gm"."items_Lodgunit" ("lodging","seq") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodgdaily_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Lodginclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Lodgbooked"
 ADD CONSTRAINT "reservations_lodgbooked_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Lodgtaxes"
 ADD CONSTRAINT "reservations_lodgtaxes_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodgtaxes_tax_fkey" FOREIGN KEY("taxcode") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodgtaxes_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Lodginclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION; CREATE INDEX "reservations_lodgtaxes_rsvitem_index" ON "gm"."reservations_Lodgtaxes" (rsvno,seq1); CREATE INDEX "reservations_lodgtaxes_tax_index" ON "gm"."reservations_Lodgtaxes" (taxcode)
ALTER TABLE "gm"."reservations_Lodggls"
 ADD CONSTRAINT "reservations_lodggls_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodggls_gl_fkey" FOREIGN KEY("glcode") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_lodggls_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Lodginclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION; CREATE INDEX "reservations_lodggls_rsvitem_index" ON "gm"."reservations_Lodggls" (rsvno,seq1); CREATE INDEX "reservations_lodggls_gl_index" ON "gm"."reservations_Lodggls" (glcode)
