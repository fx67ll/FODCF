<template>
  <div class="return-evidence-chain">
    <div v-if="state === 'empty'" class="evidence-placeholder">
      <i class="el-icon-info"></i>
      <span>该组合暂无可展示的自动证据链。人工AI结果、历史组合或权限不足时会显示此提示。</span>
    </div>
    <div v-else-if="state === 'invalid'" class="evidence-placeholder invalid">
      <i class="el-icon-warning-outline"></i>
      <span>证据链数据格式异常，无法安全解析。请以后端标准化结果快照为准。</span>
    </div>
    <template v-else>
      <div class="evidence-summary">
        共 {{ factors.length }} 个已校验因子；权重影响仅用于解释，不参与任何金额计算。
      </div>
      <el-table :data="factors" size="small" border empty-text="暂无证据因子" class="evidence-table">
        <el-table-column label="因子编码" prop="factorCode" width="130" show-overflow-tooltip />
        <el-table-column label="比赛" width="160" show-overflow-tooltip>
          <template slot-scope="scope">{{ matchLabel(scope.row.matchId) }}</template>
        </el-table-column>
        <el-table-column label="因子类型" prop="factorType" width="120" show-overflow-tooltip />
        <el-table-column label="来源类型" width="124" align="center">
          <template slot-scope="scope">
            <el-tag :type="sourceTagType(scope.row.sourceType)" size="mini">
              {{ formatSourceType(scope.row.sourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源引用" prop="sourceRef" width="140" show-overflow-tooltip />
        <el-table-column label="观察" prop="observation" min-width="220" show-overflow-tooltip />
        <el-table-column label="影响" prop="impact" min-width="150" show-overflow-tooltip />
        <el-table-column label="权重影响" width="100" align="center">
          <template slot-scope="scope">
            <span :class="impactClass(scope.row.weightImpact)">{{ formatWeightImpact(scope.row.weightImpact) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="置信度" width="90" align="center">
          <template slot-scope="scope">{{ formatConfidence(scope.row.confidence) }}</template>
        </el-table-column>
        <el-table-column label="来源层级" width="116" align="center">
          <template slot-scope="scope">
            <el-tag :type="tierTagType(scope.row.sourceTier)" size="mini">{{ formatQuality(scope.row.sourceTier)
              }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="新鲜度" width="96" align="center">
          <template slot-scope="scope">
            <el-tag :type="freshnessTagType(scope.row.freshnessClass)" size="mini">{{
              formatQuality(scope.row.freshnessClass) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="冲突组" width="120" show-overflow-tooltip>
          <template slot-scope="scope">{{ formatConflictGroup(scope.row.conflictGroup) }}</template>
        </el-table-column>
      </el-table>
      <div class="evidence-compact-list">
        <article v-for="(factor, index) in factors" :key="factor.factorCode || index" class="evidence-compact-card">
          <div class="compact-head">
            <strong>{{ formatText(factor.factorCode) }}</strong>
            <span>{{ matchLabel(factor.matchId) }}</span>
          </div>
          <div class="compact-quality">
            <el-tag :type="sourceTagType(factor.sourceType)" size="mini">{{ formatSourceType(factor.sourceType)
              }}</el-tag>
            <el-tag :type="tierTagType(factor.sourceTier)" size="mini">来源 {{ formatQuality(factor.sourceTier)
              }}</el-tag>
            <el-tag :type="freshnessTagType(factor.freshnessClass)" size="mini">新鲜度 {{
              formatQuality(factor.freshnessClass)
              }}</el-tag>
            <el-tag type="info" size="mini">冲突组 {{ formatConflictGroup(factor.conflictGroup) }}</el-tag>
          </div>
          <div class="compact-row"><span>因子类型</span><b>{{ formatText(factor.factorType) }}</b></div>
          <div class="compact-row"><span>来源引用</span><b>{{ formatText(factor.sourceRef) }}</b></div>
          <div class="compact-row"><span>观察</span><b>{{ formatText(factor.observation) }}</b></div>
          <div class="compact-row"><span>影响</span><b>{{ formatText(factor.impact) }}</b></div>
          <div class="compact-metrics">
            <span>权重影响 <b :class="impactClass(factor.weightImpact)">{{ formatWeightImpact(factor.weightImpact)
                }}</b></span>
            <span>置信度 <b>{{ formatConfidence(factor.confidence) }}</b></span>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "ReturnEvidenceChain",
  props: {
    value: {
      type: [String, Array, Object],
      default: null,
    },
    matches: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    parsedValue() {
      if (this.value == null || this.value === "") {
        return [];
      }
      let parsed = this.value;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (error) {
          return null;
        }
      }
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && typeof item === "object");
      }
      if (parsed && Array.isArray(parsed.evidenceChain)) {
        return parsed.evidenceChain.filter((item) => item && typeof item === "object");
      }
      return null;
    },
    factors() {
      return this.parsedValue || [];
    },
    state() {
      if (this.parsedValue === null) return "invalid";
      return this.parsedValue.length ? "ready" : "empty";
    },
  },
  methods: {
    matchLabel(matchId) {
      if (matchId == null) return "-";
      const match = (this.matches || []).find((item) => String(item.matchId) === String(matchId));
      if (!match) return `#${matchId}`;
      return match.matchSummary || `#${matchId}`;
    },
    formatSourceType(value) {
      const labels = {
        SUPPLIED: "用户提供",
        RETRIEVAL: "系统检索",
        MANUAL_WEIGHT: "主观权重",
      };
      return labels[value] || value || "-";
    },
    sourceTagType(value) {
      if (value === "RETRIEVAL") return "success";
      if (value === "MANUAL_WEIGHT") return "warning";
      return "info";
    },
    formatText(value) {
      if (value == null || String(value).trim() === "") return "未提供";
      return String(value);
    },
    formatQuality(value) {
      const text = this.formatText(value);
      if (text === "未提供") return text;
      return text.toUpperCase() === "UNKNOWN" ? "未知" : text;
    },
    formatConflictGroup(value) {
      return this.formatText(value).trim() || "未提供";
    },
    tierTagType(value) {
      const normalized = value == null ? "" : String(value).toUpperCase();
      if (normalized === "OFFICIAL") return "success";
      if (normalized === "MAJOR_MEDIA") return "warning";
      if (normalized === "SPECIALIST") return "";
      return "info";
    },
    freshnessTagType(value) {
      const normalized = value == null ? "" : String(value).toUpperCase();
      if (normalized === "CURRENT") return "success";
      if (normalized === "RECENT") return "warning";
      if (normalized === "STALE") return "danger";
      return "info";
    },
    formatWeightImpact(value) {
      if (value == null || value === "") return "-";
      const number = Number(value);
      if (!Number.isFinite(number)) return "-";
      return number > 0 ? `+${number}` : String(number);
    },
    impactClass(value) {
      const number = Number(value);
      if (!Number.isFinite(number) || number === 0) return "impact-neutral";
      return number > 0 ? "impact-positive" : "impact-negative";
    },
    formatConfidence(value) {
      if (value == null || value === "") return "-";
      const number = Number(value);
      return Number.isFinite(number) ? `${number}%` : "-";
    },
  },
};
</script>

<style lang="scss" scoped>
.return-evidence-chain {
  width: 100%;
  min-width: 0;
}

.evidence-summary {
  margin-bottom: 9px;
  font-size: 12px;
  line-height: 1.55;
  color: #65766f;
}

.evidence-placeholder {
  display: flex;
  align-items: flex-start;
  padding: 12px 13px;
  font-size: 12px;
  line-height: 1.55;
  color: #74847d;
  background: #f8fbf9;
  border: 1px dashed #dce9e1;
  border-radius: 9px;

  i {
    margin: 2px 7px 0 0;
  }
}

.evidence-placeholder.invalid {
  color: #a36a23;
  background: #fffaf1;
  border-color: #f1dfbd;
}

.evidence-table {
  width: 100%;
}

.evidence-compact-list {
  display: none;
}

.evidence-compact-card {
  padding: 11px 12px;
  background: #fbfdfc;
  border: 1px solid #e1ece5;
  border-radius: 9px;
}

.compact-head,
.compact-quality,
.compact-metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.compact-head {
  justify-content: space-between;
  color: #5f746a;
  font-size: 12px;
}

.compact-head strong {
  color: #263e33;
  font-size: 13px;
}

.compact-quality {
  margin-top: 8px;
}

.compact-row {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 8px;
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.55;
}

.compact-row span {
  color: #7a8b83;
}

.compact-row b {
  color: #30463b;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.compact-metrics {
  justify-content: space-between;
  margin-top: 9px;
  padding-top: 8px;
  color: #6f8178;
  font-size: 12px;
  border-top: 1px dashed #e1ece5;
}

.compact-metrics b {
  color: #30463b;
}

@media (max-width: 860px) {
  .evidence-table {
    display: none;
  }

  .evidence-compact-list {
    display: grid;
    gap: 8px;
  }
}

.evidence-table ::v-deep .el-table__body-wrapper {
  overflow-x: auto;
}

.impact-positive {
  color: #23995b;
  font-weight: 600;
}

.impact-negative {
  color: #cf5b4f;
  font-weight: 600;
}

.impact-neutral {
  color: #7b8b84;
}
</style>
