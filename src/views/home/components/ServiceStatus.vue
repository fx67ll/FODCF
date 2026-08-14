<template>
  <section class="panel service-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">PROCESS STABILITY</span>
        <div class="panel-title-row">
          <h3>运行稳定性</h3>
          <panel-refresh :loading="refreshing" :timestamp="lastRefreshTime" @refresh="refresh" />
        </div>
      </div>
      <span class="live-dot" :class="{ muted: !available }"></span>
    </div>

    <div :class="{ 'refresh-flash': flashing }" class="status-body">
      <div class="status-ring" :style="{ '--rate': ringDeg + 'deg' }">
        <div class="status-ring-inner">
          <strong><animated-number v-if="available" :value="centerValue" :trigger="refreshTick" /><template
              v-else>--</template><small>{{
                available ? centerUnit : "" }}</small></strong>
          <span class="ring-caption">稳定运行</span>
        </div>
      </div>

      <div class="status-meta">
        <p class="status-text">{{ statusText }}</p>
        <div class="status-bar"><span :style="{ width: barPercent + '%' }"></span></div>
        <div class="status-meta-row">
          <span><i class="el-icon-timer"></i> 进程运行
            <b>
              <template v-if="processDays >= 1"><animated-number :value="processDays" :trigger="refreshTick" />
                天</template>
              <template v-else><animated-number :value="Number(uptimeHours)" :trigger="refreshTick" /> 小时</template>
            </b>
          </span>
          <span><i class="el-icon-open"></i> 系统开机
            <b><animated-number v-if="osUptimeDays" :value="osUptimeDays" :trigger="refreshTick" /><template
                v-else>--</template> 天</b>
          </span>
          <span><i class="el-icon-connection"></i> 服务在线
            <b><animated-number :value="onlineServiceCount" :trigger="refreshTick" />/<animated-number
                :value="totalServiceCount" :trigger="refreshTick" /></b>
          </span>
        </div>
      </div>
    </div>

    <button type="button" class="status-link" @click="openStatus">
      查看公开服务状态页 <i class="el-icon-top-right"></i>
    </button>
  </section>
</template>

<script>
import { getPublicStatusOverview } from "@/api/fx67ll/server/status";
import panelRefreshMixin from "../refreshMixin";
import PanelRefresh from "./PanelRefresh.vue";
import AnimatedNumber from "./AnimatedNumber.vue";

/**
 * 运行稳定性面板（脱敏数据，管理员 / 非管理员首页均可展示）
 * 圆环展示「应用进程稳定运行天数 / 系统开机天数」占比，衡量进程是否长稳运行
 */
export default {
  name: "HomeServiceStatus",
  components: { PanelRefresh, AnimatedNumber },
  mixins: [panelRefreshMixin],
  data() {
    return {
      available: false,
      onlineServiceCount: 0,
      totalServiceCount: 0,
      uptimeHours: 0,
      osUptimeDays: 0,
    };
  },
  computed: {
    // 应用进程持续运行的天数（每小时折算，保留 1 位小数）
    processDays() {
      const hours = Number(this.uptimeHours) || 0;
      return Math.round((hours / 24) * 10) / 10;
    },
    // 稳定运行占比 = 进程运行天数 / 系统开机天数
    stabilityRate() {
      const os = Number(this.osUptimeDays) || 0;
      if (!os) return 0;
      const rate = (this.processDays / os) * 100;
      if (rate > 100) return 100;
      return Math.round(rate);
    },
    ringDeg() {
      // 系统开机天数未知时，无法计算占比，圆环满圈兜底
      if (!this.osUptimeDays) return 360;
      return Math.min(360, this.stabilityRate * 3.6);
    },
    centerValue() {
      return this.osUptimeDays ? this.stabilityRate : this.processDays;
    },
    centerUnit() {
      return this.osUptimeDays ? "%" : "天";
    },
    onlineRate() {
      if (!this.totalServiceCount) return 0;
      return Math.round((this.onlineServiceCount / this.totalServiceCount) * 100);
    },
    barPercent() {
      if (!this.available) return 0;
      return this.osUptimeDays ? this.stabilityRate : 100;
    },
    statusText() {
      if (!this.available) return "公开状态暂不可用";
      if (!this.osUptimeDays) return "应用进程持续稳定运行";
      return this.stabilityRate >= 95 ? "应用进程长稳运行，无近期重启" : "进程近期可能存在重启";
    },
  },
  mounted() {
    this.fetchStatus();
  },
  methods: {
    // 面板刷新：标题右侧按钮触发，供欢迎区一键刷新调用
    refresh() {
      return this.runRefresh(() => this.fetchStatus());
    },
    fetchStatus() {
      return getPublicStatusOverview()
        .then((response) => {
          const data = (response && response.data) || {};
          this.onlineServiceCount = Number(data.onlineServiceCount) || 0;
          this.totalServiceCount = Number(data.totalServiceCount) || 0;
          this.uptimeHours = Number(data.uptimeHours) || 0;
          this.osUptimeDays = Number(data.osUptimeDays) || 0;
          this.available = true;
        })
        .catch(() => {
          this.available = false;
        });
    },
    openStatus() {
      window.open(`${window.location.origin}/status`, "_blank");
    },
  },
};
</script>

