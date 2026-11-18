<template>
  <!-- 当场新增主队/客队滑出面板（同页面板，不是子弹窗；与比赛同一事务提交，side区分主客队，由编排场景v-if控制挂载） -->
  <div class="match-new-panel">
    <div class="match-new-panel-title">
      <i class="el-icon-collection-tag"></i>
      <span>当场新增{{ side === "home" ? "主队" : "客队" }}（与比赛保存在同一事务，任一步失败全部回滚）</span>
    </div>
    <el-form ref="newTeamForm" :model="newTeamForm" :rules="newTeamRules" label-width="105px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item prop="teamCode">
            <template slot="label">
              <dortmund-form-label label="球队编码" tip="必填；1-23个字符，全局唯一；可自动生成 TEAM-YYYYMMDD-XXXXXX" />
            </template>
            <dortmund-code-input v-model="newTeamForm.teamCode" code-kind="team" maxlength="23"
              placeholder="请输入或自动生成球队编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="teamName">
            <template slot="label">
              <dortmund-form-label label="球队全称" tip="必填；1-233个字符" />
            </template>
            <el-input v-model="newTeamForm.teamName" maxlength="233" show-word-limit placeholder="请输入球队中文全称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="teamNameShort">
            <template slot="label">
              <dortmund-form-label label="球队昵称" tip="必填；1-10个字符" />
            </template>
            <el-input v-model="newTeamForm.teamNameShort" maxlength="10" show-word-limit placeholder="请输入球队昵称/简称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="teamNameEn">
            <template slot="label">
              <dortmund-form-label label="球队英文" tip="必填；1-233个字符" />
            </template>
            <el-input v-model="newTeamForm.teamNameEn" maxlength="233" show-word-limit placeholder="请输入球队英文名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="teamVenue">
            <template slot="label">
              <dortmund-form-label label="球队主场" tip="必填；1-233个字符" />
            </template>
            <dortmund-option-select v-model="newTeamForm.teamVenue" option-type="venue" placeholder="请选择或输入球队主场" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="teamCountry">
            <template slot="label">
              <dortmund-form-label label="地区/联赛" tip="必填；1-23个字符" />
            </template>
            <dortmund-option-select v-model="newTeamForm.teamCountry" option-type="country" placeholder="请选择或输入地区/联赛" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="teamLogoUrl">
            <template slot="label">
              <dortmund-form-label label="球队Logo" tip="必填；1-1023个字符，请填写可公开访问的图片URL" />
            </template>
            <el-input v-model="newTeamForm.teamLogoUrl" maxlength="1023" show-word-limit
              placeholder="请输入球队Logo图片的链接地址" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="teamTag">
            <template slot="label">
              <dortmund-form-label label="球队标签" tip="必填；至少1个标签；多个标签合计不超过1023个字符" />
            </template>
            <dortmund-option-select v-model="newTeamForm.teamTag" option-type="tag" placeholder="请选择或输入球队标签" multiple />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="teamStatus">
            <template slot="label">
              <dortmund-form-label label="球队状态" tip="必填；0=启用，1=停用" />
            </template>
            <el-switch v-model="newTeamForm.teamStatus" active-value="0" inactive-value="1" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import DortmundOptionSelect from "@/views/fx67ll/dortmund/other/component/DortmundOptionSelect/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundCodeInput from "@/views/fx67ll/dortmund/other/component/DortmundCodeInput/index";
import {
  DORTMUND_LIMITS,
  DORTMUND_STATUS_OPTIONS,
  enumRule,
  requiredTextRule,
  trimTextFields,
} from "@/views/fx67ll/dortmund/utils/validation";

export default {
  name: "MatchNewTeamPanel",
  components: { DortmundFormLabel, DortmundOptionSelect, DortmundCodeInput },
  props: {
    // 面板所属方（home主队 away客队），控制标题文案
    side: {
      type: String,
      default: "home",
    },
  },
  data() {
    return {
      // 当场新增球队表单参数（提交进 newHomeTeam/newAwayTeam，与比赛同一事务）
      newTeamForm: {
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamLogoUrl: null,
        teamVenue: null,
        teamCountry: null,
        teamTag: [],
        teamStatus: "0",
      },
      // 当场新增球队表单校验（沿用球队页必填项）
      newTeamRules: {
        teamCode: [requiredTextRule("球队编码", DORTMUND_LIMITS.teamCode)],
        teamName: [requiredTextRule("球队全称", DORTMUND_LIMITS.teamName)],
        teamNameShort: [requiredTextRule("球队昵称", DORTMUND_LIMITS.teamNameShort)],
        teamNameEn: [requiredTextRule("球队英文", DORTMUND_LIMITS.teamNameEn)],
        teamVenue: [requiredTextRule("球队主场", DORTMUND_LIMITS.teamVenue)],
        teamLogoUrl: [requiredTextRule("球队Logo", DORTMUND_LIMITS.teamLogoUrl)],
        teamCountry: [requiredTextRule("地区/联赛", DORTMUND_LIMITS.teamCountry)],
        teamTag: [{
          required: true,
          validator: (rule, value, callback) => {
            const tags = Array.isArray(value) ? value.filter((item) => String(item || "").trim() !== "") : [];
            if (tags.length === 0) {
              callback(new Error("球队标签不能为空"));
              return;
            }
            if (Array.from(tags.map((item) => String(item).trim()).join(",")).length > DORTMUND_LIMITS.teamTag) {
              callback(new Error(`球队标签合计不能超过${DORTMUND_LIMITS.teamTag}个字符`));
              return;
            }
            callback();
          },
          trigger: "change",
        }],
        teamStatus: [enumRule("球队状态", DORTMUND_STATUS_OPTIONS, true)],
      },
    };
  },
  methods: {
    // 校验面板表单（返回Promise，供编排场景汇总校验）
    validate() {
      return new Promise(resolve => {
        this.$refs["newTeamForm"].validate(valid => resolve(valid));
      });
    },
    // 构建当场新增球队提交体（标签数组拼接为逗号分隔串）
    getSubmitData() {
      const data = trimTextFields(this.newTeamForm, [
        "teamCode",
        "teamName",
        "teamNameShort",
        "teamNameEn",
        "teamLogoUrl",
        "teamVenue",
        "teamCountry",
      ]);
      return {
        ...data,
        teamTag: this.newTeamForm?.teamTag?.length ? this.newTeamForm.teamTag.join(",") : "",
        teamStatus: this.newTeamForm.teamStatus,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
/* 当场新增滑出面板 */
.match-new-panel {
  margin-bottom: 18px;
  padding: 16px 16px 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #2ecc71;
  border-radius: 8px;
}

.match-new-panel-title {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.match-new-panel-title i {
  margin-right: 6px;
  color: #2ecc71;
}
</style>
