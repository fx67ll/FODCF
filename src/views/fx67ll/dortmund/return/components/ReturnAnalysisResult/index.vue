<template>
  <div class="return-analysis-result">
    <div class="result-hero" :class="{ 'is-adopted': isAdopted }">
      <div class="result-hero-main">
        <div class="result-kicker">
          <span class="result-mode">{{ modeLabel }}</span>
          <span class="result-source">{{ sourceLabel }}</span>
        </div>
        <h3>{{ combination.combinationTitle || "AI分析结果" }}</h3>
        <p>{{ combination.combinationCode || "暂无组合编码" }}</p>
        <div class="result-badges">
          <el-tag :type="isAdopted ? 'success' : 'info'" size="mini">
            {{ isAdopted ? "已采用" : "未采用" }}
          </el-tag>
          <dortmund-verification-status-tag :status="combination.verificationStatus" />
          <span v-if="confidence != null" class="result-badge">AI置信度 {{ confidence }}%</span>
          <span class="result-badge">{{ matches.length }} 场</span>
          <span v-if="evidenceFactorCount" class="result-badge">{{ evidenceFactorCount }} 个证据因子</span>
        </div>
      </div>
      <div v-if="confidence != null" class="result-confidence">
        <el-progress type="circle" :percentage="confidence" :width="76" :stroke-width="6" :color="confidenceColor">
          <span class="result-confidence-value">{{ confidence }}</span>
          <span class="result-confidence-label">置信度</span>
        </el-progress>
      </div>
    </div>

    <div class="result-metrics">
      <div v-for="metric in metrics" :key="metric.label" class="result-metric">
        <span>{{ metric.label }}</span>
        <strong :class="metric.state">{{ metric.value }}</strong>
        <small>{{ metric.hint }}</small>
      </div>
    </div>

    <div v-if="analysisSummary" class="result-section result-summary">
      <div class="result-section-title">
        <span><i class="el-icon-magic-stick"></i>AI分析摘要</span>
      </div>
      <p class="result-analysis-text">{{ displayedSummary }}</p>
      <el-button v-if="summaryLong" type="text" class="dortmund-theme-text result-summary-toggle"
        @click="summaryExpanded = !summaryExpanded">
        {{ summaryExpanded ? "收起分析摘要" : "展开完整分析" }}
      </el-button>
    </div>

    <div v-if="riskNotes" class="result-risk">
      <div class="result-risk-icon"><i class="el-icon-warning-outline"></i></div>
      <div>
        <strong>风险与不确定性</strong>
        <p>{{ riskNotes }}</p>
      </div>
    </div>

    <div v-if="canViewReason && evidenceFactorCount" class="result-section">
      <div class="result-section-title">
        <span><i class="el-icon-share"></i>完整证据链</span>
        <small>{{ evidenceFactorCount }} 个已校验因子</small>
      </div>
      <return-evidence-chain :value="combination.evidenceChain" :matches="matches" />
    </div>

    <div class="result-section">
      <div class="result-section-title">
        <span><i class="el-icon-football"></i>逐场决策</span>
        <small>{{ matches.length }} 场</small>
      </div>
      <div v-if="matches.length" class="decision-list">
        <div v-for="(match, index) in matches" :key="match.itemId || `${match.matchId}-${index}`" class="decision-card">
          <div class="decision-head">
            <div class="decision-match">
              <strong>{{ match.matchSummary || `比赛 #${match.matchId}` }}</strong>
              <span>比赛 #{{ match.matchId }}</span>
            </div>
            <div class="decision-tags">
              <el-tag :type="selectionTagType(match.selectionType)" size="mini">
                {{ selectionLabel(match.selectionType) }}
              </el-tag>
              <span class="decision-meta">倍率 {{ match.oddsValueSnapshot || "-" }}</span>
              <span class="decision-meta">权重 {{ formatWeight(match.appliedWeight) }}</span>
            </div>
          </div>
          <div v-if="canViewReason" class="decision-body">
            <div v-if="match.selectionReason" class="decision-field">
              <label>选择理由</label>
              <p>{{ match.selectionReason }}</p>
            </div>
            <div v-if="match.weightRationale" class="decision-field">
              <label>权重推导</label>
              <p>{{ match.weightRationale }}</p>
            </div>
            <div v-if="hasEvidenceRefs(match)" class="decision-evidence">
              <div v-if="parseRefs(match.evidenceRefs).length" class="decision-evidence-group">
                <label>支持证据</label>
                <div class="decision-ref-list">
                  <span v-for="ref in parseRefs(match.evidenceRefs)" :key="ref" class="decision-ref">{{ ref }}</span>
                </div>
              </div>
              <div v-if="parseRefs(match.counterEvidenceRefs).length" class="decision-evidence-group is-counter">
                <label>反向证据</label>
                <div class="decision-ref-list">
                  <span v-for="ref in parseRefs(match.counterEvidenceRefs)" :key="ref" class="decision-ref">{{ ref
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="decision-restricted">
            <i class="el-icon-lock"></i>
            <span>详细选择理由、权重推导和证据引用受备注查询权限控制。</span>
          </div>
        </div>
      </div>
      <div v-else class="result-empty">
        <i class="el-icon-info"></i>
        <span>该组合暂无可展示的逐场明细。</span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { formatOddsWeight } from "@/views/fx67ll/dortmund/other/utils/odds";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import ReturnEvidenceChain from "../ReturnEvidenceChain/index";

const SELECTION_LABELS = {
  HW: "主胜",
  DR: "平局",
  AW: "客胜",
  HH: "让分主胜",
  HD: "让分平局",
  HA: "让分客胜",
};

function normalizeText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

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
  name: "ReturnAnalysisResult",
  components: { DortmundVerificationStatusTag, ReturnEvidenceChain },
  props: {
    combination: {
      type: Object,
      default: () => ({}),
    },
    batch: {
      type: Object,
      default: null,
    },
    canViewReason: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      summaryExpanded: false,
    };
  },
  computed: {
    isAdopted() {
      return this.combination.adoptedFlag === "Y";
    },
    modeLabel() {
      if (this.combination.generationMode === "A") return "AI辅助模式";
      if (this.combination.generationMode === "S") return "主观模式";
      return "历史结果";
    },
    sourceLabel() {
      if (this.batch && this.batch.resultSource === "M") return "人工AI导入";
      if (this.batch && this.batch.resultSource === "A") return "自动AI分析";
      return "结果快照";
    },
    parsedRemark() {
      const value = this.combination.combinationRemark;
      if (!value) return {};
      if (typeof value === "object") return value;
      try {
        const parsed = JSON.parse(String(value));
        return parsed && typeof parsed === "object" ? parsed : { analysisContent: String(value) };
      } catch (error) {
        return { analysisContent: String(value) };
      }
    },
    batchResult() {
      return this.batch ? parseJson(this.batch.aiResultSnapshot, {}) || {} : {};
    },
    analysisSummary() {
      return normalizeText(this.parsedRemark.analysisContent)
        || normalizeText(this.batchResult.analysisContent)
        || normalizeText(this.combination.combinationReason)
        || normalizeText(this.parsedRemark.reason);
    },
    summaryLong() {
      return this.analysisSummary.length > 320;
    },
    displayedSummary() {
      if (!this.summaryLong || this.summaryExpanded) {
        return this.analysisSummary;
      }
      return `${this.analysisSummary.slice(0, 320)}...`;
    },
    riskNotes() {
      return normalizeText(this.combination.riskNotes) || normalizeText(this.parsedRemark.riskNotes);
    },
    confidence() {
      const raw = this.combination.aiConfidence != null
        ? this.combination.aiConfidence
        : this.parsedRemark.confidence;
      if (raw === null || raw === undefined || raw === "") return null;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
    },
    confidenceColor() {
      if (this.confidence == null) return "#909399";
      if (this.confidence >= 80) return "#2ecc71";
      if (this.confidence >= 60) return "#d7a340";
      return "#d66358";
    },
    matches() {
      return Array.isArray(this.combination.matches) ? this.combination.matches : [];
    },
    evidenceFactorCount() {
      return this.parseEvidenceFactors(this.combination.evidenceChain).length;
    },
    metrics() {
      const deviation = Number(this.combination.deviationAmount);
      return [
        {
          label: "组合倍率",
          value: this.combination.combinedOdds || "-",
          hint: "倍率快照乘积",
          state: "",
        },
        {
          label: "预计回报",
          value: formatMoneyDisplay(this.combination.estimatedReturn),
          hint: "后端按倍率复算",
          state: "",
        },
        {
          label: "目标偏差",
          value: formatMoneyDisplay(this.combination.deviationAmount),
          hint: "预计回报与目标金额差额",
          state: Number.isFinite(deviation) && deviation >= 0 ? "is-positive" : "is-warning",
        },
        {
          label: "比赛场次",
          value: this.matches.length || this.combination.matchCount || 0,
          hint: "组合包含比赛数",
          state: "",
        },
      ];
    },
  },
  methods: {
    parseEvidenceFactors(value) {
      if (value == null || value === "") return [];
      let parsed = value;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (error) {
          return [];
        }
      }
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && typeof item === "object");
      }
      if (parsed && Array.isArray(parsed.evidenceChain)) {
        return parsed.evidenceChain.filter((item) => item && typeof item === "object");
      }
      return [];
    },
    parseRefs(value) {
      if (value == null || value === "") return [];
      if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
      }
      if (typeof value === "object") {
        return [];
      }
      const text = String(value).trim();
      if (!text) return [];
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item)).filter(Boolean);
        }
      } catch (error) {
        // 兼容历史逗号分隔格式。
      }
      return text.split(/[,，、;；\s]+/).map((item) => item.trim()).filter(Boolean);
    },
    hasEvidenceRefs(match) {
      return this.parseRefs(match.evidenceRefs).length > 0
        || this.parseRefs(match.counterEvidenceRefs).length > 0;
    },
    selectionLabel(value) {
      return SELECTION_LABELS[value] || value || "-";
    },
    selectionTagType(value) {
      if (["HW", "HH"].includes(value)) return "success";
      if (["AW", "HA"].includes(value)) return "warning";
      return "info";
    },
    formatWeight(value) {
      if (value === null || value === undefined || value === "") return "-";
      return formatOddsWeight(value, "-");
    },
  },
};
</script>

