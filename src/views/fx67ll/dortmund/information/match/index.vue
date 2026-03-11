<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="比赛唯一业务编码" prop="matchCode">
        <el-input v-model="queryParams.matchCode" placeholder="请输入比赛唯一业务编码" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="所属赛季ID" prop="seasonId">
        <el-input v-model="queryParams.seasonId" placeholder="请输入所属赛季ID" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="主队球队ID" prop="homeTeamId">
        <el-input v-model="queryParams.homeTeamId" placeholder="请输入主队球队ID" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="客队球队ID" prop="awayTeamId">
        <el-input v-model="queryParams.awayTeamId" placeholder="请输入客队球队ID" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="比赛开球时间" prop="matchTime">
        <el-date-picker clearable v-model="queryParams.matchTime" type="date" value-format="yyyy-MM-dd"
          placeholder="请选择比赛开球时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="比赛举办场地名称" prop="matchVenue">
        <el-input v-model="queryParams.matchVenue" placeholder="请输入比赛举办场地名称" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="AI分析次数" prop="analysisCount">
        <el-input v-model="queryParams.analysisCount" placeholder="请输入AI分析次数" clearable
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
          v-hasPermi="['system:match:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:match:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:match:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:match:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="matchList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="比赛唯一标识" align="center" prop="matchId" />
      <el-table-column label="比赛唯一业务编码" align="center" prop="matchCode" />
      <el-table-column label="所属赛季ID" align="center" prop="seasonId" />
      <el-table-column label="主队球队ID" align="center" prop="homeTeamId" />
      <el-table-column label="客队球队ID" align="center" prop="awayTeamId" />
      <el-table-column label="比赛开球时间" align="center" prop="matchTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="比赛举办场地名称" align="center" prop="matchVenue" />
      <el-table-column label="比赛业务备注" align="center" prop="matchRemark" />
      <el-table-column label="比赛状态" align="center" prop="matchStatus" />
      <el-table-column label="AI分析次数" align="center" prop="analysisCount" />
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
            v-hasPermi="['system:match:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:match:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改比赛记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="比赛唯一业务编码" prop="matchCode">
          <el-input v-model="form.matchCode" placeholder="请输入比赛唯一业务编码" />
        </el-form-item>
        <el-form-item label="所属赛季ID" prop="seasonId">
          <el-input v-model="form.seasonId" placeholder="请输入所属赛季ID" />
        </el-form-item>
        <el-form-item label="主队球队ID" prop="homeTeamId">
          <el-input v-model="form.homeTeamId" placeholder="请输入主队球队ID" />
        </el-form-item>
        <el-form-item label="客队球队ID" prop="awayTeamId">
          <el-input v-model="form.awayTeamId" placeholder="请输入客队球队ID" />
        </el-form-item>
        <el-form-item label="比赛开球时间" prop="matchTime">
          <el-date-picker clearable v-model="form.matchTime" type="date" value-format="yyyy-MM-dd"
            placeholder="请选择比赛开球时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="比赛举办场地名称" prop="matchVenue">
          <el-input v-model="form.matchVenue" placeholder="请输入比赛举办场地名称" />
        </el-form-item>
        <el-form-item label="比赛业务备注" prop="matchRemark">
          <el-input v-model="form.matchRemark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="AI分析次数" prop="analysisCount">
          <el-input v-model="form.analysisCount" placeholder="请输入AI分析次数" />
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
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/fx67ll/dortmund/match";

export default {
  name: "Match",
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
      // 比赛记录表格数据
      matchList: [],
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
        matchCode: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchRemark: null,
        matchStatus: null,
        analysisCount: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        matchCode: [
          { required: true, message: "比赛唯一业务编码不能为空", trigger: "blur" }
        ],
        seasonId: [
          { required: true, message: "所属赛季ID不能为空", trigger: "blur" }
        ],
        homeTeamId: [
          { required: true, message: "主队球队ID不能为空", trigger: "blur" }
        ],
        awayTeamId: [
          { required: true, message: "客队球队ID不能为空", trigger: "blur" }
        ],
        matchTime: [
          { required: true, message: "比赛开球时间不能为空", trigger: "blur" }
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
    /** 查询比赛记录列表 */
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
      listMatch(this.queryParams).then(response => {
        this.matchList = this.formatObjectArrayNullProperty(response.rows);
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
        matchId: null,
        matchCode: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchRemark: null,
        matchStatus: null,
        analysisCount: null,
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
      this.ids = selection.map(item => item.matchId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加比赛记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const matchId = row.matchId || this.ids
      getMatch(matchId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改比赛记录";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.matchId != null) {
            updateMatch(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addMatch(this.form).then(response => {
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
      const matchIds = row.matchId || this.ids;
      this.$modal.confirm('是否确认删除比赛记录编号为"' + matchIds + '"的数据项？').then(function () {
        return delMatch(matchIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/match/export', {
        ...this.queryParams
      }, `match_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
