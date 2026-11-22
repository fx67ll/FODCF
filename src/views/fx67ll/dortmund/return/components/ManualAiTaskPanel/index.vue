<template>
  <div v-if="visible" class="manual-ai-task-panel">
    <div class="manual-head">
      <div class="manual-heading">
        <div class="manual-icon"><i class="el-icon-upload2"></i></div>
        <div>
          <strong>{{ panelTitle }}</strong>
          <span>{{ panelSubtitle }}</span>
        </div>
      </div>
      <div class="manual-actions">
        <el-button type="primary" plain size="mini" icon="el-icon-document-copy"
          @click="openTemplateTab('task-fields')">字段与模板</el-button>
        <el-button type="info" plain size="mini" icon="el-icon-chat-line-square"
          @click="openTemplateTab('prompt')">AI提示词</el-button>
        <el-button type="warning" plain size="mini" icon="el-icon-download" :loading="taskLoading"
          @click="handleExportTask">导出处理任务</el-button>
        <el-button type="success" plain size="mini" icon="el-icon-upload2" @click="openImportDialog">
          {{ isManualCompleted ? "重新导入结果" : "导入标准化结果" }}
        </el-button>
      </div>
    </div>

    <div class="manual-workflow">
      <div v-for="(step, index) in workflowSteps" :key="index" class="manual-step">
        <span class="manual-step-index">{{ index + 1 }}</span>
        <div class="manual-step-copy">
          <strong>{{ stepTitles[index] || `步骤${index + 1}` }}</strong>
          <span>{{ step }}</span>
        </div>
      </div>
    </div>
    <div class="manual-note">
      <i class="el-icon-lock"></i>
      <span>{{ panelNote }}</span>
    </div>

    <el-dialog title="导入人工AI标准化结果" :visible.sync="importVisible" width="820px" append-to-body
      custom-class="manual-ai-dialog manual-import-dialog" :close-on-click-modal="false" @closed="resetImportState">
      <div class="manual-dialog-body">
        <div class="manual-contract">
          <span><label>契约版本</label><b>v1.0</b></span>
          <span><label>任务批次</label><b>{{ generationCode || "-" }}</b></span>
          <span><label>预检候选</label><b>{{ candidateCount }} 条</b></span>
          <span><label>批次现有</label><b>{{ existingCount }} 条</b></span>
          <span><label>正文上限</label><b>{{ maxResponseSizeText }}</b></span>
        </div>
        <div class="manual-mode-row">
          <span class="manual-mode-label">导入方式</span>
          <el-radio-group v-model="importMode" size="mini">
            <el-radio-button label="REPLACE">覆盖重导</el-radio-button>
            <el-radio-button label="APPEND">追加合并</el-radio-button>
          </el-radio-group>
          <small v-if="importMode === 'REPLACE'">
            清空本批次未采用、未关联方案且无图片的旧候选后重导。
          </small>
          <small v-else>
            保留现有候选，合并不同第三方AI结论；同一组合签名自动跳过，批次最多 {{ maxTotalCandidates }} 条。
          </small>
        </div>
        <div class="manual-import-toolbar">
          <span>导入前可先核对字段或复制修复提示词：</span>
          <el-button type="text" class="dortmund-theme-text" icon="el-icon-document"
            @click="openTemplateTab('result')">查看结果模板</el-button>
          <el-button type="text" class="dortmund-theme-text" icon="el-icon-copy-document"
            @click="copyPrompt('import')">复制修复提示词</el-button>
          <el-button type="text" class="dortmund-theme-text" icon="el-icon-question"
            @click="openTemplateTab('result-fields')">结果字段说明</el-button>
        </div>
        <div class="manual-guidance">
          <i class="el-icon-info"></i>
          <span>只粘贴 responseContract 定义的单个 JSON 对象；同一批次可反复覆盖重导或追加多份AI结论。系统不接受模型自行计算的倍率、
            回报或金额，最终数据以后端复算为准；confidence 和 riskNotes 用于复核。</span>
        </div>
        <div class="manual-upload-row">
          <el-upload action="#" accept=".json,.txt" :auto-upload="false" :show-file-list="false"
            :on-change="handleFileChange">
            <el-button size="mini" type="primary" plain icon="el-icon-folder-opened">选择 JSON 文件</el-button>
          </el-upload>
          <span>也可直接粘贴，正文上限 {{ maxResponseSizeText }}</span>
          <el-button type="text" class="dortmund-theme-text" :disabled="!responseContent"
            @click="handleClear">清空</el-button>
        </div>
        <el-input v-model="responseContent" type="textarea" :rows="15" resize="vertical"
          placeholder="粘贴第三方AI返回的标准化JSON..." @input="refreshPreview" />
        <div class="manual-error" v-if="importError">
          <i class="el-icon-warning-outline"></i>
          <span>{{ importError }}</span>
        </div>
        <div class="manual-preview" v-else-if="previewReady">
          <i class="el-icon-circle-check"></i>
          <span>契约预检通过：{{ candidateCount }} 条候选，taskId={{ previewTaskId }}</span>
        </div>
        <div v-if="previewReady && previewCandidates.length" class="manual-preview-list">
          <div v-for="(candidate, index) in previewCandidates" :key="index" class="manual-preview-item">
            <span class="manual-preview-index">{{ index + 1 }}</span>
            <div class="manual-preview-copy">
              <strong>{{ candidate.title }}</strong>
              <span>{{ candidate.selectionCount }} 场 · {{ candidate.selectionSummary }}
                <template v-if="candidate.confidence != null"> · 置信度 {{ candidate.confidence }}</template>
              </span>
              <span v-if="candidate.riskNotes" class="manual-preview-risk">风险：{{ candidate.riskNotes }}</span>
            </div>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="importVisible = false">取消</el-button>
        <el-button size="small" type="success" :loading="importLoading"
          :disabled="!responseContent || Boolean(importError) || !previewReady" @click="handleImport">校验并导入</el-button>
      </span>
    </el-dialog>

    <el-dialog title="人工AI标准交换模板与字段说明" :visible.sync="templateVisible" width="1100px" append-to-body
      custom-class="manual-ai-dialog manual-template-dialog" :close-on-click-modal="false">
      <div v-loading="templateLoading" class="manual-template-body">
        <div class="manual-guidance">
          <i class="el-icon-info"></i>
          <span>{{ templateInstruction || "模板仅说明结构；实际导出请使用当前批次任务，导入前必须把taskId替换为当前批次编码。" }}</span>
        </div>
        <el-tabs v-model="templateTab" class="manual-template-tabs">
          <el-tab-pane label="导出任务字段" name="task-fields">
            <div class="manual-template-toolbar">
              <span>逐项说明导出任务JSON的字段、类型、必填性和用途。</span>
              <el-button size="mini" type="primary" plain icon="el-icon-copy-document" :disabled="!taskFields.length"
                @click="copyFieldGuide('task')">复制字段说明</el-button>
            </div>
            <el-table :data="taskFields" size="mini" border max-height="430" class="manual-field-table"
              empty-text="字段说明加载中...">
              <el-table-column label="分组" prop="group" width="90" show-overflow-tooltip />
              <el-table-column label="JSON路径" prop="path" min-width="235" show-overflow-tooltip />
              <el-table-column label="字段" prop="label" width="112" show-overflow-tooltip />
              <el-table-column label="类型" prop="type" width="96" show-overflow-tooltip />
              <el-table-column label="必填" width="64" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.required ? 'danger' : 'info'" size="mini">
                    {{ scope.row.required ? "是" : "否" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="说明" prop="description" min-width="300" show-overflow-tooltip />
              <el-table-column label="示例" prop="example" min-width="180" show-overflow-tooltip />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="导入结果字段" name="result-fields">
            <div class="manual-template-toolbar">
              <span>逐项说明第三方AI必须返回的结果字段；可选字段建议填写，便于复核。</span>
              <el-button size="mini" type="success" plain icon="el-icon-copy-document" :disabled="!resultFields.length"
                @click="copyFieldGuide('result')">复制字段说明</el-button>
            </div>
            <el-table :data="resultFields" size="mini" border max-height="430" class="manual-field-table"
              empty-text="字段说明加载中...">
              <el-table-column label="分组" prop="group" width="90" show-overflow-tooltip />
              <el-table-column label="JSON路径" prop="path" min-width="250" show-overflow-tooltip />
              <el-table-column label="字段" prop="label" width="120" show-overflow-tooltip />
              <el-table-column label="类型" prop="type" width="96" show-overflow-tooltip />
              <el-table-column label="必填" width="64" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.required ? 'danger' : 'info'" size="mini">
                    {{ scope.row.required ? "是" : "否" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="说明" prop="description" min-width="300" show-overflow-tooltip />
              <el-table-column label="示例" prop="example" min-width="180" show-overflow-tooltip />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="导出任务模板" name="task">
            <div class="manual-template-toolbar">
              <span>说明人工AI任务的输入骨架，不能替代当前批次实际导出数据。</span>
              <el-button size="mini" type="primary" plain icon="el-icon-copy-document" :disabled="!templateTask"
                @click="copyText(templateTask, '任务模板已复制')">复制任务模板</el-button>
            </div>
            <pre class="manual-template-code">{{ templateTask || "模板加载中..." }}</pre>
          </el-tab-pane>
          <el-tab-pane label="导入结果模板" name="result">
            <div class="manual-template-toolbar">
              <span>第三方AI必须返回此结构；taskId必须替换为当前批次编码。</span>
              <el-button size="mini" type="success" plain icon="el-icon-copy-document" :disabled="!templateResult"
                @click="copyText(templateResult, '结果模板已复制')">复制结果模板</el-button>
            </div>
            <pre class="manual-template-code">{{ templateResult || "模板加载中..." }}</pre>
          </el-tab-pane>
          <el-tab-pane label="第三方AI提示词" name="prompt">
            <div class="manual-prompt-grid">
              <div class="manual-prompt-card">
                <div class="manual-prompt-head">
                  <div>
                    <strong>处理提示词</strong>
                    <span>完整提示词已内嵌在导出任务的exportPrompt字段，也可在此单独复制。</span>
                  </div>
                  <el-button size="mini" type="warning" plain icon="el-icon-copy-document"
                    :disabled="!templateExportPrompt" @click="copyPrompt('export')">复制处理提示词</el-button>
                </div>
                <pre class="manual-template-code manual-prompt-code">{{ templateExportPrompt || "提示词加载中..." }}</pre>
              </div>
              <div class="manual-prompt-card">
                <div class="manual-prompt-head">
                  <div>
                    <strong>修复提示词</strong>
                    <span>导入前发现格式偏差时，用它在外部AI中只修复结构。</span>
                  </div>
                  <el-button size="mini" type="success" plain icon="el-icon-copy-document"
                    :disabled="!templateImportPrompt" @click="copyPrompt('import')">复制修复提示词</el-button>
                </div>
                <pre class="manual-template-code manual-prompt-code">{{ templateImportPrompt || "提示词加载中..." }}</pre>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="templateVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { checkPermi } from "@/utils/common/permission";
import { getManualTask, getManualTemplate, importManualResult } from "@/api/fx67ll/dortmund/returnCombination";
import { DORTMUND_MANUAL_AI_CONFIG } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

const SCHEMA_VERSION = DORTMUND_MANUAL_AI_CONFIG.schemaVersion;
const TASK_TYPE = DORTMUND_MANUAL_AI_CONFIG.taskType;
const MAX_RESPONSE_BYTES = DORTMUND_MANUAL_AI_CONFIG.maxResponseBytes;
const MAX_CANDIDATES = DORTMUND_MANUAL_AI_CONFIG.maxCandidates;
const MAX_TOTAL_CANDIDATES = DORTMUND_MANUAL_AI_CONFIG.maxTotalCandidates;
const MAX_SELECTIONS = DORTMUND_MANUAL_AI_CONFIG.maxSelections;
const SELECTION_TYPES = DORTMUND_MANUAL_AI_CONFIG.selectionTypes;
const STEP_TITLES = ["导出任务", "外部AI处理", "导入结果"];
const DEFAULT_STEPS = [
  "导出当前批次处理任务；业务快照已冻结，页面刷新后仍可重新导出。",
  "把任务JSON交给第三方AI，完整处理提示词已内嵌在exportPrompt字段；中间检索和推理由外部AI完成。",
  "只把1.0标准JSON导入系统；后端重新校验、复算、去重并落库。",
];

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function normalizeText(value) {
  return isBlank(value) ? "" : String(value).trim();
}

export default {
  name: "ManualAiTaskPanel",
  props: {
    generationId: {
      type: [Number, String],
      default: null,
    },
    generationCode: {
      type: String,
      default: "",
    },
    generationStatus: {
      type: [Number, String],
      default: null,
    },
    resultSource: {
      type: String,
      default: "",
    },
    generatedCount: {
      type: [Number, String],
      default: 0,
    },
  },
  data() {
    return {
      taskLoading: false,
      importVisible: false,
      importLoading: false,
      responseContent: "",
      importMode: "REPLACE",
      importError: "",
      previewReady: false,
      previewTaskId: "",
      candidateCount: 0,
      previewCandidates: [],
      templateVisible: false,
      templateLoading: false,
      templateLoaded: false,
      templatePromise: null,
      templateTab: "task-fields",
      templateInstruction: "",
      templateTask: "",
      templateResult: "",
      templateExportPrompt: "",
      templateImportPrompt: "",
      workflowSteps: DEFAULT_STEPS.slice(),
      taskFields: [],
      resultFields: [],
    };
  },
  computed: {
    maxResponseSizeText() {
      return `${Math.round(MAX_RESPONSE_BYTES / 1024 / 1024)} MiB`;
    },
    maxTotalCandidates() {
      return MAX_TOTAL_CANDIDATES;
    },
    isManualPending() {
      return String(this.generationStatus) === "3";
    },
    isManualCompleted() {
      return String(this.generationStatus) === "1" && String(this.resultSource) === "M";
    },
    existingCount() {
      const count = Number(this.generatedCount);
      return Number.isFinite(count) && count > 0 ? count : 0;
    },
    panelTitle() {
      if (this.isManualCompleted) return "人工AI结果复核与重复导入";
      return this.isManualPending ? "人工AI任务处理" : "自动AI失败批次兼容处理";
    },
    panelSubtitle() {
      if (this.isManualCompleted) {
        return "可保留现有候选追加其他AI结论，也可在未进入采用/方案/图片流程时覆盖重导";
      }
      return this.isManualPending
        ? "任务已冻结业务快照，导出后交给第三方AI并按标准契约回填"
        : "该批次属于自动AI最终失败的历史兼容分支，可复用原快照转人工处理";
    },
    panelNote() {
      return "人工模式不执行平台内证据检索，沿用1.0结构化输入输出契约；第三方AI必须主动补充最新真实信息，不得把球队标签当作完整档案。导入后重新执行候选校验、签名去重、金额复算和落库。";
    },
    visible() {
      return Boolean(this.generationId)
        && (["2", "3"].includes(String(this.generationStatus)) || this.isManualCompleted)
        && checkPermi(["dortmund:return:generate"]);
    },
    stepTitles() {
      return STEP_TITLES;
    },
  },
  methods: {
    handleExportTask() {
      if (!this.generationId) return;
      this.taskLoading = true;
      getManualTask(this.generationId).then((response) => {
        const task = (response && response.data) || {};
        if (!task.taskId || !task.responseContract || !task.exportPrompt
          || (this.generationCode && task.taskId !== this.generationCode)) {
          throw new Error("manual-task-invalid");
        }
        const content = JSON.stringify(task, null, 2);
        const blob = new Blob([content], { type: "application/json;charset=utf-8" });
        this.$download.saveAs(blob, `dortmund-return-manual-task-${this.generationId}.json`);
        this.$modal.msgSuccess("人工AI任务已导出，完整处理提示词已内嵌，可直接交给第三方AI");
      }).catch(() => {
        this.$modal.msgError("人工AI任务导出失败，请刷新批次后重试");
      }).finally(() => {
        this.taskLoading = false;
      });
    },
    openImportDialog() {
      this.importMode = this.isManualCompleted && this.existingCount > 0 ? "APPEND" : "REPLACE";
      this.importVisible = true;
      this.importError = "";
      this.previewReady = false;
      this.previewCandidates = [];
    },
    openTemplateTab(tab) {
      this.templateVisible = true;
      this.templateTab = tab;
      this.ensureTemplate();
    },
    ensureTemplate() {
      if (this.templateLoaded) {
        return Promise.resolve();
      }
      if (this.templatePromise) {
        return this.templatePromise;
      }
      this.templateLoading = true;
      this.templatePromise = getManualTemplate().then((response) => {
        const template = (response && response.data) || {};
        this.templateInstruction = template.instruction || "";
        this.templateTask = this.formatTemplateJson(template.taskTemplate);
        this.templateResult = this.formatTemplateJson(template.resultTemplate);
        this.templateExportPrompt = template.exportPrompt || "";
        this.templateImportPrompt = template.importPrompt || "";
        this.taskFields = Array.isArray(template.taskFields) ? template.taskFields : [];
        this.resultFields = Array.isArray(template.resultFields) ? template.resultFields : [];
        if (Array.isArray(template.workflowSteps) && template.workflowSteps.length) {
          this.workflowSteps = template.workflowSteps;
        }
        this.templateLoaded = true;
      }).catch(() => {
        this.templateTask = "";
        this.templateResult = "";
        this.templateExportPrompt = "";
        this.templateImportPrompt = "";
        this.taskFields = [];
        this.resultFields = [];
        this.$modal.msgError("标准模板加载失败，请刷新后重试");
      }).finally(() => {
        this.templateLoading = false;
        this.templatePromise = null;
      });
      return this.templatePromise;
    },
    formatTemplateJson(content) {
      if (!content) return "";
      try {
        return JSON.stringify(typeof content === "string" ? JSON.parse(content) : content, null, 2);
      } catch (error) {
        return String(content);
      }
    },
    copyText(content, successMessage) {
      if (!content) return;
      const message = successMessage || "内容已复制";
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
          this.$modal.msgSuccess(message);
        }).catch(() => this.fallbackCopyText(content, message));
        return;
      }
      this.fallbackCopyText(content, message);
    },
    fallbackCopyText(content, successMessage) {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        this.$modal.msgSuccess(successMessage);
      } catch (error) {
        this.$modal.msgError("复制失败，请手动选择文本");
      } finally {
        document.body.removeChild(textarea);
      }
    },
    copyFieldGuide(type) {
      const fields = type === "task" ? this.taskFields : this.resultFields;
      if (!fields.length) return;
      const title = type === "task" ? "回报组合人工AI导出任务字段说明" : "回报组合人工AI导入结果字段说明";
      const lines = [title, ""];
      fields.forEach((field) => {
        lines.push(`- ${field.path}（${field.label}，${field.type}${field.required ? "，必填" : "，可选"}）：${field.description}`);
        if (field.example) {
          lines.push(`  示例：${field.example}`);
        }
      });
      this.copyText(lines.join("\n"), "字段说明已复制");
    },
    copyPrompt(type) {
      this.ensureTemplate().then(() => {
        const content = type === "import" ? this.templateImportPrompt : this.templateExportPrompt;
        if (!content) {
          this.$modal.msgWarning("提示词尚未加载，请稍后重试");
          return;
        }
        this.copyText(content, type === "import" ? "修复提示词已复制" : "处理提示词已复制");
      });
    },
    handleFileChange(file) {
      const rawFile = file && file.raw;
      if (!rawFile) return;
      if (rawFile.size > MAX_RESPONSE_BYTES) {
        this.importError = `文件超过 ${this.maxResponseSizeText} 上限，请压缩后重新选择`;
        this.previewReady = false;
        this.previewCandidates = [];
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.responseContent = String(reader.result || "");
        this.refreshPreview();
      };
      reader.onerror = () => {
        this.importError = "文件读取失败，请重新选择";
        this.previewReady = false;
        this.previewCandidates = [];
      };
      reader.readAsText(rawFile, "UTF-8");
    },
    handleClear() {
      this.resetImportState();
    },
    resetImportState() {
      this.responseContent = "";
      this.importError = "";
      this.previewReady = false;
      this.previewTaskId = "";
      this.candidateCount = 0;
      this.previewCandidates = [];
    },
    refreshPreview() {
      this.previewReady = false;
      this.importError = "";
      this.candidateCount = 0;
      this.previewTaskId = "";
      this.previewCandidates = [];
      const content = String(this.responseContent || "");
      const raw = content.trim();
      if (!raw) return;
      if (new Blob([content]).size > MAX_RESPONSE_BYTES) {
        this.importError = `正文超过 ${this.maxResponseSizeText} 上限，请压缩后重新导入`;
        return;
      }
      let payload;
      try {
        payload = JSON.parse(this.normalizeJson(raw));
      } catch (error) {
        this.importError = "JSON 解析失败，请确认第三方AI只返回一个完整JSON对象";
        return;
      }
      const validationError = this.validatePayload(payload);
      if (validationError) {
        this.importError = validationError;
        return;
      }
      this.candidateCount = payload.candidates.length;
      this.previewTaskId = payload.taskId;
      this.previewCandidates = payload.candidates.map((candidate) => ({
        title: normalizeText(candidate.title),
        selectionCount: candidate.selections.length,
        selectionSummary: candidate.selections
          .map((selection) => `${selection.matchId}/${selection.selectionType}`)
          .join("、"),
        confidence: candidate.confidence == null ? null : candidate.confidence,
        riskNotes: normalizeText(candidate.riskNotes),
      }));
      this.previewReady = true;
    },
    validatePayload(payload) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return "返回值必须为JSON对象";
      }
      if (payload.schemaVersion !== SCHEMA_VERSION) {
        return `schemaVersion 必须为 ${SCHEMA_VERSION}`;
      }
      if (payload.taskType !== TASK_TYPE) {
        return "taskType 与回报组合人工任务不匹配";
      }
      if (this.generationCode && payload.taskId !== this.generationCode) {
        return "taskId 与当前人工处理批次不一致";
      }
      if (isBlank(payload.analysisContent)) {
        return "缺少 analysisContent";
      }
      if (!Array.isArray(payload.candidates) || !payload.candidates.length) {
        return `candidates 必须为1至${MAX_CANDIDATES}条`;
      }
      if (payload.candidates.length > MAX_CANDIDATES) {
        return `candidates 超过${MAX_CANDIDATES}条上限`;
      }
      for (let index = 0; index < payload.candidates.length; index += 1) {
        const candidate = payload.candidates[index];
        const prefix = `第${index + 1}条候选`;
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          return `${prefix}必须为JSON对象`;
        }
        if (isBlank(candidate.title)) {
          return `${prefix}缺少 title`;
        }
        if (isBlank(candidate.reason)) {
          return `${prefix}缺少 reason`;
        }
        if (candidate.confidence != null) {
          const confidence = Number(candidate.confidence);
          if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
            return `${prefix}的 confidence 必须为0至100整数`;
          }
        }
        if (candidate.riskNotes != null && typeof candidate.riskNotes !== "string") {
          return `${prefix}的 riskNotes 必须为字符串`;
        }
        if (!Array.isArray(candidate.selections) || !candidate.selections.length
          || candidate.selections.length > MAX_SELECTIONS) {
          return `${prefix}的 selections 必须为1至${MAX_SELECTIONS}条`;
        }
        const matchIds = new Set();
        for (let selectionIndex = 0; selectionIndex < candidate.selections.length; selectionIndex += 1) {
          const selection = candidate.selections[selectionIndex];
          const selectionPrefix = `${prefix}第${selectionIndex + 1}个选择`;
          if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
            return `${selectionPrefix}必须为JSON对象`;
          }
          const matchId = Number(selection.matchId);
          if (!Number.isInteger(matchId) || matchId <= 0) {
            return `${selectionPrefix}的 matchId 必须为正整数`;
          }
          if (matchIds.has(matchId)) {
            return `${prefix}内 matchId 不得重复`;
          }
          matchIds.add(matchId);
          if (!SELECTION_TYPES.includes(selection.selectionType)) {
            return `${selectionPrefix}的 selectionType 仅支持 ${SELECTION_TYPES.join("、")}`;
          }
          const weightText = String(selection.appliedWeight);
          if (!/^(0(\.\d{1,4})?|1(\.0{1,4})?)$/.test(weightText)) {
            return `${selectionPrefix}的 appliedWeight 必须为0至1且最多四位小数`;
          }
          if (isBlank(selection.reason)) {
            return `${selectionPrefix}缺少 reason`;
          }
        }
      }
      return "";
    },
    formatImportMode(value) {
      return value === "APPEND" ? "追加合并" : "覆盖重导";
    },
    normalizeJson(content) {
      let value = String(content || "").trim();
      if (!value.startsWith("```")) {
        return value;
      }
      const lineBreak = String.fromCharCode(10);
      const firstBreak = value.indexOf(lineBreak);
      const lastFence = value.lastIndexOf("```");
      if (firstBreak > 0 && lastFence > firstBreak) {
        value = value.substring(firstBreak + 1, lastFence).trim();
      }
      return value;
    },
    handleImport() {
      if (!this.generationId) return;
      this.refreshPreview();
      if (this.importError || !this.previewReady) return;
      this.importLoading = true;
      importManualResult(this.generationId, this.responseContent, this.importMode).then((response) => {
        const result = (response && response.data) || {};
        this.importVisible = false;
        const duplicateText = Number(result.duplicateCount) > 0
          ? `，跳过重复 ${result.duplicateCount} 条` : "";
        this.$modal.msgSuccess(`人工结果${this.formatImportMode(result.importMode || this.importMode)}成功：`
          + `新增 ${result.importedCount != null ? result.importedCount : (result.generatedCount || 0)} 条${duplicateText}，`
          + `批次共 ${result.totalCount || 0} 条`);
        this.$emit("imported", result);
      }).catch(() => {
        // 服务端已返回受控校验错误，保留输入便于修正后重试。
      }).finally(() => {
        this.importLoading = false;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.manual-ai-task-panel {
  margin: 14px 0 4px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #fffdf7 0%, #fff8e8 100%);
  border: 1px solid #f1dfb7;
  border-radius: 14px;
}

.manual-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.manual-heading {
  display: flex;
  align-items: center;
  min-width: 0;

  strong {
    display: block;
    margin-bottom: 3px;
    font-size: 14px;
    color: #5b4517;
  }

  span {
    display: block;
    font-size: 12px;
    line-height: 1.5;
    color: #8b7442;
  }
}

.manual-icon {
  display: grid;
  place-items: center;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  margin-right: 11px;
  color: #fff;
  background: linear-gradient(135deg, #d9a441, #c78624);
  border-radius: 11px;
  box-shadow: 0 7px 16px rgba(199, 134, 36, 0.22);
}

.manual-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;

  .el-button+.el-button {
    margin-left: 0;
  }
}

.manual-workflow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.manual-step {
  position: relative;
  display: flex;
  align-items: flex-start;
  min-width: 0;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid #f0e2c2;
  border-radius: 10px;
}

.manual-step-index {
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  margin-right: 9px;
  font-size: 12px;
  font-weight: 700;
  color: #8a5a11;
  background: #ffe9b9;
  border-radius: 50%;
}

.manual-step-copy {
  min-width: 0;

  strong {
    display: block;
    margin-bottom: 3px;
    font-size: 12px;
    color: #6a4b12;
  }

  span {
    display: block;
    font-size: 11px;
    line-height: 1.55;
    color: #8e7950;
  }
}

.manual-note {
  display: flex;
  align-items: flex-start;
  margin-top: 12px;
  padding-top: 11px;
  font-size: 12px;
  line-height: 1.55;
  color: #806b3e;
  border-top: 1px dashed #eeddb8;

  i {
    margin: 2px 7px 0 0;
  }
}

.manual-mode-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px 10px;
  padding: 10px 12px;
  margin-bottom: 11px;
  font-size: 12px;
  background: #fbfdfc;
  border: 1px solid #e2eee7;
  border-radius: 10px;

  small {
    flex-basis: 100%;
    padding-left: 67px;
    font-size: 11px;
    line-height: 1.5;
    color: #8b9a92;
  }
}

.manual-mode-label {
  color: #52615a;
  font-weight: 600;
}

.manual-mode-row ::v-deep .el-radio-button__orig-radio:checked+.el-radio-button__inner {
  background-color: #2ecc71;
  border-color: #2ecc71;
  box-shadow: -1px 0 0 0 #2ecc71;
}

.manual-mode-row ::v-deep .el-radio-button__inner:hover {
  color: #27ad60;
}

.manual-dialog-body {
  padding-top: 2px;
}

.manual-contract {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 10px 13px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #44604f;
  background: #f4fbf7;
  border: 1px solid #e0eee6;
  border-radius: 10px;

  label {
    margin-right: 5px;
    color: #82928a;
  }
}

.manual-import-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #82928a;

  .el-button--text {
    padding: 4px 2px;
  }
}

.manual-guidance {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #7d693a;

  i {
    margin: 3px 7px 0 0;
    color: #d49c33;
  }
}

.manual-upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #8b9a93;

  .el-button--text {
    margin-left: auto;
  }
}

