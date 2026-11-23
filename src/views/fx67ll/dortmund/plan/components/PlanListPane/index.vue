<template>
  <!-- 方案计划列表视图（总览列表的另一种展示形式，数据与操作均来自父页面） -->
  <div class="plan-list-pane">
    <el-table v-loading="loading" :data="rows" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="46" align="center" />
      <el-table-column label="方案计划" align="center" prop="planContent" min-width="230" fixed="left"
        :show-overflow-tooltip="true" />
      <el-table-column label="关联比赛" align="center" width="106" fixed="left">
        <template slot-scope="scope">
          <button v-if="matchCount(scope.row) > 0" type="button" class="plan-count-link"
            :title="`查看关联的 ${matchCount(scope.row)} 场比赛`" @click.stop="$emit('view-matches', scope.row)">
            {{ matchCount(scope.row) }}
          </button>
          <span v-else class="plan-count-zero">0</span>
        </template>
      </el-table-column>
      <el-table-column label="关联组合" align="center" width="106" fixed="left">
        <template slot-scope="scope">
          <button v-if="combinationCount(scope.row) > 0" type="button" class="plan-count-link"
            :title="`查看关联的 ${combinationCount(scope.row)} 条回报组合`" @click.stop="$emit('view-combinations', scope.row)">
            {{ combinationCount(scope.row) }}
          </button>
          <span v-else class="plan-count-zero">0</span>
        </template>
      </el-table-column>
      <el-table-column label="组合核验" align="center" width="112">
        <template slot-scope="scope">
          <dortmund-verification-status-tag v-if="combinationCount(scope.row) > 0"
            :status="scope.row.combinationVerificationStatus" />
          <dortmund-verification-status-tag v-else no-combination />
        </template>
      </el-table-column>
      <el-table-column label="预计本金" align="center" prop="effectiveExpectedPrincipal" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatAmount(effectivePrincipal(scope.row)) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计倍率" align="center" prop="effectiveExpectedOdds" width="100">
        <template slot-scope="scope">
          <span class="plan-rate-tag">{{ displayNumber(effectiveOdds(scope.row)) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计回报" align="center" prop="effectiveExpectedReturn" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatAmount(effectiveReturn(scope.row)) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际本金" align="center" prop="planActualPrincipal" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatAmount(scope.row.planActualPrincipal) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际倍率" align="center" prop="planActualOdds" width="100">
        <template slot-scope="scope">
          <span class="plan-rate-tag is-actual">{{ displayNumber(scope.row.planActualOdds) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际回报" align="center" prop="planActualReturn" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatAmount(scope.row.planActualReturn) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="其他说明" align="center" prop="planRemark" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="记录创建者" align="center" prop="createBy" min-width="100" show-overflow-tooltip>
        <template slot-scope="scope">{{ formatAuditActor(scope.row.createBy) }}</template>
      </el-table-column>
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="150" class-name="dortmund-nowrap-cell">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" min-width="100" show-overflow-tooltip>
        <template slot-scope="scope">{{ formatAuditActor(scope.row.updateBy) }}</template>
      </el-table-column>
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="150" class-name="dortmund-nowrap-cell">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width dortmund-action-column"
        fixed="right" width="122">
        <template slot-scope="scope">
          <dortmund-action-button label="详情" icon="el-icon-document" action="detail" @click="$emit('review', scope.row)"
            v-hasPermi="['dortmund:plan:query']" />
          <dortmund-action-button label="修改" icon="el-icon-edit" action="edit" @click="$emit('update', scope.row)"
            v-hasPermi="['dortmund:plan:edit']" />
          <dortmund-action-button label="删除" icon="el-icon-delete" action="delete" @click="$emit('delete', scope.row)"
            v-hasPermi="['dortmund:plan:remove']" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";

import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";

// 列表数值空值判定：null、空白字符串及后端历史占位符 "-" 均按未填写处理。
function isEmptyNumericValue(value) {
  if (value === null || value === undefined) {
    return true;
  }
  const text = String(value).trim();
  return text === "" || text === "-";
}

// 按优先级取首个有效数值，跳过空值与占位符，保证预计字段可回退到手工值或计算值。
function firstFilledValue(...values) {
  for (const value of values) {
    if (!isEmptyNumericValue(value)) {
      return value;
    }
  }
  return null;
}

export default {
  name: "PlanListPane",
  components: { DortmundActionButton, DortmundVerificationStatusTag },
  props: {
    // 方案计划列表数据（与卡片视图同一份，父页面持有）
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
    // 多选框选中数据（透传给父页面维护选中数组）
    handleSelectionChange(selection) {
      this.$emit("selection-change", selection);
    },
    // 关联比赛数量以后端批量派生值为准，旧快照回退到比赛数组长度。
    matchCount(row) {
      const count = Number(row.matchCount);
      if (Number.isFinite(count) && count >= 0) {
        return count;
      }
      return (row.matches || []).length;
    },
    // 关联组合数量统一按组合主键集合计算，避免列表局部刷新时不同字段不同步。
    combinationCount(row) {
      return (row.combinationIds || []).length;
    },
    // 预计本金为空时展示 0，避免列表出现空白金额格。
    effectivePrincipal(row) {
      return firstFilledValue(row.effectiveExpectedPrincipal, row.planExpectedPrincipal,
        row.calculatedExpectedPrincipal);
    },
    // 预计倍率只取有效手工值；后端已统一回填，旧快照再回退到手工字段。
    effectiveOdds(row) {
      return firstFilledValue(row.effectiveExpectedOdds, row.planExpectedOdds);
    },
    effectiveReturn(row) {
      return firstFilledValue(row.effectiveExpectedReturn, row.planExpectedReturn,
        row.calculatedExpectedReturn);
    },
    // 金额字段空值统一展示 0；空白字符串由本列表直接兜底，避免通用金额工具返回占位符。
    formatAmount(value) {
      if (isEmptyNumericValue(value)) {
        return "0";
      }
      const displayValue = formatMoneyDisplay(value);
      return displayValue === "-" ? "0" : displayValue;
    },
    // 倍率字段空值统一展示 0，空白字符串同样按未填写处理，并保留有效数值原样精度。
    displayNumber(value) {
      return isEmptyNumericValue(value) ? 0 : value;
    },
    formatAuditActor(value) {
      return formatAuditActor(value);
    },
  },
};
</script>

<style lang="scss" scoped>
/* 列表录入倍率/金额列：保留轻量胶囊以区分预计与实际口径 */
.plan-rate-tag {
  display: inline-block;
  min-width: 40px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;

  &.is-actual {
    color: #f56c6c;
    background: #fef0f0;
  }
}

.plan-amount-text {
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
}

/* 关联数量保留为纯数字交互，不使用圆形底色。 */
.plan-count-link {
  padding: 2px 6px;
  font-size: 14px;
  font-weight: 700;
  color: #2ecc71;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition: color .18s ease, background-color .18s ease, transform .18s ease;

  &:hover {
    color: #23995a;
    background: #e9f9f0;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(46, 204, 113, .28);
    outline-offset: 1px;
  }
}

.plan-count-zero {
  font-size: 14px;
  font-weight: 700;
  color: #a8b3ad;
}
</style>
