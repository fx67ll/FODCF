<template>
  <div class="app-container return-analysis-page">
    <div class="analysis-hero">
      <div class="analysis-hero-left">
        <div class="analysis-hero-icon"><i class="el-icon-magic-stick"></i></div>
        <div>
          <h2>发起回报组合分析</h2>
          <p>批次受理后由后台异步执行，本页持续轮询状态；离开页面后会从当前批次继续恢复</p>
        </div>
      </div>
      <el-button type="text" class="dortmund-theme-text" icon="el-icon-back" @click="backToHistory">
        返回回报组合历史
      </el-button>
    </div>

    <el-row :gutter="18" class="analysis-main">
      <el-col :xs="24" :md="9">
        <div class="analysis-card generate-card">
          <div class="analysis-card-title"><i class="el-icon-set-up"></i>生成条件</div>
          <div class="mode-switch">
            <button type="button" class="mode-item" :class="{ active: generateForm.generationMode === 'S' }"
              @click="generateForm.generationMode = 'S'">
              <i class="el-icon-user"></i> 主观模式
            </button>
            <button type="button" class="mode-item" :class="{ active: generateForm.generationMode === 'A' }"
              @click="generateForm.generationMode = 'A'">
              <i class="el-icon-cpu"></i> AI 模式
            </button>
            <span class="mode-thumb"
              :style="{ transform: `translateX(${generateForm.generationMode === 'S' ? 0 : 100}%)` }"></span>
          </div>
          <el-form ref="generateForm" :model="generateForm" :rules="generateRules" label-position="top" size="small">
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
            <el-form-item label="参与比赛" prop="matchIds">
              <el-input :value="formatSelectedMatches(selectedMatches)" readonly placeholder="仅展示存在有效 odds 的比赛"
                @click.native="matchSelectorVisible = true" />
            </el-form-item>
          </el-form>
          <div class="generate-summary">
            <span>已选 {{ generateForm.matchIds.length }} / {{ availableMatchCount }} 场</span>
            <span>{{ modeHint }}</span>
          </div>
          <el-button type="success" class="generate-btn" icon="el-icon-magic-stick"
            :loading="submitting || generationProcessing" :disabled="generationProcessing" @click="handleGenerate"
            v-hasPermi="['dortmund:return:generate']">
            {{ generationProcessing ? "后台分析中，可继续等待或离开页面" : "提交异步分析批次" }}
          </el-button>
          <div class="async-tip">
            <i class="el-icon-info"></i>
            <span>提交成功只代表批次已受理，不代表候选已生成；完成状态以轮询结果为准。</span>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="15">
        <div class="analysis-card candidates-card">
          <div class="analysis-card-title candidates-heading">
            <span><i class="el-icon-trophy"></i>候选列表 <b>{{ candidateList.length }}</b></span>
            <div class="candidate-tools" v-if="candidateList.length">
              <el-select v-model="candidateSortField" size="mini" style="width: 112px" @change="refreshCandidateSort">
                <el-option label="预计回报" value="estimatedReturn" />
                <el-option label="偏差金额" value="deviationAmount" />
                <el-option label="组合倍率" value="combinedOdds" />
                <el-option label="场次" value="matchCount" />
              </el-select>
              <el-select v-model="candidateSortOrder" size="mini" style="width: 76px" @change="refreshCandidateSort">
                <el-option label="降序" value="desc" />
                <el-option label="升序" value="asc" />
              </el-select>
              <span>已勾选 {{ selectedCandidateIds.length }}</span>
              <el-button type="success" plain size="mini" icon="el-icon-check" :loading="batchAdoptLoading"
                :disabled="!selectedCandidateIds.length" @click="handleBatchAdopt"
                v-hasPermi="['dortmund:return:review']">批量采用</el-button>
            </div>
          </div>

          <div v-if="generationId" class="batch-status-card" :class="statusTone">
            <div class="batch-status-icon">
              <i :class="statusIcon"></i>
            </div>
            <div class="batch-status-copy">
              <strong>{{ statusTitle }}</strong>
              <span>{{ statusDescription }}</span>
            </div>
            <div class="batch-status-meta">
              <span v-if="generationDetail.generationCode">{{ generationDetail.generationCode }}</span>
              <span v-if="pollCount && generationProcessing">第 {{ pollCount }} 次状态检查</span>
            </div>
          </div>

          <transition-group name="candidate-pop" tag="div" class="candidate-list" v-if="candidateList.length">
            <div class="candidate-item" v-for="(combination, index) in candidateList" :key="combination.combinationId">
              <el-checkbox class="candidate-check" :value="selectedCandidateIds.includes(combination.combinationId)"
                :disabled="combination.adoptedFlag === 'Y'" @change="toggleCandidateSelection(combination, $event)" />
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
                <div class="candidate-reason" v-if="combination.combinationReason">
                  {{ combination.combinationReason }}
                </div>
              </div>
              <div class="candidate-actions">
                <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
                  @click="handleCombinationDetail(combination)">详情</el-button>
                <el-button v-if="combination.adoptedFlag !== 'Y'" size="mini" type="text" class="dortmund-theme-text"
                  icon="el-icon-check" :loading="reviewingId === combination.combinationId"
                  @click="handleReview(combination, 'Y')" v-hasPermi="['dortmund:return:review']">采用</el-button>
                <el-button v-else size="mini" type="text" class="dortmund-theme-text" icon="el-icon-close"
                  :loading="reviewingId === combination.combinationId" @click="handleReview(combination, 'N')"
                  v-hasPermi="['dortmund:return:review']">不采用</el-button>
              </div>
            </div>
          </transition-group>
          <div class="analysis-empty" v-else-if="generationProcessing">
            <div class="scan-orbit"><i class="el-icon-loading"></i></div>
            <strong>后台正在分析</strong>
            <span>页面关闭也不影响任务；返回本页会自动恢复当前批次。</span>
          </div>
          <div class="analysis-empty" v-else>
            <i class="el-icon-trophy-1"></i>
            <strong>暂无候选组合</strong>
            <span>填写条件并提交后，后台批次结果会在此展示。</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-drawer :visible.sync="combinationVisible" title="组合详情" size="720px" append-to-body destroy-on-close
      custom-class="return-drawer">
      <div v-loading="combinationLoading" class="analysis-drawer-body">
        <div class="detail-card">
          <div class="detail-title">{{ combinationDetail.combinationTitle || combinationDetail.combinationCode || "-" }}
          </div>
          <div class="detail-grid">
            <span><label>组合倍率</label>{{ combinationDetail.combinedOdds || "-" }}</span>
            <span><label>预计回报</label>{{ formatMoneyDisplay(combinationDetail.estimatedReturn) }}</span>
            <span><label>目标偏差</label>{{ formatMoneyDisplay(combinationDetail.deviationAmount) }}</span>
            <span><label>采用状态</label>{{ combinationDetail.adoptedFlag === "Y" ? "已采用" : "未采用" }}</span>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-title">逐场明细</div>
          <el-table :data="combinationDetail.matches || []" size="small" empty-text="暂无明细">
            <el-table-column label="比赛" prop="matchSummary" min-width="180" show-overflow-tooltip />
            <el-table-column label="类型" align="center" width="92">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.fx67ll_dortmund_odds_type || []" :value="scope.row.selectionType" />
              </template>
            </el-table-column>
            <el-table-column label="倍率快照" align="center" prop="oddsValueSnapshot" width="96" />
            <el-table-column label="AI评估权重" align="center" width="108">
              <!-- appliedWeight仅为AI评估权重，不参与金额计算。 -->
              <template slot-scope="scope">{{ formatAppliedWeight(scope.row.appliedWeight) }}</template>
            </el-table-column>
            <el-table-column v-if="hasRemarkQueryPermission" label="选择理由" prop="selectionReason" min-width="170"
              show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-drawer>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" multiple :selected-items="selectedMatches"
      require-active-odds :max-count="8" @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { checkPermi } from "@/utils/common/permission";
