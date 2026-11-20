<template>
  <el-form ref="infoPointForm" :model="form" :rules="rules" :label-width="labelWidth" class="dortmund-info-point-form"
    v-loading="loading">
    <div v-if="showSeason || showTeams" class="dortmund-info-form-card">
      <div class="dortmund-info-form-header">
        <span class="dortmund-info-form-chip"><i class="el-icon-connection"></i></span>
        <span class="dortmund-info-form-title">归属设置</span>
        <span v-if="mode === 'update'" class="dortmund-info-form-tip">归属创建后不可修改</span>
      </div>
      <el-row :gutter="20">
        <el-col v-if="showSeason" :xs="24" :md="12">
          <el-form-item prop="seasonId">
            <template slot="label">
              <dortmund-form-label label="所属赛季" tip="必填；T类型信息点必须归属一个赛季" />
            </template>
            <dortmund-season-select v-if="mode === 'add'" ref="seasonSelect" v-model="form.seasonId" />
            <el-input v-else :value="seasonDisplay" disabled />
          </el-form-item>
        </el-col>
        <el-col v-if="showTeams" :xs="24" :md="12">
          <el-form-item prop="teamIds">
            <template slot="label">
              <dortmund-form-label label="关联球队" tip="必填；至少选择1支球队；修改时提交已有球队集合" />
            </template>
            <div v-if="teamsLocked" class="dortmund-info-team-readonly">
              <el-tag v-for="team in selectedTeams" :key="team.teamId" size="small" type="success" effect="plain">
                {{ team.teamName || `球队 ${team.teamId}` }}
              </el-tag>
              <span v-if="!selectedTeams.length" class="dortmund-info-team-empty">当前未关联球队</span>
            </div>
            <dortmund-binding-control v-else entity-type="team" select-label="选择球队"
              :display-text="formatSelectedTeams(selectedTeams)" placeholder="请选择关联球队（可多选）"
              @select="$emit('select-teams')" />
            <div v-if="teamsLocked && (form.teamIds || []).length" class="dortmund-info-form-hint">
              当前已关联 {{ (form.teamIds || []).length }} 支球队，保持现状即可无需改动
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div class="dortmund-info-form-card">
      <div class="dortmund-info-form-header">
        <span class="dortmund-info-form-chip"><i class="el-icon-document"></i></span>
        <span class="dortmund-info-form-title">信息内容</span>
      </div>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item prop="pointTitle">
            <template slot="label">
              <dortmund-form-label label="信息点标题" tip="必填；1-233个字符" />
            </template>
            <el-input v-model="form.pointTitle" :maxlength="limits.infoTitle" show-word-limit placeholder="请输入信息点标题" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="pointContent">
            <template slot="label">
              <dortmund-form-label label="信息点内容" tip="必填；当前界面与后端业务限制为最多1023个字符" />
            </template>
            <el-input v-model="form.pointContent" type="textarea" :rows="4" :maxlength="limits.infoContent" show-word-limit
              placeholder="请输入客观信息内容" />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div class="dortmund-info-form-card">
      <div class="dortmund-info-form-header">
        <span class="dortmund-info-form-chip"><i class="el-icon-time"></i></span>
        <span class="dortmund-info-form-title">来源与时间</span>
      </div>
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-form-item prop="sourceName">
            <template slot="label">
              <dortmund-form-label label="信息来源名称" tip="必填；1-233个字符" />
            </template>
            <el-input v-model="form.sourceName" :maxlength="limits.infoSourceName" show-word-limit placeholder="请输入信息来源名称" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item prop="sourceUrl">
            <template slot="label">
              <dortmund-form-label label="信息来源地址" tip="选填；最多1023个字符，建议填写完整URL" />
            </template>
            <el-input v-model="form.sourceUrl" :maxlength="limits.infoSourceUrl" show-word-limit placeholder="请输入信息来源地址" />
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :xs="24" :md="12">
          <el-form-item prop="sourcePublishTime">
            <template slot="label">
              <dortmund-form-label label="来源发布时间" tip="选填；格式yyyy-MM-dd HH:mm:ss" />
            </template>
            <el-date-picker clearable v-model="form.sourcePublishTime" type="datetime"
              popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
              placeholder="请选择来源发布时间" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="showAdvanced ? 12 : 24">
          <el-form-item prop="collectTime">
            <template slot="label">
              <dortmund-form-label label="信息采集时间" tip="必填；格式yyyy-MM-dd HH:mm:ss" />
            </template>
            <el-date-picker clearable v-model="form.collectTime" type="datetime" popper-class="dortmund-theme-popper"
              value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择信息采集时间" />
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :span="24">
          <el-form-item class="dortmund-info-time-window">
            <template slot="label">
              <dortmund-form-label label="生效时间窗口" tip="两端均可为空；填写时开始时间不得晚于结束时间" />
            </template>
            <div class="dortmund-info-time-row">
              <el-date-picker clearable v-model="form.effectiveStartTime" type="datetime"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
                placeholder="请选择生效时间（空表示不限制）" />
              <span class="dortmund-info-time-connector">至</span>
              <el-date-picker clearable v-model="form.effectiveEndTime" type="datetime"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
                placeholder="请选择失效时间（空表示不限制）" />
            </div>
            <div class="dortmund-info-form-hint">留空表示不限制；两者都填时，生效时间不得晚于失效时间</div>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div v-if="showAdvanced" class="dortmund-info-form-card">
      <div class="dortmund-info-form-header">
        <span class="dortmund-info-form-chip"><i class="el-icon-setting"></i></span>
        <span class="dortmund-info-form-title">附加设置</span>
      </div>
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-form-item prop="allowPublic">
            <template slot="label">
              <dortmund-form-label label="是否可公开" tip="必填；0=不可公开，1=可公开" />
            </template>
            <el-radio-group v-model="form.allowPublic">
              <el-radio v-for="option in allowPublicOptions" :key="option.value" :label="option.value">
                {{ option.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="pointRemark">
            <template slot="label">
              <dortmund-form-label label="备注" tip="选填；最多1023个字符" />
            </template>
            <el-input v-model="form.pointRemark" type="textarea" :rows="2" :maxlength="limits.infoRemark" show-word-limit
              placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </el-form>
</template>

<script>
import DortmundBindingControl from "@/views/fx67ll/dortmund/other/component/DortmundBindingControl/index";
import DortmundSeasonSelect from "@/views/fx67ll/dortmund/other/component/DortmundSeasonSelect/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import {
  DORTMUND_LIMITS,
  DORTMUND_STATUS_OPTIONS,
  dateRangeRule,
  enumRule,
  optionalTextRule,
  requiredTextRule,
  trimText,
} from "@/views/fx67ll/dortmund/other/utils/validation";

export default {
  name: "DortmundInfoPointForm",
  dicts: ["fx67ll_dortmund_allow_public"],
  components: { DortmundBindingControl, DortmundFormLabel, DortmundSeasonSelect },
  props: {
    // 由宿主页面持有的信息点表单，本组件只负责字段、校验和请求体规范化
    form: {
      type: Object,
      required: true,
    },
    mode: {
      type: String,
      default: "add",
      validator: (value) => ["add", "update"].includes(value),
    },
    showSeason: {
      type: Boolean,
      default: false,
    },
    showTeams: {
      type: Boolean,
      default: false,
    },
    showAdvanced: {
      type: Boolean,
      default: true,
    },
    selectedTeams: {
      type: Array,
      default: () => [],
    },
    // 赛季球队信息点的修改页锁定归属，比赛临时信息点不涉及球队
    lockTeamsOnEdit: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    labelWidth: {
      type: String,
      default: "130px",
    },
  },
  computed: {
    limits() {
      return DORTMUND_LIMITS;
    },
    teamsLocked() {
      return this.showTeams && this.mode === "update" && this.lockTeamsOnEdit;
    },
    seasonDisplay() {
      return this.form.seasonName || (this.form.seasonId ? `赛季 ${this.form.seasonId}` : "-");
    },
    allowPublicOptions() {
      const options = (this.dict && this.dict.type && this.dict.type.fx67ll_dortmund_allow_public) || [];
      return options.length ? options : [
        { label: "不可公开", value: "0" },
        { label: "可公开", value: "1" },
      ];
    },
    rules() {
      const rules = {
        pointTitle: [requiredTextRule("信息点标题", DORTMUND_LIMITS.infoTitle)],
        pointContent: [requiredTextRule("信息点内容", DORTMUND_LIMITS.infoContent)],
        sourceName: [requiredTextRule("信息来源名称", DORTMUND_LIMITS.infoSourceName)],
        sourceUrl: [optionalTextRule("信息来源地址", DORTMUND_LIMITS.infoSourceUrl)],
        collectTime: [{ required: true, message: "信息采集时间不能为空", trigger: "change" }],
        allowPublic: [enumRule("是否可公开", DORTMUND_STATUS_OPTIONS, true)],
        pointRemark: [optionalTextRule("备注", DORTMUND_LIMITS.infoRemark)],
      };
      if (this.showSeason) {
        rules.seasonId = [{ required: true, message: "所属赛季不能为空", trigger: "change" }];
      }
      if (this.showTeams && !this.teamsLocked) {
        rules.teamIds = [{
          required: true,
          type: "array",
          min: 1,
          message: "至少选择一支球队",
          trigger: "change",
        }];
      }
      if (this.showAdvanced) {
        rules.effectiveStartTime = [dateRangeRule("生效时间",
          () => this.form.effectiveStartTime, () => this.form.effectiveEndTime)];
        rules.effectiveEndTime = [dateRangeRule("生效时间",
          () => this.form.effectiveStartTime, () => this.form.effectiveEndTime)];
      }
      return rules;
    },
  },
  methods: {
    formatSelectedTeams(teams) {
      return (teams || []).map((team) => team.teamName || `球队 ${team.teamId}`).join("、");
    },
    validate() {
      return new Promise((resolve) => {
        this.$refs.infoPointForm.validate((valid) => resolve(Boolean(valid)));
      });
    },
    clearValidate() {
      this.$nextTick(() => this.$refs.infoPointForm && this.$refs.infoPointForm.clearValidate());
    },
    // 统一裁剪文本并确定类型、归属字段；宿主页面只需按新增/修改补充主键
    getSubmitData() {
      return {
        infoPointId: this.form.infoPointId || null,
        infoPointType: this.form.infoPointType || null,
        seasonId: this.form.seasonId || null,
        matchId: this.form.matchId || null,
        teamIds: Array.isArray(this.form.teamIds) ? [...this.form.teamIds] : [],
        pointTitle: trimText(this.form.pointTitle),
        pointContent: trimText(this.form.pointContent),
        sourceName: trimText(this.form.sourceName),
        sourceUrl: trimText(this.form.sourceUrl),
        sourcePublishTime: this.form.sourcePublishTime || null,
        collectTime: this.form.collectTime || null,
        effectiveStartTime: this.form.effectiveStartTime || null,
        effectiveEndTime: this.form.effectiveEndTime || null,
        allowPublic: this.form.allowPublic || "0",
        pointRemark: trimText(this.form.pointRemark),
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-info-point-form {
  padding: 0;
  background: none;
  border-radius: 0;
  box-shadow: none;
}

.dortmund-info-form-card {
  padding: 16px 20px 8px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
}

.dortmund-info-form-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.dortmund-info-form-chip {
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

.dortmund-info-form-title {
  color: #2b3a36;
  font-size: 14px;
  font-weight: 700;
}

.dortmund-info-form-tip {
  padding: 1px 8px;
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
  background: #f0f4f2;
  border-radius: 999px;
}

.dortmund-info-form-hint {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.dortmund-info-team-readonly {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
  padding-top: 4px;
}

.dortmund-info-team-empty {
  color: #909399;
  font-size: 12px;
}

.dortmund-info-time-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.dortmund-info-time-connector {
  flex-shrink: 0;
  color: #27ad60;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 767px) {
  .dortmund-info-form-card {
    padding: 14px 12px 6px;
  }

  .dortmund-info-form-tip {
    display: none;
  }

  .dortmund-info-time-row {
    align-items: stretch;
    flex-direction: column;
  }

  .dortmund-info-time-connector {
    display: none;
  }
}
</style>
