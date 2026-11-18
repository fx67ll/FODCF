<template>
  <div class="odds-inline-editor" v-loading="loading">
    <div class="odds-inline-header">
      <div class="odds-inline-title">
        <i class="el-icon-odometer"></i>
        <span>倍率版本</span>
        <el-tag :type="activeOdds ? 'success' : 'info'" size="small">
          {{ activeOdds ? activeOdds.oddsCode : "暂无有效版本" }}
        </el-tag>
        <span class="odds-inline-count">共 {{ versions.length }} 个版本</span>
      </div>
      <div class="odds-inline-actions">
        <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-refresh" :loading="loading"
          @click="load">刷新</el-button>
        <el-button size="mini" type="success" plain icon="el-icon-plus" @click="openCreate"
          v-hasPermi="['dortmund:odds:add']">新增版本</el-button>
      </div>
    </div>

    <div v-if="loadError" class="odds-inline-error" role="alert">
      <i class="el-icon-warning-outline"></i>
      <span>倍率版本加载失败，请检查网络后重试；若持续失败，请联系管理员查看服务日志。</span>
      <el-button type="text" icon="el-icon-refresh" @click="load">重新加载</el-button>
    </div>

    <div v-if="activeOdds" class="odds-active-card">
      <div class="odds-active-head">
        <div class="odds-active-copy">
          <div class="odds-active-code">
            <i class="el-icon-circle-check"></i>
            <strong>{{ activeOdds.oddsCode }}</strong>
            <el-tag type="success" size="mini" effect="plain">当前有效</el-tag>
          </div>
          <div class="odds-active-meta">
            <span>来源 {{ formatDateTime(activeOdds.sourceTime) }}</span>
            <span>创建 {{ formatDateTime(activeOdds.createTime) }}</span>
            <span v-if="activeOdds.oddsRemark" class="odds-active-remark">{{ activeOdds.oddsRemark }}</span>
          </div>
        </div>
        <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-document-copy"
          @click="openCopy(activeOdds)" v-hasPermi="['dortmund:odds:add']">基于当前版本新建</el-button>
      </div>
      <div class="odds-metric-grid">
        <div class="odds-metric-item" v-for="row in oddsRows" :key="row.key">
          <span>{{ dictValue(row.type) }}</span>
          <strong>{{ formatValue(activeOdds[row.oddsField]) }}</strong>
          <small>权重 {{ formatWeight(activeOdds[row.weightField]) }}</small>
        </div>
      </div>
      <div class="odds-active-extra">
        <span>让分值 <b>{{ formatValue(activeOdds.handicapValue) }}</b></span>
        <span>来源时间 <b>{{ formatDateTime(activeOdds.sourceTime) }}</b></span>
      </div>
    </div>

    <el-empty v-else-if="!loading && !loadError" :image-size="54" description="尚未维护有效倍率，可从新增版本开始" />

    <div class="odds-history-section">
      <div class="odds-subsection-head">
        <div>
          <strong>历史版本</strong>
          <span>有效版本只读；可复制为新版本或切换当前有效版本</span>
        </div>
      </div>
      <el-table :data="versions" size="small" row-key="oddsId" empty-text="暂无倍率版本">
        <el-table-column label="倍率编码" prop="oddsCode" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="96">
          <template slot-scope="scope">
            <el-tag :type="scope.row.activeFlag === 'Y' ? 'success' : 'info'" size="mini">
              {{ scope.row.activeFlag === "Y" ? "有效" : "历史" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源时间" align="center" width="150" class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">{{ formatDateTime(scope.row.sourceTime) }}</template>
        </el-table-column>
        <el-table-column label="让分值" align="center" prop="handicapValue" width="92" />
        <el-table-column label="主/平/客" align="center" min-width="118">
          <template slot-scope="scope">
            {{ formatValue(scope.row.homeWinOdds) }} / {{ formatValue(scope.row.drawOdds) }} /
            {{ formatValue(scope.row.awayWinOdds) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="150" class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="122" fixed="right">
          <template slot-scope="scope">
            <template v-if="pendingDeleteId === scope.row.oddsId">
              <span class="odds-delete-confirm">确认删除？</span>
              <dortmund-action-button label="确认删除" action="delete" :loading="deletingId === scope.row.oddsId"
                @click="handleDelete(scope.row)" />
              <dortmund-action-button label="取消" icon="el-icon-close" action="cancel" @click="pendingDeleteId = null" />
            </template>
            <template v-else>
              <dortmund-action-button v-if="scope.row.activeFlag !== 'Y'" label="设为有效" icon="el-icon-open"
                action="enable" :loading="activatingId === scope.row.oddsId" @click="handleActivate(scope.row)"
                v-hasPermi="['dortmund:odds:activate']" />
              <dortmund-action-button label="复制版本" icon="el-icon-document-copy" action="copy"
                @click="openCopy(scope.row)" v-hasPermi="['dortmund:odds:add']" />
              <dortmund-action-button label="删除" icon="el-icon-delete" action="delete"
                @click="pendingDeleteId = scope.row.oddsId" v-hasPermi="['dortmund:odds:remove']" />
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <transition name="odds-editor-rise">
      <div v-if="editorVisible" class="odds-editor-section">
        <div class="odds-editor-head">
          <div class="odds-editor-head-copy">
            <span class="odds-editor-icon"><i class="el-icon-edit-outline"></i></span>
            <div>
              <strong>{{ editorTitle }}</strong>
              <p>{{ editorHint }}</p>
            </div>
          </div>
          <div class="odds-editor-head-actions">
            <el-checkbox v-model="activateNewVersion">保存后设为有效版本</el-checkbox>
            <el-button type="text" class="dortmund-theme-text" @click="closeEditor">收起</el-button>
          </div>
        </div>
        <el-form ref="oddsForm" :model="form" :rules="rules" label-width="120px" class="odds-inline-form"
          :class="{ 'is-submitting': submitting }">
          <dortmund-odds-form :form="form" />
          <div class="odds-editor-footer">
            <el-button type="success" class="dortmund-theme-confirm" :loading="submitting"
              @click="handleSubmit">保存新版本</el-button>
            <el-button class="dortmund-theme-cancel" :disabled="submitting" @click="closeEditor">取 消</el-button>
          </div>
        </el-form>
      </div>
    </transition>
  </div>
</template>

<script>
import { listOdds, addOdds, activateOdds, delOdds } from "@/api/fx67ll/dortmund/odds";
import DortmundOddsForm from "@/views/fx67ll/dortmund/other/component/DortmundOddsForm/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import {
  ODDS_FORM_FIELDS,
  ODDS_MATRIX_ROWS,
  buildEmptyOdds,
  buildOddsRules,
  formatOddsWeight,
  trimOddsFields,
} from "@/views/fx67ll/dortmund/utils/odds";

export default {
  name: "DortmundOddsInlineEditor",
  dicts: ["fx67ll_dortmund_odds_type"],
  components: { DortmundOddsForm, DortmundActionButton },
  props: {
    matchId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      loadError: false,
      submitting: false,
      activatingId: null,
      deletingId: null,
      pendingDeleteId: null,
      loadSerial: 0,
      versions: [],
      editorVisible: false,
      editorMode: "create",
      editorSourceCode: null,
      activateNewVersion: true,
      form: buildEmptyOdds(),
      oddsRows: ODDS_MATRIX_ROWS,
      rules: buildOddsRules(),
    };
  },
  computed: {
    activeOdds() {
      return this.versions.find((row) => row.activeFlag === "Y") || null;
    },
    editorTitle() {
      return this.editorMode === "copy" ? "复制为新版本" : "新增倍率版本";
    },
    editorHint() {
      if (this.editorMode === "copy" && this.editorSourceCode) {
        return `已复制「${this.editorSourceCode}」的倍率与权重，请填写新的唯一编码`;
      }
      return "录入六类倍率和手工权重，保存后形成新的版本记录";
    },
  },
  watch: {
    matchId: {
      immediate: true,
      handler() {
        this.closeEditor();
        this.load();
      },
    },
  },
  methods: {
    // 一次拉取全部版本并从 activeFlag 识别当前有效版本，避免无有效记录时额外请求报错
    load() {
      if (!this.matchId) {
        this.versions = [];
        this.loadError = false;
        return;
      }
      const serial = ++this.loadSerial;
      this.loading = true;
      this.loadError = false;
      listOdds({ matchId: this.matchId, pageNum: 1, pageSize: 200 }).then((response) => {
        if (serial !== this.loadSerial) {
          return;
        }
        const payload = response && response.data && response.data.rows ? response.data : (response || {});
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        this.versions = [...rows].sort((left, right) => {
          if (left.activeFlag !== right.activeFlag) {
            return left.activeFlag === "Y" ? -1 : 1;
          }
          return String(right.sourceTime || right.createTime || "").localeCompare(
            String(left.sourceTime || left.createTime || "")
          );
        });
      }).catch(() => {
        if (serial === this.loadSerial) {
          this.loadError = true;
        }
      }).finally(() => {
        if (serial === this.loadSerial) {
          this.loading = false;
        }
      });
    },
    openCreate() {
      this.editorMode = "create";
      this.editorSourceCode = null;
      this.activateNewVersion = true;
      this.form = buildEmptyOdds();
      this.editorVisible = true;
      this.$nextTick(() => this.$refs.oddsForm && this.$refs.oddsForm.clearValidate());
    },
    // 只复制数据库认可的倍率字段；编码留空，避免用户误用旧编码触发唯一索引冲突
    openCopy(source) {
      if (!source) {
        return;
      }
      const form = buildEmptyOdds();
      ODDS_FORM_FIELDS.forEach((field) => {
        form[field] = source[field] === undefined ? null : source[field];
      });
      form.oddsCode = null;
      this.form = form;
      this.editorMode = "copy";
      this.editorSourceCode = source.oddsCode;
      this.activateNewVersion = true;
      this.editorVisible = true;
      this.$nextTick(() => this.$refs.oddsForm && this.$refs.oddsForm.clearValidate());
    },
    closeEditor() {
      this.editorVisible = false;
      this.pendingDeleteId = null;
      this.$nextTick(() => this.$refs.oddsForm && this.$refs.oddsForm.clearValidate());
    },
    handleSubmit() {
      this.$refs.oddsForm.validate((valid) => {
        if (!valid) {
          return;
        }
        this.submitting = true;
        addOdds({
          ...trimOddsFields(this.form),
          matchId: this.matchId,
          activeFlag: this.activateNewVersion ? "Y" : "N",
        }).then(() => {
          this.$modal.msgSuccess("倍率版本保存成功");
          this.editorVisible = false;
          this.load();
          this.$emit("refresh");
        }).catch(() => {
          // 后端错误提示由请求拦截器展示，表单保持打开便于修正后重试
        }).finally(() => {
          this.submitting = false;
        });
      });
    },
    handleActivate(row) {
      this.activatingId = row.oddsId;
      activateOdds(row.oddsId).then(() => {
        this.$modal.msgSuccess(`已将「${row.oddsCode}」设为当前有效版本`);
        this.load();
        this.$emit("refresh");
      }).catch(() => {
      }).finally(() => {
        this.activatingId = null;
      });
    },
    handleDelete(row) {
      this.deletingId = row.oddsId;
      delOdds(row.oddsId).then(() => {
        this.$modal.msgSuccess("倍率版本已删除");
        this.pendingDeleteId = null;
        this.load();
        this.$emit("refresh");
      }).catch(() => {
        // 已被回报组合引用等业务限制由后端返回明确提示，保留当前行等待用户处理
      }).finally(() => {
        this.deletingId = null;
      });
    },
    formatDateTime(value) {
      return this.parseTime(value, "{y}-{m}-{d} {h}:{i}") || "-";
    },
    formatValue(value) {
      return value === null || value === undefined || value === "" ? "-" : value;
    },
    formatWeight(value) {
      return formatOddsWeight(value);
    },
    dictValue(type) {
      const item = (this.dict.type.fx67ll_dortmund_odds_type || []).find((option) => option.value === type);
      return item ? item.label : type;
    },
  },
};
</script>

<style lang="scss" scoped>
.odds-inline-editor {
  --odds-inline-accent: #2ecc71;
  --odds-inline-accent-dark: #27ad60;
  --odds-inline-accent-soft: #e7f8ee;
}

.odds-inline-header,
.odds-active-head,
.odds-subsection-head,
.odds-editor-head,
.odds-editor-head-copy,
.odds-editor-head-actions,
.odds-inline-title,
.odds-inline-actions {
  display: flex;
  align-items: center;
}

.odds-inline-header {
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.odds-inline-title {
  gap: 8px;
  color: #2b3a36;
  font-size: 14px;
  font-weight: 700;

  >i {
    color: var(--odds-inline-accent-dark);
  }
}

.odds-inline-count {
  color: #7c8b84;
  font-size: 12px;
  font-weight: 400;
}

.odds-inline-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.odds-inline-error {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  margin-bottom: 12px;
  color: #a66a18;
  font-size: 12px;
  background: #fdf6ec;
  border: 1px solid #f7dfb7;
  border-radius: 10px;

  >i {
    flex-shrink: 0;
    margin-right: 7px;
    font-size: 15px;
  }

  .el-button {
    flex-shrink: 0;
    padding: 0;
    margin-left: auto;
  }
}

.odds-active-card {
  padding: 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f2fbf6 100%);
  border: 1px solid #dcebe3;
  border-left: 4px solid var(--odds-inline-accent);
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.08);
}

.odds-active-head {
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.odds-active-copy {
  min-width: 0;
}

.odds-active-code {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #2b3a36;

  >i {
    color: var(--odds-inline-accent-dark);
  }

  strong {
    font-size: 15px;
  }
}

.odds-active-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 7px;
  color: #7c8b84;
  font-size: 12px;
}

.odds-active-remark {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.odds-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 10px;
}

.odds-metric-item {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 10px;

  span,
  small {
    display: block;
    color: #8a9791;
    font-size: 11px;
  }

  strong {
    display: block;
    margin: 4px 0 2px;
    color: #26362f;
    font-size: 16px;
  }
}

.odds-active-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 12px;
  color: #7c8b84;
  font-size: 12px;

  b {
    color: #2b3a36;
  }
}

