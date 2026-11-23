<template>
  <dortmund-detail-drawer :visible.sync="drawerVisible" :title="drawerTitle" :subtitle="subtitle"
    icon="el-icon-collection-tag" tone="green" size="760px" :loading="loading" feature="return" :level="level"
    :shifted="combinationDetailVisible">
    <div class="adopted-combination-summary">
      <span class="adopted-combination-summary-icon"><i class="el-icon-finished"></i></span>
      <div>
        <strong>{{ summaryTitle }}</strong>
        <p>{{ summaryDescription }}</p>
      </div>
    </div>

    <el-table :data="rows" size="small" class="adopted-combination-table" row-key="combinationId"
      :empty-text="emptyText">
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
          <dortmund-action-button label="详情" icon="el-icon-document" action="detail" @click="handleDetail(scope.row)" />
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="pageNum" :limit.sync="pageSize" :page-sizes="pageSizes"
      :auto-scroll="false" @pagination="loadRows" />

    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>

    <dortmund-return-combination-detail-drawer :visible.sync="combinationDetailVisible"
      :combination-id="selectedCombinationId" :snapshot="selectedCombination" :level="nestedDrawerLevel" />
  </dortmund-detail-drawer>
</template>

<script>
import { getCombination, listCombination } from "@/api/fx67ll/dortmund/returnCombination";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { DORTMUND_DRAWER_LAYOUT, DORTMUND_PAGINATION }
  from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundReturnCombinationDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundReturnCombinationDetailDrawer/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";

export default {
  name: "DortmundAdoptedCombinationsDrawer",
  components: {
    DortmundDetailDrawer, DortmundReturnCombinationDetailDrawer, DortmundVerificationStatusTag,
    DortmundActionButton,
  },
  props: {
    visible: { type: Boolean, default: false },
    // 比赛记录入口按比赛主键查询已采用组合。
    matchId: { type: [Number, String], default: null },
    matchLabel: { type: String, default: "" },
    // 方案入口直接传入组合主键集合；传入数组即切换为方案模式。
    combinationIds: { type: Array, default: null },
    planLabel: { type: String, default: "" },
    // 从列表直接打开时为 1，从详情抽屉继续下钻时递增。
    level: { type: [Number, String], default: 1 },
  },
  data() {
    return {
      loading: false,
      rows: [],
      total: 0,
      pageNum: 1,
      pageSize: DORTMUND_PAGINATION.defaultPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      combinationDetailVisible: false,
      selectedCombinationId: null,
      selectedCombination: null,
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    // 显式传入数组时使用方案关联模式；否则保持比赛记录原有分页查询逻辑。
    planMode() {
      return Array.isArray(this.combinationIds);
    },
    normalizedCombinationIds() {
      if (!this.planMode) {
        return [];
      }
      return [...new Set(this.combinationIds.filter((id) => id !== null && id !== undefined && id !== ""))];
    },
    drawerTitle() {
      return this.planMode ? "关联回报组合" : "已采用回报组合";
    },
    subtitle() {
      if (this.planMode) {
        return this.planLabel ? `方案 · ${this.planLabel}` : "查看该方案关联的回报组合";
      }
      return this.matchLabel ? `比赛 · ${this.matchLabel}` : "查看该比赛关联的已采用组合";
    },
    summaryTitle() {
      return this.planMode
        ? `${this.planLabel || "当前方案"} 共关联 ${this.total} 条回报组合`
        : `${this.matchLabel || "当前比赛"} 已进入 ${this.total} 条采用组合`;
    },
    summaryDescription() {
      return this.planMode
        ? "这里展示方案当前关联的回报组合；点击“详情”可查看完整组合分析、逐场选择与图片。"
        : "这里只展示已采用结果；点击“详情”可查看完整组合分析、逐场选择与图片。";
    },
    emptyText() {
      return this.planMode ? "当前方案暂未关联回报组合" : "当前比赛暂未进入已采用的回报组合";
    },
    // 组合详情在当前抽屉之上再下钻一级，层级由共享抽屉统一控制。
    nestedDrawerLevel() {
      const currentLevel = Number.parseInt(this.level, 10);
      const normalizedLevel = Number.isFinite(currentLevel) ? currentLevel : 1;
      return Math.min(DORTMUND_DRAWER_LAYOUT.maxLevel, Math.max(1, normalizedLevel) + 1);
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.pageNum = 1;
        this.loadRows();
      }
    },
    combinationIds: {
      deep: true,
      handler() {
        if (this.visible && this.planMode) {
          this.pageNum = 1;
          this.loadRows();
        }
      },
    },
  },
  methods: {
    loadRows() {
      if (this.planMode) {
        this.loadPlanCombinationRows();
        return;
      }
      if (this.matchId === null || this.matchId === undefined || this.matchId === "") {
        this.rows = [];
        this.total = 0;
        return;
      }
      this.loading = true;
      listCombination({
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        matchId: this.matchId,
        adoptedFlag: "Y",
        sortField: "createTime",
        sortOrder: "desc",
      }).then((response) => {
        this.rows = (response && response.rows) || [];
        this.total = Number(response && response.total) || 0;
      }).catch(() => {
        this.rows = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    // 方案模式没有后端的按方案分页接口，按主键回查完整信息后在前端分页。
    loadPlanCombinationRows() {
      const ids = this.normalizedCombinationIds;
      if (!ids.length) {
        this.rows = [];
        this.total = 0;
        this.loading = false;
        return;
      }
      this.loading = true;
      Promise.all(ids.map((combinationId) => getCombination(combinationId)
        .then((response) => ({ combinationId, ...((response && response.data) || {}) }))
        .catch(() => ({ combinationId, combinationTitle: `组合 ${combinationId}` }))))
        .then((allRows) => {
          this.total = allRows.length;
          const start = (this.pageNum - 1) * this.pageSize;
          this.rows = allRows.slice(start, start + this.pageSize);
        })
        .catch(() => {
          this.rows = [];
          this.total = 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    handleDetail(row) {
      this.selectedCombination = { ...(row || {}) };
      this.selectedCombinationId = row && row.combinationId;
      this.combinationDetailVisible = Boolean(this.selectedCombinationId);
    },
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
  },
};
</script>

<style lang="scss" scoped>
.adopted-combination-summary {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px 15px;
  margin-bottom: 14px;
  color: #52615a;
  background: #f2fbf6;
  border: 1px solid #dcebe3;
  border-radius: 12px;

  strong {
    display: block;
    margin-bottom: 3px;
    color: #2b3a36;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: #7c8b84;
  }
}

.adopted-combination-summary-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #27ad60;
  background: #e2f6eb;
  border-radius: 9px;
}

.adopted-combination-table {
  width: 100%;
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
    transition: background-color .18s ease;
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
</style>