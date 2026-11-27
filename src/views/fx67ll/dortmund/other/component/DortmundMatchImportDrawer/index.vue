<template>
  <div class="dortmund-match-import-entry">
    <dortmund-json-import-shell :visible.sync="drawerVisible" :title="modeMeta.title" :subtitle="modeMeta.subtitle"
      :icon="modeMeta.icon" :entity-label="modeMeta.entityLabel" :intro-title="modeMeta.introTitle"
      :intro-description="modeMeta.introDescription" :source-hint="modeMeta.sourceHint"
      :placeholder="modeMeta.placeholder" :idle-tip="modeMeta.idleTip" :parsed-tip="modeMeta.parsedTip"
      :raw-json.sync="rawJson" :source-type.sync="sourceType" :file-name="fileName" :parsed="parsed" :parsing="parsing"
      :importing="importing" :parse-message="parseMessage" :total-count="parsedRows.length" :valid-count="validCount"
      :invalid-count="invalidCount" :selected-count="selectedCount" has-prompt @raw-input="markDirty"
      @source-type-change="handleSourceTypeChange" @file-change="handleFileChange" @clear="clearSource"
      @parse="parseJson" @select-all="selectAllValid" @clear-selection="clearSelection" @import="submitImport"
      @download-template="downloadTemplate" @show-prompt="handleShowPromptFallback" @show-format="formatVisible = true"
      @closed="resetDrawer">
      <template slot="prompt-action">
        <dortmund-prompt-type-menu title="选择比赛采集模式" subtitle="先确定导入类型，再生成对应的 AI 提示词" tip="类型会同步切换模板、字段说明、预览列与提交接口。"
          :options="promptTypeOptions" :disabled="importing" @select="handlePromptCollectionType" />
      </template>
      <template slot="preview">
        <el-table v-if="isResultMode" ref="previewTable" :data="parsedRows" size="mini" border max-height="430"
          row-key="rowKey" class="json-import-table json-import-match-table" :row-class-name="rowClassName"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="46" align="center" :selectable="isRowSelectable" />
          <el-table-column label="#" prop="sequence" width="48" align="center" />
          <el-table-column label="比赛编码" prop="matchCode" min-width="200" show-overflow-tooltip />
          <el-table-column label="比赛结果" prop="matchResult" width="96" align="center">
            <template slot-scope="scope">{{ formatMatchResult(scope.row.matchResult) }}</template>
          </el-table-column>
          <el-table-column label="倍率结果" prop="multiplierResult" min-width="140" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.multiplierResult || "未登记" }}</template>
          </el-table-column>
          <el-table-column label="倍率记录" width="96" align="center">
            <template slot-scope="scope">{{ scope.row.multipliers.length }} 条</template>
          </el-table-column>
          <el-table-column label="校验状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.valid" size="mini" type="success" effect="plain">可导入</el-tag>
              <el-tooltip v-else :content="scope.row.errors.join('；')" placement="top">
                <el-tag size="mini" type="danger" effect="plain">需修正</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <el-table v-else ref="previewTable" :data="parsedRows" size="mini" border max-height="430" row-key="rowKey"
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
          <el-table-column label="倍率结果" prop="multiplierResult" min-width="130" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.multiplierResult || "未登记" }}</template>
          </el-table-column>
          <el-table-column label="倍率记录" width="96" align="center">
            <template slot-scope="scope">{{ scope.row.multipliers.length }} 条</template>
          </el-table-column>
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

    <dortmund-import-auxiliary-drawer :visible.sync="promptVisible" :title="modeMeta.promptTitle"
      :subtitle="isResultMode ? '已按所选比赛自动注入平台编码' : '面向未来一周的赛事采集范围'" icon="el-icon-s-promotion" size="900px"
      footer-tip="提示词只负责整理标准 JSON；导入前仍需完成解析、勾选和服务端整批校验。">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-s-promotion"></i></span>
        <p>{{ modeMeta.promptIntro }}</p>
      </div>
      <div class="match-prompt-scope">
        <span class="match-prompt-scope-label"><i class="el-icon-aim"></i>采集范围</span>
        <p>{{ promptScopeSummary }}</p>
      </div>
      <pre class="json-import-code">{{ aiPrompt }}</pre>
      <template slot="footer-actions">
        <el-button size="small" type="success" icon="el-icon-copy-document" :disabled="!aiPrompt"
          @click="copyText(aiPrompt, 'AI 采集提示词已复制')">复制提示词</el-button>
      </template>
    </dortmund-import-auxiliary-drawer>

    <dortmund-import-auxiliary-drawer :visible.sync="formatVisible" :title="modeMeta.formatTitle"
      subtitle="标准字段、必填状态与填写约束" icon="el-icon-tickets" size="980px">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-document"></i></span>
        <p>{{ modeMeta.formatIntro }}</p>
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
    </dortmund-import-auxiliary-drawer>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" multiple allow-all-match-statuses
      :selected-items="selectedPromptMatches" @confirm="handlePromptMatchConfirm" />
  </div>
