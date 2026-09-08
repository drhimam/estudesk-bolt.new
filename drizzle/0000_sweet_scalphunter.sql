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
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`before_state` text,
	`after_state` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`attachments` text,
	`web_search_used` integer DEFAULT false NOT NULL,
	`page_context_used` integer DEFAULT false NOT NULL,
	`token_count` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT 'New conversation' NOT NULL,
	`subject_context_ids` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deadlines` (
	`id` text PRIMARY KEY NOT NULL,
	`folder_id` text NOT NULL,
	`subject_id` text,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` integer NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`template_key` text NOT NULL,
	`subject_line` text NOT NULL,
	`html_body` text NOT NULL,
	`plain_body` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_template_key_unique` ON `email_templates` (`template_key`);--> statement-breakpoint
CREATE TABLE `extracted_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`r2_key` text,
	`r2_expires_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#4F46E5' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `generation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`material_type` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt_tokens` integer NOT NULL,
	`completion_tokens` integer NOT NULL,
	`estimated_cost_usd` real NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`latency_ms` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `material_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`material_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`config` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`source_ids` text,
	`config` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`deadline_id` text,
	`provider` text NOT NULL,
	`provider_message_id` text,
	`status` text NOT NULL,
	`error_message` text,
	`sent_at` integer,
	`delivered_at` integer,
	`opened_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deadline_id`) REFERENCES `deadlines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`weekly_digest_enabled` integer DEFAULT true NOT NULL,
	`weekly_digest_day` text DEFAULT 'monday' NOT NULL,
	`weekly_digest_time` text DEFAULT '08:00' NOT NULL,
	`deadline_alert_enabled` integer DEFAULT true NOT NULL,
	`deadline_alert_hours_before` integer DEFAULT 24 NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`email_format` text DEFAULT 'html' NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_user_id_unique` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`folder_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`generation_tier` text DEFAULT 'free' NOT NULL,
	`daily_generation_count` integer DEFAULT 0 NOT NULL,
	`monthly_generation_count` integer DEFAULT 0 NOT NULL,
	`daily_generation_reset` integer,
	`monthly_generation_reset` integer,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`assigned_by` text,
	`assigned_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP)
);
