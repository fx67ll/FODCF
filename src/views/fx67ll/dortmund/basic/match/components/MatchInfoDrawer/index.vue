<template>
  <el-drawer :visible.sync="drawerVisible" title="比赛关联信息点" :size="drawerSize" direction="rtl" append-to-body
    destroy-on-close custom-class="match-info-drawer" :wrapper-closable="false" @opened="handleOpened"
    @closed="handleClosed">
    <div class="match-info-drawer-body">
      <div class="match-info-summary" v-if="match">
        <div class="match-info-summary-icon"><i class="el-icon-notebook-2"></i></div>
        <div class="match-info-summary-copy">
          <div class="match-info-summary-title">
            <strong>{{ matchSummary }}</strong>
            <el-tag size="mini" effect="plain" type="success">比赛 #{{ match.matchId }}</el-tag>
          </div>
          <div class="match-info-summary-meta">
            <span v-if="match.matchCode"><i class="el-icon-tickets"></i>{{ match.matchCode }}</span>
            <span><i class="el-icon-time"></i>{{ matchTimeText }}</span>
            <span><i class="el-icon-location-outline"></i>{{ match.matchVenue || "未填写球队主场" }}</span>
          </div>
        </div>
      </div>

      <div class="match-info-toolbar">
        <div class="match-info-heading">
          <div class="match-info-heading-title">
            <i class="el-icon-document-copy"></i>
            <strong>关联信息点</strong>
            <span>共 {{ total }} 条</span>
          </div>
          <p>新增、编辑、启停与删除均在此面板完成，无需跳转页面</p>
        </div>
        <div class="match-info-toolbar-actions">
          <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-refresh" :loading="loading"
            @click="load">刷新</el-button>
          <el-button size="mini" type="success" plain icon="el-icon-plus" :disabled="!currentMatchId"
            @click="openCreate" v-hasPermi="['dortmund:info:point:add']">新增信息点</el-button>
        </div>
      </div>

      <div v-if="loadError" class="match-info-error" role="alert">
        <i class="el-icon-warning-outline"></i>
        <span>关联信息点加载失败，请检查网络后重试；若持续失败，请联系管理员并提供比赛编号 #{{ currentMatchId || "-" }}。</span>
        <el-button type="text" icon="el-icon-refresh" @click="load">重新加载</el-button>
      </div>

      <div v-if="actionError" class="match-info-error" role="alert">
        <i class="el-icon-warning-outline"></i>
        <span>{{ actionError }}</span>
        <el-button type="text" icon="el-icon-close" @click="actionError = ''">关闭</el-button>
      </div>

      <transition name="match-info-editor-rise">
        <div v-if="editorVisible" class="match-info-editor">
          <div class="match-info-editor-head">
            <div class="match-info-editor-copy">
              <span class="match-info-editor-icon"><i class="el-icon-edit-outline"></i></span>
              <div>
                <strong>{{ editorTitle }}</strong>
                <p>{{ editorHint }}</p>
              </div>
            </div>
            <el-button type="text" class="dortmund-theme-text" icon="el-icon-arrow-up" :disabled="submitting"
              @click="closeEditor">收起</el-button>
          </div>
          <div v-if="editorError" class="match-info-editor-error" role="alert">
            <i class="el-icon-warning-outline"></i>
            <span>{{ editorError }}</span>
          </div>
          <dortmund-info-point-form ref="infoForm" :form="form" :mode="editorMode" show-advanced
            :label-width="labelWidth" :loading="editorLoading || submitting" />
          <div class="match-info-editor-footer">
            <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" :disabled="editorLoading"
              @click="handleSubmit">{{ editorSaveLabel }}</el-button>
            <el-button class="dortmund-theme-cancel" :disabled="submitting" @click="closeEditor">取 消</el-button>
          </div>
        </div>
      </transition>

      <div class="match-info-list-card">
        <el-table ref="infoTable" v-loading="loading" :data="rows" row-key="infoPointId" size="small"
          empty-text="暂无关联信息点">
          <el-table-column type="expand" width="42">
            <template slot-scope="scope">
              <div class="match-info-detail">
                <div class="match-info-detail-block">
                  <span>信息内容</span>
                  <p>{{ scope.row.pointContent || "-" }}</p>
                </div>
                <div class="match-info-detail-grid">
                  <div>
                    <span>来源地址</span>
                    <a v-if="sourceHref(scope.row.sourceUrl)" :href="sourceHref(scope.row.sourceUrl)" target="_blank"
                      rel="noopener noreferrer">{{ scope.row.sourceUrl }}</a>
                    <p v-else>{{ scope.row.sourceUrl || "-" }}</p>
                  </div>
                  <div>
                    <span>来源发布时间</span>
                    <p>{{ formatDateTime(scope.row.sourcePublishTime) }}</p>
                  </div>
                  <div>
                    <span>生效时间</span>
                    <p>{{ formatDateTime(scope.row.effectiveStartTime) }}</p>
                  </div>
                  <div>
                    <span>失效时间</span>
                    <p>{{ formatDateTime(scope.row.effectiveEndTime) }}</p>
                  </div>
                </div>
                <div class="match-info-detail-block" v-if="scope.row.pointRemark">
                  <span>备注</span>
                  <p>{{ scope.row.pointRemark }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="信息点标题" prop="pointTitle" min-width="170" show-overflow-tooltip />
          <el-table-column label="信息来源" prop="sourceName" width="130" show-overflow-tooltip />
          <el-table-column label="采集时间" align="center" width="150" class-name="dortmund-nowrap-cell">
            <template slot-scope="scope">{{ formatDateTime(scope.row.collectTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_normal_disable || []" :value="scope.row.pointStatus" />
            </template>
          </el-table-column>
          <el-table-column label="可公开" align="center" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_allow_public || []" :value="scope.row.allowPublic" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="122" fixed="right">
            <template slot-scope="scope">
              <template v-if="pendingDeleteId === scope.row.infoPointId">
                <span class="match-info-delete-confirm">确认删除？</span>
                <dortmund-action-button label="确认删除" action="delete" :loading="deletingId === scope.row.infoPointId"
                  @click="handleDelete(scope.row)" />
                <dortmund-action-button label="取消" icon="el-icon-close" action="cancel" @click="cancelDelete" />
              </template>
              <template v-else>
                <dortmund-action-button label="编辑" icon="el-icon-edit" action="edit" @click="openEdit(scope.row)"
                  v-hasPermi="['dortmund:info:point:edit']" />
                <dortmund-action-button :label="scope.row.pointStatus === '0' ? '停用' : '启用'"
                  :icon="scope.row.pointStatus === '0' ? 'el-icon-turn-off' : 'el-icon-video-play'"
                  :action="scope.row.pointStatus === '0' ? 'disable' : 'enable'"
                  :loading="statusChangingId === scope.row.infoPointId" @click="handleChangeStatus(scope.row)"
                  v-hasPermi="['dortmund:info:point:changeStatus']" />
                <dortmund-action-button label="删除" icon="el-icon-delete" action="delete"
                  @click="prepareDelete(scope.row)" v-hasPermi="['dortmund:info:point:remove']" />
              </template>
            </template>
          </el-table-column>
          <template slot="empty">
            <div class="match-info-empty">
              <i :class="loadError ? 'el-icon-warning-outline' : 'el-icon-notebook-2'"></i>
              <p>{{ loadError ? "关联信息点暂不可用，请重新加载" : "当前比赛还没有关联信息点" }}</p>
              <el-button v-if="!loadError" size="mini" type="success" plain icon="el-icon-plus" @click="openCreate"
                v-hasPermi="['dortmund:info:point:add']">新增第一条</el-button>
            </div>
          </template>
        </el-table>
      </div>
      <pagination v-show="total > 0" :total="total" :page.sync="pageNum" :limit.sync="pageSize" :page-sizes="pageSizes"
        :auto-scroll="false" @pagination="load" />
    </div>
  </el-drawer>
</template>

<script>
import {
  listInfoPoint,
  getInfoPoint,
  addInfoPoint,
  updateInfoPoint,
  delInfoPoint,
  changeInfoPointStatus,
} from "@/api/fx67ll/dortmund/infoPoint";
import DortmundInfoPointForm from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointForm/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "MatchInfoDrawer",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_allow_public"],
  components: { DortmundInfoPointForm, DortmundActionButton },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    match: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1440,
      labelWidth: "130px",
      loading: false,
      loadError: false,
      actionError: "",
      rows: [],
      total: 0,
      pageNum: 1,
      pageSize: DORTMUND_PAGINATION.defaultPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      loadSerial: 0,
      loadedMatchId: null,
      editorVisible: false,
      editorMode: "add",
      editorLoading: false,
      editorLoadSerial: 0,
      submitting: false,
      editorError: "",
      form: null,
      pendingDeleteId: null,
      deletingId: null,
      statusChangingId: null,
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
    drawerSize() {
      if (this.viewportWidth < 768) {
        return "100%";
      }
      if (this.viewportWidth < 1400) {
        return "94%";
      }
      return "1080px";
    },
    currentMatchId() {
      return this.match && this.match.matchId ? this.match.matchId : null;
    },
    matchSummary() {
      if (!this.match) {
        return "比赛详情";
      }
      return `${this.match.homeTeamName || "主队"} vs ${this.match.awayTeamName || "客队"}`;
    },
    matchTimeText() {
      return this.parseTime(this.match && this.match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") || "未填写比赛时间";
    },
    editorTitle() {
      return this.editorMode === "update" ? "编辑关联信息点" : "新增关联信息点";
    },
    editorHint() {
      return this.editorMode === "update"
        ? "归属创建后不可修改；保存失败时表单会保留，便于修正后直接重试"
        : "信息点将直接归属当前比赛；保存失败时表单会保留，便于修正后直接重试";
    },
    editorSaveLabel() {
      return this.editorMode === "update" ? "保存修改" : "保存信息点";
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.editorVisible = false;
        this.actionError = "";
        this.load();
        return;
      }
      this.editorVisible = false;
      this.pendingDeleteId = null;
    },
    currentMatchId(value, oldValue) {
      if (!this.visible || String(value || "") === String(oldValue || "")) {
        return;
      }
      this.closeEditor();
      this.actionError = "";
      this.load();
    },
  },
  created() {
    this.form = this.buildEmptyForm();
  },
  mounted() {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleViewportResize);
    }
  },
  beforeDestroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleViewportResize);
    }
  },
  methods: {
    handleViewportResize() {
      if (typeof window !== "undefined") {
        this.viewportWidth = window.innerWidth;
      }
    },
    handleOpened() {
      this.$nextTick(() => {
        if (this.$refs.infoTable) {
          this.$refs.infoTable.doLayout();
        }
        this.$emit("opened");
      });
    },
    handleClosed() {
      this.loadSerial += 1;
      this.editorLoadSerial += 1;
      this.loading = false;
      this.editorVisible = false;
      this.editorLoading = false;
      this.editorError = "";
      this.pendingDeleteId = null;
      this.actionError = "";
    },
    // 拉取当前比赛的全部信息点，刷新失败时保留已有行并显示可重试提示
    load() {
      if (!this.visible) {
        this.loading = false;
        return;
      }
      const matchId = this.currentMatchId;
      if (!matchId) {
        this.rows = [];
        this.total = 0;
        this.loading = false;
        this.loadError = false;
        return;
      }
      const serial = ++this.loadSerial;
      if (String(this.loadedMatchId || "") !== String(matchId)) {
        this.rows = [];
        this.total = 0;
        this.pageNum = 1;
      }
      this.loading = true;
      this.loadError = false;
      this.actionError = "";
      listInfoPoint({
        infoPointType: "M",
        matchId,
        pageNum: this.pageNum,
        pageSize: this.pageSize,
      }).then((response) => {
        if (serial !== this.loadSerial) {
          return;
        }
        let payload = response || {};
        if (payload.data && payload.data.rows) {
          payload = payload.data;
        }
        const rows = Array.isArray(payload.rows) ? payload.rows : Array.isArray(payload) ? payload : [];
        this.rows = rows;
        this.total = Number(payload.total) || rows.length;
        const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize));
        if (this.pageNum > maxPage) {
          this.pageNum = maxPage;
          this.load();
          return;
        }
        this.loadedMatchId = matchId;
        this.pendingDeleteId = null;
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
    buildEmptyForm() {
      return {
        infoPointId: null,
        infoPointType: "M",
        seasonId: null,
        matchId: this.currentMatchId,
        teamIds: [],
        pointTitle: null,
        pointContent: null,
        sourceName: null,
        sourceUrl: null,
        sourcePublishTime: null,
        collectTime: this.parseTime(new Date(), "{y}-{m}-{d} {h}:{i}:{s}"),
        effectiveStartTime: null,
        effectiveEndTime: null,
        allowPublic: "0",
        pointRemark: null,
      };
    },
    buildFormFromSource(source) {
      const form = this.buildEmptyForm();
      const fields = [
        "infoPointId",
        "pointTitle",
        "pointContent",
        "sourceName",
        "sourceUrl",
        "sourcePublishTime",
        "collectTime",
        "effectiveStartTime",
        "effectiveEndTime",
        "allowPublic",
        "pointRemark",
      ];
      fields.forEach((field) => {
        if (source[field] !== undefined) {
          form[field] = source[field];
        }
      });
      form.infoPointType = "M";
      form.matchId = this.currentMatchId;
      form.seasonId = null;
      form.teamIds = [];
      form.allowPublic = source.allowPublic || "0";
      return form;
    },
    openCreate() {
      if (!this.currentMatchId) {
        return;
      }
      this.editorLoadSerial += 1;
      this.editorMode = "add";
      this.editorLoading = false;
      this.editorError = "";
      this.form = this.buildEmptyForm();
      this.editorVisible = true;
      this.$nextTick(() => this.$refs.infoForm && this.$refs.infoForm.clearValidate());
    },
    openEdit(row) {
      const serial = ++this.editorLoadSerial;
      this.editorMode = "update";
      this.editorError = "";
      this.form = this.buildFormFromSource(row);
      this.editorVisible = true;
      this.editorLoading = true;
      getInfoPoint(row.infoPointId).then((response) => {
        if (serial !== this.editorLoadSerial) {
          return;
        }
        const detail = (response && response.data) || {};
        if (!detail.infoPointId) {
          throw new Error("信息点不存在或已删除，请刷新后重试");
        }
        this.form = this.buildFormFromSource(detail);
        this.$nextTick(() => this.$refs.infoForm && this.$refs.infoForm.clearValidate());
      }).catch((error) => {
        if (serial === this.editorLoadSerial) {
          this.editorVisible = false;
          this.actionError = this.describeError(
            error,
            `信息点 #${row.infoPointId || "-"} 详情加载失败，请刷新列表后重试`
          );
        }
      }).finally(() => {
        if (serial === this.editorLoadSerial) {
          this.editorLoading = false;
        }
      });
    },
    closeEditor() {
      this.editorLoadSerial += 1;
      this.editorVisible = false;
      this.editorError = "";
      this.editorLoading = false;
      this.$nextTick(() => this.$refs.infoForm && this.$refs.infoForm.clearValidate());
    },
    handleSubmit() {
      if (!this.currentMatchId || !this.$refs.infoForm || this.editorLoading || this.submitting) {
        return;
      }
      this.$refs.infoForm.validate().then((valid) => {
        if (!valid) {
          return;
        }
        const data = this.$refs.infoForm.getSubmitData();
        const content = {
          pointTitle: data.pointTitle,
          pointContent: data.pointContent,
          sourceName: data.sourceName,
          sourceUrl: data.sourceUrl,
          sourcePublishTime: data.sourcePublishTime,
          collectTime: data.collectTime,
          effectiveStartTime: data.effectiveStartTime,
          effectiveEndTime: data.effectiveEndTime,
          allowPublic: data.allowPublic,
          pointRemark: data.pointRemark,
        };
        const request = this.editorMode === "add"
          ? addInfoPoint({ ...content, infoPointType: "M", matchId: this.currentMatchId })
          : updateInfoPoint({ ...content, infoPointId: data.infoPointId });
        this.submitting = true;
        this.editorError = "";
        request.then(() => {
          this.$modal.msgSuccess(this.editorMode === "add" ? "信息点新增成功" : "信息点修改成功");
          this.editorVisible = false;
          if (this.editorMode === "add") {
            this.pageNum = 1;
          }
          this.load();
          this.$emit("refresh");
        }).catch((error) => {
          // 后端业务提示由请求拦截器统一展示，这里补充可保留的表单内兜底说明
          this.editorError = this.describeError(error, "信息点保存失败，请检查填写内容后重试");
        }).finally(() => {
          this.submitting = false;
        });
      });
    },
    handleChangeStatus(row) {
      const targetStatus = row.pointStatus === "0" ? "1" : "0";
      const actionText = targetStatus === "0" ? "启用" : "停用";
      this.statusChangingId = row.infoPointId;
      this.actionError = "";
      changeInfoPointStatus({ infoPointId: row.infoPointId, pointStatus: targetStatus }).then(() => {
        this.$modal.msgSuccess(`${actionText}成功`);
        this.load();
        this.$emit("refresh");
      }).catch((error) => {
        this.actionError = this.describeError(error, `信息点${actionText}失败，请刷新后重试`);
      }).finally(() => {
        this.statusChangingId = null;
      });
    },
    prepareDelete(row) {
      this.pendingDeleteId = row.infoPointId;
      this.actionError = "";
    },
    cancelDelete() {
      this.pendingDeleteId = null;
    },
    handleDelete(row) {
      this.deletingId = row.infoPointId;
      this.actionError = "";
      delInfoPoint(row.infoPointId).then(() => {
        this.$modal.msgSuccess("信息点删除成功");
        this.pendingDeleteId = null;
        this.load();
        this.$emit("refresh");
      }).catch((error) => {
        this.actionError = this.describeError(error, "信息点删除失败，请刷新后重试");
      }).finally(() => {
        this.deletingId = null;
      });
    },
    describeError(error, fallback) {
      const message = error && error.message ? String(error.message).trim() : "";
      if (!message || message === "Network Error") {
        return fallback;
      }
      return message.indexOf(fallback) === 0 ? message : `${fallback}：${message}`;
    },
    formatDateTime(value) {
      if (!value || value === "-") {
        return "-";
      }
      return this.parseTime(value, "{y}-{m}-{d} {h}:{i}:{s}") || "-";
    },
    sourceHref(value) {
      const url = value ? String(value).trim() : "";
      return /^https?:\/\//i.test(url) ? url : "";
    },
  },
};
</script>

