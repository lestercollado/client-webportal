TAM/*
 Navicat Premium Dump SQL

 Source Server         : TOS_Test
 Source Server Type    : Oracle
 Source Server Version : 110200 (Oracle Database 11g Enterprise Edition Release 11.2.0.1.0 - 64bit Production
With the Partitioning, OLAP, Data Mining and Real Application Testing options)
 Source Host           : 10.0.1.61:1521
 Source Schema         : CM_WEB

 Target Server Type    : Oracle
 Target Server Version : 110200 (Oracle Database 11g Enterprise Edition Release 11.2.0.1.0 - 64bit Production
With the Partitioning, OLAP, Data Mining and Real Application Testing options)
 File Encoding         : 65001

 Date: 10/09/2025 16:49:12
*/


-- ----------------------------
-- Table structure for RE_USER_ROLE
-- ----------------------------
DROP TABLE "CM_WEB"."RE_USER_ROLE";
CREATE TABLE "CM_WEB"."RE_USER_ROLE" (
  "ID" VARCHAR2(32 CHAR) NOT NULL,
  "USER_COD" VARCHAR2(12 CHAR),
  "ROLE_COD" VARCHAR2(16 CHAR)
)
LOGGING
NOCOMPRESS
PCTFREE 10
INITRANS 1
STORAGE (
  INITIAL 65536 
  NEXT 1048576 
  MINEXTENTS 1
  MAXEXTENTS 2147483645
  BUFFER_POOL DEFAULT
)
PARALLEL 1
NOCACHE
DISABLE ROW MOVEMENT
;
COMMENT ON COLUMN "CM_WEB"."RE_USER_ROLE"."ID" IS 'ID';
COMMENT ON COLUMN "CM_WEB"."RE_USER_ROLE"."USER_COD" IS 'User Code';
COMMENT ON COLUMN "CM_WEB"."RE_USER_ROLE"."ROLE_COD" IS 'Group Code';
COMMENT ON TABLE "CM_WEB"."RE_USER_ROLE" IS 'Relation between User and Group';

-- ----------------------------
-- Primary Key structure for table RE_USER_ROLE
-- ----------------------------
ALTER TABLE "CM_WEB"."RE_USER_ROLE" ADD CONSTRAINT "RE_USER_ROLE_PK" PRIMARY KEY ("ID");
