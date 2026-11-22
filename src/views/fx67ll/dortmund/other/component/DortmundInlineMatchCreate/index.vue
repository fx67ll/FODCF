<template>
  <div class="dortmund-inline-match-create">
    <div class="dortmund-inline-match-head">
      <span class="dortmund-inline-match-head-icon"><i class="el-icon-football"></i></span>
      <div class="dortmund-inline-match-head-copy">
        <strong>当场新建比赛资料</strong>
        <small>赛季、比赛编码、主队、客队和比赛时间均为必填</small>
      </div>
      <span class="dortmund-inline-match-head-badge">同场创建</span>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-form-item :prop="fieldProp('seasonId')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="所属赛季" tip="必填；请选择已存在且未结束的赛季" />
          </template>
          <dortmund-season-select v-model="form.seasonId" :disabled="disabled" @loaded="handleSeasonLoaded" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item :prop="fieldProp('matchTime')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="比赛时间" tip="必填；格式yyyy-MM-dd HH:mm:ss" />
          </template>
          <dortmund-kickoff-time-picker v-model="form.matchTime" :disabled="disabled" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item :prop="fieldProp('matchCode')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="比赛编码" tip="必填；1-23个字符，全局唯一；可按比赛时间自动生成 MATCH-YYYYMMDD-XXXXXX；创建后不可修改" />
          </template>
          <dortmund-code-input v-model="form.matchCode" code-kind="match" :date-value="form.matchTime"
            :maxlength="limits.matchCode" :disabled="disabled" placeholder="必填，可自动生成比赛编码" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item :prop="fieldProp('matchVenue')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="球队主场" tip="选填；最多233个字符，可从已有球队主场中选择或直接输入" />
          </template>
          <dortmund-team-option-selector v-model="form.matchVenue" option-type="venue" :disabled="disabled"
            placeholder="请选择或输入球队主场" clearable />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item ref="homeTeamItem" :prop="fieldProp('homeTeamId')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="主队" tip="必填；通过球队侧边选择器选择，主队与客队不能相同" />
          </template>
          <dortmund-binding-control :display-text="teamDisplayText('home')" select-label="选择主队" placeholder="请选择主队"
            entity-type="team" :disabled="disabled" @select="openTeamSelector('home')" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item ref="awayTeamItem" :prop="fieldProp('awayTeamId')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="客队" tip="必填；通过球队侧边选择器选择，主队与客队不能相同" />
          </template>
          <dortmund-binding-control :display-text="teamDisplayText('away')" select-label="选择客队" placeholder="请选择客队"
            entity-type="team" :disabled="disabled" @select="openTeamSelector('away')" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item :prop="fieldProp('matchStatus')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="比赛状态" tip="必填；0=正常启用，1=关闭；新比赛默认正常启用" />
          </template>
          <el-select v-model="form.matchStatus" :disabled="disabled" style="width: 100%" placeholder="请选择比赛状态"
            popper-class="dortmund-theme-popper">
            <el-option v-for="item in matchStatusOptions" :key="item.value" :label="item.label"
              :value="item.value"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item :prop="fieldProp('matchResult')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="比赛结果" tip="选填；可为空或0/1/2/3/4/5，0至2为常规胜平负，3至5为让球胜平负，含义以字典为准" />
          </template>
          <el-select v-model="form.matchResult" :disabled="disabled" style="width: 100%" placeholder="请选择比赛结果（可空）"
            clearable popper-class="dortmund-theme-popper">
            <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item :prop="fieldProp('matchRemark')" label-width="116px">
          <template slot="label">
            <dortmund-form-label label="比赛备注" tip="选填；最多1023个字符" />
          </template>
          <el-input v-model="form.matchRemark" :maxlength="limits.matchRemark" show-word-limit :disabled="disabled"
            placeholder="请输入比赛备注（可空）" />
        </el-form-item>
      </el-col>
    </el-row>

    <dortmund-team-selector-modal :visible.sync="teamSelectorVisible" :selected-items="selectedTeamItems"
      @confirm="handleTeamSelectorConfirm" />
  </div>
</template>

<script>
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundSeasonSelect from "@/views/fx67ll/dortmund/other/component/DortmundSeasonSelect/index";
import DortmundBindingControl from "@/views/fx67ll/dortmund/other/component/DortmundBindingControl/index";
import DortmundTeamSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundTeamSelectorModal/index";
import DortmundTeamOptionSelector from "@/views/fx67ll/dortmund/other/component/DortmundTeamOptionSelector/index";
import DortmundKickoffTimePicker from "@/views/fx67ll/dortmund/other/component/DortmundKickoffTimePicker/index";
import DortmundCodeInput from "@/views/fx67ll/dortmund/other/component/DortmundCodeInput/index";
import { DORTMUND_LIMITS } from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import { generateBusinessCode } from "@/views/fx67ll/dortmund/other/utils/codeGenerator";

