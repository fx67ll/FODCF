<template>
  <div class="dortmund-secondary-page team-edit-scene">
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
      <el-button type="text" class="dortmund-theme-text team-edit-back" icon="el-icon-back"
        @click="$emit('back')">返回总览</el-button>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="112px" class="team-edit-form">
      <div class="team-edit-card">
        <div class="team-edit-card-header">
          <span class="team-edit-card-chip"><i class="el-icon-postcard"></i></span>
          <span class="team-edit-card-title">球队标识</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item prop="teamCode">
              <template slot="label">
                <dortmund-form-label label="球队编码" tip="必填；1-23个字符，全局唯一；可自动生成 TEAM-YYYYMMDD-XXXXXX；创建后不可修改" />
              </template>
              <dortmund-code-input v-model="editForm.teamCode" code-kind="team" maxlength="23"
                placeholder="请输入或自动生成球队编码" :disabled="editMode === 'update'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="teamName">
              <template slot="label">
                <dortmund-form-label label="球队全称" tip="必填；1-233个字符，例如：多特蒙德足球俱乐部" />
              </template>
              <el-input v-model="editForm.teamName" maxlength="233" placeholder="请输入球队中文全称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="teamNameShort">
              <template slot="label">
                <dortmund-form-label label="球队昵称" tip="必填；1-10个字符，例如：我横、大黄蜂" />
              </template>
              <el-input v-model="editForm.teamNameShort" maxlength="10" show-word-limit placeholder="请输入球队昵称/简称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="teamNameEn">
              <template slot="label">
                <dortmund-form-label label="球队英文" tip="必填；1-233个字符，例如：Borussia Dortmund" />
              </template>
              <el-input v-model="editForm.teamNameEn" maxlength="233" placeholder="请输入球队英文名称" />
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
            <el-form-item prop="teamVenue">
              <template slot="label">
                <dortmund-form-label label="球队主场" tip="必填；1-233个字符，可从已有场地中选择或直接输入" />
              </template>
              <dortmund-option-select v-model="editForm.teamVenue" option-type="venue" maxlength="233"
                placeholder="请选择或输入球队主场" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="teamCountry">
              <template slot="label">
                <dortmund-form-label label="地区/联赛" tip="必填；1-23个字符，例如：德国、英格兰" />
              </template>
              <dortmund-option-select v-model="editForm.teamCountry" option-type="country" maxlength="23"
                placeholder="请选择地区/联赛（支持搜索）" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="teamLogoUrl">
              <template slot="label">
                <dortmund-form-label label="球队Logo" tip="必填；1-1023个字符，请填写可公开访问的图片URL" />
              </template>
              <el-input v-model="editForm.teamLogoUrl" maxlength="1023" show-word-limit placeholder="请输入球队Logo图片链接地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="teamTag">
              <template slot="label">
                <dortmund-form-label label="球队标签" tip="必填；至少1个标签；多个标签用逗号分隔后合计不超过1023个字符" />
              </template>
              <dortmund-option-select v-model="editForm.teamTag" option-type="tag" placeholder="请选择或输入球队标签" multiple />
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
            <el-form-item prop="teamStatus">
              <template slot="label">
                <dortmund-form-label label="球队状态" tip="必填；启用为0，停用为1；被比赛引用的球队建议停用而非删除" />
              </template>
              <el-switch v-model="editForm.teamStatus" active-value="0" inactive-value="1" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item prop="teamSort">
              <template slot="label">
                <dortmund-form-label label="球队排序" tip="选填；0-1023的整数；数值越小越靠前，默认0" />
              </template>
              <el-input-number v-model="editForm.teamSort" :min="0" :max="1023" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="teamRemark">
              <template slot="label">
                <dortmund-form-label label="球队备注" tip="选填；最多1023个字符" />
              </template>
              <el-input v-model="editForm.teamRemark" type="textarea" :rows="3" maxlength="1023" show-word-limit
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
            <el-button type="success" plain size="mini" icon="el-icon-plus" @click="openDraftInfo">新增</el-button>
          </div>
          <el-table :data="newInfoPoints" size="small" empty-text="暂无关联信息点">
            <el-table-column label="标题" prop="pointTitle" min-width="170" show-overflow-tooltip />
            <el-table-column label="内容" prop="pointContent" min-width="210" show-overflow-tooltip />
            <el-table-column label="来源" prop="sourceName" min-width="130" show-overflow-tooltip />
            <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="90" fixed="right">
              <template slot-scope="scope">
                <dortmund-action-button label="编辑" icon="el-icon-edit" action="edit"
                  @click="openDraftInfo(scope.row)" />
                <dortmund-action-button label="删除" icon="el-icon-delete" action="delete"
                  @click="removeDraftInfo(scope.$index)" />
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-form>

    <div class="team-edit-footer">
      <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="submitEditForm">保
        存</el-button>
      <el-button class="dortmund-theme-cancel" @click="$emit('back')">返回总览</el-button>
    </div>

    <dortmund-info-point-form-dialog :visible.sync="draftVisible" :value="draftForm"
      :mode="draftIndex >= 0 ? 'update' : 'add'" info-point-type="T" show-season @save="saveDraftInfo" />
  </div>