<style lang="scss" scoped>
.service-panel {
  display: flex;
  flex-direction: column;
}

.live-dot {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  background: #2ecc71;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgba(46, 204, 113, 0.14);
  animation: pulse 1.8s ease-in-out infinite;
  transition: transform 0.2s ease;
  transform: scale(1);

  &.muted {
    background: #a0aaa7;
    box-shadow: none;
    animation: none;
    transform: scale(1);
  }

  &:hover:not(.muted) {
    transform: scale(1.15);
    cursor: pointer;
  }
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 0 0 5px rgba(46, 204, 113, 0.14);
  }

  50% {
    box-shadow: 0 0 0 9px rgba(46, 204, 113, 0.04);
  }
}

.status-body {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.status-ring {
  position: relative;
  display: flex;
  flex: 0 0 108px;
  width: 108px;
  height: 108px;
  align-items: center;
  justify-content: center;
  background: conic-gradient(var(--home-primary) var(--rate), #e8f3ec 0);
  border-radius: 50%;
  transition: background 0.5s ease;
}

.status-ring-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  background: #fff;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--home-border);

  strong {
    color: var(--home-ink);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.1;
    margin-right: 1px;
  }

  small {
    color: var(--home-muted);
    font-size: 11px;
    position: relative;
    top: -2px;
  }

  .ring-caption {
    margin-top: 2px;
    color: var(--home-muted);
    font-size: 10px;
    letter-spacing: 0.04em;
  }
}

.status-meta {
  flex: 1;
  min-width: 0;
}

.status-text {
  margin: 0 0 12px;
  color: var(--home-ink-soft);
  font-size: 14px;
  font-weight: 600;
}

.status-bar {
  height: 7px;
  margin-bottom: 14px;
  overflow: hidden;
  background: #e8f3ec;
  border-radius: 99px;

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--home-primary), #58d68d);
    border-radius: inherit;
    transition: width 0.6s ease;
  }
}

.status-meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--home-muted);
  font-size: 12px;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  i {
    color: var(--home-primary);
  }

  b {
    /* 数值滚动拆成多个内联节点后需保证同行呈现，禁止在数字与单位之间换行 */
    display: inline-flex;
    align-items: baseline;
    color: var(--home-ink);
    font-size: 13px;
    white-space: nowrap;
  }
}

.status-link {
  align-self: flex-start;
  margin-top: 18px;
  padding: 9px 16px;
  color: var(--home-primary-dark);
  background: var(--home-primary-softer);
  border: 1px solid var(--home-border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.25s ease;

  &:hover {
    color: #fff;
    background: var(--home-primary);
    border-color: var(--home-primary);

    i {
      transform: translate(2px, -2px);
    }
  }

  i {
    margin-left: 3px;
    transition: transform 0.25s ease;
  }
}

@media (max-width: 520px) {
  .status-body {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
