CREATE TABLE IF NOT EXISTS "gm"."items_Actprices" (
"rateno" INT NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"prices" JSONB DEFAULT ''::jsonb NULL,
"activity" VARCHAR(8) NOT NULL,
"hour" INT NULL,
"minute" INT NULL,
PRIMARY KEY("activity","rateno","year","month","hour","minute")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgprices" (
"rateno" INT NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"prices" JSONB DEFAULT ''::jsonb NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("lodging","rateno","year","month")
);
ALTER TABLE "gm"."items_Lodgprices"
 ADD CONSTRAINT "items_lodgprices_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actprices"
 ADD CONSTRAINT "items_actprices_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION;
