<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模型编码" prop="modelCode">
        <el-input v-model="queryParams.modelCode" placeholder="请输入模型编码" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName">
        <el-input v-model="queryParams.modelName" placeholder="请输入模型名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="模型厂商" prop="modelVendor">
        <el-input v-model="queryParams.modelVendor" placeholder="请输入模型厂商" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="API密钥" prop="modelApiKey">
        <el-input v-model="queryParams.modelApiKey" placeholder="请输入API密钥" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="Secret密钥" prop="modelSecretKey">
        <el-input v-model="queryParams.modelSecretKey" placeholder="请输入Secret密钥" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="模型API调用地址" prop="modelApiUrl">
        <el-input v-model="queryParams.modelApiUrl" placeholder="请输入模型API调用地址" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="API版本号" prop="modelApiVersion">
        <el-input v-model="queryParams.modelApiVersion" placeholder="请输入API版本号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="模型计费单价" prop="modelTokenPrice">
        <el-input v-model="queryParams.modelTokenPrice" placeholder="请输入模型计费单价" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="计价货币类型" prop="modelTokenCurrency">
        <el-input v-model="queryParams.modelTokenCurrency" placeholder="请输入计价货币类型" clearable
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
          v-hasPermi="['system:model:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:model:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:model:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:model:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模型编码" align="center" prop="modelCode" />
      <el-table-column label="模型名称" align="center" prop="modelName" />
      <el-table-column label="模型厂商" align="center" prop="modelVendor" />
      <el-table-column label="API密钥" align="center" prop="modelApiKey" />
      <el-table-column label="Secret密钥" align="center" prop="modelSecretKey" />
      <el-table-column label="模型API调用地址" align="center" prop="modelApiUrl" />
      <el-table-column label="API版本号" align="center" prop="modelApiVersion" />
      <el-table-column label="模型API调用参数" align="center" prop="modelConfigParams" />
      <el-table-column label="API请求头扩展配置" align="center" prop="modelRequestHeader" />
      <el-table-column label="模型计费单价" align="center" prop="modelTokenPrice" />
      <el-table-column label="计价货币类型" align="center" prop="modelTokenCurrency" />
      <el-table-column label="模型状态" align="center" prop="modelStatus" />
      <el-table-column label="模型排序" align="center" prop="modelSort" />
      <el-table-column label="模型备注" align="center" prop="modelRemark" />
      <el-table-column label="记录创建者" align="center" prop="createBy" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" />
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
            v-hasPermi="['system:model:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:model:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改提示语模型配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="模型编码" prop="modelCode">
          <el-input v-model="form.modelCode" placeholder="请输入模型编码" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型厂商" prop="modelVendor">
          <el-input v-model="form.modelVendor" placeholder="请输入模型厂商" />
        </el-form-item>
        <el-form-item label="API密钥" prop="modelApiKey">
          <el-input v-model="form.modelApiKey" placeholder="请输入API密钥" />
        </el-form-item>
        <el-form-item label="Secret密钥" prop="modelSecretKey">
          <el-input v-model="form.modelSecretKey" placeholder="请输入Secret密钥" />
        </el-form-item>
        <el-form-item label="模型API调用地址" prop="modelApiUrl">
          <el-input v-model="form.modelApiUrl" placeholder="请输入模型API调用地址" />
        </el-form-item>
        <el-form-item label="API版本号" prop="modelApiVersion">
          <el-input v-model="form.modelApiVersion" placeholder="请输入API版本号" />
        </el-form-item>
        <el-form-item label="模型API调用参数" prop="modelConfigParams">
          <el-input v-model="form.modelConfigParams" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="API请求头扩展配置" prop="modelRequestHeader">
          <el-input v-model="form.modelRequestHeader" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="模型计费单价" prop="modelTokenPrice">
          <el-input v-model="form.modelTokenPrice" placeholder="请输入模型计费单价" />
        </el-form-item>
        <el-form-item label="计价货币类型" prop="modelTokenCurrency">
          <el-input v-model="form.modelTokenCurrency" placeholder="请输入计价货币类型" />
        </el-form-item>
        <el-form-item label="模型排序" prop="modelSort">
          <el-input v-model="form.modelSort" placeholder="请输入模型排序" />
        </el-form-item>
        <el-form-item label="模型备注" prop="modelRemark">
          <el-input v-model="form.modelRemark" type="textarea" placeholder="请输入内容" />
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
import { listModel, getModel, delModel, addModel, updateModel } from "@/api/fx67ll/ai/model";

export default {
  name: "Model",
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
      // 提示语模型配置表格数据
      modelList: [],
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
        modelCode: null,
        modelName: null,
        modelVendor: null,
        modelApiKey: null,
        modelSecretKey: null,
        modelApiUrl: null,
        modelApiVersion: null,
        modelConfigParams: null,
        modelRequestHeader: null,
        modelRemark: null,
        modelStatus: null,
        modelSort: null,
        modelTokenPrice: null,
        modelTokenCurrency: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        modelCode: [
          { required: true, message: "模型编码不能为空", trigger: "blur" }
        ],
        modelName: [
          { required: true, message: "模型名称不能为空", trigger: "blur" }
        ],
        modelVendor: [
          { required: true, message: "模型厂商不能为空", trigger: "blur" }
        ],
        modelApiKey: [
          { required: true, message: "API密钥不能为空", trigger: "blur" }
        ],
        modelApiUrl: [
          { required: true, message: "模型API调用地址不能为空", trigger: "blur" }
        ],
        modelConfigParams: [
          { required: true, message: "模型API调用参数不能为空", trigger: "blur" }
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
    /** 查询提示语模型配置列表 */
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
      listModel(this.queryParams).then(response => {
        this.modelList = this.formatObjectArrayNullProperty(response.rows);
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
        modelId: null,
        modelCode: null,
        modelName: null,
        modelVendor: null,
        modelApiKey: null,
        modelSecretKey: null,
        modelApiUrl: null,
        modelApiVersion: null,
        modelConfigParams: null,
        modelRequestHeader: null,
        modelRemark: null,
        modelStatus: null,
        modelSort: null,
        modelTokenPrice: null,
        modelTokenCurrency: null,
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
      this.ids = selection.map(item => item.modelId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加提示语模型配置";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const modelId = row.modelId || this.ids
      getModel(modelId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改提示语模型配置";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.modelId != null) {
            updateModel(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addModel(this.form).then(response => {
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
      const modelIds = row.modelId || this.ids;
      this.$modal.confirm('是否确认删除提示语模型配置编号为"' + modelIds + '"的数据项？').then(function () {
        return delModel(modelIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/model/export', {
        ...this.queryParams
      }, `model_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
