CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttott1" VARCHAR(8) NULL,
"acttott2" VARCHAR(8) NULL,
"acttott3" VARCHAR(8) NULL,
"acttott4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("actttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("actttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("actttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("actttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
