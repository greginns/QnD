CREATE TABLE IF NOT EXISTS "gm"."items_Actinclm" (
"activity" VARCHAR(8) NOT NULL,
"rateno" INT NOT NULL,
"seq" INT NOT NULL,
"day" INT NOT NULL,
"dur" INT NOT NULL,
"offset" INT NOT NULL,
"meal" VARCHAR(8) NOT NULL,
"mealrate" INT NOT NULL,
PRIMARY KEY("activity","rateno","seq")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodginclm" (
"lodging" VARCHAR(8) NOT NULL,
"rateno" INT NOT NULL,
"seq" INT NOT NULL,
"day" INT NOT NULL,
"dur" INT NOT NULL,
"meal" VARCHAR(8) NOT NULL,
"mealrate" INT NOT NULL,
PRIMARY KEY("lodging","rateno","seq")
);
ALTER TABLE "gm"."items_Lodginclm"
 ADD CONSTRAINT "items_lodginclm_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodginclm_lodgrates_fkey" FOREIGN KEY("lodging","rateno") REFERENCES "gm"."items_Lodgrates" ("lodging","rateno") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodginclm_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodginclm_mealrates_fkey" FOREIGN KEY("meal","mealrate") REFERENCES "gm"."items_Mealrates" ("meal","rateno") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actinclm"
 ADD CONSTRAINT "items_actinclm_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actinclm_actrates_fkey" FOREIGN KEY("activity","rateno") REFERENCES "gm"."items_Actrates" ("activity","rateno") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actinclm_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actinclm_mealrates_fkey" FOREIGN KEY("meal","mealrate") REFERENCES "gm"."items_Mealrates" ("meal","rateno") ON DELETE NO ACTION;
