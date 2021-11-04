CREATE TABLE IF NOT EXISTS "gm"."items_Mealreseller" (
"reseller" VARCHAR(65) NOT NULL,
"rateno" INT NOT NULL,
"comm" FLOAT NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","reseller")
);
ALTER TABLE "gm"."items_Mealreseller"
 ADD CONSTRAINT "items_mealreseller_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_mealreseller_mealrates_fkey" FOREIGN KEY("meal","rateno") REFERENCES "gm"."items_Mealrates" ("meal","rateno") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_mealreseller_reseller_fkey" FOREIGN KEY("reseller") REFERENCES "gm"."items_Reseller" ("code") ON DELETE NO ACTION;
