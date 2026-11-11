<template>
  <div class="app-container return-page">
    <div class="return-hero">
      <div class="return-hero-left">
        <div class="return-hero-icon"><i class="el-icon-magic-stick"></i></div>
        <div>
          <h2>回报组合工作区</h2>
          <p>设定目标金额，选择可生成比赛，一次得到可复核的候选组合</p>
        </div>
      </div>
      <div class="return-hero-actions">
        <el-button type="primary" plain icon="el-icon-time" size="mini"
          @click="historyVisible = true">查看回报组合历史批次</el-button>
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:return:export']">导出当前回报组合</el-button>
      </div>
    </div>

    <el-row :gutter="18" class="return-main">
      <el-col :xs="24" :md="10">
        <div class="return-card generate-card">
          <div class="return-card-title"><i class="el-icon-set-up"></i>生成条件</div>
          <div class="mode-switch">
            <button type="button" class="mode-item" :class="{ active: generateForm.generationMode === 'S' }"
              @click="generateForm.generationMode = 'S'">
              <i class="el-icon-user"></i>人工权重
            </button>
            <button type="button" class="mode-item" :class="{ active: generateForm.generationMode === 'A' }"
              @click="generateForm.generationMode = 'A'">
              <i class="el-icon-cpu"></i>AI 权重
            </button>
            <span class="mode-thumb"
              :style="{ transform: `translateX(${generateForm.generationMode === 'S' ? 0 : 100}%)` }"></span>
          </div>
          <el-form ref="generateForm" :model="generateForm" label-position="top" size="small">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="基础金额" prop="inputAmount">
                  <el-input v-model="generateForm.inputAmount" placeholder="如 100.00" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="目标金额" prop="targetAmount">
                  <el-input v-model="generateForm.targetAmount" placeholder="如 128.50" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="参与比赛">
              <el-input :value="formatSelectedMatches(selectedMatches)" readonly placeholder="仅展示存在有效 odds 的比赛"
                @click="matchSelectorVisible = true" />
            </el-form-item>
          </el-form>
          <div class="generate-summary">
            <span>已选 {{ generateForm.matchIds.length }} / {{ matchOptionCount }} 场</span>
            <span>{{ modeHint }}</span>
          </div>
          <div class="generate-warning" v-if="missingOddsCount > 0">
            <i class="el-icon-warning-outline"></i>
            <span>{{ missingOddsCount }} 场比赛缺少有效 odds，不参与生成。</span>
            <el-button type="text" size="mini" class="dortmund-theme-text" @click="gotoOddsPage">去维护</el-button>
          </div>
          <div class="return-image-block" v-if="hasImageUploadPermission">
            <div class="return-image-title">组合图片</div>
            <return-image-upload v-model="generateForm.imageObjectKeys" />
          </div>
          <el-button type="success" class="generate-btn" icon="el-icon-magic-stick" :loading="generateLoading"
            @click="handleGenerate" v-hasPermi="['dortmund:return:generate']">生成候选组合</el-button>
        </div>
      </el-col>

      <el-col :xs="24" :md="14">
        <div class="return-card candidates-card">
          <div class="return-card-title">
            <i class="el-icon-trophy"></i>候选列表
            <span class="return-card-count">{{ candidateList.length }} 条</span>
          </div>
          <transition-group name="candidate-pop" tag="div" class="candidate-list" v-if="candidateList.length">
            <div class="candidate-item" v-for="(combination, index) in candidateList" :key="combination.combinationId">
              <div class="candidate-rank">{{ index + 1 }}</div>
              <div class="candidate-main">
                <div class="candidate-title-row">
                  <span class="candidate-title">{{ combination.combinationTitle || combination.combinationCode }}</span>
                  <el-tag :type="combination.adoptedFlag === 'Y' ? 'success' : 'info'" size="mini">
                    {{ combination.adoptedFlag === "Y" ? "已采用" : "未采用" }}
                  </el-tag>
                </div>
                <div class="candidate-metrics">
                  <span>预计回报 <b>{{ formatMoneyDisplay(combination.estimatedReturn) }}</b></span>
                  <span>组合倍率 <b>{{ combination.combinedOdds || "-" }}</b></span>
                  <span>{{ combination.matchCount || (combination.matches || []).length }} 场</span>
                  <span>偏差 {{ formatMoneyDisplay(combination.deviationAmount) }}</span>
                </div>
                <div class="candidate-reason" v-if="combination.combinationReason">{{ combination.combinationReason }}
                </div>
              </div>
              <div class="candidate-actions">
                <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
                  @click="handleCombinationDetail(combination)">详情</el-button>
                <el-button v-if="combination.adoptedFlag !== 'Y'" size="mini" type="text" class="dortmund-theme-text"
                  icon="el-icon-check" :loading="reviewingId === combination.combinationId"
                  @click="handleReview(combination, 'Y')" v-hasPermi="['dortmund:return:review']">采用</el-button>
                <el-button v-if="combination.adoptedFlag === 'Y'" size="mini" type="text" class="dortmund-theme-text"
                  icon="el-icon-close" :loading="reviewingId === combination.combinationId"
                  @click="handleReview(combination, 'N')" v-hasPermi="['dortmund:return:review']">不采用</el-button>
              </div>
            </div>
          </transition-group>
          <div class="empty-block" v-else>
            <i class="el-icon-trophy-1"></i>
            <p>暂无候选组合，设定条件后点击生成</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-drawer :visible.sync="generationVisible" title="生成批次详情" size="760px" append-to-body destroy-on-close
      custom-class="return-drawer">
      <div v-loading="generationLoading" class="return-drawer-body">
        <div class="return-detail-card">
          <div class="return-detail-title">{{ generationDetail.generationCode || "-" }}</div>
          <div class="return-detail-grid">
            <span><label>模式</label>{{ formatGenerationMode(generationDetail.generationMode) }}</span>
            <span><label>状态</label>{{ formatGenerationStatus(generationDetail.generationStatus) }}</span>
            <span><label>基础金额</label>{{ generationDetail.inputAmount || "-" }}</span>
            <span><label>目标金额</label>{{ generationDetail.targetAmount || "-" }}</span>
            <span><label>组合数</label>{{ generationDetail.generatedCount || 0 }}</span>
            <span><label>完成时间</label>{{ parseTime(generationDetail.finishedTime, "{y}-{m}-{d} {h}:{i}") || "-" }}</span>
          </div>
          <div class="return-detail-alert" v-if="generationDetail.generationStatus === '2'">
            <i class="el-icon-warning-outline"></i>
            <span>{{ generationDetail.generationRemark || "生成失败，没有产生可用的半截数据。" }}</span>
          </div>
        </div>
        <div class="return-detail-card" v-if="generationInputSummary">
          <div class="return-detail-title">业务输入摘要</div>
          <pre class="return-input-summary">{{ generationInputSummary }}</pre>
        </div>
        <div class="return-detail-card">
          <div class="return-detail-title">批次组合</div>
          <el-table :data="generationDetail.combinations || []" size="small" empty-text="暂无组合">
            <el-table-column label="组合编码" prop="combinationCode" min-width="160" show-overflow-tooltip />
            <el-table-column label="预计回报" align="center" prop="estimatedReturn" width="100" />
            <el-table-column label="偏差" align="center" prop="deviationAmount" width="90" />
            <el-table-column label="采用" align="center" prop="adoptedFlag" width="80">
              <template slot-scope="scope">{{ scope.row.adoptedFlag === "Y" ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="80">
              <template slot-scope="scope">
                <el-button size="mini" type="text" class="dortmund-theme-text"
                  @click="handleCombinationDetail(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <el-drawer :visible.sync="historyVisible" title="回报组合历史批次" size="900px" append-to-body destroy-on-close
      custom-class="return-drawer return-history-drawer" @opened="handleBatchQuery">
      <div class="return-drawer-body">
        <div class="history-drawer-hero">
          <div class="history-drawer-hero-icon"><i class="el-icon-time"></i></div>
          <div class="history-drawer-hero-copy">
            <strong>历史批次</strong>
            <span>查看生成记录、处理状态与组合数量</span>
          </div>
          <span class="history-drawer-count">共 {{ batchTotal }} 批</span>
        </div>
        <div class="history-filter-card">
          <div class="history-filter-heading">
            <span><i class="el-icon-search"></i>筛选条件</span>
            <el-button type="text" class="dortmund-theme-text" icon="el-icon-refresh-left"
              @click="resetBatchQuery">重置</el-button>
          </div>
          <div class="batch-filter">
            <el-select v-model="batchQuery.generationStatus" placeholder="状态" size="mini" clearable
              style="width: 112px">
              <el-option v-for="item in dict.type.fx67ll_ai_analysis_status || []" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
            <el-select v-model="batchQuery.generationMode" placeholder="模式" size="mini" clearable style="width: 104px">
              <el-option label="人工权重" value="S" />
              <el-option label="AI 权重" value="A" />
            </el-select>
            <el-date-picker v-model="batchDateRange" size="mini" type="daterange" value-format="yyyy-MM-dd"
              range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 220px" clearable />
            <el-button type="primary" size="mini" icon="el-icon-search" @click="handleBatchQuery">查询批次</el-button>
          </div>
        </div>
        <div class="history-table-card">
          <div class="history-table-heading">
            <div>
              <strong>生成记录</strong>
              <span v-if="batchList.length">当前页 {{ batchList.length }} 条</span>
            </div>
            <i class="el-icon-sort"></i>
          </div>
          <div class="history-table-wrap">
            <el-table v-loading="batchLoading" :data="batchList" row-key="generationId" size="small"
              class="history-table">
              <el-table-column label="批次编码" prop="generationCode" min-width="170" show-overflow-tooltip fixed="left" />
              <el-table-column label="模式" align="center" width="96">
                <template slot-scope="scope">{{ formatGenerationMode(scope.row.generationMode) }}</template>
              </el-table-column>
              <el-table-column label="状态" align="center" prop="generationStatus" width="84">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_ai_analysis_status" :value="scope.row.generationStatus" />
                </template>
              </el-table-column>
              <el-table-column label="基础金额" align="center" prop="inputAmount" width="100" />
              <el-table-column label="目标金额" align="center" prop="targetAmount" width="100" />
              <el-table-column label="组合数" align="center" prop="generatedCount" width="76" />
              <el-table-column label="完成时间" align="center" width="150">
                <template slot-scope="scope">{{ parseTime(scope.row.finishedTime, "{y}-{m}-{d} {h}:{i}") || "-"
                }}</template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="90" fixed="right">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
                    v-hasPermi="['dortmund:return:query']" @click="handleGenerationDetail(scope.row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <pagination v-show="batchTotal > 0" :total="batchTotal" :page.sync="batchQuery.pageNum"
            :limit.sync="batchQuery.pageSize" @pagination="getBatchList" />
          <div v-if="!batchLoading && !batchList.length" class="history-empty">
            <i class="el-icon-time"></i>
            <span>暂无符合条件的历史批次</span>
            <el-button type="text" class="dortmund-theme-text" @click="resetBatchQuery">清除筛选</el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer :visible.sync="combinationVisible" title="组合详情" size="720px" append-to-body destroy-on-close
      custom-class="return-drawer">
      <div v-loading="combinationLoading" class="return-drawer-body">
        <div class="return-detail-card">
          <div class="return-detail-title">{{ combinationDetail.combinationTitle || combinationDetail.combinationCode ||
            "-"
          }}</div>
          <div class="return-detail-grid">
            <span><label>组合倍率</label>{{ combinationDetail.combinedOdds || "-" }}</span>
            <span><label>预计回报</label>{{ formatMoneyDisplay(combinationDetail.estimatedReturn) }}</span>
            <span><label>偏差金额</label>{{ formatMoneyDisplay(combinationDetail.deviationAmount) }}</span>
            <span><label>审核状态</label>{{ combinationDetail.adoptedFlag === "Y" ? "已采用" : "未采用" }}</span>
          </div>
          <div class="combination-reason" v-if="combinationDetail.combinationReason">{{
            combinationDetail.combinationReason
          }}</div>
        </div>
        <div class="return-detail-card" v-if="hasImageQueryPermission">
          <div class="return-detail-title">组合图片（{{ (combinationDetail.imageObjectKeys || []).length }}/3）</div>
          <div class="combination-images">
            <el-image v-for="objectKey in combinationDetail.imageObjectKeys || []" :key="objectKey"
              :src="baseUrl + objectKey" fit="cover" :preview-src-list="combinationImageList" />
            <span v-if="!(combinationDetail.imageObjectKeys || []).length" class="image-empty">暂无图片</span>
          </div>
        </div>
        <div class="return-detail-card">
          <div class="return-detail-title">逐场明细</div>
          <el-table :data="combinationDetail.matches || []" size="small" empty-text="暂无明细">
            <el-table-column label="比赛" prop="matchSummary" min-width="180" show-overflow-tooltip />
            <el-table-column label="类型" align="center" width="92">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.fx67ll_dortmund_odds_type || []" :value="scope.row.selectionType" />
              </template>
            </el-table-column>
            <el-table-column label="赔率快照" align="center" prop="oddsValueSnapshot" width="96" />
            <el-table-column label="应用权重" align="center" width="96">
              <template slot-scope="scope">{{ scope.row.appliedWeight || "100" }}</template>
            </el-table-column>
            <el-table-column label="理由" prop="selectionReason" min-width="170" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-drawer>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" multiple :selected-items="selectedMatches"
      :query-params="{ matchStatus: '0' }" @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { checkPermi } from "@/utils/common/permission";
import { listMatch } from "@/api/fx67ll/dortmund/match";
import { listOdds } from "@/api/fx67ll/dortmund/odds";
import {
  adoptCombination,
  getCombination,
  generateReturnCombination,
  getGeneration,
  listGeneration,
  rejectCombination,
} from "@/api/fx67ll/dortmund/returnCombination";
import ReturnImageUpload from "./components/ReturnImageUpload/index";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";

export default {
  name: "DortmundReturnCombination",
  dicts: ["fx67ll_dortmund_odds_type", "fx67ll_ai_analysis_status"],
  components: { ReturnImageUpload, DortmundMatchSelectorModal },
  data() {
    return {
      listMatch,
      generateLoading: false,
      generateForm: {
        generationMode: "S",
        inputAmount: null,
        targetAmount: null,
        matchIds: [],
        imageObjectKeys: [],
      },
      matchOptions: [],
      selectedMatches: [],
      matchSelectorVisible: false,
      missingOddsCount: 0,
      batchList: [],
      batchTotal: 0,
      batchLoading: false,
      historyVisible: false,
      batchDateRange: [],
      batchQuery: {
        pageNum: 1,
        pageSize: 10,
        generationStatus: null,
        generationMode: null,
        beginCreateTime: null,
        endCreateTime: null,
      },
      candidateList: [],
      currentGeneration: null,
      generationVisible: false,
      generationLoading: false,
      generationDetail: {},
      combinationVisible: false,
      combinationLoading: false,
      combinationDetail: {},
      reviewingId: null,
    };
  },
  computed: {
    matchOptionCount() {
      return this.matchOptions.length;
    },
    modeHint() {
      return this.generateForm.generationMode === "S"
        ? "使用当前有效 odds 的手工权重，空权重按 100"
        : "权重由本次 AI 调用决定，不回写原 odds";
    },
    hasImageUploadPermission() {
      return checkPermi(["dortmund:return:image:upload"]);
    },
    hasImageQueryPermission() {
      return checkPermi(["dortmund:return:image:query"]);
    },
    generationInputSummary() {
      const snapshot = this.generationDetail.requestSnapshot;
      if (!snapshot) {
        return "";
      }
      try {
        const value = JSON.parse(snapshot);
        return `模式：${this.formatGenerationMode(value.generationMode)}\n基础金额：${value.inputAmount}\n目标金额：${value.targetAmount}\n比赛：${(value.matchIds || []).join("、")}`;
      } catch (error) {
        return snapshot;
      }
    },
    combinationImageList() {
      return (this.combinationDetail.imageObjectKeys || []).map((objectKey) => this.baseUrl + objectKey);
    },
    baseUrl() {
      return process.env.VUE_APP_BASE_API;
    },
  },
  methods: {
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    formatSelectedMatches(matches) {
      return (matches || []).map((match) => this.formatMatchLabel(match)).join("、");
    },
    handleMatchSelectorConfirm(matches) {
      this.selectedMatches = matches || [];
      this.generateForm.matchIds = this.selectedMatches.map((match) => match.matchId);
    },
    loadMatchOptions(query) {
      const oddsPromise = listOdds({ pageNum: 1, pageSize: 1023, activeFlag: "Y" });
      const matchPromise = listMatch({ pageNum: 1, pageSize: 1023, matchStatus: "0", isNeedSort: "Y" });
      return Promise.all([oddsPromise, matchPromise]).then(([oddsResponse, matchResponse]) => {
        const oddsRows = (oddsResponse.rows || []).filter((item) => item.activeFlag === "Y");
        const oddsMatchIds = new Set(oddsRows.map((item) => item.matchId));
        const rows = (matchResponse.rows || []).filter((item) => oddsMatchIds.has(item.matchId)).map((match) => ({
          ...match,
          matchName: this.formatMatchLabel(match),
        }));
        this.matchOptions = rows;
        this.missingOddsCount = (matchResponse.rows || []).length - rows.length;
        return { rows };
      }).catch(() => {
        this.matchOptions = [];
        return { rows: [] };
      });
    },
    formatMatchLabel(match) {
      const time = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vs = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return time ? `${vs}（${time}）` : vs;
    },
    formatGenerationMode(value) {
      return value === "S" ? "人工权重" : "AI 权重";
    },
    formatGenerationStatus(value) {
      const statusMap = { 0: "处理中", 1: "成功", 2: "失败" };
      return statusMap[value] || "-";
    },
    handleGenerate() {
      this.$refs.generateForm.validate((valid) => {
        if (!valid) {
          return;
        }
        if (!this.generateForm.matchIds.length) {
          this.$modal.msgError("请选择至少一场存在有效 odds 的比赛");
          return;
        }
        this.generateLoading = true;
        generateReturnCombination(this.generateForm).then((response) => {
          const generation = (response && response.data) || {};
          this.currentGeneration = generation;
          this.candidateList = generation.combinations || [];
          this.generateForm.imageObjectKeys = [];
          this.selectedMatches = [];
          this.$modal.msgSuccess(`生成完成，得到 ${this.candidateList.length} 条候选组合`);
          this.handleBatchQuery();
        }).catch(() => {
        }).finally(() => {
          this.generateLoading = false;
        });
      });
    },
    getBatchList() {
      this.batchLoading = true;
      this.batchQuery.beginCreateTime = null;
      this.batchQuery.endCreateTime = null;
      if (this.batchDateRange && this.batchDateRange.length === 2) {
        this.batchQuery.beginCreateTime = this.batchDateRange[0];
        this.batchQuery.endCreateTime = this.batchDateRange[1];
      }
      listGeneration(this.batchQuery).then((response) => {
        this.batchList = response.rows || [];
        this.batchTotal = response.total || 0;
      }).catch(() => {
        this.batchList = [];
        this.batchTotal = 0;
      }).finally(() => {
        this.batchLoading = false;
      });
    },
    handleBatchQuery() {
      this.batchQuery.pageNum = 1;
      this.getBatchList();
    },
    resetBatchQuery() {
      this.batchQuery.generationStatus = null;
      this.batchQuery.generationMode = null;
      this.batchDateRange = [];
      this.handleBatchQuery();
    },
    handleGenerationDetail(row) {
      this.generationVisible = true;
      this.generationLoading = true;
      this.generationDetail = {};
      getGeneration(row.generationId).then((response) => {
        this.generationDetail = (response && response.data) || {};
      }).catch(() => {
        this.generationVisible = false;
      }).finally(() => {
        this.generationLoading = false;
      });
    },
    handleCombinationDetail(row) {
      this.combinationVisible = true;
      this.combinationLoading = true;
      this.combinationDetail = {};
      getCombination(row.combinationId).then((response) => {
        this.combinationDetail = (response && response.data) || {};
      }).catch(() => {
        this.combinationVisible = false;
      }).finally(() => {
        this.combinationLoading = false;
      });
    },
    handleReview(combination, adoptedFlag) {
      const action = adoptedFlag === "Y" ? "采用" : "不采用";
      this.$modal.confirm(`确认${action}组合「${combination.combinationTitle || combination.combinationCode}」？`).then(() => {
        this.reviewingId = combination.combinationId;
        const request = adoptedFlag === "Y"
          ? adoptCombination(combination.combinationId)
          : rejectCombination(combination.combinationId);
        return request;
      }).then(() => {
        this.$modal.msgSuccess(`${action}成功`);
        this.candidateList = this.candidateList.map((item) => item.combinationId === combination.combinationId
          ? { ...item, adoptedFlag }
          : item);
        this.getBatchList();
      }).catch(() => {
      }).finally(() => {
        this.reviewingId = null;
      });
    },
    handleExport() {
      this.download("/dortmund/return/export", {
        ...this.batchQuery,
      }, `return_combination_${new Date().getTime()}.xlsx`);
    },
    gotoOddsPage() {
      this.$router.push({ path: "/dortmund/odds" });
    },
  },
};
</script>

<style lang="scss" scoped>
.return-page {
  max-width: 1500px;
  margin: 0 auto;
}

.return-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  margin-bottom: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, #fff 0%, #f4fbf7 100%);
  border: 1px solid #e3eee8;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(46, 204, 113, 0.08);
  animation: returnRise 0.4s ease both;
}

.return-hero-left {
  display: flex;
  align-items: center;
}

.return-hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 10px;

  .el-button+.el-button {
    margin-left: 0;
  }
}

