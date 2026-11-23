<template>
  <div class="return-manual-result">
    <div class="manual-result-hero" :class="{ 'is-adopted': isAdopted }">
      <div class="manual-result-main">
        <div class="manual-result-kicker">
          <span class="manual-result-mode">{{ modeLabel }}</span>
          <span class="manual-result-source">人工AI导入</span>
        </div>
        <h3>{{ combination.combinationTitle || "人工AI候选组合" }}</h3>
        <p>{{ combination.combinationCode || "暂无组合编码" }}</p>
        <div class="manual-result-badges">
          <el-tag :type="isAdopted ? 'success' : 'info'" size="mini">
            {{ isAdopted ? "已采用" : "未采用" }}
          </el-tag>
          <dortmund-verification-status-tag :status="combination.verificationStatus" />
          <span v-if="confidence != null" class="manual-result-badge">第三方AI置信度 {{ confidence }}%</span>
          <span class="manual-result-badge">{{ matches.length }} 场</span>
        </div>
      </div>
      <div v-if="confidence != null" class="manual-result-confidence">
        <el-progress type="circle" :percentage="confidence" :width="76" :stroke-width="6" :color="confidenceColor">
          <span class="manual-result-confidence-value">{{ confidence }}</span>
          <span class="manual-result-confidence-label">置信度</span>
        </el-progress>
      </div>
    </div>

    <div class="manual-result-metrics">
      <div v-for="metric in metrics" :key="metric.label" class="manual-result-metric">
        <span>{{ metric.label }}</span>
        <strong :class="metric.state">{{ metric.value }}</strong>
        <small>{{ metric.hint }}</small>
      </div>
    </div>

    <div class="manual-result-note">
      <i class="el-icon-info"></i>
      <span>人工AI模式由第三方AI在平台外完成检索与分析。此处展示其候选结论、理由和风险，不展示平台自动证据链或检索引用。</span>
    </div>

    <div v-if="analysisSummary" class="manual-result-section">
      <div class="manual-result-section-title">
        <span><i class="el-icon-document"></i>第三方AI分析摘要</span>
      </div>
      <p class="manual-result-summary">{{ displayedSummary }}</p>
      <el-button v-if="summaryLong" type="text" class="dortmund-theme-text" @click="summaryExpanded = !summaryExpanded">
        {{ summaryExpanded ? "收起分析摘要" : "展开完整分析" }}
      </el-button>
    </div>

    <div v-if="riskNotes" class="manual-result-risk">
      <div class="manual-result-risk-icon"><i class="el-icon-warning-outline"></i></div>
      <div>
        <strong>第三方AI风险与信息缺口</strong>
        <p>{{ riskNotes }}</p>
      </div>
    </div>

    <div class="manual-result-section">
      <div class="manual-result-section-title">
        <span><i class="el-icon-football"></i>逐场选择</span>
        <small>{{ matches.length }} 场</small>
      </div>
      <div v-if="matches.length" class="manual-decision-list">
        <div v-for="(match, index) in matches" :key="match.itemId || `${match.matchId}-${index}`"
          class="manual-decision-card">
          <div class="manual-decision-head">
            <div class="manual-decision-match">
              <strong>{{ match.matchSummary || `比赛 #${match.matchId}` }}</strong>
              <span>比赛 #{{ match.matchId }}</span>
            </div>
            <div class="manual-decision-tags">
              <el-tag :type="selectionTagType(match.selectionType)" size="mini">
                {{ selectionLabel(match.selectionType) }}
              </el-tag>
              <span>倍率 {{ match.oddsValueSnapshot || "-" }}</span>
              <span>评估权重 {{ formatWeight(match.appliedWeight) }}</span>
            </div>
          </div>
          <div v-if="canViewReason && match.selectionReason" class="manual-decision-reason">
            <label>选择理由</label>
            <p>{{ match.selectionReason }}</p>
          </div>
          <div v-else-if="!canViewReason" class="manual-decision-restricted">
            <i class="el-icon-lock"></i>
            <span>逐场理由受 dortmund:return:remark:query 权限控制。</span>
          </div>
        </div>
      </div>
      <div v-else class="manual-result-empty">
        <i class="el-icon-info"></i>
        <span>暂无逐场明细，请刷新组合详情后重试。</span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { formatOddsWeight } from "@/views/fx67ll/dortmund/other/utils/odds";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";

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
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (error) {
    return fallback;
  }
}

