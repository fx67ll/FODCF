<template>
  <!--
    通知公告撰写/编辑弹窗（首页通知公告面板快捷发布入口）
    :visible.sync 双向绑定控制显示/隐藏
    :model 传入待编辑的公告行（无 noticeId 视为新增，保存即直接上架发布）
    编辑时通过 getNotice 拉取完整内容（列表行不含 noticeContent）
    样式对齐 MemoEditDialog：custom-class + 圆角 + 统一头尾
  -->
  <el-dialog :visible.sync="dialogVisible" :close-on-click-modal="false" :show-close="true" width="760px"
    :style="`top: ${dialogTop}`" append-to-body custom-class="notice-compose-dialog" @open="handleOpen">
    <template slot="title">
      <div class="notice-letterhead">
        <div class="letterhead-stamp"><i class="el-icon-bell"></i></div>
        <div class="letterhead-copy">
          <span class="letterhead-kicker">NOTICE BOARD · FODCF</span>
          <strong class="letterhead-title">{{ dialogTitle }}</strong>
        </div>
      </div>
    </template>

    <!-- 标题 + 类型同行排布压缩高度；标签统一不换行 -->
    <el-form ref="form" :model="form" :rules="rules" label-width="72px" class="notice-compose-form" v-loading="fetching"
      @submit.native.prevent>
      <el-row :gutter="16">
        <el-col :span="15">
          <el-form-item label="公告标题" prop="noticeTitle">
            <el-input v-model="form.noticeTitle" placeholder="一句话说明这次要通知什么" maxlength="60" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="9">
          <el-form-item label="公告类型" prop="noticeType">
            <el-radio-group v-model="form.noticeType">
              <el-radio v-for="dict in dict.type.sys_notice_type" :key="dict.value" :label="dict.value">{{
                dict.label
                }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="公告内容" prop="noticeContent">
        <editor v-model="form.noticeContent" :min-height="220" />
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <span class="notice-signoff">{{ form.noticeId ? "修改后立即生效，全员可见" : "保存即发布，全员立即可见"
      }}<span class="signoff-brand">FODCF</span></span>
      <div class="footer-actions">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button class="notice-save" type="primary" :loading="submitting" @click="submit">{{
          form.noticeId ? "保 存" : "发 布"
          }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { getNotice, addNotice, updateNotice } from "@/api/system/notice";
import Editor from "@/components/Editor";
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "NoticeComposeDialog",
  components: { Editor },
  dicts: ["sys_notice_type"],
  props: {
    // 控制弹窗显示/隐藏，与父组件 .sync 双向绑定
    visible: {
      type: Boolean,
      default: false,
    },
    // 待编辑的公告行；为空或无 noticeId 时视为新增
    model: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      submitting: false,
      // 编辑时拉取完整公告内容
      fetching: false,
      form: this.buildForm(),
      rules: {
        noticeTitle: [
          { required: true, message: "公告标题不能为空", trigger: "blur" },
        ],
        noticeType: [
          { required: true, message: "公告类型不能为空", trigger: "change" },
        ],
      },
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    dialogTitle() {
      return this.form.noticeId ? "编辑公告" : "发布新公告";
    },
    dialogTop() {
      return getDialogVerticalOffset(560);
    },
  },
  methods: {
    buildForm() {
      return {
        noticeId: null,
        noticeTitle: "",
        noticeType: "1",
        noticeContent: "",
        // 直接发布：新增即上架（sys_notice_status 0=上架 1=下架）
        status: "0",
      };
    },
    // 弹窗打开时初始化表单；编辑场景补拉完整内容
    handleOpen() {
      const data = this.model || {};
      this.form = {
        ...this.buildForm(),
        noticeId: data.noticeId || null,
        noticeTitle: data.noticeTitle || "",
        noticeType: data.noticeType || "1",
        status: data.status || "0",
      };
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate();
      });
      if (!this.form.noticeId) return;
      this.fetching = true;
      getNotice(this.form.noticeId)
        .then((response) => {
          const detail = (response && response.data) || {};
          this.form.noticeTitle = detail.noticeTitle || this.form.noticeTitle;
          this.form.noticeType = detail.noticeType || this.form.noticeType;
          this.form.noticeContent = detail.noticeContent || "";
          this.form.status = detail.status || this.form.status;
        })
        .catch(() => {
          this.form.noticeContent = "";
        })
        .finally(() => {
          this.fetching = false;
        });
    },
    submit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        if (!this.form.noticeContent || !String(this.form.noticeContent).replace(/<[^>]+>/g, "").trim()) {
          this.$message.warning("请输入公告内容");
          return;
        }
        this.submitting = true;
        const action = this.form.noticeId ? updateNotice(this.form) : addNotice(this.form);
        action
          .then(() => {
            this.$message.success(this.form.noticeId ? "公告已更新" : "公告已发布");
            this.dialogVisible = false;
            // 保存成功后通知父组件刷新列表
            this.$emit("success");
          })
          .catch(() => { })
          .finally(() => {
            this.submitting = false;
          });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;

::v-deep .notice-compose-dialog {
  border-radius: 16px;
  overflow: hidden;

  /* 表单标签禁止换行（窄屏 / 系统缩放下保持单行） */
  .el-form-item__label {
    white-space: nowrap;
  }

  .el-dialog__header {
    padding: 0;
    margin: 0;
    border: 0;
  }

  .el-dialog__headerbtn {
    top: 14px;
    right: 14px;
    z-index: 3;

    .el-dialog__close {
      color: #fff;
      font-size: 18px;
    }
  }

  .el-dialog__body {
    padding: 22px 24px 4px;
    background: #f7fbf8;
  }

  .el-dialog__footer {
    padding: 0;
    border: 0;
  }
}

/* ===== 抬头色块（对齐备忘弹窗风格） ===== */
.notice-letterhead {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 56px 20px 24px;
  color: #fff;
  background: linear-gradient(135deg, $primary, $primary-dark);
  overflow: hidden;
}

.letterhead-stamp {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  font-size: 22px;
  transform: rotate(6deg);
}

.letterhead-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.letterhead-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0.92;
}

.letterhead-title {
  margin-top: 5px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

/* ===== 页脚 ===== */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: #fff;
  border-top: 1px solid #eef3f0;
}

.notice-signoff {
  color: $muted;
  font-size: 13px;

  .signoff-brand {
    margin-left: 8px;
    color: $primary-dark;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
}

::v-deep .notice-save {
  color: #fff;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border: 0;
  border-radius: 999px;
  padding: 9px 22px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(46, 204, 113, 0.3);
  }
}

@media (max-width: 600px) {
  ::v-deep .notice-compose-dialog {
    width: 92% !important;

    /* 窄屏下标题 / 类型上下堆叠，避免挤压换行 */
    .el-col-15,
    .el-col-9 {
      width: 100%;
    }
  }

  .notice-letterhead {
    padding: 16px 48px 16px 16px;
  }

  .dialog-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
