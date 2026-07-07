<template>
  <!-- 游客公开服务状态大盘：仅展示后端脱敏聚合数据，不含任何敏感信息 -->
  <div class="status-page">
    <!-- 顶部标题栏 + 数据更新时间倒计时 -->
    <div class="status-header">
      <div class="header-left">
        <div class="logo-dot"></div>
        <span class="header-title">fx67ll's 系统服务状态总览</span>
      </div>
      <div class="header-right">
        <span class="update-label">数据更新于</span>
        <span class="update-time">{{ updateTimeText }}</span>
        <div class="countdown-bar">
          <div class="countdown-fill" :style="{ width: countdownPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 概览卡片区：在线服务数 / 稳定运行天数 / 累计拦截次数 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-label">在线服务</div>
        <div class="card-value">
          <count-to :start-val="0" :end-val="onlineServiceCount" :duration="1200" />
          <span class="card-unit">/ {{ totalServiceCount }}</span>
        </div>
        <div class="card-sub">全部服务在线率 {{ onlineRate }}%</div>
      </div>
      <div class="overview-card">
        <div class="card-label">稳定运行</div>
        <div class="card-value">
          <count-to :start-val="0" :end-val="uptimeDays" :duration="1200" />
          <span class="card-unit">天</span>
        </div>
        <div class="card-sub">系统持续平稳运行</div>
      </div>
      <div class="overview-card highlight">
        <div class="card-label">累计拦截攻击</div>
        <div class="card-value">
          <count-to :start-val="0" :end-val="totalBlockedAttempts" :duration="1600" />
          <span class="card-unit">次</span>
        </div>
        <div class="card-sub">Fail2Ban 防护{{ fail2banEnabled ? '已启用' : '未启用' }}</div>
      </div>
    </div>

    <!-- 服务在线状态列表 -->
    <div class="service-section">
      <div class="section-title">服务在线状态</div>
      <div class="service-list">
        <div v-for="item in serviceList" :key="item.name" class="service-item">
          <span class="service-dot" :class="{ online: item.online, offline: !item.online }"></span>
          <span class="service-name">{{ item.name }}</span>
          <span class="service-status" :class="{ online: item.online, offline: !item.online }">
            {{ item.online ? '在线' : '离线' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 服务器资源占用（脱敏，仅百分比/小数，不含路径与配置） -->
    <div class="resource-section">
      <div class="section-title">服务器资源占用</div>
      <div class="stack-list">
        <div class="stack-item">
          <div class="stack-head">
            <span class="stack-name">CPU 使用率</span>
            <span class="stack-value"><count-to :start-val="0" :end-val="cpuUsage" :duration="1000" />%</span>
          </div>
          <div class="bar">
            <div class="bar-inner" :class="barLevel(cpuUsage)" :style="{ width: barWidth(cpuUsage) }"></div>
          </div>
        </div>
        <div class="stack-item">
          <div class="stack-head">
            <span class="stack-name">内存使用率</span>
            <span class="stack-value"><count-to :start-val="0" :end-val="memoryUsage" :duration="1000" />%</span>
          </div>
          <div class="bar">
            <div class="bar-inner" :class="barLevel(memoryUsage)" :style="{ width: barWidth(memoryUsage) }"></div>
          </div>
          <div class="resource-sub">{{ memoryUsedGB }} / {{ memoryTotalGB }} GB</div>
        </div>
        <div class="stack-item">
          <div class="stack-head">
            <span class="stack-name">磁盘使用率</span>
            <span class="stack-value"><count-to :start-val="0" :end-val="diskUsage" :duration="1000" />%</span>
          </div>
          <div class="bar">
            <div class="bar-inner" :class="barLevel(diskUsage)" :style="{ width: barWidth(diskUsage) }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务器负载与运行时长（脱敏，负载仅小数，不暴露核数） -->
    <div class="load-section">
      <div class="load-card">
        <div class="load-value"><count-to :start-val="0" :end-val="osUptimeDays" :duration="1200" /></div>
        <div class="load-label">开机天数</div>
      </div>
      <div class="load-card">
        <div class="load-value"><count-to :start-val="0" :end-val="load1" :duration="1200" /></div>
        <div class="load-label">1min 负载</div>
      </div>
      <div class="load-card">
        <div class="load-value"><count-to :start-val="0" :end-val="load15" :duration="1200" /></div>
        <div class="load-label">15min 负载</div>
      </div>
    </div>

    <!-- 能力摘要文案：靠文案点题，不靠数据堆砌 -->
    <div class="summary-text">
      本站由 fx67ll 管理系统提供运维与安全防护，已累计抵御
      <span class="summary-num">{{ totalBlockedAttempts }}</span>
      次恶意访问，数据均已脱敏处理，仅展示状态信息。
    </div>

    <!-- 骨架屏：数据未就绪时展示，避免空白闪烁 -->
    <div v-if="initializing" class="skeleton-mask">
      <div class="skeleton-tip">数据加载中，请稍候...</div>
    </div>
  </div>
</template>

<script>
import CountTo from 'vue-count-to';
import { getPublicStatusOverview } from '@/api/fx67ll/server/status';

export default {
  name: 'PublicServerStatusMonitor',
  components: { CountTo },
  data() {
    return {
      // 脱敏状态快照
      onlineServiceCount: 0,
      totalServiceCount: 0,
      uptimeDays: 0,
      totalBlockedAttempts: 0,
      fail2banEnabled: false,
      services: {},
      lastUpdateTime: 0,
      initializing: true,
      // 倒计时进度：10 分钟一个采集周期
      countdownPercent: 0,
      refreshTimer: null,
      countdownTimer: null,
      // 服务器运行指标（全部脱敏，不含 IP/路径/版本/阈值）
      osUptimeDays: 0,      // 操作系统开机时长（天）
      cpuUsage: 0,          // CPU 使用率（0-100）
      memoryUsage: 0,       // 内存使用率（0-100）
      memoryUsedGB: 0,      // 已用内存（GB）
      memoryTotalGB: 0,     // 总内存（GB）
      diskUsage: 0,         // 根分区磁盘使用率（0-100）
      load1: 0,             // 1 分钟平均负载
      load5: 0,             // 5 分钟平均负载
      load15: 0,             // 15 分钟平均负载
    };
  },
  computed: {
    // 服务列表（服务名 -> 在线布尔 映射转为展示数组）
    serviceList() {
      const labelMap = {
        fail2ban: 'Fail2Ban 安全防护',
        tomcat: 'Tomcat 应用服务',
        jenkins: 'Jenkins 构建服务',
      };
      return Object.keys(this.services).map((name) => ({
        name: labelMap[name] || name,
        online: !!this.services[name],
      }));
    },
    // 在线率百分比
    onlineRate() {
      if (!this.totalServiceCount) return 0;
      return Math.round((this.onlineServiceCount / this.totalServiceCount) * 100);
    },
    // "更新于 Xmin 前" 文案
    updateTimeText() {
      if (!this.lastUpdateTime) return '初始化中';
      const diff = Date.now() - this.lastUpdateTime;
      const min = Math.floor(diff / 60000);
      if (min < 1) return '刚刚';
      return `${min}min 前`;
    },
  },
  created() {
    // 游客路径不走 store.setTitle，这里显式设置页签标题
    this.$store.dispatch('settings/setTitle', '服务状态');
  },
  mounted() {
    this.fetchStatus();
    // 每 30 秒拉取一次缓存（后端 60 秒刷新一次，前端 30 秒轮询能尽快命中新缓存，开销极低）
    this.refreshTimer = setInterval(this.fetchStatus, 30000);
    // 倒计时进度条：每秒推进，60 秒走满一轮
    this.countdownTimer = setInterval(this.tickCountdown, 1000);
  },
  beforeDestroy() {
    clearInterval(this.refreshTimer);
    clearInterval(this.countdownTimer);
  },
  methods: {
    fetchStatus() {
      getPublicStatusOverview()
        .then((res) => {
          // 成功响应 res 为 {msg, code, data}，业务数据在 data 中（若依 request 拦截器约定）
          const data = res.data || {};
          this.onlineServiceCount = Number(data.onlineServiceCount) || 0;
          this.totalServiceCount = Number(data.totalServiceCount) || 0;
          this.uptimeDays = Number(data.uptimeDays) || 0;
          this.totalBlockedAttempts = Number(data.totalBlockedAttempts) || 0;
          this.fail2banEnabled = !!data.fail2banEnabled;
          this.services = data.services || {};
          // 服务器运行指标（保留 1 位小数的百分比直接赋值）
          this.osUptimeDays = Number(data.osUptimeDays) || 0;
          this.cpuUsage = Number(data.cpuUsage) || 0;
          this.memoryUsage = Number(data.memoryUsage) || 0;
          this.memoryUsedGB = Number(data.memoryUsedGB) || 0;
          this.memoryTotalGB = Number(data.memoryTotalGB) || 0;
          this.diskUsage = Number(data.diskUsage) || 0;
          this.load1 = Number(data.load1) || 0;
          this.load5 = Number(data.load5) || 0;
          this.load15 = Number(data.load15) || 0;
          // 拉到新数据时重置倒计时
          this.lastUpdateTime = Number(data.lastUpdateTime) || Date.now();
          this.countdownPercent = 0;
          this.initializing = false;
        })
        .catch(() => {
          // 接口失败静默处理，保留上次数据，不暴露后端错误
          this.initializing = false;
        });
    },
    tickCountdown() {
      // 进度条映射 60 秒周期，到顶后停留等待下次拉取
      if (this.countdownPercent < 100) {
        this.countdownPercent = Math.min(100, this.countdownPercent + 100 / 60);
      }
    },
    // 进度条宽度：百分比转宽度（0-100%）
    barWidth(percent) {
      const p = Math.max(0, Math.min(100, Number(percent) || 0));
      return `${p}%`;
    },
    // 进度条档位：低于 60% 正常(brand)，60-85% 警告(warn)，85%+ 危险(danger)
    barLevel(percent) {
      const p = Number(percent) || 0;
      if (p >= 85) return 'danger';
      if (p >= 60) return 'warn';
      return 'normal';
    },
  },
};
</script>

<style scoped lang="scss">
$brand: #2ecc71;
$brand-dim: rgba(46, 204, 113, 0.15);
$bg: #0e1117;
$card-bg: #161b22;
$text-main: #e6edf3;
$text-sub: #8b949e;
$offline: #f85149;

.status-page {
  position: relative;
  min-height: 100vh;
  padding: 32px 24px;
  box-sizing: border-box;
  background: radial-gradient(circle at 20% 0%, #1a2233 0%, $bg 55%);
  color: $text-main;
  font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

// 顶部标题栏
.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 960px;
  margin: 0 auto 28px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .logo-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: $brand;
      box-shadow: 0 0 12px $brand;
    }

    .header-title {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: $text-sub;

    .update-time {
      color: $brand;
    }

    .countdown-bar {
      width: 90px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;

      .countdown-fill {
        height: 100%;
        background: linear-gradient(90deg, $brand, #6ee7a8);
        transition: width 1s linear;
      }
    }
  }
}

// 概览卡片区
.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  max-width: 960px;
  margin: 0 auto 28px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }

  .overview-card {
    padding: 22px 20px;
    background: $card-bg;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    &.highlight {
      border-color: $brand-dim;
      background: linear-gradient(145deg, $card-bg, #13231a);
    }

    .card-label {
      font-size: 13px;
      color: $text-sub;
      margin-bottom: 12px;
    }

    .card-value {
      font-size: 34px;
      font-weight: 700;
      color: $text-main;
      line-height: 1;

      .card-unit {
        font-size: 15px;
        font-weight: 400;
        color: $text-sub;
        margin-left: 4px;
      }
    }

    .card-sub {
      margin-top: 10px;
      font-size: 12px;
      color: $text-sub;
    }
  }
}

// 服务列表
.service-section {
  max-width: 960px;
  margin: 0 auto 28px;
  padding: 20px 22px;
  background: $card-bg;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;

  .section-title {
    font-size: 14px;
    color: $text-sub;
    margin-bottom: 16px;
  }

  .service-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;

    @media (max-width: 720px) {
      grid-template-columns: 1fr;
    }
  }

  .service-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);

    .service-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.online {
        background: $brand;
        box-shadow: 0 0 0 0 $brand-dim;
        animation: pulse 2s infinite;
      }

      &.offline {
        background: $offline;
      }
    }

    .service-name {
      flex: 1;
      font-size: 14px;
    }

    .service-status {
      font-size: 13px;

      &.online {
        color: $brand;
      }

      &.offline {
        color: $offline;
      }
    }
  }
}

