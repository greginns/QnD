CREATE TABLE IF NOT EXISTS "gm"."avail_Activitybooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."avail_Actresbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"actres" VARCHAR(8) NOT NULL,
PRIMARY KEY("actres","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."avail_Actttotbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"actttot" VARCHAR(8) NOT NULL,
PRIMARY KEY("actttot","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."avail_Lodgingbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("lodging","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."avail_Mealbooked" (
"year" INT NOT NULL,
"month" INT NOT NULL,
"booked" JSONB NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","year","month")
);
ALTER TABLE "gm"."avail_Activitybooked"
 ADD CONSTRAINT "avail_activitybooked_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."avail_Actresbooked"
 ADD CONSTRAINT "avail_actresbooked_actres_fkey" FOREIGN KEY("actres") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."avail_Actttotbooked"
 ADD CONSTRAINT "avail_actttotbooked_actttot_fkey" FOREIGN KEY("actttot") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."avail_Lodgingbooked"
 ADD CONSTRAINT "avail_lodgingbooked_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."avail_Mealbooked"
 ADD CONSTRAINT "avail_mealbooked_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
