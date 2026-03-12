<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="关联分析ID" prop="analysisId">
        <el-input v-model="queryParams.analysisId" placeholder="请输入关联分析ID" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="关联比赛ID" prop="matchId">
        <el-input v-model="queryParams.matchId" placeholder="请输入关联比赛ID" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="主队进攻能力标准化评分" prop="homeAttackScore">
        <el-input v-model="queryParams.homeAttackScore" placeholder="请输入主队进攻能力标准化评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="主队防守能力标准化评分" prop="homeDefenseScore">
        <el-input v-model="queryParams.homeDefenseScore" placeholder="请输入主队防守能力标准化评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="主队健康状况评分" prop="homeInjuryScore">
        <el-input v-model="queryParams.homeInjuryScore" placeholder="请输入主队健康状况评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="主队历史交锋评分" prop="homeHistoryScore">
        <el-input v-model="queryParams.homeHistoryScore" placeholder="请输入主队历史交锋评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="主队综合能力总评分" prop="homeTotalScore">
        <el-input v-model="queryParams.homeTotalScore" placeholder="请输入主队综合能力总评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="客队进攻能力标准化评分" prop="awayAttackScore">
        <el-input v-model="queryParams.awayAttackScore" placeholder="请输入客队进攻能力标准化评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="客队防守能力标准化评分" prop="awayDefenseScore">
        <el-input v-model="queryParams.awayDefenseScore" placeholder="请输入客队防守能力标准化评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="客队健康状况评分" prop="awayInjuryScore">
        <el-input v-model="queryParams.awayInjuryScore" placeholder="请输入客队健康状况评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="客队历史交锋评分" prop="awayHistoryScore">
        <el-input v-model="queryParams.awayHistoryScore" placeholder="请输入客队历史交锋评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="客队综合能力总评分" prop="awayTotalScore">
        <el-input v-model="queryParams.awayTotalScore" placeholder="请输入客队综合能力总评分" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="比赛预测结果" prop="predictedResult">
        <el-input v-model="queryParams.predictedResult" placeholder="请输入比赛预测结果" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="预测结果置信度" prop="predictedConfidence">
        <el-input v-model="queryParams.predictedConfidence" placeholder="请输入预测结果置信度" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="评分规则版本号" prop="scoreCalcRuleVersion">
        <el-input v-model="queryParams.scoreCalcRuleVersion" placeholder="请输入评分规则版本号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:score:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:score:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:score:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:score:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="scoreList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="评分唯一标识" align="center" prop="scoreId" />
      <el-table-column label="关联分析ID" align="center" prop="analysisId" />
      <el-table-column label="关联比赛ID" align="center" prop="matchId" />
      <el-table-column label="主队进攻能力标准化评分" align="center" prop="homeAttackScore" />
      <el-table-column label="主队防守能力标准化评分" align="center" prop="homeDefenseScore" />
      <el-table-column label="主队健康状况评分" align="center" prop="homeInjuryScore" />
      <el-table-column label="主队历史交锋评分" align="center" prop="homeHistoryScore" />
      <el-table-column label="主队综合能力总评分" align="center" prop="homeTotalScore" />
      <el-table-column label="客队进攻能力标准化评分" align="center" prop="awayAttackScore" />
      <el-table-column label="客队防守能力标准化评分" align="center" prop="awayDefenseScore" />
      <el-table-column label="客队健康状况评分" align="center" prop="awayInjuryScore" />
      <el-table-column label="客队历史交锋评分" align="center" prop="awayHistoryScore" />
      <el-table-column label="客队综合能力总评分" align="center" prop="awayTotalScore" />
      <el-table-column label="比赛预测结果" align="center" prop="predictedResult" />
      <el-table-column label="预测结果置信度" align="center" prop="predictedConfidence" />
      <el-table-column label="评分规则版本号" align="center" prop="scoreCalcRuleVersion" />
      <el-table-column label="扩展评分数据" align="center" prop="extraScoreStr" />
      <el-table-column label="评分业务备注" align="center" prop="scoreRemark" />
      <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
            }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:score:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:score:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改比赛标准化评分对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="关联分析ID" prop="analysisId">
          <el-input v-model="form.analysisId" placeholder="请输入关联分析ID" />
        </el-form-item>
        <el-form-item label="关联比赛ID" prop="matchId">
          <el-input v-model="form.matchId" placeholder="请输入关联比赛ID" />
        </el-form-item>
        <el-form-item label="主队进攻能力标准化评分" prop="homeAttackScore">
          <el-input v-model="form.homeAttackScore" placeholder="请输入主队进攻能力标准化评分" />
        </el-form-item>
        <el-form-item label="主队防守能力标准化评分" prop="homeDefenseScore">
          <el-input v-model="form.homeDefenseScore" placeholder="请输入主队防守能力标准化评分" />
        </el-form-item>
        <el-form-item label="主队健康状况评分" prop="homeInjuryScore">
          <el-input v-model="form.homeInjuryScore" placeholder="请输入主队健康状况评分" />
        </el-form-item>
        <el-form-item label="主队历史交锋评分" prop="homeHistoryScore">
          <el-input v-model="form.homeHistoryScore" placeholder="请输入主队历史交锋评分" />
        </el-form-item>
        <el-form-item label="主队综合能力总评分" prop="homeTotalScore">
          <el-input v-model="form.homeTotalScore" placeholder="请输入主队综合能力总评分" />
        </el-form-item>
        <el-form-item label="客队进攻能力标准化评分" prop="awayAttackScore">
          <el-input v-model="form.awayAttackScore" placeholder="请输入客队进攻能力标准化评分" />
        </el-form-item>
        <el-form-item label="客队防守能力标准化评分" prop="awayDefenseScore">
          <el-input v-model="form.awayDefenseScore" placeholder="请输入客队防守能力标准化评分" />
        </el-form-item>
        <el-form-item label="客队健康状况评分" prop="awayInjuryScore">
          <el-input v-model="form.awayInjuryScore" placeholder="请输入客队健康状况评分" />
        </el-form-item>
        <el-form-item label="客队历史交锋评分" prop="awayHistoryScore">
          <el-input v-model="form.awayHistoryScore" placeholder="请输入客队历史交锋评分" />
        </el-form-item>
        <el-form-item label="客队综合能力总评分" prop="awayTotalScore">
          <el-input v-model="form.awayTotalScore" placeholder="请输入客队综合能力总评分" />
        </el-form-item>
        <el-form-item label="比赛预测结果" prop="predictedResult">
          <el-input v-model="form.predictedResult" placeholder="请输入比赛预测结果" />
        </el-form-item>
        <el-form-item label="预测结果置信度" prop="predictedConfidence">
          <el-input v-model="form.predictedConfidence" placeholder="请输入预测结果置信度" />
        </el-form-item>
        <el-form-item label="评分规则版本号" prop="scoreCalcRuleVersion">
          <el-input v-model="form.scoreCalcRuleVersion" placeholder="请输入评分规则版本号" />
        </el-form-item>
        <el-form-item label="扩展评分数据" prop="extraScoreStr">
          <el-input v-model="form.extraScoreStr" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="评分业务备注" prop="scoreRemark">
          <el-input v-model="form.scoreRemark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listScore, getScore, delScore, addScore, updateScore } from "@/api/fx67ll/dortmund/score";

