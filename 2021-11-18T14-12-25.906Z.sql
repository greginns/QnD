CREATE TABLE IF NOT EXISTS "gm"."reservations_Cancreas" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
CREATE TABLE IF NOT EXISTS "gm"."reservations_Discount" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"basis" VARCHAR(2) DEFAULT '%' NOT NULL,
"amount" NUMERIC(10,2) DEFAULT '0.00' NULL,
"maxdisc" NUMERIC(10,2) DEFAULT '0.00' NULL,
"privilege" VARCHAR(5) DEFAULT 'rsvsA' NOT NULL,
"online" BOOLEAN DEFAULT 'true',
"active" BOOLEAN DEFAULT 'true',
PRIMARY KEY("code")
);
