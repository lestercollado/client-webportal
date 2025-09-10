/*
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

 Date: 10/09/2025 16:02:18
*/


-- ----------------------------
-- Table structure for WEB_USER
-- ----------------------------
DROP TABLE "CM_WEB"."WEB_USER";
CREATE TABLE "CM_WEB"."WEB_USER" (
  "USER_COD" VARCHAR2(12 CHAR) NOT NULL,
  "USER_NAM" VARCHAR2(32 CHAR),
  "COMPANY_COD" VARCHAR2(30 CHAR),
  "TELEPHONE" VARCHAR2(20 CHAR),
  "USER_PWD" VARCHAR2(32 CHAR),
  "REPEAT_COUNT" NUMBER,
  "GENDER" VARCHAR2(1 CHAR),
  "DEPARTMENT" VARCHAR2(32 CHAR),
  "ADDRESS" VARCHAR2(255 CHAR),
  "EMAIL" VARCHAR2(255 CHAR),
  "EXPIRE_DAT" DATE,
  "REC_TIM" DATE,
  "REC_NAM" VARCHAR2(32 CHAR),
  "UPD_TIM" DATE,
  "UPD_NAM" VARCHAR2(32 CHAR),
  "FAX" VARCHAR2(32 CHAR),
  "TRIGGER_BY" VARCHAR2(20 CHAR) DEFAULT '*',
  "WAN_MARK" CHAR(1 CHAR) DEFAULT '0'
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
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."USER_COD" IS 'User Code';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."USER_NAM" IS 'User Account';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."COMPANY_COD" IS 'Company Code';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."TELEPHONE" IS 'Telephone Number';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."USER_PWD" IS 'Password';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."REPEAT_COUNT" IS 'Repeat Count';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."GENDER" IS 'Gender';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."DEPARTMENT" IS 'Department';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."ADDRESS" IS 'Address';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."EMAIL" IS 'E-mail';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."EXPIRE_DAT" IS 'Expire Date';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."REC_TIM" IS 'Created On';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."REC_NAM" IS 'Creator';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."UPD_TIM" IS 'Changed On';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."UPD_NAM" IS 'Changer';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."FAX" IS 'Fax';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."TRIGGER_BY" IS 'Trigger By';
COMMENT ON COLUMN "CM_WEB"."WEB_USER"."WAN_MARK" IS 'Internet Mark';
COMMENT ON TABLE "CM_WEB"."WEB_USER" IS 'Web User';

-- ----------------------------
-- Primary Key structure for table WEB_USER
-- ----------------------------
ALTER TABLE "CM_WEB"."WEB_USER" ADD CONSTRAINT "WEB_USER_PK" PRIMARY KEY ("USER_COD");

-- ----------------------------
-- Checks structure for table WEB_USER
-- ----------------------------
ALTER TABLE "CM_WEB"."WEB_USER" ADD CONSTRAINT "SYS_C0042290" CHECK ("USER_COD" IS NOT NULL) NOT DEFERRABLE INITIALLY IMMEDIATE NORELY VALIDATE;

-- ----------------------------
-- Triggers structure for table WEB_USER
-- ----------------------------
CREATE TRIGGER "CM_WEB"."T_IDU_WEB_USER" BEFORE DELETE OR INSERT OR UPDATE ON "CM_WEB"."WEB_USER" REFERENCING OLD AS "OLD" NEW AS "NEW" FOR EACH ROW 
DECLARE
--2016.04.04 增加日志
BEGIN
   IF INSERTING
   THEN
      Add_Record (
         'WEB_USER' || ' NEW',
         :NEW.REC_nam,
            'USER_COD:'
         || :NEW.USER_COD
         || ', USER_NAM:'
         || :NEW.USER_NAM
         || ', COMPANY_COD:'
         || :NEW.COMPANY_COD
         || ', TELEPHONE:'
         || :NEW.TELEPHONE
         || ', GENDER:'
         || :NEW.GENDER
         || ', DEPARTMENT:'
         || :NEW.DEPARTMENT
         || ', ADDRESS:'
         || :NEW.ADDRESS
         || ', EMAIL:'
         || :NEW.EMAIL
         || ', FAX:'
         || :NEW.FAX
         || ', TRIGGER_BY:'
         || :NEW.TRIGGER_BY
         || ', WAN_MARK:'
         || :NEW.WAN_MARK
         || ', EXPIRE_DAT'
         || TO_CHAR (:OLD.EXPIRE_DAT)
         || ', IP:'
         || SYS_CONTEXT ('userenv', 'ip_address'));
   END IF;

   IF UPDATING
   THEN
      Add_Record (
         'WEB_USER' || ' UPDATE',
         :NEW.UPD_nam,
            'USER_COD:'
         || :OLD.USER_COD
         || '->'
         || :NEW.USER_COD
         || ', USER_NAM:'
         || :OLD.USER_NAM
         || '->'
         || :NEW.USER_NAM
         || ', COMPANY_COD:'
         || :OLD.COMPANY_COD
         || '->'
         || :NEW.COMPANY_COD
         || ', TELEPHONE:'
         || :OLD.TELEPHONE
         || '->'
         || :NEW.TELEPHONE
         || ', GENDER:'
         || :OLD.GENDER
         || '->'
         || :NEW.GENDER
         || ', DEPARTMENT:'
         || :OLD.DEPARTMENT
         || '->'
         || :NEW.DEPARTMENT
         || ', ADDRESS:'
         || :OLD.ADDRESS
         || '->'
         || :NEW.ADDRESS
         || ', EMAIL:'
         || :OLD.EMAIL
         || '->'
         || :NEW.EMAIL
         || ', FAX:'
         || :OLD.FAX
         || '->'
         || :NEW.FAX
         || ', TRIGGER_BY:'
         || :OLD.TRIGGER_BY
         || '->'
         || :NEW.TRIGGER_BY
         || ', WAN_MARK:'
         || :OLD.WAN_MARK
         || '->'
         || :NEW.WAN_MARK
         || ', EXPIRE_DAT'
         || :OLD.EXPIRE_DAT
         || '->'
         || TO_CHAR (:OLD.EXPIRE_DAT)
         || 'TIME'
         || TO_CHAR (SYSDATE)
         || '/IP:'
         || SYS_CONTEXT ('userenv', 'ip_address'));
   END IF;

   IF DELETING
   THEN
      Add_Record (
         'WEB_USER' || ' DELETE',
         :OLD.REC_nam,
            'USER_COD:'
         || :OLD.USER_COD
         || ', USER_NAM:'
         || :OLD.USER_NAM
         || ', COMPANY_COD:'
         || :OLD.COMPANY_COD
         || ', TELEPHONE:'
         || :OLD.TELEPHONE
         || ', GENDER:'
         || :OLD.GENDER
         || ', DEPARTMENT:'
         || :OLD.DEPARTMENT
         || ', ADDRESS:'
         || :OLD.ADDRESS
         || ', EMAIL:'
         || :OLD.EMAIL
         || ', EXPIRE_DAT'
         || TO_CHAR (:OLD.EXPIRE_DAT)
         || ', IP:'
         || SYS_CONTEXT ('userenv', 'ip_address'));
   END IF;
EXCEPTION
   WHEN OTHERS
   THEN
      -- Consider logging the error and then re-raise
      NULL;
END T_idu_WEB_USER;
/