export default {
  name: "Score",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 比赛标准化评分表格数据
      scoreList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        analysisId: null,
        matchId: null,
        homeAttackScore: null,
        homeDefenseScore: null,
        homeInjuryScore: null,
        homeHistoryScore: null,
        homeTotalScore: null,
        awayAttackScore: null,
        awayDefenseScore: null,
        awayInjuryScore: null,
        awayHistoryScore: null,
        awayTotalScore: null,
        predictedResult: null,
        predictedConfidence: null,
        scoreCalcRuleVersion: null,
        extraScoreStr: null,
        scoreRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        analysisId: [
          { required: true, message: "关联分析ID不能为空", trigger: "blur" }
        ],
        matchId: [
          { required: true, message: "关联比赛ID不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询比赛标准化评分列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listScore(this.queryParams).then(response => {
        this.scoreList = this.formatObjectArrayNullProperty(response.rows);
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        scoreId: null,
        analysisId: null,
        matchId: null,
        homeAttackScore: null,
        homeDefenseScore: null,
        homeInjuryScore: null,
        homeHistoryScore: null,
        homeTotalScore: null,
        awayAttackScore: null,
        awayDefenseScore: null,
        awayInjuryScore: null,
        awayHistoryScore: null,
        awayTotalScore: null,
        predictedResult: null,
        predictedConfidence: null,
        scoreCalcRuleVersion: null,
        extraScoreStr: null,
        scoreRemark: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.scoreId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加比赛标准化评分";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const scoreId = row.scoreId || this.ids
      getScore(scoreId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改比赛标准化评分";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.scoreId != null) {
            updateScore(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addScore(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const scoreIds = row.scoreId || this.ids;
      this.$modal.confirm('是否确认删除比赛标准化评分编号为"' + scoreIds + '"的数据项？').then(function () {
        return delScore(scoreIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/score/export', {
        ...this.queryParams
      }, `score_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
