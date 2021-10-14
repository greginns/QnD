CREATE TABLE IF NOT EXISTS "gm"."items_Activity" (
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
"actgroup" VARCHAR(10) NULL,
"durdays" INT DEFAULT '1' NULL,
"durhours" INT DEFAULT '6' NULL,
"multi" BOOLEAN DEFAULT 'false',
"assign" VARCHAR(1) DEFAULT 'B' NULL,
"arroffset" INT DEFAULT '0' NULL,
"lastoffset" FLOAT DEFAULT '0' NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodging" (
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
"lodglocn" VARCHAR(10) NULL,
"lodgtype" VARCHAR(10) NULL,
"unitized" BOOLEAN DEFAULT 'true' NULL,
"checkin" TIME WITHOUT TIME ZONE NULL,
"checkout" TIME WITHOUT TIME ZONE NULL,
"maxppl" INT DEFAULT '0' NULL,
"unitinv" BOOLEAN DEFAULT 'true' NULL,
"bookbeds" BOOLEAN DEFAULT 'true' NULL,
"assign" VARCHAR(1) DEFAULT 'B' NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actgroup" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
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
"acttot1" VARCHAR(8) NULL,
"acttot2" VARCHAR(8) NULL,
"acttot3" VARCHAR(8) NULL,
"acttot4" VARCHAR(8) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actres" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Actttot" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodglocn" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgtype" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Area" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"latitude" FLOAT NULL,
"longitude" FLOAT NULL,
"dirlink" VARCHAR(100) NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Waiver" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"text" TEXT NULL,
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Glcode" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Tax" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"base" VARCHAR(2) DEFAULT '%' NULL,
"effwhen" VARCHAR(2) DEFAULT 'A' NULL,
"isgovt" BOOLEAN DEFAULT 'true',
"gl" VARCHAR(20) NULL,
"exemptable" BOOLEAN DEFAULT 'true',
"tier1min" FLOAT DEFAULT 'null' NULL,
"tier1max" FLOAT DEFAULT 'null' NULL,
"tier2min" FLOAT DEFAULT 'null' NULL,
"tier2max" FLOAT DEFAULT 'null' NULL,
"tier3min" FLOAT DEFAULT 'null' NULL,
"tier3max" FLOAT DEFAULT 'null' NULL,
"tier4min" FLOAT DEFAULT 'null' NULL,
"tier4max" FLOAT DEFAULT 'null' NULL,
PRIMARY KEY("code")
);
ALTER TABLE "gm"."items_Activity"
 ADD CONSTRAINT "items_activity_actgroup_fkey" FOREIGN KEY("actgroup") REFERENCES "gm"."items_Actgroup" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_areaphy_fkey" FOREIGN KEY("areaphy") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_areadir_fkey" FOREIGN KEY("areadir") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl1_fkey" FOREIGN KEY("gl1") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl2_fkey" FOREIGN KEY("gl2") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl3_fkey" FOREIGN KEY("gl3") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl4_fkey" FOREIGN KEY("gl4") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_commgl_fkey" FOREIGN KEY("commgl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax1_fkey" FOREIGN KEY("tax1") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax2_fkey" FOREIGN KEY("tax2") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax3_fkey" FOREIGN KEY("tax3") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax4_fkey" FOREIGN KEY("tax4") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_waiver_fkey" FOREIGN KEY("waiver") REFERENCES "gm"."items_Waiver" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Activity"
 ADD CONSTRAINT "items_activity_actgroup_fkey" FOREIGN KEY("actgroup") REFERENCES "gm"."items_Actgroup" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_areaphy_fkey" FOREIGN KEY("areaphy") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_areadir_fkey" FOREIGN KEY("areadir") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl1_fkey" FOREIGN KEY("gl1") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl2_fkey" FOREIGN KEY("gl2") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl3_fkey" FOREIGN KEY("gl3") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_gl4_fkey" FOREIGN KEY("gl4") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_commgl_fkey" FOREIGN KEY("commgl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax1_fkey" FOREIGN KEY("tax1") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax2_fkey" FOREIGN KEY("tax2") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax3_fkey" FOREIGN KEY("tax3") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_tax4_fkey" FOREIGN KEY("tax4") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_activity_waiver_fkey" FOREIGN KEY("waiver") REFERENCES "gm"."items_Waiver" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodging"
 ADD CONSTRAINT "items_lodging_lodglocn_fkey" FOREIGN KEY("lodglocn") REFERENCES "gm"."items_Lodglocn" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_lodgtype_fkey" FOREIGN KEY("lodgtype") REFERENCES "gm"."items_Lodgtype" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_areadir_fkey" FOREIGN KEY("areadir") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl1_fkey" FOREIGN KEY("gl1") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl2_fkey" FOREIGN KEY("gl2") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl3_fkey" FOREIGN KEY("gl3") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl4_fkey" FOREIGN KEY("gl4") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_commgl_fkey" FOREIGN KEY("commgl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax1_fkey" FOREIGN KEY("tax1") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax2_fkey" FOREIGN KEY("tax2") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax3_fkey" FOREIGN KEY("tax3") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax4_fkey" FOREIGN KEY("tax4") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_waiver_fkey" FOREIGN KEY("waiver") REFERENCES "gm"."items_Waiver" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Lodging"
 ADD CONSTRAINT "items_lodging_lodglocn_fkey" FOREIGN KEY("lodglocn") REFERENCES "gm"."items_Lodglocn" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_lodgtype_fkey" FOREIGN KEY("lodgtype") REFERENCES "gm"."items_Lodgtype" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_areadir_fkey" FOREIGN KEY("areadir") REFERENCES "gm"."items_Area" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl1_fkey" FOREIGN KEY("gl1") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl2_fkey" FOREIGN KEY("gl2") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl3_fkey" FOREIGN KEY("gl3") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_gl4_fkey" FOREIGN KEY("gl4") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_commgl_fkey" FOREIGN KEY("commgl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax1_fkey" FOREIGN KEY("tax1") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax2_fkey" FOREIGN KEY("tax2") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax3_fkey" FOREIGN KEY("tax3") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_tax4_fkey" FOREIGN KEY("tax4") REFERENCES "gm"."items_Tax" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_lodging_waiver_fkey" FOREIGN KEY("waiver") REFERENCES "gm"."items_Waiver" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Actdaily"
 ADD CONSTRAINT "items_actdaily_actres1_fkey" FOREIGN KEY("actres1") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres2_fkey" FOREIGN KEY("actres2") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres3_fkey" FOREIGN KEY("actres3") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actres4_fkey" FOREIGN KEY("actres4") REFERENCES "gm"."items_Actres" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot1_fkey" FOREIGN KEY("acttot1") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot2_fkey" FOREIGN KEY("acttot2") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot3_fkey" FOREIGN KEY("acttot3") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION,
 ADD CONSTRAINT "items_actdaily_actttot4_fkey" FOREIGN KEY("acttot4") REFERENCES "gm"."items_Actttot" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Tax"
 ADD CONSTRAINT "items_tax_gl_fkey" FOREIGN KEY("gl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION;
ALTER TABLE "gm"."items_Tax"
 ADD CONSTRAINT "items_tax_gl_fkey" FOREIGN KEY("gl") REFERENCES "gm"."items_Glcode" ("code") ON DELETE NO ACTION;
