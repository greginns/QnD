CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actdaily" (
"activity" VARCHAR(8) NOT NULL,
"dayno" INT NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"actres1" VARCHAR(8) NULL,
"actres2" VARCHAR(8) NULL,
"actres3" VARCHAR(8) NULL,
"actres4" VARCHAR(8) NULL,
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("activity","dayno")
);
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_activity_fkey" FOREIGN KEY("activity") REFERENCES "gm"."items_Activity" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
