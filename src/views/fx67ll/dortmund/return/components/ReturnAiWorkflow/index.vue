<template>
  <div class="return-ai-workflow">
    <div class="wf-overview">
      <div class="wf-overview-copy">
        <strong>AI分析工作流</strong>
        <span>{{ overviewText }}</span>
      </div>
      <div class="wf-chips">
        <span v-for="chip in summaryChips" :key="chip.label" class="wf-chip" :class="chip.tone">
          <label>{{ chip.label }}</label>
          <b>{{ chip.value }}</b>
        </span>
      </div>
    </div>

    <div class="wf-flow">
      <div v-for="(node, index) in workflowNodes" :key="'node-' + index" class="wf-flow-item">
        <div class="wf-node" :class="'is-' + node.state">
          <div class="wf-node-head">
            <span class="wf-node-index">{{ index + 1 }}</span>
            <i :class="node.icon"></i>
            <span class="wf-node-state">{{ node.stateLabel }}</span>
          </div>
          <strong>{{ node.title }}</strong>
          <p>{{ node.description }}</p>
          <div v-if="node.meta" class="wf-node-meta">{{ node.meta }}</div>
        </div>
        <div v-if="index < workflowNodes.length - 1" class="wf-arrow" :class="'is-' + workflowNodes[index + 1].state">
          <i class="el-icon-right"></i>
        </div>
      </div>
    </div>

    <div v-if="diagnostics.length" class="wf-diagnostics">
      <div v-for="(item, index) in diagnostics" :key="index" class="wf-diagnostic" :class="'is-' + item.level">
        <i :class="item.icon"></i>
        <span>{{ item.text }}</span>
      </div>
    </div>

    <div v-if="coverageRows.length" class="wf-section wf-coverage">
      <div class="wf-section-head">
        <strong>逐场证据覆盖</strong>
        <span>对照规划查询、已提交证据、检索证据和候选使用次数，定位输入缺口或异常偏置。</span>
      </div>
      <el-table :data="coverageRows" size="mini" border max-height="320" class="wf-coverage-table"
        empty-text="暂无比赛覆盖数据">
        <el-table-column label="比赛" prop="matchLabel" min-width="190" show-overflow-tooltip />
        <el-table-column label="球队标签" prop="teamTags" min-width="170" show-overflow-tooltip />
        <el-table-column label="规划查询" width="92" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.plannedQueries ? 'success' : 'info'" size="mini">
              {{ scope.row.plannedQueries }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已提交证据" prop="suppliedEvidence" width="104" align="center" />
        <el-table-column label="检索证据" prop="retrievedEvidence" width="92" align="center" />
        <el-table-column label="候选使用" width="92" align="center">
          <template slot-scope="scope">
            <span :class="{ 'wf-usage-hot': scope.row.candidateUsage > 0 }">{{ scope.row.candidateUsage }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规划目的" prop="queryPurpose" min-width="220" show-overflow-tooltip />
      </el-table>
    </div>

    <div v-if="canViewRaw && rawSections.length" class="wf-section wf-raw">
      <div class="wf-section-head">
        <strong>技术快照</strong>
        <span>展开查看规划、输入、调用审计和标准化结果原文；仅用于排查异常或偏置。</span>
      </div>
      <el-collapse v-model="openRawSections">
        <el-collapse-item v-for="section in rawSections" :key="section.name" :name="section.name">
          <template slot="title">
            <i class="el-icon-document"></i>
            <span class="wf-raw-title">{{ section.label }}</span>
            <span class="wf-raw-size">{{ section.sizeLabel }}</span>
          </template>
          <pre class="wf-raw-code">{{ section.content }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div v-else-if="!canViewRaw" class="wf-permission-note">
      <i class="el-icon-lock"></i>
      <span>原始AI快照与详细推理受 dortmund:return:remark:query 权限控制。</span>
    </div>
  </div>
</template>

<script>
const STATE_LABELS = {
  success: "已完成",
  error: "失败",
  running: "进行中",
  waiting: "待处理",
  pending: "未开始",
  na: "不适用",
};

const EVIDENCE_STATUS_LABELS = {
  N: "N 不适用",
  P: "P 规划/检索中",
  R: "R 检索完成",
  S: "S 证据已固化",
  F: "F 失败",
};

const GENERATION_STATUS_LABELS = {
  "0": "排队/分析中",
  "1": "已完成",
  "2": "失败",
  "3": "待人工导入",
};

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    const parsed = JSON.parse(String(value));
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (error) {
    return fallback;
  }
}

export default {
  name: "ReturnAiWorkflow",
  props: {
    generation: {
      type: Object,
      default: () => ({}),
    },
    canViewRaw: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      openRawSections: [],
    };
  },
  computed: {
    mode() {
      return String(this.generation.generationMode || "");
    },
    isAutoMode() {
      return this.mode === "A";
    },
    isManualSource() {
      return String(this.generation.resultSource || "") === "M";
    },
    generationStatus() {
      return String(this.generation.generationStatus || "");
    },
    generationStatusLabel() {
      return GENERATION_STATUS_LABELS[this.generationStatus] || "未知状态";
    },
    evidenceStatus() {
      return String(this.generation.aiEvidenceStatus || "N");
    },
    evidenceStatusLabel() {
      return EVIDENCE_STATUS_LABELS[this.evidenceStatus] || this.evidenceStatus || "-";
    },
    evidencePlan() {
      return parseJson(this.generation.aiEvidencePlan, {}) || {};
    },
    planInput() {
      return parseJson(this.generation.aiPlanInputSnapshot, {}) || {};
    },
    analysisInput() {
      return parseJson(this.generation.aiAnalysisInputSnapshot, {}) || {};
    },
    resultSnapshot() {
      return parseJson(this.generation.aiResultSnapshot, {}) || {};
    },
    callRefs() {
      const value = parseJson(this.generation.aiCallRefs, []);
      return Array.isArray(value) ? value : [];
    },
    planQueries() {
      return Array.isArray(this.evidencePlan.queries) ? this.evidencePlan.queries : [];
    },
    businessContext() {
      return this.analysisInput.businessContext || this.planInput.businessContext || {};
    },
    matches() {
      return Array.isArray(this.businessContext.matches) ? this.businessContext.matches : [];
    },
    suppliedEvidence() {
      return Array.isArray(this.analysisInput.evidenceCatalog) ? this.analysisInput.evidenceCatalog : [];
    },
    retrievedEvidence() {
      return Array.isArray(this.analysisInput.retrievedEvidence) ? this.analysisInput.retrievedEvidence : [];
    },
    resultCandidates() {
      return Array.isArray(this.resultSnapshot.candidates) ? this.resultSnapshot.candidates : [];
    },
    planCall() {
      return this.callRefs.find((item) => item && item.operation === "PLAN") || null;
    },
    analyzeCall() {
      return this.callRefs.find((item) => item && item.operation === "ANALYZE") || null;
    },
    totalDurationMillis() {
      return this.callRefs.reduce((total, item) => total + Number((item && item.durationMillis) || 0), 0);
    },
    summaryChips() {
      return [
        { label: "模式", value: this.mode === "A" ? "A AI辅助" : this.mode === "S" ? "S 主观" : "-", tone: "cyan" },
        { label: "来源", value: this.isManualSource ? "人工AI导入" : this.generation.resultSource === "A" ? "自动AI" : "-", tone: this.isManualSource ? "amber" : "green" },
        { label: "场景", value: this.generation.aiSceneCode || "-", tone: "plain" },
        { label: "契约", value: this.generation.aiContractVersion || "-", tone: "plain" },
        { label: "数据截止", value: this.formatDateTime(this.generation.dataAsOf), tone: "plain" },
        { label: "证据流程", value: this.evidenceStatusLabel, tone: this.evidenceStatus === "F" ? "red" : this.evidenceStatus === "S" ? "green" : "plain" },
      ];
    },
    overviewText() {
      if (this.isManualSource) {
        return `人工AI批次：平台冻结业务快照并导出任务，外部AI完成分析；导入后由平台重新校验、复算、去重并落库。当前状态：${this.generationStatusLabel}。`;
      }
      if (this.isAutoMode) {
        return `自动AI批次：证据规划 → 受控检索与证据冻结 → 最终分析 → 校验复算。可核对每场查询和证据覆盖，定位异常或偏置来源。当前状态：${this.generationStatusLabel}。`;
      }
      return `主观模式批次：不执行平台证据规划与检索，AI在冻结输入和已提交证据上完成分析；平台仍负责校验、复算和落库。当前状态：${this.generationStatusLabel}。`;
    },
    workflowNodes() {
      const auto = this.isAutoMode;
      const failed = this.generationStatus === "2";
      const completed = this.generationStatus === "1";
      const pendingManual = this.generationStatus === "3";
      const planReady = Boolean(this.generation.aiEvidencePlan) && this.planQueries.length > 0;
      const retrievalReady = ["R", "S"].includes(this.evidenceStatus) || this.retrievedEvidence.length > 0;
      const analysisReady = this.resultCandidates.length > 0 || completed;

      let planState = "na";
      let planDescription = "主观模式与人工模式不执行平台证据规划。";
      if (auto) {
        planDescription = "AI根据冻结业务输入识别信息缺口，输出有界检索计划。";
        if (failed && !planReady) {
          planState = "error";
          planDescription = "自动AI在证据规划阶段失败，未形成可用计划。";
        } else if (planReady) {
          planState = "success";
          planDescription = `已生成 ${this.planQueries.length} 条逐场查询计划。`;
        } else if (this.evidenceStatus === "P") {
          planState = "running";
        } else if (failed) {
          planState = "error";
        } else {
          planState = "pending";
        }
      }

      let retrievalState = "na";
      let retrievalDescription = "未触发平台内证据检索。";
      if (auto) {
        retrievalDescription = "按计划执行受控检索、清洗去重、来源分层和证据冻结。";
        if (this.evidenceStatus === "F") {
          retrievalState = "error";
          retrievalDescription = "检索或证据冻结失败，自动AI批次不能继续最终分析。";
        } else if (this.evidenceStatus === "P") {
          retrievalState = "running";
        } else if (retrievalReady) {
          retrievalState = "success";
          retrievalDescription = `已冻结 ${this.retrievedEvidence.length} 条检索证据。`;
        } else if (failed) {
          retrievalState = "error";
        } else {
          retrievalState = "pending";
        }
      }

      let analysisState = "pending";
      let analysisDescription = "等待最终AI分析。";
      if (this.isManualSource) {
        analysisDescription = "分析由第三方AI在平台外完成，系统只接收标准化结果。";
        if (analysisReady) {
          analysisState = "success";
          analysisDescription = `已导入 ${this.resultCandidates.length} 条候选结果。`;
        } else if (pendingManual) {
          analysisState = "waiting";
          analysisDescription = "等待第三方AI返回标准化结果并导入。";
        } else if (failed) {
          analysisState = "error";
        }
      } else if (failed) {
        analysisState = "error";
        analysisDescription = "最终AI分析未完成或结果未通过校验。";
      } else if (analysisReady) {
        analysisState = "success";
        analysisDescription = `已生成 ${this.resultCandidates.length} 条候选组合。`;
      } else if (this.generationStatus === "0") {
        analysisState = "running";
        analysisDescription = "批次已受理，后台正在执行最终分析。";
      }

      let persistenceState = "pending";
      let persistenceDescription = "等待候选校验、金额复算、去重和事务落库。";
      if (completed) {
        persistenceState = "success";
        persistenceDescription = `已落库 ${this.generation.generatedCount || 0} 条回报组合。`;
      } else if (failed) {
        persistenceState = "error";
        persistenceDescription = this.generation.generationRemark || "批次失败，未产生可用组合。";
      } else if (pendingManual) {
        persistenceState = "waiting";
        persistenceDescription = "等待人工结果导入后执行校验与落库。";
      } else if (this.generationStatus === "0") {
        persistenceState = "running";
      }

      return [
        {
          title: "任务受理与快照冻结",
          description: "校验业务条件并冻结比赛、赔率、目标和信息点，后续调用只使用该快照。",
          state: this.generation.generationId ? "success" : "pending",
          icon: "el-icon-document-checked",
          meta: `${this.generation.generationCode || "-"} · ${this.generationStatusLabel}`,
        },
        {
          title: "证据规划",
          description: planDescription,
          state: planState,
          icon: "el-icon-map-location",
          meta: this.buildNodeMeta(this.planCall, this.generation.aiPlanRunRef),
        },
        {
          title: "受控检索与证据冻结",
          description: retrievalDescription,
          state: retrievalState,
          icon: "el-icon-search",
          meta: auto ? `计划查询 ${this.planQueries.length} · 检索证据 ${this.retrievedEvidence.length}` : "",
        },
        {
          title: "最终AI分析",
          description: analysisDescription,
          state: analysisState,
          icon: "el-icon-cpu",
          meta: this.buildNodeMeta(this.analyzeCall, this.generation.aiAnalysisRunRef),
        },
        {
          title: "校验、复算与落库",
          description: persistenceDescription,
          state: persistenceState,
          icon: "el-icon-finished",
          meta: `候选 ${this.resultCandidates.length} · 组合 ${this.generation.generatedCount || 0}`,
        },
      ].map((node) => ({
        ...node,
        stateLabel: STATE_LABELS[node.state] || node.state,
      }));
    },
    missingPlanMatches() {
      if (!this.isAutoMode || !this.planQueries.length || !this.matches.length) {
        return [];
      }
      const plannedIds = new Set(this.planQueries.map((query) => String(query.matchId)));
      return this.matches.filter((match) => !plannedIds.has(String(match.matchId)));
    },
    diagnostics() {
      const items = [];
      const failed = this.generationStatus === "2";
      if (failed) {
        items.push({
          level: "error",
          icon: "el-icon-circle-close",
          text: this.generation.generationRemark || "批次失败，未返回业务错误摘要。",
        });
      }
      if (this.generation.aiEvidenceError) {
        items.push({
          level: "error",
          icon: "el-icon-warning-outline",
          text: `证据流程异常：${this.generation.aiEvidenceError}`,
        });
      }
      if (this.isAutoMode && !this.generation.aiEvidencePlan && this.generationStatus !== "0") {
        items.push({
          level: "warning",
          icon: "el-icon-warning-outline",
          text: "自动AI批次缺少证据规划快照：可能为历史版本，或在规划前即失败。",
        });
      }
      if (this.isAutoMode && !this.callRefs.length && this.generationStatus !== "0") {
        items.push({
          level: "warning",
          icon: "el-icon-warning-outline",
          text: "缺少规划/分析调用审计，无法核对调用耗时和超时配置。",
        });
      }
      if (this.isAutoMode && this.evidenceStatus === "S" && !this.retrievedEvidence.length) {
        items.push({
          level: "warning",
          icon: "el-icon-warning-outline",
          text: "证据状态为已固化，但最终分析输入中没有检索证据，请核对快照完整性。",
        });
      }
      if (this.missingPlanMatches.length) {
        items.push({
          level: "warning",
          icon: "el-icon-warning-outline",
          text: `以下比赛没有证据规划查询：${this.missingPlanMatches.map((match) => this.matchLabel(match)).join("、")}。`,
        });
      }
      if (this.generationStatus === "1" && !this.resultCandidates.length) {
        items.push({
          level: "warning",
          icon: "el-icon-warning-outline",
          text: "批次已完成，但标准化结果快照中没有候选；请核对历史数据或结果持久化。",
        });
      }
      if (this.generationStatus === "3") {
        items.push({
          level: "info",
          icon: "el-icon-info",
          text: "该批次等待人工导入第三方AI结果；导出任务在刷新后仍可重新获取。",
        });
      }
      if (this.isManualSource && !this.isManualSourceSnapshotComplete() && this.generationStatus === "1") {
        items.push({
          level: "info",
          icon: "el-icon-info",
          text: "人工批次未保存完整分析输入快照时，仅能按导入结果和组合明细复核。",
        });
      }
      const seen = new Set();
      return items.filter((item) => {
        const key = `${item.level}:${item.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    coverageRows() {
      const rows = new Map();
      const ensureRow = (matchId) => {
        const key = String(matchId == null ? "" : matchId);
        if (!rows.has(key)) {
          rows.set(key, {
            matchId,
            matchLabel: matchId == null ? "-" : `比赛 #${matchId}`,
            teamTags: "-",
            plannedQueries: 0,
            suppliedEvidence: 0,
            retrievedEvidence: 0,
            candidateUsage: 0,
            queryPurpose: "-",
            purposeList: [],
          });
        }
        return rows.get(key);
      };

      this.matches.forEach((match) => {
        const row = ensureRow(match.matchId);
        row.matchLabel = this.matchLabel(match);
        const homeTags = match.homeTeam && Array.isArray(match.homeTeam.teamTags) ? match.homeTeam.teamTags : [];
        const awayTags = match.awayTeam && Array.isArray(match.awayTeam.teamTags) ? match.awayTeam.teamTags : [];
        const tags = homeTags.concat(awayTags).filter(Boolean);
        row.teamTags = tags.length ? tags.join("、") : "-";
      });
      this.planQueries.forEach((query) => {
        const row = ensureRow(query.matchId);
        row.plannedQueries += 1;
        const purpose = query.purpose || query.query;
        if (purpose) {
          row.purposeList.push(String(purpose));
        }
      });
      this.suppliedEvidence.forEach((evidence) => {
        ensureRow(evidence.matchId).suppliedEvidence += 1;
      });
      this.retrievedEvidence.forEach((evidence) => {
        ensureRow(evidence.matchId).retrievedEvidence += 1;
      });
      this.resultCandidates.forEach((candidate) => {
        const selections = Array.isArray(candidate.selections) ? candidate.selections : [];
        selections.forEach((selection) => {
          ensureRow(selection.matchId).candidateUsage += 1;
        });
      });

      return Array.from(rows.values())
        .map((row) => ({
          ...row,
          queryPurpose: row.purposeList.length
            ? `${row.purposeList[0]}${row.purposeList.length > 1 ? ` 等${row.purposeList.length}条` : ""}`
            : "-",
        }))
        .sort((left, right) => Number(left.matchId || 0) - Number(right.matchId || 0));
    },
    rawSections() {
      const sections = [
        { name: "evidencePlan", label: "证据规划快照", value: this.generation.aiEvidencePlan },
        { name: "planInput", label: "规划输入快照", value: this.generation.aiPlanInputSnapshot },
        { name: "analysisInput", label: "最终分析输入快照", value: this.generation.aiAnalysisInputSnapshot },
        { name: "callRefs", label: "调用审计", value: this.generation.aiCallRefs },
        { name: "resultSnapshot", label: "标准化结果快照", value: this.generation.aiResultSnapshot },
      ];
      return sections
        .filter((section) => section.value !== null && section.value !== undefined && section.value !== "")
        .map((section) => {
          const content = this.prettyJson(section.value);
          return {
            name: section.name,
            label: section.label,
            content,
            sizeLabel: this.formatBytes(content),
          };
        });
    },
  },
  methods: {
    buildNodeMeta(call, runRef) {
      const parts = [];
      if (call && call.durationMillis != null) {
        parts.push(`耗时 ${this.formatDuration(call.durationMillis)}`);
      }
      if (runRef) {
        parts.push(`引用 ${runRef}`);
      }
      return parts.join(" · ");
    },
    isManualSourceSnapshotComplete() {
      return Boolean(this.generation.aiAnalysisInputSnapshot && this.generation.aiResultSnapshot);
    },
    matchLabel(match) {
      if (!match) return "-";
      const home = match.homeTeam && match.homeTeam.teamName ? match.homeTeam.teamName : "主队";
      const away = match.awayTeam && match.awayTeam.teamName ? match.awayTeam.teamName : "客队";
      return `${home} vs ${away} · #${match.matchId}`;
    },
    formatDuration(value) {
      const millis = Number(value);
      if (!Number.isFinite(millis) || millis < 0) return "-";
      return millis < 1000 ? `${millis} ms` : `${(millis / 1000).toFixed(1)} s`;
    },
    formatDateTime(value) {
      if (!value) return "-";
      if (typeof value === "string") {
        return value.replace("T", " ").slice(0, 19);
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const pad = (number) => String(number).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    prettyJson(value) {
      let text;
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        text = JSON.stringify(parsed, null, 2);
      } catch (error) {
        text = String(value);
      }
      if (text.length > 200000) {
        return `${text.slice(0, 200000)}\n...（快照过大，已截断显示）`;
      }
      return text;
    },
    formatBytes(content) {
      const size = new Blob([String(content || "")]).size;
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    },
  },
};
</script>

