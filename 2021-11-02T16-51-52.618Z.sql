CREATE TABLE IF NOT EXISTS "gm"."items_Actreseller" (
"reseller" VARCHAR(65) NOT NULL,
"rateno" INT NOT NULL,
"comm" FLOAT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","reseller")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgreseller" (
"reseller" VARCHAR(65) NOT NULL,
"rateno" INT NOT NULL,
"comm" FLOAT NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("lodging","reseller")
);
ALTER TABLE "gm"."items_Actreseller"
 ADD CONSTRAINT "items_actreseller_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actreseller_actrates_fkey" FOREIGN KEY("activity","rateno") REFERENCES "gm"."items_Actrates" ("activity","rateno") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actreseller_reseller_fkey" FOREIGN KEY("reseller") REFERENCES "gm"."items_Reseller" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgreseller"
 ADD CONSTRAINT "items_lodgreseller_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgreseller_lodgrates_fkey" FOREIGN KEY("lodging","rateno") REFERENCES "gm"."items_Lodgrates" ("lodging","rateno") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgreseller_reseller_fkey" FOREIGN KEY("reseller") REFERENCES "gm"."items_Reseller" ("code") ON DELETE NO ACTION;