.return-hero-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: 12px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71, #7fd8a7);
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(46, 204, 113, 0.25);
  animation: iconFloat 2.8s ease-in-out infinite;

  i {
    font-size: 21px;
  }
}

.return-hero h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #25332e;
}

.return-hero p {
  margin: 0;
  font-size: 12px;
  color: #7c8b84;
}

.return-main {
  margin-bottom: 18px;
}

.return-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.07);
  animation: returnRise 0.38s ease 0.05s both;
}

.return-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
  color: #2b3a36;

  i {
    color: #2ecc71;
  }
}

.return-card-count {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #7c8b84;
}

.mode-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  overflow: hidden;
  padding: 3px;
  margin-bottom: 14px;
  background: #eef4f0;
  border-radius: 999px;
}

.mode-item {
  position: relative;
  z-index: 1;
  height: 30px;
  font-size: 12px;
  color: #6b7c74;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  transition: color 0.25s ease;
}

.mode-item.active {
  color: #fff;
  font-weight: 600;
}

.mode-thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: var(--current-color, #2ecc71);
  border-radius: 999px;
  transition: transform 0.38s cubic-bezier(0.34, 1.35, 0.64, 1);
}

.generate-summary {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #7c8b84;
}

.generate-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  font-size: 12px;
  color: #b88230;
  background: #fdf6ec;
  border: 1px solid #f5e6c8;
  border-radius: 8px;
}