<style lang="scss" scoped>
.match-info-drawer-body {
  min-height: 100%;
  padding: 18px 20px 28px;
  background: #f7f9f8;
}

.match-info-summary {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 17px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #e7f8ee 100%);
  border: 1px solid #dcebe3;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.08);
}

.match-info-summary-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.28);
}

.match-info-summary-copy {
  min-width: 0;
}

.match-info-summary-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  strong {
    color: #26362f;
    font-size: 15px;
  }
}

.match-info-summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 14px;
  margin-top: 6px;
  color: #7c8b84;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.match-info-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.match-info-heading {
  min-width: 0;
}

.match-info-heading-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #2b3a36;
  font-size: 14px;

  >i {
    color: #27ad60;
  }

  span {
    color: #7c8b84;
    font-size: 12px;
    font-weight: 400;
  }
}

.match-info-heading p {
  margin: 4px 0 0;
  color: #8a9791;
  font-size: 12px;
  line-height: 1.5;
}

.match-info-toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.match-info-error {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 9px 12px;
  margin-bottom: 12px;
  color: #a66a18;
  font-size: 12px;
  line-height: 1.5;
  background: #fdf6ec;
  border: 1px solid #f7dfb7;
  border-radius: 10px;

  >i {
    flex-shrink: 0;
    font-size: 15px;
  }

  >span {
    flex: 1;
    min-width: 180px;
  }

  .el-button {
    flex-shrink: 0;
    padding: 0;
  }
}

