<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="赛季编码" prop="seasonCode">
        <el-input v-model="queryParams.seasonCode" placeholder="请输入赛季编码" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="赛季名称" prop="seasonName">
        <el-input v-model="queryParams.seasonName" placeholder="请输入赛季名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="赛季开始日期" prop="seasonStartDate">
        <el-date-picker clearable v-model="queryParams.seasonStartDate" type="date" value-format="yyyy-MM-dd"
          placeholder="请选择赛季开始日期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="赛季结束日期" prop="seasonEndDate">
        <el-date-picker clearable v-model="queryParams.seasonEndDate" type="date" value-format="yyyy-MM-dd"
          placeholder="请选择赛季结束日期">
        </el-date-picker>
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
          v-hasPermi="['system:season:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:season:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:season:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:season:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="seasonList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="赛季编码" align="center" prop="seasonCode" />
      <el-table-column label="赛季名称" align="center" prop="seasonName" />
      <el-table-column label="赛季开始日期" align="center" prop="seasonStartDate" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.seasonStartDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="赛季结束日期" align="center" prop="seasonEndDate" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.seasonEndDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="赛季状态" align="center" prop="seasonStatus" />
      <el-table-column label="赛季排序" align="center" prop="seasonSort" />
      <el-table-column label="赛季备注" align="center" prop="seasonRemark" />
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
            v-hasPermi="['system:season:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:season:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改赛季管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="赛季编码" prop="seasonCode">
          <el-input v-model="form.seasonCode" placeholder="请输入赛季编码" />
        </el-form-item>
        <el-form-item label="赛季名称" prop="seasonName">
          <el-input v-model="form.seasonName" placeholder="请输入赛季名称" />
        </el-form-item>
        <el-form-item label="赛季开始日期" prop="seasonStartDate">
          <el-date-picker clearable v-model="form.seasonStartDate" type="date" value-format="yyyy-MM-dd"
            placeholder="请选择赛季开始日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="赛季结束日期" prop="seasonEndDate">
          <el-date-picker clearable v-model="form.seasonEndDate" type="date" value-format="yyyy-MM-dd"
            placeholder="请选择赛季结束日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="赛季排序" prop="seasonSort">
          <el-input v-model="form.seasonSort" placeholder="请输入赛季排序" />
        </el-form-item>
        <el-form-item label="赛季备注" prop="seasonRemark">
          <el-input v-model="form.seasonRemark" type="textarea" placeholder="请输入内容" />
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
import { listSeason, getSeason, delSeason, addSeason, updateSeason } from "@/api/fx67ll/dortmund/season";

export default {
  name: "Season",
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
      // 赛季管理表格数据
      seasonList: [],
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
        seasonCode: null,
        seasonName: null,
        seasonRemark: null,
        seasonStartDate: null,
        seasonEndDate: null,
        seasonStatus: null,
        seasonSort: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
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
    /** 查询赛季管理列表 */
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
      listSeason(this.queryParams).then(response => {
        this.seasonList = this.formatObjectArrayNullProperty(response.rows);
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
        seasonId: null,
        seasonCode: null,
        seasonName: null,
        seasonRemark: null,
        seasonStartDate: null,
        seasonEndDate: null,
        seasonStatus: null,
        seasonSort: null,
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
      this.ids = selection.map(item => item.seasonId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加赛季管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const seasonId = row.seasonId || this.ids
      getSeason(seasonId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改赛季管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.seasonId != null) {
            updateSeason(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSeason(this.form).then(response => {
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
      const seasonIds = row.seasonId || this.ids;
      this.$modal.confirm('是否确认删除赛季管理编号为"' + seasonIds + '"的数据项？').then(function () {
        return delSeason(seasonIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/season/export', {
        ...this.queryParams
      }, `season_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