<style lang="scss" scoped>
.return-analysis-result {
  width: 100%;
  min-width: 0;
}

.result-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 19px;
  background: linear-gradient(135deg, #f6fbf8 0%, #eef8f3 100%);
  border: 1px solid #dcebe3;
  border-radius: 14px;

  &.is-adopted {
    background: linear-gradient(135deg, #f4fcf7 0%, #eaf8ef 100%);
    border-color: #cfe8d9;
  }
}

.result-hero-main {
  min-width: 0;

  h3 {
    margin: 6px 0 3px;
    font-size: 18px;
    line-height: 1.35;
    color: #24362d;
  }

  p {
    margin: 0;
    font-size: 11px;
    color: #8b9a92;
  }
}

.result-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
}

.result-mode,
.result-source {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  font-size: 10px;
  border-radius: 999px;
}

.result-mode {
  color: #2d7f6c;
  background: #e5f6ee;
}

.result-source {
  color: #6e7f76;
  background: #f1f5f2;
  border: 1px solid #e1e9e4;
}

.result-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 9px;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  font-size: 11px;
  color: #65776d;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e4ede7;
  border-radius: 999px;
}

.result-confidence {
  flex: 0 0 auto;
  text-align: center;
}

.result-confidence-value {
  display: block;
  margin-top: -4px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: #2f4a3d;
}

