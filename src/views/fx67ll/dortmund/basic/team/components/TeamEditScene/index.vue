<template>
  <div class="team-edit-scene">
    <div class="team-edit-hero">
      <div class="team-edit-hero-left">
        <div class="team-edit-hero-icon">
          <i class="el-icon-s-flag"></i>
        </div>
        <div class="team-edit-hero-text">
          <div class="team-edit-hero-title-row">
            <h2>{{ editMode === "add" ? "新增球队" : "修改球队" }}</h2>
            <span class="team-edit-hero-type">Team · 基础档案</span>
          </div>
          <p>球队编码创建后不可修改；被比赛引用时建议停用而非删除</p>
        </div>
      </div>
      <el-button type="text" icon="el-icon-back" class="team-edit-back" @click="$emit('back')">返回列表</el-button>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="92px" class="team-edit-form">
      <div class="team-edit-card">
        <div class="team-edit-card-header">
          <span class="team-edit-card-chip"><i class="el-icon-id-card"></i></span>
          <span class="team-edit-card-title">球队标识</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="球队编码" prop="teamCode">
              <el-input v-model="editForm.teamCode" maxlength="64" placeholder="请输入球队编码"
                :disabled="editMode === 'update'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="球队全称" prop="teamName">
              <el-input v-model="editForm.teamName" maxlength="128" placeholder="请输入球队中文全称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="球队昵称" prop="teamNameShort">
              <el-input v-model="editForm.teamNameShort" maxlength="128" placeholder="请输入球队昵称/简称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="球队英文" prop="teamNameEn">
              <el-input v-model="editForm.teamNameEn" maxlength="128" placeholder="请输入球队英文名称" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="team-edit-card">
        <div class="team-edit-card-header">
          <span class="team-edit-card-chip"><i class="el-icon-location-information"></i></span>
          <span class="team-edit-card-title">归属与展示</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="球队主场" prop="teamVenue">
              <el-select v-model="editForm.teamVenue" style="width: 100%" placeholder="请选择或输入球队主场" clearable filterable
                allow-create default-first-option>
                <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="地区/联赛" prop="teamCountry">
              <el-select v-model="editForm.teamCountry" style="width: 100%" placeholder="请选择或输入地区/联赛" clearable
                filterable allow-create default-first-option>
                <el-option v-for="item in teamCountryOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="球队Logo" prop="teamLogoUrl">
              <el-input v-model="editForm.teamLogoUrl" maxlength="512" placeholder="请输入球队Logo图片链接地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="球队标签" prop="teamTag">
              <el-select v-model="editForm.teamTag" style="width: 100%" placeholder="请选择或输入球队标签" clearable filterable
                multiple allow-create default-first-option>
                <el-option v-for="item in teamTagOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="team-edit-card">
        <div class="team-edit-card-header">
          <span class="team-edit-card-chip"><i class="el-icon-set-up"></i></span>
          <span class="team-edit-card-title">状态与备注</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="8">
            <el-form-item label="球队状态" prop="teamStatus">
              <el-switch v-model="editForm.teamStatus" active-value="0" inactive-value="1" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="球队排序" prop="teamSort">
              <el-input-number v-model="editForm.teamSort" :min="0" :max="1023" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="球队备注" prop="teamRemark">
              <el-input v-model="editForm.teamRemark" type="textarea" :rows="3" maxlength="512" show-word-limit
                placeholder="请输入球队备注内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="team-edit-card team-info-card">
        <div class="team-edit-card-header">
          <span class="team-edit-card-chip"><i class="el-icon-notebook-2"></i></span>
          <span class="team-edit-card-title">关联信息点</span>
          <span class="team-edit-card-tip" v-if="editMode === 'add'">随球队一起创建</span>
        </div>

        <dortmund-info-point-inline-editor v-if="editMode === 'update' && editForm.teamId" :anchor-type="'team'"
          :team-id="editForm.teamId" />

        <template v-else>
          <div class="team-info-header">
            <span class="team-info-count">已添加 {{ newInfoPoints.length }} 条</span>
            <el-button type="primary" plain size="mini" icon="el-icon-plus" @click="openDraftInfo">新增</el-button>
          </div>
          <el-table :data="newInfoPoints" size="small" empty-text="暂无关联信息点">
            <el-table-column label="标题" prop="pointTitle" min-width="170" show-overflow-tooltip />
            <el-table-column label="内容" prop="pointContent" min-width="210" show-overflow-tooltip />
            <el-table-column label="来源" prop="sourceName" min-width="130" show-overflow-tooltip />
            <el-table-column label="操作" align="center" width="110">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-edit" @click="openDraftInfo(scope.row)">编辑</el-button>
                <el-button size="mini" type="text" icon="el-icon-delete"
                  @click="removeDraftInfo(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-form>

    <div class="team-edit-footer">
      <el-button @click="$emit('back')">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
    </div>

    <el-dialog :visible.sync="draftVisible" :title="draftIndex >= 0 ? '编辑关联信息点' : '新增关联信息点'" width="760px"
      append-to-body custom-class="team-draft-info-dialog" :close-on-click-modal="false">
      <el-form ref="draftForm" :model="draftForm" :rules="draftRules" label-width="104px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属赛季" prop="seasonId">
              <common-enhanced-select v-model="draftForm.seasonId" valueKey="seasonId" labelKey="seasonName"
                :api-func="listSeason" placeholder="请选择所属赛季" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集时间" prop="collectTime">
              <el-date-picker v-model="draftForm.collectTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="请选择采集时间" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="信息标题" prop="pointTitle">
              <el-input v-model="draftForm.pointTitle" maxlength="255" show-word-limit placeholder="请输入信息标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="信息内容" prop="pointContent">
              <el-input v-model="draftForm.pointContent" type="textarea" :rows="4" maxlength="1023" show-word-limit
                placeholder="请输入客观信息内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源名称" prop="sourceName">
              <el-input v-model="draftForm.sourceName" maxlength="255" placeholder="请输入来源名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源地址" prop="sourceUrl">
              <el-input v-model="draftForm.sourceUrl" maxlength="512" placeholder="请输入来源地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button @click="draftVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveDraftInfo">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import DortmundInfoPointInlineEditor from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointInlineEditor/index.vue";