import { listMatch } from "@/api/fx67ll/dortmund/match";
import {
  adoptCombination,
  batchAdoptCombinations,
  generateReturnCombination,
  getCombination,
  getGeneration,
  rejectCombination,
} from "@/api/fx67ll/dortmund/returnCombination";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";

const MAX_BUSINESS_AMOUNT = 999999999999.99;
const ACTIVE_GENERATION_KEY = "dortmund.return.activeGenerationId";
const PENDING_REQUEST_KEY = "dortmund.return.pendingClientRequestId";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_COUNT = 240;

function validateBusinessAmount(rule, value, callback) {
  const text = String(value == null ? "" : value).trim();
  const amount = Number(text);
  if (!text || !Number.isFinite(amount) || amount <= 0) {
    callback(new Error("请输入大于 0 的金额"));
    return;
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    callback(new Error("金额最多支持两位小数"));
    return;
  }
  if (amount > MAX_BUSINESS_AMOUNT) {
    callback(new Error(`金额不能超过 ${MAX_BUSINESS_AMOUNT}`));
    return;
  }
  callback();
}

function createClientRequestId() {
  return `ret-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default {
  name: "DortmundReturnAnalysis",
  dicts: ["fx67ll_dortmund_odds_type", "fx67ll_ai_analysis_status"],
  components: { DortmundMatchSelectorModal },
  data() {
    return {
      submitting: false,
      generateForm: {
        generationMode: "S",
        inputAmount: null,
        targetAmount: null,
        matchIds: [],
      },
      selectedMatches: [],
      matchSelectorVisible: false,
      availableMatchCount: 0,
      generationId: null,
      generationDetail: {},
      generationStatus: null,
      pollCount: 0,
      pollTimer: null,
      pollErrorCount: 0,
      candidateList: [],
      candidateSortField: "estimatedReturn",
      candidateSortOrder: "desc",
      selectedCandidateIds: [],
      reviewingId: null,
      batchAdoptLoading: false,
      combinationVisible: false,
      combinationLoading: false,
      combinationDetail: {},
      generateRules: {
        inputAmount: [
          { required: true, message: "请输入基础金额", trigger: "blur" },
          { validator: validateBusinessAmount, trigger: "blur" },
        ],
        targetAmount: [
          { required: true, message: "请输入目标金额", trigger: "blur" },
          { validator: validateBusinessAmount, trigger: "blur" },
        ],
        matchIds: [
          {
            type: "array",
            required: true,
            min: 1,
            max: 8,
            message: "请选择 1–8 场存在有效 odds 的比赛",
            trigger: "change",
          },
        ],
      },
    };
  },
  computed: {
    modeHint() {
      return this.generateForm.generationMode === "S"
        ? "使用当前有效 odds 的手工权重，空权重按 100"
        : "AI权重仅供评估解释，不参与金额计算，也不回写原 odds";
    },
    hasRemarkQueryPermission() {
      return checkPermi(["dortmund:return:remark:query"]);
    },
    generationProcessing() {
      return this.generationStatus === "0";
    },
    statusTone() {
      if (this.generationStatus === "1") return "success";
      if (this.generationStatus === "2") return "failed";
      return "processing";
    },
    statusIcon() {
      if (this.generationStatus === "1") return "el-icon-circle-check";
      if (this.generationStatus === "2") return "el-icon-warning-outline";
      return "el-icon-loading";
    },
    statusTitle() {
      if (this.generationStatus === "1") return "分析完成";
      if (this.generationStatus === "2") return "分析失败";
      return "批次处理中";
    },
    statusDescription() {
      if (this.generationStatus === "1") {
        return `已生成 ${this.generationDetail.generatedCount || this.candidateList.length} 条候选组合。`;
      }
      if (this.generationStatus === "2") {
        return this.generationDetail.generationRemark || "后台批次执行失败，请调整条件后重新提交。";
      }
      return "批次已受理，后台worker正在执行；前端超时不会中断后端任务。";
    },
  },
  created() {
    this.loadMatchOptions();
    const routeGenerationId = this.parseGenerationId(this.$route && this.$route.query
      ? this.$route.query.generationId
      : null);
    const storedGenerationId = this.parseGenerationId(sessionStorage.getItem(ACTIVE_GENERATION_KEY));
    const generationId = routeGenerationId || storedGenerationId;
    if (generationId) {
      this.startPolling(generationId);
    }
  },
  beforeDestroy() {
    this.stopPolling();
  },
  methods: {
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    formatAppliedWeight(value) {
      // appliedWeight是AI评估权重，仅供解释与复核，不参与金额计算。
      return value == null ? "100" : value;
    },
    parseGenerationId(value) {
      const raw = Array.isArray(value) ? value[0] : value;
      const parsed = Number(raw);
      return raw && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    },
    formatSelectedMatches(matches) {
      return (matches || []).map((match) => this.formatMatchLabel(match)).join("、");
    },
    formatMatchLabel(match) {
      if (!match) return "";
      if (!match.homeTeamName && !match.awayTeamName) return `比赛 #${match.matchId || "-"}`;
      const time = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vs = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return time ? `${vs}（${time}）` : vs;
    },
    refreshCandidateSort() {
      if (this.generationId && this.generationStatus !== "0") {
        getGeneration(this.generationId, {
          sortField: this.candidateSortField,
          sortOrder: this.candidateSortOrder,
        }).then((response) => {
          const detail = (response && response.data) || {};
          this.generationDetail = detail;
          this.candidateList = detail.combinations || [];
        }).catch(() => {
        });
      }
    },
    handleMatchSelectorConfirm(matches) {
      this.selectedMatches = matches || [];
      this.generateForm.matchIds = this.selectedMatches.map((match) => match.matchId);
      this.$nextTick(() => {
        if (this.$refs.generateForm) this.$refs.generateForm.validateField("matchIds");
      });
    },
    loadMatchOptions() {
      return listMatch({ pageNum: 1, pageSize: 1, matchStatus: "0", hasActiveOdds: "Y" }).then((response) => {
        this.availableMatchCount = Number(response && response.total || 0);
      }).catch(() => {
        this.availableMatchCount = 0;
      });
    },
    buildRequestFingerprint() {
      return JSON.stringify({
        generationMode: this.generateForm.generationMode,
        inputAmount: this.generateForm.inputAmount,
        targetAmount: this.generateForm.targetAmount,
        matchIds: [...this.generateForm.matchIds].sort((left, right) => left - right),
      });
    },
    getClientRequestId() {
      const fingerprint = this.buildRequestFingerprint();
      try {
        const stored = JSON.parse(sessionStorage.getItem(PENDING_REQUEST_KEY) || "null");
        if (stored && stored.fingerprint === fingerprint && stored.clientRequestId) {
          return stored.clientRequestId;
        }
      } catch (error) {
      }
      const clientRequestId = createClientRequestId();
      sessionStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify({ clientRequestId, fingerprint }));
      return clientRequestId;
    },
    clearPendingRequest() {
      sessionStorage.removeItem(PENDING_REQUEST_KEY);
    },
    handleGenerate() {
      if (this.generationProcessing) {
        this.$modal.msgWarning("已有批次正在后台处理，请等待完成或返回历史列表。");
        return;
      }
      this.$refs.generateForm.validate((valid) => {
        if (!valid) return;
        if (!this.generateForm.matchIds.length) {
          this.$modal.msgError("请选择至少一场存在有效 odds 的比赛");
          return;
        }
        this.submitting = true;
        const payload = {
          ...this.generateForm,
          clientRequestId: this.getClientRequestId(),
        };
        generateReturnCombination(payload).then((response) => {
          const generation = (response && response.data) || {};
          if (!generation.generationId) {
            this.$modal.msgError("批次受理响应缺少批次编号，请到历史列表中确认");
            return;
          }
          this.$modal.msgSuccess("分析批次已受理，后台正在执行");
          this.startPolling(generation.generationId);
        }).catch(() => {
          this.$modal.msgWarning("未确认批次是否受理；使用相同条件重试会复用同一幂等请求号");
        }).finally(() => {
          this.submitting = false;
        });
      });
    },
    startPolling(generationId) {
      this.stopPolling();
      this.generationId = generationId;
      this.generationStatus = "0";
      this.generationDetail = { generationId };
      this.pollCount = 0;
      this.pollErrorCount = 0;
      sessionStorage.setItem(ACTIVE_GENERATION_KEY, String(generationId));
      this.setGenerationRoute(generationId);
      this.pollGeneration();
    },
    pollGeneration() {
      if (!this.generationId) return;
      this.pollCount += 1;
      getGeneration(this.generationId, {
        sortField: this.candidateSortField,
        sortOrder: this.candidateSortOrder,
      }).then((response) => {
        const detail = (response && response.data) || {};
        if (!detail.generationId) {
          throw new Error("batch-not-found");
        }
        this.generationDetail = detail;
        this.generationStatus = detail.generationStatus;
        this.candidateList = detail.combinations || [];
        this.selectedCandidateIds = this.selectedCandidateIds.filter((id) =>
          this.candidateList.some((item) => item.combinationId === id && item.adoptedFlag !== "Y"));
        this.pollErrorCount = 0;
        if (detail.generationStatus === "1" || detail.generationStatus === "2") {
          this.stopPolling(false);
          sessionStorage.removeItem(ACTIVE_GENERATION_KEY);
          this.clearPendingRequest();
          if (detail.generationStatus === "1") {
            this.$modal.msgSuccess(`分析完成，共 ${this.candidateList.length} 条候选组合`);
          }
          return;
        }
        this.scheduleNextPoll();
      }).catch(() => {
        this.pollErrorCount += 1;
        if (this.pollErrorCount >= 5) {
          this.stopPolling();
          this.$modal.msgWarning("状态查询连续失败，已暂停轮询；刷新页面可恢复当前批次");
          return;
        }
        this.scheduleNextPoll();
      });
    },
    scheduleNextPoll() {
      this.stopPolling(false);
      if (this.pollCount >= MAX_POLL_COUNT) {
        this.$modal.msgWarning("轮询已达到本次页面时限，批次可能仍在后台执行；刷新后可继续查看");
        return;
      }
      this.pollTimer = setTimeout(() => this.pollGeneration(), POLL_INTERVAL_MS);
    },
    stopPolling(clearBatch) {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
      if (clearBatch) {
        this.generationId = null;
        this.generationStatus = null;
        this.generationDetail = {};
        this.candidateList = [];
        this.selectedCandidateIds = [];
      }
    },
    setGenerationRoute(generationId) {
      if (Number(this.$route.query.generationId) === generationId) return;
      const query = { ...this.$route.query, generationId: String(generationId) };
      const navigation = this.$router.replace({ path: this.$route.path, query });
      if (navigation && typeof navigation.catch === "function") navigation.catch(() => { });
    },
    toggleCandidateSelection(combination, checked) {
      if (combination.adoptedFlag === "Y") return;
      if (checked) {
        if (!this.selectedCandidateIds.includes(combination.combinationId)) {
          this.selectedCandidateIds.push(combination.combinationId);
        }
      } else {
        this.selectedCandidateIds = this.selectedCandidateIds.filter((id) => id !== combination.combinationId);
      }
    },
    handleBatchAdopt() {
      if (!this.selectedCandidateIds.length) return;
      this.batchAdoptLoading = true;
      batchAdoptCombinations(this.selectedCandidateIds).then((response) => {
        const count = Number((response && response.data) || 0);
        this.$modal.msgSuccess(`批量采用完成，本次更新 ${count} 条`);
        this.candidateList = this.candidateList.map((item) => this.selectedCandidateIds.includes(item.combinationId)
          ? { ...item, adoptedFlag: "Y" }
          : item);
        this.selectedCandidateIds = [];
      }).catch(() => {
      }).finally(() => {
        this.batchAdoptLoading = false;
      });
    },
    handleReview(combination, adoptedFlag) {
      const action = adoptedFlag === "Y" ? "采用" : "不采用";
      this.$modal.confirm(`确认${action}组合「${combination.combinationTitle || combination.combinationCode}」？`).then(() => {
        this.reviewingId = combination.combinationId;
        return adoptedFlag === "Y"
          ? adoptCombination(combination.combinationId)
          : rejectCombination(combination.combinationId);
      }).then(() => {
        this.$modal.msgSuccess(`${action}成功`);
        this.candidateList = this.candidateList.map((item) => item.combinationId === combination.combinationId
          ? { ...item, adoptedFlag }
          : item);
        this.selectedCandidateIds = this.selectedCandidateIds.filter((id) => id !== combination.combinationId);
      }).catch(() => {
      }).finally(() => {
        this.reviewingId = null;
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
    backToHistory() {
      this.$router.push({ path: "/ai/solution/return" });
    },
  },
};
</script>

<style lang="scss" scoped>
.return-analysis-page {
  max-width: 1500px;
  margin: 0 auto;
}

.analysis-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  margin-bottom: 18px;
  background: linear-gradient(135deg, #fff 0%, #f4fbf7 100%);
  border: 1px solid #e3eee8;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(46, 204, 113, 0.08);
  animation: analysisRise 0.4s ease both;
}

.analysis-hero-left {
  display: flex;
  align-items: center;
}

.analysis-hero-icon {
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
}

.analysis-hero h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #25332e;
}

