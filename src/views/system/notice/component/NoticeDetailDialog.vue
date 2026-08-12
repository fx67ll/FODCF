<template>
  <el-dialog :visible.sync="dialogVisible" :close-on-click-modal="false" :show-close="true" width="780px"
    :style="`top: ${getDialogVerticalOffset(480)}`" append-to-body custom-class="notice-detail-dialog">
    <!-- 信封式抬头：色块 + 邮戳 + 标题 -->
    <template slot="title">
      <div class="notice-letterhead" :class="'head-type-' + notice.noticeType">
        <div class="letterhead-stamp">
          <i class="el-icon-message"></i>
        </div>
        <div class="letterhead-copy">
          <span class="letterhead-kicker">FROM FODCF · {{ typeText(notice.noticeType) }}</span>
          <strong class="letterhead-title">{{ notice.noticeTitle || "系统来信" }}</strong>
        </div>
        <span class="letterhead-seal">{{ typeText(notice.noticeType) }}</span>
      </div>
    </template>

    <!-- 邮戳栏：发布者 + 时间 -->
    <div class="notice-postmark">
      <span><i class="el-icon-user"></i> {{ notice.createBy || "系统" }}</span>
      <span><i class="el-icon-time"></i> {{ parseTime(notice.createTime) }}</span>
    </div>

    <!-- 信纸正文：色块内容区 -->
    <div class="notice-paper">
      <div class="notice-paper-content" v-html="notice.noticeContent"></div>
    </div>

    <div slot="footer" class="dialog-footer">
      <span class="letter-signoff">此致<span class="signoff-brand">FODCF</span></span>
      <el-button class="letter-close" @click="handleClose">拆阅完毕</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "NoticeDetailDialog",
  dicts: ["sys_notice_type"],
  props: {
    // 是否显示弹窗（支持 .sync）
    visible: {
      type: Boolean,
      default: false,
    },
    // 公告详情对象
    notice: {
      type: Object,
      default: () => ({}),
    },
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
  },
  methods: {
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    /** 类型文本 */
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((d) => d.value === noticeType);
      return dict ? dict.label : "公告";
    },
    /** 关闭弹窗 */
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;

::v-deep .notice-detail-dialog {
  border-radius: 16px;
  overflow: hidden;

  .el-dialog__header {
    position: relative;
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
    padding: 0;
    background: #f7fbf8;
  }

  .el-dialog__footer {
    padding: 0;
    border: 0;
  }
}

/* ===== 信封抬头 ===== */
.notice-letterhead {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 64px 22px 28px;
  color: #fff;
  background: linear-gradient(135deg, $primary, $primary-dark);
  overflow: hidden;

  /* 信封翻盖三角 */
  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 60%);
    pointer-events: none;
  }

  &::after {
    position: absolute;
    right: -30px;
    bottom: -36px;
    width: 130px;
    height: 130px;
    content: "";
    border: 2px dashed rgba(255, 255, 255, 0.28);
    border-radius: 50%;
    pointer-events: none;
  }

  &.head-type-1 {
    background: linear-gradient(135deg, #f5b041, #e67e22);
  }
}

.letterhead-stamp {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  font-size: 24px;
  transform: rotate(-6deg);
}

.letterhead-copy {
  position: relative;
  z-index: 1;
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
  margin-top: 6px;
  font-size: 19px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.letterhead-seal {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: 6px 12px;
  color: $primary-dark;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  transform: rotate(6deg);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.notice-letterhead.head-type-1 .letterhead-seal {
  color: #e67e22;
}

/* ===== 邮戳栏 ===== */
.notice-postmark {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 14px 28px;
  background: #fff;
  border-bottom: 1px dashed #d3eede;
  color: $muted;
  font-size: 12px;

  i {
    margin-right: 5px;
    color: $primary;
  }
}

/* ===== 信纸正文 ===== */
.notice-paper {
  padding: 20px 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fcfa 100%);
}

.notice-paper-content {
  max-height: 46vh;
  padding: 4px;
  overflow-y: auto;
  color: $ink;
  font-size: 14px;
  line-height: 1.85;

  ::v-deep img {
    max-width: 100%;
    border-radius: 6px;
  }

  ::v-deep p {
    margin: 10px 0;
  }

  ::v-deep h1,
  ::v-deep h2,
  ::v-deep h3,
  ::v-deep h4 {
    color: $primary-dark;
    font-weight: 600;
  }

  ::v-deep a {
    color: $primary-dark;
  }

  ::v-deep blockquote {
    margin: 12px 0;
    padding: 10px 14px;
    background: #eef9f1;
    border-left: 3px solid $primary;
    border-radius: 4px;
    color: #44604f;
  }
}

/* ===== 页脚 ===== */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: #fff;
  border-top: 1px solid #eef3f0;
}

.letter-signoff {
  color: $muted;
  font-size: 13px;

  .signoff-brand {
    margin-left: 8px;
    color: $primary-dark;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
}

::v-deep .letter-close {
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
  ::v-deep .notice-detail-dialog {
    width: 92% !important;
  }

  .notice-letterhead {
    padding: 18px 56px 18px 18px;
  }

  .letterhead-seal {
    display: none;
  }

  .notice-postmark,
  .notice-paper,
  .dialog-footer {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