<style lang="scss" scoped>
.return-ai-workflow {
  width: 100%;
  min-width: 0;
}

.wf-overview {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.wf-overview-copy {
  min-width: 0;

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    color: #25332e;
  }

  span {
    display: block;
    font-size: 12px;
    line-height: 1.6;
    color: #75867e;
  }
}

.wf-chips {
  display: flex;
  flex: 0 0 48%;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.wf-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 4px 8px;
  font-size: 11px;
  color: #60736a;
  background: #f7faf8;
  border: 1px solid #e4ece7;
  border-radius: 999px;

  label {
    margin-right: 4px;
    color: #96a39c;
  }

  b {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.cyan {
    color: #287b86;
    background: #f2fbfc;
    border-color: #d8eef0;
  }

  &.green {
    color: #238b57;
    background: #f2fbf6;
    border-color: #d9eee2;
  }

  &.amber {
    color: #9a6a1f;
    background: #fffaf0;
    border-color: #f1e2c2;
  }

  &.red {
    color: #bd4d43;
    background: #fff6f5;
    border-color: #f2dcd8;
  }
}

.wf-flow {
  display: flex;
  align-items: stretch;
  width: 100%;
  padding: 2px 0 6px;
  overflow-x: auto;
}

.wf-flow-item {
  display: flex;
  flex: 1 1 0;
  align-items: stretch;
  min-width: 138px;
}

.wf-node {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  padding: 11px 12px 12px;
  background: #fbfdfc;
  border: 1px solid #e3ece7;
  border-top: 3px solid #c6d5cd;
  border-radius: 10px;

  strong {
    display: block;
    margin: 7px 0 4px;
    font-size: 12px;
    color: #30463c;
  }

  p {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    color: #7b8d84;
  }

  &.is-success {
    background: #f6fcf9;
    border-color: #d7ecdf;
    border-top-color: #49ad78;
  }

  &.is-error {
    background: #fff8f7;
    border-color: #f1d9d5;
    border-top-color: #d66358;
  }

  &.is-running {
    background: #f4fbfd;
    border-color: #d4eaf0;
    border-top-color: #3c9fb3;
    animation: wfPulse 1.8s ease-in-out infinite;
  }

  &.is-waiting {
    background: #fffaf0;
    border-color: #f1e2c2;
    border-top-color: #d7a340;
  }

  &.is-na,
  &.is-pending {
    background: #fafbfb;
    border-color: #e8edeb;
  }
}

.wf-node-head {
  display: flex;
  align-items: center;
  gap: 5px;

  >i {
    font-size: 13px;
    color: #7f9489;
  }
}

.wf-node-index {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #a4b6ac;
  border-radius: 50%;
}

.is-success .wf-node-index {
  background: #49ad78;
}

.is-error .wf-node-index {
  background: #d66358;
}

.is-running .wf-node-index {
  background: #3c9fb3;
}

.is-waiting .wf-node-index {
  background: #d7a340;
}

.wf-node-state {
  margin-left: auto;
  font-size: 10px;
  color: #8b9b93;
}

.wf-node-meta {
  margin-top: 8px;
  overflow: hidden;
  font-size: 10px;
  color: #8b9b93;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wf-arrow {
  display: grid;
  flex: 0 0 20px;
  place-items: center;
  color: #b4c3bb;

  i {
    font-size: 12px;
  }

  &.is-success {
    color: #49ad78;
  }

  &.is-error {
    color: #d66358;
  }

  &.is-running {
    color: #3c9fb3;
  }

  &.is-waiting {
    color: #d7a340;
  }
}

.wf-diagnostics {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}

.wf-diagnostic {
  display: flex;
  align-items: flex-start;
  padding: 8px 11px;
  font-size: 12px;
  line-height: 1.55;
  border: 1px solid transparent;
  border-radius: 8px;

  i {
    margin: 2px 7px 0 0;
  }

  &.is-error {
    color: #b34f45;
    background: #fff7f6;
    border-color: #f2dcd8;
  }

  &.is-warning {
    color: #9a6a1f;
    background: #fffaf0;
    border-color: #f1e2c2;
  }

  &.is-info {
    color: #3c7f90;
    background: #f4fbfd;
    border-color: #d9edf1;
  }
}

.wf-section {
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px dashed #e2ebe6;
}

.wf-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;

  strong {
    font-size: 13px;
    color: #30463c;
  }

  span {
    font-size: 11px;
    line-height: 1.5;
    color: #8b9b93;
    text-align: right;
  }
}

