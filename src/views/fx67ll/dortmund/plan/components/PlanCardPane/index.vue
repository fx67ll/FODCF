<template>
  <!-- 方案计划卡片视图（总览列表的另一种展示形式，数据与操作均来自父页面） -->
  <div class="plan-card-pane" v-loading="loading">
    <template v-if="rows.length > 0">
      <div class="plan-card-item" v-for="(plan, index) in rows" :key="plan.planId"
        :style="{ animationDelay: (index % 12) * 0.04 + 's' }">
        <div class="plan-card-head" @click="$emit('review', plan)">
          <span class="plan-card-content" :title="plan.planContent || '-'">{{ plan.planContent || '-' }}</span>
        </div>
        <div class="plan-card-metrics">
          <span class="plan-card-metric is-expected">
            <span>预计本金</span><strong>{{ formatAmount(effectivePrincipal(plan)) }}</strong>
          </span>
          <span class="plan-card-metric is-expected is-rate">
            <span>预计倍率</span><strong>{{ displayNumber(effectiveOdds(plan)) }}</strong>
          </span>
          <span class="plan-card-metric is-expected">
            <span>预计回报</span><strong>{{ formatAmount(effectiveReturn(plan)) }}</strong>
          </span>
          <span class="plan-card-metric is-actual">
            <span>实际本金</span><strong>{{ formatAmount(plan.planActualPrincipal) }}</strong>
          </span>
          <span class="plan-card-metric is-actual is-rate">
            <span>实际倍率</span><strong>{{ displayNumber(plan.planActualOdds) }}</strong>
          </span>
          <span class="plan-card-metric is-actual">
            <span>实际回报</span><strong>{{ formatAmount(plan.planActualReturn) }}</strong>
          </span>
        </div>
        <div class="plan-card-meta">
          <span class="plan-card-count">关联比赛 {{ matchCount(plan) }} 场</span>
          <span class="plan-card-count is-combination" v-if="hasCombinations(plan)">
            关联回报组合 {{ combinationCount(plan) }} 条
          </span>
          <span class="plan-card-no-combination" v-else>未关联回报组合</span>
          <dortmund-verification-status-tag v-if="hasCombinations(plan)" :status="plan.combinationVerificationStatus" />
        </div>
        <div class="plan-card-verification" v-if="hasCombinations(plan)">
          <div class="plan-card-verification-counts">
            <span class="is-success">已达成 <b>{{ verificationCount(plan, 'combinationSuccessCount') }}</b></span>
            <span class="is-failed">未达成 <b>{{ verificationCount(plan, 'combinationFailedCount') }}</b></span>
            <span class="is-pending">未核验 <b>{{ verificationCount(plan, 'combinationUnverifiedCount') }}</b></span>
          </div>
          <p class="plan-card-verification-text">{{ combinationVerificationSummary(plan) }}</p>
        </div>
        <div class="plan-card-match-section">
          <div class="plan-card-section-caption">
            <span><i class="el-icon-football"></i>关联比赛</span>
            <button v-if="isMatchesExpanded(plan)" type="button" class="plan-card-match-toggle is-collapse"
              @click="togglePlanMatches(plan)">收起</button>
          </div>
          <div class="plan-card-matches" v-if="matchCount(plan)">
            <el-tag v-for="match in visibleMatches(plan)" :key="match.matchId" size="mini" effect="plain"
              class="plan-card-match-tag">{{ formatMatchText(match) }}</el-tag>
            <button v-if="hiddenMatchCount(plan) > 0" type="button" class="plan-card-match-more"
              :title="`展开其余 ${hiddenMatchCount(plan)} 场关联比赛`" @click="togglePlanMatches(plan)">
              {{ isMatchesExpanded(plan) ? "收起" : `+${hiddenMatchCount(plan)} 场` }}
            </button>
          </div>
          <span v-else class="plan-card-match-empty">暂无关联比赛</span>
        </div>
        <div class="plan-card-footer">
          <span class="plan-card-time">{{ plan.updateBy || '-' }} · {{ parseTime(plan.updateTime, "{y}-{m}-{d}
            { h }: { i }: { s }")
          }}</span>
          <span class="plan-card-actions">
            <dortmund-action-button label="详情" icon="el-icon-document" action="detail" @click="$emit('review', plan)"
              v-hasPermi="['dortmund:plan:query']" />
            <dortmund-action-button label="修改" icon="el-icon-edit" action="edit" @click="$emit('update', plan)"
              v-hasPermi="['dortmund:plan:edit']" />
            <dortmund-action-button label="删除" icon="el-icon-delete" action="delete" @click="$emit('delete', plan)"
              v-hasPermi="['dortmund:plan:remove']" />
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
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";

// 与列表视图共享同一套空值口径：null、空白及历史占位符均按未填写处理。
function isEmptyNumericValue(value) {
  if (value === null || value === undefined) {
    return true;
  }
  const text = String(value).trim();
  return text === "" || text === "-";
}

function firstFilledValue(...values) {
  for (const value of values) {
    if (!isEmptyNumericValue(value)) {
      return value;
    }
  }
  return null;
}

export default {
  name: "PlanCardPane",
  components: { DortmundActionButton, DortmundVerificationStatusTag },
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
  data() {
    return {
      // 卡片比赛默认折叠为前三场；展开状态只保存在当前页面，不改变列表数据。
      expandedPlanIds: [],
    };
  },
  methods: {
    // 卡片比赛标签文案：主队 vs 客队（取不到球队名时兜底占位）
    formatMatchText(match) {
      const homeText = match.homeTeamName || "主队";
      const awayText = match.awayTeamName || "客队";
      return `${homeText} vs ${awayText}`;
    },
    effectiveOdds(plan) {
      return firstFilledValue(plan.effectiveExpectedOdds, plan.planExpectedOdds);
    },
    effectivePrincipal(plan) {
      return firstFilledValue(plan.effectiveExpectedPrincipal, plan.planExpectedPrincipal,
        plan.calculatedExpectedPrincipal);
    },
    effectiveReturn(plan) {
      return firstFilledValue(plan.effectiveExpectedReturn, plan.planExpectedReturn,
        plan.calculatedExpectedReturn);
    },
    matchCount(plan) {
      return Array.isArray(plan.matches) ? plan.matches.length : 0;
    },
    combinationCount(plan) {
      return Array.isArray(plan.combinationIds) ? plan.combinationIds.length : 0;
    },
    hasCombinations(plan) {
      return this.combinationCount(plan) > 0;
    },
    isMatchesExpanded(plan) {
      return this.expandedPlanIds.includes(plan.planId);
    },
    visibleMatches(plan) {
      const matches = Array.isArray(plan.matches) ? plan.matches : [];
      return this.isMatchesExpanded(plan) ? matches : matches.slice(0, 3);
    },
    hiddenMatchCount(plan) {
      if (this.isMatchesExpanded(plan)) {
        return 0;
      }
      return Math.max(0, this.matchCount(plan) - 3);
    },
    togglePlanMatches(plan) {
      if (!plan || plan.planId === null || plan.planId === undefined) {
        return;
      }
      if (this.isMatchesExpanded(plan)) {
        this.expandedPlanIds = this.expandedPlanIds.filter((planId) => planId !== plan.planId);
      } else {
        this.expandedPlanIds = [...this.expandedPlanIds, plan.planId];
      }
    },
    // 核验统计由后端按关联组合逐条汇总；缺失字段按 0 处理，避免卡片出现空值。
    verificationCount(plan, field) {
      return this.verificationStats(plan)[field] || 0;
    },
    /**
     * 归一化后端三项核验计数。
     * 兼容尚未返回计数字段的旧响应：方案确有组合但三项均为 0 时，按聚合状态回填数量，
     * 避免详情已经显示 5 条未达成、卡片却全部显示 0。
     */
    verificationStats(plan) {
      let success = this.toVerificationCount(plan && plan.combinationSuccessCount);
      let failed = this.toVerificationCount(plan && plan.combinationFailedCount);
      let unverified = this.toVerificationCount(plan && plan.combinationUnverifiedCount);
      if (success + failed + unverified === 0 && this.hasCombinations(plan)) {
        const combinationCount = this.combinationCount(plan);
        const status = plan && plan.combinationVerificationStatus;
        if (status === "Y") {
          success = combinationCount;
        } else if (status === "N") {
          failed = combinationCount;
        } else {
          unverified = combinationCount;
        }
      }
      return {
        combinationSuccessCount: success,
        combinationFailedCount: failed,
        combinationUnverifiedCount: unverified,
      };
    },
    toVerificationCount(value) {
      const count = Number(value);
      return Number.isFinite(count) && count > 0 ? count : 0;
    },
    // 根据三种状态生成易读结论，覆盖全部达成、全部未达成和全部未核验三类场景。
    combinationVerificationSummary(plan) {
      const stats = this.verificationStats(plan);
      const success = stats.combinationSuccessCount;
      const failed = stats.combinationFailedCount;
      const unverified = stats.combinationUnverifiedCount;
      const total = success + failed + unverified;
      if (!total) {
        return "关联组合尚无核验统计";
      }
      if (success === total) {
        return "全部达成，关联组合均已通过赛果核验";
      }
      if (failed === total) {
        return "全部未达成，建议复盘关联组合的逐场结果";
      }
      if (unverified === total) {
        return "尚未核验，登记赛果后可复核关联组合";
      }
      if (unverified > 0) {
        return `已核验 ${success + failed} 条，仍有 ${unverified} 条等待核验`;
      }
      return `核验已完成，${success} 条达成，${failed} 条未达成`;
    },
    // 金额与倍率空值统一展示 0，和列表视图保持完全一致。
    formatAmount(value) {
      if (isEmptyNumericValue(value)) {
        return "0";
      }
      const displayValue = formatMoneyDisplay(value);
      return displayValue === "-" ? "0" : displayValue;
    },
    displayNumber(value) {
      return isEmptyNumericValue(value) ? 0 : value;
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

.plan-card-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.plan-card-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 7px 9px;
  font-size: 12px;
  border-radius: 9px;
  transition: background-color .2s ease, transform .2s ease;

  >span {
    overflow: hidden;
    color: #7c8b84;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    flex-shrink: 0;
    color: #2b3a36;
    font-weight: 700;
  }

  &.is-expected {
    background: #f2fbf6;
  }

  &.is-actual {
    background: #fdf7f2;
  }

  &.is-rate.is-expected strong {
    color: #27ad60;
  }

  &.is-rate.is-actual strong {
    color: #f56c6c;
  }

  &:hover {
    background: #eaf7f0;
    transform: translateY(-1px);
  }
}

.plan-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 11px;
  font-size: 12px;
  color: #7c8b84;
}

.plan-card-count {
  padding: 3px 9px;
  background: #f3faf6;
  border-radius: 999px;

  &.is-combination {
    color: #257f52;
    background: #eaf8f0;
  }
}

.plan-card-no-combination {
  padding: 3px 9px;
  color: #929f98;
  background: #f5f7f6;
  border-radius: 999px;
}

.plan-card-verification {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 10px 12px;
  margin-top: 10px;
  background: linear-gradient(135deg, #fbfdfc 0%, #f5fbf7 100%);
  border: 1px solid #e7f0ea;
  border-radius: 10px;
}

.plan-card-verification-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 2px 7px;
    font-size: 11px;
    border-radius: 999px;
  }

  b {
    margin-left: 2px;
    font-size: 12px;
  }

  .is-success {
    color: #237a4c;
    background: #e9f8ef;
  }

  .is-failed {
    color: #b25055;
    background: #fdf0f1;
  }

  .is-pending {
    color: #8a6a32;
    background: #fcf6e8;
  }
}

.plan-card-verification-text {
  flex: 1 1 220px;
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: #75847d;
}

.plan-card-match-section {
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed #e4eee8;
}

.plan-card-section-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
  font-size: 11px;
  font-weight: 700;
  color: #718078;

  i {
    margin-right: 4px;
    color: #2ecc71;
  }
}

.plan-card-matches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.plan-card-match-tag {
  margin: 0;
  transition: transform .18s ease, border-color .18s ease, background-color .18s ease;

  &:hover {
    background: #eefaf3;
    border-color: #7dd7a6;
    transform: translateY(-1px);
  }
}

.plan-card-match-more {
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #258856;
  cursor: pointer;
  background: #eefaf3;
  border: 1px dashed #b7e3ca;
  border-radius: 999px;
  transition: transform .18s ease, background-color .18s ease, box-shadow .18s ease;

  &:hover {
    background: #e2f7eb;
    box-shadow: 0 4px 10px rgba(46, 204, 113, .14);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(.96);
  }
}

.plan-card-match-toggle {
  padding: 0;
  font-size: 11px;
  color: #70827a;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    color: #238653;
  }
}

.plan-card-match-empty {
  font-size: 12px;
  color: #a0aca6;
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

@media screen and (max-width: 700px) {
  .plan-card-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
