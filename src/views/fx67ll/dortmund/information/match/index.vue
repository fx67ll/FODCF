<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="比赛编号" prop="matchId" v-if="isMoreQuery">
        <el-input v-model="queryParams.matchId" type="number" min="1" step="1" placeholder="请输入比赛编号" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="所属赛季" prop="seasonId" v-if="isMoreQuery">
        <common-enhanced-select ref="seasonSelect" v-model="queryParams.seasonId" valueKey="seasonId"
          labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="主队名称" prop="homeTeamId">
        <common-enhanced-select ref="homeTeamSelect" v-model="queryParams.homeTeamId" valueKey="teamId"
          labelKey="teamName" :api-func="listTeam" placeholder="请选择主队名称" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="客队名称" prop="awayTeamId">
        <common-enhanced-select ref="awayTeamSelect" v-model="queryParams.awayTeamId" valueKey="teamId"
          labelKey="teamName" :api-func="listTeam" placeholder="请选择客队名称" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="比赛时间" prop="matchTime">
        <el-date-picker v-model="daterangeMatchTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="比赛场地" prop="matchVenue" v-if="isMoreQuery">
        <el-select v-model="queryParams.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable filterable
          allow-create default-first-option>
          <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="比赛状态" prop="matchStatus" v-if="isMoreQuery">
        <el-select v-model="queryParams.matchStatus" style="width: 100%" placeholder="请选择比赛状态" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
            :value="dict.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="分析次数" prop="analysisCount" v-if="isMoreQuery">
        <el-input v-model="queryParams.analysisCount" style="width: 200px" type="number" min="0" max="1023" step="1"
          placeholder="请输入分析次数" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="比赛结果" prop="matchResult" v-if="isMoreQuery">
        <el-select v-model="queryParams.matchResult" style="width: 100%" placeholder="请选择比赛结果" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
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
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:match:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="matchList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="比赛编号" align="center" prop="matchId" width="80" fixed="left" />
      <el-table-column label="所属赛季" align="center" prop="seasonName" width="100" />
      <el-table-column label="主队名称" align="center" prop="homeTeamName" width="200" />
      <el-table-column label="客队名称" align="center" prop="awayTeamName" width="200" />
      <el-table-column label="比赛时间" align="center" prop="matchTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="比赛场地" align="center" prop="matchVenue" width="180" />
      <el-table-column label="比赛状态" align="center" prop="matchStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
        </template>
      </el-table-column>
      <el-table-column label="分析次数" align="center" prop="analysisCount" />
      <el-table-column label="比赛结果" align="center" prop="matchResult" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchResult" />
        </template>
      </el-table-column>
      <el-table-column label="比赛备注" align="center" prop="matchRemark" width="230" :show-overflow-tooltip="true" />
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
            v-hasPermi="['system:match:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:match:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改比赛记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" style="top: 60px"
      append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主队名称" prop="homeTeamId">
              <common-enhanced-select ref="homeTeamSelect" v-model="form.homeTeamId" valueKey="teamId"
                labelKey="teamName" :api-func="listTeam" placeholder="请选择主队名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队名称" prop="awayTeamId">
              <common-enhanced-select ref="awayTeamSelect" v-model="form.awayTeamId" valueKey="teamId"
                labelKey="teamName" :api-func="listTeam" placeholder="请选择客队名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属赛季" prop="seasonId">
              <common-enhanced-select ref="seasonSelect" v-model="form.seasonId" valueKey="seasonId"
                labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比赛时间" prop="matchTime">
              <el-date-picker clearable v-model="form.matchTime" style="width: 100%" type="date"
                value-format="yyyy-MM-dd" placeholder="请选择比赛时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比赛状态" prop="matchStatus">
              <el-select v-model="form.matchStatus" style="width: 100%" placeholder="请选择比赛状态">
                <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比赛场地" prop="matchVenue">
              <el-select v-model="form.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable filterable
                allow-create default-first-option>
                <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分析次数" prop="analysisCount">
              <el-input v-model="form.analysisCount" type="number" min="0" max="1023" step="1" placeholder="请输入分析次数" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比赛结果" prop="matchResult">
              <el-select v-model="form.matchResult" style="width: 100%" placeholder="请选择比赛结果">
                <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="比赛备注" prop="matchRemark">
              <el-input v-model="form.matchRemark" type="textarea" placeholder="请输入比赛备注内容" />
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
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/fx67ll/dortmund/match";
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";

import { teamVenueOptions } from "@/utils/constant/football";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Match",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
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
      // 比赛时间范围
      daterangeMatchTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        matchId: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        beginMatchTime: null,
        endMatchTime: null,
        matchVenue: null,
        matchStatus: null,
        analysisCount: null,
        matchResult: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        seasonId: [
          { required: true, message: "所属赛季不能为空", trigger: "blur" }
        ],
        homeTeamId: [
          { required: true, message: "主队名称不能为空", trigger: "blur" }
        ],
        awayTeamId: [
          { required: true, message: "客队名称不能为空", trigger: "blur" }
        ],
        matchTime: [
          { required: true, message: "比赛时间不能为空", trigger: "blur" }
        ],
        matchStatus: [
          { required: true, message: "比赛状态不能为空", trigger: "blur" }
        ],
        analysisCount: [
          { required: true, message: "分析次数不能为空", trigger: "blur" }
        ],
      },
      // 球场预设选项数组
      teamVenueOptions,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    this.listTeam = listTeam;

    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
      this.queryParams.beginMatchTime = null;
      this.queryParams.endMatchTime = null;
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
      if (null != this.daterangeMatchTime && "" != this.daterangeMatchTime) {
        this.queryParams.beginMatchTime = this.daterangeMatchTime[0];
        this.queryParams.endMatchTime = this.daterangeMatchTime[1];
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
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchStatus: null,
        analysisCount: null,
        matchResult: null,
        matchRemark: null,
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
