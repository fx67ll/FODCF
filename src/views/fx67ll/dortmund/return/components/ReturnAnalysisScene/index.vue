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
          <section class="generate-section generate-path-section">
            <div class="generate-section-head">
              <span class="generate-step">01</span>
              <div class="generate-section-copy">
                <strong>分析路径</strong>
                <small>先选择分析由系统内部执行，或导出给第三方 AI 离线处理；两种路径共用下方业务参数</small>
              </div>
            </div>
            <div class="path-cards" role="radiogroup" aria-label="分析路径">
              <button type="button" class="path-card" :class="{ active: analysisPath === 'internal' }"
                :aria-pressed="analysisPath === 'internal' ? 'true' : 'false'" @click="analysisPath = 'internal'">
                <span class="path-card-icon"><i class="el-icon-cpu"></i></span>
                <span class="path-card-copy">
                  <strong>内部系统分析</strong>
                  <small>提交后由系统内部异步执行 AI 分析，候选结果直接回到本页</small>
                </span>
                <i class="el-icon-success path-card-check" v-if="analysisPath === 'internal'"></i>
              </button>
              <button type="button" class="path-card" :class="{ active: analysisPath === 'manual' }"
                :aria-pressed="analysisPath === 'manual' ? 'true' : 'false'" @click="analysisPath = 'manual'">
                <span class="path-card-icon"><i class="el-icon-document-add"></i></span>
                <span class="path-card-copy">
                  <strong>人工导出分析 <em>默认</em></strong>
                  <small>冻结同一业务快照并下载第三方 AI 任务，导入标准 JSON 后回到本页</small>
                </span>
                <i class="el-icon-success path-card-check" v-if="analysisPath === 'manual'"></i>
              </button>
            </div>
            <div class="path-note">
              <i class="el-icon-info"></i>
              <span>分析路径只决定本次提交去向，不写入批次或数据库字段；下方主观/AI 模式仍决定权重与检索策略。</span>
            </div>
          </section>

          <section class="generate-section">
            <div class="generate-section-head">
              <span class="generate-step">02</span>
              <div class="generate-section-copy">
                <strong>分析模式与组合偏好</strong>
                <small>主观模式沿用人工权重，AI 模式由模型独立评估；组合偏好约束候选结构但不改写金额公式</small>
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
                  <strong>AI 模式 <em>默认</em></strong>
                  <small>先规划并受控检索补充信息，再独立评估权重</small>
                </span>
                <i class="el-icon-success mode-card-check" v-if="generateForm.generationMode === 'A'"></i>
              </button>
            </div>
            <div class="odds-visibility-panel">
              <div class="odds-visibility-copy">
                <strong><i class="el-icon-view"></i>倍率数据可见性</strong>
                <small>默认隐藏真实倍率，AI 仅收到固定占位文本；关闭后仅在需要真实倍率参照的特殊场景下发送数值。无论是否隐藏，金额与回报均由后端按冻结快照复算。</small>
              </div>
              <el-switch v-model="generateForm.hideOdds" active-color="#2ecc71" inactive-color="#b9c9c1"
                active-text="隐藏真实倍率" inactive-text="发送真实倍率" />
            </div>
            <div class="preference-block">
              <div class="preference-head">
                <strong>组合偏好</strong>
                <small>快捷预设会填充四项受控维度；偏好仅作为 AI 组合策略提示，不改变金额、倍率、回报与偏差的确定性计算</small>
              </div>
              <div class="preference-cards" role="radiogroup" aria-label="组合偏好">
                <button v-for="option in preferenceOptions" :key="option.value" type="button" class="preference-card"
                  :class="[preferenceToneClass(option), { active: generateForm.preferenceCode === option.value }]"
                  :aria-pressed="generateForm.preferenceCode === option.value ? 'true' : 'false'"
                  @click="handlePreferencePresetClick(option)">
                  <i :class="option.icon" class="preference-card-icon"></i>
                  <span class="preference-card-copy">
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.description }}</small>
                  </span>
                </button>
              </div>
              <div class="preference-dimension-head">
                <div>
                  <strong>高级组合维度</strong>
                  <small>逐项组合风险、结构、投入与回报意图；调整任一项后自动切换为自定义</small>
                </div>
                <span class="preference-active-label" :class="preferenceActiveToneClass">{{ preferenceLabel }}</span>
              </div>
              <div class="preference-dimension-grid">
                <div v-for="group in preferenceDimensionGroups" :key="group.key" class="preference-dimension">
                  <div class="preference-dimension-title">
                    <span>{{ group.label }}</span>
                    <small>{{ selectedDimensionDescription(group) }}</small>
                  </div>
                  <div class="preference-dimension-options" role="radiogroup" :aria-label="group.label">
                    <button v-for="option in group.options" :key="option.value" type="button"
                      class="preference-dimension-option"
                      :class="[preferenceDimensionToneClass(option), { active: generateForm.preferenceDimensions[group.key] === option.value }]"
                      :aria-pressed="generateForm.preferenceDimensions[group.key] === option.value ? 'true' : 'false'"
                      :title="option.description" @click="handlePreferenceDimensionChange(group.key, option.value)">
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section class="generate-section">
            <div class="generate-section-head">
              <span class="generate-step">03</span>
              <div class="generate-section-copy">
                <strong>参与比赛</strong>
                <small>仅展示存在有效 odds 的比赛，单次最多选择 {{ maxAnalysisMatches }} 场</small>
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
                <small>先阅读固定业务约束，再补充本次分析特有的目标；补充内容不得复述或覆盖固定规则</small>
              </div>
            </div>
            <el-form-item prop="supplementaryObjectives">
              <div class="predefined-objective-panel">
                <div class="predefined-objective-head">
                  <span class="predefined-objective-title">
                    <i class="el-icon-lock"></i>
                    <strong>后端预定义业务目标</strong>
                  </span>
                  <span class="predefined-objective-badge">{{ predefinedBusinessObjectives.length }} 条固定约束</span>
                </div>
                <ol class="predefined-objective-list">
                  <li v-for="(objective, index) in predefinedBusinessObjectives" :key="index">{{ objective }}</li>
                </ol>
                <div class="predefined-objective-note">
                  以下补充目标与固定约束同时生效；重复、冲突或试图弱化固定约束的内容不会成为有效业务目标。
                </div>
              </div>
              <div class="supplementary-list">
                <div class="supplementary-item" v-for="(item, index) in generateForm.supplementaryObjectives"
                  :key="index">
                  <el-input :value="item" @input="handleSupplementaryObjectiveInput(index, $event)"
                    :maxlength="objectiveLimits.maxSingleLength" show-word-limit
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
              <div class="supplementary-conflict" v-if="supplementaryObjectiveConflict">
                <i class="el-icon-warning-outline"></i>
                <span>{{ supplementaryObjectiveConflict }}</span>
              </div>
              <div class="supplementary-hint">
                请填写固定约束未覆盖的本次分析意图，例如比赛层面的特定关注点；无需重复上方规则。
              </div>
            </el-form-item>
          </section>

          <section class="generate-section generate-submit-section">
            <div class="generate-section-head">
              <span class="generate-step">05</span>
              <div class="generate-section-copy">
                <strong>金额与提交</strong>
                <small>金额仅参与后台确定性计算；确认路径与参数后使用唯一提交按钮执行</small>
              </div>
            </div>
            <div class="submit-workspace">
              <div class="amount-parameter-panel">
                <div class="parameter-panel-head">
                  <div>
                    <strong>金额参数</strong>
                    <small>普通十进制数，最多保留两位小数</small>
                  </div>
                  <span class="parameter-panel-tag">单笔上限 {{ maxBusinessAmount }} 元</span>
                </div>
                <el-row :gutter="12">
                  <el-col :xs="24" :sm="12">
                    <el-form-item prop="inputAmount">
                      <template slot="label">
                        <dortmund-form-label label="基础金额" :tip="amountTip" />
                      </template>
                      <el-input v-model="generateForm.inputAmount" placeholder="如 100.00">
                        <template slot="append">元</template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item prop="targetAmount">
                      <template slot="label">
                        <dortmund-form-label label="目标金额" :tip="amountTip" />
                      </template>
                      <el-input v-model="generateForm.targetAmount" placeholder="如 128.50">
                        <template slot="append">元</template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="amount-parameter-note">
                  <i class="el-icon-info"></i>
                  <span>基础金额用于投入与回报测算，目标金额用于偏差参考；候选回报、倍率和偏差均以后台计算结果为准。</span>
                </div>
              </div>
              <div class="submit-action-panel">
                <div class="parameter-panel-head">
                  <div>
                    <strong>提交确认</strong>
                    <small>当前路径已决定唯一执行动作，减少误点另一入口的风险</small>
                  </div>
                </div>
                <div class="submit-path-summary">
                  <span class="submit-path-icon"><i :class="analysisPathIcon"></i></span>
                  <span class="submit-path-copy">
                    <strong>{{ analysisPathLabel }}</strong>
                    <small>{{ analysisPathDescription }}</small>
                  </span>
                </div>
                <div class="generate-actions">
                  <el-button type="success" class="generate-btn"
                    :class="{ 'manual-generate-btn': analysisPath === 'manual' }" :icon="analysisPathIcon"
                    :loading="submitting || manualSubmitting || generationProcessing"
                    :disabled="submitting || manualSubmitting || generationProcessing || !!supplementaryObjectiveConflict"
                    @click="handleSelectedPathSubmit" v-hasPermi="['dortmund:return:generate']">
                    {{ selectedSubmitText }}
                  </el-button>
                </div>
                <div class="async-tip">
                  <i class="el-icon-info"></i>
                  <span>{{ analysisPath === 'manual' ? '人工批次立即冻结同一份业务快照，不进入自动 AI 队列。' :
                    '内部批次由后台异步执行，页面轮询只负责读取状态，不会中断后台任务。' }}</span>
                </div>
              </div>
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
            <span v-if="generationDetail.generationMode === 'A' && !isManualGeneration">证据：{{
              formatEvidenceStatus(generationDetail.aiEvidenceStatus)
            }}</span>
            <span v-if="pollCount && generationProcessing">第 {{ pollCount }} 次状态检查</span>
          </div>
        </div>

        <div v-if="generationId && showAiWorkflow" class="analysis-card ai-workflow-card">
          <div class="analysis-card-title">
            <i class="el-icon-share"></i>AI分析工作流
          </div>
          <return-ai-workflow :generation="generationDetail" :can-view-raw="hasRemarkQueryPermission" />
        </div>

        <manual-ai-task-panel :generation-id="generationDetail.generationId || generationId"
          :generation-code="generationDetail.generationCode || ''"
          :generation-status="generationDetail.generationStatus || generationStatus"
          :result-source="generationDetail.resultSource || ''" :generated-count="generationDetail.generatedCount || 0"
          @imported="handleManualImported" />

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
                <dortmund-verification-status-tag :status="combination.verificationStatus" />
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
      :subtitle="combinationDetail.combinationCode ? `组合编码 · ${combinationDetail.combinationCode}` : (combinationIsManual ? '查看倍率、第三方AI分析与逐场理由' : '查看倍率、证据链与逐场明细')"
      icon="el-icon-collection-tag" tone="cyan" size="720px" :loading="combinationLoading" feature="return">
      <return-manual-result v-if="combinationIsManual" :combination="combinationDetail" :batch="combinationBatchContext"
        :can-view-reason="hasRemarkQueryPermission" />
      <return-analysis-result v-else :combination="combinationDetail" :batch="combinationBatchContext"
        :can-view-reason="hasRemarkQueryPermission" />
    </dortmund-detail-drawer>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" multiple :selected-items="selectedMatches"
      require-active-odds :max-count="maxAnalysisMatches" restrict-past-matches
      :default-match-time-days="matchSelectionWindowDays" @confirm="handleMatchSelectorConfirm" />
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
  getReturnBusinessObjectives,
  rejectCombination,
} from "@/api/fx67ll/dortmund/returnCombination";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import ManualAiTaskPanel from "../ManualAiTaskPanel/index";
import ReturnAiWorkflow from "../ReturnAiWorkflow/index";
import ReturnAnalysisResult from "../ReturnAnalysisResult/index";
import ReturnManualResult from "../ReturnManualResult/index";
import {
  DORTMUND_DEFAULT_ANALYSIS_PATH,
  DORTMUND_DEFAULT_GENERATION_MODE,
  DORTMUND_DEFAULT_MASK_ODDS,
  DORTMUND_DEFAULT_PREFERENCE_DIMENSIONS,
  DORTMUND_DEFAULT_PREFERENCE_CODE,
  DORTMUND_OBJECTIVE_LIMITS,
  DORTMUND_PAGINATION,
  DORTMUND_PREFERENCE_DIMENSIONS,
  DORTMUND_PREFERENCE_OPTIONS,
  DORTMUND_PREDEFINED_BUSINESS_OBJECTIVES,
  DORTMUND_RETURN_CONFIG,
  DORTMUND_RETURN_VERIFICATION_STATUS,
  DORTMUND_RETURN_POLLING,
  getPreferenceLabel,
  getPreferencePresetDimensions,
  normalizeDortmundObjectiveText,
  resolvePreferenceCode,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

const MAX_BUSINESS_AMOUNT = Number(DORTMUND_RETURN_CONFIG.maxBusinessAmount);
const MAX_SUPPLEMENTARY_OBJECTIVES = DORTMUND_OBJECTIVE_LIMITS.maxCount;
const MAX_SUPPLEMENTARY_OBJECTIVE_LENGTH = DORTMUND_OBJECTIVE_LIMITS.maxSingleLength;
const MAX_SUPPLEMENTARY_OBJECTIVES_TOTAL_LENGTH = DORTMUND_OBJECTIVE_LIMITS.maxTotalLength;
const ACTIVE_GENERATION_KEY = "dortmund.return.activeGenerationId";
const PENDING_REQUEST_KEY = "dortmund.return.pendingClientRequestId";
const POLL_INTERVAL_MS = DORTMUND_RETURN_POLLING.intervalMs;
// 3秒轮询600次覆盖1500秒租约，并给状态写入和网络抖动留出余量。
const MAX_POLL_COUNT = DORTMUND_RETURN_POLLING.maxCount;

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
  components: {
    DortmundMatchSelectorModal, DortmundFormLabel, DortmundVerificationStatusTag, ManualAiTaskPanel,
    ReturnAiWorkflow, ReturnAnalysisResult, ReturnManualResult, DortmundDetailDrawer, DortmundDetailCard,
    DortmundDetailBlock
  },
  data() {
    return {
      submitting: false,
      manualSubmitting: false,
      // 分析路径仅用于前端分流提交动作，不进入 generateForm、请求体或批次快照。
      analysisPath: DORTMUND_DEFAULT_ANALYSIS_PATH,
      predefinedBusinessObjectives: [...DORTMUND_PREDEFINED_BUSINESS_OBJECTIVES],
      generateForm: {
        generationMode: DORTMUND_DEFAULT_GENERATION_MODE,
        hideOdds: DORTMUND_DEFAULT_MASK_ODDS,
        preferenceCode: DORTMUND_DEFAULT_PREFERENCE_CODE,
        preferenceDimensions: { ...DORTMUND_DEFAULT_PREFERENCE_DIMENSIONS },
        inputAmount: null,
        targetAmount: null,
        matchIds: [],
        supplementaryObjectives: [""],
      },
      selectedMatches: [],
      preferenceOptions: DORTMUND_PREFERENCE_OPTIONS,
      preferenceDimensionGroups: DORTMUND_PREFERENCE_DIMENSIONS,
      maxAnalysisMatches: DORTMUND_RETURN_CONFIG.maxAnalysisMatches,
      matchSelectionWindowDays: DORTMUND_RETURN_CONFIG.matchSelectionWindowDays,
      maxBusinessAmount: DORTMUND_RETURN_CONFIG.maxBusinessAmount,
      objectiveLimits: DORTMUND_OBJECTIVE_LIMITS,
      matchSelectorVisible: false,
      availableMatchCount: 0,
      generationId: null,
      generationDetail: {},
      generationStatus: null,
      generationDetailLoaded: false,
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
            max: DORTMUND_RETURN_CONFIG.maxAnalysisMatches,
            message: `请选择 ${DORTMUND_RETURN_CONFIG.minAnalysisMatches}–${DORTMUND_RETURN_CONFIG.maxAnalysisMatches} 场存在有效 odds 的比赛`,
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
    preferenceLabel() {
      return getPreferenceLabel(this.generateForm.preferenceCode);
    },
    preferenceActiveToneClass() {
      return this.preferenceToneClassByCode(this.generateForm.preferenceCode);
    },
    amountTip() {
      return `必填；普通十进制数，不允许科学计数法；必须大于0，最多2位小数，且不超过${this.maxBusinessAmount}`;
    },
    analysisPathLabel() {
      return this.analysisPath === "manual" ? "人工导出分析" : "内部系统分析";
    },
    analysisPathDescription() {
      return this.analysisPath === "manual"
        ? "提交后冻结业务快照并下载人工 AI 任务，不触发内部自动分析队列。"
        : "提交后由系统内部自动分析并异步生成候选，不下载外部任务文件。";
    },
    analysisPathIcon() {
      return this.analysisPath === "manual" ? "el-icon-document-add" : "el-icon-cpu";
    },
    selectedSubmitText() {
      if (this.generationProcessing) return "后台分析中，可继续等待或离开页面";
      if (this.submitting) return "正在提交内部系统分析";
      if (this.manualSubmitting) return "正在创建人工任务";
      return this.analysisPath === "manual" ? "创建并导出人工AI任务" : "提交内部系统分析";
    },
    supplementaryObjectiveConflict() {
      const predefinedKeys = new Set(
        this.predefinedBusinessObjectives.map((item) => normalizeDortmundObjectiveText(item))
      );
      const seen = new Map();
      const objectives = Array.isArray(this.generateForm.supplementaryObjectives)
        ? this.generateForm.supplementaryObjectives : [];
      for (let index = 0; index < objectives.length; index += 1) {
        const text = String(objectives[index] == null ? "" : objectives[index]).trim();
        const key = normalizeDortmundObjectiveText(text);
        if (!key) continue;
        if (predefinedKeys.has(key)) {
          return `第 ${index + 1} 条与上方固定业务约束重复，请改为填写本次分析特有的补充要求。`;
        }
        if (seen.has(key)) {
          return `第 ${index + 1} 条与第 ${seen.get(key) + 1} 条补充目标重复，请合并或删除。`;
        }
        seen.set(key, index);
      }
      return "";
    },
    combinationBatchContext() {
      if (!this.generationDetail || !this.combinationDetail) return null;
      return String(this.generationDetail.generationId || '') === String(this.combinationDetail.generationId || '')
        ? this.generationDetail : null;
    },
    isManualGeneration() {
      return String(this.generationDetail.resultSource || '') === 'M';
    },
    showAiWorkflow() {
      // 仅在批次状态已确认且来源不是人工AI时展示自动AI工作流，避免人工任务创建后的首屏误显示。
      if (!this.generationDetailLoaded || this.isManualGeneration) return false;
      if (String(this.generationStatus || '') === '3') return false;
      const source = String(this.generationDetail.resultSource || '');
      return source === 'A' || source === '';
    },
    combinationIsManual() {
      const combinationSource = String(this.combinationDetail.resultSource || '');
      if (combinationSource) return combinationSource === 'M';
      if (this.combinationBatchContext) {
        return String(this.combinationBatchContext.resultSource || '') === 'M';
      }
      const sameBatch = String(this.generationDetail.generationId || '') === String(this.combinationDetail.generationId || '');
      return sameBatch && this.isManualGeneration;
    },
    modeHint() {
      return this.generateForm.generationMode === "S"
        ? "固定使用当前有效 odds 的手工权重，不执行平台检索；AI仍须结合标签、信息点与倍率论证"
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
      if (this.generationId && !this.generationDetailLoaded) return "正在读取批次状态";
      if (this.generationStatus === "1" && this.generationDetail.resultSource === "M") return "人工AI处理完成";
      if (this.generationStatus === "1") return "分析完成";
      if (this.generationStatus === "2") return "分析失败";
      if (this.generationStatus === "3") return "等待人工AI结果";
      return "批次处理中";
    },
    statusDescription() {
      if (this.generationId && !this.generationDetailLoaded) {
        return "正在确认批次来源与处理状态，请稍候。";
      }
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
    this.loadPredefinedBusinessObjectives();
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
    /**
     * 读取后端当前预定义业务目标，确保页面提示与实际送入 AI 的固定约束一致。
     * 接口失败或返回空值时保留模块公共配置兜底，不阻塞分析表单。
     */
    loadPredefinedBusinessObjectives() {
      return getReturnBusinessObjectives().then((response) => {
        const payload = response && response.data;
        const result = Array.isArray(payload) ? payload : payload && payload.objectives;
        const objectives = (Array.isArray(result) ? result : [])
          .map((item) => String(item == null ? "" : item).trim())
          .filter(Boolean);
        if (objectives.length) {
          this.predefinedBusinessObjectives = objectives;
        }
      }).catch(() => {
        this.predefinedBusinessObjectives = [...DORTMUND_PREDEFINED_BUSINESS_OBJECTIVES];
      });
    },
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
      return this.parseTime(match && match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") || "";
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
      return listMatch({
        pageNum: 1,
        pageSize: DORTMUND_PAGINATION.existenceCheckPageSize,
        matchStatus: "0",
        hasActiveOdds: "Y",
      }).then((response) => {
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
    handleSupplementaryObjectiveInput(index, value) {
      // 使用 $set 替换数组下标值，确保 Vue 2 能立即重新计算重复/冲突校验并刷新提交按钮状态。
      this.$set(this.generateForm.supplementaryObjectives, index, value);
    },
    handleRemoveSupplementaryObjective(index) {
      this.generateForm.supplementaryObjectives.splice(index, 1);
      this.$nextTick(() => {
        if (this.$refs.generateForm) this.$refs.generateForm.clearValidate("supplementaryObjectives");
      });
    },
    handlePreferencePresetClick(option) {
      this.generateForm.preferenceCode = option.value;
      this.generateForm.preferenceDimensions = option.dimensions
        ? { ...option.dimensions } : getPreferencePresetDimensions(option.value);
    },
    /** 快捷预设按业务含义着色：高投入橙、低风险短串蓝、均衡主题绿、高风险红。 */
    preferenceToneClass(option) {
      return this.preferenceToneClassByCode(option && option.value);
    },
    preferenceToneClassByCode(code) {
      const option = this.preferenceOptions.find((item) => item.value === code);
      if (option && option.tone) {
        return `is-tone-${option.tone}`;
      }
      return this.preferenceRiskToneClass(this.generateForm.preferenceDimensions.riskLevel);
    },
    /** 自定义组合按风险水平回退：低风险蓝、均衡主题绿、高风险红。 */
    preferenceRiskToneClass(riskLevel) {
      if (riskLevel === "HIGH") return "is-tone-danger";
      if (riskLevel === "BALANCED") return "is-tone-success";
      return "is-tone-primary";
    },
    preferenceDimensionToneClass(option) {
      return option && option.tone ? `is-tone-${option.tone}` : "";
    },
    handlePreferenceDimensionChange(groupKey, value) {
      const dimensions = {
        ...this.generateForm.preferenceDimensions,
        [groupKey]: value,
      };
      // 低风险与长串互斥：保持两个选项都可点击，并将另一维度归一化为合法组合。
      if (dimensions.riskLevel === "LOW" && dimensions.structure === "LONG") {
        if (groupKey === "riskLevel") {
          dimensions.structure = "BALANCED";
        } else {
          dimensions.riskLevel = "BALANCED";
        }
      }
      this.generateForm.preferenceDimensions = dimensions;
      this.generateForm.preferenceCode = resolvePreferenceCode(dimensions);
    },
    selectedDimensionDescription(group) {
      const selectedValue = this.generateForm.preferenceDimensions[group.key];
      const option = group.options.find((item) => item.value === selectedValue);
      return option ? option.description : "";
    },
    buildRequestFingerprint(workflow) {
      return JSON.stringify({
        workflow: workflow,
        generationMode: this.generateForm.generationMode,
        hideOdds: this.generateForm.hideOdds,
        preferenceCode: this.generateForm.preferenceCode,
        preferenceDimensions: { ...this.generateForm.preferenceDimensions },
        inputAmount: this.generateForm.inputAmount,
        targetAmount: this.generateForm.targetAmount,
        matchIds: [...this.generateForm.matchIds].sort((left, right) => left - right),
        supplementaryObjectives: normalizeSupplementaryObjectives(this.generateForm.supplementaryObjectives),
      });
    },
    buildGeneratePayload(workflow) {
      return {
        generationMode: this.generateForm.generationMode,
        hideOdds: this.generateForm.hideOdds,
        preferenceCode: this.generateForm.preferenceCode,
        preferenceDimensions: { ...this.generateForm.preferenceDimensions },
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
    /**
     * 唯一提交入口：路径只在浏览器内决定调用自动分析还是人工任务接口。
     * 两种接口继续复用同一份表单、校验与幂等指纹，分析路径本身不进入请求体。
     */
    handleSelectedPathSubmit() {
      if (this.submitting || this.manualSubmitting) {
        return;
      }
      if (this.generationProcessing) {
        this.$modal.msgWarning("已有批次正在后台处理，请等待完成或返回历史列表。");
        return;
      }
      if (this.supplementaryObjectiveConflict) {
        this.$modal.msgWarning(this.supplementaryObjectiveConflict);
        return;
      }
      if (this.analysisPath === "manual") {
        this.handleCreateManualTask();
      } else {
        this.handleGenerate();
      }
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
          this.startPolling(generation.generationId, {
            generationStatus: generation.generationStatus || "0",
            resultSource: generation.resultSource || "A",
            generationCode: generation.generationCode || "",
            generationMode: generation.generationMode || this.generateForm.generationMode,
            inputAmount: generation.inputAmount,
            targetAmount: generation.targetAmount,
          });
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
          if (!task.generationId || !task.taskId || !task.responseContract || !task.exportPrompt) {
            this.$modal.msgError("人工任务响应缺少批次、处理提示词或响应契约，请到历史列表中确认");
            return;
          }
          this.downloadManualTask(task);
          this.$modal.msgSuccess("人工AI任务已创建并下载，完整处理提示词已内嵌，可交给第三方AI处理");
          this.startPolling(task.generationId, {
            generationStatus: "3",
            resultSource: "M",
            generationCode: task.taskId || "",
            generationMode: task.generationMode || this.generateForm.generationMode,
            inputAmount: task.input && task.input.inputAmount,
            targetAmount: task.input && task.input.targetAmount,
            generatedCount: 0,
            generationRemark: "人工AI任务已创建，等待导入第三方AI标准化结果。",
          });
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
    startPolling(generationId, initialDetail) {
      this.stopPolling();
      this.generationId = generationId;
      this.generationDetailLoaded = Boolean(initialDetail);
      this.generationStatus = initialDetail && initialDetail.generationStatus
        ? initialDetail.generationStatus : "0";
      this.generationDetail = initialDetail ? { ...initialDetail, generationId } : { generationId };
      this.candidateList = [];
      this.selectedCandidateIds = [];
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
        this.generationDetailLoaded = true;
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
        this.generationDetailLoaded = false;
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
          ? { ...item, adoptedFlag: "Y", verificationStatus: DORTMUND_RETURN_VERIFICATION_STATUS.unverified }
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
          ? { ...item, adoptedFlag, verificationStatus: DORTMUND_RETURN_VERIFICATION_STATUS.unverified }
          : item);
        this.selectedCandidateIds = this.selectedCandidateIds.filter((id) => id !== combination.combinationId);
      }).catch(() => {
      }).finally(() => {
        this.reviewingId = null;
      });
    },
    handleCombinationDetail(row) {
      if (!row || !this.isPositiveId(row.combinationId)) {
        this.$modal.msgWarning("该候选组合尚未生成有效编号，请等待批次完成或刷新后重试");
        return;
      }
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
    isPositiveId(value) {
      const id = Number(value);
      return Number.isInteger(id) && id > 0;
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

  /* 顶部标签本身按内容自然排版，显式清除 Element 默认的右侧留白与偏移。 */
  ::v-deep .el-form-item__label {
    padding-right: 0;
    padding-left: 0;
    margin-left: 0;
    text-align: left;
  }
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

.generate-submit-section {
  background: linear-gradient(135deg, #f7fcf9 0%, #fff 100%);
}

.submit-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 14px;
}

.amount-parameter-panel,
.submit-action-panel {
  min-width: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 12px;
}

.submit-action-panel {
  display: flex;
  flex-direction: column;
}

.parameter-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  >div {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

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

.parameter-panel-tag {
  flex-shrink: 0;
  padding: 3px 8px;
  font-size: 11px;
  color: #238c51;
  white-space: nowrap;
  background: #effaf4;
  border: 1px solid #cbeed9;
  border-radius: 999px;
}

.amount-parameter-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 9px 10px;
  margin-top: 12px;
  font-size: 11px;
  line-height: 1.55;
  color: #7c8b84;
  background: #f7fbf9;
  border: 1px solid #e3eee8;
  border-radius: 8px;

  i {
    flex-shrink: 0;
    margin-top: 2px;
    color: #27ad60;
  }
}

.submit-action-panel .generate-actions {
  margin-top: 0;
}

.submit-path-summary {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  margin-bottom: 12px;
  background: #f7fbf9;
  border: 1px solid #dcefe4;
  border-radius: 10px;
}

.submit-path-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #1c9e55;
  background: #e8f8ef;
  border-radius: 9px;
}

.submit-path-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    font-size: 12px;
    color: #2b3a36;
  }

  small {
    font-size: 11px;
    line-height: 1.5;
    color: #7c8b84;
  }
}

.submit-action-panel .async-tip {
  margin-top: auto;
  padding-top: 10px;
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

.path-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.path-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 76px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 11px;
  transition: border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

  &:hover {
    border-color: #b9e2ca;
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(135deg, #f2fbf6, #fff);
    border-color: #61c88d;
    box-shadow: 0 7px 16px rgba(46, 204, 113, 0.11);
  }
}

.path-card-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #1c9e55;
  background: #e8f8ef;
  border-radius: 9px;
}

.path-card-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding-right: 18px;

  strong {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #2b3a36;
  }

  em {
    padding: 1px 6px;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    color: #1c9e55;
    background: #e8f8ef;
    border-radius: 999px;
  }

  small {
    font-size: 11px;
    line-height: 1.5;
    color: #7c8b84;
  }
}

.path-card-check {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 13px;
  color: #2ecc71;
}

.path-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  margin-top: 10px;
  font-size: 11px;
  line-height: 1.5;
  color: #6f7f78;
  background: #f7fbf9;
  border: 1px dashed #d7e9df;
  border-radius: 8px;

  i {
    flex-shrink: 0;
    margin-top: 2px;
    color: #27ad60;
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
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #2b3a36;
  }

  em {
    padding: 1px 6px;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    color: #1c9e55;
    background: #e8f8ef;
    border-radius: 999px;
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

/* 倍率可见性开关：与模式卡片共用浅绿底色，强调这是AI输入口径而非金额参数。 */
.odds-visibility-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  margin-top: 10px;
  background: #f7fbf9;
  border: 1px solid #dcebe2;
  border-left: 3px solid #2ecc71;
  border-radius: 10px;
}

.odds-visibility-copy {
  display: grid;
  flex: 1 1 320px;
  gap: 3px;
  min-width: 0;

  strong {
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 12px;
    color: #2b3a36;

    i {
      color: #1c9e55;
    }
  }

  small {
    font-size: 11px;
    line-height: 1.55;
    color: #7c8b84;
  }
}

.odds-visibility-panel ::v-deep .el-switch {
  flex-shrink: 0;
}

.preference-block {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #dcebe2;
}

.preference-head {
  display: grid;
  gap: 3px;
  margin-bottom: 9px;

  strong {
    font-size: 12px;
    color: #2b3a36;
  }

  small {
    font-size: 11px;
    line-height: 1.5;
    color: #7c8b84;
  }
}

.preference-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

/* 预设与高级维度共用同一套浅色语义色，选中态只叠加透明色晕，避免大面积实色。 */
.preference-card,
.preference-active-label,
.preference-dimension-option {
  --preference-accent: #2ecc71;
  --preference-accent-strong: #1f8b4d;
  --preference-accent-soft: rgba(46, 204, 113, 0.09);
  --preference-accent-soft-strong: rgba(46, 204, 113, 0.16);
  --preference-accent-border: rgba(46, 204, 113, 0.36);
  --preference-accent-shadow: rgba(46, 204, 113, 0.16);

  &.is-tone-warning {
    --preference-accent: #e6a23c;
    --preference-accent-strong: #b88230;
    --preference-accent-soft: rgba(230, 162, 60, 0.09);
    --preference-accent-soft-strong: rgba(230, 162, 60, 0.16);
    --preference-accent-border: rgba(230, 162, 60, 0.36);
    --preference-accent-shadow: rgba(230, 162, 60, 0.16);
  }

  &.is-tone-primary {
    --preference-accent: #409eff;
    --preference-accent-strong: #337ecc;
    --preference-accent-soft: rgba(64, 158, 255, 0.09);
    --preference-accent-soft-strong: rgba(64, 158, 255, 0.16);
    --preference-accent-border: rgba(64, 158, 255, 0.36);
    --preference-accent-shadow: rgba(64, 158, 255, 0.16);
  }

  &.is-tone-success {
    --preference-accent: #2ecc71;
    --preference-accent-strong: #1f8b4d;
    --preference-accent-soft: rgba(46, 204, 113, 0.09);
    --preference-accent-soft-strong: rgba(46, 204, 113, 0.16);
    --preference-accent-border: rgba(46, 204, 113, 0.36);
    --preference-accent-shadow: rgba(46, 204, 113, 0.16);
  }

  &.is-tone-danger {
    --preference-accent: #f56c6c;
    --preference-accent-strong: #c45656;
    --preference-accent-soft: rgba(245, 108, 108, 0.09);
    --preference-accent-soft-strong: rgba(245, 108, 108, 0.16);
    --preference-accent-border: rgba(245, 108, 108, 0.36);
    --preference-accent-shadow: rgba(245, 108, 108, 0.16);
  }
}

.preference-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 72px;
  padding: 10px 11px;
  overflow: hidden;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  isolation: isolate;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(207, 226, 216, 0.9);
  border-radius: 11px;
  box-shadow: 0 1px 2px rgba(31, 62, 48, 0.03);
  transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.24s ease,
    box-shadow 0.24s ease, background-color 0.24s ease;

  &::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(135deg, var(--preference-accent-soft-strong), var(--preference-accent-soft) 52%,
        rgba(255, 255, 255, 0) 88%);
    opacity: 0;
    transition: opacity 0.24s ease;
  }

  >* {
    position: relative;
    z-index: 1;
  }

  &:hover {
    border-color: var(--preference-accent-border);
    box-shadow: 0 8px 18px var(--preference-accent-shadow);
    transform: translateY(-2px);

    &::before {
      opacity: 0.58;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--preference-accent-border);
    outline-offset: 2px;
  }

  &:active {
    box-shadow: 0 3px 9px var(--preference-accent-shadow);
    transform: translateY(0) scale(0.985);
  }

  &.active {
    background: rgba(255, 255, 255, 0.72);
    border-color: var(--preference-accent);
    box-shadow: inset 0 0 0 1px var(--preference-accent-soft-strong), 0 8px 18px var(--preference-accent-shadow);
    animation: preferenceCardSelect 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);

    &::before {
      opacity: 1;
    }

    .preference-card-icon {
      color: var(--preference-accent-strong);
      background: var(--preference-accent-soft-strong);
      transform: scale(1.04);
    }

    .preference-card-copy strong {
      color: var(--preference-accent-strong);
    }
  }
}

.preference-card-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 15px;
  color: var(--preference-accent);
  background: var(--preference-accent-soft);
  border-radius: 8px;
  transition: color 0.22s ease, background-color 0.22s ease, transform 0.22s ease;
}

.preference-card-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    font-size: 12px;
    color: #2b3a36;
    transition: color 0.22s ease;
  }

  small {
    font-size: 11px;
    line-height: 1.4;
    color: #7c8b84;
  }
}

