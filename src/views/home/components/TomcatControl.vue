<template>
  <section class="panel tomcat-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">TOMCAT SERVICE</span>
        <div class="panel-title-row">
          <h3>Tomcat 服务</h3>
          <panel-refresh :loading="refreshing" :timestamp="lastRefreshTime" @refresh="refresh" />
        </div>
      </div>
      <div class="panel-head-actions">
        <!-- 右上图标风格对齐其他卡片 .panel-glyph -->
        <button type="button" class="panel-glyph-btn" title="Tomcat 管理页" @click="openTomcat">
          <i class="el-icon-monitor panel-glyph glyph-flicker"></i>
        </button>
      </div>
    </div>

    <!-- 系统锁定（不匹配 / 未安装）：不可操作 -->
    <div v-if="isSystemLocked" class="tomcat-locked">
      <i class="el-icon-warning-outline"></i>
      <div>
        <strong>{{ status }}</strong>
        <small>{{ lockMessage }}</small>
      </div>
    </div>

    <template v-else>
      <!-- 运行状态（左半）与可用内存环形仪表（右半）同一行，各占一半 -->
      <div class="tomcat-top-row" :class="{ 'refresh-flash': flashing }">
        <div class="tomcat-status">
          <span class="tomcat-dot" :class="dotClass"></span>
          <div class="tomcat-status-copy">
            <strong>{{ status || "加载中..." }}</strong>
            <small>{{ statusHint }}</small>
          </div>
        </div>

        <!-- 可用内存改为环形仪表盘（移除进度条） -->
        <div v-if="hasMemory" class="tomcat-memory">
          <div class="tomcat-mem-text">
            <span class="tomcat-mem-label"><i class="el-icon-coin"></i> 可用内存</span>
            <b class="tomcat-mem-value"><animated-number :value="availMemValue" :trigger="refreshTick" snap-on-change />
              {{ availMemUnit }}<small> / <animated-number :value="totalMemValue" :trigger="refreshTick"
                  snap-on-change />
                {{ totalMemUnit }}</small></b>
            <small class="tomcat-mem-hint">清理缓存前可参考</small>
          </div>
          <div class="tomcat-mem-ring" :class="memoryBarClass" :style="{ '--mem-rate': usedPercent + '%' }">
            <div class="tomcat-mem-ring-inner">
              <strong><animated-number :value="usedPercent" :trigger="refreshTick"
                  snap-on-change /><small>%</small></strong>
              <span>已用</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tomcat-actions">
        <button type="button" class="tomcat-btn start" :disabled="isRunning || isOperating" @click="handleStart">
          <i :class="isOperating && pendingOp === 'start' ? 'el-icon-loading' : 'el-icon-mouse'"></i>
          启动服务
        </button>
        <button type="button" class="tomcat-btn stop" :disabled="!isRunning || isOperating" @click="handleStop">
          <i :class="isOperating && pendingOp === 'stop' ? 'el-icon-loading' : 'el-icon-switch-button'"></i>
          停止服务
        </button>
        <button type="button" class="tomcat-btn cache" :disabled="clearingCache" @click="handleClearCache">
          <i :class="clearingCache ? 'el-icon-loading' : 'el-icon-delete'"></i>
          清理缓存
        </button>
      </div>
    </template>
  </section>
</template>

<script>
import {
  getTomcatStatus,
  startTomcat,
  stopTomcat,
  clearSystemCache,
} from "@/api/fx67ll/server/tomcat";
import panelRefreshMixin from "../refreshMixin";
import PanelRefresh from "./PanelRefresh.vue";
import AnimatedNumber from "./AnimatedNumber.vue";

// 状态 → 指示灯/胶囊样式映射（与号码台账 Tomcat 管理页口径一致）
const RUNNING = "运行中";
const STOPPED = "已停止";

