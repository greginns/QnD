CREATE TABLE IF NOT EXISTS "gm"."items_Meals" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"company" VARCHAR(1) NULL,
"areaphy" VARCHAR(2) NULL,
"areadir" VARCHAR(2) NULL,
"minage" INT DEFAULT '12' NULL,
"allowinf" BOOLEAN DEFAULT 'true',
"allowchl" BOOLEAN DEFAULT 'true',
"allowyth" BOOLEAN DEFAULT 'true',
"allowadl" BOOLEAN DEFAULT 'true',
"allowsen" BOOLEAN DEFAULT 'true',
"online" BOOLEAN DEFAULT 'true',
"homepage" VARCHAR(100) NULL,
"tandc" TEXT NULL,
"rsvmsg" TEXT NULL,
"oninv" BOOLEAN DEFAULT 'true',
"invmsg" TEXT NULL,
"waiver" VARCHAR(10) NULL,
"lastday" INT DEFAULT '0' NULL,
"lasttime" TIME WITHOUT TIME ZONE NULL,
"gl1" VARCHAR(20) NULL,
"gl2" VARCHAR(20) NULL,
"gl3" VARCHAR(20) NULL,
"gl4" VARCHAR(20) NULL,
"gl1amt" FLOAT DEFAULT '0' NULL,
"gl2amt" FLOAT DEFAULT '0' NULL,
"gl3amt" FLOAT DEFAULT '0' NULL,
"gl4amt" FLOAT DEFAULT '0' NULL,
"gl1perc" BOOLEAN DEFAULT 'true',
"gl2perc" BOOLEAN DEFAULT 'true',
"gl3perc" BOOLEAN DEFAULT 'true',
"gl4perc" BOOLEAN DEFAULT 'true',
"commgl" VARCHAR(20) NULL,
"tax1" VARCHAR(20) NULL,
"tax2" VARCHAR(20) NULL,
"tax3" VARCHAR(20) NULL,
"tax4" VARCHAR(20) NULL,
"meallocn" VARCHAR(8) NOT NULL,
"mealtype" VARCHAR(8) NOT NULL,
"durdays" INT DEFAULT '1' NULL,
"arroffset" INT DEFAULT '0' NULL,
"lastoffset" FLOAT DEFAULT '0' NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Mealrates" (
"rateno" INT NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"pricelevel" VARCHAR(8) NOT NULL,
"pmtterms" VARCHAR(8) NOT NULL,
"privilege" VARCHAR(5) DEFAULT 'rsvsA' NOT NULL,
"ratebase1" VARCHAR(5) DEFAULT 'P' NOT NULL,
"ratebase2" VARCHAR(5) DEFAULT 'F' NOT NULL,
"currency" VARCHAR(3) DEFAULT 'CAD' NOT NULL,
"addlppl" INT DEFAULT '0' NOT NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Mealprices" (
"rateno" INT NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"prices" JSONB NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","rateno","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Mealminp" (
"rateno" INT NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"minppl" JSONB NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","rateno","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Mealsched" (
"meal" VARCHAR(8) NOT NULL,
"year" INT NOT NULL,
"month" INT NOT NULL,
"sched" JSONB NULL,
PRIMARY KEY("meal","year","month")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Meallocn" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Mealtype" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
ALTER TABLE "gm"."items_Meals"
 ADD CONSTRAINT "items_meals_company_fkey" FOREIGN KEY("company") REFERENCES "gm"."contacts_Company" ("id") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_areaphy_fkey" FOREIGN KEY("areaphy") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_areadir_fkey" FOREIGN KEY("areadir") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_gl1_fkey" FOREIGN KEY("gl1") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_gl2_fkey" FOREIGN KEY("gl2") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_gl3_fkey" FOREIGN KEY("gl3") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_gl4_fkey" FOREIGN KEY("gl4") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_commgl_fkey" FOREIGN KEY("commgl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_tax1_fkey" FOREIGN KEY("tax1") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_tax2_fkey" FOREIGN KEY("tax2") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_tax3_fkey" FOREIGN KEY("tax3") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_tax4_fkey" FOREIGN KEY("tax4") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_waiver_fkey" FOREIGN KEY("waiver") REFERENCES "gm"."items_Waiver" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_meallocn_fkey" FOREIGN KEY("meallocn") REFERENCES "gm"."items_Meallocn" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_meals_mealtype_fkey" FOREIGN KEY("mealtype") REFERENCES "gm"."items_Mealtype" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Mealrates"
 ADD CONSTRAINT "items_mealrates_pricelevel_fkey" FOREIGN KEY("pricelevel") REFERENCES "gm"."items_Pricelevel" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_mealrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_mealrates_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Mealprices"
 ADD CONSTRAINT "items_mealprices_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Mealminp"
 ADD CONSTRAINT "items_mealminp_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Mealsched"
 ADD CONSTRAINT "items_mealsched_meal_fkey" FOREIGN KEY("meal") REFERENCES "gm"."items_Meals" ("code") ON DELETE NO ACTION;