.match-info-editor {
  padding: 16px;
  margin-bottom: 16px;
  background: #f2faf6;
  border: 1px solid #dcebe3;
  border-radius: 14px;
}

.match-info-editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.match-info-editor-copy {
  display: flex;
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
    line-height: 1.5;
  }
}

.match-info-editor-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: #27ad60;
  font-size: 15px;
  background: #e7f8ee;
  border-radius: 9px;
}

.match-info-editor-error {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 12px;
  margin-bottom: 12px;
  color: #c45656;
  font-size: 12px;
  line-height: 1.5;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 9px;

  >i {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.match-info-editor-footer {
  padding: 14px;
  text-align: center;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
}

.match-info-editor-rise-enter-active,
.match-info-editor-rise-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.match-info-editor-rise-enter,
.match-info-editor-rise-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.match-info-list-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.06);

  ::v-deep th.el-table__cell {
    color: #53635b;
    background: #f3f7f5;
  }

  ::v-deep .el-table__expanded-cell {
    padding: 0 !important;
    background: #fbfdfc;
  }
}

.match-info-detail {
  padding: 14px 18px 16px;
  color: #52615a;
  font-size: 12px;
  line-height: 1.65;
  border-top: 1px solid #eef4f0;
}

.match-info-detail-block {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  >span {
    display: block;
    margin-bottom: 4px;
    color: #8a9791;
    font-size: 11px;
  }

  p {
    margin: 0;
    color: #2b3a36;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  a {
    color: #27ad60;
    word-break: break-all;
  }
}

