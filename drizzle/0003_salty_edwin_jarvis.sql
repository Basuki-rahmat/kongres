CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`reference_id` varchar(50),
	`reference_type` varchar(50),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_notif_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notif_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notif_type` ON `notifications` (`type`);