CREATE TABLE IF NOT EXISTS "gm"."items_Lodgsched" (
"lodging" VARCHAR(8) NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"sched" JSONB NULL,
PRIMARY KEY("lodging","year","month")
);
ALTER TABLE "gm"."items_Lodgsched"
 ADD CONSTRAINT "items_lodgsched_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION;
