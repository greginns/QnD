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
