<template>
  <!-- 方案计划只读详情抽屉（数据由父页面拉取，摘要操作仍在抽屉底部完成） -->
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="方案计划详情" :subtitle="'查看方案正文、关联比赛与摘要操作'"
    icon="el-icon-notebook-2" tone="green" size="780px" :loading="reviewLoading" feature="plan"
    :shifted="combinationDetailVisible || matchDetailVisible">
    <dortmund-detail-card title="方案内容" icon="el-icon-document" tone="green">
      <div class="plan-detail-metric-groups">
        <section v-for="group in planMetricGroups" :key="group.key" class="plan-detail-metric-group"
          :data-kind="group.key">
          <header class="plan-detail-group-head">
            <span class="plan-detail-group-title"><i :class="group.icon"></i>{{ group.title }}</span>
            <span class="plan-detail-group-note">{{ group.note }}</span>
          </header>
          <div class="plan-detail-metric-grid">
            <article v-for="item in group.items" :key="item.label" class="plan-detail-metric">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>
        </section>
      </div>
      <div class="plan-detail-context-row">
        <span v-for="item in planContextItems" :key="item.label" class="plan-detail-context-item">
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </span>
      </div>
      <section class="plan-detail-copy plan-detail-copy--main">
        <header class="plan-detail-copy-head">
          <span><i class="el-icon-document"></i>方案正文</span>
          <small>计划策略与执行说明</small>
        </header>
        <div class="plan-detail-content">{{ detailModel.planContent || '暂无方案正文' }}</div>
      </section>
      <section class="plan-detail-copy plan-detail-copy--remark">
        <header class="plan-detail-copy-head">
          <span><i class="el-icon-chat-line-square"></i>其他说明</span>
          <small>补充备注</small>
        </header>
        <div class="plan-detail-remark">{{ detailModel.planRemark || '暂无其他说明' }}</div>
      </section>
    </dortmund-detail-card>

    <dortmund-detail-card title="关联比赛" icon="el-icon-football" tone="green"
      :subtitle="`共 ${(detailModel.matches || []).length} 场`">
      <dortmund-plan-linked-matches-table :matches="detailModel.matches || []" :level="1"
        @detail-change="matchDetailVisible = $event" />
    </dortmund-detail-card>

    <dortmund-detail-card title="关联回报组合" icon="el-icon-connection" tone="green"
      :subtitle="`共 ${combinationRows.length} 条`">
      <template slot="extra">
        <dortmund-verification-status-tag v-if="detailModel.combinationIds && detailModel.combinationIds.length"
          :status="detailModel.combinationVerificationStatus" />
      </template>
      <el-table :data="combinationRows" v-loading="combinationLoading" size="small" empty-text="暂无关联回报组合"
        class="plan-linked-table">
        <el-table-column label="组合标题" prop="combinationTitle" min-width="170" show-overflow-tooltip />
        <el-table-column label="组合倍率" prop="combinedOdds" width="94" align="center" />
        <el-table-column label="预计回报" width="110" align="center">
          <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.estimatedReturn) }}</template>
        </el-table-column>
        <el-table-column label="比赛数" prop="matchCount" width="78" align="center" />
        <el-table-column label="核验状态" width="104" align="center">
          <template slot-scope="scope">
            <dortmund-verification-status-tag :status="scope.row.verificationStatus" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="76" fixed="right">
          <template slot-scope="scope">
            <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
              @click="openCombinationDetail(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
    </dortmund-detail-card>
    <dortmund-return-combination-detail-drawer :visible.sync="combinationDetailVisible"
      :combination-id="selectedCombinationId" :snapshot="selectedCombination" :level="2" />
    <template slot="footer">
      <el-button v-if="hasSummaryPermission" type="primary" plain icon="el-icon-document-copy" :loading="summaryLoading"
        @click="$emit('copy-summary')">复制摘要</el-button>
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>
  </dortmund-detail-drawer>
</template>

<script>
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundPlanLinkedMatchesTable
  from "@/views/fx67ll/dortmund/other/component/DortmundPlanLinkedMatchesTable/index";
import DortmundReturnCombinationDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundReturnCombinationDetailDrawer/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import { getCombination } from "@/api/fx67ll/dortmund/returnCombination";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";

