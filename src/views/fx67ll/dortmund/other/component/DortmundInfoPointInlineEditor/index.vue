<template>
  <div class="info-inline-editor">
    <div class="info-inline-header">
      <div class="info-inline-title">
        <i class="el-icon-notebook-2"></i>关联信息点
        <span>{{ rows.length }} 条</span>
      </div>
      <el-button type="primary" plain size="mini" icon="el-icon-plus" @click="openAdd"
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
          <el-button size="mini" type="text" icon="el-icon-edit" @click="openEdit(scope.row)"
            v-hasPermi="['dortmund:info:point:edit']">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleRemove(scope.row)"
            v-hasPermi="['dortmund:info:point:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :visible.sync="editorVisible" :title="editorMode === 'add' ? '新增关联信息点' : '编辑关联信息点'" width="860px"
      append-to-body custom-class="info-inline-dialog" :close-on-click-modal="false">
      <el-form ref="editorForm" :model="form" :rules="rules" label-width="104px" v-loading="submitting || editLoading">
        <el-row :gutter="16">
          <el-col :span="12" v-if="anchorType === 'team'">
            <el-form-item label="所属赛季" prop="seasonId">
              <common-enhanced-select ref="seasonSelect" v-model="form.seasonId" valueKey="seasonId"
                labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="anchorType === 'team'">
            <el-form-item label="关联球队" prop="teamIds">
              <el-input :value="formatSelectedTeams(selectedTeams)" readonly placeholder="请选择关联球队"
                @focus="teamSelectorVisible = true" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="信息标题" prop="pointTitle">
              <el-input v-model="form.pointTitle" maxlength="255" show-word-limit placeholder="请输入信息标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="信息内容" prop="pointContent">
              <el-input v-model="form.pointContent" type="textarea" :rows="4" maxlength="1023" show-word-limit
                placeholder="请输入客观信息内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源名称" prop="sourceName">
              <el-input v-model="form.sourceName" maxlength="255" placeholder="请输入来源名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源地址" prop="sourceUrl">
              <el-input v-model="form.sourceUrl" maxlength="512" placeholder="请输入来源地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布时间" prop="sourcePublishTime">
              <el-date-picker v-model="form.sourcePublishTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="请选择发布时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集时间" prop="collectTime">
              <el-date-picker v-model="form.collectTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="请选择采集时间" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="生效窗口">
              <div class="info-inline-time-row">
                <el-date-picker v-model="form.effectiveStartTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                  style="width: 100%" placeholder="生效时间（可空）" />
                <span>至</span>
                <el-date-picker v-model="form.effectiveEndTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                  style="width: 100%" placeholder="失效时间（可空）" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否公开" prop="allowPublic">
              <el-radio-group v-model="form.allowPublic">
                <el-radio label="0">不可公开</el-radio>
                <el-radio label="1">可公开</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="pointRemark">
              <el-input v-model="form.pointRemark" type="textarea" :rows="2" maxlength="1023" show-word-limit
                placeholder="请输入备注（可空）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button @click="editorVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保 存</el-button>
      </div>
    </el-dialog>

    <dortmund-team-selector-modal :visible.sync="teamSelectorVisible" multiple :selected-items="selectedTeams"
      @confirm="handleTeamSelectorConfirm" />
  </div>
</template>

<script>
import { listInfoPoint, getInfoPoint, addInfoPoint, updateInfoPoint, delInfoPoint } from "@/api/fx67ll/dortmund/infoPoint";
import { listSeason } from "@/api/fx67ll/dortmund/season";
import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import DortmundTeamSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundTeamSelectorModal/index";

export default {
  name: "DortmundInfoPointInlineEditor",
  dicts: ["sys_normal_disable"],
  components: { CommonEnhancedSelect, DortmundTeamSelectorModal },
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
    const checkTimeWindow = (rule, value, callback) => {
      if (this.form.effectiveStartTime && this.form.effectiveEndTime
        && this.form.effectiveStartTime > this.form.effectiveEndTime) {
        callback(new Error("生效时间不能晚于失效时间"));
        return;
      }
      callback();
    };
    return {
      listSeason,
      loading: false,
      submitting: false,
      editLoading: false,
      rows: [],
      editorVisible: false,
      editorMode: "add",
      selectedTeams: [],
      teamSelectorVisible: false,
      form: this.buildEmptyForm(),
      rules: {
        seasonId: [{ required: true, message: "所属赛季不能为空", trigger: "change" }],
        teamIds: [{ required: true, type: "array", min: 1, message: "至少选择一支球队", trigger: "change" }],
        pointTitle: [{ required: true, message: "信息标题不能为空", trigger: "blur" }],
        pointContent: [{ required: true, message: "信息内容不能为空", trigger: "blur" }],
        sourceName: [{ required: true, message: "来源名称不能为空", trigger: "blur" }],
        collectTime: [{ required: true, message: "采集时间不能为空", trigger: "change" }],
        effectiveStartTime: [{ validator: checkTimeWindow, trigger: "change" }],
        effectiveEndTime: [{ validator: checkTimeWindow, trigger: "change" }],
      },
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
      this.$nextTick(() => {
        this.$refs.editorForm && this.$refs.editorForm.clearValidate();
      });
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
    handleSubmit() {
      this.$refs.editorForm.validate((valid) => {
        if (!valid) {
          return;
        }
        this.submitting = true;
        const data = {
          pointTitle: this.form.pointTitle,
          pointContent: this.form.pointContent,
          sourceName: this.form.sourceName,
          sourceUrl: this.form.sourceUrl,
          sourcePublishTime: this.form.sourcePublishTime,
          collectTime: this.form.collectTime,
          effectiveStartTime: this.form.effectiveStartTime,
          effectiveEndTime: this.form.effectiveEndTime,
          allowPublic: this.form.allowPublic,
          pointRemark: this.form.pointRemark,
        };
        const request = this.editorMode === "add"
          ? addInfoPoint({
            ...data,
            infoPointType: this.form.infoPointType,
            seasonId: this.form.seasonId,
            matchId: this.form.matchId,
            teamIds: this.form.teamIds,
          })
          : updateInfoPoint({ ...data, infoPointId: this.form.infoPointId, teamIds: this.form.teamIds });
        request.then(() => {
          this.$modal.msgSuccess(this.editorMode === "add" ? "新增成功" : "修改成功");
          this.editorVisible = false;
          this.load();
          this.$emit("refresh");
        }).catch(() => {
        }).finally(() => {
          this.submitting = false;
        });
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
