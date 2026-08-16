CREATE TABLE `meal_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`meal_type` text NOT NULL,
	`photo_uri` text,
	`name` text NOT NULL,
	`calories` integer NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`confidence` real,
	`source` text DEFAULT 'manual' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nutrition_day_reports` (
	`date` text PRIMARY KEY NOT NULL,
	`report_text` text NOT NULL,
	`generated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nutrition_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`height_cm` real,
	`current_weight_kg` real,
	`target_weight_kg` real,
	`goal` text,
	`weight_unit_override` text,
	`daily_calorie_target` integer,
	`daily_protein_g` real,
	`daily_carbs_g` real,
	`daily_fat_g` real,
	`weekly_budget` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`dietary_preferences` text,
	`dietary_restrictions` text,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`week_start_date` text NOT NULL,
	`items_json` text DEFAULT '[]' NOT NULL,
	`estimated_total` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`generated_at` text DEFAULT (current_timestamp) NOT NULL
);