.result-confidence-label {
  display: block;
  font-size: 9px;
  color: #8b9b92;
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-top: 12px;
}

.result-metric {
  padding: 10px 12px;
  background: #fbfdfc;
  border: 1px solid #e6eee9;
  border-radius: 10px;

  span {
    display: block;
    font-size: 11px;
    color: #8b9a92;
  }

  strong {
    display: block;
    margin: 3px 0 1px;
    font-size: 16px;
    color: #2f4a3d;
  }

  strong.is-positive {
    color: #23995b;
  }

  strong.is-warning {
    color: #b17a2d;
  }

  small {
    display: block;
    font-size: 10px;
    line-height: 1.4;
    color: #a1ada6;
  }
}

.result-section {
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px dashed #e2ebe6;
}

.result-section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;

  span {
    font-size: 13px;
    color: #30463c;
  }

  i {
    margin-right: 5px;
    color: #4ead7d;
  }

  small {
    font-size: 10px;
    color: #9aa8a0;
  }
}

.result-analysis-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #53675d;
  white-space: pre-line;
  word-break: break-word;
}

.result-summary-toggle {
  margin-top: 4px;
  font-size: 12px;
}

.result-risk {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 13px;
  padding: 11px 13px;
  color: #8c6421;
  background: #fffaf0;
  border: 1px solid #f1e2c2;
  border-radius: 10px;

  strong {
    display: block;
    margin-bottom: 3px;
    font-size: 12px;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-line;
  }
}

