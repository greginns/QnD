CREATE TABLE IF NOT EXISTS "gm"."items_Template" (
"code" VARCHAR(8) NOT NULL,
"name" VARCHAR(50) NOT NULL,
"active" BOOLEAN DEFAULT 'true',
"html" TEXT NULL,
PRIMARY KEY("code")
);