export default {
  name: "ReturnManualResult",
  components: { DortmundVerificationStatusTag },
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
      return "人工AI结果";
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
      return this.analysisSummary.length > 420;
    },
    displayedSummary() {
      if (!this.summaryLong || this.summaryExpanded) return this.analysisSummary;
      return `${this.analysisSummary.slice(0, 420)}...`;
    },
    riskNotes() {
      return normalizeText(this.combination.riskNotes) || normalizeText(this.parsedRemark.riskNotes);
    },
    confidence() {
      const raw = this.combination.aiConfidence != null
        ? this.combination.aiConfidence : this.parsedRemark.confidence;
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
    metrics() {
      const deviation = Number(this.combination.deviationAmount);
      return [
        { label: "组合倍率", value: this.combination.combinedOdds || "-", hint: "冻结倍率快照乘积", state: "" },
        { label: "预计回报", value: formatMoneyDisplay(this.combination.estimatedReturn), hint: "后端按倍率复算", state: "" },
        {
          label: "目标偏差",
          value: formatMoneyDisplay(this.combination.deviationAmount),
          hint: "预计回报与目标金额差额",
          state: Number.isFinite(deviation) && deviation >= 0 ? "is-positive" : "is-warning",
        },
        { label: "比赛场次", value: this.matches.length || this.combination.matchCount || 0, hint: "组合包含比赛数", state: "" },
      ];
    },
  },
  watch: {
    analysisSummary() {
      this.summaryExpanded = false;
    },
  },
  methods: {
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
.return-manual-result {
  width: 100%;
  min-width: 0;
}

.manual-result-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 19px;
  background: linear-gradient(135deg, #fffdf7 0%, #fff7e7 100%);
  border: 1px solid #f0dfb8;
  border-radius: 14px;

  &.is-adopted {
    background: linear-gradient(135deg, #f8fdf9 0%, #eef9f2 100%);
    border-color: #cfe8d9;
  }
}

.manual-result-main {
  min-width: 0;

  h3 {
    margin: 6px 0 3px;
    font-size: 18px;
    line-height: 1.35;
    color: #342b20;
  }

  p {
    margin: 0;
    font-size: 11px;
    color: #9a8d79;
  }
}

.manual-result-kicker,
.manual-result-badges,
.manual-result-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.manual-result-mode,
.manual-result-source {
  display: inline-flex;
  padding: 2px 7px;
  font-size: 10px;
  border-radius: 999px;
}

.manual-result-mode {
  color: #8a5a11;
  background: #ffedc7;
}

.manual-result-source {
  color: #6e7f76;
  background: #f3f6f4;
  border: 1px solid #e3e9e5;
}

.manual-result-badges {
  margin-top: 7px;
}

.manual-result-badge {
  font-size: 10px;
  color: #7d8b84;
}

.manual-result-confidence {
  flex: 0 0 auto;
  text-align: center;
}

.manual-result-confidence-value {
  display: block;
  margin-top: -4px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: #4e3c24;
}

.manual-result-confidence-label {
  display: block;
  font-size: 9px;
  color: #a2937d;
}

.manual-result-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-top: 12px;
}

.manual-result-metric {
  padding: 10px 12px;
  background: #fbfdfc;
  border: 1px solid #e6eee9;
  border-radius: 10px;

  span,
  small {
    display: block;
    font-size: 10px;
    color: #9aa8a0;
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
    line-height: 1.4;
  }
}

.manual-result-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 11px;
  margin-top: 12px;
  font-size: 11px;
  line-height: 1.55;
  color: #877450;
  background: #fffaf0;
  border: 1px dashed #ecdbb7;
  border-radius: 9px;
}

.manual-result-section {
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px dashed #e2ebe6;
}

.manual-result-section-title {
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
    color: #d49c33;
  }

  small {
    font-size: 10px;
    color: #9aa8a0;
  }
}

.manual-result-summary {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #53675d;
  white-space: pre-line;
  word-break: break-word;
}

.manual-result-risk {
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

.manual-result-risk-icon {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  color: #d49c33;
  background: #fff3d9;
  border-radius: 8px;
}

.manual-decision-list {
  display: grid;
  gap: 9px;
}

.manual-decision-card {
  padding: 11px 13px;
  background: #fbfdfc;
  border: 1px solid #e5eee8;
  border-radius: 10px;
}

.manual-decision-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.manual-decision-match {
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

.manual-decision-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
  font-size: 11px;
  color: #6f8378;
}

.manual-decision-reason {
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px dashed #e8efeb;

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
  }
}

.manual-decision-restricted,
.manual-result-empty {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.5;
  color: #8b9a92;
}

.manual-result-empty {
  padding: 12px 13px;
  margin-top: 0;
  background: #f8fbf9;
  border: 1px dashed #dce8e1;
  border-radius: 9px;
}

@media screen and (max-width: 760px) {

  .manual-result-hero,
  .manual-decision-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .manual-result-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .manual-decision-tags {
    justify-content: flex-start;
  }
}

@media screen and (max-width: 460px) {
  .manual-result-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
