CREATE TABLE IF NOT EXISTS "gm"."reservations_Mealinclude" (
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
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("rsvno","seq1","seq2")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Mealdaily" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"day" INT NOT NULL,
"date" DATE NULL,
"ppl" INT NOT NULL,
"qty" INT DEFAULT '0' NOT NULL,
"meal" VARCHAR(8) NOT NULL,
"time" TIME WITHOUT TIME ZONE NULL,
PRIMARY KEY("rsvno","seq1","seq2","day")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Mealbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Mealtaxes" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"taxcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","seq2","taxcode")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Mealgls" (
"rsvno" VARCHAR(8) NOT NULL,
"seq1" INT NOT NULL,
"seq2" INT NOT NULL,
"glcode" VARCHAR(8) NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
PRIMARY KEY("rsvno","seq1","seq2","glcode")
);
ALTER TABLE "gm"."reservations_Mealinclude"
 ADD CONSTRAINT "reservations_mealinclude_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealinclude_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealinclude_supplier_fkey" FOREIGN KEY("supplier") REFERENCES "gm"."items_Supplier" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealinclude_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Mealdaily"
 ADD CONSTRAINT "reservations_mealdaily_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealdaily_item_fkey" FOREIGN KEY("rsvno","seq1") REFERENCES "gm"."reservations_Item" ("rsvno","seq1") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealdaily_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealdaily_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Actinclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Mealbooked"
 ADD CONSTRAINT "reservations_mealbooked_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."reservations_Mealtaxes"
 ADD CONSTRAINT "reservations_mealtaxes_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealtaxes_tax_fkey" FOREIGN KEY("taxcode") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealtaxes_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Mealinclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION; CREATE INDEX "reservations_mealtaxes_rsvitem_index" ON "gm"."reservations_Mealtaxes" (rsvno,seq1); CREATE INDEX "reservations_mealtaxes_tax_index" ON "gm"."reservations_Mealtaxes" (taxcode)
ALTER TABLE "gm"."reservations_Mealgls"
 ADD CONSTRAINT "reservations_mealgls_rsvno_fkey" FOREIGN KEY("rsvno") REFERENCES "gm"."reservations_Main" ("rsvno") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealgls_gl_fkey" FOREIGN KEY("glcode") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "reservations_mealgls_incl_fkey" FOREIGN KEY("rsvno","seq1","seq2") REFERENCES "gm"."reservations_Mealinclude" ("rsvno","seq1","seq2") ON DELETE NO ACTION; CREATE INDEX "reservations_mealgls_rsvitem_index" ON "gm"."reservations_Mealgls" (rsvno,seq1); CREATE INDEX "reservations_mealgls_gl_index" ON "gm"."reservations_Mealgls" (glcode)
