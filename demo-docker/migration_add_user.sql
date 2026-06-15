-- ============================================================
-- 喵喵记账 用户系统迁移脚本
-- 增量添加 user 表，并为现有业务表增加 user_id 列
-- ============================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(32)  NOT NULL COMMENT '用户名',
  `password`   VARCHAR(255) NOT NULL COMMENT '密码(bcrypt哈希)',
  `nickname`   VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '昵称',
  `avatar`     VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像URL',
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 为已有表添加 user_id 列（增量，不破坏原有数据）

ALTER TABLE `category`   ADD COLUMN `user_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID, 0=预置共享';
ALTER TABLE `account`    ADD COLUMN `user_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID, 0=预置共享';
ALTER TABLE `bill`       ADD COLUMN `user_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID';
ALTER TABLE `budget`     ADD COLUMN `user_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID';
ALTER TABLE `chat_conversation` ADD COLUMN `user_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID';

-- 3. 为 user_id 添加索引
ALTER TABLE `category`   ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `account`    ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `bill`       ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `budget`     ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `chat_conversation` ADD INDEX `idx_user_id` (`user_id`);

-- 4. 添加外键（可选，按需启用）
-- ALTER TABLE `category`   ADD CONSTRAINT `fk_category_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `account`    ADD CONSTRAINT `fk_account_user`  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `bill`       ADD CONSTRAINT `fk_bill_user`      FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `budget`     ADD CONSTRAINT `fk_budget_user`    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `chat_conversation` ADD CONSTRAINT `fk_conversation_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;