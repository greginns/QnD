CREATE TABLE IF NOT EXISTS "gm"."reservations_Item" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"cat" VARCHAR(1) NOT NULL,
"code" VARCHAR(8) NOT NULL,
"opt" INT NULL,
"date" DATE NULL,
"waitlist" BOOLEAN DEFAULT 'false',
"infants" INT NOT NULL,
"children" INT NOT NULL,
"youth" INT NOT NULL,
"adults" INT NOT NULL,
"seniors" INT NOT NULL,
"ppl" INT NOT NULL,
"disccode" VARCHAR(8) NULL,
"rslrseq1" INT NOT NULL,
"charges" NUMERIC(10,2) DEFAULT '0.00' NULL,
"comped" NUMERIC(10,2) DEFAULT '0.00' NULL,
"discount" NUMERIC(10,2) DEFAULT '0.00' NULL,
"tip" NUMERIC(10,2) DEFAULT '0.00' NULL,
"comm" NUMERIC(10,2) DEFAULT '0.00' NULL,
"comm3" NUMERIC(10,2) DEFAULT '0.00' NULL,
"sales" NUMERIC(10,2) DEFAULT '0.00' NULL,
"taxes" NUMERIC(10,2) DEFAULT '0.00' NULL,
"total" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Itemtaxes" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"taxcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","taxcode")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Itemgls" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"glcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","glcode")
);
ALTER TABLE "gm"."reservations_Item"
 ADD CONSTRAINT "reservations_item_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_item_discount_fkey" FOREIGN KEY("disccode") REFERENCES "gm"."reservations_Discount" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Itemtaxes"
 ADD CONSTRAINT "reservations_itemtaxes_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_itemtaxes_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_itemtaxes_tax_fkey" FOREIGN KEY("taxcode") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION; CREATE INDEX "reservations_itemtaxes_rsvitem_index" ON "gm"."reservations_Itemtaxes" (rsvno,seq1); CREATE INDEX "reservations_itemtaxes_tax_index" ON "gm"."reservations_Itemtaxes" (taxcode)
ALTER TABLE "gm"."reservations_Itemgls"
 ADD CONSTRAINT "reservations_itemgls_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_itemgls_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_itemgls_gl_fkey" FOREIGN KEY("glcode") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION; CREATE INDEX "reservations_itemgls_rsvitem_index" ON "gm"."reservations_Itemgls" (rsvno,seq1); CREATE INDEX "reservations_itemgls_gl_index" ON "gm"."reservations_Itemgls" (glcode)
