<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="球队编码" prop="teamCode">
        <el-input v-model="queryParams.teamCode" placeholder="请输入球队编码" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="球队全称" prop="teamName">
        <el-input v-model="queryParams.teamName" placeholder="请输入球队全称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="球队昵称" prop="teamNameShort">
        <el-input v-model="queryParams.teamNameShort" placeholder="请输入球队昵称" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="球队英文" prop="teamNameEn">
        <el-input v-model="queryParams.teamNameEn" placeholder="请输入球队英文" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="所属地区" prop="teamCountry">
        <el-input v-model="queryParams.teamCountry" placeholder="请输入所属地区" clearable @keyup.enter.native="handleQuery" />
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
          v-hasPermi="['system:team:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:team:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:team:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:team:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="teamList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="球队编码" align="center" prop="teamCode" />
      <el-table-column label="球队全称" align="center" prop="teamName" />
      <el-table-column label="球队昵称" align="center" prop="teamNameShort" />
      <el-table-column label="球队英文" align="center" prop="teamNameEn" />
      <el-table-column label="球队Logo" align="center" prop="teamLogoUrl" />
      <el-table-column label="所属地区" align="center" prop="teamCountry" />
      <el-table-column label="球队标签" align="center" prop="teamTag" />
      <el-table-column label="球队状态" align="center" prop="teamStatus" />
      <el-table-column label="球队排序" align="center" prop="teamSort" />
      <el-table-column label="球队备注" align="center" prop="teamRemark" />
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
            v-hasPermi="['system:team:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:team:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改球队管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="球队编码" prop="teamCode">
          <el-input v-model="form.teamCode" placeholder="请输入球队编码" />
        </el-form-item>
        <el-form-item label="球队全称" prop="teamName">
          <el-input v-model="form.teamName" placeholder="请输入球队全称" />
        </el-form-item>
        <el-form-item label="球队昵称" prop="teamNameShort">
          <el-input v-model="form.teamNameShort" placeholder="请输入球队昵称" />
        </el-form-item>
        <el-form-item label="球队英文" prop="teamNameEn">
          <el-input v-model="form.teamNameEn" placeholder="请输入球队英文" />
        </el-form-item>
        <el-form-item label="球队Logo" prop="teamLogoUrl">
          <el-input v-model="form.teamLogoUrl" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="所属地区" prop="teamCountry">
          <el-input v-model="form.teamCountry" placeholder="请输入所属地区" />
        </el-form-item>
        <el-form-item label="球队标签" prop="teamTag">
          <el-input v-model="form.teamTag" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="球队排序" prop="teamSort">
          <el-input v-model="form.teamSort" placeholder="请输入球队排序" />
        </el-form-item>
        <el-form-item label="球队备注" prop="teamRemark">
          <el-input v-model="form.teamRemark" type="textarea" placeholder="请输入内容" />
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
import { listTeam, getTeam, delTeam, addTeam, updateTeam } from "@/api/fx67ll/dortmund/team";

export default {
  name: "Team",
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
      // 球队管理表格数据
      teamList: [],
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
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamLogoUrl: null,
        teamCountry: null,
        teamTag: null,
        teamRemark: null,
        teamStatus: null,
        teamSort: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        teamCode: [
          { required: true, message: "球队编码不能为空", trigger: "blur" }
        ],
        teamName: [
          { required: true, message: "球队全称不能为空", trigger: "blur" }
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
    /** 查询球队管理列表 */
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
      listTeam(this.queryParams).then(response => {
        this.teamList = this.formatObjectArrayNullProperty(response.rows);
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
        teamId: null,
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamLogoUrl: null,
        teamCountry: null,
        teamTag: null,
        teamRemark: null,
        teamStatus: null,
        teamSort: null,
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
      this.ids = selection.map(item => item.teamId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加球队管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const teamId = row.teamId || this.ids
      getTeam(teamId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改球队管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.teamId != null) {
            updateTeam(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTeam(this.form).then(response => {
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
      const teamIds = row.teamId || this.ids;
      this.$modal.confirm('是否确认删除球队管理编号为"' + teamIds + '"的数据项？').then(function () {
        return delTeam(teamIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/team/export', {
        ...this.queryParams
      }, `team_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
