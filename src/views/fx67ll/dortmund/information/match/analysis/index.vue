<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="分析编号" prop="analysisId" v-if="isMoreQuery">
        <el-input v-model="queryParams.analysisId" type="number" min="1" step="1" placeholder="请输入分析编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="关联比赛" prop="matchId" v-if="isMoreQuery">
        <el-input v-model="queryParams.matchId" placeholder="请输入分析的关联比赛编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <!-- 字典码：0-模板分析，1-自定义文本分析  -->
      <el-form-item label="分析类型" prop="analysisType" v-if="isMoreQuery">
        <el-select v-model="queryParams.analysisType" placeholder="请选择分析类型" clearable style="width: 100%"
          @keyup.enter.native="handleQuery">
          <el-option v-for="item in analysisTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="请求模版" prop="promptId" v-if="isMoreQuery && queryParams.analysisType === '0'">
        <common-enhanced-select ref="promptSelect" v-model="queryParams.promptId" valueKey="promptId"
          labelKey="promptName" :api-func="listTemplate" placeholder="请选择使用的提示语模板" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="绑定模型" prop="modelId" v-if="isMoreQuery">
        <common-enhanced-select ref="modelSelect" v-model="queryParams.modelId" valueKey="modelId" labelKey="modelName"
          :api-func="listModel" placeholder="请选择使用的绑定模型" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="请求记录" prop="requestLogCode" v-if="isMoreQuery">
        <el-input v-model="queryParams.requestLogCode" placeholder="请输入请求记录编码" clearable
          @keyup.enter.native="handleQuery" />
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
      <el-table-column label="分析编号" align="center" prop="analysisId" width="80" fixed="left" />
      <el-table-column label="关联比赛" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.homeTeamName && scope.row.awayTeamName ? `${scope.row.homeTeamName} VS
            ${scope.row.awayTeamName}` : '' }}</span>
        </template>
      </el-table-column>
      <!-- 字典码：0-模板分析，1-自定义文本分析 -->
      <el-table-column label="分析类型" align="center" prop="analysisType" width="100">
        <template slot-scope="scope">
          {{ analysisTypeMap[scope.row.analysisType] || scope.row.analysisType }}
        </template>
      </el-table-column>
      <el-table-column label="请求模版" align="center" prop="promptName" width="120" />
      <el-table-column label="绑定模型" align="center" prop="modelName" width="120" />
      <el-table-column label="请求记录" align="center" prop="requestLogCode" width="180" />
      <el-table-column label="提示语模板内容" align="center" prop="rawPrompt" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="AI原始响应内容" align="center" prop="rawAiResponse" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="分析备注" align="center" prop="analysisRemark" width="230" :show-overflow-tooltip="true" />
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
            v-hasPermi="['system:analysis:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:analysis:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改比赛分析日志记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" style="top: 100px"
      append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="82px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联比赛" prop="matchId">
              {{
                form.homeTeamName && form.awayTeamName ? `${form.homeTeamName} VS ${form.awayTeamName}` : '-- 暂无数据 --'
              }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求记录" prop="requestLogCode">
              {{ form.requestLogCode || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <!-- 字典码：0-模板分析，1-自定义文本分析 -->
          <el-col :span="12">
            <el-form-item label="分析类型" prop="analysisType">
              <el-select v-model="form.analysisType" placeholder="请选择分析类型" clearable filterable style="width: 100%">
                <el-option v-for="item in analysisTypeOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"">
            <el-form-item label=" 绑定模型" prop="modelId">
            <common-enhanced-select ref="modelSelect" v-model="form.modelId" valueKey="modelId" labelKey="modelName"
              :api-func="listModel" placeholder="请选择使用的绑定模型" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.analysisType === '0'">
            <el-form-item label="请求模版" prop="promptId">
              <common-enhanced-select ref="promptSelect" v-model="form.promptId" valueKey="promptId"
                labelKey="promptName" :api-func="listTemplate" placeholder="请选择使用的提示语模板" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提示语模板内容" prop="rawPrompt" label-width="124px">
              <el-input v-model="form.rawPrompt" type="textarea" placeholder="请输入提示语模板内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分析备注" prop="analysisRemark">
              <el-input v-model="form.analysisRemark" type="textarea" placeholder="请输入分析备注内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="AI原始响应内容" prop="rawAiResponse" label-width="124px">
              <el-input v-model="form.rawAiResponse" type="textarea" placeholder="请输入AI原始响应内容" />
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
import { listAnalysis, getAnalysis, delAnalysis, addAnalysis, updateAnalysis } from "@/api/fx67ll/dortmund/analysis";
import { listTemplate } from "@/api/fx67ll/ai/template";
import { listModel } from "@/api/fx67ll/ai/model";

import { analysisTypeOptions } from "@/utils/constant/fx67ll";
import { arrayToMap } from "@/utils/fx67ll/utils";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Analysis",
  components: { CommonEnhancedSelect },
  computed: {
    // 分析类型映射
    analysisTypeMap() {
      return arrayToMap(this.analysisTypeOptions);
    }
  },
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
      // 比赛分析日志记录表格数据
      analysisList: [],
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
        analysisId: null,
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
          { required: true, message: "关联比赛不能为空", trigger: "blur" }
        ],
        modelId: [
          { required: true, message: "绑定模型不能为空", trigger: "blur" }
        ],
        rawPrompt: [
          { required: true, message: "提示语模板内容不能为空", trigger: "blur" }
        ],
        rawAiResponse: [
          { required: true, message: "AI原始响应内容不能为空", trigger: "blur" }
        ],
      },
      // 分析类型选项
      analysisTypeOptions,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listTemplate = listTemplate;
    this.listModel = listModel;

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
    /** 查询比赛分析日志记录列表 */
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
      this.ids = selection.map(item => item.analysisId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加比赛分析日志记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const analysisId = row.analysisId || this.ids
      getAnalysis(analysisId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改比赛分析日志记录";
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
      this.$modal.confirm('是否确认删除比赛分析日志记录编号为"' + analysisIds + '"的数据项？').then(function () {
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
