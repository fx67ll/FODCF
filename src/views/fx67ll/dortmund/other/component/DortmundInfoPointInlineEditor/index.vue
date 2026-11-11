<template>
  <div class="info-inline-editor">
    <div class="info-inline-header">
      <div class="info-inline-title">
        <i class="el-icon-notebook-2"></i>关联信息点
        <span>{{ rows.length }} 条</span>
      </div>
      <el-button type="success" plain size="mini" icon="el-icon-plus" @click="openAdd"
        v-hasPermi="['dortmund:info:point:add']">新增</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" size="small" empty-text="暂无关联信息点">
      <el-table-column label="标题" prop="pointTitle" min-width="170" show-overflow-tooltip />
      <el-table-column label="内容" prop="pointContent" min-width="220" show-overflow-tooltip />
      <el-table-column label="来源" prop="sourceName" min-width="130" show-overflow-tooltip />
      <el-table-column label="生效时间" align="center" width="160">
        <template slot-scope="scope">{{ parseTime(scope.row.effectiveStartTime, "{y}-{m}-{d} {h}:{i}") || "-"
          }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable || []" :value="scope.row.pointStatus" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-edit"
            @click="openEdit(scope.row)" v-hasPermi="['dortmund:info:point:edit']">编辑</el-button>
          <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-delete"
            @click="handleRemove(scope.row)" v-hasPermi="['dortmund:info:point:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <dortmund-info-point-form-dialog :visible.sync="editorVisible" :value="form" :mode="editorMode"
      :info-point-type="anchorType === 'team' ? 'T' : 'M'" :show-season="anchorType === 'team'"
      :show-teams="anchorType === 'team'" show-advanced :selected-teams="selectedTeams" :loading="editLoading"
      :submitting="submitting" dialog-width="860px" @select-teams="teamSelectorVisible = true" @save="handleSubmit" />

    <dortmund-team-selector-modal :visible.sync="teamSelectorVisible" multiple :selected-items="selectedTeams"
      @confirm="handleTeamSelectorConfirm" />
  </div>
</template>

<script>
import { listInfoPoint, getInfoPoint, addInfoPoint, updateInfoPoint, delInfoPoint } from "@/api/fx67ll/dortmund/infoPoint";
import DortmundInfoPointFormDialog from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointFormDialog/index";
import DortmundTeamSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundTeamSelectorModal/index";

export default {
  name: "DortmundInfoPointInlineEditor",
  dicts: ["sys_normal_disable"],
  components: { DortmundInfoPointFormDialog, DortmundTeamSelectorModal },
  props: {
    anchorType: {
      type: String,
      default: "match",
      validator: (value) => ["match", "team"].includes(value),
    },
    matchId: {
      type: [Number, String],
      default: null,
    },
    teamId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      submitting: false,
      editLoading: false,
      rows: [],
      editorVisible: false,
      editorMode: "add",
      selectedTeams: [],
      teamSelectorVisible: false,
      form: this.buildEmptyForm(),
    };
  },
  watch: {
    matchId: {
      immediate: true,
      handler() {
        this.load();
      },
    },
    teamId: {
      immediate: true,
      handler() {
        this.load();
      },
    },
  },
  methods: {
    load() {
      if (this.anchorType === "match" && !this.matchId) {
        this.rows = [];
        return;
      }
      if (this.anchorType === "team" && !this.teamId) {
        this.rows = [];
        return;
      }
      this.loading = true;
      const query = this.anchorType === "match"
        ? { infoPointType: "M", matchId: this.matchId, pageNum: 1, pageSize: 100 }
        : { infoPointType: "T", teamIds: [this.teamId], pageNum: 1, pageSize: 100 };
      listInfoPoint(query).then((response) => {
        this.rows = response.rows || [];
      }).catch(() => {
        this.rows = [];
      }).finally(() => {
        this.loading = false;
      });
    },
    buildEmptyForm() {
      return {
        infoPointId: null,
        infoPointType: this.anchorType === "match" ? "M" : "T",
        seasonId: null,
        matchId: this.anchorType === "match" ? this.matchId : null,
        teamIds: this.anchorType === "team" ? [this.teamId] : [],
        pointTitle: null,
        pointContent: null,
        sourceName: null,
        sourceUrl: null,
        sourcePublishTime: null,
        collectTime: null,
        effectiveStartTime: null,
        effectiveEndTime: null,
        allowPublic: "0",
        pointRemark: null,
      };
    },
    openAdd() {
      this.editorMode = "add";
      this.form = this.buildEmptyForm();
      this.selectedTeams = this.anchorType === "team" && this.teamId
        ? [{ teamId: this.teamId, teamName: `球队 ${this.teamId}` }]
        : [];
      this.editorVisible = true;
    },
    openEdit(row) {
      this.editorMode = "update";
      this.editLoading = true;
      this.editorVisible = true;
      this.form = {
        ...row,
        teamIds: [],
      };
      getInfoPoint(row.infoPointId).then((response) => {
        const detail = response.data || {};
        const activeRels = detail.teamRels || [];
        this.form = { ...row, ...detail, teamIds: activeRels.map((rel) => rel.teamId) };
        this.selectedTeams = activeRels.map((rel) => ({
          teamId: rel.teamId,
          teamName: rel.teamName || `球队 ${rel.teamId}`,
        }));
      }).catch(() => {
        this.editorVisible = false;
        this.$modal.msgError("获取信息点详情失败");
      }).finally(() => {
        this.editLoading = false;
      });
    },
    handleSubmit(form) {
      this.form = { ...this.form, ...form };
      this.submitting = true;
      const data = {
        pointTitle: form.pointTitle,
        pointContent: form.pointContent,
        sourceName: form.sourceName,
        sourceUrl: form.sourceUrl,
        sourcePublishTime: form.sourcePublishTime,
        collectTime: form.collectTime,
        effectiveStartTime: form.effectiveStartTime,
        effectiveEndTime: form.effectiveEndTime,
        allowPublic: form.allowPublic,
        pointRemark: form.pointRemark,
      };
      const request = this.editorMode === "add"
        ? addInfoPoint({
          ...data,
          infoPointType: form.infoPointType,
          seasonId: form.seasonId,
          matchId: form.matchId,
          teamIds: form.teamIds,
        })
        : updateInfoPoint({ ...data, infoPointId: form.infoPointId, teamIds: form.teamIds });
      request.then(() => {
        this.$modal.msgSuccess(this.editorMode === "add" ? "新增成功" : "修改成功");
        this.editorVisible = false;
        this.load();
        this.$emit("refresh");
      }).catch(() => {
      }).finally(() => {
        this.submitting = false;
      });
    },
    handleRemove(row) {
      this.$modal.confirm(`是否删除信息点「${row.pointTitle || row.infoPointId}」？`).then(() => {
        return delInfoPoint(row.infoPointId);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.load();
        this.$emit("refresh");
      }).catch(() => {
      });
    },
    formatSelectedTeams(teams) {
      return (teams || []).map(team => team.teamName).join("、");
    },
    handleTeamSelectorConfirm(teams) {
      this.selectedTeams = teams || [];
      this.form.teamIds = this.selectedTeams.map(team => team.teamId);
    },
  },
};
</script>

<style lang="scss" scoped>
.info-inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-inline-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #2b3a36;

  i {
    color: #2ecc71;
  }

  span {
    font-size: 12px;
    font-weight: 400;
    color: #7c8b84;
  }
}

.info-inline-time-row {
  display: flex;
  align-items: center;
  gap: 8px;

  >span {
    flex-shrink: 0;
  }
}
</style>