export default {
  name: "HomeTomcatControl",
  components: { PanelRefresh, AnimatedNumber },
  mixins: [panelRefreshMixin],
  data() {
    return {
      status: "加载中...",
      // 系统不匹配 / 未安装 等不可用状态
      isSystemLocked: false,
      lockMessage: "",
      // 启停操作进行中（禁用按钮）
      isOperating: false,
      // 当前进行中的操作类型，用于切换按钮 loading 图标
      pendingOp: "",
      clearingCache: false,
      refreshInterval: null,
      // 内存指标（与 Tomcat 管理页同源 memoryInfo）
      memoryInfo: {
        totalMemoryMb: 0,
        availableMemoryMb: 0,
        usedMemoryMb: 0,
      },
    };
  },
  computed: {
    isRunning() {
      return this.status === RUNNING;
    },
    dotClass() {
      if (this.isRunning) return "running";
      if (this.status === STOPPED) return "stopped";
      return "pending";
    },
    // 内存指标派生
    hasMemory() {
      return Number(this.memoryInfo.totalMemoryMb) > 0;
    },
    usedPercent() {
      const total = Number(this.memoryInfo.totalMemoryMb) || 0;
      const available = Number(this.memoryInfo.availableMemoryMb) || 0;
      if (!total) return 0;
      const used = Math.max(0, total - available);
      return Math.round((used / total) * 100);
    },
    memoryBarClass() {
      const percent = this.usedPercent;
      if (percent >= 85) return "danger";
      if (percent >= 65) return "warning";
      return "ok";
    },
    statusHint() {
      if (this.isRunning) return "服务运行中，外部可正常访问";
      if (this.status === STOPPED) return "服务已停止，相关应用暂不可访问";
      if (this.isSystemLocked) return this.lockMessage || "该功能不可用";
      return "正在获取服务状态…";
    },
    // 内存数值与单位拆分展示（MB / GB 自适应），数值部分交给滚动动画
    availMemValue() {
      return this.toMemNumber(this.memoryInfo.availableMemoryMb);
    },
    availMemUnit() {
      return this.toMemUnit(this.memoryInfo.availableMemoryMb);
    },
    totalMemValue() {
      return this.toMemNumber(this.memoryInfo.totalMemoryMb);
    },
    totalMemUnit() {
      return this.toMemUnit(this.memoryInfo.totalMemoryMb);
    },
  },
  created() {
    this.queryStatus();
    // 15s 轮询，保持首页状态新鲜（比管理页 10s 稍慢，降低首页负担）
    this.refreshInterval = setInterval(this.queryStatus, 15000);
  },
  beforeDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  },
  methods: {
    queryStatus() {
      return getTomcatStatus()
        .then((response) => {
          const data = (response && response.data) || {};
          this.status = data.status || "未知";
          // 记录内存指标（与 Tomcat 管理页同源）
          const mem = data.memoryInfo || {};
          this.memoryInfo = {
            totalMemoryMb: Number(mem.totalMemoryMb) || 0,
            availableMemoryMb: Number(mem.availableMemoryMb) || 0,
            usedMemoryMb: Number(mem.usedMemoryMb) || 0,
          };
          if (data.status === "系统不匹配" || data.status === "未安装") {
            this.isSystemLocked = true;
            this.lockMessage = data.error || "该功能不可用";
          } else {
            this.isSystemLocked = false;
            this.lockMessage = "";
          }
        })
        .catch((error) => {
          if (!error._isHandled) {
            this.$message.error("Tomcat 状态查询失败：" + (error.msg || error.message));
          }
          this.status = "未知";
        });
    },
    // 面板刷新：标题右侧按钮触发，供欢迎区一键刷新调用
    refresh() {
      return this.runRefresh(() => this.queryStatus());
    },
    handleStart() {
      this.$confirm("确定要启动 Tomcat 服务吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.isOperating = true;
          this.pendingOp = "start";
          startTomcat()
            .then((response) => {
              this.$message.success(response.msg || "Tomcat 启动指令已发送");
              this.notifyJenkins();
              // 启动需等待进程拉起，1s + 3s 两次回查确保状态收敛
              setTimeout(() => {
                this.queryStatus();
                setTimeout(() => {
                  this.queryStatus();
                  this.isOperating = false;
                  this.pendingOp = "";
                }, 3000);
              }, 1000);
            })
            .catch((error) => {
              if (!error._isHandled) {
                this.$message.error(error.msg || "启动失败，启动接口异常");
              }
              this.isOperating = false;
              this.pendingOp = "";
              this.queryStatus();
            });
        })
        .catch(() => { });
    },
    handleStop() {
      this.$confirm("确定要停止 Tomcat 服务吗？停止后相关应用将无法访问。", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
      })
        .then(() => {
          this.isOperating = true;
          this.pendingOp = "stop";
          stopTomcat()
            .then((response) => {
              this.$message.success(response.msg || "Tomcat 停止指令已发送");
              setTimeout(() => {
                this.queryStatus();
                setTimeout(() => {
                  this.queryStatus();
                  this.isOperating = false;
                  this.pendingOp = "";
                }, 3000);
              }, 1000);
            })
            .catch((error) => {
              if (!error._isHandled) {
                this.$message.error(error.msg || "停止失败");
              }
              this.isOperating = false;
              this.pendingOp = "";
              this.queryStatus();
            });
        })
        .catch(() => { });
    },
    handleClearCache() {
      this.$confirm("清理系统缓存将释放被占用的内存，但可能导致短时间内磁盘 IO 升高。确定继续吗？", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.clearingCache = true;
          clearSystemCache()
            .then((response) => {
              this.$message.success(response.msg || "缓存清理成功");
              this.queryStatus();
            })
            .catch((error) => {
              if (!error._isHandled) {
                this.$message.error(error.msg || "缓存清理失败");
              }
            })
            .finally(() => {
              this.clearingCache = false;
            });
        })
        .catch(() => { });
    },
    // 启动成功后右上角弹出 Jenkins 跳转通知（与 Tomcat 管理页一致）
    notifyJenkins() {
      const h = this.$createElement;
      this.$notify({
        title: "Jenkins 小助手",
        message: h("div", { style: "line-height: 1.6;" }, [
          h(
            "p",
            { style: "margin: 0 0 12px; color: #606266; font-size: 13px;" },
            "Jenkins 服务正在初始化，点击立刻前往"
          ),
          h(
            "a",
            {
              style:
                "display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #eb5656 0%, #FAB6B6 100%); color: #fff; border-radius: 20px; text-decoration: none; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 8px rgba(235, 86, 86, 0.3);",
              on: {
                click: () => window.open("https://run.fx67ll.com/jenkins", "_blank"),
              },
            },
            "🚀 前往 Jenkins"
          ),
        ]),
        duration: 6666,
        type: "success",
        position: "top-right",
      });
    },
    // 内存数值换算：GB 保留一位小数，MB 取整
    toMemNumber(mb) {
      const value = Number(mb) || 0;
      return value >= 1024 ? Math.round((value / 1024) * 10) / 10 : value;
    },
    toMemUnit(mb) {
      return (Number(mb) || 0) >= 1024 ? "GB" : "MB";
    },
    // 右上图标跳转 Tomcat 管理页
    openTomcat() {
      this.$router.push("/ruoyi/tool/server/tomcat").catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;
$danger: #f5222d;
$warning: #f5b041;
$memory-ok: #46c985;
$memory-warning: #e9b949;
$memory-danger: #e9786b;
$memory-track: #dce9e0;

.tomcat-panel {
  display: flex;
  flex-direction: column;
}

/* 右上图标对齐其他卡片 .panel-glyph 风格（可点击跳转 Tomcat 管理页） */
.panel-glyph {
  color: $primary;
  font-size: 22px;
  transition: color 0.3s ease, transform 0.3s ease;
}

.panel-glyph-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;

  /* 悬浮动效收敛为共享工具类 .glyph-flicker，仅保留配色加深 */
  &:hover .panel-glyph {
    color: $primary-dark;
  }
}