.analysis-hero p {
  margin: 0;
  font-size: 12px;
  color: #7c8b84;
}

.analysis-main {
  margin-bottom: 18px;
}

.analysis-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.07);
  animation: analysisRise 0.38s ease 0.05s both;
}

.analysis-card-title {
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

.candidates-heading {
  justify-content: space-between;
}

.candidate-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  font-weight: 400;
  color: #7c8b84;
}

.mode-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  margin-bottom: 16px;
  overflow: hidden;
  background: #f1f8f4;
  border: 1px solid #dfeee6;
  border-radius: 12px;
}

.mode-item {
  position: relative;
  z-index: 2;
  padding: 9px 8px;
  font-size: 12px;
  color: #6d7d76;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition: color 0.25s ease;

  &.active {
    font-weight: 700;
    color: #1c9e55;
  }
}

.mode-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.16);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.generate-summary {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 2px 0 12px;
  font-size: 12px;
  color: #7c8b84;
}

.generate-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #b88230;
  background: #fdf6ec;
  border: 1px solid #f5e6c8;
  border-radius: 8px;
}

.generate-btn {
  width: 100%;
  height: 40px;
  margin-top: 12px;
  font-weight: 700;
  border: 0;
  border-radius: 10px;
  box-shadow: 0 9px 20px rgba(46, 204, 113, 0.23);
}

