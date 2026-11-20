<template>
  <div class="app-container dl-page">
    <!-- 场景切换：总览列表 / 比赛编排 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <transition name="dl-filter">
          <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true"
            v-show="showSearch" label-width="68px">
            <el-form-item label="主队名称" prop="homeTeamName">
              <el-input v-model="queryParams.homeTeamName" placeholder="请输入主队名称" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="客队名称" prop="awayTeamName">
              <el-input v-model="queryParams.awayTeamName" placeholder="请输入客队名称" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="比赛编码" prop="matchCode" v-if="isMoreQuery">
              <el-input v-model="queryParams.matchCode" placeholder="请输入比赛编码" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="所属赛季" prop="seasonId" v-if="isMoreQuery">
              <dortmund-season-select ref="seasonSelect" v-model="queryParams.seasonId" :enter-callback="handleQuery" />
            </el-form-item>
            <el-form-item label="比赛时间" prop="matchTime">
              <el-date-picker v-model="daterangeMatchTime" style="width: 240px" value-format="yyyy-MM-dd"
                popper-class="dortmund-theme-popper" type="daterange" range-separator="-" start-placeholder="开始日期"
                end-placeholder="结束日期" clearable></el-date-picker>
            </el-form-item>
            <el-form-item label="比赛场地" prop="matchVenue" v-if="isMoreQuery">
              <dortmund-option-select v-model="queryParams.matchVenue" option-type="venue" placeholder="请选择或输入比赛场地" />
            </el-form-item>
            <el-form-item label="比赛状态" prop="matchStatus" v-if="isMoreQuery">
              <el-select v-model="queryParams.matchStatus" style="width: 100%" placeholder="请选择比赛状态" clearable
                popper-class="dortmund-theme-popper" @keyup.enter.native="handleQuery">
                <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
                popper-class="dortmund-theme-popper" type="daterange" range-separator="-" start-placeholder="开始日期"
                end-placeholder="结束日期" clearable></el-date-picker>
            </el-form-item>
            <el-form-item label="更新时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd"
                popper-class="dortmund-theme-popper" type="daterange" range-separator="-" start-placeholder="开始日期"
                end-placeholder="结束日期" clearable></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              <el-button type="success" class="dl-more-btn" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'"
                size="mini" @click="handleMoreQuery">
                {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
              </el-button>
            </el-form-item>
          </el-form>
        </transition>

        <div class="dl-toolbar">
          <div class="dl-toolbar-actions">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
              v-hasPermi="['dortmund:match:add']">新增</el-button>
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:match:edit']">修改</el-button>
            <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
              v-hasPermi="['dortmund:match:remove']">删除</el-button>
            <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:match:export']">导出</el-button> -->
            <transition name="dl-chip">
              <span class="dl-selected-chip" v-if="ids.length > 0"><i class="el-icon-circle-check"></i>已选 {{ ids.length
              }} 项</span>
            </transition>
          </div>
          <div class="dl-toolbar-side">
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </div>
        </div>

        <div class="dl-list-card">
          <el-table v-loading="loading" :data="matchList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="46" align="center" />
            <el-table-column label="比赛编号" align="center" prop="matchId" width="96" fixed="left" />
            <el-table-column label="所属赛季" align="center" prop="seasonName" min-width="120" fixed="left"
              show-overflow-tooltip />
            <el-table-column label="比赛编码" align="center" prop="matchCode" min-width="140" fixed="left"
              show-overflow-tooltip />
            <el-table-column label="主队名称" align="center" prop="homeTeamName" min-width="150" fixed="left"
              show-overflow-tooltip>
              <template slot-scope="scope">
                <span class="match-team-name home">{{ scope.row.homeTeamName || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="客队名称" align="center" prop="awayTeamName" min-width="150" fixed="left"
              show-overflow-tooltip>
              <template slot-scope="scope">
                <span class="match-team-name away">{{ scope.row.awayTeamName || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="比赛时间" align="center" prop="matchTime" width="150" class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="比赛场地" align="center" prop="matchVenue" min-width="150" show-overflow-tooltip />
            <el-table-column label="比赛状态" align="center" prop="matchStatus" width="96">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
              </template>
            </el-table-column>
            <!-- 分析次数为后台统计字段，本页只读展示，不接受录入 -->
            <el-table-column label="分析次数" align="center" prop="analysisCount" width="100" />
            <el-table-column label="比赛结果" align="center" prop="matchResult" width="96">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.fx67ll_match_result" :value="scope.row.matchResult" />
              </template>
            </el-table-column>
            <el-table-column label="已采用组合" align="center" prop="adoptedCombinationCount" width="120">
              <template slot-scope="scope">
                <el-button v-if="scope.row.adoptedCombinationCount > 0" type="text" class="dortmund-theme-text"
                  @click="handleAdoptedCombinations(scope.row)">
                  {{ scope.row.adoptedCombinationCount }}
                </el-button>
                <span v-else class="match-adopted-zero">0</span>
              </template>
            </el-table-column>
            <el-table-column label="比赛备注" align="center" prop="matchRemark" min-width="200"
              :show-overflow-tooltip="true" />
            <el-table-column label="记录创建者" align="center" prop="createBy" min-width="100" show-overflow-tooltip />
            <el-table-column label="记录创建时间" align="center" prop="createTime" width="150"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="记录更新者" align="center" prop="updateBy" min-width="100" show-overflow-tooltip />
            <el-table-column label="记录更新时间" align="center" prop="updateTime" width="150"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width dortmund-action-column"
              fixed="right" width="186">
              <template slot-scope="scope">
                <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
                  @click="handleDetail(scope.row)" v-hasPermi="['dortmund:match:query']" />
                <dortmund-action-button label="修改" icon="el-icon-edit" action="edit" @click="handleUpdate(scope.row)"
                  v-hasPermi="['dortmund:match:edit']" />
                <dortmund-action-button label="关联倍率" icon="el-icon-data-line" action="relation"
                  @click="handleOdds(scope.row)" v-hasPermi="['dortmund:odds:list']" />
                <dortmund-action-button label="关联信息点" icon="el-icon-notebook-2" action="info"
                  @click="handleInfoPoints(scope.row)" v-hasPermi="['dortmund:info:point:list']" />
                <dortmund-action-button label="删除" icon="el-icon-delete" action="delete"
                  @click="handleDelete(scope.row)" v-hasPermi="['dortmund:match:remove']" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" :page-sizes="pageSizes" @pagination="getList" />
      </div>

      <!-- 比赛编排场景：新增/修改共用整页，按填写顺序铺开 -->
      <match-edit-scene key="edit" v-else ref="editScene" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave"
        @saved="getList" />
    </transition>

    <dortmund-detail-drawer :visible.sync="matchDetailVisible" title="比赛详情"
      :subtitle="matchDetailData.matchCode ? `比赛编码 · ${matchDetailData.matchCode}` : '查看对阵、状态与审计信息'"
      icon="el-icon-football" tone="green" size="680px" feature="match" :loading="matchDetailLoading">
      <dortmund-detail-card v-if='hasMatchStage' title='对阵舞台' icon='el-icon-football' tone='green'>
        <dortmund-detail-block variant='versus' tone='green' :home='matchDetailData.homeTeamName'
          :away='matchDetailData.awayTeamName' :items='matchVersusFields' />
      </dortmund-detail-card>

      <dortmund-detail-card v-if='hasMatchSchedule' title='赛程资料' icon='el-icon-date' tone='green'>
        <dortmund-detail-block variant='metric' tone='green' :items='matchScheduleItems' />
      </dortmund-detail-card>

      <dortmund-detail-card v-if='hasMatchStats' title='业务统计' icon='el-icon-data-analysis' tone='green'>
        <dortmund-detail-block variant='metric' tone='green' :items='matchMetricItems' />
      </dortmund-detail-card>

      <dortmund-detail-card title='归属与关联' icon='el-icon-connection' tone='green'>
        <div class='match-detail-field-grid'>
          <div class='match-detail-field'>
            <span>比赛ID</span>
            <strong>{{ displayValue(matchDetailData.matchId) }}</strong>
          </div>
          <div class='match-detail-field'>
            <span>比赛编码</span>
            <strong>{{ displayValue(matchDetailData.matchCode) }}</strong>
          </div>
          <div v-for='item in matchAssociationFields' :key='item.label' class='match-detail-field'>
            <span>{{ item.label }}</span>
            <strong>{{ displayValue(item.value) }}</strong>
          </div>
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title='比赛备注' icon='el-icon-document' tone='green'>
        <div class="dortmund-detail-text-block">{{ displayValue(matchDetailData.matchRemark, '暂无比赛备注') }}</div>
      </dortmund-detail-card>

      <dortmund-detail-card title='记录轨迹' subtitle='归属、创建与最近更新' icon='el-icon-time' tone='green'>
        <dortmund-record-trail :items='matchRecordTrail' empty-text='暂无比赛记录轨迹' />
      </dortmund-detail-card>
      <template slot="footer">
        <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="matchDetailVisible = false">关闭</el-button>
      </template>
    </dortmund-detail-drawer>

    <match-odds-drawer :visible.sync="oddsDrawerVisible" :match="oddsDrawerMatch" @refresh="getList" />
    <match-info-drawer :visible.sync="infoDrawerVisible" :match="infoDrawerMatch" @refresh="getList" />

  </div>
</template>

<script>
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/fx67ll/dortmund/match";

import DortmundOptionSelect from "@/views/fx67ll/dortmund/other/component/DortmundOptionSelect/index";
import DortmundSeasonSelect from "@/views/fx67ll/dortmund/other/component/DortmundSeasonSelect/index";
import MatchEditScene from "./components/MatchEditScene/index";
import MatchOddsDrawer from "./components/MatchOddsDrawer/index";
import MatchInfoDrawer from "./components/MatchInfoDrawer/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "Match",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: {
    MatchEditScene, DortmundOptionSelect, DortmundSeasonSelect, MatchOddsDrawer, MatchInfoDrawer,
    DortmundDetailDrawer, DortmundDetailCard, DortmundActionButton, DortmundDetailBlock, DortmundRecordTrail
  },
  computed: {
    matchVersusFields() {
      return [
        { label: '所属赛季', value: this.matchDetailData.seasonName, emptyText: '未关联赛季' },
        { label: '比赛时间', value: this.parseTime(this.matchDetailData.matchTime, '{y}-{m}-{d} {h}:{i}:{s}'), emptyText: '未记录' },
        { label: '比赛场地', value: this.matchDetailData.matchVenue, emptyText: '未记录' },
      ];
    },
    matchScheduleItems() {
      return [
        { label: '所属赛季ID', value: this.matchDetailData.seasonId, emptyText: '未记录', icon: 'el-icon-collection-tag' },
        { label: '比赛时间', value: this.parseTime(this.matchDetailData.matchTime, '{y}-{m}-{d} {h}:{i}:{s}'), emptyText: '未记录', icon: 'el-icon-time' },
        { label: '比赛场地', value: this.matchDetailData.matchVenue, emptyText: '未记录', icon: 'el-icon-location-outline' },
        { label: '资料状态', value: this.displayDict(this.dict.type.sys_notice_status, this.matchDetailData.matchStatus, '未设置'), emptyText: '未设置', icon: 'el-icon-data-analysis' },
      ];
    },
    matchMetricItems() {
      return [
        { label: '比赛结果', value: this.displayDict(this.dict.type.fx67ll_match_result, this.matchDetailData.matchResult, '未产生赛果'), emptyText: '未产生赛果', icon: 'el-icon-trophy' },
        { label: '分析次数', value: this.matchDetailData.analysisCount, emptyText: '暂无分析', icon: 'el-icon-search' },
        { label: '已采用组合', value: this.matchDetailData.adoptedCombinationCount, emptyText: '暂无采用', icon: 'el-icon-collection-tag' },
      ];
    },
    // 三个资料区只在详情数据确有内容时展示，避免接口缺字段时出现空白卡片
    hasMatchStage() {
      return [
        this.matchDetailData.homeTeamName,
        this.matchDetailData.awayTeamName,
        this.matchDetailData.seasonName,
        this.matchDetailData.matchTime,
        this.matchDetailData.matchVenue,
      ].some((value) => this.hasDisplayValue(value));
    },
    hasMatchSchedule() {
      return [
        this.matchDetailData.seasonId,
        this.matchDetailData.matchTime,
        this.matchDetailData.matchVenue,
        this.matchDetailData.matchStatus,
      ].some((value) => this.hasDisplayValue(value));
    },
    hasMatchStats() {
      return [
        this.matchDetailData.matchResult,
        this.matchDetailData.analysisCount,
        this.matchDetailData.adoptedCombinationCount,
      ].some((value) => this.hasDisplayValue(value));
    },
    matchAssociationFields() {
      return [
        { label: '所属赛季ID', value: this.matchDetailData.seasonId },
        { label: '主队球队ID', value: this.matchDetailData.homeTeamId },
        { label: '客队球队ID', value: this.matchDetailData.awayTeamId },
        { label: '归属用户ID', value: this.matchDetailData.userId },
      ];
    },
    matchRecordTrail() {
      const createTime = this.parseTime(this.matchDetailData.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const updateTime = this.parseTime(this.matchDetailData.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return [
        { key: 'owner', label: '归属用户ID', value: this.matchDetailData.userId, icon: 'el-icon-user' },
        { key: 'create', label: '创建记录', value: this.matchDetailData.createBy, hint: createTime ? `创建时间 · ${createTime}` : '', icon: 'el-icon-edit-outline', state: 'success' },
        { key: 'update', label: '最近更新', value: this.matchDetailData.updateBy, hint: updateTime ? `更新时间 · ${updateTime}` : '', icon: 'el-icon-refresh', state: 'warning' },
      ];
    },
  },
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
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
        matchId: null,
        matchCode: null,
        seasonId: null,
        homeTeamName: null,
        awayTeamName: null,
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
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      // 编排场景初始表单（进入编排场景前由父页面构建，场景组件复制出可编辑副本）
      editForm: {},
      // 比赛关联倍率抽屉
      oddsDrawerVisible: false,
      oddsDrawerMatch: null,
      // 比赛关联信息点抽屉
      infoDrawerVisible: false,
      infoDrawerMatch: null,
      // 比赛只读详情抽屉与当前列表快照
      matchDetailVisible: false,
      matchDetailLoading: false,
      matchDetailData: {},
      // 球场预设选项数组（查询表单比赛场地可选项）
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
      }).catch(() => {
        this.matchList = [];
        this.total = 0;
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
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.daterangeMatchTime = [];
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
          matchCode: detail.matchCode,
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
      }).catch(() => {
      }).finally(() => {
        this.editLoading = false;
      });
    },
    // 重置编排场景初始表单（场景组件每次进入重新挂载，自带当场新增面板与表单重置）
    resetEditScene() {
      this.editForm = {
        matchId: null,
        matchCode: null,
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
    handleOdds(row) {
      this.oddsDrawerMatch = row;
      this.oddsDrawerVisible = true;
    },
    // 详情按钮操作：先展示列表快照，再拉取详情补齐球队、赛季与统计字段
    handleDetail(row) {
      const snapshot = { ...(row || {}) };
      this.matchDetailData = snapshot;
      this.matchDetailLoading = true;
      this.matchDetailVisible = true;
      getMatch(snapshot.matchId).then(response => {
        const detail = response.data || {};
        if (detail.matchId == null) {
          this.$modal.msgWarning("比赛不存在或已删除，请刷新后重试");
          return;
        }
        this.matchDetailData = { ...snapshot, ...detail };
      }).catch(() => {
        // 接口异常时保留列表快照，避免详情抽屉空白
      }).finally(() => {
        this.matchDetailLoading = false;
      });
    },
    // 在侧边面板查看并维护当前比赛关联的信息点，避免跳转页面
    handleInfoPoints(row) {
      this.infoDrawerMatch = row;
      this.infoDrawerVisible = true;
    },
    handleAdoptedCombinations(row) {
      if (!row.adoptedCombinationCount) {
        return;
      }
      this.$router.push({ path: "/ai/solution/return", query: { matchId: row.matchId } });
    },
    // 空值处理：仅 null、undefined 和空白字符串视为缺失，保留数字 0
    displayValue(value, fallback = "-") {
      if (value === null || value === undefined) {
        return fallback;
      }
      const normalized = String(value).trim();
      return normalized === "" ? fallback : normalized;
    },
    // 字典值转标签；字典尚未加载时回退到原始值，避免误显示为未设置
    displayDict(options, value, fallback = "-") {
      if (value === null || value === undefined || value === "") {
        return fallback;
      }
      return this.selectDictLabel(options || [], value) || String(value);
    },
    // 统计值 0 属于有效数据，仅缺失值参与空值判断
    hasDisplayValue(value) {
      if (value === null || value === undefined) {
        return false;
      }
      return String(value).trim() !== "";
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
    color: #8a6b3d;
    background: #faf3e6;
  }
}

.match-adopted-zero {
  font-size: 12px;
  color: #9aa8a1;
}

.match-detail-home {
  color: #218e50;
}

.match-detail-away {
  color: #5a8f73;
}

.match-detail-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px 24px;
  padding: 2px 0;
}

.match-detail-field {
  min-width: 0;

  span {
    display: block;
    margin-bottom: 5px;
    font-size: 10px;
    font-weight: 700;
    color: #7c8b84;
    letter-spacing: .05em;
  }

  strong {
    display: block;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.55;
    color: #26362e;
    overflow-wrap: anywhere;
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
