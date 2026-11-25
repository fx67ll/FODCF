<template>
  <dortmund-detail-drawer :visible.sync="drawerVisible" :title="drawerTitle" :subtitle="subtitle"
    icon="el-icon-collection-tag" tone="green" size="960px" :loading="loading" feature="return" :level="level"
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
      <el-table-column label="回报组合标题" prop="combinationTitle" minWidth="300" align="center" header-align="center"
        show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.combinationTitle" class="adopted-combination-title" role="button" tabindex="0"
            :title="scope.row.combinationTitle" @click.stop="handleDetail(scope.row)"
            @keyup.enter.stop="handleDetail(scope.row)">{{ scope.row.combinationTitle }}</span>
          <span v-else class="adopted-combination-title is-empty">未命名组合</span>
        </template>
      </el-table-column>
      <el-table-column label="预计回报" minWidth="120" align="center" header-align="center">
        <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.estimatedReturn) }}</template>
      </el-table-column>
      <el-table-column label="偏差金额" minWidth="120" align="center" header-align="center">
        <template slot-scope="scope">
          <span :class="['adopted-combination-deviation', deviationTone(scope.row.deviationAmount)]">
            <i v-if="deviationIcon(scope.row.deviationAmount)" :class="deviationIcon(scope.row.deviationAmount)"></i>
            {{ formatMoneyDisplay(scope.row.deviationAmount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="核验状态" minWidth="120" align="center" header-align="center">
        <template slot-scope="scope">
          <dortmund-verification-status-tag :status="scope.row.verificationStatus" />
        </template>
      </el-table-column>
      <el-table-column label="记录创建时间" minWidth="170" align="center" header-align="center">
        <template slot-scope="scope">
          {{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}
        </template>
      </el-table-column>
      <el-table-column v-if="planMode" label="场次" prop="matchCount" width="90" align="center" header-align="center" />
    </el-table>

    <pagination v-show="total > 0" :total="total" popper-class="dortmund-theme-popper" :page.sync="pageNum"
      :limit.sync="pageSize" :page-sizes="pageSizes" :auto-scroll="false" @pagination="loadRows" />

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

export default {
  name: "DortmundAdoptedCombinationsDrawer",
  components: {
    DortmundDetailDrawer, DortmundReturnCombinationDetailDrawer, DortmundVerificationStatusTag,
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
        ? "这里展示方案当前关联的回报组合；点击组合标题可查看完整组合分析、逐场选择与图片。"
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
        .catch(() => ({ combinationId, combinationTitle: "未命名组合" }))))
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
    // 偏差金额与回报组合工作台共用方向语义：正数红色向上、负数绿色向下、零值灰色。
    deviationTone(value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        return "is-zero";
      }
      if (numericValue === 0) {
        return "is-zero";
      }
      return numericValue > 0 ? "is-positive" : "is-negative";
    },
    deviationIcon(value) {
      const tone = this.deviationTone(value);
      if (tone === "is-positive") return "el-icon-top";
      if (tone === "is-negative") return "el-icon-bottom";
      return "";
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

.adopted-combination-title {
  display: inline-block;
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  color: #2ecc71;
  font-weight: 600;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
  border-radius: 6px;
  cursor: pointer;
  transition: color .18s ease, background-color .18s ease, box-shadow .18s ease, transform .18s ease;
}

.adopted-combination-title:hover,
.adopted-combination-title:focus-visible {
  color: #1f9e55;
  background: #e9f9f0;
  outline: none;
  box-shadow: 0 2px 6px rgba(46, 204, 113, .12);
  transform: translateY(-1px);
}

.adopted-combination-title:active {
  transform: translateY(0) scale(.98);
}

.adopted-combination-title.is-empty {
  color: #9aa7a0;
  font-weight: 400;
  cursor: default;
}

.adopted-combination-deviation {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.adopted-combination-deviation i {
  font-size: 12px;
}

.adopted-combination-deviation.is-positive {
  color: #ff5a5f;
}

.adopted-combination-deviation.is-negative {
  color: #2ecc71;
}

.adopted-combination-deviation.is-zero {
  color: #999;
  font-weight: 400;
}

@media (prefers-reduced-motion: reduce) {
  .adopted-combination-title {
    transition: none;
  }

  .adopted-combination-title:hover,
  .adopted-combination-title:focus-visible,
  .adopted-combination-title:active {
    transform: none;
  }
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