/* 系统锁定态 */
.tomcat-locked {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
  color: $ink;
  background: var(--home-primary-softer);
  border: 1px dashed var(--home-border);
  border-radius: var(--home-radius-sm);

  i {
    font-size: 30px;
    color: $warning;
  }

  strong {
    display: block;
    font-size: 15px;
  }

  small {
    color: $muted;
    font-size: 12px;
  }
}

/* 运行状态 + 内存仪表同一行容器 */
.tomcat-top-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 0 16px;
  border-bottom: 1px solid #eef3f0;
}

/* 状态行（左半） */
.tomcat-status {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
}

.tomcat-dot {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  margin-right: 14px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &.running {
    background: $primary;
    box-shadow: 0 0 0 5px rgba(46, 204, 113, 0.18);
    animation: tomcat-dot-pulse 1.8s ease-in-out infinite;
  }

  &.stopped {
    background: $danger;
    box-shadow: 0 0 0 5px rgba(245, 34, 45, 0.16);
    animation: tomcat-dot-dim 2s ease-in-out infinite;
  }

  &.pending {
    background: #bdc3c7;
    box-shadow: 0 0 0 5px rgba(189, 195, 199, 0.18);
  }
}

/* 状态点优雅动效（运行脉冲 / 停止呼吸） */
@keyframes tomcat-dot-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 5px rgba(46, 204, 113, 0.18);
  }

  50% {
    box-shadow: 0 0 0 9px rgba(46, 204, 113, 0.04);
  }
}

