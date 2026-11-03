<template>
  <!-- 盈亏速览卡：从最近盈亏记录派生累计盈亏/胜率/近十次走势条形（自包含加载，无权限或异常时整体隐藏） -->
  <div class="overview-extra-brief" v-if="extraBriefReady">
    <div class="extra-brief-main">
      <div class="extra-brief-icon">
        <i class="el-icon-coin"></i>
      </div>
      <div class="extra-brief-blocks">
        <div class="extra-brief-block">
          <div class="extra-brief-value" :class="briefMoneyClass(extraBrief.netMoney)">{{
            formatBriefMoney(extraBrief.netMoney) }}</div>
          <div class="extra-brief-label">累计盈亏（近{{ extraBrief.loadedCount }}笔）</div>
        </div>
        <div class="extra-brief-block">
          <div class="extra-brief-value">{{ extraBrief.winRate }}</div>
          <div class="extra-brief-label">最近记录胜率</div>
        </div>
        <div class="extra-brief-block">
          <div class="extra-brief-trend">
            <span class="trend-bar" v-for="(bar, barIndex) in extraBrief.trendBars" :key="barIndex" :class="bar.cls"
              :style="{ height: bar.height + '%' }"></span>
          </div>
          <div class="extra-brief-label">近十次盈亏走势</div>
        </div>
      </div>
      <div class="extra-brief-actions">
        <el-button size="mini" type="success" plain icon="el-icon-edit"
          @click="$emit('action', { type: 'extra', extraMode: 'extra' })">记一笔</el-button>
        <el-button size="mini" type="success" plain icon="el-icon-cpu"
          @click="$emit('action', { type: 'extra', extraMode: 'simulate' })">去模拟</el-button>
      </div>
    </div>
    <div class="extra-brief-tip" v-if="extraBriefPartial">记录较多，仅统计最近加载的数据，查看全部请进入盈亏页</div>
  </div>
</template>

<script>
import { listExtra } from "@/api/fx67ll/dortmund/extra";

export default {
  name: "OverviewExtraBrief",
  data() {
    return {
      // 盈亏速览数据（异步派生，null表示无权限或异常）
      extraBrief: null,
      // 盈亏速览是否只统计了部分记录
      extraBriefPartial: false,
    };
  },
  computed: {
    // 盈亏速览卡是否可展示（无权限或异常时整体隐藏，不占位）
    extraBriefReady() {
      return this.extraBrief !== null;
    },
  },
  created() {
    this.loadExtraBrief();
  },
  methods: {
    // 加载盈亏速览：取最近一批记录派生累计盈亏、胜率与近十次走势，失败时整卡隐藏
    loadExtraBrief() {
      listExtra({ pageNum: 1, pageSize: 50 }).then((response) => {
        const rows = response.rows || [];
        const total = response.total || 0;
        this.extraBriefPartial = total > rows.length;
        this.extraBrief = this.buildExtraBrief(rows);
      }).catch(() => {
        // 无权限或接口异常时隐藏速览卡，不影响页面其他区块
        this.extraBrief = null;
      });
    },
    // 从最近记录派生盈亏速览数据
    buildExtraBrief(rows) {
      let netMoney = 0;
      let winCount = 0;
      rows.forEach((item) => {
        const winMoney = parseFloat(item.winMoney);
        if (!isNaN(winMoney)) {
          netMoney += winMoney;
          if (item.isWin === "Y") {
            winCount += 1;
          }
        }
      });
      // 近十次走势条形：按时间正序展示最近十条，红亏绿赢灰平，高度按绝对值占比缩放
      const recentRows = rows.slice(0, 10);
      const maxAbs = Math.max(1, ...recentRows.map((item) => Math.abs(parseFloat(item.winMoney) || 0)));
      const trendBars = recentRows
        .slice()
        .reverse()
        .map((item) => {
          const winMoney = parseFloat(item.winMoney) || 0;
          const cls = winMoney > 0 ? "win" : winMoney < 0 ? "lose" : "zero";
          return { cls, height: Math.max(18, Math.round((Math.abs(winMoney) / maxAbs) * 100)) };
        });
      const loadedCount = rows.length;
      return {
        netMoney: netMoney.toFixed(2),
        loadedCount: loadedCount,
        winRate: loadedCount === 0 ? "-" : `${Math.round((winCount / loadedCount) * 100)}%`,
        trendBars: trendBars,
      };
    },
    // 速览金额展示（正数带加号）
    formatBriefMoney(value) {
      const money = parseFloat(value);
      if (isNaN(money)) {
        return "-";
      }
      return money > 0 ? `+${money}` : `${money}`;
    },
    // 速览金额配色：正数绿、负数红、零灰
    briefMoneyClass(value) {
      const money = parseFloat(value);
      if (isNaN(money) || money === 0) {
        return "zero";
      }
      return money > 0 ? "win" : "lose";
    },
  },
};
</script>

<style lang="scss" scoped>
/* ===== 盈亏速览卡 ===== */
.overview-extra-brief {
  margin-top: 16px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f7fdf9 100%);
  border: 1px solid var(--ov-border);
  border-radius: 18px;
  box-shadow: var(--ov-shadow);
  animation: overviewFadeUp 0.35s ease 0.1s both;
}

.extra-brief-main {
  display: flex;
  align-items: center;
}

.extra-brief-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  margin-right: 18px;
  font-size: 24px;
  color: #fff;
  background: linear-gradient(135deg, var(--ov-primary) 0%, var(--ov-primary-dark) 100%);
  border-radius: 13px;
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.28);
}

.extra-brief-blocks {
  display: flex;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
  gap: 28px;
}

.extra-brief-block {
  min-width: 120px;
}

.extra-brief-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;

  &.win {
    color: var(--ov-primary-dark);
  }

  &.lose {
    color: #ff5a5f;
  }

  &.zero {
    color: var(--ov-ink);
  }
}

.extra-brief-label {
  margin-top: 3px;
  font-size: 12px;
  color: var(--ov-muted);
}

/* 近十次盈亏走势条形：纯CSS迷你柱状 */
.extra-brief-trend {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 34px;
  margin-bottom: 3px;
}

.trend-bar {
  width: 10px;
  border-radius: 3px 3px 0 0;
  animation: trendBarGrow 0.4s ease both;

  &.win {
    background: linear-gradient(to top, var(--ov-primary) 0%, #7ee5a8 100%);
  }

  &.lose {
    background: linear-gradient(to top, #ff5a5f 0%, #ff9a9d 100%);
  }

  &.zero {
    background: #d5ddd9;
  }
}

.extra-brief-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 18px;
}

.extra-brief-tip {
  margin-top: 12px;
  font-size: 11px;
  color: #a8b5af;
}

/* 卡片入场与走势条生长动画 */
@keyframes overviewFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes trendBarGrow {
  from {
    height: 0;
  }
}

/* ===== 响应式：窄屏竖排 ===== */
@media screen and (max-width: 1000px) {
  .extra-brief-main {
    flex-direction: column;
    align-items: flex-start;

    .extra-brief-actions {
      flex-direction: row;
      margin-top: 14px;
      margin-left: 0;
    }
  }
}
</style>