.preference-dimension-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 9px;

  strong {
    display: block;
    margin-bottom: 3px;
    font-size: 12px;
    color: #2b3a36;
  }

  small {
    display: block;
    font-size: 11px;
    line-height: 1.5;
    color: #7c8b84;
  }
}

.preference-active-label {
  flex-shrink: 0;
  max-width: 45%;
  padding: 4px 8px;
  overflow: hidden;
  font-size: 11px;
  color: var(--preference-accent-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--preference-accent-soft);
  border: 1px solid var(--preference-accent-border);
  border-radius: 999px;
  transition: color 0.22s ease, background-color 0.22s ease, border-color 0.22s ease;
}

.preference-dimension-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.preference-dimension {
  min-width: 0;
  padding: 9px 10px;
  background: rgba(251, 253, 252, 0.76);
  border: 1px solid rgba(227, 238, 232, 0.9);
  border-radius: 10px;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;

  &:hover {
    background: rgba(251, 253, 252, 0.96);
    border-color: rgba(46, 204, 113, 0.24);
    box-shadow: 0 6px 15px rgba(46, 204, 113, 0.07);
  }
}

.preference-dimension-title {
  display: grid;
  gap: 2px;
  margin-bottom: 7px;

  span {
    font-size: 11px;
    font-weight: 600;
    color: #33443e;
  }

  small {
    min-height: 30px;
    font-size: 10px;
    line-height: 1.45;
    color: #829089;
  }
}

