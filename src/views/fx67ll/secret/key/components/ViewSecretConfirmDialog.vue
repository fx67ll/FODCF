<template>
  <el-dialog :title="title" :visible.sync="dialogVisible" width="520px" :close-on-click-modal="false"
    :style="`top: ${getDialogVerticalOffset(530)}`" append-to-body @open="handleDialogOpen" @close="handleDialogClose">
    <div class="confirm-content">
      <!-- 极度危险操作警告横幅 -->
      <div class="extreme-danger-banner">
        <div class="danger-banner-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="danger-banner-body">
          <div class="danger-banner-title">{{ bannerTitle }}</div>
          <div class="danger-banner-desc">{{ bannerDesc }}</div>
        </div>
      </div>

      <el-descriptions :column="1" border size="small" style="margin-top: 15px;">
        <el-descriptions-item label="秘钥键名">
          <span style="font-family: Consolas; font-weight: bold; font-size: 14px;">{{ confirmInfo.secretKey }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 安全风险说明 -->
      <div class="risk-tip">
        <i class="el-icon-info" style="color: #e6a23c; margin-right: 5px;"></i>
        <span>安全风险提示：</span>
        <ul class="risk-list">
          <li>明文将在浏览器内存中短暂存在，可被浏览器开发者工具或恶意脚本读取。</li>
          <li>即使后期第三方 API 改为后端调用，本表仍可能存储其他敏感密钥，管理端操作始终存在明文暴露风险。</li>
          <li>请勿在公共环境、共享屏幕或不可信网络下查看明文。</li>
          <li>查看后请尽快完成修改并关闭弹窗，避免明文长时间停留。</li>
        </ul>
      </div>

      <!-- 倒计时提示 -->
      <div v-if="countdown > 0" class="countdown-tip">
        <i class="el-icon-time"></i>
        请仔细阅读以上风险，<span class="countdown-num">{{ countdown }}</span> 秒后方可确认
      </div>
      <div v-if="countdown === 0" class="countdown-ready">
        <i class="el-icon-circle-check"></i>
        倒计时结束，点击确认进入二次验证
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="danger" :disabled="countdown > 0" @click="handleConfirm">
        确认
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "ViewSecretConfirmDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    confirmInfo: {
      type: Object,
      default: () => ({ secretKey: "" }),
    },
    // 场景：view 查看 / submit 提交
    scene: {
      type: String,
      default: "view",
    },
  },
  data() {
    return {
      countdown: 5,
      countdownTimer: null,
    };
  },
  beforeDestroy() {
    this.stopCountdown();
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
    title() {
      return this.scene === "submit" ? "提交修改安全确认" : "查看明文安全确认";
    },
    bannerTitle() {
      return this.scene === "submit" ? "即将提交秘钥修改，请再三确认" : "即将查看秘钥明文，请再三确认";
    },
    bannerDesc() {
      return this.scene === "submit"
        ? "提交后明文将经传输密钥加密写入数据库，修改立即生效。误改可能导致依赖该秘钥的功能异常，请核对内容无误。"
        : "明文一旦展示将暴露在浏览器环境，可能被截图、调试工具或恶意脚本读取，请确认周围环境安全。";
    },
  },
  methods: {
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 点确认：关闭本弹窗，通知父组件进入二次确认（手动输入）
    handleConfirm() {
      this.dialogVisible = false;
      this.$emit("need-secondary-confirm");
    },
    handleClose() {
      this.dialogVisible = false;
    },
    handleDialogOpen() {
      this.startCountdown();
    },
    handleDialogClose() {
      this.stopCountdown();
    },
    startCountdown() {
      this.countdown = 5;
      this.stopCountdown();
      this.countdownTimer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          this.stopCountdown();
        }
      }, 1000);
    },
    stopCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },
  },
};
</script>

<style scoped>
.extreme-danger-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff1f0 0%, #ffe4e4 100%);
  border: 1px solid #ffb3b3;
  border-left: 4px solid #f56c6c;
  border-radius: 6px;
}

.danger-banner-icon {
  flex-shrink: 0;
  color: #f56c6c;
  font-size: 22px;
  line-height: 1;
  margin-top: 1px;
}

.danger-banner-body {
  flex: 1;
}

.danger-banner-title {
  font-size: 14px;
  font-weight: 700;
  color: #c0392b;
  letter-spacing: 0.5px;
}

.danger-banner-desc {
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
  line-height: 1.5;
}

.risk-tip {
  margin-top: 15px;
  padding: 12px 14px;
  background-color: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 5px;
  font-size: 12px;
  color: #8a6200;
  line-height: 1.6;
}

.risk-tip > span {
  font-weight: 700;
}

.risk-list {
  margin: 6px 0 0 18px;
  padding: 0;
}

.risk-list li {
  margin-bottom: 3px;
}

.countdown-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 10px 14px;
  background-color: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 5px;
  font-size: 13px;
  color: #8a6200;
}

.countdown-num {
  display: inline-block;
  font-size: 18px;
  font-weight: 700;
  color: #e6a23c;
  min-width: 22px;
  text-align: center;
}

.countdown-ready {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 10px 14px;
  background-color: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 5px;
  font-size: 13px;
  color: #389e0d;
}
</style>
