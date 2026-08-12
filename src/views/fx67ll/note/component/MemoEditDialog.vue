<template>
  <!--
    备忘录新增/编辑共享弹窗（首页备忘卡片 + 富文本备忘页统一消费）
    :visible.sync 双向绑定控制显示/隐藏
    :model 传入待编辑的备忘对象（null 或缺 noteId 视为新增）
    标题字段（noteRemark）置于内容之上（需求 #8），底层字段名保持不变，仅展示层改名
    样式对齐公告弹窗 NoticeDetailDialog：custom-class + 圆角 + 统一头尾（需求 #7）
  -->
  <el-dialog :visible.sync="dialogVisible" :close-on-click-modal="false" :show-close="true" width="760px"
    :style="`top: ${dialogTop}`" append-to-body custom-class="memo-edit-dialog" @open="handleOpen">
    <!-- 统一抬头：色块 + 图标 + 标题 -->
    <template slot="title">
      <div class="memo-letterhead">
        <div class="letterhead-stamp"><i class="el-icon-edit"></i></div>
        <div class="letterhead-copy">
          <span class="letterhead-kicker">RICH MEMO · FODCF</span>
          <strong class="letterhead-title">{{ dialogTitle }}</strong>
        </div>
      </div>
    </template>

    <el-form ref="form" :model="form" label-width="64px" @submit.native.prevent>
      <!-- 标题（原备注，需求 #8 置顶） -->
      <el-form-item label="标题">
        <el-input v-model="form.noteRemark" placeholder="一句话概括这条备忘（可选）" maxlength="60" show-word-limit />
      </el-form-item>
      <el-form-item label="内容">
        <editor v-model="form.noteContent" :min-height="220" />
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <span class="memo-signoff">记录是为了更好地遗忘<span class="signoff-brand">FODCF</span></span>
      <div class="footer-actions">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button class="memo-save" type="primary" :loading="submitting" @click="submit">保 存</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { addNoteLog, updateNoteLog } from "@/api/fx67ll/note/log";
import Editor from "@/components/Editor";
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "MemoEditDialog",
  components: { Editor },
  props: {
    // 控制弹窗显示/隐藏，与父组件 .sync 双向绑定
    visible: {
      type: Boolean,
      default: false,
    },
    // 待编辑的备忘对象；为空或无 noteId 时视为新增
    model: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      submitting: false,
      form: { noteId: null, noteRemark: "", noteContent: "" },
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
      return this.form.noteId ? "编辑备忘" : "写一条备忘";
    },
    dialogTop() {
      return getDialogVerticalOffset(560);
    },
  },
  methods: {
    // 弹窗打开时用 model 初始化表单（新增/编辑统一入口）
    handleOpen() {
      const data = this.model || {};
      this.form = {
        noteId: data.noteId || null,
        noteRemark: data.noteRemark || "",
        noteContent: data.noteContent || "",
      };
    },
    submit() {
      if (!this.form.noteContent || !String(this.form.noteContent).replace(/<[^>]+>/g, "").trim()) {
        this.$message.warning("请输入备忘内容");
        return;
      }
      this.submitting = true;
      const action = this.form.noteId ? updateNoteLog(this.form) : addNoteLog(this.form);
      action
        .then(() => {
          this.$message.success(this.form.noteId ? "备忘已更新" : "备忘已保存");
          this.dialogVisible = false;
          // 保存成功后通知父���件刷新列表
          this.$emit("success");
        })
        .catch(() => { })
        .finally(() => {
          this.submitting = false;
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

::v-deep .memo-edit-dialog {
  border-radius: 16px;
  overflow: hidden;

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

/* ===== 抬头色块（对齐公告弹窗风格） ===== */
.memo-letterhead {
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
  transform: rotate(-6deg);
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

.memo-signoff {
  color: $muted;
  font-size: 13px;

  .signoff-brand {
    margin-left: 8px;
    color: $primary-dark;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
}

::v-deep .memo-save {
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
  ::v-deep .memo-edit-dialog {
    width: 92% !important;
  }

  .memo-letterhead {
    padding: 16px 48px 16px 16px;
  }

  .dialog-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