.odds-history-section {
  margin-bottom: 16px;
}

.odds-subsection-head {
  justify-content: space-between;
  margin-bottom: 10px;

  strong {
    display: block;
    color: #2b3a36;
    font-size: 14px;
  }

  span {
    display: block;
    margin-top: 3px;
    color: #8a9791;
    font-size: 12px;
  }
}

.odds-delete-confirm {
  margin-right: 4px;
  color: #f56c6c;
  font-size: 12px;
}

.odds-editor-section {
  padding: 16px;
  margin-top: 4px;
  background: #f7fbf9;
  border: 1px solid #dcebe3;
  border-radius: 14px;
}

.odds-editor-head {
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.odds-editor-head-copy {
  align-items: flex-start;
  gap: 10px;

  strong {
    color: #2b3a36;
    font-size: 14px;
  }

  p {
    margin: 3px 0 0;
    color: #7c8b84;
    font-size: 12px;
  }
}

.odds-editor-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: var(--odds-inline-accent-dark);
  background: var(--odds-inline-accent-soft);
  border-radius: 9px;
}

.odds-editor-head-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.odds-inline-form {
  padding: 0;
  background: none;
}

.odds-editor-footer {
  padding: 14px;
  text-align: center;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
}

.odds-editor-rise-enter-active,
.odds-editor-rise-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.odds-editor-rise-enter,
.odds-editor-rise-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 767px) {

  .odds-active-head,
  .odds-editor-head {
    align-items: stretch;
    flex-direction: column;
  }

  .odds-inline-title {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .odds-inline-actions {
    width: 100%;
  }

  .odds-inline-actions .el-button {
    flex: 1;
  }

  .odds-active-card,
  .odds-editor-section {
    padding: 12px;
  }
}
</style>
