<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="场景编码" prop="sceneCode" v-if="isMoreQuery">
        <el-input v-model="queryParams.sceneCode" placeholder="请输入场景编码" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="场景名称" prop="sceneName">
        <el-input v-model="queryParams.sceneName" placeholder="请输入场景名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="场景状态" prop="sceneStatus">
        <el-select v-model="queryParams.sceneStatus" style="width: 100%" placeholder="请选择场景状态" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
            :value="dict.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" v-if="isMoreQuery">
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
          v-hasPermi="['system:scene:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:scene:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:scene:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:scene:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="sceneList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="场景编码" align="center" prop="sceneCode" width="120" />
      <el-table-column label="场景名称" align="center" prop="sceneName" width="120" />
      <el-table-column label="场景描述" align="center" prop="sceneDesc" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="场景状态" align="center" prop="sceneStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.sceneStatus" />
        </template>
      </el-table-column>
      <el-table-column label="场景排序" align="center" prop="sceneSort" width="100" sortable="sceneSort"
        :sort-orders="['descending', 'ascending']" />
      <el-table-column label="场景备注" align="center" prop="sceneRemark" width="230" :show-overflow-tooltip="true" />
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
            v-hasPermi="['system:scene:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:scene:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改模版场景对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" style="top: 100px"
      append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场景编码" prop="sceneCode">
              <el-input v-model="form.sceneCode" placeholder="请输入场景编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景名称" prop="sceneName">
              <el-input v-model="form.sceneName" placeholder="请输入场景名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景状态" prop="sceneStatus">
              <!-- <el-select v-model="form.sceneStatus" style="width: 100%" placeholder="请选择场景状态">
                <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select> -->
              <el-switch v-model="form.sceneStatus" active-value="0" inactive-value="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景排序" prop="sceneSort">
              <el-input v-model="form.sceneSort" type="number" min="0" max="1023" step="1" placeholder="请输入场景排序" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="场景描述" prop="sceneDesc">
              <el-input v-model="form.sceneDesc" type="textarea" placeholder="请输入场景描述内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="场景备注" prop="sceneRemark">
              <el-input v-model="form.sceneRemark" type="textarea" placeholder="请输入场景备注内容" />
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
import { listScene, getScene, delScene, addScene, updateScene } from "@/api/fx67ll/ai/scene";

export default {
  name: "Scene",
  dicts: ["sys_normal_disable"],
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
      // 模版场景表格数据
      sceneList: [],
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
        sceneCode: null,
        sceneName: null,
        sceneDesc: null,
        sceneStatus: null,
        sceneSort: null,
        sceneRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        sceneCode: [
          { required: true, message: "场景编码不能为空", trigger: "blur" }
        ],
        sceneName: [
          { required: true, message: "场景名称不能为空", trigger: "blur" }
        ],
        sceneDesc: [
          { required: true, message: "场景描述不能为空", trigger: "blur" }
        ],
        sceneStatus: [
          { required: true, message: "场景状态不能为空", trigger: "blur" }
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
    /** 查询模版场景列表 */
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
      listScene(this.queryParams).then(response => {
        this.sceneList = this.formatObjectArrayNullProperty(response.rows);
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
        sceneId: null,
        sceneCode: null,
        sceneName: null,
        sceneDesc: null,
        sceneRemark: null,
        sceneStatus: null,
        sceneSort: null,
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
      this.ids = selection.map(item => item.sceneId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加模版场景";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const sceneId = row.sceneId || this.ids
      getScene(sceneId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改模版场景";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.sceneId != null) {
            updateScene(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addScene(this.form).then(response => {
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
      const sceneIds = row.sceneId || this.ids;
      this.$modal.confirm('是否确认删除模版场景编号为"' + sceneIds + '"的数据项？').then(function () {
        return delScene(sceneIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/scene/export', {
        ...this.queryParams
      }, `scene_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