</template>

<script>
import DortmundInfoPointFormDialog from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointFormDialog/index";
import DortmundOptionSelect from "@/views/fx67ll/dortmund/other/component/DortmundOptionSelect/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundCodeInput from "@/views/fx67ll/dortmund/other/component/DortmundCodeInput/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import {
  DORTMUND_LIMITS,
  DORTMUND_STATUS_OPTIONS,
  enumRule,
  integerRangeRule,
  optionalTextRule,
  requiredTextRule,
  trimTextFields,
} from "@/views/fx67ll/dortmund/utils/validation";

export default {
  name: "TeamEditScene",
  dicts: ["sys_normal_disable"],
  components: { DortmundFormLabel, DortmundInfoPointFormDialog, DortmundOptionSelect, DortmundCodeInput, DortmundActionButton },
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
        teamCode: [requiredTextRule("球队编码", DORTMUND_LIMITS.teamCode)],
        teamName: [requiredTextRule("球队全称", DORTMUND_LIMITS.teamName)],
        teamNameShort: [requiredTextRule("球队昵称", DORTMUND_LIMITS.teamNameShort)],
        teamNameEn: [requiredTextRule("球队英文名称", DORTMUND_LIMITS.teamNameEn)],
        teamVenue: [requiredTextRule("球队主场", DORTMUND_LIMITS.teamVenue)],
        teamLogoUrl: [requiredTextRule("球队Logo", DORTMUND_LIMITS.teamLogoUrl)],
        teamCountry: [requiredTextRule("地区/联赛", DORTMUND_LIMITS.teamCountry)],
        teamTag: [{
          required: true,
          validator: (rule, value, callback) => {
            const tags = Array.isArray(value) ? value.filter((item) => String(item || "").trim() !== "") : [];
            const joined = tags.map((item) => String(item).trim()).join(",");
            if (tags.length === 0) {
              callback(new Error("球队标签不能为空"));
              return;
            }
            if (Array.from(joined).length > DORTMUND_LIMITS.teamTag) {
              callback(new Error(`球队标签合计不能超过${DORTMUND_LIMITS.teamTag}个字符`));
              return;
            }
            callback();
          },
          trigger: "change",
        }],
        teamStatus: [enumRule("球队状态", DORTMUND_STATUS_OPTIONS, true)],
        teamSort: [integerRangeRule("球队排序", 0, 1023, false)],
        teamRemark: [optionalTextRule("球队备注", DORTMUND_LIMITS.teamRemark)],
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
    },
    saveDraftInfo(form) {
      const data = { ...form, infoPointType: "T" };
      if (this.draftIndex >= 0) {
        this.newInfoPoints.splice(this.draftIndex, 1, data);
      } else {
        this.newInfoPoints.push(data);
      }
      this.draftVisible = false;
    },
    removeDraftInfo(index) {
      this.newInfoPoints.splice(index, 1);
    },
    submitEditForm() {
      this.$refs.editForm.validate((valid) => {
        if (!valid) {
          return;
        }
        const data = trimTextFields(this.editForm, [
          "teamCode",
          "teamName",
          "teamNameShort",
          "teamNameEn",
          "teamLogoUrl",
          "teamVenue",
          "teamCountry",
          "teamRemark",
        ]);
        data.teamTag = (this.editForm.teamTag || [])
          .map((item) => String(item || "").trim())
          .filter((item) => item !== "")
          .join(",");
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
  margin: 0 10px;
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

@media (max-width: 767px) {
  .team-edit-hero {
    align-items: flex-start;
    padding: 14px;
  }

  .team-edit-card {
    padding: 14px 12px 6px;
  }

  .team-edit-card-tip {
    display: none;
  }
}
</style>

<style lang="scss">
@media (max-width: 800px) {
  .team-draft-info-dialog {
    width: calc(100% - 24px) !important;
    margin-top: 5vh !important;

    .el-dialog__body {
      padding: 18px 14px 8px;
    }
  }
}
</style>
