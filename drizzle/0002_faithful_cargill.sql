CREATE TABLE `before_after_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`treatment` text DEFAULT '' NOT NULL,
	`image_url` text NOT NULL,
	`after_on_top` integer DEFAULT 1 NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