.async-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #7c8b84;
}

.batch-status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  background: #f7fbf9;
  border: 1px solid #dcefe4;
  border-radius: 12px;

  &.success {
    background: #f2fbf6;
    border-color: #ccecd9;
  }

  &.failed {
    background: #fdf5f4;
    border-color: #f0d4d0;
  }
}

.batch-status-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #27ad60;
  background: #e8f8ef;
  border-radius: 10px;
}

.failed .batch-status-icon {
  color: #d9534f;
  background: #fbe9e7;
}

.batch-status-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;

  strong {
    font-size: 13px;
    color: #2b3a36;
  }

  span {
    font-size: 12px;
    line-height: 1.5;
    color: #7c8b84;
  }
}

.batch-status-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 11px;
  color: #8a9892;
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #fff, #fbfefc);
  border: 1px solid #e5f0ea;
  border-radius: 12px;
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    box-shadow: 0 10px 24px rgba(46, 204, 113, 0.12);
    transform: translateY(-2px);
  }
}

.candidate-check {
  flex-shrink: 0;
}

.candidate-rank {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 700;
  color: #1c9e55;
  background: #e8f8ef;
  border-radius: 9px;
}

.candidate-main {
  flex: 1;
  min-width: 0;
}

.candidate-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.candidate-title {
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a36;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12px;
  color: #7c8b84;

  b {
    color: #2b3a36;
  }
}

