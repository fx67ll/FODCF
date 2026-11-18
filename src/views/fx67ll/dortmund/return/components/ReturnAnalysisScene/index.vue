<template>
  <div class="app-container dortmund-secondary-page return-analysis-page">
    <div class="analysis-hero">
      <div class="analysis-hero-left">
        <div class="analysis-hero-icon"><i class="el-icon-magic-stick"></i></div>
        <div>
          <h2>发起回报组合分析</h2>
          <p>可选择自动AI异步分析或人工AI任务处理；人工任务导出后等待第三方标准结果回填</p>
        </div>
      </div>
      <el-button type="text" class="dortmund-theme-text" icon="el-icon-back" @click="backToHistory">
        返回回报组合历史
      </el-button>
    </div>

    <div class="analysis-main">
      <div class="analysis-card generate-card">
        <div class="analysis-card-title generate-card-heading">
          <span><i class="el-icon-set-up"></i>生成条件</span>
          <small>按区块配置后提交后台执行</small>
        </div>
        <el-form ref="generateForm" :model="generateForm" :rules="generateRules" label-position="top" size="small"
          class="generate-form">
          <section class="generate-section">
            <div class="generate-section-head">
              <span class="generate-step">01</span>
              <div class="generate-section-copy">
                <strong>分析模式</strong>
                <small>主观模式沿用人工权重，AI 模式由模型独立评估</small>
              </div>
            </div>
            <div class="mode-cards" role="radiogroup" aria-label="分析模式">
              <button type="button" class="mode-card" :class="{ active: generateForm.generationMode === 'S' }"
                :aria-pressed="generateForm.generationMode === 'S' ? 'true' : 'false'"
                @click="generateForm.generationMode = 'S'">
                <span class="mode-card-icon"><i class="el-icon-user"></i></span>
                <span class="mode-card-copy">
                  <strong>主观模式</strong>
                  <small>使用当前有效 odds 的人工权重，不执行平台检索</small>
                </span>
                <i class="el-icon-success mode-card-check" v-if="generateForm.generationMode === 'S'"></i>
              </button>
              <button type="button" class="mode-card" :class="{ active: generateForm.generationMode === 'A' }"
                :aria-pressed="generateForm.generationMode === 'A' ? 'true' : 'false'"
                @click="generateForm.generationMode = 'A'">
                <span class="mode-card-icon"><i class="el-icon-cpu"></i></span>
                <span class="mode-card-copy">
                  <strong>AI 模式</strong>
                  <small>先规划并受控检索补充信息，再独立评估权重</small>
                </span>
                <i class="el-icon-success mode-card-check" v-if="generateForm.generationMode === 'A'"></i>
              </button>
            </div>
          </section>

          <section class="generate-section">
            <div class="generate-section-head">
              <span class="generate-step">02</span>
              <div class="generate-section-copy">
                <strong>金额参数</strong>
                <small>金额须为普通十进制数，最多保留两位小数</small>
              </div>
            </div>
            <el-row :gutter="12">
              <el-col :xs="24" :sm="12">
                <el-form-item prop="inputAmount">
                  <template slot="label">
                    <dortmund-form-label label="基础金额" tip="必填；普通十进制数，不允许科学计数法；必须大于0，最多2位小数，且不超过999999999999.99" />
                  </template>
                  <el-input v-model="generateForm.inputAmount" placeholder="如 100.00">
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item prop="targetAmount">
                  <template slot="label">
                    <dortmund-form-label label="目标金额" tip="必填；普通十进制数，不允许科学计数法；必须大于0，最多2位小数，且不超过999999999999.99" />
                  </template>
                  <el-input v-model="generateForm.targetAmount" placeholder="如 128.50">
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="generate-section">
            <div class="generate-section-head">
              <span class="generate-step">03</span>
              <div class="generate-section-copy">
                <strong>参与比赛</strong>
                <small>仅展示存在有效 odds 的比赛，单次最多选择 8 场</small>
              </div>
            </div>
            <el-form-item prop="matchIds">
              <div class="selected-match-panel">
                <div class="selected-match-toolbar">
                  <div class="selected-match-toolbar-copy">
                    <strong>{{ selectedMatches.length }} 场已选择</strong>
                    <small>支持跨页选择，列表按当前选择顺序展示</small>
                  </div>
                  <div class="selected-match-toolbar-actions">
                    <el-button type="success" plain size="mini" icon="el-icon-search"
                      @click="matchSelectorVisible = true">选择比赛</el-button>
                    <el-button size="mini" icon="el-icon-delete" :disabled="!selectedMatches.length"
                      @click="clearSelectedMatches">清空</el-button>
                  </div>
                </div>
                <div class="selected-match-list" v-if="selectedMatches.length">
                  <div class="selected-match-row" v-for="(match, index) in selectedMatches" :key="match.matchId">
                    <span class="selected-match-index">{{ index + 1 }}</span>
                    <span class="selected-match-copy">
                      <strong :title="formatMatchTeams(match)">{{ formatMatchTeams(match) }}</strong>
                      <small><i class="el-icon-time"></i>{{ formatMatchTime(match) || "比赛时间未填写" }}</small>
                    </span>
                    <el-button type="text" class="selected-match-remove" icon="el-icon-close" title="移除该比赛"
                      @click="handleRemoveSelectedMatch(index)" />
                  </div>
                </div>
                <div class="selected-match-empty" v-else>
                  <i class="el-icon-football"></i>
                  <span>尚未选择比赛，点击“选择比赛”从有效倍率比赛中添加</span>
                </div>
                <div class="selected-match-summary">
                  <i class="el-icon-info"></i>
                  <span>已选 {{ generateForm.matchIds.length }} / {{ availableMatchCount }} 场：{{ modeHint }}</span>
                </div>
              </div>
            </el-form-item>
          </section>

          <section class="generate-section">
            <div class="generate-section-head">
              <span class="generate-step">04</span>
              <div class="generate-section-copy">
                <strong>补充业务目标</strong>
                <small>与后端预定义目标共同生效，不覆盖统一业务规则</small>
              </div>
            </div>
            <el-form-item prop="supplementaryObjectives">
              <div class="supplementary-list">
                <div class="supplementary-item" v-for="(item, index) in generateForm.supplementaryObjectives"
                  :key="index">
                  <el-input v-model="generateForm.supplementaryObjectives[index]" maxlength="200" show-word-limit
                    :placeholder="`第 ${index + 1} 条补充目标，例如：优先选择主场优势明显的比赛`" />
                  <el-button type="text" class="supplementary-remove" icon="el-icon-delete" title="删除该补充目标"
                    @click="handleRemoveSupplementaryObjective(index)" />
                </div>
                <el-button type="text" class="supplementary-add" icon="el-icon-plus"
                  :disabled="generateForm.supplementaryObjectives.length >= supplementaryObjectiveLimit"
                  @click="handleAddSupplementaryObjective">
                  添加业务目标（{{ generateForm.supplementaryObjectives.length }} / {{ supplementaryObjectiveLimit }}）
                </el-button>
              </div>
              <div class="supplementary-hint">
                预定义业务目标由后端统一提供；此处内容作为补充约束与预定义目标同时生效。
              </div>
            </el-form-item>
          </section>

          <section class="generate-section generate-submit-section">
            <div class="generate-section-head">
              <span class="generate-step">05</span>
              <div class="generate-section-copy">
                <strong>提交批次</strong>
                <small>自动分析与人工任务共用同一份业务参数</small>
              </div>
            </div>
            <div class="generate-actions">
              <el-button type="success" class="generate-btn" icon="el-icon-magic-stick"
                :loading="submitting || generationProcessing" :disabled="generationProcessing || manualSubmitting"
                @click="handleGenerate" v-hasPermi="['dortmund:return:generate']">
                {{ generationProcessing ? "后台分析中，可继续等待或离开页面" : "提交自动AI分析批次" }}
              </el-button>
              <el-button type="warning" plain class="generate-btn manual-generate-btn" icon="el-icon-document-add"
                :loading="manualSubmitting" :disabled="submitting || manualSubmitting || generationProcessing"
                @click="handleCreateManualTask" v-hasPermi="['dortmund:return:generate']">
                {{ manualSubmitting ? "正在创建人工任务" : "创建并导出人工AI任务" }}
              </el-button>
            </div>
            <div class="async-tip">
              <i class="el-icon-info"></i>
              <span>自动批次由后台异步执行；人工批次立即冻结同一份业务快照，不进入自动AI队列。</span>
            </div>
          </section>
        </el-form>
      </div>

      <div class="analysis-card candidates-card">
        <div class="analysis-card-title candidates-heading">
          <span><i class="el-icon-trophy"></i>候选列表 <b>{{ candidateList.length }}</b></span>
          <div class="candidate-tools" v-if="candidateList.length">
            <el-select v-model="candidateSortField" size="mini" style="width: 112px"
              popper-class="dortmund-theme-popper" @change="refreshCandidateSort">
              <el-option label="预计回报" value="estimatedReturn" />
              <el-option label="偏差金额" value="deviationAmount" />
              <el-option label="组合倍率" value="combinedOdds" />
              <el-option label="场次" value="matchCount" />
            </el-select>
            <el-select v-model="candidateSortOrder" size="mini" style="width: 76px" popper-class="dortmund-theme-popper"
              @change="refreshCandidateSort">
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
            <span v-if="generationDetail.resultSource">来源：{{ formatResultSource(generationDetail.resultSource)
              }}</span>
            <span v-if="generationDetail.generationMode === 'A'">证据：{{
              formatEvidenceStatus(generationDetail.aiEvidenceStatus)
            }}</span>
            <span v-if="pollCount && generationProcessing">第 {{ pollCount }} 次状态检查</span>
          </div>
        </div>

        <div v-if="generationId" class="analysis-card ai-workflow-card">
          <div class="analysis-card-title">
            <i class="el-icon-share"></i>AI分析工作流
          </div>
          <return-ai-workflow :generation="generationDetail" :can-view-raw="hasRemarkQueryPermission" />
        </div>

        <manual-ai-task-panel :generation-id="generationDetail.generationId || generationId"
          :generation-code="generationDetail.generationCode || ''"
          :generation-status="generationDetail.generationStatus || generationStatus" @imported="handleManualImported" />

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
              <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-document"
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
        <div class="analysis-empty" v-else-if="generationPendingManual">
          <i class="el-icon-edit-outline"></i>
          <strong>等待人工AI结果</strong>
          <span>导出任务并交给第三方AI，回填标准JSON后即可生成候选组合。</span>
        </div>
        <div class="analysis-empty" v-else>
          <i class="el-icon-trophy-1"></i>
          <strong>暂无候选组合</strong>
          <span>填写条件并提交后，后台批次结果会在此展示。</span>
        </div>
      </div>
    </div>

    <dortmund-detail-drawer :visible.sync="combinationVisible" :title="combinationDetail.combinationTitle || '组合详情'"
      :subtitle="combinationDetail.combinationCode ? `组合编码 · ${combinationDetail.combinationCode}` : '查看倍率、证据链与逐场明细'"
      icon="el-icon-collection-tag" tone="cyan" size="720px" :loading="combinationLoading" feature="return">
      <return-analysis-result :combination="combinationDetail" :batch="combinationBatchContext"
        :can-view-reason="hasRemarkQueryPermission" />
    </dortmund-detail-drawer>

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
  createManualTask,
  generateReturnCombination,
  getCombination,
  getGeneration,
  rejectCombination,
} from "@/api/fx67ll/dortmund/returnCombination";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import ManualAiTaskPanel from "../ManualAiTaskPanel/index";
import ReturnAiWorkflow from "../ReturnAiWorkflow/index";
import ReturnAnalysisResult from "../ReturnAnalysisResult/index";

