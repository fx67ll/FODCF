<template>
  <!-- 核心数据总览（真实接口统计，无权限或异常时显示占位符；卡片配置由父页面传入） -->
  <div class="overview-stats">
    <div class="stat-card" v-for="(item, index) in cards" :key="item.key"
      :style="{ animationDelay: index * 0.06 + 's' }" @click="$emit('jump', item.componentPath)">
      <div class="stat-card-icon">
        <i :class="item.icon"></i>
      </div>
      <div class="stat-card-info">
        <div class="stat-card-value">{{ formatStatValue(item.key) }}</div>
        <div class="stat-card-label">{{ item.label }}</div>
        <div class="stat-card-sub" :title="formatStatSubText(item)">{{ formatStatSub(item) }}</div>
      </div>
      <i class="el-icon-arrow-right stat-card-go"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: "OverviewStatCards",
  props: {
    // 数据卡片配置（页面级配置，含各卡片统计接口与跳转目标）
    cards: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // 核心数据总览（异步填充，undefined加载中、'-'无权限或异常）
      statTotals: {},
      // 核心数据副标题（每张卡最新一条记录的摘要，空表示加载中）
      statSubs: {},
    };
  },
  created() {
    this.loadStatTotals();
  },
  methods: {
    // 加载核心数据总览：每个接口只取第一条记录派生总数与副标题，失败时该卡片占位不影响其他卡片
    loadStatTotals() {
      this.cards.forEach((item) => {
        item
          .apiFunc({ pageNum: 1, pageSize: 1 })
          .then((response) => {
            this.animateStatValue(item.key, response.total || 0);
            this.$set(this.statSubs, item.key, this.deriveStatSub(item.key, response.rows));
          })
          .catch(() => {
            // 无权限或接口异常时占位展示，避免单个失败拖垮整排卡片
            this.$set(this.statTotals, item.key, "-");
            this.$set(this.statSubs, item.key, "");
          });
      });
    },
    // 数值滚动动画：requestAnimationFrame 约600毫秒从0滚到目标值（缓出曲线收尾）
    animateStatValue(key, targetValue) {
      if (typeof targetValue !== "number" || targetValue <= 0) {
        this.$set(this.statTotals, key, targetValue);
        return;
      }
      const duration = 600;
      const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.$set(this.statTotals, key, Math.round(targetValue * eased));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    },
    // 从第一条记录派生卡片副标题（无记录时返回占位文案）
    deriveStatSub(key, rows) {
      const firstRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!firstRow) {
        return "暂无记录";
      }
      switch (key) {
        case "season":
          return `最新：${firstRow.seasonName || firstRow.seasonCode || "-"}`;
        case "team":
          return `最新：${firstRow.teamName || firstRow.teamNameShort || "-"}`;
        case "match":
          return `最新：${this.formatMatchBrief(firstRow)}`;
        case "plan":
          return `最新：${this.formatPlanBrief(firstRow)}`;
        case "info":
          return `最新：${firstRow.pointTitle || "-"}`;
        case "extra":
          return `最新盈亏：${this.formatSignedMoney(firstRow.winMoney)}`;
        default:
          return "";
      }
    },
    // 比赛摘要文案：主队 vs 客队（取不到球队名时兜底占位）
    formatMatchBrief(row) {
      const homeText = row.homeTeamName || "主队";
      const awayText = row.awayTeamName || "客队";
      return `${homeText} vs ${awayText}`;
    },
    // 方案摘要文案：内容过长时截断展示
    formatPlanBrief(row) {
      const content = row.planContent || "-";
      return content.length > 12 ? content.slice(0, 12) + "…" : content;
    },
    // 带符号金额文案：正数带加号，非法值返回占位符
    formatSignedMoney(value) {
      const money = parseFloat(value);
      if (isNaN(money)) {
        return "-";
      }
      return money > 0 ? `+${money}` : `${money}`;
    },
    // 数据卡片数值展示：未返回时显示加载占位
    formatStatValue(key) {
      const value = this.statTotals[key];
      return value === undefined ? "…" : value;
    },
    // 数据卡片副标题展示：未返回时显示加载占位
    formatStatSub(item) {
      const value = this.statSubs[item.key];
      return value === undefined ? "…" : value;
    },
    // 数据卡片副标题完整文案（悬浮提示用）
    formatStatSubText(item) {
      return this.formatStatSub(item);
    },
  },
};
</script>

<style lang="scss" scoped>
/* ===== 核心数据总览 ===== */
.overview-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--ov-border);
  border-radius: 14px;
  box-shadow: var(--ov-shadow);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: overviewFadeUp 0.35s ease both;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--ov-shadow-hover);

    .stat-card-go {
      transform: translateX(3px);
      color: var(--ov-primary);
    }

    .stat-card-icon {
      transform: scale(1.06);
    }
  }
}

.stat-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: var(--ov-primary);
  background: var(--ov-primary-soft);
  border-radius: 10px;
  transition: transform 0.25s ease;
}

.stat-card-info {
  flex: 1;
  min-width: 0;
}

.stat-card-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ov-ink);
}

.stat-card-label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ov-muted);
}

.stat-card-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #9aa8a1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card-go {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--ov-muted);
  transition: transform 0.25s ease, color 0.25s ease;
}

/* 卡片入场动画 */
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

/* ===== 响应式：窄屏降列 ===== */
@media screen and (max-width: 1400px) {
  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 640px) {
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