.preference-dimension-options {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.preference-dimension-option {
  position: relative;
  min-height: 27px;
  padding: 4px 9px;
  font-size: 11px;
  color: #52635d;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(220, 235, 226, 0.94);
  border-radius: 8px;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease,
    color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    color: var(--preference-accent-strong);
    background: var(--preference-accent-soft);
    border-color: var(--preference-accent-border);
    box-shadow: 0 4px 10px var(--preference-accent-shadow);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--preference-accent-border);
    outline-offset: 1px;
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.96);
  }

  &.active {
    font-weight: 600;
    color: var(--preference-accent-strong);
    background: linear-gradient(135deg, var(--preference-accent-soft-strong), var(--preference-accent-soft));
    border-color: var(--preference-accent);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.44), 0 4px 10px var(--preference-accent-shadow);
    animation: preferenceOptionSelect 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &:disabled {
    color: #b4bdb9;
    cursor: not-allowed;
    background: #f5f7f6;
    border-color: #e7ece9;
  }
}

@keyframes preferenceCardSelect {
  0% {
    transform: translateY(0) scale(0.985);
  }

  62% {
    transform: translateY(-2px) scale(1.006);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes preferenceOptionSelect {
  0% {
    transform: scale(0.94);
  }

  68% {
    transform: scale(1.035);
  }

  100% {
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .preference-dimension-grid {
    grid-template-columns: 1fr;
  }

  .preference-active-label {
    max-width: 50%;
  }
}

@media (prefers-reduced-motion: reduce) {

  .preference-card,
  .preference-card::before,
  .preference-card-icon,
  .preference-card-copy strong,
  .preference-active-label,
  .preference-dimension,
  .preference-dimension-option {
    transition: none;
    animation: none;
  }
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

.predefined-objective-panel {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #fffaf0 0%, #fffdf8 100%);
  border: 1px solid #f0d9a8;
  border-left: 4px solid #d69d38;
  border-radius: 12px;
}

.predefined-objective-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}

.predefined-objective-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8a5b16;

  i {
    font-size: 14px;
    color: #c78624;
  }
}

.predefined-objective-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 10px;
  color: #9a681d;
  background: #fff3dc;
  border: 1px solid #efd7a7;
  border-radius: 999px;
}

.predefined-objective-list {
  display: grid;
  gap: 6px;
  padding-left: 20px;
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #5f5542;
  list-style: decimal;

  li::marker {
    font-weight: 700;
    color: #b88230;
  }
}

.predefined-objective-note {
  padding-top: 8px;
  margin-top: 9px;
  font-size: 11px;
  line-height: 1.55;
  color: #9a7a45;
  border-top: 1px dashed #ecd7ae;
}

.supplementary-conflict {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #c45656;
  background: #fdf5f4;
  border: 1px solid #f0d4d0;
  border-radius: 8px;

  i {
    flex-shrink: 0;
    margin-top: 2px;
  }
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
  color: #8a5b16;
  background: linear-gradient(135deg, #fff6e5, #fffaf0);
  border: 1px solid #e7c77f;
  box-shadow: 0 9px 20px rgba(214, 157, 56, 0.18);
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

  .path-cards,
  .mode-cards,
  .submit-workspace {
    grid-template-columns: 1fr;
  }

  .path-card,
  .mode-card {
    min-height: auto;
  }
}

@media screen and (max-width: 1199px) {

  .preference-cards,
  .preference-dimension-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .amount-parameter-panel,
  .submit-action-panel {
    padding: 12px;
  }

  .preference-cards,
  .preference-dimension-grid {
    grid-template-columns: 1fr;
  }

  .predefined-objective-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .parameter-panel-head {
    flex-direction: column;
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
