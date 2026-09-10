<template>
  <div class="app-container">
    <!-- 页面内容按模式切换（外快盈亏记录/数值模拟），切换状态本地持久缓存 -->
    <transition name="mode-switch" mode="out-in">
      <extra-record-pane v-if="pageMode === 'extra'" key="extra" />
      <simulate-pane v-else key="simulate" />
    </transition>

    <!-- 页面模式切换悬浮按钮（固定右下角） -->
    <div class="mode-fab" :class="{ spinning: fabSpinning }" @click="handleTogglePageMode">
      <span class="mode-fab-label">{{ pageMode === "extra" ? "切换至数值模拟" : "切换至盈亏记录" }}</span>
      <span class="mode-fab-icon">
        <i :class="pageMode === 'extra' ? 'el-icon-cpu' : 'el-icon-notebook-2'"></i>
      </span>
    </div>
  </div>
</template>

<script>
import ExtraRecordPane from "./components/ExtraRecordPane/ExtraRecordPane.vue";
import SimulatePane from "./components/SimulatePane/SimulatePane.vue";

// 页面模式本地持久缓存的key（extra外快盈亏记录 simulate数值模拟）
const PAGE_MODE_KEY = "dortmund-extra-page-mode";

export default {
  name: "DortmundExtra",
  components: { ExtraRecordPane, SimulatePane },
  data() {
    return {
      // 页面模式（extra外快盈亏记录 simulate数值模拟），取本地持久缓存值
      pageMode: localStorage.getItem(PAGE_MODE_KEY) === "simulate" ? "simulate" : "extra",
      // 悬浮按钮点击旋转动画中状态
      fabSpinning: false,
    };
  },
  methods: {
    // 切换页面模式并本地持久缓存
    handleTogglePageMode() {
      const self = this;
      this.fabSpinning = true;
      this.pageMode = this.pageMode === "extra" ? "simulate" : "extra";
      localStorage.setItem(PAGE_MODE_KEY, this.pageMode);
      setTimeout(() => {
        self.fabSpinning = false;
      }, 518);
    },
  },
};
</script>

<style lang="scss" scoped>
/* 页面模式切换过渡动画 */
.mode-switch-enter-active,
.mode-switch-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.mode-switch-enter,
.mode-switch-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* 页面模式切换悬浮按钮 */
.mode-fab {
  position: fixed;
  right: 32px;
  bottom: 48px;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 14px;
  color: #fff;
  font-size: 14px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(46, 204, 113, 0.45);
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.mode-fab:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(46, 204, 113, 0.55);
}

.mode-fab:active {
  transform: translateY(-1px) scale(0.96);
}

/* 悬浮时平滑展开提示文字 */
.mode-fab-label {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  transition: max-width 0.35s ease, opacity 0.35s ease, margin 0.35s ease;
}

.mode-fab:hover .mode-fab-label {
  max-width: 120px;
  margin-right: 8px;
  opacity: 1;
}

.mode-fab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 20px;
}

/* 点击时图标旋转放大动画 */
.mode-fab.spinning .mode-fab-icon {
  animation: mode-fab-spin 0.5s ease;
}

@keyframes mode-fab-spin {
  0% {
    transform: rotate(0deg) scale(1);
  }

  50% {
    transform: rotate(180deg) scale(1.15);
  }

  100% {
    transform: rotate(360deg) scale(1);
  }
}
</style>