const MAX_BUSINESS_AMOUNT = 999999999999.99;
const MAX_SUPPLEMENTARY_OBJECTIVES = 5;
const MAX_SUPPLEMENTARY_OBJECTIVE_LENGTH = 200;
const MAX_SUPPLEMENTARY_OBJECTIVES_TOTAL_LENGTH = 1000;
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

function normalizeSupplementaryObjectives(value) {
  const seen = new Set();
  const values = Array.isArray(value) ? value : [value];
  return values
    .map((item) => String(item == null ? "" : item).trim())
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function validateSupplementaryObjectives(rule, value, callback) {
  const objectives = normalizeSupplementaryObjectives(value);
  if (objectives.length > MAX_SUPPLEMENTARY_OBJECTIVES) {
    callback(new Error(`补充业务目标最多填写 ${MAX_SUPPLEMENTARY_OBJECTIVES} 条`));
    return;
  }
  if (objectives.some((item) => item.length > MAX_SUPPLEMENTARY_OBJECTIVE_LENGTH)) {
    callback(new Error(`每条补充业务目标不能超过 ${MAX_SUPPLEMENTARY_OBJECTIVE_LENGTH} 字`));
    return;
  }
  if (objectives.join("").length > MAX_SUPPLEMENTARY_OBJECTIVES_TOTAL_LENGTH) {
    callback(new Error(`补充业务目标合计不能超过 ${MAX_SUPPLEMENTARY_OBJECTIVES_TOTAL_LENGTH} 字`));
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
  components: { DortmundMatchSelectorModal, DortmundFormLabel, ManualAiTaskPanel, ReturnAiWorkflow, ReturnAnalysisResult, DortmundDetailDrawer, DortmundDetailCard, DortmundDetailBlock },
  data() {
    return {
      submitting: false,
      manualSubmitting: false,
      generateForm: {
        generationMode: "S",
        inputAmount: null,
        targetAmount: null,
        matchIds: [],
        supplementaryObjectives: [""],
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
        supplementaryObjectives: [
          { validator: validateSupplementaryObjectives, trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    combinationBatchContext() {
      if (!this.generationDetail || !this.combinationDetail) return null;
      return String(this.generationDetail.generationId || '') === String(this.combinationDetail.generationId || '')
        ? this.generationDetail : null;
    },
    modeHint() {
      return this.generateForm.generationMode === "S"
        ? "固定使用当前有效 odds 的手工权重，不执行平台检索；AI仍须结合标签、信息点与赔率论证"
        : "AI先规划并受控检索补充信息，再自主评估权重；权重不参与金额计算";
    },
    hasRemarkQueryPermission() {
      return checkPermi(["dortmund:return:remark:query"]);
    },
    generationProcessing() {
      return this.generationStatus === "0";
    },
    generationPendingManual() {
      return this.generationStatus === "3";
    },
    supplementaryObjectiveLimit() {
      return MAX_SUPPLEMENTARY_OBJECTIVES;
    },
    statusTone() {
      if (this.generationStatus === "1") return "success";
      if (this.generationStatus === "2") return "failed";
      if (this.generationStatus === "3") return "manual";
      return "processing";
    },
    statusIcon() {
      if (this.generationStatus === "1") return "el-icon-circle-check";
      if (this.generationStatus === "2") return "el-icon-warning-outline";
      if (this.generationStatus === "3") return "el-icon-edit-outline";
      return "el-icon-loading";
    },
    statusTitle() {
      if (this.generationStatus === "1" && this.generationDetail.resultSource === "M") return "人工AI处理完成";
      if (this.generationStatus === "1") return "分析完成";
      if (this.generationStatus === "2") return "分析失败";
      if (this.generationStatus === "3") return "等待人工AI结果";
      return "批次处理中";
    },
    statusDescription() {
      if (this.generationStatus === "1") {
        const sourceText = this.generationDetail.resultSource === "M" ? "结果来自人工AI。" : "结果来自自动AI。";
        return `已生成 ${this.generationDetail.generatedCount || this.candidateList.length} 条候选组合。${sourceText}`;
      }
      if (this.generationStatus === "2") {
        return this.generationDetail.generationRemark || "后台批次执行失败，请调整条件后重新提交。";
      }
      if (this.generationStatus === "3") {
        return "业务快照已冻结，可导出任务交给第三方AI；导入成功后候选结果会在此展示。";
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
    formatEvidenceStatus(value) {
      const labels = { N: "不适用", P: "规划/检索中", R: "检索完成", S: "证据已固化", F: "失败" };
      return labels[value] || "-";
    },
    formatResultSource(value) {
      if (value === "A") return "自动AI";
      if (value === "M") return "人工AI";
      return "-";
    },
    parseGenerationId(value) {
      const raw = Array.isArray(value) ? value[0] : value;
      const parsed = Number(raw);
      return raw && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    },
    formatMatchTeams(match) {
      if (!match) return "";
      const teams = [match.homeTeamName, match.awayTeamName].filter(Boolean).join(" vs ");
      return teams || `比赛 #${match.matchId || "-"}`;
    },
    formatMatchTime(match) {
      return this.parseTime(match && match.matchTime, "{y}-{m}-{d} {h}:{i}") || "";
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
      this.selectedMatches = Array.isArray(matches) ? matches.filter(Boolean) : [];
      this.syncSelectedMatchIds();
    },
    handleRemoveSelectedMatch(index) {
      if (index < 0 || index >= this.selectedMatches.length) {
        return;
      }
      this.selectedMatches.splice(index, 1);
      this.syncSelectedMatchIds();
    },
    clearSelectedMatches() {
      if (!this.selectedMatches.length) {
        return;
      }
      this.selectedMatches = [];
      this.syncSelectedMatchIds();
    },
    syncSelectedMatchIds() {
      this.generateForm.matchIds = this.selectedMatches.map((match) => match.matchId);
      this.$nextTick(() => {
        if (!this.$refs.generateForm) {
          return;
        }
        if (this.selectedMatches.length) {
          this.$refs.generateForm.validateField("matchIds");
        } else {
          this.$refs.generateForm.clearValidate("matchIds");
        }
      });
    },
    loadMatchOptions() {
      return listMatch({ pageNum: 1, pageSize: 1, matchStatus: "0", hasActiveOdds: "Y" }).then((response) => {
        this.availableMatchCount = Number(response && response.total || 0);
      }).catch(() => {
        this.availableMatchCount = 0;
      });
    },
    handleAddSupplementaryObjective() {
      if (this.generateForm.supplementaryObjectives.length >= MAX_SUPPLEMENTARY_OBJECTIVES) {
        this.$modal.msgWarning(`补充业务目标最多填写 ${MAX_SUPPLEMENTARY_OBJECTIVES} 条`);
        return;
      }
      this.generateForm.supplementaryObjectives.push("");
    },
    handleRemoveSupplementaryObjective(index) {
      this.generateForm.supplementaryObjectives.splice(index, 1);
      this.$nextTick(() => {
        if (this.$refs.generateForm) this.$refs.generateForm.clearValidate("supplementaryObjectives");
      });
    },
    buildRequestFingerprint(workflow) {
      return JSON.stringify({
        workflow: workflow,
        generationMode: this.generateForm.generationMode,
        inputAmount: this.generateForm.inputAmount,
        targetAmount: this.generateForm.targetAmount,
        matchIds: [...this.generateForm.matchIds].sort((left, right) => left - right),
        supplementaryObjectives: normalizeSupplementaryObjectives(this.generateForm.supplementaryObjectives),
      });
    },
    buildGeneratePayload(workflow) {
      return {
        generationMode: this.generateForm.generationMode,
        inputAmount: this.generateForm.inputAmount,
        targetAmount: this.generateForm.targetAmount,
        matchIds: [...this.generateForm.matchIds],
        supplementaryObjectives: normalizeSupplementaryObjectives(this.generateForm.supplementaryObjectives),
        clientRequestId: this.getClientRequestId(workflow),
      };
    },
    getClientRequestId(workflow) {
      const fingerprint = this.buildRequestFingerprint(workflow);
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
        const payload = this.buildGeneratePayload("auto");
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
    handleCreateManualTask() {
      this.$refs.generateForm.validate((valid) => {
        if (!valid) return;
        if (!this.generateForm.matchIds.length) {
          this.$modal.msgError("请选择至少一场存在有效 odds 的比赛");
          return;
        }
        this.manualSubmitting = true;
        const payload = this.buildGeneratePayload("manual");
        createManualTask(payload).then((response) => {
          const task = (response && response.data) || {};
          if (!task.generationId || !task.taskId || !task.responseContract) {
            this.$modal.msgError("人工任务响应缺少批次或响应契约，请到历史列表中确认");
            return;
          }
          this.downloadManualTask(task);
          this.$modal.msgSuccess("人工AI任务已创建并下载，可交给第三方AI处理");
          this.startPolling(task.generationId);
        }).catch(() => {
          this.$modal.msgWarning("人工任务创建结果未确认；使用相同条件重试会复用同一幂等请求号");
        }).finally(() => {
          this.manualSubmitting = false;
        });
      });
    },
    downloadManualTask(task) {
      const content = JSON.stringify(task, null, 2);
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      this.$download.saveAs(blob, `dortmund-return-manual-task-${task.generationId}.json`);
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
        if (["1", "2", "3"].includes(detail.generationStatus)) {
          this.stopPolling(false);
          sessionStorage.removeItem(ACTIVE_GENERATION_KEY);
          this.clearPendingRequest();
          if (detail.generationStatus === "1") {
            const resultText = detail.resultSource === "M" ? "人工AI处理完成" : "分析完成";
            this.$modal.msgSuccess(`${resultText}，共 ${this.candidateList.length} 条候选组合`);
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
    handleManualImported() {
      this.pollGeneration();
    },
    backToHistory() {
      this.$router.push({ path: "/ai/solution/return" });
    },
  },
};
</script>

<style lang="scss" scoped>
.return-analysis-page {
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
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 18px;
}

.analysis-card {
  min-width: 0;
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

  i {
    margin-right: 4px;
  }
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

.generate-card-heading {
  justify-content: space-between;

  >span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  small {
    font-size: 12px;
    font-weight: 400;
    color: #8a9892;
  }
}

.generate-form {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: stretch;
  gap: 16px 18px;
}

.generate-section {
  grid-column: span 12;
  min-width: 0;
  padding: 16px;
  background: #fbfdfc;
  border: 1px solid #e3eee8;
  border-radius: 14px;

  .el-form-item {
    margin-bottom: 0;
  }
}

.generate-form>.generate-section:nth-of-type(1),
.generate-form>.generate-section:nth-of-type(4) {
  grid-column: span 7;
}

.generate-form>.generate-section:nth-of-type(2),
.generate-form>.generate-section:nth-of-type(5) {
  grid-column: span 5;
}

.generate-form>.generate-section:nth-of-type(3) {
  grid-column: span 12;
}

.generate-submit-section {
  background: linear-gradient(135deg, #f7fcf9 0%, #fff 100%);
}

.generate-section-head {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 10px;
}

.generate-step {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 11px;
  font-weight: 700;
  color: #1c9e55;
  background: #e8f8ef;
  border: 1px solid #d4efdf;
  border-radius: 9px;
}

.generate-section-copy {
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 13px;
    color: #2b3a36;
  }

  small {
    font-size: 12px;
    line-height: 1.45;
    color: #8a9892;
  }
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mode-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 92px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  background: #fbfdfc;
  border: 1px solid #e3eee8;
  border-radius: 11px;
  transition: border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

  &:hover {
    border-color: #b9e2ca;
    transform: translateY(-1px);
  }

  &.active {
    background: #f2fbf6;
    border-color: #61c88d;
    box-shadow: 0 7px 16px rgba(46, 204, 113, 0.12);
  }
}

.mode-card-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #27ad60;
  background: #e8f8ef;
  border-radius: 9px;
}

.mode-card-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding-right: 12px;

  strong {
    font-size: 12px;
    color: #2b3a36;
  }

  small {
    font-size: 11px;
    line-height: 1.45;
    color: #7c8b84;
  }
}

.mode-card-check {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 13px;
  color: #2ecc71;
}

.selected-match-panel {
  overflow: hidden;
  background: #fbfdfc;
  border: 1px solid #e3eee8;
  border-radius: 12px;
}

.selected-match-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e8f1ec;
}

.selected-match-toolbar-copy {
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 12px;
    color: #2b3a36;
  }

  small {
    font-size: 11px;
    color: #8a9892;
  }
}

.selected-match-toolbar-actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 6px;

  .el-button {
    margin-left: 0;
  }
}

.selected-match-list {
  max-height: 252px;
  overflow-y: auto;
  padding: 2px 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cfe4d9;
    border-radius: 999px;
  }
}

.selected-match-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;

  +.selected-match-row {
    border-top: 1px solid #edf4f0;
  }
}

.selected-match-index {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 23px;
  height: 23px;
  font-size: 11px;
  font-weight: 700;
  color: #1c9e55;
  background: #e8f8ef;
  border-radius: 8px;
}

.selected-match-copy {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;

  strong {
    overflow: hidden;
    font-size: 12px;
    color: #2b3a36;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    overflow: hidden;
    font-size: 11px;
    color: #8a9892;
    text-overflow: ellipsis;
    white-space: nowrap;

    i {
      margin-right: 4px;
      color: #79ad92;
    }
  }
}

.selected-match-remove {
  flex-shrink: 0;
  padding: 4px;
  color: #c45656;
}

.selected-match-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #8b9a93;

  i {
    font-size: 18px;
    color: #b7d7c5;
  }
}

.selected-match-summary {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 9px 10px;
  font-size: 12px;
  line-height: 1.55;
  color: #557066;
  background: #f2fbf6;
  border-top: 1px solid #e1f0e7;

  i {
    flex-shrink: 0;
    margin-top: 2px;
    color: #27ad60;
  }

  span {
    flex: 1;
    min-width: 0;
    word-break: break-word;
  }
}

.supplementary-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #8b9a93;
}

.supplementary-list {
  width: 100%;
}

.supplementary-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;

  .el-input {
    flex: 1;
  }
}

.supplementary-remove {
  flex-shrink: 0;
  padding: 4px 2px 0;
  color: #c45656;
}

.supplementary-add {
  padding: 0;
  color: #1c9e55;
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

.generate-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 12px;
}

.generate-btn {
  width: 100%;
  height: 40px;
  margin-top: 0;
  font-weight: 700;
  border: 0;
  border-radius: 10px;
  box-shadow: 0 9px 20px rgba(46, 204, 113, 0.23);
}

.manual-generate-btn {
  color: #b88230;
  background: #fffaf0;
  border: 1px solid #f0d9a8;
  box-shadow: none;
  position: relative;
  left: -8px;
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

  &.manual {
    background: #fffaf0;
    border-color: #f0dfb7;
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

.manual .batch-status-icon {
  color: #c78624;
  background: #fff4dd;
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

@media screen and (max-width: 991px) {
  .mode-cards {
    grid-template-columns: 1fr;
  }

  .mode-card {
    min-height: auto;
  }
}

@media screen and (max-width: 1199px) {

  .generate-form>.generate-section:nth-of-type(1),
  .generate-form>.generate-section:nth-of-type(2),
  .generate-form>.generate-section:nth-of-type(4),
  .generate-form>.generate-section:nth-of-type(5) {
    grid-column: span 12;
  }
}

@media screen and (max-width: 767px) {
  .analysis-main {
    gap: 14px;
  }

  .analysis-card {
    padding: 14px;
  }

  .generate-form {
    gap: 12px;
  }

  .generate-section {
    padding: 12px;
  }

  .generate-card-heading small {
    display: none;
  }

  .selected-match-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .selected-match-toolbar-actions {
    justify-content: flex-end;
    width: 100%;
  }

  .selected-match-list {
    max-height: 220px;
  }

  .candidates-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .candidate-tools {
    justify-content: flex-start;
    width: 100%;
  }

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
