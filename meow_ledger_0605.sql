/*
 Navicat Premium Data Transfer

 Source Server         : kk_mysql
 Source Server Type    : MySQL
 Source Server Version : 50731
 Source Host           : localhost:3306
 Source Schema         : meow_ledger

 Target Server Type    : MySQL
 Target Server Version : 50731
 File Encoding         : 65001

 Date: 05/06/2026 17:40:51
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for account
-- ----------------------------
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账户名称',
  `icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账户图标(emoji)',
  `is_preset` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否预置账户: 0=否, 1=是',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '账户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of account
-- ----------------------------
INSERT INTO `account` VALUES (1, '现金', '💵', 1);
INSERT INTO `account` VALUES (2, '微信', '💚', 1);
INSERT INTO `account` VALUES (3, '支付宝', '🔵', 1);
INSERT INTO `account` VALUES (4, '银行卡', '💳', 1);
INSERT INTO `account` VALUES (5, 'test111', '💵', 0);

-- ----------------------------
-- Table structure for bill
-- ----------------------------
DROP TABLE IF EXISTS `bill`;
CREATE TABLE `bill`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型: income=收入, expense=支出',
  `amount` decimal(12, 2) NOT NULL COMMENT '金额',
  `category_id` int(10) UNSIGNED NOT NULL COMMENT '分类ID',
  `account_id` int(10) UNSIGNED NOT NULL COMMENT '账户ID',
  `date` date NOT NULL COMMENT '账单日期',
  `note` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_date`(`date`) USING BTREE,
  INDEX `idx_type`(`type`) USING BTREE,
  INDEX `idx_category`(`category_id`) USING BTREE,
  INDEX `idx_account`(`account_id`) USING BTREE,
  INDEX `idx_created`(`created_at`) USING BTREE,
  CONSTRAINT `fk_bill_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bill_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '账单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of bill
-- ----------------------------
INSERT INTO `bill` VALUES (1, 'expense', 1000.00, 1, 1, '2026-06-05', '', '2026-06-05 17:18:53.663');
INSERT INTO `bill` VALUES (2, 'expense', 444.00, 1, 2, '2026-06-05', '', '2026-06-05 17:19:04.642');
INSERT INTO `bill` VALUES (3, 'expense', 50.00, 1, 2, '2026-06-05', '', '2026-06-05 17:26:16.714');
INSERT INTO `bill` VALUES (4, 'expense', 8.00, 1, 2, '2026-06-05', '买咖啡', '2026-06-05 17:28:48.710');

-- ----------------------------
-- Table structure for budget
-- ----------------------------
DROP TABLE IF EXISTS `budget`;
CREATE TABLE `budget`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `month` char(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '预算月份, 格式 YYYY-MM',
  `category_id` int(10) UNSIGNED NULL DEFAULT NULL COMMENT '分类ID, NULL表示总预算',
  `amount` decimal(12, 2) NOT NULL COMMENT '预算金额',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_month_category`(`month`, `category_id`) USING BTREE,
  INDEX `fk_budget_category`(`category_id`) USING BTREE,
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '预算表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of budget
-- ----------------------------

-- ----------------------------
-- Table structure for category
-- ----------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类图标(emoji)',
  `type` enum('income','expense') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型: income=收入, expense=支出',
  `is_preset` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否预置分类: 0=否, 1=是',
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否隐藏: 0=否, 1=是',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT '排序序号, 越小越靠前',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`type`) USING BTREE,
  INDEX `idx_sort`(`sort_order`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '收支分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of category
-- ----------------------------
INSERT INTO `category` VALUES (1, '餐饮', '🍜', 'expense', 1, 0, 0);
INSERT INTO `category` VALUES (2, '交通', '🚗', 'expense', 1, 0, 1);
INSERT INTO `category` VALUES (3, '购物', '🛍️', 'expense', 1, 0, 2);
INSERT INTO `category` VALUES (4, '居住', '🏠', 'expense', 1, 0, 3);
INSERT INTO `category` VALUES (5, '娱乐', '🎮', 'expense', 1, 0, 4);
INSERT INTO `category` VALUES (6, '医疗', '💊', 'expense', 1, 0, 5);
INSERT INTO `category` VALUES (7, '教育', '📚', 'expense', 1, 0, 6);
INSERT INTO `category` VALUES (8, '通讯', '📱', 'expense', 1, 0, 7);
INSERT INTO `category` VALUES (9, '人情', '🎁', 'expense', 1, 0, 8);
INSERT INTO `category` VALUES (10, '其他', '🐱', 'expense', 1, 0, 9);
INSERT INTO `category` VALUES (11, '工资', '💰', 'income', 1, 0, 10);
INSERT INTO `category` VALUES (12, '奖金', '🏆', 'income', 1, 0, 11);
INSERT INTO `category` VALUES (13, '理财', '📈', 'income', 1, 0, 12);
INSERT INTO `category` VALUES (14, '兼职', '💼', 'income', 1, 0, 13);
INSERT INTO `category` VALUES (15, '红包', '🧧', 'income', 1, 0, 14);
INSERT INTO `category` VALUES (16, '其他', '😺', 'income', 1, 0, 15);

-- ----------------------------
-- Table structure for chat_conversation
-- ----------------------------
DROP TABLE IF EXISTS `chat_conversation`;
CREATE TABLE `chat_conversation`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新对话' COMMENT '对话标题',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI对话列表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_conversation
-- ----------------------------
INSERT INTO `chat_conversation` VALUES (1, '新对话', '2026-06-05 17:16:01.332', '2026-06-05 17:16:01.332');
INSERT INTO `chat_conversation` VALUES (2, '新对话', '2026-06-05 17:16:48.572', '2026-06-05 17:16:48.572');
INSERT INTO `chat_conversation` VALUES (3, '这个月花了多少钱？', '2026-06-05 17:19:13.441', '2026-06-05 17:19:19.600');
INSERT INTO `chat_conversation` VALUES (4, '你好，请问你可以干嘛呢?', '2026-06-05 17:21:11.921', '2026-06-05 17:21:40.264');
INSERT INTO `chat_conversation` VALUES (5, '帮我记一笔餐饮支出50元', '2026-06-05 17:26:06.030', '2026-06-05 17:26:19.978');

-- ----------------------------
-- Table structure for chat_message
-- ----------------------------
DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` int(10) UNSIGNED NOT NULL COMMENT '对话ID',
  `role` enum('user','assistant','system','tool') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息角色',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息内容',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_conversation_id`(`conversation_id`) USING BTREE,
  CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI聊天消息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_message
-- ----------------------------
INSERT INTO `chat_message` VALUES (1, 1, 'user', '这个月花了多少钱？', '2026-06-05 17:16:01.647');
INSERT INTO `chat_message` VALUES (2, 3, 'user', '这个月花了多少钱？', '2026-06-05 17:19:13.463');
INSERT INTO `chat_message` VALUES (3, 3, 'assistant', '这个月（6月）截至目前，你已经花了 **¥1444.00** 💸\n\n不过现在是6月5号，月初才过了5天，所以这只是前几天的开销。目前还没有收入进账，结余是 **-¥1444.00**。\n\n需要我帮你看看具体花在哪些地方了吗？🔍', '2026-06-05 17:19:19.596');
INSERT INTO `chat_message` VALUES (4, 4, 'user', '你好，请问你可以干嘛呢?', '2026-06-05 17:21:33.556');
INSERT INTO `chat_message` VALUES (5, 4, 'assistant', '喵～你好呀！我是喵喵记账的AI助手 🐱，可以帮你做很多事情哦：\n\n---\n\n📊 **查账 & 分析**\n- 查看**月度收支汇总**，了解总收入、总支出和结余\n- 按**分类统计**（餐饮、交通、购物…），看看钱都花哪儿了\n- 查看**每日趋势**和**年度趋势**，掌握消费规律\n- 查询**支出排行**，揪出最大的\"吞金兽\"\n\n💰 **预算管理**\n- 查看**预算使用情况**，帮你守住钱包底线\n- 超支预警，提醒你及时刹车 🚨\n\n📝 **快速记账**\n- 告诉我\"花了多少、花在哪儿\"，我帮你一键记录\n- 支持收入/支出、分类、账户、备注等完整信息\n\n💳 **账户余额**\n- 查看各账户余额，心里有数\n\n---\n\n简单说，你只要告诉我你想查什么、记什么，剩下的交给我就好～ 现在就试试吧！有什么想了解的嘛？😸', '2026-06-05 17:21:40.261');
INSERT INTO `chat_message` VALUES (6, 5, 'user', '帮我记一笔餐饮支出50元', '2026-06-05 17:26:06.051');
INSERT INTO `chat_message` VALUES (7, 5, 'assistant', '已记好啦！📝\n\n| 项目 | 详情 |\n|------|------|\n| 🏷️ 分类 | 餐饮 |\n| 💰 金额 | ¥50.00 |\n| 📅 日期 | 2026-06-05 |\n| 📌 类型 | 支出 |\n\n还有什么需要我帮忙的吗？比如查一下这个月的餐饮花了多少，或者看看预算还剩多少～ 🐱', '2026-06-05 17:26:19.974');
INSERT INTO `chat_message` VALUES (8, 5, 'user', '我今天买了杯咖啡，8块钱', '2026-06-05 17:28:45.228');
INSERT INTO `chat_message` VALUES (9, 5, 'assistant', '记好啦！✅\n\n| 项目 | 详情 |\n|------|------|\n| 🏷️ 分类 | 餐饮 |\n| 💰 金额 | ¥8.00 |\n| 📅 日期 | 2026-06-05 |\n| 📝 备注 | 买咖啡 |\n\n今天餐饮已经记了两笔啦，合计 ¥58.00～ 继续享受你的咖啡吧 ☕😺', '2026-06-05 17:28:51.585');

SET FOREIGN_KEY_CHECKS = 1;
