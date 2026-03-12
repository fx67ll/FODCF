<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="关联比赛ID" prop="matchId">
        <el-input v-model="queryParams.matchId" placeholder="请输入关联比赛ID" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="使用的模板ID" prop="promptId">
        <el-input v-model="queryParams.promptId" placeholder="请输入使用的模板ID" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="使用的模型ID" prop="modelId">
        <el-input v-model="queryParams.modelId" placeholder="请输入使用的模型ID" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="AI调用日志关联码" prop="requestLogCode">
        <el-input v-model="queryParams.requestLogCode" placeholder="请输入AI调用日志关联码" clearable
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
          v-hasPermi="['system:analysis:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:analysis:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:analysis:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:analysis:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="analysisList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="分析唯一标识" align="center" prop="analysisId" />
      <el-table-column label="关联比赛ID" align="center" prop="matchId" />
      <el-table-column label="使用的模板ID" align="center" prop="promptId" />
      <el-table-column label="使用的模型ID" align="center" prop="modelId" />
      <el-table-column label="AI调用日志关联码" align="center" prop="requestLogCode" />
      <el-table-column label="分析类型" align="center" prop="analysisType" />
      <el-table-column label="最终请求Prompt" align="center" prop="rawPrompt" />
      <el-table-column label="AI原始响应内容" align="center" prop="rawAiResponse" />
      <el-table-column label="分析业务备注" align="center" prop="analysisRemark" />
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
            v-hasPermi="['system:analysis:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:analysis:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改比赛AI分析原始结果对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="关联比赛ID" prop="matchId">
          <el-input v-model="form.matchId" placeholder="请输入关联比赛ID" />
        </el-form-item>
        <el-form-item label="使用的模板ID" prop="promptId">
          <el-input v-model="form.promptId" placeholder="请输入使用的模板ID" />
        </el-form-item>
        <el-form-item label="使用的模型ID" prop="modelId">
          <el-input v-model="form.modelId" placeholder="请输入使用的模型ID" />
        </el-form-item>
        <el-form-item label="AI调用日志关联码" prop="requestLogCode">
          <el-input v-model="form.requestLogCode" placeholder="请输入AI调用日志关联码" />
        </el-form-item>
        <el-form-item label="最终请求Prompt" prop="rawPrompt">
          <el-input v-model="form.rawPrompt" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="AI原始响应内容" prop="rawAiResponse">
          <el-input v-model="form.rawAiResponse" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="分析业务备注" prop="analysisRemark">
          <el-input v-model="form.analysisRemark" type="textarea" placeholder="请输入内容" />
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
import { listAnalysis, getAnalysis, delAnalysis, addAnalysis, updateAnalysis } from "@/api/fx67ll/dortmund/analysis";

export default {
  name: "Analysis",
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
      // 比赛AI分析原始结果表格数据
      analysisList: [],
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
        matchId: null,
        promptId: null,
        modelId: null,
        requestLogCode: null,
        analysisType: null,
        rawPrompt: null,
        rawAiResponse: null,
        analysisRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        matchId: [
          { required: true, message: "关联比赛ID不能为空", trigger: "blur" }
        ],
        modelId: [
          { required: true, message: "使用的模型ID不能为空", trigger: "blur" }
        ],
        rawPrompt: [
          { required: true, message: "最终请求Prompt不能为空", trigger: "blur" }
        ],
        rawAiResponse: [
          { required: true, message: "AI原始响应内容不能为空", trigger: "blur" }
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
    /** 查询比赛AI分析原始结果列表 */
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
      listAnalysis(this.queryParams).then(response => {
        this.analysisList = this.formatObjectArrayNullProperty(response.rows);
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
        analysisId: null,
        matchId: null,
        promptId: null,
        modelId: null,
        requestLogCode: null,
        analysisType: null,
        rawPrompt: null,
        rawAiResponse: null,
        analysisRemark: null,
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
      this.ids = selection.map(item => item.analysisId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加比赛AI分析原始结果";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const analysisId = row.analysisId || this.ids
      getAnalysis(analysisId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改比赛AI分析原始结果";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.analysisId != null) {
            updateAnalysis(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addAnalysis(this.form).then(response => {
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
      const analysisIds = row.analysisId || this.ids;
      this.$modal.confirm('是否确认删除比赛AI分析原始结果编号为"' + analysisIds + '"的数据项？').then(function () {
        return delAnalysis(analysisIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/analysis/export', {
        ...this.queryParams
      }, `analysis_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
