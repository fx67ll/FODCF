<template>
  <!-- 当场新增赛季滑出面板（同页面板，不是子弹窗；与比赛同一事务提交，由编排场景v-if控制挂载） -->
  <div class="match-new-panel">
    <div class="match-new-panel-title">
      <i class="el-icon-collection-tag"></i>
      <span>当场新增赛季（与比赛保存在同一事务，任一步失败全部回滚）</span>
    </div>
    <el-form ref="newSeasonForm" :model="newSeasonForm" :rules="newSeasonRules" label-width="85px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="赛季编码" prop="seasonCode">
            <el-input v-model="newSeasonForm.seasonCode" placeholder="请输入赛季编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="赛季名称" prop="seasonName">
            <el-input v-model="newSeasonForm.seasonName" placeholder="请输入赛季名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开始日期" prop="seasonStartDate">
            <el-date-picker clearable v-model="newSeasonForm.seasonStartDate" type="date" value-format="yyyy-MM-dd"
              style="width: 100%" placeholder="请选择赛季开始日期" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期" prop="seasonEndDate">
            <el-date-picker clearable v-model="newSeasonForm.seasonEndDate" type="date" value-format="yyyy-MM-dd"
              style="width: 100%" placeholder="请选择赛季结束日期" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="赛季状态" prop="seasonStatus">
            <el-select v-model="newSeasonForm.seasonStatus" style="width: 100%" placeholder="请选择赛季状态">
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
export default {
  name: "MatchNewSeasonPanel",
  dicts: ["fx67ll_dortmund_status"],
  data() {
    return {
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
        seasonCode: [
          { required: true, message: "赛季编码不能为空", trigger: "blur" }
        ],
        seasonName: [
          { required: true, message: "赛季名称不能为空", trigger: "blur" }
        ],
        seasonStartDate: [
          { required: true, message: "赛季开始日期不能为空", trigger: "blur" }
        ],
        seasonEndDate: [
          { required: true, message: "赛季结束日期不能为空", trigger: "blur" }
        ],
        seasonStatus: [
          { required: true, message: "赛季状态不能为空", trigger: "blur" }
        ],
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
      return { ...this.newSeasonForm };
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
