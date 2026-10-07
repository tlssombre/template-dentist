CREATE TABLE `calendar_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_blocks_date_time_unique` ON `calendar_blocks` (`date`,`time`);--> statement-breakpoint
CREATE TABLE `staff_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_accounts_email_unique` ON `staff_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `weekly_hours` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`is_open` integer DEFAULT 1 NOT NULL,
	`start_time` text DEFAULT '09:00' NOT NULL,
	`end_time` text DEFAULT '17:00' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `scheduled_date` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `slot_time` text;--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_confirmed_slot_unique` ON `appointments` (`scheduled_date`,`slot_time`) WHERE status IN ('confirmed','completed') AND scheduled_date IS NOT NULL AND slot_time IS NOT NULL;