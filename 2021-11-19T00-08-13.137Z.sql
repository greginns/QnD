CREATE TABLE IF NOT EXISTS "gm"."reservations_Actinclude" (
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
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("rsvno","seq1","seq2")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Actdaily" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"day" INT NOT NULL,
"date" DATE NULL,
"ppl" INT NOT NULL,
"qty" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
"time" TIME WITHOUT TIME ZONE NULL,
PRIMARY KEY("rsvno","seq1","seq2","day")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Actbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Acttaxes" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"taxcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","seq2","taxcode")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Actgls" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"glcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","seq2","glcode")
);
ALTER TABLE "gm"."reservations_Actinclude"
 ADD CONSTRAINT "reservations_actinclude_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actinclude_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actinclude_supplier_fkey" FOREIGN KEY("supplier") REFERENCES "gm"."items_Supplier" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actinclude_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Actdaily"
 ADD CONSTRAINT "reservations_actdaily_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actdaily_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actdaily_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Actinclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Actbooked"
 ADD CONSTRAINT "reservations_actbooked_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Acttaxes"
 ADD CONSTRAINT "reservations_acttaxes_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_acttaxes_tax_fkey" FOREIGN KEY("taxcode") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_acttaxes_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Actinclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION; CREATE INDEX "reservations_acttaxes_rsvitem_index" ON "gm"."reservations_Acttaxes" (rsvno,seq1); CREATE INDEX "reservations_acttaxes_tax_index" ON "gm"."reservations_Acttaxes" (taxcode)
ALTER TABLE "gm"."reservations_Actgls"
 ADD CONSTRAINT "reservations_actgls_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actgls_gl_fkey" FOREIGN KEY("glcode") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_actgls_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Actinclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION; CREATE INDEX "reservations_actgls_rsvitem_index" ON "gm"."reservations_Actgls" (rsvno,seq1); CREATE INDEX "reservations_actgls_gl_index" ON "gm"."reservations_Actgls" (glcode)