.result-risk-icon {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  color: #d49c33;
  background: #fff3d9;
  border-radius: 8px;
}

.decision-list {
  display: grid;
  gap: 9px;
}

.decision-card {
  padding: 11px 13px;
  background: #fbfdfc;
  border: 1px solid #e5eee8;
  border-radius: 10px;
}

.decision-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.decision-match {
  min-width: 0;

  strong {
    display: block;
    font-size: 13px;
    color: #2f4a3d;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    color: #9aa8a0;
  }
}

.decision-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.decision-meta {
  font-size: 11px;
  color: #6f8378;
}

.decision-body {
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px dashed #e8efeb;
}

.decision-field {
  &+& {
    margin-top: 7px;
  }

  label {
    display: block;
    margin-bottom: 2px;
    font-size: 10px;
    color: #92a198;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.65;
    color: #5a6e63;
    white-space: pre-line;
    word-break: break-word;
  }
}

.decision-evidence {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.decision-evidence-group {
  label {
    display: block;
    margin-bottom: 3px;
    font-size: 10px;
    color: #92a198;
  }

  &.is-counter label {
    color: #b17a2d;
  }
}

.decision-ref-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.decision-ref {
  padding: 1px 6px;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 10px;
  color: #5b7568;
  background: #f2f8f4;
  border: 1px solid #dfeae3;
  border-radius: 5px;
}

.is-counter .decision-ref {
  color: #9b712d;
  background: #fff9ef;
  border-color: #f0e2c6;
}

.decision-restricted {
  display: flex;
  align-items: flex-start;
  margin-top: 8px;
  padding-top: 8px;
  font-size: 11px;
  line-height: 1.5;
  color: #8b9a92;
  border-top: 1px dashed #e8efeb;

  i {
    margin: 2px 6px 0 0;
  }
}

.result-empty {
  display: flex;
  align-items: flex-start;
  padding: 12px 13px;
  font-size: 12px;
  line-height: 1.55;
  color: #7b8d84;
  background: #f8fbf9;
  border: 1px dashed #dce8e1;
  border-radius: 9px;

  i {
    margin: 2px 7px 0 0;
  }
}

@media screen and (max-width: 760px) {
  .result-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .result-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .decision-head {
    flex-direction: column;
  }

  .decision-tags {
    justify-content: flex-start;
  }
}

@media screen and (max-width: 460px) {
  .result-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
