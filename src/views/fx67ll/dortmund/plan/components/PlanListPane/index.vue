<template>
  <!-- 方案计划列表视图（总览列表的另一种展示形式，数据与操作均来自父页面） -->
  <div class="plan-list-pane">
    <el-table v-loading="loading" :data="rows" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="46" align="center" />
      <el-table-column label="方案计划" align="center" prop="planContent" min-width="260" fixed="left"
        :show-overflow-tooltip="true" />
      <el-table-column label="组合核验" align="center" width="104">
        <template slot-scope="scope">
          <dortmund-verification-status-tag v-if="scope.row.combinationIds && scope.row.combinationIds.length"
            :status="scope.row.combinationVerificationStatus" />
          <span v-else class="plan-empty-status">-</span>
        </template>
      </el-table-column>
      <el-table-column label="预计本金" align="center" prop="effectiveExpectedPrincipal" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatMoneyDisplay(effectivePrincipal(scope.row)) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计倍率" align="center" prop="effectiveExpectedOdds" width="100">
        <template slot-scope="scope">
          <span class="plan-rate-tag">{{ effectiveOdds(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计回报" align="center" prop="effectiveExpectedReturn" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatMoneyDisplay(effectiveReturn(scope.row)) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际本金" align="center" prop="planActualPrincipal" width="118">
        <template slot-scope="scope">
          <span class="plan-amount-text">{{ formatMoneyDisplay(scope.row.planActualPrincipal) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际倍率" align="center" prop="planActualOdds" width="100" />
      <el-table-column label="实际回报" align="center" prop="planActualReturn" width="118">
        <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.planActualReturn) }}</template>
      </el-table-column>
      <el-table-column label="关联比赛" align="center" prop="matchSummary" min-width="260" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ formatMatchSummary(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="自动预计倍率" align="center" prop="calculatedExpectedOdds" width="110" />
      <el-table-column label="其他说明" align="center" prop="planRemark" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="记录更新者" align="center" prop="updateBy" min-width="100" show-overflow-tooltip />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="150" class-name="dortmund-nowrap-cell">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
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
    // 列表关联比赛摘要：场次 + 对阵
    formatMatchSummary(row) {
      const matches = row.matches || [];
      if (!matches.length) {
        return "";
      }
      const vsText = matches.map(item => `${item.homeTeamName || ""}vs${item.awayTeamName || ""}`).join("、");
      return `共${matches.length}场：${vsText}`;
    },
    // 代理金额展示工具（空值/非法值返回占位符，数值原样展示）
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    // 预计本金优先取服务端有效值；旧快照或局部刷新时回退到手工值和自动值。
    effectivePrincipal(row) {
      const value = row.effectiveExpectedPrincipal !== null && row.effectiveExpectedPrincipal !== undefined
        ? row.effectiveExpectedPrincipal : (row.planExpectedPrincipal ?? row.calculatedExpectedPrincipal);
      return value === null || value === undefined || value === "" ? "" : value;
    },
    // 预计值优先取后端计算的有效值；旧数据或局部刷新时回退到手工值/自动值。
    effectiveOdds(row) {
      const value = row.effectiveExpectedOdds !== null && row.effectiveExpectedOdds !== undefined
        ? row.effectiveExpectedOdds : (row.planExpectedOdds ?? row.calculatedExpectedOdds);
      return value === null || value === undefined || value === "" ? "-" : value;
    },
    effectiveReturn(row) {
      const value = row.effectiveExpectedReturn !== null && row.effectiveExpectedReturn !== undefined
        ? row.effectiveExpectedReturn : (row.planExpectedReturn ?? row.calculatedExpectedReturn);
      return value === null || value === undefined || value === "" ? "-" : value;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 列表录入倍率/金额列：胶囊与金额展示 */
.plan-rate-tag {
  display: inline-block;
  min-width: 40px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;
}

.plan-amount-text {
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
}

.plan-empty-status {
  color: #a8b3ad;
}
</style>
