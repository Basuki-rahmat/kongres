ALTER TABLE `t_rekap_komparasi` ADD `geo_lat` varchar(50);--> statement-breakpoint
ALTER TABLE `t_rekap_komparasi` ADD `geo_long` varchar(50);--> statement-breakpoint
ALTER TABLE `t_rekap_komparasi` ADD `saksi_user_id` int;--> statement-breakpoint
ALTER TABLE `t_rekap_komparasi` ADD CONSTRAINT `t_rekap_komparasi_saksi_user_id_users_id_fk` FOREIGN KEY (`saksi_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;