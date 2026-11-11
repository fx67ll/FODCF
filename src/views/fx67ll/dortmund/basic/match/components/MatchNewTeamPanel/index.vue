<template>
  <!-- 当场新增主队/客队滑出面板（同页面板，不是子弹窗；与比赛同一事务提交，side区分主客队，由编排场景v-if控制挂载） -->
  <div class="match-new-panel">
    <div class="match-new-panel-title">
      <i class="el-icon-collection-tag"></i>
      <span>当场新增{{ side === "home" ? "主队" : "客队" }}（与比赛保存在同一事务，任一步失败全部回滚）</span>
    </div>
    <el-form ref="newTeamForm" :model="newTeamForm" :rules="newTeamRules" label-width="85px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="球队编码" prop="teamCode">
            <el-input v-model="newTeamForm.teamCode" placeholder="请输入球队编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="球队全称" prop="teamName">
            <el-input v-model="newTeamForm.teamName" placeholder="请输入球队中文全称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="球队昵称" prop="teamNameShort">
            <el-input v-model="newTeamForm.teamNameShort" placeholder="请输入球队昵称/简称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="球队英文" prop="teamNameEn">
            <el-input v-model="newTeamForm.teamNameEn" placeholder="请输入球队英文名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="球队主场" prop="teamVenue">
            <dortmund-option-select v-model="newTeamForm.teamVenue" option-type="venue" placeholder="请选择或输入球队主场" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地区/联赛" prop="teamCountry">
            <dortmund-option-select v-model="newTeamForm.teamCountry" option-type="country" placeholder="请选择或输入地区/联赛" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="球队Logo" prop="teamLogoUrl">
            <el-input v-model="newTeamForm.teamLogoUrl" placeholder="请输入球队Logo图片的链接地址" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="球队标签" prop="teamTag">
            <dortmund-option-select v-model="newTeamForm.teamTag" option-type="tag" placeholder="请选择或输入球队标签" multiple />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="球队状态" prop="teamStatus">
            <el-switch v-model="newTeamForm.teamStatus" active-value="0" inactive-value="1" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import DortmundOptionSelect from "@/views/fx67ll/dortmund/other/component/DortmundOptionSelect/index";

export default {
  name: "MatchNewTeamPanel",
  components: { DortmundOptionSelect },
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
        teamCode: [
          { required: true, message: "球队编码不能为空", trigger: "blur" }
        ],
        teamName: [
          { required: true, message: "球队全称不能为空", trigger: "blur" }
        ],
        teamNameShort: [
          { required: true, message: "球队昵称不能为空", trigger: "blur" }
        ],
        teamNameEn: [
          { required: true, message: "球队英文不能为空", trigger: "blur" }
        ],
        teamLogoUrl: [
          { required: true, message: "球队Logo不能为空", trigger: "blur" }
        ],
        teamCountry: [
          { required: true, message: "地区/联赛不能为空", trigger: "blur" }
        ],
        teamTag: [
          { required: true, message: "球队标签不能为空", trigger: "blur" }
        ],
        teamStatus: [
          { required: true, message: "球队状态不能为空", trigger: "blur" }
        ],
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
      return {
        teamCode: this.newTeamForm.teamCode,
        teamName: this.newTeamForm.teamName,
        teamNameShort: this.newTeamForm.teamNameShort,
        teamNameEn: this.newTeamForm.teamNameEn,
        teamLogoUrl: this.newTeamForm.teamLogoUrl,
        teamVenue: this.newTeamForm.teamVenue,
        teamCountry: this.newTeamForm.teamCountry,
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
