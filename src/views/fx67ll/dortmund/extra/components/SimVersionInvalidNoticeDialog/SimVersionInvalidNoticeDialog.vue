<template>
  <!-- 版本强制作废系统通知弹窗（轮次为负时版本被强制作废） -->
  <el-dialog title="系统通知" :visible.sync="dialogVisible" :close-on-click-modal="false" width="480px"
    :style="`top: ${getDialogVerticalOffset(420)}`" append-to-body>
    <div class="sim-invalid-notice-body">
      <!-- 警告图标 -->
      <div class="sim-invalid-notice-icon">
        <i class="el-icon-remove-outline"></i>
      </div>

      <!-- 通知标题 -->
      <div class="sim-invalid-notice-title">版本已被强制作废</div>

      <!-- 通知内容 -->
      <div class="sim-invalid-notice-desc">
        版本「{{ versionInfo.versionName || `版本${versionInfo.versionNo}` }}」本轮轮次为负数，系统已自动作废该版本，版本不再在列表中展示，轮次记录已一并归档隐藏。
      </div>

      <!-- 版本信息卡片 -->
      <div class="sim-invalid-notice-card">
        <div class="card-item">
          <div class="card-label">版本编号</div>
          <div class="card-value">版本{{ versionInfo.versionNo }}</div>
        </div>
        <div class="card-item">
          <div class="card-label">本轮轮次</div>
          <div class="card-value danger">{{ invalidRoundNo }}</div>
        </div>
      </div>

      <!-- 后续提示 -->
      <div class="sim-invalid-notice-tip">
        <i class="el-icon-info"></i>
        已自动切换到最新启用版本，可通过开启新版本重新开始模拟
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button type="danger" @click="dialogVisible = false">我知道了</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimVersionInvalidNoticeDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 被强制作废的版本记录
    version: {
      type: Object,
      default: () => ({}),
    },
    // 触发强制作废的负轮次
    invalidRoundNo: {
      type: [Number, String],
      default: "",
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
    // 被强制作废的版本信息（无版本时展示占位）
    versionInfo() {
      return this.version || {};
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
  },
};
</script>

<style lang="scss" scoped>
.sim-invalid-notice-body {
  padding: 0 4px;
  text-align: center;
}

/* 警告图标 */
.sim-invalid-notice-icon {
  width: 64px;
  height: 64px;
  line-height: 64px;
  margin: 4px auto 14px;
  font-size: 40px;
  color: #ff5a5f;
  background: linear-gradient(135deg, #fff1f1 0%, #ffe3e4 100%);
  border-radius: 50%;
  animation: simInvalidNoticePulse 1.6s ease infinite;
}

.sim-invalid-notice-title {
  margin-bottom: 10px;
  font-size: 17px;
  font-weight: 700;
  color: #c0392b;
  animation: simInvalidNoticeFadeDown 0.3s ease 0.05s both;
}

.sim-invalid-notice-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.7;
  animation: simInvalidNoticeFadeDown 0.3s ease 0.1s both;
}

/* 版本信息卡片 */
.sim-invalid-notice-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 14px;
  animation: simInvalidNoticeFadeDown 0.3s ease 0.15s both;

  .card-item {
    padding: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.25s ease;

    &:hover {
      border-color: #ff5a5f;
      box-shadow: 0 2px 10px rgba(255, 90, 95, 0.12);
    }
  }

  .card-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #8392a5;
  }

  .card-value {
    font-size: 15px;
    font-weight: 700;
    color: #1f2d3d;

    &.danger {
      color: #ff5a5f;
    }
  }
}

/* 后续提示 */
.sim-invalid-notice-tip {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #8392a5;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  animation: simInvalidNoticeFadeDown 0.3s ease 0.2s both;

  i {
    margin-top: 2px;
    color: #2ecc71;
  }
}

@keyframes simInvalidNoticeFadeDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes simInvalidNoticePulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 90, 95, 0.35);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 90, 95, 0);
  }
}
</style>
