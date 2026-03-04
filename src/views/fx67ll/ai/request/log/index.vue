<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="统计周期内API总调用次数" prop="totalRequests">
        <el-input v-model="queryParams.totalRequests" placeholder="请输入统计周期内API总调用次数" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内业务失败调用次数" prop="failRequests">
        <el-input v-model="queryParams.failRequests" placeholder="请输入统计周期内业务失败调用次数" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内限流拦截调用次数" prop="limitRequests">
        <el-input v-model="queryParams.limitRequests" placeholder="请输入统计周期内限流拦截调用次数" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内熔断拦截调用次数" prop="circuitRequests">
        <el-input v-model="queryParams.circuitRequests" placeholder="请输入统计周期内熔断拦截调用次数" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内总输入Token消耗量" prop="totalPromptTokens">
        <el-input v-model="queryParams.totalPromptTokens" placeholder="请输入统计周期内总输入Token消耗量" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内总输出Token消耗量" prop="totalCompletionTokens">
        <el-input v-model="queryParams.totalCompletionTokens" placeholder="请输入统计周期内总输出Token消耗量" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内总预估费用" prop="totalCost">
        <el-input v-model="queryParams.totalCost" placeholder="请输入统计周期内总预估费用" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="统计周期内平均请求耗时" prop="avgDurationMs">
        <el-input v-model="queryParams.avgDurationMs" placeholder="请输入统计周期内平均请求耗时" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:log:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:log:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:log:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:log:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="统计日期" align="center" prop="dailyLogDate" />
      <el-table-column label="统计维度：模型ID" align="center" prop="modelId" />
      <el-table-column label="统计维度：场景ID" align="center" prop="sceneId" />
      <el-table-column label="统计周期内API总调用次数" align="center" prop="totalRequests" />
      <el-table-column label="统计周期内业务失败调用次数" align="center" prop="failRequests" />
      <el-table-column label="统计周期内限流拦截调用次数" align="center" prop="limitRequests" />
      <el-table-column label="统计周期内熔断拦截调用次数" align="center" prop="circuitRequests" />
      <el-table-column label="统计周期内总输入Token消耗量" align="center" prop="totalPromptTokens" />
      <el-table-column label="统计周期内总输出Token消耗量" align="center" prop="totalCompletionTokens" />
      <el-table-column label="统计周期内总预估费用" align="center" prop="totalCost" />
      <el-table-column label="统计周期内平均请求耗时" align="center" prop="avgDurationMs" />
      <el-table-column label="记录调用者" align="center" prop="createBy" width="100" />
      <el-table-column label="记录调用时间" align="center" prop="requestTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.requestTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:log:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:log:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改AI 调用请求日统计日志对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="统计周期内API总调用次数" prop="totalRequests">
          <el-input v-model="form.totalRequests" placeholder="请输入统计周期内API总调用次数" />
        </el-form-item>
        <el-form-item label="统计周期内业务失败调用次数" prop="failRequests">
          <el-input v-model="form.failRequests" placeholder="请输入统计周期内业务失败调用次数" />
        </el-form-item>
        <el-form-item label="统计周期内限流拦截调用次数" prop="limitRequests">
          <el-input v-model="form.limitRequests" placeholder="请输入统计周期内限流拦截调用次数" />
        </el-form-item>
        <el-form-item label="统计周期内熔断拦截调用次数" prop="circuitRequests">
          <el-input v-model="form.circuitRequests" placeholder="请输入统计周期内熔断拦截调用次数" />
        </el-form-item>
        <el-form-item label="统计周期内总输入Token消耗量" prop="totalPromptTokens">
          <el-input v-model="form.totalPromptTokens" placeholder="请输入统计周期内总输入Token消耗量" />
        </el-form-item>
        <el-form-item label="统计周期内总输出Token消耗量" prop="totalCompletionTokens">
          <el-input v-model="form.totalCompletionTokens" placeholder="请输入统计周期内总输出Token消耗量" />
        </el-form-item>
        <el-form-item label="统计周期内总预估费用" prop="totalCost">
          <el-input v-model="form.totalCost" placeholder="请输入统计周期内总预估费用" />
        </el-form-item>
        <el-form-item label="统计周期内平均请求耗时" prop="avgDurationMs">
          <el-input v-model="form.avgDurationMs" placeholder="请输入统计周期内平均请求耗时" />
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
import { listLog, getLog, delLog, addLog, updateLog } from "@/api/fx67ll/ai/log";

export default {
  name: "Log",
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
      // AI 调用请求日统计日志表格数据
      logList: [],
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
        totalRequests: null,
        failRequests: null,
        limitRequests: null,
        circuitRequests: null,
        totalPromptTokens: null,
        totalCompletionTokens: null,
        totalCost: null,
        avgDurationMs: null,
        beginRequestTime: null,
        endRequestTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginRequestTime = null;
      this.queryParams.endRequestTime = null;
    },
    /** 查询AI 调用请求日统计日志列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeRequestTime && "" != this.daterangeRequestTime) {
        this.queryParams.beginRequestTime = this.daterangeRequestTime[0];
        this.queryParams.endRequestTime = this.daterangeRequestTime[1];
      }
      listLog(this.queryParams).then(response => {
        this.logList = this.formatObjectArrayNullProperty(response.rows);
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
        dailyLogDate: null,
        modelId: null,
        sceneId: null,
        totalRequests: null,
        failRequests: null,
        limitRequests: null,
        circuitRequests: null,
        totalPromptTokens: null,
        totalCompletionTokens: null,
        totalCost: null,
        avgDurationMs: null
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
      this.ids = selection.map(item => item.dailyLogDate)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加AI 调用请求日统计日志";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const dailyLogDate = row.dailyLogDate || this.ids
      getLog(dailyLogDate).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改AI 调用请求日统计日志";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.dailyLogDate != null) {
            updateLog(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addLog(this.form).then(response => {
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
      const dailyLogDates = row.dailyLogDate || this.ids;
      this.$modal.confirm('是否确认删除AI 调用请求日统计日志编号为"' + dailyLogDates + '"的数据项？').then(function () {
        return delLog(dailyLogDates);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/log/export', {
        ...this.queryParams
      }, `log_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