import { teamCountryOptions, teamTagOptions, teamVenueOptions } from "@/utils/constant/football";

export default {
  name: "TeamEditScene",
  dicts: ["sys_normal_disable"],
  components: { CommonEnhancedSelect, DortmundInfoPointInlineEditor },
  props: {
    editMode: {
      type: String,
      default: "add",
      validator: (value) => ["add", "update"].includes(value),
    },
    initialForm: {
      type: Object,
      default: () => ({}),
    },
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      listSeason,
      teamCountryOptions,
      teamTagOptions,
      teamVenueOptions,
      editForm: this.buildEditForm(),
      draftVisible: false,
      draftIndex: -1,
      newInfoPoints: [],
      draftForm: this.buildDraftForm(),
    };
  },
  computed: {
    editRules() {
      return {
        teamCode: [{ required: true, message: "球队编码不能为空", trigger: "blur" }],
        teamName: [{ required: true, message: "球队全称不能为空", trigger: "blur" }],
        teamNameShort: [{ required: true, message: "球队昵称不能为空", trigger: "blur" }],
        teamNameEn: [{ required: true, message: "球队英文名称不能为空", trigger: "blur" }],
        teamLogoUrl: [{ required: true, message: "球队Logo不能为空", trigger: "blur" }],
        teamCountry: [{ required: true, message: "地区/联赛不能为空", trigger: "change" }],
        teamTag: [{ required: true, type: "array", min: 1, message: "球队标签不能为空", trigger: "change" }],
        teamStatus: [{ required: true, message: "球队状态不能为空", trigger: "change" }],
      };
    },
    draftRules() {
      return {
        seasonId: [{ required: true, message: "所属赛季不能为空", trigger: "change" }],
        pointTitle: [{ required: true, message: "信息标题不能为空", trigger: "blur" }],
        pointContent: [{ required: true, message: "信息内容不能为空", trigger: "blur" }],
        sourceName: [{ required: true, message: "来源名称不能为空", trigger: "blur" }],
        collectTime: [{ required: true, message: "采集时间不能为空", trigger: "change" }],
      };
    },
  },
  watch: {
    initialForm: {
      immediate: true,
      handler() {
        this.editForm = this.buildEditForm();
      },
    },
    editMode() {
      this.newInfoPoints = [];
      this.draftIndex = -1;
      this.draftForm = this.buildDraftForm();
      this.draftVisible = false;
    },
  },
  methods: {
    buildEditForm() {
      const source = this.initialForm || {};
      return {
        teamId: source.teamId || null,
        teamCode: source.teamCode || null,
        teamName: source.teamName || null,
        teamNameShort: source.teamNameShort || null,
        teamNameEn: source.teamNameEn || null,
        teamLogoUrl: source.teamLogoUrl || null,
        teamVenue: source.teamVenue || null,
        teamCountry: source.teamCountry || null,
        teamTag: Array.isArray(source.teamTag) ? source.teamTag : [],
        teamRemark: source.teamRemark || null,
        teamStatus: source.teamStatus || "0",
        teamSort: source.teamSort || 0,
      };
    },
    buildDraftForm() {
      return {
        seasonId: null,
        pointTitle: null,
        pointContent: null,
        sourceName: null,
        sourceUrl: null,
        collectTime: null,
      };
    },
    openDraftInfo(row) {
      if (row && row.pointTitle !== undefined) {
        this.draftIndex = this.newInfoPoints.indexOf(row);
        this.draftForm = { ...row };
      } else {
        this.draftIndex = -1;
        this.draftForm = this.buildDraftForm();
      }
      this.draftVisible = true;
      this.$nextTick(() => {
        this.$refs.draftForm && this.$refs.draftForm.clearValidate();
      });
    },
    saveDraftInfo() {
      this.$refs.draftForm.validate((valid) => {
        if (!valid) {
          return;
        }
        const data = { ...this.draftForm, infoPointType: "T" };
        if (this.draftIndex >= 0) {
          this.newInfoPoints.splice(this.draftIndex, 1, data);
        } else {
          this.newInfoPoints.push(data);
        }
        this.draftVisible = false;
      });
    },
    removeDraftInfo(index) {
      this.newInfoPoints.splice(index, 1);
    },
    submitEditForm() {
      this.$refs.editForm.validate((valid) => {
        if (!valid) {
          return;
        }
        const data = {
          ...this.editForm,
          teamTag: (this.editForm.teamTag || []).join(","),
        };
        if (this.editMode === "add") {
          data.newInfoPoints = this.newInfoPoints.map((item) => ({
            ...item,
            allowPublic: "0",
          }));
        }
        this.$emit("save", data);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.team-edit-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #e7f8ee 100%);
  border: 1px solid #e2eee7;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: teamSceneFadeUp 0.3s ease both;
}

.team-edit-hero-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.team-edit-hero-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 14px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.3);
}

.team-edit-hero-title-row {
  display: flex;
  align-items: center;
}

.team-edit-hero-text h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.team-edit-hero-type {
  margin-left: 10px;
  padding: 2px 10px;
  color: #27ad60;
  font-size: 12px;
  font-weight: 600;
  background: #e7f8ee;
  border-radius: 999px;
}

.team-edit-hero-text p {
  margin: 4px 0 0;
  color: #7c8b84;
  font-size: 12px;
}

.team-edit-back {
  flex-shrink: 0;
}

.team-edit-form {
  padding: 0;
  background: none;
}

.team-edit-card {
  margin-bottom: 16px;
  padding: 16px 20px 8px;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: teamSceneFadeUp 0.3s ease both;
}

.team-info-card {
  padding-bottom: 16px;
}

.team-edit-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.team-edit-card-chip {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  color: #27ad60;
  font-size: 14px;
  background: #e7f8ee;
  border-radius: 8px;
}

.team-edit-card-title {
  color: #2b3a36;
  font-size: 14px;
  font-weight: 700;
}

.team-edit-card-tip,
.team-info-count {
  margin-left: 10px;
  color: #7c8b84;
  font-size: 12px;
}

.team-info-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.team-edit-footer {
  padding: 14px 20px;
  margin-top: 4px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
}

@keyframes teamSceneFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
