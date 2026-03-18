<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="日志编号" prop="requestLogId" v-if="isMoreQuery">
        <el-input v-model="queryParams.requestLogId" type="number" min="1" step="1" placeholder="请输入日志编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="请求模板" prop="promptId" v-if="isMoreQuery">
        <common-enhanced-select ref="promptSelect" v-model="queryParams.promptId" valueKey="promptId"
          labelKey="promptName" :api-func="listTemplate" placeholder="请选择请求模板" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="模版分组" prop="groupId" v-if="isMoreQuery">
        <common-enhanced-select ref="groupSelect" v-model="queryParams.groupId" valueKey="groupId" labelKey="groupName"
          :api-func="listGroup" placeholder="请选择模版分组" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="模版场景" prop="sceneId" v-if="isMoreQuery">
        <common-enhanced-select ref="sceneSelect" v-model="queryParams.sceneId" valueKey="sceneId" labelKey="sceneName"
          :api-func="listScene" placeholder="请选择模版场景" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="绑定模型" prop="modelId">
        <common-enhanced-select ref="modelSelect" v-model="queryParams.modelId" valueKey="modelId" labelKey="modelName"
          :api-func="listModel" placeholder="请选择绑定模型" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="预估费用" prop="cost" v-if="isMoreQuery">
        <el-input v-model="queryParams.cost" placeholder="请输入本次请求预估总费用" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="货币类型" prop="costCurrency" v-if="isMoreQuery">
        <el-select v-model="queryParams.costCurrency" style="width: 100%" placeholder="请选择或输入计价货币类型" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="item in modelTokenCurrencyOptions" :key="item.value" :label="item.label" :value="item.value"
            :enter-callback="handleQuery" />
        </el-select>
      </el-form-item>
      <el-form-item label="请求耗时" prop="durationMs" v-if="isMoreQuery">
        <el-input v-model="queryParams.durationMs" type="number" min="1" step="1" placeholder="请输入请求耗时(毫秒)" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="请求IP地址" prop="callerIp" label-width="82px" v-if="isMoreQuery">
        <el-input v-model="queryParams.callerIp" placeholder="请输入请求IP地址" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="请求用户" prop="createBy" v-if="isMoreQuery">
        <el-input v-model="queryParams.createBy" placeholder="请输入请求发起用户用户名" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="请求时间">
        <el-date-picker v-model="daterangeRequestTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <!-- 字典码：00-成功，01-业务失败，02-限流拦截，03-熔断拦截 -->
      <el-form-item label="请求状态" prop="callerStatus" v-if="isMoreQuery">
        <el-select v-model="queryParams.callerStatus" style="width: 100%" placeholder="请选择请求业务状态" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="item in callStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 字典码：200、400、500等等 -->
      <el-form-item label="HTTP状态码" prop="httpStatus" label-width="92px" v-if="isMoreQuery">
        <el-select v-model="queryParams.httpStatus" style="width: 100%" placeholder="请选择HTTP响应状态码" clearable filterable>
          <el-option v-for="item in httpStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
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
          v-hasPermi="['system:log:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:log:edit']">修改</el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:log:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:log:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="日志编号" align="center" prop="requestLogId" width="80" fixed="left" />
      <el-table-column label="请求模板" align="center" prop="promptName" width="120" />
      <el-table-column label="模版分组" align="center" prop="groupName" width="120" />
      <el-table-column label="模版场景" align="center" prop="sceneName" width="120" />
      <el-table-column label="绑定模型" align="center" prop="modelName" width="120" />
      <el-table-column label="请求完整内容" align="center" prop="requestContent" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="响应完整内容" align="center" prop="responseContent" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="输入Token消耗量" align="center" prop="promptTokens" width="130" />
      <el-table-column label="输出Token消耗量" align="center" prop="completionTokens" width="130" />
      <el-table-column label="总Token消耗量" align="center" prop="totalTokens" width="110" />
      <el-table-column label="本次调用预估费用" align="center" prop="cost" width="140" />
      <el-table-column label="计价货币类型" align="center" prop="costCurrency" width="100">
        <template slot-scope="scope">
          {{ modelTokenCurrencyMap[scope.row.costCurrency] || scope.row.costCurrency }}
        </template>
      </el-table-column>
      <el-table-column label="请求耗时" align="center" prop="durationMs" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.durationMs !== '-' ? `${scope.row.durationMs}ms` : scope.row.durationMs }}</span>
        </template>
      </el-table-column>
      <!-- 字典码：200、400、500等等 -->
      <el-table-column label="HTTP响应状态码" align="center" prop="httpStatus" width="120">
        <template slot-scope="scope">
          {{ httpStatusMap[scope.row.httpStatus] || scope.row.httpStatus }}
        </template>
      </el-table-column>
      <!-- 字典码：00-成功，01-业务失败，02-限流拦截，03-熔断拦截 -->
      <el-table-column label="请求业务状态" align="center" prop="callStatus" width="100">
        <template slot-scope="scope">
          {{ callStatusMap[scope.row.callStatus] || scope.row.callStatus }}
        </template>
      </el-table-column>
      <el-table-column label="错误堆栈信息" align="center" prop="errorMsg" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="请求IP地址" align="center" prop="callerIp" width="120" fixed="right" />
      <el-table-column label="请求发起用户" align="center" prop="createBy" width="100" :show-overflow-tooltip="true"
        fixed="right" />
      <el-table-column label="请求时间" align="center" prop="requestTime" width="160" fixed="right">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.requestTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="80">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)"
            v-hasPermi="['system:log:query']">详细</el-button>
          <!-- <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:log:edit']">修改</el-button> -->
          <!-- <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:log:remove']">删除</el-button> -->
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改调用请求日志对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="68px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="请求模板" prop="promptName">
              <common-enhanced-select ref="promptSelect" v-model="form.promptId" valueKey="promptId"
                labelKey="promptName" :api-func="listTemplate" placeholder="请选择请求模板" disabled v-if="false" />
              {{ form.promptName || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模版分组" prop="groupName">
              <el-input v-model="form.groupName" placeholder="请输入模版分组" disabled v-if="false" />
              <common-enhanced-select ref="groupSelect" v-model="form.groupId" valueKey="groupId" labelKey="groupName"
                :api-func="listGroup" placeholder="请选择模版分组" disabled v-if="false" />
              {{ form.groupName || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模版场景" prop="sceneName">
              <el-input v-model="form.sceneName" placeholder="请输入模版场景" disabled v-if="false" />
              <common-enhanced-select ref="sceneSelect" v-model="form.sceneId" valueKey="sceneId" labelKey="sceneName"
                :api-func="listScene" placeholder="请选择模版场景" disabled v-if="false" />
              {{ form.sceneName || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="绑定模型" prop="modelName">
              <el-input v-model="form.modelName" placeholder="请输入绑定模型" disabled v-if="false" />
              <common-enhanced-select ref="modelSelect" v-model="form.modelId" valueKey="modelId" labelKey="modelName"
                :api-func="listModel" placeholder="请选择绑定模型" disabled v-if="false" />
              {{ form.modelName || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider></el-divider>
          </el-col>
          <el-col :span="8">
            <el-form-item label="输入Token消耗量" prop="promptTokens" label-width="124px">
              <el-input v-model="form.promptTokens" type="number" min="0" placeholder="请输入输入Token消耗量" disabled
                v-if="false" />
              {{ form.promptTokens || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="输出Token消耗量" prop="completionTokens" label-width="124px">
              <el-input v-model="form.completionTokens" type="number" min="0" placeholder="请输入输出Token消耗量" disabled
                v-if="false" />
              {{ form.completionTokens || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总Token消耗量" prop="totalTokens" label-width="110px">
              <el-input v-model="form.totalTokens" type="number" min="0" placeholder="请输入总Token消耗量" disabled
                v-if="false" />
              {{ form.totalTokens || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="本次请求预估总费用" prop="cost" label-width="138px">
              <el-input v-model="form.cost" type="number" min="0" placeholder="请输入本次请求预估总费用" disabled v-if="false" />
              {{ form.cost || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="计价货币类型" prop="costCurrency" label-width="96px">
              <el-select v-model="form.costCurrency" style="width: 100%" placeholder="请选择计价货币类型" clearable disabled
                v-if="false">
                <el-option v-for="item in modelTokenCurrencyOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
              {{ modelTokenCurrencyMap[form.costCurrency] || form.costCurrency || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider></el-divider>
          </el-col>
          <el-col :span="8">
            <el-form-item label="请求IP" prop="callerIp" label-width="54px">
              <el-input v-model="form.callerIp" placeholder="请输入请求IP地址" disabled v-if="false" />
              {{ form.callerIp || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="请求发起用户" prop="createBy" label-width="96px">
              <el-input v-model="form.createBy" placeholder="请输入调用请求的用户用户名" disabled v-if="false" />
              {{ form.createBy || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="请求发起时间" prop="requestTime" label-width="100px">
              <el-date-picker clearable v-model="form.requestTime" style="width: 100%" type="date"
                value-format="yyyy-MM-dd" placeholder="请选择请求发起时间" disabled v-if="false">
              </el-date-picker>
              {{ form.requestTime ? parseTime(form.requestTime, "{y}-{m}-{d} {h}:{i}:{s}") : '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="请求耗时" prop="durationMs">
              <el-input v-model="form.durationMs" type="number" min="1" step="1" placeholder="请输入请求耗时" disabled
                v-if="false" />
              {{ form.durationMs || '-- 暂无数据 --' }}ms
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="请求业务状态" prop="callStatus" label-width="96px">
              <el-input v-model="form.callStatus" placeholder="请输入请求业务状态" disabled v-if="false" />
              {{ callStatusMap[form.callStatus] || form.callStatus || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="HTTP响应状态码" prop="httpStatus" label-width="123px">
              <el-input v-model="form.httpStatus" placeholder="请输入HTTP响应状态码" disabled v-if="false" />
              {{ httpStatusMap[form.httpStatus] || form.httpStatus || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider></el-divider>
          </el-col>
          <el-col :span="24">
            <el-form-item label="请求内容">
              <editor v-model="form.requestContent" :min-height="192" disabled v-if="false" />
              {{ form.requestContent || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="响应内容">
              <editor v-model="form.responseContent" :min-height="192" disabled v-if="false" />
              {{ form.responseContent || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-divider></el-divider>
          </el-col>
          <el-col :span="24">
            <el-form-item label="错误信息" prop="errorMsg">
              <el-input v-model="form.errorMsg" type="textarea" placeholder="请输入错误堆栈信息内容" disabled v-if="false" />
              {{ form.errorMsg || '-- 暂无数据 --' }}
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <!-- <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button> -->
        <el-button @click="cancel">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listLog, getLog, delLog, addLog, updateLog } from "@/api/fx67ll/ai/log";
import { listTemplate } from "@/api/fx67ll/ai/template";
import { listGroup } from "@/api/fx67ll/ai/group";
import { listScene } from "@/api/fx67ll/ai/scene";
import { listModel } from "@/api/fx67ll/ai/model";

import { modelTokenCurrencyOptions, httpStatusOptions, callStatusOptions } from "@/utils/constant/fx67ll";
import { arrayToMap } from "@/utils/fx67ll/utils";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Log",
  components: { CommonEnhancedSelect },
  computed: {
    // 将选项数组转换为 { value: label } 的映射对象
    modelTokenCurrencyMap() {
      return arrayToMap(this.modelTokenCurrencyOptions);
    },
    // HTTP状态码映射
    httpStatusMap() {
      return arrayToMap(this.httpStatusOptions);
    },
    // 请求业务状态映射
    callStatusMap() {
      return arrayToMap(this.callStatusOptions);
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
      // 调用请求日志表格数据
      logList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 请求时间范围
      daterangeRequestTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        requestLogId: null,
        promptId: null,
        groupId: null,
        sceneId: null,
        modelId: null,
        requestContent: null,
        responseContent: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        cost: null,
        durationMs: null,
        httpStatus: null,
        callStatus: null,
        errorMsg: null,
        callerIp: null,
        userId: null,
        beginRequestTime: null,
        endRequestTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        modelId: [
          { required: true, message: "绑定模型不能为空", trigger: "blur" }
        ],
      },
      // 货币类型选项
      modelTokenCurrencyOptions,
      // HTTP状态码选项（可根据需要增删）
      httpStatusOptions,
      // 请求业务状态选项
      callStatusOptions
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listTemplate = listTemplate;
    this.listGroup = listGroup;
    this.listScene = listScene;
    this.listModel = listModel;

    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginRequestTime = null;
      this.queryParams.endRequestTime = null;
    },
    /** 查询调用请求日志列表 */
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
        requestLogId: null,
        promptId: null,
        groupId: null,
        sceneId: null,
        modelId: null,
        requestContent: null,
        responseContent: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        cost: null,
        durationMs: null,
        httpStatus: null,
        callStatus: null,
        errorMsg: null,
        callerIp: null,
        requestTime: null,
        userId: null,
        createBy: null
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
      this.ids = selection.map(item => item.requestLogId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加调用请求日志";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const requestLogId = row.requestLogId || this.ids
      getLog(requestLogId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改调用请求日志";
      });
    },
    /** 查看按钮操作 */
    handleView(row) {
      this.reset();
      const requestLogId = row.requestLogId || this.ids
      getLog(requestLogId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "查看调用请求日志";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.requestLogId != null) {
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
      const requestLogIds = row.requestLogId || this.ids;
      this.$modal.confirm('是否确认删除调用请求日志编号为"' + requestLogIds + '"的数据项？')
        // .then(function () {
        //   return delLog(requestLogIds);
        // })
        // .then(() => {
        //   this.getList();
        //   this.$modal.msgSuccess("删除成功");
        // })
        .then(() => {
          this.$modal.msgWarning("警告！！！管理员已禁止删除操作！");
        })
        .catch(() => { });
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
