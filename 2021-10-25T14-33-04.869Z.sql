CREATE TABLE IF NOT EXISTS "gm"."items_Actsched" (
"activity" VARCHAR(8) NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"sched" JSONB DEFAULT '[]'::jsonb NULL,
PRIMARY KEY("activity","year","month")
);
ALTER TABLE "gm"."items_Actsched"
 ADD CONSTRAINT "items_actsched_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION;
