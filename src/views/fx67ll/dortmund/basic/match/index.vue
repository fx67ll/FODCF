<template>
  <div class="app-container">
    <!-- 场景切换：总览列表 / 比赛编排 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
          label-width="68px">
          <el-form-item label="比赛编号" prop="matchId" v-if="isMoreQuery">
            <el-input v-model="queryParams.matchId" type="number" min="1" step="1" placeholder="请输入比赛编号" clearable
              @keyup.enter.native="handleQuery" />
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
            <el-select v-model="queryParams.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable
              filterable allow-create default-first-option>
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
          <el-form-item label="比赛结果" prop="matchResult" v-if="isMoreQuery">
            <el-select v-model="queryParams.matchResult" style="width: 100%" placeholder="请选择比赛结果" clearable
              @keyup.enter.native="handleQuery">
              <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" v-if="isMoreQuery">
            <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
              type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable></el-date-picker>
          </el-form-item>
          <el-form-item label="更新时间" v-if="isMoreQuery">
            <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd"
              type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable></el-date-picker>
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
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
              v-hasPermi="['dortmund:match:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:match:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
              v-hasPermi="['dortmund:match:remove']">删除</el-button>
          </el-col>
          <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:match:export']">导出</el-button>
          </el-col> -->
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="matchList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="比赛编号" align="center" prop="matchId" width="80" fixed="left" />
          <el-table-column label="所属赛季" align="center" prop="seasonName" width="80" fixed="left" />
          <el-table-column label="主队名称" align="center" prop="homeTeamName" width="190" fixed="left">
            <template slot-scope="scope">
              <span class="match-team-name home">{{ scope.row.homeTeamName || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="客队名称" align="center" prop="awayTeamName" width="190" fixed="left">
            <template slot-scope="scope">
              <span class="match-team-name away">{{ scope.row.awayTeamName || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="比赛时间" align="center" prop="matchTime" width="150">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="比赛场地" align="center" prop="matchVenue" width="180" />
          <el-table-column label="比赛状态" align="center" prop="matchStatus" width="80">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
            </template>
          </el-table-column>
          <!-- 分析次数为后台统计字段，本页只读展示，不接受录入 -->
          <el-table-column label="分析次数" align="center" prop="analysisCount" />
          <el-table-column label="比赛结果" align="center" prop="matchResult" width="80">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_match_result" :value="scope.row.matchResult" />
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
                v-hasPermi="['dortmund:match:edit']">修改</el-button>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
                v-hasPermi="['dortmund:match:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />
      </div>

      <!-- 比赛编排场景：新增/修改共用整页，按填写顺序铺开 -->
      <match-edit-scene key="edit" v-else ref="editScene" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave" />
    </transition>
  </div>
</template>

<script>
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/fx67ll/dortmund/match";
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";

import { teamVenueOptions } from "@/utils/constant/football";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import MatchEditScene from "./components/MatchEditScene/index";

export default {
  name: "Match",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: { CommonEnhancedSelect, MatchEditScene },
  data() {
    return {
      // 页面场景（list总览列表 edit比赛编排）
      pageScene: "list",
      // 编排场景模式（add新增 update修改）
      editMode: "add",
      // 遮罩层
      loading: true,
      // 编排场景表单遮罩层
      editLoading: false,
      // 编排场景提交中状态
      submitting: false,
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
        matchResult: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 编排场景初始表单（进入编排场景前由父页面构建，场景组件复制出可编辑副本）
      editForm: {},
      // 球场预设选项数组（查询表单比赛场地可选项）
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
      }).finally(() => {
        this.loading = false;
      });
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
    /** 新增按钮操作：进入编排场景 */
    handleAdd() {
      this.editMode = "add";
      this.resetEditScene();
      this.pageScene = "edit";
    },
    /** 修改按钮操作：拉取详情后进入编排场景 */
    handleUpdate(row) {
      const matchId = row.matchId || this.ids;
      this.editLoading = true;
      getMatch(matchId).then(response => {
        const detail = response.data || {};
        this.editMode = "update";
        // 从详情中挑选允许修改的字段构建初始表单，后台字段不进入可编辑控件
        this.editForm = {
          matchId: detail.matchId,
          seasonId: detail.seasonId,
          homeTeamId: detail.homeTeamId,
          awayTeamId: detail.awayTeamId,
          matchTime: detail.matchTime,
          matchVenue: detail.matchVenue,
          matchStatus: detail.matchStatus,
          matchResult: detail.matchResult,
          matchRemark: detail.matchRemark,
        };
        this.pageScene = "edit";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    // 重置编排场景初始表单（场景组件每次进入重新挂载，自带当场新增面板与表单重置）
    resetEditScene() {
      this.editForm = {
        matchId: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchStatus: null,
        matchResult: null,
        matchRemark: null,
      };
    },
    // 场景返回总览并刷新列表
    handleSceneBack() {
      this.pageScene = "list";
      this.getList();
    },
    // 场景保存：编排场景校验并构建请求体后回传，父页面负责提交
    handleSceneSave(data) {
      const isAdd = this.editMode === "add";
      this.submitting = true;
      const request = isAdd ? addMatch(data) : updateMatch(data);
      request.then(() => {
        this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
        this.handleSceneBack();
      }).catch(() => {
        // 保存失败时留在编排场景并保留已填内容，重新拉取选项后可直接重试
        this.$refs["editScene"] && this.$refs["editScene"].refreshSelectOptions();
      }).finally(() => {
        this.submitting = false;
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
      this.download('dortmund/match/export', {
        ...this.queryParams
      }, `match_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
/* 总览场景球队名称列：主客队双色胶囊，便于快速区分对阵双方 */
.match-team-name {
  display: inline-block;
  max-width: 170px;
  padding: 2px 10px;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 999px;

  &.home {
    color: #27ad60;
    background: #e7f8ee;
  }

  &.away {
    color: #5a7d9a;
    background: #ecf3f8;
  }
}

/* 场景切换过渡动画 */
.scene-switch-enter-active,
.scene-switch-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.scene-switch-enter,
.scene-switch-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