export default {
  name: "DortmundInlineMatchCreate",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: {
    DortmundFormLabel,
    DortmundSeasonSelect,
    DortmundBindingControl,
    DortmundTeamSelectorModal,
    DortmundTeamOptionSelector,
    DortmundKickoffTimePicker,
    DortmundCodeInput,
  },
  props: {
    // 由宿主表单持有的 newMatch 对象，组件只负责字段布局与球队侧边选择
    form: {
      type: Object,
      required: true,
    },
    // 嵌套在宿主 el-form 时保持校验路径一致
    prefix: {
      type: String,
      default: "newMatch.",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      teamSelectorVisible: false,
      teamSelectorSide: "home",
      selectedHomeTeam: null,
      selectedAwayTeam: null,
    };
  },
  computed: {
    limits() {
      return DORTMUND_LIMITS;
    },
    selectedTeamItems() {
      if (this.teamSelectorSide === "home") {
        return this.selectedHomeTeam ? [this.selectedHomeTeam] : [];
      }
      return this.selectedAwayTeam ? [this.selectedAwayTeam] : [];
    },
    matchStatusOptions() {
      const options = (this.dict && this.dict.type && this.dict.type.sys_notice_status) || [];
      return options.filter((item) => String(item.value) === "0");
    },
  },
  watch: {
    "form.homeTeamId"(value) {
      if (value == null || value === "") {
        this.selectedHomeTeam = null;
      }
    },
    "form.awayTeamId"(value) {
      if (value == null || value === "") {
        this.selectedAwayTeam = null;
      }
    },
  },
  created() {
    this.applyAddDefaults();
  },
  methods: {
    // 当场新建比赛仅允许正常状态；编码默认生成，赛季在选项加载后补首项。
    applyAddDefaults() {
      if (this.disabled) return;
      if (!this.form.matchCode) {
        this.$set(this.form, "matchCode", generateBusinessCode("match", this.form.matchTime));
      }
      if (this.form.matchStatus == null || this.form.matchStatus === "") {
        this.$set(this.form, "matchStatus", "0");
      }
    },
    handleSeasonLoaded(options) {
      if (this.disabled || (this.form.seasonId != null && this.form.seasonId !== "")) return;
      const first = Array.isArray(options)
        ? options.find((item) => item && item.seasonId != null && item.seasonId !== "")
        : null;
      if (first) this.$set(this.form, "seasonId", first.seasonId);
    },
    fieldProp(field) {
      return `${this.prefix}${field}`;
    },
    teamDisplayText(side) {
      const team = side === "home" ? this.selectedHomeTeam : this.selectedAwayTeam;
      if (team && team.teamId != null) {
        return team.teamName || team.teamNameShort || `球队 #${team.teamId}`;
      }
      const teamId = side === "home" ? this.form.homeTeamId : this.form.awayTeamId;
      return teamId == null || teamId === "" ? "" : `球队 #${teamId}`;
    },
    openTeamSelector(side) {
      if (this.disabled) {
        return;
      }
      this.teamSelectorSide = side;
      this.teamSelectorVisible = true;
    },
    handleTeamSelectorConfirm(team) {
      if (!team || team.teamId == null) {
        return;
      }
      const isHome = this.teamSelectorSide === "home";
      const counterpartId = isHome ? this.form.awayTeamId : this.form.homeTeamId;
      if (counterpartId != null && String(counterpartId) === String(team.teamId)) {
        this.$modal.msgError("新比赛的主队和客队不能相同");
        return;
      }
      if (isHome) {
        this.selectedHomeTeam = team;
        this.form.homeTeamId = team.teamId;
        this.form.matchVenue = team.teamVenue || null;
        this.$nextTick(() => this.$refs.homeTeamItem && this.$refs.homeTeamItem.clearValidate());
      } else {
        this.selectedAwayTeam = team;
        this.form.awayTeamId = team.teamId;
        this.$nextTick(() => this.$refs.awayTeamItem && this.$refs.awayTeamItem.clearValidate());
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-inline-match-create {
  padding: 14px 16px 2px;
  background: #f6fbf8;
  border: 1px dashed #cbe8d8;
  border-radius: 12px;
}

.dortmund-inline-match-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px 14px;
}

.dortmund-inline-match-head-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 9px;
}

.dortmund-inline-match-head-copy {
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 13px;
    color: #2b3a36;
  }

  small {
    font-size: 12px;
    color: #8a9791;
  }
}

.dortmund-inline-match-head-badge {
  flex-shrink: 0;
  padding: 2px 9px;
  margin-left: auto;
  font-size: 11px;
  color: #27ad60;
  background: #fff;
  border: 1px solid #cbe8d8;
  border-radius: 999px;
}

@media (max-width: 767px) {
  .dortmund-inline-match-create {
    padding: 12px 10px 0;
  }

  .dortmund-inline-match-head {
    align-items: flex-start;
  }

  .dortmund-inline-match-head-badge,
  .dortmund-inline-match-head small {
    display: none;
  }
}
</style>
