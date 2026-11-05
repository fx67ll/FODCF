<template>
  <!-- 数值模拟抽屉：作为外快盈亏记录页的扩展功能，从右侧滑入，内容首次打开时才加载并在关闭后保留状态 -->
  <el-drawer :visible.sync="drawerVisible" direction="rtl" size="86%" append-to-body :with-header="true"
    :wrapper-closable="true" custom-class="sim-drawer">
    <template slot="title">
      <div class="sim-drawer-header">
        <div class="sim-drawer-header-icon">
          <i class="el-icon-cpu"></i>
        </div>
        <div class="sim-drawer-header-text">
          <div class="sim-drawer-header-title">数值模拟</div>
          <div class="sim-drawer-header-sub">版本化滚动测算与模式对比，关闭抽屉不会丢失当前进度</div>
        </div>
      </div>
    </template>
    <div class="sim-drawer-body">
      <simulate-pane />
    </div>
  </el-drawer>
</template>

<script>
import SimulatePane from "./components/SimulatePane/index.vue";

export default {
  name: "SimulateDrawer",
  components: { SimulatePane },
  props: {
    // 抽屉显隐（配合 .sync 使用）
    visible: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
};
</script>

<!-- 抽屉挂载到 body，样式不能 scoped，统一以 sim-drawer 前缀避免污染 -->
<style lang="scss">
.sim-drawer.el-drawer {
  min-width: 320px;
  max-width: 1180px;
  background: #f6faf8;

  .el-drawer__header {
    padding: 16px 20px;
    margin-bottom: 0;
    background: #fff;
    border-bottom: 1px solid #e3eee8;
  }

  .el-drawer__body {
    overflow: auto;
  }

  .el-drawer__close-btn {
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(90deg);
    }
  }
}

.sim-drawer-header {
  display: flex;
  align-items: center;
}

.sim-drawer-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.35);
}

.sim-drawer-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #2b3a36;
}

.sim-drawer-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #8a9a92;
}

/* 抽屉内三张模拟卡片统一视觉：圆角浅绿描边投影、标题左侧强调条（仅作用于抽屉内，不影响其他页面） */
.sim-drawer .sim-drawer-body {
  .status-card {
    border: 1px solid #e3eee8;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(46, 204, 113, 0.08);
    transition: box-shadow 0.25s ease;

    &:hover {
      box-shadow: 0 10px 26px rgba(46, 204, 113, 0.14);
    }
  }

  .status-header {
    border-bottom-color: #eef4f0;

    h2 {
      position: relative;
      padding-left: 12px;
      font-size: 16px;

      &::before {
        position: absolute;
        top: 3px;
        bottom: 3px;
        left: 0;
        width: 4px;
        content: "";
        background: linear-gradient(180deg, #2ecc71, #27ae60);
        border-radius: 2px;
      }
    }
  }
}

/* 内容区卡片在抽屉滑入后依次浮现 */
.sim-drawer-body {
  padding: 16px 20px 24px;

  .simulate-pane>* {
    animation: simDrawerRise 0.45s ease both;
  }

  .simulate-pane> :nth-child(1) {
    animation-delay: 0.15s;
  }

  .simulate-pane> :nth-child(2) {
    animation-delay: 0.23s;
  }

  .simulate-pane> :nth-child(3) {
    animation-delay: 0.31s;
  }
}

@keyframes simDrawerRise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sim-drawer-body .simulate-pane>* {
    animation: none;
  }
}
</style>