.manual-error,
.manual-preview {
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;

  i {
    margin: 2px 7px 0 0;
  }
}

.manual-error {
  color: #d9534f;
}

.manual-preview {
  color: #23995b;
}

.manual-preview-list {
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid #e3eee8;
  border-radius: 10px;
}

.manual-preview-item {
  display: flex;
  align-items: flex-start;
  padding: 9px 12px;
  background: #f8fcfa;

  &+& {
    border-top: 1px solid #edf4f0;
  }
}

.manual-preview-index {
  display: grid;
  place-items: center;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  margin-right: 9px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #54b985;
  border-radius: 50%;
}

.manual-preview-copy {
  min-width: 0;

  strong {
    display: block;
    margin-bottom: 2px;
    font-size: 12px;
    color: #335344;
  }

  span {
    display: block;
    font-size: 11px;
    line-height: 1.5;
    color: #83958c;
  }

  .manual-preview-risk {
    color: #b1792d;
  }
}

.manual-template-body {
  min-height: 260px;
}

.manual-template-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.55;
  color: #7d8b84;
}

.manual-field-table {
  width: 100%;

  ::v-deep .el-table__body-wrapper {
    overflow-x: auto;
  }

  ::v-deep th,
  ::v-deep td {
    padding: 6px 0;
  }
}

.manual-template-code {
  max-height: 380px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
  color: #33463d;
  background: #f7faf8;
  border: 1px solid #e2ece6;
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-all;
}

.manual-prompt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.manual-prompt-card {
  min-width: 0;
  padding: 12px;
  background: #fffdf8;
  border: 1px solid #eee1c7;
  border-radius: 12px;
}

.manual-prompt-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;

  strong {
    display: block;
    margin-bottom: 3px;
    font-size: 13px;
    color: #5b4517;
  }

  span {
    display: block;
    font-size: 11px;
    line-height: 1.5;
    color: #8b7442;
  }
}

.manual-prompt-code {
  max-height: 330px;
  background: #fff;
}

.manual-dialog-body ::v-deep .el-textarea__inner {
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
  background: #fbfdfc;
}

@media screen and (max-width: 900px) {
  .manual-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .manual-actions {
    justify-content: flex-start;
    width: 100%;
  }

  .manual-workflow {
    grid-template-columns: 1fr;
  }

  .manual-prompt-grid {
    grid-template-columns: 1fr;
  }
}
</style>
