<template>
  <!-- 当场新增赛季滑出面板（同页面板，不是子弹窗；与比赛同一事务提交，由编排场景v-if控制挂载） -->
  <div class="match-new-panel">
    <div class="match-new-panel-title">
      <i class="el-icon-collection-tag"></i>
      <span>当场新增赛季（与比赛保存在同一事务，任一步失败全部回滚）</span>
    </div>
    <el-form ref="newSeasonForm" :model="newSeasonForm" :rules="newSeasonRules" label-width="105px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item prop="seasonCode">
            <template slot="label">
              <dortmund-form-label label="赛季编码" tip="必填；1-23个字符，全局唯一；可按开始日期自动生成 SEA-YYYYMMDD-XXXXXX" />
            </template>
            <dortmund-code-input v-model="newSeasonForm.seasonCode" code-kind="season"
              :date-value="newSeasonForm.seasonStartDate" :maxlength="limits.seasonCode" placeholder="请输入或自动生成赛季编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="seasonName">
            <template slot="label">
              <dortmund-form-label label="赛季名称" tip="必填；1-233个字符" />
            </template>
            <el-input v-model="newSeasonForm.seasonName" :maxlength="limits.seasonName" show-word-limit
              placeholder="请输入赛季名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="seasonStartDate">
            <template slot="label">
              <dortmund-form-label label="开始日期" tip="必填；格式yyyy-MM-dd，且不得晚于结束日期" />
            </template>
            <el-date-picker clearable v-model="newSeasonForm.seasonStartDate" type="date" value-format="yyyy-MM-dd"
              popper-class="dortmund-theme-popper" style="width: 100%" placeholder="请选择赛季开始日期" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="seasonEndDate">
            <template slot="label">
              <dortmund-form-label label="结束日期" tip="必填；格式yyyy-MM-dd，且不得早于开始日期" />
            </template>
            <el-date-picker clearable v-model="newSeasonForm.seasonEndDate" type="date" value-format="yyyy-MM-dd"
              popper-class="dortmund-theme-popper" style="width: 100%" placeholder="请选择赛季结束日期" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="seasonStatus">
            <template slot="label">
              <dortmund-form-label label="赛季状态" tip="必填；0=进行中，1=已结束，2=未开始" />
            </template>
            <el-select v-model="newSeasonForm.seasonStatus" style="width: 100%" placeholder="请选择赛季状态"
              popper-class="dortmund-theme-popper">
              <el-option v-for="dict in dict.type.fx67ll_dortmund_status" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundCodeInput from "@/views/fx67ll/dortmund/other/component/DortmundCodeInput/index";
import {
  DORTMUND_LIMITS,
  DORTMUND_SEASON_STATUS_OPTIONS,
  dateRangeRule,
  enumRule,
  requiredTextRule,
  trimTextFields,
} from "@/views/fx67ll/dortmund/other/utils/validation";

export default {
  name: "MatchNewSeasonPanel",
  dicts: ["fx67ll_dortmund_status"],
  components: { DortmundFormLabel, DortmundCodeInput },
  data() {
    return {
      limits: DORTMUND_LIMITS,
      // 当场新增赛季表单参数（提交进 newSeason，与比赛同一事务）
      newSeasonForm: {
        seasonCode: null,
        seasonName: null,
        seasonStartDate: null,
        seasonEndDate: null,
        seasonStatus: "0",
      },
      // 当场新增赛季表单校验（沿用赛季页必填项）
      newSeasonRules: {
        seasonCode: [requiredTextRule("赛季编码", DORTMUND_LIMITS.seasonCode)],
        seasonName: [requiredTextRule("赛季名称", DORTMUND_LIMITS.seasonName)],
        seasonStartDate: [
          { required: true, message: "赛季开始日期不能为空", trigger: "change" },
          dateRangeRule("赛季日期", () => this.newSeasonForm.seasonStartDate,
            () => this.newSeasonForm.seasonEndDate)
        ],
        seasonEndDate: [
          { required: true, message: "赛季结束日期不能为空", trigger: "change" },
          dateRangeRule("赛季日期", () => this.newSeasonForm.seasonStartDate,
            () => this.newSeasonForm.seasonEndDate)
        ],
        seasonStatus: [enumRule("赛季状态", DORTMUND_SEASON_STATUS_OPTIONS, true)],
      },
    };
  },
  methods: {
    // 校验面板表单（返回Promise，供编排场景汇总校验）
    validate() {
      return new Promise(resolve => {
        this.$refs["newSeasonForm"].validate(valid => resolve(valid));
      });
    },
    // 构建当场新增赛季提交体
    getSubmitData() {
      return trimTextFields(this.newSeasonForm, ["seasonCode", "seasonName"]);
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
