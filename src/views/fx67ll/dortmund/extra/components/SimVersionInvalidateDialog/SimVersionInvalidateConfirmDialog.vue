<template>
  <!-- 版本作废第一步确认弹窗（展示版本信息与作废影响，倒计时后方可确认） -->
  <el-dialog title="作废版本安全确认" :visible.sync="dialogVisible" width="520px" :close-on-click-modal="false"
    :style="`top: ${getDialogVerticalOffset(560)}`" append-to-body @open="handleDialogOpen" @close="handleDialogClose">
    <div class="confirm-content">
      <!-- 危险操作警告横幅 -->
      <div class="extreme-danger-banner">
        <div class="danger-banner-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="danger-banner-body">
          <div class="danger-banner-title">即将作废版本，请再三确认</div>
          <div class="danger-banner-desc">作废采用软删除，记录仍保留在数据库中，但版本将从列表中隐藏且不可恢复，轮次记录将一并归档隐藏。</div>
        </div>
      </div>

      <!-- 待作废版本信息 -->
      <el-descriptions :column="1" border size="small" style="margin-top: 15px;">
        <el-descriptions-item label="版本名称">
          <span class="version-info-text">{{ versionInfo.versionName || `版本${versionInfo.versionNo}` }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="版本编号">
          <span class="version-info-text">版本{{ versionInfo.versionNo }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(versionInfo.createTime, "{y}-{m}-{d} {h}:{i}") }}
        </el-descriptions-item>
        <el-descriptions-item label="版本配置">
          {{ versionInfo.simMode === "half" ? "半量滚动" : "全量滚动" }} · 初始 {{ versionInfo.initialValue }} · 系数
          {{ versionInfo.coefficient }} · 目标 {{ versionInfo.targetValue }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 倒计时提示 -->
      <div v-if="countdown > 0" class="countdown-tip">
        <i class="el-icon-time"></i>
        请仔细阅读以上影响说明，<span class="countdown-num">{{ countdown }}</span> 秒后方可确认
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
  name: "SimVersionInvalidateConfirmDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    // 待作废的版本记录
    version: {
      type: Object,
      default: () => ({}),
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
    // 待作废版本信息（无选中版本时展示占位）
    versionInfo() {
      return this.version || {};
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

.version-info-text {
  font-weight: bold;
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
