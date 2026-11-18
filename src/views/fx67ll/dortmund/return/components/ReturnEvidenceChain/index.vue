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
      </el-table>
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
