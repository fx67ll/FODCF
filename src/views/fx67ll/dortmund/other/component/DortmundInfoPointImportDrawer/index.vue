<template>
  <div class="dortmund-info-import-entry">
    <dortmund-json-import-shell :visible.sync="drawerVisible" title="信息点 JSON 导入"
      subtitle="粘贴或选择第三方 AI 整理的信息点 JSON，预览校验后批量写入统一信息点。" icon="el-icon-notebook-2" entity-label="信息点"
      intro-title="先解析校验，再选择需要写入的信息点"
      intro-description="支持粘贴标准 JSON 或选择 JSON 文件。解析后进入勾选步骤，确认写入前不会写入任何信息点；只有勾选且通过服务端校验的条目才会落库，任一条失败整批回滚。"
      source-hint="JSON 顶层可以是 infoPoints 数组，也可以直接是数组。"
      placeholder='请粘贴标准 JSON，例如：{"infoPoints":[{ "infoPointType": "T", "seasonName": "...", "teamCodes": "TEAM001,TEAM002", "pointTitle": "..." }]}'
      idle-tip="解析只做前端结构校验，最终赛季、球队、比赛引用和写入结果以后端为准。" parsed-tip="请在预览中勾选需要导入的信息点；点击底部按钮后还需在确认弹窗中确认写入，未勾选条目不会写入。"
      :raw-json.sync="rawJson" :source-type.sync="sourceType" :file-name="fileName" :parsed="parsed" :parsing="parsing"
      :importing="importing" :parse-message="parseMessage" :total-count="parsedRows.length" :valid-count="validCount"
      :invalid-count="invalidCount" :selected-count="selectedCount" has-prompt @raw-input="markDirty"
      @source-type-change="handleSourceTypeChange" @file-change="handleFileChange" @clear="clearSource"
      @parse="parseJson" @select-all="selectAllValid" @clear-selection="clearSelection" @import="submitImport"
      @download-template="downloadTemplate" @show-prompt="handleShowPromptFallback" @show-format="formatVisible = true"
      @closed="resetDrawer">
      <template slot="prompt-action">
        <dortmund-prompt-type-menu title="选择信息点采集范围" subtitle="按球队生成 T 类型，或按比赛生成 M 类型" tip="提示词会写入所选对象的平台编码，未选目标不会生成。"
          :options="promptTypeOptions" :disabled="importing" @select="handlePromptCollectionType" />
      </template>
      <template slot="preview">
        <el-table ref="previewTable" :data="parsedRows" size="mini" border max-height="430" row-key="rowKey"
          class="json-import-table json-import-info-table" :row-class-name="rowClassName"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="46" align="center" :selectable="isRowSelectable" />
          <el-table-column prop="sequence" label="序号" width="58" align="center" />
          <el-table-column label="类型" width="116" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.infoPointType === 'T' ? 'success' : 'warning'" effect="plain">
                {{ scope.row.infoPointType === "T" ? "赛季球队" : scope.row.infoPointType === "M" ? "比赛临时" : "待修正" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="信息点标题" prop="pointTitle" min-width="180" show-overflow-tooltip />
          <el-table-column label="关联对象" min-width="240" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatAssociation(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="信息来源" prop="sourceName" min-width="120" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.pointStatus === '1' ? 'info' : 'success'" effect="plain">
                {{ scope.row.pointStatus === "1" ? "停用" : "启用" }}
              </el-tag>
            </template>
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

    <dortmund-import-auxiliary-drawer :visible.sync="teamPromptDialogVisible" title="选择球队采集范围"
      subtitle="先确定赛季与目标球队，再生成 T 类型采集提示词" icon="el-icon-user" size="760px"
      footer-tip="提示词会原样写入平台球队编码，第三方 AI 不得猜测或扩展目标范围。" @closed="resetTeamPromptDraft">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-user"></i></span>
        <p>先选择赛季和目标球队，再生成只包含 T 类型信息的采集提示词；球队编码会原样写入提示词，第三方 AI 不得猜测。</p>
      </div>
      <el-form class="info-prompt-target-form" label-width="88px" size="small">
        <el-form-item label="所属赛季" required>
          <dortmund-season-select v-model="promptSeasonId" width="100%" @loaded="handlePromptSeasonLoaded" />
        </el-form-item>
        <el-form-item label="目标球队" required>
          <div class="info-prompt-target-picker">
            <el-button type="success" plain icon="el-icon-plus" size="small" @click="openPromptTeamSelector">
              选择球队
            </el-button>
            <span class="info-prompt-target-count">已选 {{ selectedPromptTeams.length }} 支</span>
          </div>
          <div v-if="selectedPromptTeams.length" class="info-prompt-target-tags">
            <el-tag v-for="(team, index) in selectedPromptTeams" :key="team.teamId || team.teamCode" size="small"
              closable effect="plain" @close="removePromptTeam(index)">
              {{ team.teamName || team.teamCode }} <em>{{ team.teamCode }}</em>
            </el-tag>
          </div>
          <p v-else class="info-prompt-target-empty">尚未选择球队。提示词不会在缺少目标编码时生成。</p>
        </el-form-item>
      </el-form>
      <template slot="footer-actions">
        <el-button size="small" type="success" icon="el-icon-s-promotion" :disabled="!canGenerateTeamPrompt"
          @click="showTeamPrompt">生成提示词</el-button>
      </template>
    </dortmund-import-auxiliary-drawer>

    <dortmund-import-auxiliary-drawer :visible.sync="promptVisible" title="AI 采集提示词" subtitle="提示词已绑定当前采集范围与平台编码"
      icon="el-icon-s-promotion" size="880px" footer-tip="复制后请连同采集范围一并交给第三方 AI，系统仍会在写入前执行完整校验。">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-s-promotion"></i></span>
        <p>将下方提示词完整交给具备公开足球资料检索能力的第三方 AI。提示词已绑定你选择的采集范围与平台编码，AI 不得扩展或猜测。</p>
      </div>
      <div class="info-prompt-scope">
        <span class="info-prompt-scope-label"><i class="el-icon-aim"></i>采集范围</span>
        <p>{{ promptScopeSummary }}</p>
      </div>
      <pre class="json-import-code">{{ aiPrompt }}</pre>
      <template slot="footer-actions">
        <el-button size="small" type="success" icon="el-icon-copy-document" :disabled="!aiPrompt"
          @click="copyText(aiPrompt, 'AI 采集提示词已复制')">复制提示词</el-button>
      </template>
    </dortmund-import-auxiliary-drawer>

    <dortmund-import-auxiliary-drawer :visible.sync="formatVisible" title="信息点 JSON 字段格式说明" subtitle="标准字段、必填状态与填写约束"
      icon="el-icon-tickets" size="960px">
      <div class="json-import-dialog-intro">
        <span class="json-import-dialog-intro-mark"><i class="el-icon-document"></i></span>
        <p>字段名保持英文 camelCase。T 类型填写赛季名称和球队编码；M 类型填写比赛编码，两类归属字段不可混用。</p>
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

    <dortmund-team-selector-modal :visible.sync="teamSelectorVisible" multiple :selected-items="selectedPromptTeams"
      @confirm="handlePromptTeamConfirm" />
    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" multiple allow-all-match-statuses
      :selected-items="selectedPromptMatches" @confirm="handlePromptMatchConfirm" />
  </div>
</template>

<script>
import { importInfoPointJson } from "@/api/fx67ll/dortmund/infoPoint";
import {
  DORTMUND_INFO_POINT_IMPORT_FIELDS,
  buildDortmundInfoPointImportPrompt,
  buildDortmundInfoPointImportTemplate,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundJsonImportShell from "@/views/fx67ll/dortmund/other/component/DortmundJsonImportShell/index";
import DortmundImportAuxiliaryDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundImportAuxiliaryDrawer/index";
import DortmundPromptTypeMenu
  from "@/views/fx67ll/dortmund/other/component/DortmundPromptTypeMenu/index";
import DortmundSeasonSelect from "@/views/fx67ll/dortmund/other/component/DortmundSeasonSelect/index";
import DortmundTeamSelectorModal
  from "@/views/fx67ll/dortmund/other/component/DortmundTeamSelectorModal/index";
import DortmundMatchSelectorModal
  from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";

const MAX_IMPORT_ROWS = 1000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const INFO_POINT_TYPES = ["T", "M"];
const STATUS_VALUES = ["", "0", "1"];
const FIELD_ALIASES = Object.freeze({
  infoPointType: ["infoPointType", "信息点类型", "类型"],
  seasonName: ["seasonName", "赛季名称", "赛季"],
  matchCode: ["matchCode", "比赛编码"],
  teamCodes: ["teamCodes", "关联球队编码", "球队编码"],
  pointTitle: ["pointTitle", "信息点标题", "标题"],
  pointContent: ["pointContent", "客观信息内容", "信息点内容", "内容"],
  sourceName: ["sourceName", "信息来源名称", "来源名称"],
  sourceUrl: ["sourceUrl", "来源地址"],
  sourcePublishTime: ["sourcePublishTime", "来源发布时间"],
  collectTime: ["collectTime", "采集或录入时间", "采集时间", "录入时间"],
  effectiveStartTime: ["effectiveStartTime", "生效时间"],
  effectiveEndTime: ["effectiveEndTime", "失效时间"],
  pointStatus: ["pointStatus", "信息点状态", "状态"],
  allowPublic: ["allowPublic", "是否可公开", "可公开"],
  pointRemark: ["pointRemark", "备注"],
});
const DATE_TIME_FIELDS = Object.freeze([
  "sourcePublishTime",
  "collectTime",
  "effectiveStartTime",
  "effectiveEndTime",
]);

function textValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export default {
  name: "DortmundInfoPointImportDrawer",
  components: {
    DortmundJsonImportShell,
    DortmundImportAuxiliaryDrawer,
    DortmundPromptTypeMenu,
    DortmundSeasonSelect,
    DortmundTeamSelectorModal,
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
      promptCollectionType: "",
      promptTarget: null,
      promptSeasonId: null,
      promptSeasonOptions: [],
      selectedPromptTeams: [],
      selectedPromptMatches: [],
      teamPromptDialogVisible: false,
      teamSelectorVisible: false,
      matchSelectorVisible: false,
      formatVisible: false,
      fieldDescriptions: DORTMUND_INFO_POINT_IMPORT_FIELDS,
      aiPrompt: "",
      promptTypeOptions: [
        {
          command: "team",
          label: "按球队采集（T 类型）",
          description: "先选赛季与目标球队，再采集球队背景信息点",
          icon: "el-icon-user",
          tone: "green",
        },
        {
          command: "match",
          label: "按比赛采集（M 类型）",
          description: "先选目标比赛，再采集比赛临时信息点",
          icon: "el-icon-football",
          tone: "orange",
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
    selectedPromptSeasonName() {
      const matched = this.promptSeasonOptions.find((season) =>
        String(season.seasonId) === String(this.promptSeasonId));
      return matched ? matched.seasonName : "";
    },
    canGenerateTeamPrompt() {
      return Boolean(this.selectedPromptSeasonName)
        && this.selectedPromptTeams.length > 0
        && this.selectedPromptTeams.every((team) => Boolean(team.teamCode));
    },
    promptScopeSummary() {
      const target = this.promptTarget;
      if (!target) return "尚未选择采集范围";
      if (target.collectionType === "team") {
        const codes = target.teams.map((team) => team.teamCode).filter(Boolean).join(",");
        return `${target.seasonName} · ${target.teams.length} 支球队 · ${codes}`;
      }
      if (target.collectionType === "match") {
        const codes = target.matches.map((match) => match.matchCode).filter(Boolean).join(",");
        return `${target.matches.length} 场比赛 · ${codes}`;
      }
      return "尚未选择采集范围";
    },
  },
  methods: {
    // 提示词必须先绑定球队或比赛范围，避免第三方 AI 在没有平台编码时自行猜测引用对象。
    handlePromptCollectionType(type) {
      if (this.importing) return;
      if (type === "team") {
        this.promptCollectionType = "team";
        this.teamPromptDialogVisible = true;
        return;
      }
      if (type === "match") {
        this.promptCollectionType = "match";
        this.selectedPromptMatches = [];
        this.matchSelectorVisible = true;
      }
    },
    handleShowPromptFallback() {
      this.$modal.msgInfo("请先从提示词按钮的下拉菜单选择按球队或按比赛采集");
    },
    handlePromptSeasonLoaded(options) {
      this.promptSeasonOptions = Array.isArray(options) ? options : [];
    },
    openPromptTeamSelector() {
      if (!this.promptSeasonId) {
        this.$modal.msgWarning("请先选择所属赛季");
        return;
      }
      this.teamSelectorVisible = true;
    },
    handlePromptTeamConfirm(rows) {
      const selected = Array.isArray(rows) ? rows : [];
      const validTeams = selected.filter((team) => Boolean(team && team.teamCode));
      if (validTeams.length < selected.length) {
        this.$modal.msgWarning("已忽略缺少平台球队编码的记录，请先补齐球队编码");
      }
      this.selectedPromptTeams = validTeams;
      this.teamSelectorVisible = false;
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
      this.showMatchPrompt();
    },
    removePromptTeam(index) {
      this.selectedPromptTeams.splice(index, 1);
    },
    showTeamPrompt() {
      if (!this.canGenerateTeamPrompt) {
        this.$modal.msgWarning("请选择赛季和至少一支带编码的目标球队");
        return;
      }
      this.promptTarget = {
        collectionType: "team",
        seasonName: this.selectedPromptSeasonName,
        teams: this.selectedPromptTeams.map((team) => ({
          teamCode: team.teamCode,
          teamName: team.teamName,
        })),
      };
      this.aiPrompt = buildDortmundInfoPointImportPrompt(new Date(), this.promptTarget);
      this.teamPromptDialogVisible = false;
      this.promptVisible = true;
    },
    showMatchPrompt() {
      const matches = this.selectedPromptMatches.filter((match) => Boolean(match.matchCode));
      if (!matches.length) {
        this.$modal.msgWarning("请选择至少一场带编码的目标比赛");
        return;
      }
      this.promptTarget = {
        collectionType: "match",
        matches: matches.map((match) => ({
          matchCode: match.matchCode,
          homeTeamName: match.homeTeamName,
          awayTeamName: match.awayTeamName,
          matchTime: this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") || "",
        })),
      };
      this.aiPrompt = buildDortmundInfoPointImportPrompt(new Date(), this.promptTarget);
      this.promptVisible = true;
    },
    resetTeamPromptDraft() {
      this.promptSeasonId = null;
      this.promptSeasonOptions = [];
      this.selectedPromptTeams = [];
    },
    // JSON 内容变化后旧预览立即失效，防止用户把修改前的数据提交到后端。
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
          throw new Error(`单次最多导入 ${MAX_IMPORT_ROWS} 条信息点`);
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
        : parsed && Array.isArray(parsed.infoPoints) ? parsed.infoPoints
          : parsed && Array.isArray(parsed.data) ? parsed.data : null;
      if (!rows) {
        throw new Error("JSON 顶层必须是数组，或包含 infoPoints / data 数组");
      }
      if (!rows.length) {
        throw new Error("JSON 中没有可处理的信息点条目");
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
      row.infoPointType = row.infoPointType.toUpperCase();
      row.teamCodes = this.normalizeTeamCodes(row.teamCodes);
      DATE_TIME_FIELDS.forEach((field) => {
        row[field] = this.normalizeDateTime(row[field], field, errors);
      });
      row.pointStatus = row.pointStatus || "0";
      row.allowPublic = row.allowPublic || "0";

      if (!INFO_POINT_TYPES.includes(row.infoPointType)) {
        errors.push("信息点类型只能为 T 或 M");
      }
      if (!row.pointTitle) errors.push("信息点标题不能为空");
      if (!row.pointContent) errors.push("客观信息内容不能为空");
      if (!row.sourceName) errors.push("信息来源名称不能为空");
      if (!STATUS_VALUES.includes(row.pointStatus)) errors.push("信息点状态只能为 0 或 1");
      if (!STATUS_VALUES.includes(row.allowPublic)) errors.push("是否可公开只能为 0 或 1");

      if (row.infoPointType === "T") {
        if (!row.seasonName) errors.push("T 类型必须填写赛季名称");
        if (!row.teamCodes) errors.push("T 类型至少填写一支关联球队编码");
        if (row.matchCode) errors.push("T 类型不能填写比赛编码");
      } else if (row.infoPointType === "M") {
        if (!row.matchCode) errors.push("M 类型必须填写比赛编码");
        if (row.seasonName) errors.push("M 类型不能填写赛季名称");
        if (row.teamCodes) errors.push("M 类型不能填写关联球队编码");
      }

      if (row.effectiveStartTime && row.effectiveEndTime
        && this.toTimestamp(row.effectiveStartTime) > this.toTimestamp(row.effectiveEndTime)) {
        errors.push("生效时间不能晚于失效时间");
      }

      return {
        ...row,
        rowKey: `info-import-${Date.now()}-${index}`,
        sequence: index + 1,
        valid: errors.length === 0,
        errors,
      };
    },
    normalizeTeamCodes(value) {
      const codes = Array.isArray(value)
        ? value
        : textValue(value).split(/[,，;；、\s]+/);
      return [...new Set(codes.map((code) => textValue(code)).filter(Boolean))].join(",");
    },
    normalizeDateTime(value, field, errors) {
      let normalized = textValue(value);
      if (!normalized) return "";
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
        normalized = normalized.replace("T", " ");
        if (normalized.length === 16) normalized += ":00";
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)
        || !Number.isFinite(this.toTimestamp(normalized))) {
        errors.push(`${this.fieldLabel(field)}格式应为 yyyy-MM-dd HH:mm:ss`);
        return "";
      }
      return normalized;
    },
    fieldLabel(field) {
      const matched = DORTMUND_INFO_POINT_IMPORT_FIELDS.find((item) => item.key === field);
      return matched ? matched.label : field;
    },
    toTimestamp(value) {
      const timestamp = new Date(String(value).replace(/-/g, "/")).getTime();
      return Number.isFinite(timestamp) ? timestamp : NaN;
    },
    formatAssociation(row) {
      if (row.infoPointType === "T") {
        return [row.seasonName, row.teamCodes ? `球队 ${row.teamCodes}` : ""].filter(Boolean).join(" · ") || "-";
      }
      if (row.infoPointType === "M") {
        return row.matchCode ? `比赛 ${row.matchCode}` : "-";
      }
      return "-";
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
    // 只提交业务字段；预览行序号、校验标记和错误文本不进入后端接口。
    buildCanonicalRow(row) {
      return {
        infoPointType: row.infoPointType,
        seasonName: row.seasonName,
        matchCode: row.matchCode,
        teamCodes: row.teamCodes,
        pointTitle: row.pointTitle,
        pointContent: row.pointContent,
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl,
        sourcePublishTime: row.sourcePublishTime || null,
        collectTime: row.collectTime || null,
        effectiveStartTime: row.effectiveStartTime || null,
        effectiveEndTime: row.effectiveEndTime || null,
        pointStatus: row.pointStatus,
        allowPublic: row.allowPublic,
        pointRemark: row.pointRemark,
      };
    },
    submitImport() {
      if (!this.selectedRows.length || this.importing) return;
      this.importing = true;
      importInfoPointJson(this.selectedRows.map(this.buildCanonicalRow)).then((response) => {
        this.$modal.msgSuccess((response && response.msg) || `信息点导入成功，共 ${this.selectedRows.length} 条`);
        this.$emit("imported", response);
        this.closeDrawer();
      }).catch(() => {
      }).finally(() => {
        this.importing = false;
      });
    },
    downloadTemplate() {
      const content = buildDortmundInfoPointImportTemplate();
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      this.$download.saveAs(blob, "dortmund-info-point-import-template.json");
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
      this.promptCollectionType = "";
      this.promptTarget = null;
      this.promptSeasonId = null;
      this.promptSeasonOptions = [];
      this.selectedPromptTeams = [];
      this.selectedPromptMatches = [];
      this.teamPromptDialogVisible = false;
      this.teamSelectorVisible = false;
      this.matchSelectorVisible = false;
      this.formatVisible = false;
      this.rawJson = "";
      this.fileName = "";
      this.aiPrompt = "";
    },
  },
};
</script>

<style lang="scss" scoped>
.json-import-info-table {
  width: 100%;
}

.json-import-info-table ::v-deep th {
  font-weight: 600;
  color: #405848;
  background: #f3f9f5;
}

.json-import-info-table ::v-deep .el-table__body tr.is-invalid-row>td {
  background: #fff9f7;
}

.json-import-info-table ::v-deep .el-table__body tr.is-invalid-row:hover>td {
  background: #fff4f0;
}

.info-prompt-target-form {
  padding: 2px 2px 0;
}

.info-prompt-target-picker {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 32px;
}

.info-prompt-target-count {
  font-size: 12px;
  color: #7b9183;
}

.info-prompt-target-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding-top: 3px;

  .el-tag {
    max-width: 100%;
    height: auto;
    padding: 4px 8px;
    line-height: 1.4;
    white-space: normal;
  }

  em {
    margin-left: 5px;
    font-style: normal;
    opacity: 0.72;
  }
}

.info-prompt-target-empty {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #98a89e;
}

.info-prompt-scope {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  margin-bottom: 12px;
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

.info-prompt-scope-label {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.65;
  color: #268c55;
}
</style>
