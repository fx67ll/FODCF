<template>
  <div class="app-container dl-page">
    <!-- 场景切换：总览列表 / 比赛编排 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <transition name="dl-filter">
          <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true"
            v-show="showSearch" label-width="68px">
            <el-form-item label="比赛球队" prop="teamName" v-if="isMoreQuery">
              <el-input v-model="queryParams.teamName" placeholder="请输入主队或客队名称" clearable @input="handleFilterInput"
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="主队名称" prop="homeTeamName" v-if="isMoreQuery">
              <el-input v-model="queryParams.homeTeamName" placeholder="请输入主队名称" clearable @input="handleFilterInput"
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="球队主场" prop="matchVenue" v-if="isMoreQuery">
              <dortmund-team-option-selector v-model="queryParams.matchVenue" option-type="venue" :multiple="false"
                :allow-create="false" clearable size="small" width="220px" placeholder="请选择球队主场"
                @change="handleFilterChange" />
            </el-form-item>
            <el-form-item label="客队名称" prop="awayTeamName" v-if="isMoreQuery">
              <el-input v-model="queryParams.awayTeamName" placeholder="请输入客队名称" clearable @input="handleFilterInput"
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="比赛编码" prop="matchCode" v-if="isMoreQuery">
              <el-input v-model="queryParams.matchCode" placeholder="请输入比赛编码" clearable @input="handleFilterInput"
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="赛果范围" prop="resultScope" v-if="!isMoreQuery">
              <el-select v-model="resultScope" class="match-result-scope-select" placeholder="请选择赛果范围" clearable
                popper-class="dortmund-theme-popper" @change="handleResultScopeChange">
                <el-option v-for="option in resultScopeOptions" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="比赛结果" prop="matchResult" v-if="isMoreQuery">
              <el-select v-model="queryParams.matchResult" style="width: 100%" placeholder="请选择比赛结果" clearable
                popper-class="dortmund-theme-popper" @change="handleAdvancedResultFilterChange">
                <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
                <el-option label="未登记" :value="DORTMUND_FILTER_UNREGISTERED_VALUE" />
              </el-select>
            </el-form-item>
            <el-form-item label="倍率赛果" prop="oddsResultFilters" v-if="isMoreQuery">
              <el-select v-model="queryParams.oddsResultFilters" multiple collapse-tags clearable style="width: 100%"
                placeholder="请选择倍率赛果" popper-class="dortmund-theme-popper" @change="handleAdvancedResultFilterChange">
                <el-option v-for="dict in dict.type.fx67ll_dortmund_odds_type" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
                <el-option label="未登记" :value="DORTMUND_FILTER_UNREGISTERED_VALUE" />
              </el-select>
            </el-form-item>
            <el-form-item label="比赛状态" prop="matchStatus" v-if="isMoreQuery">
              <el-select v-model="queryParams.matchStatus" style="width: 100%" placeholder="请选择比赛状态" clearable
                popper-class="dortmund-theme-popper" @change="handleFilterChange" @keyup.enter.native="handleQuery">
                <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="所属赛季" prop="seasonId" v-if="isMoreQuery">
              <dortmund-season-select ref="seasonSelect" v-model="queryParams.seasonId" :enter-callback="handleQuery"
                @change="handleFilterChange" />
            </el-form-item>
            <el-form-item label="创建时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeCreateTime" style="width: 360px" value-format="yyyy-MM-dd HH:mm:ss"
                popper-class="dortmund-theme-popper" type="datetimerange" range-separator="-" start-placeholder="开始时间"
                end-placeholder="结束时间" clearable @change="handleFilterChange"></el-date-picker>
            </el-form-item>
            <el-form-item label="更新时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeUpdateTime" style="width: 360px" value-format="yyyy-MM-dd HH:mm:ss"
                popper-class="dortmund-theme-popper" type="datetimerange" range-separator="-" start-placeholder="开始时间"
                end-placeholder="结束时间" clearable @change="handleFilterChange"></el-date-picker>
            </el-form-item>
            <el-form-item label="比赛时间" prop="matchTime">
              <el-date-picker v-model="daterangeMatchTime" style="width: 360px" value-format="yyyy-MM-dd HH:mm:ss"
                popper-class="dortmund-theme-popper" type="datetimerange" range-separator="-" start-placeholder="开始时间"
                end-placeholder="结束时间" clearable @change="handleFilterChange"></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              <el-button v-if="isResetStatus" type="warning" icon="el-icon-scissors" size="mini"
                @click="handleViewValidData">只看有效数据</el-button>
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
            <!-- 导出支持 Excel/JSON/插入 SQL；导入改为 JSON 预览勾选，模板与提示词共用模块配置。 -->
            <dortmund-export-menu title="比赛记录" permission="dortmund:match:export" endpoint="/dortmund/match/export"
              :params="matchRequestParams" file-prefix="dortmund-match" />
            <el-button v-if="canImportMatchRecord || canImportMatchResult" type="primary" plain size="mini"
              icon="el-icon-upload2" @click="matchImportVisible = true">导入 JSON</el-button>
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
            <!-- <el-table-column label="比赛编号" align="center" prop="matchId" width="96" fixed="left" /> -->
            <el-table-column label="主队名称" align="center" prop="homeTeamName" min-width="180" fixed="left"
              show-overflow-tooltip>
              <template slot-scope="scope">
                <span class="match-team-name home is-clickable" :class="teamLeagueClass(scope.row, 'home')"
                  role="button" tabindex="0" @click.stop="openTeamDetail(scope.row, 'home')"
                  @keyup.enter.stop="openTeamDetail(scope.row, 'home')">{{ scope.row.homeTeamName
                    || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="客队名称" align="center" prop="awayTeamName" min-width="180" fixed="left"
              show-overflow-tooltip>
              <template slot-scope="scope">
                <span class="match-team-name away is-clickable" :class="teamLeagueClass(scope.row, 'away')"
                  role="button" tabindex="0" @click.stop="openTeamDetail(scope.row, 'away')"
                  @keyup.enter.stop="openTeamDetail(scope.row, 'away')">{{ scope.row.awayTeamName
                    || "-" }}</span>
              </template>
            </el-table-column>
            <!-- 分析次数为后台统计字段，本页只读展示，不接受录入 -->
            <el-table-column label="分析次数" align="center" prop="analysisCount" width="100">
              <template slot-scope="scope">
                <dortmund-usage-heat-badge :value="scope.row.analysisCount" label="分析次数" tone="red" />
              </template>
            </el-table-column>
            <el-table-column label="已采用组合" align="center" prop="adoptedCombinationCount" width="120">
              <template slot-scope="scope">
                <dortmund-usage-heat-badge :value="scope.row.adoptedCombinationCount"
                  :interactive="Number(scope.row.adoptedCombinationCount) > 0" label="已采用组合" tone="green"
                  @click="handleAdoptedCombinations(scope.row)" />
              </template>
            </el-table-column>
            <el-table-column label="比赛结果" align="center" prop="matchResult" width="100">
              <template slot-scope="scope">
                <dict-tag v-if="hasMatchResult(scope.row.matchResult)" :options="dict.type.fx67ll_match_result"
                  :value="scope.row.matchResult" />
                <dortmund-result-empty-tag v-else />
              </template>
            </el-table-column>
            <el-table-column label="倍率赛果" align="center" prop="oddsResult" width="150">
              <template slot-scope="scope">
                <dortmund-odds-result-tags :value="scope.row.oddsResult" empty-text="未登记" />
              </template>
            </el-table-column>
            <el-table-column label="所属赛季" align="center" prop="seasonName" min-width="80" show-overflow-tooltip />
            <el-table-column label="球队主场" align="center" prop="matchVenue" min-width="180" show-overflow-tooltip />
            <el-table-column label="比赛编码" align="center" prop="matchCode" min-width="200" show-overflow-tooltip />
            <el-table-column label="比赛状态" align="center" prop="matchStatus" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
              </template>
            </el-table-column>
            <el-table-column label="比赛备注" align="center" prop="matchRemark" min-width="200"
              :show-overflow-tooltip="true" />
            <el-table-column label="记录创建者" align="center" prop="createBy" min-width="100" show-overflow-tooltip>
              <template slot-scope="scope">{{ formatAuditActor(scope.row.createBy) }}</template>
            </el-table-column>
            <el-table-column label="记录创建时间" align="center" prop="createTime" width="150"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="记录更新者" align="center" prop="updateBy" min-width="100" show-overflow-tooltip>
              <template slot-scope="scope">{{ formatAuditActor(scope.row.updateBy) }}</template>
            </el-table-column>
            <el-table-column label="记录更新时间" align="center" prop="updateTime" width="150"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="比赛时间" align="center" prop="matchTime" width="150" fixed="right"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
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

        <pagination v-show="total > 0" :total="total" popper-class="dortmund-theme-popper"
          :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" :page-sizes="pageSizes"
          @pagination="getList" />
      </div>

      <!-- 比赛编排场景：新增/修改共用整页，按填写顺序铺开 -->
      <match-edit-scene key="edit" v-else ref="editScene" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave"
        @saved="getList" />
    </transition>

    <dortmund-detail-drawer :visible.sync="matchDetailVisible" :shifted="adoptedCombinationVisible" title="比赛详情"
      :subtitle="matchDetailData.matchCode ? `比赛编码 · ${matchDetailData.matchCode}` : '查看对阵、状态与审计信息'"
      icon="el-icon-football" tone="green" size="840px" feature="match" :loading="matchDetailLoading">
      <dortmund-detail-card v-if='hasMatchStage' title='对阵舞台' icon='el-icon-football' tone='green'>
        <dortmund-detail-block variant='versus' tone='green' :home='matchDetailData.homeTeamName'
          :away='matchDetailData.awayTeamName' :items='matchVersusFields' />
      </dortmund-detail-card>

      <dortmund-detail-card v-if='hasMatchSchedule' title='赛程资料' icon='el-icon-date' tone='green'>
        <div class='match-detail-schedule'>
          <dortmund-detail-block variant='metric' tone='green' :items='matchScheduleItems' />
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card v-if='hasMatchStats' title='业务统计' icon='el-icon-data-analysis' tone='green'>
        <div class='match-detail-stats'>
          <dortmund-detail-block variant='metric' tone='green' :items='matchMetricItems'
            @item-click="handleMatchMetricClick" />
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title='归属与关联' icon='el-icon-connection' tone='green'>
        <div class='match-detail-field-grid match-detail-field-grid--quad'>
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

    <dortmund-adopted-combinations-drawer :visible.sync="adoptedCombinationVisible"
      :match-id="adoptedCombinationMatch.matchId" :match-label="adoptedCombinationLabel" />

    <dortmund-team-detail-drawer :visible.sync="teamDetailVisible" :team-id="teamDetailId"
      :snapshot="teamDetailSnapshot" level="1" />

    <match-odds-drawer :visible.sync="oddsDrawerVisible" :match="oddsDrawerMatch" @refresh="getList" />
    <match-info-drawer :visible.sync="infoDrawerVisible" :match="infoDrawerMatch" @refresh="getList" />
    <dortmund-match-import-drawer :visible.sync="matchImportVisible" @imported="handleMatchImported" />

  </div>
</template>

<script>
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/fx67ll/dortmund/match";

import DortmundSeasonSelect from "@/views/fx67ll/dortmund/other/component/DortmundSeasonSelect/index";
import DortmundTeamOptionSelector from "@/views/fx67ll/dortmund/other/component/DortmundTeamOptionSelector/index";
import MatchEditScene from "./components/MatchEditScene/index";
import MatchOddsDrawer from "./components/MatchOddsDrawer/index";
import MatchInfoDrawer from "./components/MatchInfoDrawer/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";
import DortmundAdoptedCombinationsDrawer from "@/views/fx67ll/dortmund/other/component/DortmundAdoptedCombinationsDrawer/index";
import DortmundTeamDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundTeamDetailDrawer/index";
import DortmundOddsResultTags from "@/views/fx67ll/dortmund/other/component/DortmundOddsResultTags/index";
import DortmundUsageHeatBadge from "@/views/fx67ll/dortmund/other/component/DortmundUsageHeatBadge/index";
import DortmundResultEmptyTag from "@/views/fx67ll/dortmund/other/component/DortmundResultEmptyTag/index";
import DortmundExportMenu from "@/views/fx67ll/dortmund/other/component/DortmundExportMenu/index";
import DortmundMatchImportDrawer from "@/views/fx67ll/dortmund/other/component/DortmundMatchImportDrawer/index";
import {
  DORTMUND_PAGINATION,
  DORTMUND_FILTER_UNREGISTERED_VALUE,
  DORTMUND_RETURN_CONFIG,
  resolveDortmundLeagueTheme,
  splitDortmundOddsResult,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";
import filterAutoQuery from "@/views/fx67ll/dortmund/other/utils/filterAutoQuery";
import { checkPermi } from "@/utils/common/permission";
export default {
  name: "Match",
  dicts: ["sys_notice_status", "fx67ll_match_result", "fx67ll_dortmund_odds_type"],
  components: {
    MatchEditScene, DortmundTeamOptionSelector, DortmundSeasonSelect, MatchOddsDrawer, MatchInfoDrawer,
    DortmundDetailDrawer, DortmundDetailCard, DortmundActionButton, DortmundDetailBlock, DortmundRecordTrail,
    DortmundAdoptedCombinationsDrawer, DortmundTeamDetailDrawer, DortmundOddsResultTags, DortmundUsageHeatBadge,
    DortmundResultEmptyTag, DortmundExportMenu, DortmundMatchImportDrawer
  },
  mixins: [filterAutoQuery],
  computed: {
    canImportMatchRecord() {
      return checkPermi(["dortmund:match:add"]);
    },
    canImportMatchResult() {
      return checkPermi(["dortmund:match:edit"]);
    },
    matchVersusFields() {
      return [
        { label: '所属赛季', value: this.matchDetailData.seasonName, emptyText: '未关联赛季' },
        { label: '比赛时间', value: this.parseTime(this.matchDetailData.matchTime, '{y}-{m}-{d} {h}:{i}:{s}'), emptyText: '未记录' },
        { label: '球队主场', value: this.matchDetailData.matchVenue, emptyText: '未记录' },
      ];
    },
    matchScheduleItems() {
      return [
        { label: '所属赛季', value: this.matchDetailData.seasonName, emptyText: '未关联赛季', icon: 'el-icon-collection-tag' },
        { label: '比赛时间', value: this.parseTime(this.matchDetailData.matchTime, '{y}-{m}-{d} {h}:{i}:{s}'), emptyText: '未记录', icon: 'el-icon-time' },
        { label: '球队主场', value: this.matchDetailData.matchVenue, emptyText: '未记录', icon: 'el-icon-location-outline' },
        { label: '资料状态', value: this.displayDict(this.dict.type.sys_notice_status, this.matchDetailData.matchStatus, '未设置'), emptyText: '未设置', icon: 'el-icon-data-analysis' },
      ];
    },
    matchMetricItems() {
      return [
        { label: '比赛结果', value: this.displayDict(this.dict.type.fx67ll_match_result, this.matchDetailData.matchResult, '未产生赛果'), emptyText: '未产生赛果', icon: 'el-icon-trophy' },
        { label: '倍率赛果', value: this.formatOddsResultLabels(this.matchDetailData.oddsResult), emptyText: '未登记', icon: 'el-icon-data-line' },
        {
          label: '分析次数',
          value: Number(this.matchDetailData.analysisCount) || 0,
          emptyText: '暂无分析',
          icon: 'el-icon-search',
        },
        {
          label: '已采用组合',
          value: Number(this.matchDetailData.adoptedCombinationCount) || 0,
          emptyText: '暂无采用',
          icon: 'el-icon-collection-tag',
          clickable: Number(this.matchDetailData.adoptedCombinationCount) > 0,
          action: 'adopted',
          hint: Number(this.matchDetailData.adoptedCombinationCount) > 0 ? '点击查看已采用回报组合' : '',
        },
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
        this.matchDetailData.seasonName,
        this.matchDetailData.matchTime,
        this.matchDetailData.matchVenue,
        this.matchDetailData.matchStatus,
      ].some((value) => this.hasDisplayValue(value));
    },
    hasMatchStats() {
      return [
        this.matchDetailData.matchResult,
        this.matchDetailData.oddsResult,
        this.matchDetailData.analysisCount,
        this.matchDetailData.adoptedCombinationCount,
      ].some((value) => this.hasDisplayValue(value));
    },
    matchAssociationFields() {
      // 详情只返回可读业务主体，不暴露数据库主键和归属用户 ID。
      return [
        { label: '所属赛季', value: this.matchDetailData.seasonName },
        { label: '主队', value: this.matchDetailData.homeTeamName },
        { label: '客队', value: this.matchDetailData.awayTeamName },
      ];
    },
    matchRecordTrail() {
      const createTime = this.parseTime(this.matchDetailData.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const updateTime = this.parseTime(this.matchDetailData.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return [
        { key: 'create', label: '创建记录', value: this.formatAuditActor(this.matchDetailData.createBy), hint: createTime ? `创建时间 · ${createTime}` : '', icon: 'el-icon-edit-outline', state: 'success' },
        { key: 'update', label: '最近更新', value: this.formatAuditActor(this.matchDetailData.updateBy), hint: updateTime ? `更新时间 · ${updateTime}` : '', icon: 'el-icon-refresh', state: 'warning' },
      ];
    },
    // 已采用组合抽屉使用主客队名称作为上下文标题。
    adoptedCombinationLabel() {
      return [this.adoptedCombinationMatch.homeTeamName, this.adoptedCombinationMatch.awayTeamName]
        .filter(Boolean).join(" vs ");
    },
    // 快捷赛果范围与高级赛果条件互斥；导出复用同一份请求参数，避免导出结果和列表口径不一致。
    matchRequestParams() {
      const params = {
        ...this.queryParams,
        oddsResultFilters: [...(this.queryParams.oddsResultFilters || [])],
        pendingRegistration: null,
      };
      params.matchResult = null;
      params.oddsResultFilters = [];
      if (this.resultScope === "PENDING") {
        params.pendingRegistration = true;
      } else if (this.resultScope === "MATCH_U") {
        params.matchResult = DORTMUND_FILTER_UNREGISTERED_VALUE;
      } else if (this.resultScope === "ODDS_U") {
        params.oddsResultFilters = [DORTMUND_FILTER_UNREGISTERED_VALUE];
      } else {
        // 空值表示不限赛果；只有高级搜索显式选择了赛果条件时才提交对应字段。
        params.matchResult = this.queryParams.matchResult || null;
        params.oddsResultFilters = [...(this.queryParams.oddsResultFilters || [])];
      }
      return params;
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
      // 基础搜索的快捷赛果范围，默认与移动端保持一致，只展示待补录记录。
      resultScope: "PENDING",
      resultScopeOptions: [
        { label: "待补录", value: "PENDING" },
        { label: "比赛结果未登记", value: "MATCH_U" },
        { label: "倍率赛果未登记", value: "ODDS_U" },
      ],
      // 重置后显示“只看有效数据”快捷入口；点击恢复默认未来赛程后隐藏。
      isResetStatus: false,
      // 高级搜索未登记筛选哨兵，供模板复用，避免散落魔法字符串。
      DORTMUND_FILTER_UNREGISTERED_VALUE,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
        matchId: null,
        matchCode: null,
        seasonId: null,
        teamName: null,
        homeTeamName: null,
        awayTeamName: null,
        beginMatchTime: null,
        endMatchTime: null,
        matchVenue: null,
        matchStatus: null,
        matchResult: null,
        oddsResultFilters: [],
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
      // 已采用组合抽屉：列表页与详情页共用同一个简化列表和组合详情入口。
      adoptedCombinationVisible: false,
      adoptedCombinationMatch: {},
      teamDetailVisible: false,
      teamDetailId: null,
      teamDetailSnapshot: {},
      // JSON 导入侧边抽屉：预览、勾选和后端整批校验均在共享组件内完成。
      matchImportVisible: false,
    };
  },
  created() {
    // 初次进入展示前 7 天至未来 23 天的赛程，与“只看有效数据”口径一致。
    this.daterangeMatchTime = this.buildValidMatchTimeRange();
    this.getList();
  },
  methods: {
    // 空用户名来自第三方导入或历史数据，统一标注来源，避免列表审计列为空。
    formatAuditActor(value) {
      return formatAuditActor(value);
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
      this.queryParams.beginMatchTime = null;
      this.queryParams.endMatchTime = null;
    },
    // 高级搜索字段使用 v-if 动态挂载，resetFields() 无法重置已卸载字段及内部选择器。
    // 因此显式重置查询模型、时间范围和高级筛选项，保证搜索面板展开前后行为一致。
    resetMatchQueryFilters() {
      this.queryParams.matchId = null;
      this.queryParams.matchCode = null;
      this.queryParams.seasonId = null;
      this.queryParams.teamName = null;
      this.queryParams.homeTeamName = null;
      this.queryParams.awayTeamName = null;
      this.queryParams.matchVenue = null;
      this.queryParams.matchStatus = null;
      this.queryParams.matchResult = null;
      this.queryParams.oddsResultFilters = [];
      // 清空赛果范围时使用空值，和查询参数“不限赛果”保持同一口径。
      this.resultScope = "";
      this.clearDateQueryParams();
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.daterangeMatchTime = [];
      if (this.$refs.queryForm) {
        this.$refs.queryForm.clearValidate();
      }
    },
    // 有效数据窗口向前回看 7 天，并沿用分析选场的 23 天前瞻区间。
    buildValidMatchTimeRange() {
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime()
        + DORTMUND_RETURN_CONFIG.matchSelectionWindowDays * 24 * 60 * 60 * 1000);
      return [
        this.parseTime(start, "{y}-{m}-{d} {h}:{i}:{s}"),
        this.parseTime(end, "{y}-{m}-{d} {h}:{i}:{s}"),
      ];
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
      listMatch(this.matchRequestParams).then(response => {
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
      if (this.isMoreQuery) {
        // 进入高级搜索时保留比赛时间等表单，只清空快捷赛果范围，改由高级赛果条件控制。
        this.resultScope = "";
        this.handleQuery();
      } else {
        // 返回基础搜索即恢复“只看有效数据”口径，并关闭高级筛选面板。
        this.applyValidDataState();
      }
    },
    // 快捷范围代表完整赛果口径；清空快捷范围时同步清空高级赛果条件，回到不限赛果。
    handleResultScopeChange() {
      this.queryParams.matchResult = null;
      this.queryParams.oddsResultFilters = [];
      this.handleQuery();
    },
    // 具体高级赛果条件优先于快捷范围；全部清空后回到不限赛果。
    handleAdvancedResultFilterChange() {
      this.resultScope = "";
      this.handleQuery();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetMatchQueryFilters();
      this.isResetStatus = true;
      this.handleQuery();
    },
    // 有效数据状态统一恢复默认赛果范围、前后时间窗口并关闭高级搜索。
    applyValidDataState() {
      this.resetMatchQueryFilters();
      this.isMoreQuery = false;
      this.daterangeMatchTime = this.buildValidMatchTimeRange();
      this.resultScope = "PENDING";
      this.isResetStatus = false;
      this.handleQuery();
    },
    // 重置后点击剪刀恢复有效数据口径，同时收起高级搜索面板。
    handleViewValidData() {
      this.applyValidDataState();
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
          oddsResult: detail.oddsResult,
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
        oddsResult: null,
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
    // 主客队名称与球队列表保持同一交互：点击或键盘确认后打开共享球队详情。
    openTeamDetail(row, side) {
      const prefix = side === "away" ? "away" : "home";
      const teamId = row ? row[prefix + "TeamId"] : null;
      if ([null, undefined, ""].includes(teamId)) {
        return;
      }
      this.teamDetailSnapshot = {
        teamId,
        teamName: row[prefix + "TeamName"],
        teamCode: row[prefix + "TeamCode"],
        teamCountry: row[prefix + "TeamCountry"],
      };
      this.teamDetailId = teamId;
      this.teamDetailVisible = true;
    },
    handleAdoptedCombinations(row) {
      if (!row.adoptedCombinationCount) {
        return;
      }
      this.adoptedCombinationMatch = { ...(row || {}) };
      this.adoptedCombinationVisible = true;
    },
    // 详情统计中的“已采用组合”数值与列表使用同一交互，点击直接打开共享侧边抽屉。
    handleMatchMetricClick(item) {
      if (item && item.action === "adopted") {
        this.handleAdoptedCombinations(this.matchDetailData);
      }
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
    // 倍率赛果以逗号串落库，详情页按字典逐项转成可读标签。
    formatOddsResultLabels(value) {
      const options = (this.dict && this.dict.type && this.dict.type.fx67ll_dortmund_odds_type) || [];
      return splitDortmundOddsResult(value)
        .map((token) => this.selectDictLabel(options, token) || token)
        .join('、');
    },
    // 主客队按球队“地区/联赛”解析七类联赛主题；无法确认的球队沿用原配色。
    teamLeagueClass(row, side) {
      const prefix = side === 'away' ? 'away' : 'home';
      const league = resolveDortmundLeagueTheme(row[`${prefix}TeamCountry`]);
      return league ? `league-${league}` : '';
    },
    // 历史导入数据可能以 "-" 表示未产生赛果，展示层与空值统一处理。
    hasMatchResult(value) {
      if (!this.hasDisplayValue(value)) {
        return false;
      }
      return String(value).trim() !== "-";
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
    /** JSON 导入完成后刷新当前筛选列表，保留分页与筛选条件。 */
    handleMatchImported() {
      this.getList();
    },
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

.match-team-name.is-clickable {
  position: relative;
  isolation: isolate;
  cursor: pointer;
  transition:
    color .2s ease,
    background-color .2s ease,
    border-color .2s ease,
    box-shadow .28s cubic-bezier(.22, .61, .36, 1),
    filter .2s ease,
    transform .12s ease;
}

/* 底部主题色短线在悬停时从中心展开，增强可点击反馈，同时不改动顶部边框。 */
.match-team-name.is-clickable::after {
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: calc(100% - 20px);
  height: 2px;
  content: "";
  pointer-events: none;
  background: currentColor;
  border-radius: 999px;
  opacity: 0;
  transform: translateX(-50%) scaleX(.2);
  transform-origin: center;
  transition: opacity .2s ease, transform .28s cubic-bezier(.22, .61, .36, 1);
}

.match-team-name.is-clickable:hover,
.match-team-name.is-clickable:focus-visible {
  z-index: 1;
  outline: none;
  /* 双层光晕与轻微增饱和强化反馈，不使用向上位移，避免表格顶部边框被裁切。 */
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, .92),
    0 0 0 4px rgba(39, 173, 96, .14),
    0 7px 18px rgba(39, 173, 96, .18);
  filter: saturate(1.14) brightness(1.03);
}

.match-team-name.is-clickable:hover::after,
.match-team-name.is-clickable:focus-visible::after {
  opacity: .72;
  transform: translateX(-50%) scaleX(1);
}

.match-team-name.is-clickable:active {
  box-shadow: 0 0 0 2px rgba(39, 173, 96, .2), 0 2px 6px rgba(39, 173, 96, .12);
  filter: saturate(1.08) brightness(.98);
  transform: scale(.97);
  transition-duration: .08s;
}

@media (prefers-reduced-motion: reduce) {
  .match-team-name.is-clickable {
    transition: none;
  }

  .match-team-name.is-clickable::after {
    transition: none;
  }

  .match-team-name.is-clickable:hover,
  .match-team-name.is-clickable:focus-visible,
  .match-team-name.is-clickable:active {
    box-shadow: none;
    filter: none;
    transform: none;
  }
}

.match-result-scope-select {
  width: 220px;
}

/* 七类联赛使用同一联赛内的柔和色系；主队偏实、客队偏轻，联赛外球队继续使用上面的原有配色。 */
.match-team-name.home.league-bundesliga {
  color: #2f7d5a;
  background: #e9f8ef;
  border: 1px solid #cfeedd;
}

.match-team-name.away.league-bundesliga {
  color: #5d8f78;
  background: #f5fbf7;
  border: 1px dashed #dbece3;
}

.match-team-name.home.league-premier-league {
  color: #346fa8;
  background: #eaf4ff;
  border: 1px solid #cfe4fa;
}

.match-team-name.away.league-premier-league {
  color: #6389b0;
  background: #f5f9ff;
  border: 1px dashed #dce8f6;
}

.match-team-name.home.league-la-liga {
  color: #a96535;
  background: #fff3e8;
  border: 1px solid #f4d9bf;
}

.match-team-name.away.league-la-liga {
  color: #b98862;
  background: #fff9f4;
  border: 1px dashed #f0e2d5;
}

.match-team-name.home.league-serie-a {
  color: #6e56a5;
  background: #f3efff;
  border: 1px solid #ded3fa;
}

.match-team-name.away.league-serie-a {
  color: #9180b8;
  background: #faf8ff;
  border: 1px dashed #e7e0f5;
}

.match-team-name.home.league-ligue-1 {
  color: #ad5876;
  background: #fff0f5;
  border: 1px solid #f4d3df;
}

.match-team-name.away.league-ligue-1 {
  color: #c5869b;
  background: #fff8fa;
  border: 1px dashed #f1e0e6;
}

.match-team-name.home.league-j1 {
  color: #2c8584;
  background: #e9f9f8;
  border: 1px solid #ccebea;
}

.match-team-name.away.league-j1 {
  color: #689f9e;
  background: #f4fcfc;
  border: 1px dashed #dcefee;
}

.match-team-name.home.league-j2 {
  color: #927534;
  background: #fbf7e8;
  border: 1px solid #ecdfb9;
}

.match-team-name.away.league-j2 {
  color: #ab9665;
  background: #fdfbf4;
  border: 1px dashed #eee5d2;
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

.match-detail-field-grid--quad {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.match-detail-schedule ::v-deep .metric-grid,
.match-detail-stats ::v-deep .metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 980px) {

  .match-detail-field-grid--quad,
  .match-detail-schedule ::v-deep .metric-grid,
  .match-detail-stats ::v-deep .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {

  .match-detail-field-grid--quad,
  .match-detail-schedule ::v-deep .metric-grid,
  .match-detail-stats ::v-deep .metric-grid {
    grid-template-columns: 1fr;
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
