<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="评分编号" prop="scoreId" v-if="isMoreQuery">
        <el-input v-model="queryParams.scoreId" type="number" min="1" step="1" placeholder="请输入评分编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="关联分析" prop="analysisId" v-if="isMoreQuery">
        <el-input v-model="queryParams.analysisId" type="number" min="1" step="1" placeholder="请输入关联的分析日志编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="关联比赛" prop="matchId" v-if="isMoreQuery">
        <el-input v-model="queryParams.matchId" type="number" min="1" step="1" placeholder="请输入关联的评分比赛编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="预测结果" prop="predictedResult" v-if="isMoreQuery">
        <el-select v-model="queryParams.predictedResult" style="width: 100%" placeholder="请选择比赛预测结果" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
            :value="dict.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        <el-button type="info" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
          @click="handleMoreQuery">
          {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <!-- <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:score:add']">新增</el-button>
      </el-col> -->
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
      <el-table-column label="评分编号" align="center" prop="scoreId" width="80" fixed="left" />
      <el-table-column label="关联的分析日志编号" align="center" prop="analysisId" width="140" />
      <el-table-column label="关联的评分比赛编号" align="center" prop="matchId" width="140" />
      <el-table-column label="主队进攻能力标准化评分" align="center" prop="homeAttackScore" width="170" />
      <el-table-column label="主队防守能力标准化评分" align="center" prop="homeDefenseScore" width="170" />
      <el-table-column label="主队健康状况评分" align="center" prop="homeInjuryScore" width="130" />
      <el-table-column label="主队历史交锋评分" align="center" prop="homeHistoryScore" width="130" />
      <el-table-column label="主队综合能力总评分" align="center" prop="homeTotalScore" width="140" />
      <el-table-column label="客队进攻能力标准化评分" align="center" prop="awayAttackScore" width="170" />
      <el-table-column label="客队防守能力标准化评分" align="center" prop="awayDefenseScore" width="170" />
      <el-table-column label="客队健康状况评分" align="center" prop="awayInjuryScore" width="130" />
      <el-table-column label="客队历史交锋评分" align="center" prop="awayHistoryScore" width="130" />
      <el-table-column label="客队综合能力总评分" align="center" prop="awayTotalScore" width="140" />
      <el-table-column label="比赛预测结果" align="center" prop="predictedResult" width="100" />
      <el-table-column label="预测结果置信度" align="center" prop="predictedConfidence" width="120" />
      <el-table-column label="比赛评分版本号" align="center" prop="scoreCalcRuleVersion" width="120" />
      <el-table-column label="比赛扩展评分" align="center" prop="extraScoreStr" width="100" :show-overflow-tooltip="true" />
      <el-table-column label="比赛评分备注" align="center" prop="scoreRemark" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
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
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20" :align="middle">
          <el-col :span="12">
            <el-form-item label="关联的分析日志编号" prop="analysisId" label-width="150px" v-if="!isAdd">
              <el-input v-model="form.analysisId" type="number" min="1" step="1" placeholder="请输入关联的分析日志编号" disabled />
            </el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="关联的评分比赛编号" prop="matchId" label-width="150px" v-if="!isAdd">
              <el-input v-model="form.matchId" type="number" min="1" step="1" placeholder="请输入关联的评分比赛编号" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider v-if="!isAdd"></el-divider>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主队进攻能力标准化评分" prop="homeAttackScore" label-width="170px">
              <el-input v-model="form.homeAttackScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主队防守能力标准化评分" prop="homeDefenseScore" label-width="172px">
              <el-input v-model="form.homeDefenseScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主队健康状况评分" prop="homeInjuryScore" label-width="127px">
              <el-input v-model="form.homeInjuryScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主队历史交锋评分" prop="homeHistoryScore" label-width="130px">
              <el-input v-model="form.homeHistoryScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="主队综合能力总评分" prop="homeTotalScore" label-width="142px">
              <el-input v-model="form.homeTotalScore" style="width: 230px" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider></el-divider>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队进攻能力标准化评分" prop="awayAttackScore" label-width="170px">
              <el-input v-model="form.awayAttackScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队防守能力标准化评分" prop="awayDefenseScore" label-width="172px">
              <el-input v-model="form.awayDefenseScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队健康状况评分" prop="awayInjuryScore" label-width="127px">
              <el-input v-model="form.awayInjuryScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队历史交锋评分" prop="awayHistoryScore" label-width="130px">
              <el-input v-model="form.awayHistoryScore" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="客队综合能力总评分" prop="awayTotalScore" label-width="142px">
              <el-input v-model="form.awayTotalScore" style="width: 230px" type="number" min="0" max="100" step="0.01"
                placeholder="请输入评分" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider></el-divider>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比赛预测结果" prop="predictedResult">
              <el-select v-model="queryParams.predictedResult" style="width: 100%" placeholder="请选择比赛预测结果" clearable
                @keyup.enter.native="handleQuery">
                <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预测结果置信度" prop="predictedConfidence" label-width="118px">
              <el-input v-model="form.predictedConfidence" type="number" min="0" max="100" step="0.01"
                placeholder="请输入预测结果置信度" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比赛评分版本" prop="scoreCalcRuleVersion">
              <el-input v-model="form.scoreCalcRuleVersion" type="number" min="0" max="1023" step="1"
                placeholder="请输入比赛评分版本号" disabed />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="额外扩展评分" prop="extraScoreStr">
              <el-input v-model="form.extraScoreStr" type="textarea" placeholder="请输入比赛额外扩展评分内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="比赛评分备注" prop="scoreRemark">
              <el-input v-model="form.scoreRemark" type="textarea" placeholder="请输入比赛评分备注内容" />
            </el-form-item>
          </el-col>
        </el-row>
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
  dicts: ["fx67ll_match_result"],
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
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        scoreId: null,
        analysisId: null,
        matchId: null,
        predictedResult: null,
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
          { required: true, message: "关联的分析日志编号不能为空", trigger: "blur" }
        ],
        matchId: [
          { required: true, message: "关联的评分比赛编号不能为空", trigger: "blur" }
        ],
      },
      // 是否是新增
      isAdd: false,
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
    /** 高级搜索按钮操作 */
    handleMoreQuery() {
      this.isMoreQuery = !this.isMoreQuery;
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
      this.isAdd = true;
      this.open = true;
      this.title = "添加比赛标准化评分";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.isAdd = false;
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