.candidate-reason {
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  color: #83928b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 170px;
}

.analysis-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 54px 12px;
  color: #8a9892;

  >i {
    margin-bottom: 10px;
    font-size: 40px;
    color: #c9ded2;
  }

  strong {
    margin-bottom: 5px;
    font-size: 14px;
    color: #51635b;
  }

  span {
    font-size: 12px;
  }
}

.scan-orbit {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: 12px;
  color: #2ecc71;
  background: #edf9f2;
  border: 1px solid #d7efe1;
  border-radius: 50%;
  animation: scanPulse 1.8s ease-in-out infinite;

  i {
    font-size: 24px;
  }
}

.analysis-drawer-body {
  padding: 6px 18px 24px;
}

.detail-card {
  padding: 14px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 12px;
}

.detail-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #2b3a36;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  font-size: 12px;
  color: #2b3a36;

  label {
    margin-right: 8px;
    color: #7c8b84;
  }
}

.candidate-pop-enter-active {
  transition: all 0.28s ease;
}

.candidate-pop-enter,
.candidate-pop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes analysisRise {
  from {
    opacity: 0;
    transform: translateY(10px);
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

@keyframes scanPulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.18);
  }

  50% {
    box-shadow: 0 0 0 10px rgba(46, 204, 113, 0);
  }
}

@media screen and (max-width: 767px) {
  .candidate-item {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .candidate-actions {
    justify-content: flex-start;
    width: 100%;
    max-width: none;
    padding-left: 54px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