export default {
  name: "PlanDetailDrawer",
  dicts: ["sys_notice_status", "fx67ll_match_result", "fx67ll_dortmund_odds_type"],
  components: {
    DortmundDetailDrawer,
    DortmundDetailCard,
    DortmundPlanLinkedMatchesTable,
    DortmundReturnCombinationDetailDrawer,
    DortmundVerificationStatusTag,
    DortmundActionButton,
  },
  data() {
    return {
      combinationRows: [],
      combinationLoading: false,
      combinationLoadSerial: 0,
      combinationDetailVisible: false,
      selectedCombinationId: null,
      selectedCombination: null,
      matchDetailVisible: false,
    };
  },
  computed: {
    planExpectedMetrics() {
      return [
        { label: '预计本金', value: this.formatAmountZero(this.detailModel.effectiveExpectedPrincipal ?? this.detailModel.planExpectedPrincipal ?? this.detailModel.calculatedExpectedPrincipal) },
        { label: '预计倍率', value: this.displayNumber(this.detailModel.effectiveExpectedOdds ?? this.detailModel.planExpectedOdds) },
        { label: '预计回报', value: this.formatAmountZero(this.detailModel.effectiveExpectedReturn ?? this.detailModel.planExpectedReturn ?? this.detailModel.calculatedExpectedReturn) },
      ];
    },
    planActualMetrics() {
      return [
        { label: '实际本金', value: this.formatAmountZero(this.detailModel.planActualPrincipal) },
        { label: '实际倍率', value: this.displayNumber(this.detailModel.planActualOdds) },
        { label: '实际回报', value: this.formatAmountZero(this.detailModel.planActualReturn) },
      ];
    },
    planMetricGroups() {
      return [
        { key: 'expected', title: '预计口径', note: '目标值与手工修正', icon: 'el-icon-data-line', items: this.planExpectedMetrics },
        { key: 'actual', title: '实际口径', note: '结算后的真实数据', icon: 'el-icon-finished', items: this.planActualMetrics },
      ];
    },
    planContextItems() {
      // 关联比赛之后紧接着展示组合数量和记录更新人，便于从方案摘要直接核对关联规模与最近维护者。
      const combinationCount = Array.isArray(this.detailModel.combinationIds)
        ? this.detailModel.combinationIds.length : this.combinationRows.length;
      return [
        { label: '关联比赛', value: (this.detailModel.matches || []).length + ' 场', icon: 'el-icon-football' },
        { label: '关联回报组合', value: combinationCount + ' 条', icon: 'el-icon-connection' },
        { label: '记录更新人', value: formatAuditActor(this.detailModel.updateBy), icon: 'el-icon-user' },
        { label: '最近更新', value: this.parseTime(this.detailModel.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-', icon: 'el-icon-refresh' },
      ];
    },
    // 将父页面开关代理到共享详情抽屉
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.loadCombinationRows();
      }
    },
    "detailModel.combinationIds": {
      handler() {
        if (this.visible) {
          this.loadCombinationRows();
        }
      },
      deep: true,
    },
  },
  props: {
    // 抽屉开关（父页面 .sync 维护）
    visible: {
      type: Boolean,
      default: false,
    },
    // 完整只读详情（父页面拉取，拉取前为空对象兜底）
    detailModel: {
      type: Object,
      default: () => ({}),
    },
    // 详情加载状态
    reviewLoading: {
      type: Boolean,
      default: false,
    },
    // 是否拥有方案计划摘要权限
    hasSummaryPermission: {
      type: Boolean,
      default: false,
    },
    // 复制摘要前的刷新请求状态
    summaryLoading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    // 详情口径中的金额缺失时统一展示 0，不再使用短横线占位。
    formatAmountZero(value) {
      const displayValue = formatMoneyDisplay(value);
      return !displayValue || displayValue === "-" ? "0" : displayValue;
    },
    displayNumber(value) {
      return value === null || value === undefined || value === "" || value === "-" ? 0 : value;
    },
    // 详情接口只返回组合主键；按主键补全标题和指标，供只读抽屉展示与打开详情。
    loadCombinationRows() {
      const ids = [...new Set((this.detailModel.combinationIds || []).filter((id) => id !== null && id !== undefined))];
      const loadSerial = ++this.combinationLoadSerial;
      if (!ids.length) {
        this.combinationRows = [];
        this.combinationLoading = false;
        return Promise.resolve();
      }
      this.combinationLoading = true;
      return Promise.all(ids.map((combinationId) => getCombination(combinationId)
        .then((response) => ({ combinationId, ...((response && response.data) || {}) }))
        .catch(() => ({ combinationId, combinationTitle: "未命名组合" }))))
        .then((rows) => {
          if (loadSerial === this.combinationLoadSerial) {
            this.combinationRows = rows;
          }
        })
        .finally(() => {
          if (loadSerial === this.combinationLoadSerial) {
            this.combinationLoading = false;
          }
        });
    },
    openCombinationDetail(row) {
      if (!row || row.combinationId === null || row.combinationId === undefined) {
        return;
      }
      this.selectedCombination = { ...row };
      this.selectedCombinationId = row.combinationId;
      this.combinationDetailVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.plan-linked-table {
  overflow: hidden;
  border: 1px solid #e3eee8;
  border-radius: 10px;

  &::before {
    display: none;
  }

  ::v-deep .el-table__header-wrapper th,
  ::v-deep .el-table__fixed-header-wrapper th {
    font-weight: 600;
    color: #44604f;
    background-color: #f3f9f5;
    border-bottom: 1px solid #e3eee8;
  }

  ::v-deep .el-table__body td.el-table__cell {
    border-bottom: 1px solid #f0f5f2;
  }

  ::v-deep .el-table__body tr {
    transition: background-color 0.18s ease;
  }

  ::v-deep .el-table__body tr:hover>td.el-table__cell {
    background-color: #f0faf4;
  }

  ::v-deep .el-table__body td.el-table__cell .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ::v-deep .dortmund-action-column .cell {
    display: flex;
    justify-content: center;
  }
}

.plan-detail-metric-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.plan-detail-metric-group {
  padding: 14px;
  background: #f7fbf8;
  border: 1px solid #e3eee7;
  border-radius: 12px;
}

.plan-detail-metric-group[data-kind='actual'] {
  background: #fffbf5;
  border-color: #f0e4d3;
}

.plan-detail-group-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 11px;
}

.plan-detail-group-title {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 720;
  color: #2f6350;
}

.plan-detail-group-title i {
  font-size: 13px;
}

.plan-detail-metric-group[data-kind='actual'] .plan-detail-group-title {
  color: #8b6240;
}

.plan-detail-group-note {
  font-size: 10px;
  color: #8a9791;
}

.plan-detail-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.plan-detail-metric {
  min-width: 0;
  padding: 10px 11px;
  background: #fff;
  border: 1px solid #e8f0eb;
  border-radius: 9px;
}

.plan-detail-metric-group[data-kind='actual'] .plan-detail-metric {
  border-color: #f1e8dc;
}

.plan-detail-metric span {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #84928b;
  letter-spacing: .04em;
}

.plan-detail-metric strong {
  display: block;
  font-size: 16px;
  font-weight: 720;
  line-height: 1.4;
  color: #263a30;
  overflow-wrap: anywhere;
}

.plan-detail-metric-group[data-kind='actual'] .plan-detail-metric strong {
  color: #8b5d36;
}

.plan-detail-context-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.plan-detail-context-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  background: #f7f9f8;
  border: 1px solid #eef2ef;
  border-radius: 9px;
}

.plan-detail-context-item i {
  color: #3f9d72;
  font-size: 12px;
}

.plan-detail-context-item span {
  font-size: 10px;
  color: #8a9791;
}

.plan-detail-context-item strong {
  font-size: 12px;
  font-weight: 650;
  line-height: 1.4;
  color: #405248;
  overflow-wrap: anywhere;
}

.plan-detail-copy {
  padding: 14px 16px;
  margin-top: 12px;
  background: #f6fbf8;
  border: 1px solid #e1eee7;
  border-radius: 11px;
}

.plan-detail-copy--remark {
  background: #fbfbfa;
  border-color: #eef0ee;
}

.plan-detail-copy-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.plan-detail-copy-head span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 720;
  color: #2f6350;
}

.plan-detail-copy--remark .plan-detail-copy-head span {
  color: #5c6962;
}

.plan-detail-copy-head small {
  font-size: 10px;
  color: #8a9791;
}

.plan-detail-content {
  min-height: 0;
  height: auto;
  padding: 0;
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #33453d;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.plan-detail-remark {
  padding: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #65736c;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .plan-detail-metric-groups {
    grid-template-columns: 1fr;
  }

  .plan-detail-context-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .plan-detail-metric-grid {
    grid-template-columns: 1fr;
  }

  .plan-detail-context-row {
    grid-template-columns: 1fr;
  }

  .plan-detail-copy {
    padding: 13px 14px;
  }
}
</style>
