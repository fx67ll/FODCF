<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模板名称" prop="promptName">
        <el-input v-model="queryParams.promptName" placeholder="请输入模板名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="所属分组" prop="groupId">
        <common-enhanced-select ref="groupSelect" v-model="queryParams.groupId" :api-func="listGroup"
          placeholder="请选择所属分组" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="所属场景" prop="sceneId">
        <common-enhanced-select ref="sceneSelect" v-model="queryParams.sceneId" :api-func="listScene"
          placeholder="请选择所属场景" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="绑定模型" prop="modelId">
        <common-enhanced-select ref="modelSelect" v-model="queryParams.modelId" :api-func="listModel"
          placeholder="请选择绑定模型" :enter-callback="handleQuery" />
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
          v-hasPermi="['system:template:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:template:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:template:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:template:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="templateList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模板名称" align="center" prop="promptName" />
      <el-table-column label="所属分组" align="center" prop="groupName" />
      <el-table-column label="所属场景" align="center" prop="sceneName" />
      <el-table-column label="绑定模型" align="center" prop="modelName" />
      <el-table-column label="模版内容" align="center" prop="promptContent" />
      <el-table-column label="变量配置" align="center" prop="promptVariableConfig" />
      <el-table-column label="调参配置" align="center" prop="promptCustomConfigParams" />
      <el-table-column label="模板状态" align="center" prop="promptStatus" />
      <el-table-column label="模板备注" align="center" prop="promptRemark" />
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
            v-hasPermi="['system:template:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:template:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改提示语模板对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="模板名称" prop="promptName">
          <el-input v-model="form.promptName" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="所属分组" prop="groupId">
          <common-enhanced-select ref="groupSelect" v-model="form.groupId" :api-func="listGroup"
            placeholder="请选择所属分组" />
        </el-form-item>
        <el-form-item label="所属场景" prop="sceneId">
          <common-enhanced-select ref="sceneSelect" v-model="form.sceneId" :api-func="listScene"
            placeholder="请选择所属场景" />
        </el-form-item>
        <el-form-item label="绑定模型" prop="modelId">
          <common-enhanced-select ref="modelSelect" v-model="form.modelId" :api-func="listModel"
            placeholder="请选择绑定模型" />
        </el-form-item>
        <el-form-item label="模版内容">
          <editor v-model="form.promptContent" :min-height="192" />
        </el-form-item>
        <el-form-item label="变量配置" prop="promptVariableConfig">
          <el-input v-model="form.promptVariableConfig" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="调参配置" prop="promptCustomConfigParams">
          <el-input v-model="form.promptCustomConfigParams" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="模板备注" prop="promptRemark">
          <el-input v-model="form.promptRemark" type="textarea" placeholder="请输入内容" />
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
import { listTemplate, getTemplate, delTemplate, addTemplate, updateTemplate } from "@/api/fx67ll/ai/template";
import { listGroup } from "@/api/fx67ll/ai/group";
import { listScene } from "@/api/fx67ll/ai/scene";
import { listModel } from "@/api/fx67ll/ai/model";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Template",
  components: { CommonEnhancedSelect },
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
      // 提示语模板表格数据
      templateList: [],
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
        promptName: null,
        groupId: null,
        sceneId: null,
        modelId: null,
        promptContent: null,
        promptVariableConfig: null,
        promptCustomConfigParams: null,
        promptStatus: null,
        promptRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        promptName: [
          { required: true, message: "模板名称不能为空", trigger: "blur" }
        ],
        groupId: [
          { required: true, message: "所属分组不能为空", trigger: "blur" }
        ],
        sceneId: [
          { required: true, message: "所属场景不能为空", trigger: "blur" }
        ],
        modelId: [
          { required: true, message: "绑定模型不能为空", trigger: "blur" }
        ],
        promptContent: [
          { required: true, message: "模版内容不能为空", trigger: "blur" }
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
    /** 查询提示语模板列表 */
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
      listTemplate(this.queryParams).then(response => {
        this.templateList = this.formatObjectArrayNullProperty(response.rows);
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
        promptId: null,
        promptName: null,
        groupId: null,
        sceneId: null,
        modelId: null,
        promptContent: null,
        promptVariableConfig: null,
        promptCustomConfigParams: null,
        promptStatus: null,
        promptRemark: null,
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
      this.ids = selection.map(item => item.promptId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加提示语模板";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const promptId = row.promptId || this.ids
      getTemplate(promptId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改提示语模板";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.promptId != null) {
            updateTemplate(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTemplate(this.form).then(response => {
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
      const promptIds = row.promptId || this.ids;
      this.$modal.confirm('是否确认删除提示语模板编号为"' + promptIds + '"的数据项？').then(function () {
        return delTemplate(promptIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/template/export', {
        ...this.queryParams
      }, `template_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
