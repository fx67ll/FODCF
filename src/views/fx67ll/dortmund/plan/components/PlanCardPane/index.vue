<template>
  <!-- 方案计划卡片视图（总览列表的另一种展示形式，数据与操作均来自父页面） -->
  <div class="plan-card-pane" v-loading="loading">
    <template v-if="rows.length > 0">
      <div class="plan-card-item" v-for="(plan, index) in rows" :key="plan.planId"
        :style="{ animationDelay: (index % 12) * 0.04 + 's' }">
        <div class="plan-card-head" @click="$emit('review', plan)">
          <span class="plan-card-content" :title="plan.planContent || '-'">{{ plan.planContent || '-' }}</span>
          <span class="plan-card-rate" v-if="plan.planRate">倍率 {{ plan.planRate }}</span>
        </div>
        <div class="plan-card-meta">
          <span class="plan-card-amount" v-if="plan.planAmount">金额 {{ plan.planAmount }}</span>
          <span class="plan-card-count" v-if="plan.matches && plan.matches.length">共{{ plan.matches.length }}场</span>
          <span class="plan-card-images">组合 {{ plan.matchCount || 0 }}场</span>
        </div>
        <div class="plan-card-matches" v-if="plan.matches && plan.matches.length">
          <el-tag v-for="match in plan.matches.slice(0, 3)" :key="match.matchId" size="mini" effect="plain"
            class="plan-card-match-tag">{{ formatMatchText(match) }}</el-tag>
          <span class="plan-card-match-more" v-if="plan.matches.length > 3">+{{ plan.matches.length - 3 }}场</span>
        </div>
        <div class="plan-card-footer">
          <span class="plan-card-time">{{ plan.updateBy || '-' }} · {{ parseTime(plan.updateTime, "{y}-{m}-{d}")
          }}</span>
          <span class="plan-card-actions">
            <el-button size="mini" type="text" icon="el-icon-view" @click="$emit('review', plan)"
              v-hasPermi="['dortmund:plan:query']">回顾</el-button>
            <el-button size="mini" type="text" icon="el-icon-edit" @click="$emit('update', plan)"
              v-hasPermi="['dortmund:plan:edit']">修改</el-button>
            <el-button size="mini" type="text" icon="el-icon-delete" @click="$emit('delete', plan)"
              v-hasPermi="['dortmund:plan:remove']">删除</el-button>
          </span>
        </div>
      </div>
    </template>
    <!-- 空数据占位 -->
    <div class="plan-card-empty" v-else-if="!loading">
      <i class="el-icon-notebook-2"></i>
      <p>暂无方案计划数据</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "PlanCardPane",
  props: {
    // 方案计划列表数据（与列表视图同一份，父页面持有）
    rows: {
      type: Array,
      default: () => [],
    },
    // 列表加载状态
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    // 卡片比赛标签文案：主队 vs 客队（取不到球队名时兜底占位）
    formatMatchText(match) {
      const homeText = match.homeTeamName || "主队";
      const awayText = match.awayTeamName || "客队";
      return `${homeText} vs ${awayText}`;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 卡片视图：清新浅绿风格，与功能总览页同一视觉体系 */
.plan-card-pane {
  min-height: 120px;
}

.plan-card-item {
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: planCardFadeUp 0.3s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: #2ecc71;
    box-shadow: 0 16px 34px rgba(46, 204, 113, 0.16);
  }
}

.plan-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  cursor: pointer;
}

.plan-card-content {
  flex: 1;
  display: -webkit-box;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: #2b3a36;
  text-overflow: ellipsis;
  word-break: break-all;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.plan-card-rate {
  flex-shrink: 0;
  margin-left: 10px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;
}

.plan-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
  color: #7c8b84;
}

.plan-card-count,
.plan-card-images {
  padding: 1px 8px;
  background: #f2fbf6;
  border-radius: 999px;
}

.plan-card-amount {
  font-weight: 600;
  color: #44604f;
}

.plan-card-matches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}

.plan-card-match-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.plan-card-match-more {
  font-size: 12px;
  color: #7c8b84;
}

.plan-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed #e2eee7;
}

.plan-card-time {
  font-size: 12px;
  color: #9aa8a1;
}

.plan-card-actions {
  white-space: nowrap;
}

/* 空数据占位 */
.plan-card-empty {
  padding: 48px 0;
  text-align: center;

  i {
    font-size: 42px;
    color: #c6d1cb;
  }

  p {
    margin: 10px 0 0;
    font-size: 13px;
    color: #9aa8a1;
  }
}

@keyframes planCardFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式：宽屏双列，窄屏单列 */
@media screen and (min-width: 1100px) {
  .plan-card-item {
    display: inline-flex;
    vertical-align: top;
    width: calc(50% - 7px);
    margin-right: 14px;
  }

  .plan-card-item:nth-of-type(2n) {
    margin-right: 0;
  }
}
</style>
