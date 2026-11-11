<template>
  <div class="app-container dl-page odds-page">
    <transition name="scene-switch" mode="out-in">
      <div key="list" v-if="pageScene === 'list'">
        <transition name="dl-filter">
          <el-form class="dl-filter odds-filter" :model="queryParams" ref="queryForm" size="small" :inline="true"
            v-show="showSearch" label-width="78px">
            <el-form-item label="记录编码" prop="oddsCode" v-if="isMoreQuery">
              <el-input v-model="queryParams.oddsCode" placeholder="请输入记录编码" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="关联比赛" prop="matchId">
              <el-input :value="formatSelectedMatch(selectedMatch)" readonly placeholder="请选择关联比赛"
                @click="matchSelectorVisible = true" />
            </el-form-item>
            <el-form-item label="比赛编码" prop="matchCode">
              <el-input v-model="queryParams.matchCode" placeholder="请输入比赛编码" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="来源时间" prop="sourceTime">
              <el-date-picker v-model="daterangeSourceTime" style="width: 220px" type="daterange"
                value-format="yyyy-MM-dd" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
                clearable />
            </el-form-item>
            <el-form-item label="有效状态" prop="activeFlag">
              <el-select v-model="queryParams.activeFlag" placeholder="请选择有效状态" clearable
                @keyup.enter.native="handleQuery">
                <el-option v-for="item in dict.type.sys_yes_no || []" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              <el-button type="success" class="dl-more-btn" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'"
                size="mini" @click="isMoreQuery = !isMoreQuery">
                {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
              </el-button>
            </el-form-item>
          </el-form>
        </transition>

        <div class="dl-toolbar">
          <div class="dl-toolbar-actions">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
              v-hasPermi="['dortmund:odds:add']">新增</el-button>
            <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:odds:export']">导出</el-button> -->
          </div>
          <div class="dl-toolbar-side">
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </div>
        </div>

        <div class="dl-list-card odds-list-card">
          <el-table v-loading="loading" :data="oddsList" row-key="oddsId">
            <el-table-column label="记录编码" align="center" prop="oddsCode" min-width="150" fixed="left"
              show-overflow-tooltip />
            <el-table-column label="比赛编码" align="center" prop="matchCode" width="130" show-overflow-tooltip />
            <el-table-column label="比赛摘要" align="center" prop="matchSummary" min-width="200" show-overflow-tooltip />
            <el-table-column label="来源时间" align="center" prop="sourceTime" width="150">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.sourceTime, "{y}-{m}-{d} {h}:{i}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="让分值" align="center" prop="handicapValue" width="90" />
            <el-table-column label="有效状态" align="center" prop="activeFlag" width="90">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_yes_no || []" :value="scope.row.activeFlag" />
              </template>
            </el-table-column>
            <el-table-column label="更新时间" align="center" prop="updateTime" width="150">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="190" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
                  @click="handleDetail(scope.row)" v-hasPermi="['dortmund:odds:query']">详情</el-button>
                <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-edit"
                  @click="handleUpdate(scope.row)" v-hasPermi="['dortmund:odds:edit']">修改</el-button>
                <el-dropdown class="odds-more-dropdown" @command="handleCommand">
                  <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-more" />
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item :command="{ action: 'activate', row: scope.row }"
                      v-if="scope.row.activeFlag !== 'Y'"
                      v-hasPermi="['dortmund:odds:activate']">设为有效</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', row: scope.row }"
                      v-hasPermi="['dortmund:odds:remove']">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize" @pagination="getList" />
        </div>
      </div>

      <odds-edit-scene key="edit" v-else-if="pageScene === 'edit'" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave" />
    </transition>

    <el-drawer :visible.sync="detailVisible" title="倍率记录详情" size="580px" append-to-body
      custom-class="odds-detail-drawer" destroy-on-close>
      <div v-loading="detailLoading" class="odds-detail-body">
        <div class="odds-detail-card">
          <div class="odds-detail-title">{{ detail.oddsCode || "-" }}</div>
          <div class="odds-detail-meta">
            <span>{{ detail.matchCode || "-" }}</span>
            <span>{{ detail.matchSummary || "-" }}</span>
            <span>{{ parseTime(detail.sourceTime, "{y}-{m}-{d} {h}:{i}") || "-" }}</span>
          </div>
          <div class="odds-detail-flags">
            <el-tag :type="detail.activeFlag === 'Y' ? 'success' : 'info'" size="small">
              {{ detail.activeFlag === "Y" ? "当前有效" : "非有效版本" }}
            </el-tag>
            <el-tag v-if="detail.activeFlag === 'Y'" type="warning" size="small">当前有效记录不可删除</el-tag>
          </div>
          <div class="odds-detail-remark" v-if="detail.oddsRemark">{{ detail.oddsRemark }}</div>
        </div>
        <div class="odds-detail-card">
          <div class="odds-detail-title">赔率权重矩阵</div>
          <el-table :data="detailMatrix" empty-text="暂无赔率数据">
            <el-table-column label="选择类型" align="center" prop="typeName" width="100" />
            <el-table-column label="赔率" align="center" prop="odds" width="90" />
            <el-table-column label="手工权重" align="center" prop="manualWeight" width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.manualWeight || "默认 100" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="有效权重" align="center" prop="appliedWeight" width="100" />
          </el-table>
        </div>
      </div>
    </el-drawer>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" :selected-items="[selectedMatch]"
      @confirm="handleMatchSelectorConfirm" />

  </div>
</template>

<script>
import { addOdds, activateOdds, delOdds, getOdds, listOdds, updateOdds } from "@/api/fx67ll/dortmund/odds";
import OddsEditScene from "./components/OddsEditScene/index";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";

export default {
  name: "DortmundOdds",
  dicts: ["sys_yes_no", "fx67ll_dortmund_odds_type"],
  components: { OddsEditScene, DortmundMatchSelectorModal },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      oddsList: [],
      daterangeSourceTime: [],
      isMoreQuery: false,
      selectedMatch: null,
      matchSelectorVisible: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        oddsCode: null,
        matchCode: null,
        matchId: null,
        activeFlag: null,
        beginSourceTime: null,
        endSourceTime: null,
      },
      detailVisible: false,
      detailLoading: false,
      detail: {},
      pageScene: "list",
      editLoading: false,
      editMode: "add",
      editForm: {},
      submitting: false,
    };
  },
  computed: {
    detailMatrix() {
      const matrix = [
        { type: "HW", oddsField: "homeWinOdds", weightField: "homeWinWeight" },
        { type: "DR", oddsField: "drawOdds", weightField: "drawWeight" },
        { type: "AW", oddsField: "awayWinOdds", weightField: "awayWinWeight" },
        { type: "HH", oddsField: "handicapHomeWinOdds", weightField: "handicapHomeWinWeight" },
        { type: "HD", oddsField: "handicapDrawOdds", weightField: "handicapDrawWeight" },
        { type: "HA", oddsField: "handicapAwayWinOdds", weightField: "handicapAwayWinWeight" },
      ];
      return matrix.map((item) => {
        const manualWeight = this.detail[item.weightField];
        return {
          type: item.type,
          typeName: this.selectDictLabel(this.dict.type.fx67ll_dortmund_odds_type || [], item.type),
          odds: this.detail[item.oddsField] || "-",
          manualWeight,
          appliedWeight: manualWeight || 100,
        };
      });
    },
  },
  created() {
    this.queryParams.matchId = this.$route.query.matchId || null;
    if (this.$route.query.matchId) {
      this.selectedMatch = { matchId: this.$route.query.matchId, matchCode: `比赛 ${this.$route.query.matchId}` };
    }
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      this.queryParams.beginSourceTime = null;
      this.queryParams.endSourceTime = null;
      if (this.daterangeSourceTime && this.daterangeSourceTime.length === 2) {
        this.queryParams.beginSourceTime = this.daterangeSourceTime[0];
        this.queryParams.endSourceTime = this.daterangeSourceTime[1];
      }
      listOdds(this.queryParams).then((response) => {
        this.oddsList = this.formatObjectArrayNullProperty(response.rows || []);
        this.total = response.total || 0;
      }).catch(() => {
        this.oddsList = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.daterangeSourceTime = [];
      this.selectedMatch = null;
      this.handleQuery();
    },
    formatSelectedMatch(match) {
      return match ? (match.matchSummary || match.matchCode) : "";
    },
    handleMatchSelectorConfirm(match) {
      this.selectedMatch = match || null;
      this.queryParams.matchId = match ? match.matchId : null;
    },
    handleAdd() {
      this.editMode = "add";
      this.editForm = this.buildEmptyForm();
      this.pageScene = "edit";
    },
    handleUpdate(row) {
      this.editMode = "update";
      this.editLoading = true;
      this.editForm = {};
      getOdds(row.oddsId).then((response) => {
        this.editForm = { ...(response.data || {}) };
        this.pageScene = "edit";
      }).catch(() => {
        this.pageScene = "list";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    handleDetail(row) {
      this.detailVisible = true;
      this.detailLoading = true;
      this.detail = {};
      getOdds(row.oddsId).then((response) => {
        this.detail = response.data || {};
      }).catch(() => {
        this.detailVisible = false;
      }).finally(() => {
        this.detailLoading = false;
      });
    },
    handleSceneSave(data) {
      const isAdd = this.editMode === "add";
      this.submitting = true;
      const request = isAdd ? addOdds(data) : updateOdds(data);
      request.then(() => {
        this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
        this.pageScene = "list";
        this.getList();
      }).catch(() => {
      }).finally(() => {
        this.submitting = false;
      });
    },
    handleCommand(command) {
      const row = command.row;
      if (command.action === "activate") {
        this.handleActivate(row);
        return;
      }
      if (command.action === "delete") {
        this.handleDelete(row);
      }
    },
    handleActivate(row) {
      this.$modal.confirm(`确认将倍率记录「${row.oddsCode || row.oddsId}」设为当前有效版本？同场比赛的其他版本会自动失效。`).then(() => {
        return activateOdds(row.oddsId);
      }).then(() => {
        this.$modal.msgSuccess("设置成功");
        this.getList();
      }).catch(() => {
      });
    },
    handleDelete(row) {
      this.$modal.confirm(`是否确认删除倍率记录「${row.oddsCode || row.oddsId}」？`).then(() => {
        return delOdds(row.oddsId);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {
      });
    },
    handleExport() {
      this.download("/dortmund/odds/export", { ...this.queryParams },
        `odds_${new Date().getTime()}.xlsx`);
    },
    handleSceneBack() {
      this.pageScene = "list";
      this.getList();
    },
    buildEmptyForm() {
      return {
        oddsId: null,
        oddsCode: null,
        matchId: null,
        sourceTime: null,
        handicapValue: null,
        homeWinOdds: null,
        drawOdds: null,
        awayWinOdds: null,
        handicapHomeWinOdds: null,
        handicapDrawOdds: null,
        handicapAwayWinOdds: null,
        homeWinWeight: null,
        drawWeight: null,
        awayWinWeight: null,
        handicapHomeWinWeight: null,
        handicapDrawWeight: null,
        handicapAwayWinWeight: null,
        oddsRemark: null,
        newMatch: {
          seasonId: null,
          homeTeamId: null,
          awayTeamId: null,
          matchTime: null,
          matchRemark: null,
        },
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.odds-filter ::v-deep .el-select,
.odds-filter ::v-deep .el-date-editor {
  width: 220px;
}

.odds-more-dropdown {
  margin-left: 4px;
}

.odds-detail-body {
  padding: 0 6px;
}

.odds-detail-card {
  padding: 16px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(46, 204, 113, 0.07);
  animation: oddsCardRise 0.32s ease both;
}

.odds-detail-title {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.odds-detail-meta {
  display: grid;
  gap: 5px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #7c8b84;
}

.odds-detail-flags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.odds-detail-remark {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  white-space: pre-wrap;
  background: #fafcfb;
  border: 1px solid #e2eee7;
  border-radius: 8px;
}

.scene-switch-enter-active,
.scene-switch-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.scene-switch-enter,
.scene-switch-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
