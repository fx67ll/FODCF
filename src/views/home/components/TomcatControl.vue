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
        <!-- GitHub 连通性检测胶囊（仅 TCP 网络层检测，与管理页同款状态灯动效） -->
        <el-tooltip v-if="!isSystemLocked" :content="githubTooltip" placement="bottom" effect="dark" :open-delay="300">
          <button type="button" class="gh-pill" :class="['gh-' + tcpStatus, { 'is-busy': testingTcp }]"
            @click="testTcpConnectivity" aria-label="GitHub 连通性检测">
            <span class="gh-pill-dot"></span>
            <span class="gh-pill-label">{{ githubPillText }}</span>
          </button>
        </el-tooltip>
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

    <!-- 底部入口：Jenkins 控制台（样式参考 Tomcat 管理页「常用服务快速访问」卡片） -->
    <a class="service-item" :href="jenkinsUrl" target="_blank" rel="noopener noreferrer">
      <div class="service-icon"><i class="el-icon-s-promotion"></i></div>
      <div class="service-info">
        <h4>Jenkins 服务</h4>
        <p>持续集成与部署平台</p>
        <span class="service-link">{{ jenkinsLinkText }}</span>
      </div>
      <i class="el-icon-right service-arrow"></i>
    </a>
  </section>
</template>

<script>
import {
  getTomcatStatus,
  startTomcat,
  stopTomcat,
  testConnectToGithubByTcp,
  clearSystemCache,
} from "@/api/fx67ll/server/tomcat";
import panelRefreshMixin from "../refreshMixin";
import PanelRefresh from "./PanelRefresh.vue";
import AnimatedNumber from "./AnimatedNumber.vue";

// 状态 → 指示灯/胶囊样式映射（与号码台账 Tomcat 管理页口径一致）
const RUNNING = "运行中";
const STOPPED = "已停止";
// Jenkins 控制台地址（与 Tomcat 管理页跳转一致）
const JENKINS_URL = "https://run.fx67ll.com/jenkins";

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
      // Jenkins 控制台地址（底部入口新窗口打开）
      jenkinsUrl: JENKINS_URL,
      // 内存指标（与 Tomcat 管理页同源 memoryInfo）
      memoryInfo: {
        totalMemoryMb: 0,
        availableMemoryMb: 0,
        usedMemoryMb: 0,
      },
      // GitHub TCP 连通性检测（仅网络层，与管理页胶囊同款交互）
      tcpStatus: "waiting", // 检测状态：waiting, testing, success, error
      testingTcp: false, // 检测进行中标志
      lastGithubTestTime: "", // 最后一次检测时间
      githubResultDetail: "", // 最近一次检测结果详情（tooltip 展示用）
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
    // Jenkins 入口展示用的链接文本（去掉协议头，与 Tomcat 管理页快速访问卡片一致）
    jenkinsLinkText() {
      return this.jenkinsUrl.replace(/^https?:\/\//, "");
    },
    // GitHub 检测胶囊按钮的显示文案（随状态流转，首页紧凑卡片用短文案）
    githubPillText() {
      const textMap = {
        waiting: "GitHub 连通",
        testing: "检测中…",
        success: "连通正常",
        error: "连接失败，重试",
      };
      return textMap[this.tcpStatus] || "GitHub 连通";
    },
    // GitHub 检测胶囊按钮的 tooltip 详情文案
    githubTooltip() {
      if (this.tcpStatus === "testing") {
        return "正在检测与 GitHub 的 TCP 443 端口连通性…";
      }
      if (this.tcpStatus === "success") {
        return `最后检测 ${this.lastGithubTestTime} · ${this.githubResultDetail || "TCP 443 网络层可达"}`;
      }
      if (this.tcpStatus === "error") {
        return `最后检测 ${this.lastGithubTestTime} · 失败原因：${this.githubResultDetail || "未知"}`;
      }
      return "仅检测与 GitHub 的网络层连通性（TCP 443），不涉及 HTTP 协议";
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
    // GitHub TCP 连通性检测（仅网络层 TCP 443，动效与提示与管理页胶囊保持一致）
    testTcpConnectivity() {
      if (this.testingTcp || this.isSystemLocked) return;
      this.testingTcp = true;
      this.tcpStatus = "testing";
      const startedAt = Date.now();
      // 结果至少延迟600ms落地，保证雷达动画可感知（避免接口过快返回导致状态闪变）
      const settle = (status) => {
        const wait = Math.max(0, 600 - (Date.now() - startedAt));
        setTimeout(() => {
          this.tcpStatus = status;
          this.testingTcp = false;
        }, wait);
      };

      testConnectToGithubByTcp()
        .then((response) => {
          this.githubResultDetail = response.data ? String(response.data) : "";
          this.lastGithubTestTime = this.parseTime(new Date());
          this.$message.success("GitHub 网络层连通正常（TCP 443 可达）");
          settle("success");
        })
        .catch((error) => {
          this.githubResultDetail = error.msg || error.message || "未知原因";
          this.lastGithubTestTime = this.parseTime(new Date());
          if (!error._isHandled) {
            this.$message.error("GitHub 网络层不可达，请检查服务器出站网络或 443 端口防火墙规则");
          }
          settle("error");
        });
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
                click: () => window.open(JENKINS_URL, "_blank"),
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

/* ===== GitHub 连通性检测胶囊（仅 TCP 网络层检测，状态灯动效与管理页同款） ===== */
.gh-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: #f5f7fa;
  cursor: pointer;
  font-size: 11px;
  color: $muted;
  line-height: 1;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  top: 1px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  /* 检测进行中：不可重复点击，光标提示 */
  &.is-busy {
    cursor: not-allowed;
  }

  /* 胶囊状态灯（圆点） */
  .gh-pill-dot {
    flex-shrink: 0;
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #bdc3c7;
    transition: background-color 0.3s ease;
  }

  /* ---- 检测中：蓝色状态灯 + 雷达扩散脉冲 + 胶囊流光扫描 ---- */
  &.gh-testing {
    border-color: #a8d8ff;
    background: #e6f4ff;
    color: #1890ff;

    .gh-pill-dot {
      background: #409eff;

      /* 双波纹错峰扩散 */
      &::before,
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 1.5px solid #409eff;
        border-radius: 50%;
        animation: gh-radar 1.5s ease-out infinite;
      }

      &::after {
        animation-delay: 0.75s;
      }
    }

    /* 胶囊表面流光扫过 */
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.65), transparent);
      animation: gh-sheen 1.6s ease-in-out infinite;
    }
  }

  /* ---- 成功：主题绿呼吸灯 ---- */
  &.gh-success {
    border-color: rgba(46, 204, 113, 0.45);
    background: rgba(46, 204, 113, 0.1);
    color: $primary-dark;

    .gh-pill-dot {
      background: $primary;
      animation: gh-breath 2.4s ease-in-out infinite;
    }
  }

  /* ---- 失败：红点 + 胶囊轻抖一次（可点击重试） ---- */
  &.gh-error {
    border-color: rgba(245, 34, 45, 0.35);
    background: #fef0f0;
    color: $danger;
    animation: gh-shake 0.45s ease;

    .gh-pill-dot {
      background: $danger;
    }
  }
}

