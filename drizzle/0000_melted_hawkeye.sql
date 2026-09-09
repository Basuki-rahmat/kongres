CREATE TABLE `desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kecamatan_id` int,
	`nama` varchar(100) NOT NULL,
	`kode` varchar(10),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `desa_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kabupaten` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provinsi_id` int,
	`nama` varchar(100) NOT NULL,
	`kode` varchar(10),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `kabupaten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kecamatan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kabupaten_id` int,
	`nama` varchar(100) NOT NULL,
	`kode` varchar(10),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `kecamatan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengurus_anak_ranting` (
	`id` int AUTO_INCREMENT NOT NULL,
	`desa_id` int NOT NULL,
	`nama` varchar(255) NOT NULL,
	`jabatan` varchar(100) NOT NULL,
	`nik` varchar(16),
	`no_kta` varchar(50),
	`no_hp` varchar(20),
	`alamat` text,
	`foto_url` varchar(255),
	`file_sk_url` varchar(255),
	`periode_mulai` int,
	`periode_selesai` int,
	`status_aktif` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pengurus_anak_ranting_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengurus_dpc` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kabupaten_id` int NOT NULL,
	`nama` varchar(255) NOT NULL,
	`jabatan` varchar(100) NOT NULL,
	`nik` varchar(16),
	`no_kta` varchar(50),
	`no_hp` varchar(20),
	`alamat` text,
	`foto_url` varchar(255),
	`file_sk_url` varchar(255),
	`periode_mulai` int,
	`periode_selesai` int,
	`status_aktif` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pengurus_dpc_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengurus_dpd` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provinsi_id` int NOT NULL,
	`nama` varchar(255) NOT NULL,
	`jabatan` varchar(100) NOT NULL,
	`nik` varchar(16),
	`no_kta` varchar(50),
	`no_hp` varchar(20),
	`alamat` text,
	`foto_url` varchar(255),
	`file_sk_url` varchar(255),
	`periode_mulai` int,
	`periode_selesai` int,
	`status_aktif` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pengurus_dpd_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengurus_pac` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kecamatan_id` int NOT NULL,
	`nama` varchar(255) NOT NULL,
	`jabatan` varchar(100) NOT NULL,
	`nik` varchar(16),
	`no_kta` varchar(50),
	`no_hp` varchar(20),
	`alamat` text,
	`foto_url` varchar(255),
	`file_sk_url` varchar(255),
	`periode_mulai` int,
	`periode_selesai` int,
	`status_aktif` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pengurus_pac_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provinsi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(100) NOT NULL,
	CONSTRAINT `provinsi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `t_rekap_komparasi` (
	`id_tps` varchar(20) NOT NULL,
	`provinsi` varchar(100) NOT NULL,
	`kab_kota` varchar(100) NOT NULL,
	`kecamatan` varchar(100) NOT NULL,
	`kelurahan` varchar(100) NOT NULL,
	`no_tps` int NOT NULL,
	`suara_partai_saksi` int DEFAULT 0,
	`suara_caleg_total_saksi` int DEFAULT 0,
	`total_suara_internal` int GENERATED ALWAYS AS (`suara_partai_saksi` + `suara_caleg_total_saksi`) STORED,
	`file_c1_plano_url` varchar(255),
	`input_saksi_timestamp` timestamp,
	`suara_partai_kpu` int DEFAULT 0,
	`suara_caleg_total_kpu` int DEFAULT 0,
	`total_suara_kpu` int DEFAULT 0,
	`last_scrape_timestamp` timestamp,
	`selisih_suara` int GENERATED ALWAYS AS ((`suara_partai_saksi` + `suara_caleg_total_saksi`) - `total_suara_kpu`) STORED,
	`status_anomali` varchar(30) DEFAULT 'BELUM_TERVERIFIKASI',
	`catatan_hukum` text,
	CONSTRAINT `t_rekap_komparasi_id_tps` PRIMARY KEY(`id_tps`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `desa` ADD CONSTRAINT `desa_kecamatan_id_kecamatan_id_fk` FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kabupaten` ADD CONSTRAINT `kabupaten_provinsi_id_provinsi_id_fk` FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kecamatan` ADD CONSTRAINT `kecamatan_kabupaten_id_kabupaten_id_fk` FOREIGN KEY (`kabupaten_id`) REFERENCES `kabupaten`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengurus_anak_ranting` ADD CONSTRAINT `pengurus_anak_ranting_desa_id_desa_id_fk` FOREIGN KEY (`desa_id`) REFERENCES `desa`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengurus_dpc` ADD CONSTRAINT `pengurus_dpc_kabupaten_id_kabupaten_id_fk` FOREIGN KEY (`kabupaten_id`) REFERENCES `kabupaten`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengurus_dpd` ADD CONSTRAINT `pengurus_dpd_provinsi_id_provinsi_id_fk` FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengurus_pac` ADD CONSTRAINT `pengurus_pac_kecamatan_id_kecamatan_id_fk` FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_desa_kecamatan` ON `desa` (`kecamatan_id`);--> statement-breakpoint
CREATE INDEX `idx_kabupaten_provinsi` ON `kabupaten` (`provinsi_id`);--> statement-breakpoint
CREATE INDEX `idx_kecamatan_kabupaten` ON `kecamatan` (`kabupaten_id`);--> statement-breakpoint
CREATE INDEX `idx_pengurus_ranting_desa` ON `pengurus_anak_ranting` (`desa_id`);--> statement-breakpoint
CREATE INDEX `idx_pengurus_dpc_kabupaten` ON `pengurus_dpc` (`kabupaten_id`);--> statement-breakpoint
CREATE INDEX `idx_pengurus_dpd_provinsi` ON `pengurus_dpd` (`provinsi_id`);--> statement-breakpoint
CREATE INDEX `idx_pengurus_pac_kecamatan` ON `pengurus_pac` (`kecamatan_id`);--> statement-breakpoint
CREATE INDEX `idx_status_anomali` ON `t_rekap_komparasi` (`status_anomali`);--> statement-breakpoint
CREATE INDEX `idx_wilayah` ON `t_rekap_komparasi` (`provinsi`,`kab_kota`,`kecamatan`);