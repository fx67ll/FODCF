<template>
  <!-- 方案计划只读详情抽屉（数据由父页面拉取，摘要操作仍在抽屉底部完成） -->
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="方案计划详情" :subtitle="'查看方案正文、关联比赛与摘要操作'"
    icon="el-icon-notebook-2" tone="green" size="780px" :loading="reviewLoading" feature="plan">
    <dortmund-detail-card title="方案内容" icon="el-icon-document" tone="green">
      <dortmund-detail-block variant='metric' tone='green' :items='planOverviewMetrics' />
      <div class="dortmund-detail-subheading">方案正文</div>
      <div class="dortmund-detail-text-block plan-detail-content">{{ detailModel.planContent || '暂无方案正文'
      }}</div>
      <div class="dortmund-detail-subheading">其他说明</div>
      <div class="dortmund-detail-text-block">{{ detailModel.planRemark || '暂无其他说明' }}</div>
    </dortmund-detail-card>

    <dortmund-detail-card title="关联比赛" icon="el-icon-football" tone="green"
      :subtitle="`共 ${(detailModel.matches || []).length} 场`">
      <el-table :data="detailModel.matches || []" size="small" empty-text="暂无关联比赛">
        <el-table-column label="所属赛季" align="center" prop="seasonName" width="120" show-overflow-tooltip />
        <el-table-column label="主队" align="center" prop="homeTeamName" min-width="130" show-overflow-tooltip />
        <el-table-column label="客队" align="center" prop="awayTeamName" min-width="130" show-overflow-tooltip />
        <el-table-column label="比赛时间" align="center" prop="matchTime" width="150" class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="比赛状态" align="center" prop="matchStatus" width="100">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
          </template>
        </el-table-column>
        <el-table-column label="比赛结果" align="center" prop="matchResult" width="100">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.fx67ll_match_result" :value="scope.row.matchResult" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="76" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" class="dortmund-theme-text" icon="el-icon-document"
              @click="openMatchDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </dortmund-detail-card>

    <dortmund-detail-card title="关联回报组合" icon="el-icon-connection" tone="green"
      :subtitle="`共 ${combinationRows.length} 条`">
      <template slot="extra">
        <dortmund-verification-status-tag v-if="detailModel.combinationIds && detailModel.combinationIds.length"
          :status="detailModel.combinationVerificationStatus" />
      </template>
      <el-table :data="combinationRows" v-loading="combinationLoading" size="small" empty-text="暂无关联回报组合">
        <el-table-column label="组合标题" prop="combinationTitle" min-width="170" show-overflow-tooltip />
        <el-table-column label="组合编码" prop="combinationCode" min-width="145" show-overflow-tooltip />
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
        <el-table-column label="操作" align="center" width="76" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" class="dortmund-theme-text" icon="el-icon-document"
              @click="openCombinationDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </dortmund-detail-card>
    <dortmund-return-combination-detail-drawer :visible.sync="combinationDetailVisible"
      :combination-id="selectedCombinationId" :snapshot="selectedCombination" />
    <dortmund-match-detail-drawer :visible.sync="matchDetailVisible" :match-id="selectedMatchId"
      :snapshot="selectedMatch" />
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
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundReturnCombinationDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundReturnCombinationDetailDrawer/index";
import DortmundMatchDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundMatchDetailDrawer/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import { getCombination } from "@/api/fx67ll/dortmund/returnCombination";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";

export default {
  name: "PlanDetailDrawer",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: {
    DortmundDetailDrawer,
    DortmundDetailCard,
    DortmundDetailBlock,
    DortmundReturnCombinationDetailDrawer,
    DortmundMatchDetailDrawer,
    DortmundVerificationStatusTag,
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
      selectedMatchId: null,
      selectedMatch: null,
    };
  },
  computed: {
    planOverviewMetrics() {
      return [
        { label: '方案ID', value: this.detailModel.planId, icon: 'el-icon-postcard' },
        { label: '预计本金', value: this.formatMoneyDisplay(this.detailModel.effectiveExpectedPrincipal ?? this.detailModel.planExpectedPrincipal ?? this.detailModel.calculatedExpectedPrincipal), icon: 'el-icon-wallet' },
        { label: '预计倍率', value: this.displayNumber(this.detailModel.effectiveExpectedOdds ?? this.detailModel.planExpectedOdds ?? this.detailModel.calculatedExpectedOdds), icon: 'el-icon-data-line' },
        { label: '预计回报', value: this.formatMoneyDisplay(this.detailModel.effectiveExpectedReturn ?? this.detailModel.planExpectedReturn ?? this.detailModel.calculatedExpectedReturn), icon: 'el-icon-money' },
        { label: '实际本金', value: this.formatMoneyDisplay(this.detailModel.planActualPrincipal), icon: 'el-icon-bank-card' },
        { label: '实际倍率', value: this.displayNumber(this.detailModel.planActualOdds), icon: 'el-icon-aim' },
        { label: '实际回报', value: this.formatMoneyDisplay(this.detailModel.planActualReturn), icon: 'el-icon-sold-out' },
        { label: '自动预计本金', value: this.formatMoneyDisplay(this.detailModel.calculatedExpectedPrincipal), icon: 'el-icon-connection' },
        { label: '自动预计倍率', value: this.displayNumber(this.detailModel.calculatedExpectedOdds), icon: 'el-icon-connection' },
        { label: '自动预计回报', value: this.formatMoneyDisplay(this.detailModel.calculatedExpectedReturn), icon: 'el-icon-money' },
        { label: '关联比赛', value: (this.detailModel.matches || []).length + ' 场', icon: 'el-icon-football' },
        { label: '更新时间', value: this.parseTime(this.detailModel.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-', icon: 'el-icon-refresh' },
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
    displayNumber(value) {
      return value === null || value === undefined || value === "" ? "-" : value;
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
        .catch(() => ({ combinationId, combinationTitle: `组合 ${combinationId}` }))))
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
    openMatchDetail(row) {
      if (!row || row.matchId === null || row.matchId === undefined) {
        return;
      }
      this.selectedMatch = { ...row };
      this.selectedMatchId = row.matchId;
      this.matchDetailVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.plan-detail-content {
  min-height: 120px;
  padding: 2px 0 2px 18px;
  margin-top: 8px;
  font-size: 14.5px;
  line-height: 1.85;
  color: #33453d;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: transparent;
  border: 0;
  border-left: 2px solid #3f8f77;
  border-radius: 0;
}

@media (max-width: 520px) {
  .plan-detail-content {
    padding: 14px 15px;
  }
}
</style>