.return-image-block {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #edf4f0;
}

.return-image-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
}

.generate-btn {
  width: 100%;
  margin-top: 16px;
  border-radius: 10px;
}

.candidate-list {
  display: grid;
  gap: 10px;
  max-height: 480px;
  overflow: auto;
  padding-right: 2px;
}

.candidate-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fbfdfc;
  border: 1px solid #e8f2ed;
  border-radius: 12px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.candidate-item:hover {
  border-color: #2ecc71;
  box-shadow: 0 10px 22px rgba(46, 204, 113, 0.14);
  transform: translateY(-2px);
}

.candidate-rank {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 700;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 50%;
}

.candidate-main {
  min-width: 0;
  flex: 1;
}

.candidate-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.candidate-title {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #7c8b84;

  b {
    color: #27ad60;
  }
}

.candidate-reason {
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: #7c8b84;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-actions {
  flex-shrink: 0;
  text-align: right;
}

.empty-block {
  display: grid;
  place-items: center;
  min-height: 220px;
  color: #9aa8a1;
  background: #fbfdfc;
  border: 1px dashed #dfece5;
  border-radius: 12px;

  i {
    font-size: 36px;
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
  }
}

.batch-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.history-drawer-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f2fbf6 0%, #ffffff 100%);
  border: 1px solid #dcebe3;
  border-radius: 14px;
  animation: returnRise 0.28s ease both;
}

