<template>
  <div class="dortmund-match-import-entry">
    <dortmund-json-import-shell :visible.sync="drawerVisible" title="比赛记录 JSON 导入"
      subtitle="粘贴或选择第三方 AI 生成的比赛 JSON，预览校验后批量写入比赛记录。" icon="el-icon-football" entity-label="比赛记录"
      intro-title="先解析校验，再选择需要写入的比赛"
      intro-description="支持粘贴标准 JSON 或选择 JSON 文件。解析后进入勾选步骤，确认写入前不会写入任何比赛；只有勾选且通过服务端校验的条目才会落库，任一条失败整批回滚。"
      source-hint="JSON 顶层可以是 matches 数组，也可以直接是数组。"
      placeholder='请粘贴第三方 AI 输出的 JSON，例如：{"matches":[{ "seasonName": "...", "homeTeamName": "...", "matchTime": "2026-11-26 20:30:00" }]}'
      idle-tip="解析只做前端结构校验，最终引用、唯一性和写入结果以后端为准。" parsed-tip="请在预览中勾选需要导入的比赛；点击底部按钮后还需在确认弹窗中确认写入，未勾选条目不会写入。"
      :raw-json.sync="rawJson" :source-type.sync="sourceType" :file-name="fileName" :parsed="parsed" :parsing="parsing"
      :importing="importing" :parse-message="parseMessage" :total-count="parsedRows.length" :valid-count="validCount"
      :invalid-count="invalidCount" :selected-count="selectedCount" has-prompt @raw-input="markDirty"
      @source-type-change="handleSourceTypeChange" @file-change="handleFileChange" @clear="clearSource"
      @parse="parseJson" @select-all="selectAllValid" @clear-selection="clearSelection" @import="submitImport"
      @download-template="downloadTemplate" @show-prompt="promptVisible = true" @show-format="formatVisible = true"
      @closed="resetDrawer">
      <template slot="preview">
        <el-table ref="previewTable" :data="parsedRows" size="mini" border max-height="430" row-key="rowKey"
          class="json-import-table json-import-match-table" :row-class-name="rowClassName"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="46" align="center" :selectable="isRowSelectable" />
          <el-table-column label="#" prop="sequence" width="48" align="center" />
          <el-table-column label="赛季" prop="seasonName" min-width="160" show-overflow-tooltip />
          <el-table-column label="对阵" min-width="220" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="json-import-versus">
                <b>{{ scope.row.homeTeamName || scope.row.homeTeamCode || "未识别主队" }}</b>
                <em>vs</em>
                <b>{{ scope.row.awayTeamName || scope.row.awayTeamCode || "未识别客队" }}</b>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="开球时间" prop="matchTime" width="150" align="center" />
          <el-table-column label="球队主场" prop="matchVenue" min-width="150" show-overflow-tooltip />
          <el-table-column label="校验状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.valid" size="mini" type="success" effect="plain">可导入</el-tag>
              <el-tooltip v-else :content="scope.row.errors.join('；')" placement="top">
                <el-tag size="mini" type="danger" effect="plain">需修正</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </dortmund-json-import-shell>

    <el-dialog title="AI 采集提示词" :visible.sync="promptVisible" width="min(860px, 92vw)" append-to-body
      custom-class="dortmund-json-import-dialog dortmund-match-import-prompt-dialog" :close-on-click-modal="false">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-s-promotion"></i></span>
        <p>将下方提示词完整交给具备公开赛事资料检索能力的第三方 AI。它只负责整理标准 JSON，导入校验仍在系统内完成。</p>
      </div>
      <pre class="json-import-code">{{ aiPrompt }}</pre>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="promptVisible = false">关闭</el-button>
        <el-button size="small" type="success" icon="el-icon-copy-document"
          @click="copyText(aiPrompt, 'AI 采集提示词已复制')">复制提示词</el-button>
      </span>
    </el-dialog>

    <el-dialog title="比赛 JSON 字段格式说明" :visible.sync="formatVisible" width="min(820px, 92vw)" append-to-body
      custom-class="dortmund-json-import-dialog dortmund-match-import-format-dialog" :close-on-click-modal="false">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-document"></i></span>
        <p>字段名保持英文 camelCase。主队与客队必须各自提供编码或名称，比赛开球时间使用北京时间。</p>
      </div>
      <el-table :data="fieldDescriptions" size="mini" border max-height="420" class="json-import-field-table">
        <el-table-column prop="key" label="字段" width="160" />
        <el-table-column prop="label" label="业务名称" width="130" />
        <el-table-column label="必填" width="70" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.required ? 'danger' : 'info'" effect="plain">
              {{ scope.row.required ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="300" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="formatVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { importMatchJson } from "@/api/fx67ll/dortmund/match";
import {
  DORTMUND_MATCH_IMPORT_FIELDS,
  DORTMUND_MANUAL_AI_CONFIG,
  buildDortmundMatchImportPrompt,
  buildDortmundMatchImportTemplate,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundJsonImportShell from "@/views/fx67ll/dortmund/other/component/DortmundJsonImportShell/index";

const MAX_IMPORT_ROWS = 1000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MATCH_STATUS_VALUES = ["", "0", "1"];
const MATCH_RESULT_VALUES = ["", "0", "1", "2"];
const FIELD_ALIASES = Object.freeze({
  matchCode: ["matchCode", "比赛编码"],
  seasonName: ["seasonName", "赛季名称", "赛季"],
  homeTeamCode: ["homeTeamCode", "主队编码"],
  homeTeamName: ["homeTeamName", "主队名称", "主队"],
  awayTeamCode: ["awayTeamCode", "客队编码"],
  awayTeamName: ["awayTeamName", "客队名称", "客队"],
  matchTime: ["matchTime", "比赛开球时间", "比赛时间", "开球时间"],
  matchVenue: ["matchVenue", "球队主场", "主场"],
  matchStatus: ["matchStatus", "比赛状态"],
  matchResult: ["matchResult", "比赛结果"],
  oddsResult: ["oddsResult", "倍率赛果"],
  matchRemark: ["matchRemark", "比赛备注", "备注"],
});

function textValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export default {
  name: "DortmundMatchImportDrawer",
  components: { DortmundJsonImportShell },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      sourceType: "paste",
      rawJson: "",
      fileName: "",
      parsed: false,
      parsing: false,
      importing: false,
      parseMessage: "",
      parsedRows: [],
      selectedRows: [],
      promptVisible: false,
      formatVisible: false,
      fieldDescriptions: DORTMUND_MATCH_IMPORT_FIELDS,
      aiPrompt: buildDortmundMatchImportPrompt(),
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    validCount() {
      return this.parsedRows.filter((row) => row.valid).length;
    },
    invalidCount() {
      return this.parsedRows.length - this.validCount;
    },
    selectedCount() {
      return this.selectedRows.length;
    },
  },
  methods: {
    // JSON 内容一旦变化，旧预览和勾选立即失效，避免把修改前的数据提交到后端。
    markDirty() {
      this.parseMessage = "";
      if (!this.parsed) return;
      this.parsed = false;
      this.parsedRows = [];
      this.selectedRows = [];
    },
    handleSourceTypeChange() {
      this.clearSource();
    },
    clearSource() {
      this.rawJson = "";
      this.fileName = "";
      this.parsed = false;
      this.parseMessage = "";
      this.parsedRows = [];
      this.selectedRows = [];
      this.parsing = false;
      this.$nextTick(() => {
        if (this.$refs.previewTable) this.$refs.previewTable.clearSelection();
      });
    },
    handleFileChange(file) {
      const rawFile = file && file.raw;
      const fileName = rawFile && rawFile.name ? rawFile.name : "";
      if (!/\.json$/i.test(fileName)) {
        this.$modal.msgError("仅支持导入 .json 文件");
        return;
      }
      if (rawFile.size > MAX_FILE_BYTES) {
        this.$modal.msgError("JSON 文件不能超过 10MB");
        return;
      }
      this.fileName = fileName;
      const reader = new FileReader();
      this.parsing = true;
      reader.onload = () => {
        this.rawJson = String(reader.result || "");
        this.parseJson();
      };
      reader.onerror = () => {
        this.parsing = false;
        this.$modal.msgError("读取 JSON 文件失败，请重新选择");
      };
      reader.readAsText(rawFile, "utf-8");
    },
    parseJson() {
      if (!this.rawJson.trim()) {
        this.$modal.msgError("请先粘贴或选择 JSON 内容");
        return;
      }
      this.parsing = true;
      this.parseMessage = "";
      try {
        const rows = this.extractRows(this.rawJson);
        if (rows.length > MAX_IMPORT_ROWS) {
          throw new Error(`单次最多导入 ${MAX_IMPORT_ROWS} 条比赛记录`);
        }
        this.parsedRows = rows.map((row, index) => this.normalizeRow(row, index));
        this.selectedRows = [];
        this.parsed = true;
        this.$nextTick(() => {
          const table = this.$refs.previewTable;
          if (!table) return;
          table.clearSelection();
          this.parsedRows.forEach((row) => {
            if (row.valid) table.toggleRowSelection(row, true);
          });
        });
      } catch (error) {
        this.parsed = false;
        this.parsedRows = [];
        this.selectedRows = [];
        this.parseMessage = error && error.message ? error.message : "JSON 解析失败，请检查格式";
      } finally {
        this.parsing = false;
      }
    },
    extractRows(raw) {
      const cleaned = textValue(raw)
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (error) {
        throw new Error("JSON 格式不合法，请检查括号、逗号和字符串引号");
      }
      const rows = Array.isArray(parsed) ? parsed
        : parsed && Array.isArray(parsed.matches) ? parsed.matches
          : parsed && Array.isArray(parsed.data) ? parsed.data : null;
      if (!rows) {
        throw new Error("JSON 顶层必须是数组，或包含 matches / data 数组");
      }
      if (!rows.length) {
        throw new Error("JSON 中没有可处理的比赛条目");
      }
      return rows;
    },
    pickField(source, field) {
      const aliases = FIELD_ALIASES[field] || [field];
      for (const alias of aliases) {
        if (Object.prototype.hasOwnProperty.call(source, alias)) {
          return source[alias];
        }
      }
      return "";
    },
    normalizeRow(source, index) {
      const errors = [];
      const row = {};
      Object.keys(FIELD_ALIASES).forEach((field) => {
        row[field] = textValue(this.pickField(source || {}, field));
      });
      row.matchTime = this.normalizeMatchTime(row.matchTime);
      row.matchStatus = row.matchStatus || "0";
      row.oddsResult = this.normalizeOddsResult(row.oddsResult, errors);

      if (!row.seasonName) errors.push("赛季名称不能为空");
      if (!row.homeTeamCode && !row.homeTeamName) errors.push("主队编码或名称至少填写一项");
      if (!row.awayTeamCode && !row.awayTeamName) errors.push("客队编码或名称至少填写一项");
      if (!row.matchTime) {
        errors.push("比赛开球时间不能为空");
      } else if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.matchTime)
        || !Number.isFinite(new Date(row.matchTime.replace(/-/g, "/")).getTime())) {
        errors.push("比赛开球时间格式应为 yyyy-MM-dd HH:mm:ss");
      }
      if (!MATCH_STATUS_VALUES.includes(row.matchStatus)) errors.push("比赛状态只能为 0 或 1");
      if (!MATCH_RESULT_VALUES.includes(row.matchResult)) errors.push("比赛结果只能为空、0、1 或 2");
      if ((row.homeTeamCode && row.awayTeamCode && row.homeTeamCode === row.awayTeamCode)
        || (!row.homeTeamCode && !row.awayTeamCode && row.homeTeamName === row.awayTeamName)) {
        errors.push("主队和客队不能是同一支球队");
      }
      return {
        ...row,
        rowKey: `match-import-${Date.now()}-${index}`,
        sequence: index + 1,
        valid: errors.length === 0,
        errors,
      };
    },
    normalizeMatchTime(value) {
      let normalized = textValue(value);
      if (!normalized) return "";
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
        normalized = normalized.replace("T", " ");
        if (normalized.length === 16) normalized += ":00";
      }
      return normalized;
    },
    normalizeOddsResult(value, errors) {
      const normalized = textValue(value);
      if (!normalized) return "";
      const allowed = new Set(DORTMUND_MANUAL_AI_CONFIG.selectionTypes);
      const parts = normalized.split(/[,，]/).map((item) => item.trim().toUpperCase()).filter(Boolean);
      const invalid = parts.filter((item) => !allowed.has(item));
      if (invalid.length) errors.push(`倍率赛果包含未知值：${invalid.join("、")}`);
      return [...new Set(parts)].join(",");
    },
    rowClassName({ row }) {
      return row && !row.valid ? "is-invalid-row" : "";
    },
    isRowSelectable(row) {
      return Boolean(row && row.valid);
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows || [];
    },
    selectAllValid() {
      const table = this.$refs.previewTable;
      if (!table) return;
      table.clearSelection();
      this.parsedRows.forEach((row) => {
        if (row.valid) table.toggleRowSelection(row, true);
      });
    },
    clearSelection() {
      if (this.$refs.previewTable) this.$refs.previewTable.clearSelection();
      this.selectedRows = [];
    },
    // 只提交界面暴露的业务字段，前端预览时的 rowKey、valid 和 errors 不进入后端契约。
    buildCanonicalRow(row) {
      return {
        matchCode: row.matchCode,
        seasonName: row.seasonName,
        homeTeamCode: row.homeTeamCode,
        homeTeamName: row.homeTeamName,
        awayTeamCode: row.awayTeamCode,
        awayTeamName: row.awayTeamName,
        matchTime: row.matchTime,
        matchVenue: row.matchVenue,
        matchStatus: row.matchStatus,
        matchResult: row.matchResult,
        oddsResult: row.oddsResult,
        matchRemark: row.matchRemark,
      };
    },
    submitImport() {
      if (!this.selectedRows.length || this.importing) return;
      this.importing = true;
      importMatchJson(this.selectedRows.map(this.buildCanonicalRow)).then((response) => {
        this.$modal.msgSuccess((response && response.msg) || `比赛记录导入成功，共 ${this.selectedRows.length} 条`);
        this.$emit("imported", response);
        this.closeDrawer();
      }).catch(() => {
      }).finally(() => {
        this.importing = false;
      });
    },
    downloadTemplate() {
      const content = buildDortmundMatchImportTemplate();
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      this.$download.saveAs(blob, "dortmund-match-import-template.json");
    },
    copyText(content, successMessage) {
      if (!content) return;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
          this.$modal.msgSuccess(successMessage);
        }).catch(() => this.fallbackCopyText(content, successMessage));
        return;
      }
      this.fallbackCopyText(content, successMessage);
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
    closeDrawer() {
      if (this.importing) return;
      this.drawerVisible = false;
    },
    resetDrawer() {
      this.sourceType = "paste";
      this.parseMessage = "";
      this.parsed = false;
      this.parsing = false;
      this.importing = false;
      this.parsedRows = [];
      this.selectedRows = [];
      this.promptVisible = false;
      this.formatVisible = false;
      this.rawJson = "";
      this.fileName = "";
      this.aiPrompt = buildDortmundMatchImportPrompt();
    },
  },
};
</script>

<style lang="scss" scoped>
.json-import-match-table {
  width: 100%;
}

.json-import-match-table ::v-deep th {
  font-weight: 600;
  color: #405848;
  background: #f3f9f5;
}

.json-import-match-table ::v-deep .el-table__body tr.is-invalid-row>td {
  background: #fff9f7;
}

.json-import-match-table ::v-deep .el-table__body tr.is-invalid-row:hover>td {
  background: #fff4f0;
}

.json-import-versus {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 100%;

  b {
    overflow: hidden;
    font-weight: 600;
    color: #2f6e4b;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    flex: 0 0 auto;
    font-size: 10px;
    font-style: normal;
    color: #a0ada5;
  }
}

.json-import-code {
  max-height: 52vh;
  padding: 14px 16px;
  margin: 0;
  overflow: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #d8eee1;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #183226;
  border-radius: 10px;
}
</style>