.match-info-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-bottom: 12px;

  >div>span {
    display: block;
    margin-bottom: 3px;
    color: #8a9791;
    font-size: 11px;
  }

  p {
    margin: 0;
    color: #2b3a36;
  }
}

.match-info-delete-confirm {
  margin-right: 3px;
  color: #f56c6c;
  font-size: 12px;
}

.match-info-delete-button {
  color: #e65c5c;
}

.match-info-empty {
  padding: 28px 0;
  color: #909b96;

  i {
    color: #b8c2bd;
    font-size: 28px;
  }

  p {
    margin: 7px 0 11px;
  }
}

.match-info-limit-hint {
  margin: 9px 2px 0;
  color: #8a9791;
  font-size: 12px;
}

@media (max-width: 767px) {
  .match-info-drawer-body {
    padding: 12px;
  }

  .match-info-summary {
    align-items: flex-start;
  }

  .match-info-toolbar,
  .match-info-editor-head {
    align-items: stretch;
    flex-direction: column;
  }

  .match-info-toolbar-actions {
    width: 100%;
  }

  .match-info-toolbar-actions .el-button {
    flex: 1;
  }

  .match-info-editor {
    padding: 12px;
  }
}
</style>

<style lang="scss">
.match-info-drawer {
  border-radius: 14px 0 0 14px;
  box-shadow: -12px 0 36px rgba(31, 61, 46, 0.16);

  .el-drawer__header {
    padding: 18px 22px 15px;
    margin-bottom: 0;
    color: #26362f;
    font-weight: 700;
    border-bottom: 1px solid #e3e9e6;
  }

  .el-drawer__body {
    overflow: auto;
  }
}

@media (max-width: 767px) {
  .match-info-drawer {
    border-radius: 0;

    .el-drawer__header {
      padding: 16px 14px 13px;
    }
  }
}
</style>