</template>

<script>
import { importMatchJson, importMatchResultJson } from "@/api/fx67ll/dortmund/match";
import {
  DORTMUND_MATCH_IMPORT_FIELDS,
  DORTMUND_MATCH_RESULT_IMPORT_FIELDS,
  DORTMUND_MANUAL_AI_CONFIG,
  buildDortmundMatchImportPrompt,
  buildDortmundMatchImportTemplate,
  buildDortmundMatchResultImportPrompt,
  buildDortmundMatchResultImportTemplate,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundJsonImportShell from "@/views/fx67ll/dortmund/other/component/DortmundJsonImportShell/index";
import DortmundImportAuxiliaryDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundImportAuxiliaryDrawer/index";
import DortmundPromptTypeMenu
  from "@/views/fx67ll/dortmund/other/component/DortmundPromptTypeMenu/index";
import DortmundMatchSelectorModal
  from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";

const MAX_IMPORT_ROWS = 1000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPLIERS_PER_MATCH = 5;
const MATCH_STATUS_VALUES = ["", "0", "1"];
const MATCH_RESULT_VALUES = ["", "0", "1", "2"];
const MULTIPLIER_RESULT_VALUES = new Set(DORTMUND_MANUAL_AI_CONFIG.selectionTypes);
const MATCH_RESULT_LABELS = Object.freeze({ "0": "主队胜", "1": "平局", "2": "客队胜" });
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
  multiplierResult: ["multiplierResult", "倍率结果", "倍率赛果"],
  matchRemark: ["matchRemark", "比赛备注", "备注"],
});
const IMPORT_TYPE_ALIASES = Object.freeze({
  match: ["match", "matchrecord", "record", "比赛记录"],
  result: ["matchresult", "match-result", "result", "比赛结果"],
});
const MATCH_RECORD_MARKERS = Object.freeze([
  "seasonName", "homeTeamName", "homeTeamCode", "awayTeamName", "awayTeamCode", "matchTime", "赛季名称", "主队名称", "客队名称",
]);
const MATCH_RESULT_MARKERS = Object.freeze([
  "matchResult", "multiplierResult", "multipliers", "比赛结果", "倍率结果", "倍率记录",
]);
const MULTIPLIER_TEXT_FIELDS = Object.freeze([
  { key: "multiplierCode", aliases: ["multiplierCode", "倍率编码"] },
  { key: "sourceTime", aliases: ["sourceTime", "来源时间", "倍率来源时间"] },
  { key: "activeFlag", aliases: ["activeFlag", "有效状态"] },
  { key: "multiplierRemark", aliases: ["multiplierRemark", "倍率备注", "倍率说明"] },
]);
const MULTIPLIER_VALUE_FIELDS = Object.freeze([
  { key: "handicapValue", label: "让分值", aliases: ["handicapValue", "让分值"], allowZero: true },
  { key: "homeWinMultiplier", label: "主胜倍率", aliases: ["homeWinMultiplier", "主胜倍率"] },
  { key: "drawMultiplier", label: "平局倍率", aliases: ["drawMultiplier", "平局倍率"] },
  { key: "awayWinMultiplier", label: "客胜倍率", aliases: ["awayWinMultiplier", "客胜倍率"] },
  { key: "handicapHomeWinMultiplier", label: "让分主胜倍率", aliases: ["handicapHomeWinMultiplier", "让分主胜倍率"] },
  { key: "handicapDrawMultiplier", label: "让分平局倍率", aliases: ["handicapDrawMultiplier", "让分平局倍率"] },
  { key: "handicapAwayWinMultiplier", label: "让分客胜倍率", aliases: ["handicapAwayWinMultiplier", "让分客胜倍率"] },
]);
const MULTIPLIER_WEIGHT_FIELDS = Object.freeze([
  { key: "homeWinWeight", label: "主胜权重", aliases: ["homeWinWeight", "主胜权重"] },
  { key: "drawWeight", label: "平局权重", aliases: ["drawWeight", "平局权重"] },
  { key: "awayWinWeight", label: "客胜权重", aliases: ["awayWinWeight", "客胜权重"] },
  { key: "handicapHomeWinWeight", label: "让分主胜权重", aliases: ["handicapHomeWinWeight", "让分主胜权重"] },
  { key: "handicapDrawWeight", label: "让分平局权重", aliases: ["handicapDrawWeight", "让分平局权重"] },
  { key: "handicapAwayWinWeight", label: "让分客胜权重", aliases: ["handicapAwayWinWeight", "让分客胜权重"] },
]);

function textValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export default {
  name: "DortmundMatchImportDrawer",
  components: {
    DortmundJsonImportShell,
    DortmundImportAuxiliaryDrawer,
    DortmundPromptTypeMenu,
    DortmundMatchSelectorModal,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // match=批量创建比赛记录；result=为既有比赛补录赛果和倍率记录。
      importType: "match",
      sourceType: "paste",
      rawJson: "",
      fileName: "",
      parsed: false,
      parsing: false,
      importing: false,
      parseMessage: "",
      parsedRows: [],
      selectedRows: [],
      selectedPromptMatches: [],
      matchSelectorVisible: false,
      promptVisible: false,
      formatVisible: false,
      aiPrompt: "",
      promptTypeOptions: [
        {
          command: "match",
          label: "采集比赛记录",
          description: "按未来 7 天与限定赛事范围采集赛程，可同步倍率记录",
          icon: "el-icon-football",
          tone: "green",
        },
        {
          command: "result",
          label: "补录比赛结果",
          description: "先选既有比赛，自动注入平台编码后采集赛果与倍率",
          icon: "el-icon-circle-check",
          tone: "blue",
        },
      ],
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
    isResultMode() {
      return this.importType === "result";
    },
    modeMeta() {
      if (this.isResultMode) {
        return {
          title: "比赛结果 JSON 导入",
          subtitle: "粘贴或选择第三方 AI 生成的既有比赛赛果 JSON，预览校验后批量补录赛果与倍率记录。",
          icon: "el-icon-circle-check",
          entityLabel: "比赛结果",
          introTitle: "先按比赛编码校验，再选择需要补录的赛果",
          introDescription: "支持粘贴标准 JSON 或选择 JSON 文件。比赛编码必须与当前账号可维护的既有比赛一致；确认写入前不会更新任何数据，只有勾选且服务端校验通过的条目才会落库，任一条失败整批回滚。",
          sourceHint: 'JSON 顶层应包含 type: "matchResult" 与 matchResults 数组；兼容历史 matches / data 容器。',
          placeholder: '请粘贴第三方 AI 输出的 JSON，例如：{"type":"matchResult","matchResults":[{ "matchCode": "...", "matchResult": "0", "multiplierResult": "HW", "multipliers": [] }]}',
          idleTip: "解析只做前端结构校验；比赛归属、赛果变化和倍率记录合法性以后端为准。",
          parsedTip: "请在预览中勾选需要补录的比赛结果；确认后才会提交服务端校验并整批写入。",
          promptTitle: "AI 赛果与倍率补录提示词",
          promptIntro: "平台比赛编码已由系统选择器注入，第三方 AI 只可按清单整理，不得要求手工输入、替换或扩展比赛。",
          formatTitle: "比赛结果 JSON 字段格式说明",
          formatIntro: '字段名保持英文 camelCase，顶层 type 固定为 "matchResult"。matchCode 必填；matchResult、multiplierResult 和 multipliers 至少提供一项。',
          templateName: "dortmund-match-result-import-template.json",
        };
      }
      return {
        title: "比赛记录 JSON 导入",
        subtitle: "粘贴或选择第三方 AI 生成的比赛 JSON，预览校验后批量写入比赛记录与倍率记录。",
        icon: "el-icon-football",
        entityLabel: "比赛记录",
        introTitle: "先解析校验，再选择需要写入的比赛",
        introDescription: "支持粘贴标准 JSON 或选择 JSON 文件。解析后进入勾选步骤，确认写入前不会写入任何比赛；只有勾选且通过服务端校验的条目才会落库，任一条失败整批回滚。",
        sourceHint: 'JSON 顶层应包含 type: "match" 与 matches 数组；兼容历史 data 容器和纯数组。',
        placeholder: '请粘贴第三方 AI 输出的 JSON，例如：{"type":"match","matches":[{ "seasonName": "...", "homeTeamName": "...", "matchTime": "2026-11-26 20:30:00", "multipliers": [] }]}',
        idleTip: "解析只做前端结构校验，最终引用、唯一性和写入结果以后端为准。",
        parsedTip: "请在预览中勾选需要导入的比赛；点击底部按钮后还需在确认弹窗中确认写入，未勾选条目不会写入。",
        promptTitle: "AI 比赛与倍率采集提示词",
        promptIntro: "将下方提示词完整交给具备公开赛事资料检索能力的第三方 AI。它只负责整理标准 JSON，导入校验仍在系统内完成。",
        formatTitle: "比赛 JSON 字段格式说明",
        formatIntro: '字段名保持英文 camelCase，顶层 type 固定为 "match"。主队与客队必须各自提供编码或名称，比赛开球时间使用北京时间。',
        templateName: "dortmund-match-import-template.json",
      };
    },
    fieldDescriptions() {
      return this.isResultMode ? DORTMUND_MATCH_RESULT_IMPORT_FIELDS : DORTMUND_MATCH_IMPORT_FIELDS;
    },
    promptScopeSummary() {
      const matches = this.selectedPromptMatches.filter((match) => match && match.matchCode);
      if (this.isResultMode) {
        if (!matches.length) return "尚未选择待补录的比赛，提示词不会在缺少平台编码时生成。";
        return `${matches.length} 场比赛 · ${matches.map((match) => match.matchCode).join(",")}`;
      }
      return "未来 7 天 · 限定赛事范围 · 仅采集已确认开赛的场次";
    },
  },
  methods: {
    // 提示词类型在导入面板内选择；比赛结果必须先选比赛，避免手工填写或猜测平台编码。
    handlePromptCollectionType(type) {
      if (this.importing) return;
      if (type === "result") {
        this.importType = "result";
        this.selectedPromptMatches = [];
        this.matchSelectorVisible = true;
        return;
      }
      this.importType = "match";
      this.aiPrompt = buildDortmundMatchImportPrompt();
      this.promptVisible = true;
    },
    handleShowPromptFallback() {
      this.$modal.msgInfo("请先从提示词按钮的下拉菜单选择采集比赛记录或补录比赛结果");
    },
    handlePromptMatchConfirm(rows) {
      const selected = Array.isArray(rows) ? rows : [];
      const validMatches = selected.filter((match) => Boolean(match && match.matchCode));
      this.matchSelectorVisible = false;
      if (!validMatches.length) {
        this.$modal.msgWarning("请选择至少一场带比赛编码的比赛");
        return;
      }
      if (validMatches.length < selected.length) {
        this.$modal.msgWarning("已忽略缺少平台比赛编码的记录，请先补齐比赛编码");
      }
      this.selectedPromptMatches = validMatches;
      this.aiPrompt = buildDortmundMatchResultImportPrompt(new Date(), {
        matches: validMatches.map((match) => ({
          matchCode: match.matchCode,
          homeTeamName: match.homeTeamName,
          awayTeamName: match.awayTeamName,
          matchTime: this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") || "",
        })),
      });
      this.promptVisible = true;
    },
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
        const payload = this.extractPayload(this.rawJson);
        const rows = payload.rows;
        if (rows.length > MAX_IMPORT_ROWS) {
          throw new Error(`单次最多导入 ${MAX_IMPORT_ROWS} 条${payload.type === "result" ? "比赛结果" : "比赛记录"}`);
        }
        const nextRows = rows.map((row, index) => payload.type === "result"
          ? this.normalizeResultRow(row, index)
          : this.normalizeMatchRow(row, index));
        if (payload.type === "result") {
          const selectedCodes = new Set(this.selectedPromptMatches
            .map((match) => textValue(match && match.matchCode))
            .filter(Boolean));
          nextRows.forEach((row) => {
            if (selectedCodes.size && row.matchCode && !selectedCodes.has(row.matchCode)) {
              row.errors.push("比赛编码不在本次已选择的比赛范围内");
              row.valid = false;
            }
          });
        }
        this.importType = payload.type;
        this.parsedRows = nextRows;
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
    normalizeImportType(value) {
      const normalized = textValue(value).toLowerCase();
      if (!normalized) return "";
      const matched = Object.keys(IMPORT_TYPE_ALIASES)
        .find((type) => IMPORT_TYPE_ALIASES[type].includes(normalized));
      if (!matched) {
        throw new Error('JSON 根节点的 type 只能为 "match" 或 "matchResult"');
      }
      return matched;
    },
    inferImportType(rows, containerKey) {
      if (containerKey === "matchResults") return "result";
      const objectRows = rows.filter((row) => row && typeof row === "object" && !Array.isArray(row));
      if (objectRows.length && objectRows.every((row) => {
        const hasResultField = MATCH_RESULT_MARKERS.some((key) => Object.prototype.hasOwnProperty.call(row, key));
        const hasRecordField = MATCH_RECORD_MARKERS.some((key) => Object.prototype.hasOwnProperty.call(row, key));
        return hasResultField && !hasRecordField;
      })) {
        return "result";
      }
      return "match";
    },
    extractPayload(raw) {
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
      const explicitType = Array.isArray(parsed) ? "" : this.normalizeImportType(parsed && parsed.type);
      const collectionKeys = explicitType === "match"
        ? ["matches", "data"]
        : ["matchResults", "matches", "data"];
      let rows = Array.isArray(parsed) ? parsed : null;
      let containerKey = Array.isArray(parsed) ? "" : "data";
      for (const key of collectionKeys) {
        if (rows) break;
        if (parsed && Array.isArray(parsed[key])) {
          rows = parsed[key];
          containerKey = key;
        }
      }
      if (!rows) {
        throw new Error(`JSON 顶层必须是数组，或包含 ${collectionKeys.join(" / ")} 数组`);
      }
      if (!rows.length) {
        throw new Error("JSON 中没有可处理的比赛条目");
      }
      const detectedType = explicitType || this.inferImportType(rows, containerKey);
      if (explicitType === "match" && parsed && Array.isArray(parsed.matchResults)) {
        throw new Error('type 为 "match" 时不能使用 matchResults 数组');
      }
      if (detectedType === "result") {
        const looksLikeMatchRecord = rows.some((row) => row && typeof row === "object"
          && MATCH_RECORD_MARKERS.some((key) => Object.prototype.hasOwnProperty.call(row, key)));
        if (explicitType && looksLikeMatchRecord) {
          throw new Error('type 为 "matchResult" 时只能提交比赛结果字段');
        }
      }
      if (explicitType === "match") {
        const looksLikeResultOnly = rows.length > 0 && rows.every((row) => row && typeof row === "object"
          && MATCH_RESULT_MARKERS.some((key) => Object.prototype.hasOwnProperty.call(row, key))
          && !MATCH_RECORD_MARKERS.some((key) => Object.prototype.hasOwnProperty.call(row, key)));
        if (looksLikeResultOnly) {
          throw new Error('type 为 "match" 时不能提交仅包含比赛结果字段的数据');
        }
      }
      return { rows, type: detectedType };
    },
    pickAliases(source, aliases) {
      if (!source || typeof source !== "object") return "";
      for (const alias of aliases) {
        if (Object.prototype.hasOwnProperty.call(source, alias)) {
          return source[alias];
        }
      }
      return "";
    },
    pickField(source, field) {
      return this.pickAliases(source, FIELD_ALIASES[field] || [field]);
    },
    normalizeResultRow(source, index) {
      const errors = [];
      const row = {
        matchCode: textValue(this.pickField(source, "matchCode")),
        matchResult: textValue(this.pickField(source, "matchResult")),
        multiplierResult: this.normalizeMultiplierResult(this.pickField(source, "multiplierResult"), errors),
        multipliers: this.normalizeMultipliers(this.pickAliases(source, ["multipliers", "倍率记录"]), errors),
      };
      if (!row.matchCode) {
        errors.push("比赛编码不能为空");
      }
      if (!MATCH_RESULT_VALUES.includes(row.matchResult)) {
        errors.push("比赛结果只能为空、0、1 或 2");
      }
      if (!row.matchResult && !row.multiplierResult && !row.multipliers.length) {
        errors.push("比赛结果、倍率结果和倍率记录至少提供一项");
      }
      return {
        ...row,
        rowKey: `match-result-import-${Date.now()}-${index}`,
        sequence: index + 1,
        valid: errors.length === 0,
        errors,
      };
    },
    normalizeMatchRow(source, index) {
      const errors = [];
      const row = {};
      Object.keys(FIELD_ALIASES).forEach((field) => {
        row[field] = textValue(this.pickField(source || {}, field));
      });
      row.matchTime = this.normalizeMatchTime(row.matchTime);
      row.matchStatus = row.matchStatus || "0";
      row.multiplierResult = this.normalizeMultiplierResult(row.multiplierResult, errors);
      row.multipliers = this.normalizeMultipliers(this.pickAliases(source, ["multipliers", "倍率记录"]), errors);

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
    normalizeMultiplierResult(value, errors) {
      const normalized = textValue(value);
      if (!normalized) return "";
      const parts = normalized.split(/[,，]/).map((item) => item.trim().toUpperCase()).filter(Boolean);
      const invalid = parts.filter((item) => !MULTIPLIER_RESULT_VALUES.has(item));
      if (invalid.length) errors.push(`倍率结果包含未知值：${invalid.join("、")}`);
      return [...new Set(parts)].join(",");
    },
    normalizeMultipliers(value, errors) {
      let source = value;
      if (typeof source === "string" && source.trim()) {
        try {
          source = JSON.parse(source);
        } catch (error) {
          errors.push("倍率记录必须是数组，不能是普通文本");
          return [];
        }
      }
      if (source === null || source === undefined || source === "") return [];
      if (!Array.isArray(source)) {
        errors.push("倍率记录必须是数组");
        return [];
      }
      if (source.length > MAX_MULTIPLIERS_PER_MATCH) {
        errors.push(`单场比赛最多导入 ${MAX_MULTIPLIERS_PER_MATCH} 条倍率记录`);
      }
      return source.slice(0, MAX_MULTIPLIERS_PER_MATCH).map((item, index) =>
        this.normalizeMultiplier(item, index, errors)).filter(Boolean);
    },
    normalizeMultiplier(source, index, errors) {
      const prefix = `第 ${index + 1} 条倍率记录`;
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        errors.push(`${prefix}必须是对象`);
        return null;
      }
      const row = {};
      MULTIPLIER_TEXT_FIELDS.forEach((field) => {
        row[field.key] = textValue(this.pickAliases(source, field.aliases));
      });
      row.sourceTime = this.normalizeDateTime(row.sourceTime);
      if (row.sourceTime && !this.isDateTime(row.sourceTime)) {
        errors.push(`${prefix}的来源时间格式应为 yyyy-MM-dd HH:mm:ss`);
      }
      row.activeFlag = row.activeFlag.toUpperCase();
      if (row.activeFlag && !["Y", "N"].includes(row.activeFlag)) {
        errors.push(`${prefix}的有效状态只能为 Y 或 N`);
      }
      MULTIPLIER_VALUE_FIELDS.forEach((field) => {
        row[field.key] = this.normalizeDecimal(this.pickAliases(source, field.aliases), `${prefix}的${field.label}`,
          errors, field.allowZero);
      });
      MULTIPLIER_WEIGHT_FIELDS.forEach((field) => {
        const valueText = textValue(this.pickAliases(source, field.aliases));
        if (!valueText) {
          row[field.key] = "";
          return;
        }
        const numeric = Number(valueText);
        if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) {
          errors.push(`${prefix}的${field.label}必须在 0 到 1 之间`);
          row[field.key] = valueText;
          return;
        }
        row[field.key] = valueText;
      });
      return row;
    },
    normalizeDateTime(value) {
      let normalized = textValue(value);
      if (!normalized) return "";
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
        normalized = normalized.replace("T", " ");
        if (normalized.length === 16) normalized += ":00";
      }
      return normalized;
    },
    isDateTime(value) {
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
        && Number.isFinite(new Date(value.replace(/-/g, "/")).getTime());
    },
    normalizeDecimal(value, label, errors, allowZero) {
      const normalized = textValue(value);
      if (!normalized) {
        errors.push(`${label}不能为空`);
        return "";
      }
      if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
        errors.push(`${label}必须是数字`);
        return normalized;
      }
      const numeric = Number(normalized);
      if (!Number.isFinite(numeric) || (allowZero ? numeric < 0 : numeric <= 0)) {
        errors.push(allowZero ? `${label}不能小于 0` : `${label}必须大于 0`);
      }
      return normalized;
    },
    formatMatchResult(value) {
      return MATCH_RESULT_LABELS[value] || "未登记";
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
    buildMultiplierPayload(row) {
      const payload = {};
      [...MULTIPLIER_TEXT_FIELDS, ...MULTIPLIER_VALUE_FIELDS, ...MULTIPLIER_WEIGHT_FIELDS].forEach((field) => {
        if (row[field.key]) payload[field.key] = row[field.key];
      });
      return payload;
    },
    // 只提交界面暴露的业务字段，前端预览时的 rowKey、valid 和 errors 不进入后端契约。
    buildCanonicalRow(row) {
      if (this.isResultMode) {
        const payload = { matchCode: row.matchCode };
        if (row.matchResult) payload.matchResult = row.matchResult;
        if (row.multiplierResult) payload.multiplierResult = row.multiplierResult;
        if (row.multipliers.length) payload.multipliers = row.multipliers.map(this.buildMultiplierPayload);
        return payload;
      }
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
        multiplierResult: row.multiplierResult,
        multipliers: row.multipliers.map(this.buildMultiplierPayload),
        matchRemark: row.matchRemark,
      };
    },
    submitImport() {
      if (!this.selectedRows.length || this.importing) return;
      this.importing = true;
      const rows = this.selectedRows.map(this.buildCanonicalRow);
      const request = this.isResultMode ? importMatchResultJson(rows) : importMatchJson(rows);
      request.then((response) => {
        const entityLabel = this.modeMeta.entityLabel;
        this.$modal.msgSuccess((response && response.msg) || `${entityLabel}导入成功，共 ${rows.length} 条`);
        this.$emit("imported", response);
        this.closeDrawer();
      }).catch(() => {
      }).finally(() => {
        this.importing = false;
      });
    },
    downloadTemplate() {
      const content = this.isResultMode
        ? buildDortmundMatchResultImportTemplate()
        : buildDortmundMatchImportTemplate();
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      this.$download.saveAs(blob, this.modeMeta.templateName);
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
      this.importType = "match";
      this.sourceType = "paste";
      this.parseMessage = "";
      this.parsed = false;
      this.parsing = false;
      this.importing = false;
      this.parsedRows = [];
      this.selectedRows = [];
      this.selectedPromptMatches = [];
      this.matchSelectorVisible = false;
      this.promptVisible = false;
      this.formatVisible = false;
      this.aiPrompt = "";
      this.rawJson = "";
      this.fileName = "";
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

.match-prompt-scope {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  background: #f5fbf7;
  border: 1px solid #dcece2;
  border-radius: 9px;

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.65;
    color: #4b6b58;
    overflow-wrap: anywhere;
  }
}

.match-prompt-scope-label {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.65;
  color: #268c55;
}
</style>