.history-drawer-hero-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  color: #fff;
  background: var(--current-color, #2ecc71);
  border-radius: 11px;
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.22);
}

.history-drawer-hero-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    font-size: 14px;
    color: #2b3a36;
  }

  span {
    overflow: hidden;
    font-size: 12px;
    color: #7c8b84;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.history-drawer-count {
  flex-shrink: 0;
  padding: 4px 9px;
  margin-left: auto;
  font-size: 12px;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;
}

.history-filter-card,
.history-table-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.05);
  animation: returnRise 0.3s ease 0.04s both;
}

.history-filter-heading,
.history-table-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 11px;
  color: #2b3a36;

  >span,
  >div {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
  }

  i {
    color: var(--current-color, #2ecc71);
  }

  .el-button {
    padding: 0;
  }
}

.history-table-heading {
  margin-bottom: 10px;

  span {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: #8b9992;
  }

  >i {
    color: #9aa8a1;
  }
}

.history-table-wrap {
  overflow-x: auto;
  border: 1px solid #edf3ef;
  border-radius: 10px;
}

.history-table {
  min-width: 790px;

  ::v-deep th.el-table__cell {
    color: #53635b;
    background: #f4f8f5;
  }

  ::v-deep .el-table__row {
    transition: background-color 0.2s ease;
  }

  ::v-deep .el-table__row:hover>td.el-table__cell {
    background: #f3fbf6;
  }
}