@keyframes tomcat-dot-dim {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

.tomcat-status-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;

  strong {
    color: $ink;
    font-size: 17px;
    font-weight: 600;
  }

  small {
    margin-top: 3px;
    color: $muted;
    font-size: 11px;
  }
}

/* 刷新按钮样式由共享 .panel-refresh 提供 */

/* 可用内存环形仪表盘（右半） */
.tomcat-memory {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.tomcat-mem-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;

  .tomcat-mem-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: $muted;
    font-size: 12px;

    i {
      color: $primary;
    }
  }

  .tomcat-mem-value {
    margin-top: 3px;
    color: $ink;
    font-size: 16px;
    font-weight: 600;
    /* 数值滚动拆成多个内联节点，禁止在数字与单位之间换行 */
    white-space: nowrap;

    small {
      color: $muted;
      font-size: 11px;
      font-weight: 400;
    }
  }

  .tomcat-mem-hint {
    margin-top: 3px;
    color: #9daea4;
    font-size: 10px;
  }
}

.tomcat-mem-ring {
  position: relative;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: conic-gradient(var(--mem-color, $memory-ok) var(--mem-rate), $memory-track 0);
  transition: background 0.5s ease;

  &.ok {
    --mem-color: #{$memory-ok};
  }

  &.warning {
    --mem-color: #{$memory-warning};
  }

  &.danger {
    --mem-color: #{$memory-danger};
  }
}

.tomcat-mem-ring-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--home-border);
  transform: translate(-50%, -50%);

  strong {
    color: var(--home-ink);
    font-size: 15px;
    font-weight: 600;
    line-height: 1;

    small {
      font-size: 9px;
      font-weight: 500;
    }
  }

  span {
    margin-top: 1px;
    color: var(--home-muted);
    font-size: 9px;
    letter-spacing: 0.04em;
  }
}

/* 操作按钮 */
.tomcat-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.tomcat-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 8px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

  i {
    font-size: 15px;
    position: relative;
    top: 1px;
  }

  &.start {
    color: #fff;
    background: linear-gradient(135deg, #2ecc71, #2ecc71);
    box-shadow: 0 6px 14px rgba(103, 194, 58, 0.25);
  }

  &.stop {
    color: #fff;
    /* 停止服务改用更柔和的珊瑚红，降低视觉刺激 */
    background: linear-gradient(135deg, #f3a0a0, #e88080);
    box-shadow: 0 6px 14px rgba(232, 128, 128, 0.2);
  }

  &.cache {
    color: $primary-dark;
    background: var(--home-primary-softer);
    border: 1px solid var(--home-border);
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &.start:hover:not(:disabled) {
    box-shadow: 0 10px 20px rgba(103, 194, 58, 0.32);
  }

  &.stop:hover:not(:disabled) {
    box-shadow: 0 10px 20px rgba(232, 128, 128, 0.26);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
  }
}

.panel-head {
  i {
    cursor: pointer;
  }
}

@media (max-width: 520px) {
  .tomcat-actions {
    grid-template-columns: 1fr;
  }
}
</style>
