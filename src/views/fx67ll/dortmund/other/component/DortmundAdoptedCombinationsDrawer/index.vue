<template>
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="已采用回报组合" :subtitle="subtitle"
    icon="el-icon-collection-tag" tone="green" size="760px" :loading="loading" feature="return">
    <div class="adopted-combination-summary">
      <span class="adopted-combination-summary-icon"><i class="el-icon-finished"></i></span>
      <div>
        <strong>{{ matchLabel || '当前比赛' }} 已进入 {{ total }} 条采用组合</strong>
        <p>这里只展示已采用结果；点击“详情”可查看完整组合分析、逐场选择与图片。</p>
      </div>
    </div>

    <el-table :data="rows" size="small" class="adopted-combination-table" row-key="combinationId"
      empty-text="当前比赛暂未进入已采用的回报组合">
      <el-table-column label="组合标题" prop="combinationTitle" min-width="180" show-overflow-tooltip />
      <el-table-column label="组合编码" prop="combinationCode" min-width="150" show-overflow-tooltip />
      <el-table-column label="组合倍率" prop="combinedOdds" width="100" align="center" />
      <el-table-column label="预计回报" width="112" align="center">
        <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.estimatedReturn) }}</template>
      </el-table-column>
      <el-table-column label="比赛数" prop="matchCount" width="82" align="center" />
      <el-table-column label="核验状态" width="104" align="center">
        <template slot-scope="scope">
          <dortmund-verification-status-tag :status="scope.row.verificationStatus" />
        </template>
      </el-table-column>
      <el-table-column label="审核时间" width="166" align="center" class-name="dortmund-nowrap-cell">
        <template slot-scope="scope">{{ formatTime(scope.row.reviewTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="84" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" class="dortmund-theme-text" icon="el-icon-document"
            @click="handleDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="pageNum" :limit.sync="pageSize" :page-sizes="pageSizes"
      :auto-scroll="false" @pagination="loadRows" />

    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>

    <dortmund-return-combination-detail-drawer :visible.sync="combinationDetailVisible"
      :combination-id="selectedCombinationId" :snapshot="selectedCombination" />
  </dortmund-detail-drawer>
</template>

<script>
import { listCombination } from "@/api/fx67ll/dortmund/returnCombination";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundReturnCombinationDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundReturnCombinationDetailDrawer/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";

export default {
  name: "DortmundAdoptedCombinationsDrawer",
  components: { DortmundDetailDrawer, DortmundReturnCombinationDetailDrawer, DortmundVerificationStatusTag },
  props: {
    visible: { type: Boolean, default: false },
    matchId: { type: [Number, String], default: null },
    matchLabel: { type: String, default: "" },
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
    subtitle() {
      return this.matchLabel ? `比赛 · ${this.matchLabel}` : "查看该比赛关联的已采用组合";
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.pageNum = 1;
        this.loadRows();
      }
    },
  },
  methods: {
    loadRows() {
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
    handleDetail(row) {
      this.selectedCombination = { ...(row || {}) };
      this.selectedCombinationId = row && row.combinationId;
      this.combinationDetailVisible = Boolean(this.selectedCombinationId);
    },
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    formatTime(value) {
      return this.parseTime(value, "{y}-{m}-{d} {h}:{i}:{s}") || "-";
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
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: #27ad60;
  background: #e2f6eb;
  border-radius: 9px;
}

.adopted-combination-table {
  width: 100%;
}
</style>
