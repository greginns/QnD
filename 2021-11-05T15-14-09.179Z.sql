CREATE TABLE IF NOT EXISTS "gm"."items_Actphoto" (
"path" VARCHAR(200) NOT NULL,
"activity" VARCHAR(8) NOT NULL,
PRIMARY KEY("activity","path")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Lodgphoto" (
"path" VARCHAR(200) NOT NULL,
"lodging" VARCHAR(8) NOT NULL,
PRIMARY KEY("lodging","path")
);
CREATE TABLE IF NOT EXISTS "gm"."items_Mealphoto" (
"path" VARCHAR(200) NOT NULL,
"meal" VARCHAR(8) NOT NULL,
PRIMARY KEY("meal","path")
);