.history-empty {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 190px;
  color: #9aa8a1;
  background: #fbfdfc;
  border: 1px dashed #dfece5;
  border-radius: 10px;

  i {
    font-size: 30px;
    color: #b9c8bf;
  }

  span {
    font-size: 13px;
  }

  .el-button {
    padding: 0;
  }
}

.return-drawer-body {
  padding: 0 6px;
}

.return-detail-card {
  padding: 16px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 12px;
  animation: returnRise 0.3s ease both;
}

.return-detail-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #2b3a36;
}

.return-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px 16px;
  font-size: 13px;
  color: #44604f;

  label {
    display: block;
    margin-bottom: 2px;
    font-size: 12px;
    color: #7c8b84;
  }
}

.return-detail-alert {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #c45656;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
}

.return-input-summary {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  white-space: pre-wrap;
  font-family: inherit;
  background: #fafcfb;
  border: 1px solid #e2eee7;
  border-radius: 8px;
}

.combination-reason {
  padding: 10px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  white-space: pre-wrap;
  background: #fafcfb;
  border: 1px solid #e2eee7;
  border-radius: 8px;
}

.combination-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  ::v-deep .el-image {
    width: 100%;
    height: 104px;
    border-radius: 10px;
    overflow: hidden;
  }
}

.image-empty {
  font-size: 12px;
  color: #9aa8a1;
}

.candidate-pop-enter-active,
.candidate-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.candidate-pop-enter,
.candidate-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@keyframes returnRise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes iconFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

@media (max-width: 991px) {
  .return-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .return-hero-actions {
    justify-content: flex-end;
    width: 100%;
  }
}

@media (max-width: 767px) {

  .history-drawer-hero,
  .history-filter-card,
  .history-table-card {
    padding: 12px;
  }

  .history-drawer-hero {
    align-items: flex-start;
  }

  .history-drawer-count {
    display: none;
  }

  .batch-filter {
    align-items: stretch;

    .el-select,
    .el-date-editor,
    .el-button {
      width: 100% !important;
    }
  }
}
</style>

<style lang="scss">
@import "@/views/fx67ll/dortmund/styles/theme-controls";
</style>
