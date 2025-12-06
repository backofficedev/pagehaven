CREATE TABLE `domain_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`domain` text NOT NULL,
	`verification_token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`last_checked_at` integer,
	`verified_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domain_verification_domain_unique` ON `domain_verification` (`domain`);--> statement-breakpoint
CREATE INDEX `domain_site_idx` ON `domain_verification` (`site_id`);--> statement-breakpoint
CREATE INDEX `domain_status_idx` ON `domain_verification` (`status`);--> statement-breakpoint
CREATE TABLE `site_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`path` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`unique_visitors` integer DEFAULT 0 NOT NULL,
	`bandwidth` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `analytics_site_date_idx` ON `site_analytics` (`site_id`,`date`);--> statement-breakpoint
CREATE INDEX `analytics_site_path_idx` ON `site_analytics` (`site_id`,`path`);--> statement-breakpoint
CREATE TABLE `api_key` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`key_prefix` text NOT NULL,
	`scopes` text DEFAULT '*' NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_key_hash_unique` ON `api_key` (`key_hash`);--> statement-breakpoint
CREATE INDEX `api_key_user_idx` ON `api_key` (`user_id`);--> statement-breakpoint
CREATE INDEX `api_key_hash_idx` ON `api_key` (`key_hash`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `github_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`github_user_id` text NOT NULL,
	`github_username` text NOT NULL,
	`github_avatar_url` text,
	`access_token` text NOT NULL,
	`scopes` text DEFAULT 'repo' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_connection_user_id_unique` ON `github_connection` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_connection_github_user_id_unique` ON `github_connection` (`github_user_id`);--> statement-breakpoint
CREATE INDEX `github_connection_user_idx` ON `github_connection` (`user_id`);--> statement-breakpoint
CREATE INDEX `github_connection_github_user_idx` ON `github_connection` (`github_user_id`);--> statement-breakpoint
CREATE TABLE `site_github_config` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`repo_owner` text NOT NULL,
	`repo_name` text NOT NULL,
	`repo_branch` text DEFAULT 'main' NOT NULL,
	`repo_full_name` text NOT NULL,
	`build_command` text,
	`output_directory` text DEFAULT 'dist' NOT NULL,
	`install_command` text,
	`auto_deploy` integer DEFAULT true NOT NULL,
	`webhook_secret` text NOT NULL,
	`last_deployed_commit` text,
	`last_deployed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_github_config_site_id_unique` ON `site_github_config` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_github_config_site_idx` ON `site_github_config` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_github_config_repo_idx` ON `site_github_config` (`repo_full_name`);--> statement-breakpoint
CREATE TABLE `deployment` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`storage_path` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`file_count` integer DEFAULT 0,
	`total_size` integer DEFAULT 0,
	`commit_hash` text,
	`commit_message` text,
	`deployed_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deployed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `deployment_site_idx` ON `deployment` (`site_id`);--> statement-breakpoint
CREATE INDEX `deployment_status_idx` ON `deployment` (`status`);--> statement-breakpoint
CREATE INDEX `deployment_site_created_idx` ON `deployment` (`site_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `site` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subdomain` text NOT NULL,
	`custom_domain` text,
	`description` text,
	`active_deployment_id` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_subdomain_unique` ON `site` (`subdomain`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_custom_domain_unique` ON `site` (`custom_domain`);--> statement-breakpoint
CREATE INDEX `site_subdomain_idx` ON `site` (`subdomain`);--> statement-breakpoint
CREATE INDEX `site_custom_domain_idx` ON `site` (`custom_domain`);--> statement-breakpoint
CREATE INDEX `site_created_by_idx` ON `site` (`created_by`);--> statement-breakpoint
CREATE TABLE `site_access` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`access_type` text DEFAULT 'public' NOT NULL,
	`password_hash` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_access_site_id_unique` ON `site_access` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_access_site_idx` ON `site_access` (`site_id`);--> statement-breakpoint
CREATE TABLE `site_invite` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`invited_by` text NOT NULL,
	`expires_at` integer,
	`accepted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `site_invite_site_idx` ON `site_invite` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_invite_email_idx` ON `site_invite` (`email`);--> statement-breakpoint
CREATE INDEX `site_invite_site_email_idx` ON `site_invite` (`site_id`,`email`);--> statement-breakpoint
CREATE TABLE `site_member` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`invited_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `site_member_site_idx` ON `site_member` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_member_user_idx` ON `site_member` (`user_id`);--> statement-breakpoint
CREATE INDEX `site_member_site_user_idx` ON `site_member` (`site_id`,`user_id`);