@keyframes gh-radar {

  0% {
    transform: scale(1);
    opacity: 0.8;
  }

  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

@keyframes gh-sheen {

  0% {
    transform: translateX(-120%) skewX(-15deg);
  }

  60%,
  100% {
    transform: translateX(320%) skewX(-15deg);
  }
}

@keyframes gh-breath {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.45);
  }

  50% {
    box-shadow: 0 0 0 4px rgba(46, 204, 113, 0);
  }
}

@keyframes gh-shake {

  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-3px);
  }

  40% {
    transform: translateX(3px);
  }

  60% {
    transform: translateX(-2px);
  }

  80% {
    transform: translateX(2px);
  }
}

/* 系统锁定态 */
.tomcat-locked {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
  /* 与底部 Jenkins 入口的间距下限（入口 margin-top:auto 贴底时兜底） */
  margin-bottom: 14px;
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
  /* 与底部 Jenkins 入口的间距下限（入口 margin-top:auto 贴底时兜底） */
  margin-bottom: 14px;
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
    /* 停止服务保持珊瑚红系但加深，避免与 50% 透明度的禁用态混淆 */
    background: linear-gradient(135deg, #ee6b6b, #e04848);
    box-shadow: 0 6px 14px rgba(224, 72, 72, 0.24);
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
    box-shadow: 0 10px 20px rgba(224, 72, 72, 0.32);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
  }
}

/* 底部 Jenkins 服务入口：参考 Tomcat 管理页「常用服务快速访问」卡片，
   按首页卡片紧凑宽度等比缩小（图标/字号/内边距）。
   卡片与未开奖号码卡同处一行会被撑高，auto 上边距把入口贴到卡片底部，
   间距下限由上方内容块的 margin-bottom 保证 */
.service-item {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: auto;
  padding: 12px 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  border: 1px solid #e9ecef;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fee9e9 0%, #f8dddd 100%);
    border-color: #eb5656;
    box-shadow: 0 6px 20px rgba(235, 86, 86, 0.15);

    /* 悬浮时顶部亮色渐变条（与 Tomcat 管理页一致） */
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #eb5656, #fab6b6);
    }

    .service-arrow {
      transform: translateX(5px);
    }
  }
}

/* Jenkins 图标块：红系渐变 + 流光动画 */
.service-icon {
  position: relative;
  display: flex;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #eb5656 0%, #fab6b6 100%);
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(235, 86, 86, 0.35);
  color: #fff;
  font-size: 20px;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(250, 182, 182, 0.2), transparent);
    animation: service-shine 3s linear infinite;
  }
}

@keyframes service-shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.service-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;

  h4 {
    margin: 0 0 2px;
    color: $ink;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0 0 6px;
    color: $muted;
    font-size: 12px;
  }
}

/* 链接文本小胶囊（等宽字体） */
.service-link {
  align-self: flex-start;
  padding: 3px 8px;
  color: #8392a5;
  background: rgba(131, 146, 165, 0.1);
  border-radius: 4px;
  font-size: 10px;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
}

/* 右侧跳转箭头 */
.service-arrow {
  margin-left: 12px;
  color: #fab6b6;
  font-size: 16px;
  transition: transform 0.3s ease;
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
