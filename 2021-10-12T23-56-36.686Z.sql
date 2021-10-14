CREATE TABLE IF NOT EXISTS "gm"."items_Actrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgrates" (
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
"minppl" INT DEFAULT '0' NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
"minnts" INT DEFAULT '1' NOT NULL,
"minchg" FLOAT DEFAULT '0' NOT NULL,
PRIMARY KEY("lodging","rateno")
);
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actrates"
 ADD CONSTRAINT "items_actrates_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodgrates"
 ADD CONSTRAINT "items_lodgrates_lodging_fkey" FOREIGN KEY("lodging") REFERENCES "gm"."items_Lodging" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodgrates_pmtterms_fkey" FOREIGN KEY("pmtterms") REFERENCES "gm"."items_Pmtterms" ("code") ON DELETE NO ACTION;