// 服务器资源占用（纵向堆叠：每项一行，标签左/数值右，通栏进度条）
.resource-section {
  max-width: 960px;
  margin: 0 auto 28px;
  padding: 20px 22px;
  background: $card-bg;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  animation: fade-up 0.5s ease 0.3s both;

  .section-title {
    font-size: 14px;
    color: $text-sub;
    margin-bottom: 18px;
  }

  .stack-list {
    display: flex;
    flex-direction: column;
    gap: 22px;

    .stack-item {
      .stack-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 10px;

        .stack-name {
          font-size: 14px;
        }

        .stack-value {
          font-size: 22px;
          font-weight: 700;
          color: $text-main;
        }
      }
    }
  }

  // 进度条底槽
  .bar {
    height: 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  // 进度条填充：宽度由内联 style 控制，颜色随档位变化，宽度过渡形成增长动效
  .bar-inner {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s ease;

    &.normal {
      background: linear-gradient(90deg, $brand, #6ee7a8);
    }

    &.warn {
      background: linear-gradient(90deg, #e6a23c, #f3c267);
    }

    &.danger {
      background: linear-gradient(90deg, $offline, #ff7b72);
    }
  }

  .resource-sub {
    margin-top: 8px;
    font-size: 12px;
    color: $text-sub;
  }
}

// 服务器负载与运行时长（三宫格，与概览卡片同宽对齐）
.load-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  max-width: 960px;
  margin: 0 auto 28px;
  animation: fade-up 0.5s ease 0.4s both;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }

  .load-card {
    padding: 22px 20px;
    background: $card-bg;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    text-align: center;
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .load-value {
      font-size: 34px;
      font-weight: 700;
      color: $brand;
      line-height: 1;
    }

    .load-label {
      margin-top: 8px;
      font-size: 13px;
      color: $text-sub;
    }
  }
}

// 卡片入场：淡入上浮（与移动端一致）
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 呼吸脉冲动画
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.5);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(46, 204, 113, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
  }
}

// 能力摘要文案
.summary-text {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  font-size: 13px;
  color: $text-sub;
  line-height: 1.8;

  .summary-num {
    color: $brand;
    font-weight: 600;
  }
}

// 骨架屏遮罩
.skeleton-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg;
  z-index: 10;

  .skeleton-tip {
    color: $text-sub;
    font-size: 14px;
  }
}
</style>