.wf-coverage-table {
  width: 100%;

  ::v-deep .el-table__body-wrapper {
    overflow-x: auto;
  }
}

.wf-usage-hot {
  color: #238b57;
  font-weight: 700;
}

.wf-raw {
  ::v-deep .el-collapse {
    border-color: #e4ece7;
  }

  ::v-deep .el-collapse-item__header {
    height: 38px;
    padding: 0 10px;
    font-size: 12px;
    color: #4d6257;
    background: #f8fbf9;
    border-color: #e4ece7;
  }

  ::v-deep .el-collapse-item__wrap {
    border-color: #e4ece7;
  }

  ::v-deep .el-collapse-item__content {
    padding: 10px;
  }
}

.wf-raw-title {
  margin-left: 6px;
  font-size: 12px;
  color: #4d6257;
}

.wf-raw-size {
  margin-left: 8px;
  font-size: 10px;
  color: #9aa9a1;
}

.wf-raw-code {
  max-height: 340px;
  padding: 10px;
  margin: 0;
  overflow: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 11px;
  line-height: 1.55;
  color: #3c5147;
  background: #fff;
  border: 1px solid #e7efea;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

.wf-permission-note {
  display: flex;
  align-items: flex-start;
  margin-top: 13px;
  padding: 9px 11px;
  font-size: 12px;
  line-height: 1.55;
  color: #7f9087;
  background: #f8fbf9;
  border: 1px dashed #dce8e1;
  border-radius: 8px;

  i {
    margin: 2px 7px 0 0;
  }
}

@keyframes wfPulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(60, 159, 179, 0.12);
  }

  50% {
    box-shadow: 0 0 0 4px rgba(60, 159, 179, 0.08);
  }
}

@media screen and (max-width: 760px) {
  .wf-overview {
    flex-direction: column;
  }

  .wf-chips {
    flex-basis: auto;
    justify-content: flex-start;
    width: 100%;
  }

  .wf-flow {
    flex-direction: column;
    overflow-x: visible;
  }

  .wf-flow-item {
    flex: 0 0 auto;
    flex-direction: column;
    min-width: 0;
  }

  .wf-node {
    width: 100%;
    min-width: 0;
  }

  .wf-arrow {
    flex-basis: 22px;

    i {
      transform: rotate(90deg);
    }
  }

  .wf-section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;

    span {
      text-align: left;
    }
  }
}
</style>
