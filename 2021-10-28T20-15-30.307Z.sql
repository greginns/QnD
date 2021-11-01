CREATE TABLE IF NOT EXISTS "gm"."items_Actminp" (
"rateno" INT NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"minppl" JSONB NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgminp" (
"rateno" INT NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"minppl" JSONB NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("lodging","rateno","year","month")
);
ALTER TABLE "gm"."items_Lodgminp"
 ADD CONSTRAINT "items_lodgminp_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actminp"
 ADD CONSTRAINT "items_actminp_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION;
