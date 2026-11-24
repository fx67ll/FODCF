<template>
  <div class="app-container dl-page odds-page">
    <transition name="scene-switch" mode="out-in">
      <div key="list" v-if="pageScene === 'list'">
        <transition name="dl-filter">
          <el-form class="dl-filter odds-filter" :model="queryParams" ref="queryForm" size="small" :inline="true"
            v-show="showSearch" label-width="68px">
            <el-form-item label="倍率编码" prop="oddsCode" v-if="isMoreQuery">
              <el-input v-model="queryParams.oddsCode" placeholder="请输入倍率编码" clearable @input="handleFilterInput"
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="所属比赛" prop="matchCode">
              <el-input :value="formatSelectedMatch(selectedMatch)" readonly placeholder="请选择所属比赛"
                @click.native="matchSelectorVisible = true" />
            </el-form-item>
            <el-form-item label="来源时间" prop="sourceTime" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeSourceTime" style="width: 360px" type="datetimerange"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" range-separator="-"
                start-placeholder="开始时间" end-placeholder="结束时间" clearable @change="handleFilterChange" />
            </el-form-item>
            <el-form-item label="有效状态" prop="activeFlag" v-if="isMoreQuery">
              <el-select v-model="queryParams.activeFlag" placeholder="请选择有效状态" clearable
                popper-class="dortmund-theme-popper" @change="handleFilterChange" @keyup.enter.native="handleQuery">
                <el-option v-for="item in dict.type.sys_yes_no || []" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeCreateTime" style="width: 360px" type="datetimerange"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" range-separator="-"
                start-placeholder="开始时间" end-placeholder="结束时间" clearable @change="handleFilterChange" />
            </el-form-item>
            <el-form-item label="更新时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeUpdateTime" style="width: 360px" type="datetimerange"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" range-separator="-"
                start-placeholder="开始时间" end-placeholder="结束时间" clearable @change="handleFilterChange" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              <el-button type="success" class="dl-more-btn" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'"
                size="mini" @click="isMoreQuery = !isMoreQuery">
                {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
              </el-button>
            </el-form-item>
          </el-form>
        </transition>

        <div class="dl-toolbar">
          <div class="dl-toolbar-actions">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
              v-hasPermi="['dortmund:odds:add']">补充录入</el-button>
            <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:odds:export']">导出</el-button> -->
          </div>
          <div class="dl-toolbar-side">
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </div>
        </div>

        <div class="dl-list-card odds-list-card">
          <el-table v-loading="loading" :data="oddsList" row-key="oddsId">
            <el-table-column label="比赛摘要" align="center" prop="matchSummary" min-width="440" fixed="left">
              <template slot-scope="scope">
                <button v-if="hasMatchId(scope.row)" type="button" class="odds-match-summary-link"
                  :title="`查看 ${displayValue(scope.row.matchSummary, '比赛')} 的详情`"
                  @click.stop="handleMatchDetail(scope.row)">
                  <i class="el-icon-football"></i>
                  <span>{{ displayValue(scope.row.matchSummary, '-') }}</span>
                  <i class="el-icon-arrow-right odds-match-summary-arrow"></i>
                </button>
                <span v-else>{{ displayValue(scope.row.matchSummary, '-') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="让分值" align="center" prop="handicapValue" width="80">
              <template slot-scope="scope">
                <span class="odds-handicap-value" :class="handicapToneClass(scope.row.handicapValue)">
                  {{ displayValue(scope.row.handicapValue, '-') }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="倍率编码" align="center" prop="oddsCode" min-width="190" show-overflow-tooltip />
            <el-table-column label="有效状态" align="center" prop="activeFlag" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_yes_no || []" :value="scope.row.activeFlag" />
              </template>
            </el-table-column>
            <el-table-column label="来源时间" align="center" prop="sourceTime" width="150" fixed="right"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.sourceTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="记录创建者" align="center" prop="createBy" min-width="100" show-overflow-tooltip>
              <template slot-scope="scope">{{ formatAuditActor(scope.row.createBy) }}</template>
            </el-table-column>
            <el-table-column label="记录创建时间" align="center" prop="createTime" width="150"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="记录更新者" align="center" prop="updateBy" min-width="100" show-overflow-tooltip>
              <template slot-scope="scope">{{ formatAuditActor(scope.row.updateBy) }}</template>
            </el-table-column>
            <el-table-column label="记录更新时间" align="center" prop="updateTime" width="150"
              class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="186" fixed="right">
              <template slot-scope="scope">
                <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
                  @click="handleDetail(scope.row)" v-hasPermi="['dortmund:odds:query']" />
                <dortmund-action-button label="修改" icon="el-icon-edit" action="edit" @click="handleUpdate(scope.row)"
                  v-hasPermi="['dortmund:odds:edit']" />
                <dortmund-action-button label="基于当前版本新建" icon="el-icon-document-copy" action="copy"
                  :loading="copyingId === scope.row.oddsId" @click="handleCopy(scope.row)"
                  v-hasPermi="['dortmund:odds:add']" />
                <dortmund-action-button label="设为有效" icon="el-icon-open" action="enable"
                  :disabled="scope.row.activeFlag === 'Y'" @click="handleActivate(scope.row)"
                  v-hasPermi="['dortmund:odds:activate']" />
                <dortmund-action-button label="删除" icon="el-icon-delete" action="delete"
                  :disabled="scope.row.activeFlag === 'Y'" @click="handleDelete(scope.row)"
                  v-hasPermi="['dortmund:odds:remove']" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <pagination v-show="total > 0" :total="total" popper-class="dortmund-theme-popper"
          :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" :page-sizes="pageSizes"
          @pagination="getList" />
      </div>

      <odds-edit-scene key="edit" v-else-if="pageScene === 'edit'" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave" />
    </transition>

    <dortmund-detail-drawer :visible.sync="detailVisible" title="倍率详情"
      :subtitle="detail.matchSummary || '查看版本信息与六类倍率权重'" icon="el-icon-data-line" tone="amber" size="640px"
      :loading="detailLoading" feature="odds">
      <dortmund-detail-card title='版本画像' icon='el-icon-document' tone='amber'>
        <dortmund-detail-block v-if='hasOddsOverview' variant='metric' tone='amber' :items='oddsOverviewMetrics' />
        <div v-else class='odds-detail-empty'>
          <i class='el-icon-data-line'></i>
          <span>暂无可展示的版本信息</span>
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title='比赛与来源' icon='el-icon-link' tone='green'>
        <div class='odds-detail-field-grid'>
          <div v-for='item in oddsSourceFields' :key='item.label' class='odds-detail-field'>
            <span>{{ item.label }}</span>
            <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
          </div>
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title="倍率权重矩阵" icon="el-icon-set-up" tone="green">
        <div class='odds-matrix-wrap'>
          <el-table class='odds-matrix-table' :data="detailMatrix" fit style="width: 100%" empty-text="暂无倍率数据">
            <el-table-column label="选择类型" align="center" prop="typeName" min-width="105" show-overflow-tooltip />
            <el-table-column label="倍率" align="center" min-width="92">
              <template slot-scope="scope">
                <span class='odds-value'>{{ formatOddsValue(scope.row.odds) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="手工权重" align="center" min-width="108">
              <template slot-scope="scope">
                <span class='odds-weight-text'>{{ formatWeight(scope.row.manualWeight, "默认 1.0000") }}</span>
              </template>
            </el-table-column>
            <el-table-column label="有效权重" align="center" min-width="128">
              <template slot-scope="scope">
                <div class="odds-weight-cell">
                  <span class='odds-weight-text'>{{ formatWeight(scope.row.appliedWeight) }}</span>
                  <span class="odds-weight-track">
                    <i :style="{ width: detailWeightPercent(scope.row.manualWeight) }"></i>
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title='备注与状态' icon='el-icon-document' tone='green'>
        <template slot='extra'>
          <span class='odds-status-indicator' :data-state='oddsStatusState' :title='oddsActiveDescription'>
            <i class='odds-status-dot'></i>{{ oddsStatusLabel }}
          </span>
        </template>
        <div class='dortmund-detail-text-block'>{{ displayValue(detail.oddsRemark, '暂无备注') }}</div>
      </dortmund-detail-card>

      <dortmund-detail-card title='记录轨迹' subtitle='归属、创建与最近更新' icon='el-icon-time' tone='green'>
        <dortmund-record-trail :items='oddsRecordTrail' empty-text='暂无倍率记录轨迹' />
      </dortmund-detail-card>
      <template slot="footer">
        <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="detailVisible = false">关闭</el-button>
      </template>
    </dortmund-detail-drawer>

    <dortmund-match-detail-drawer :visible.sync="matchDetailVisible" :match-id="matchDetailId"
      :snapshot="matchDetailSnapshot" />

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" :selected-items="[selectedMatch]"
      @confirm="handleMatchSelectorConfirm" />

  </div>
</template>

<script>
import { addOdds, activateOdds, delOdds, getOdds, listOdds, updateOdds } from "@/api/fx67ll/dortmund/odds";
import OddsEditScene from "./components/OddsEditScene/index";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";
import DortmundMatchDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundMatchDetailDrawer/index";
import { getMatch } from "@/api/fx67ll/dortmund/match";
import { formatOddsWeight, ODDS_MATRIX_ROWS } from "@/views/fx67ll/dortmund/other/utils/odds";
import { generateBusinessCode } from "@/views/fx67ll/dortmund/other/utils/codeGenerator";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";
import filterAutoQuery from "@/views/fx67ll/dortmund/other/utils/filterAutoQuery";
export default {
  name: "DortmundOdds",
  dicts: ["sys_yes_no", "fx67ll_dortmund_odds_type"],
  components: { OddsEditScene, DortmundMatchSelectorModal, DortmundDetailDrawer, DortmundDetailCard, DortmundActionButton, DortmundDetailBlock, DortmundRecordTrail, DortmundMatchDetailDrawer },
  mixins: [filterAutoQuery],
  computed: {
    oddsOverviewMetrics() {
      return [
        { label: '倍率编码', value: this.displayValue(this.detail.oddsCode), icon: 'el-icon-collection-tag' },
        { label: '比赛编码', value: this.displayValue(this.detail.matchCode), icon: 'el-icon-football' },
        { label: '来源时间', value: this.parseTime(this.detail.sourceTime, '{y}-{m}-{d} {h}:{i}:{s}'), icon: 'el-icon-time' },
        { label: '让分值', value: this.detail.handicapValue == null ? null : this.detail.handicapValue, icon: 'el-icon-sort' },
        { label: '有效状态', value: this.displayDict(this.dict.type.sys_yes_no, this.detail.activeFlag, '未设置'), icon: 'el-icon-connection' },
      ];
    },
    // 版本画像仅在任一基础字段有值时展示，避免接口返回空对象时留下空白模块
    hasOddsOverview() {
      return [
        this.detail.oddsCode,
        this.detail.matchCode,
        this.detail.sourceTime,
        this.detail.handicapValue,
        this.detail.activeFlag,
      ].some((value) => this.hasDisplayValue(value));
    },
    oddsSourceFields() {
      return [
        { label: '比赛编码', value: this.detail.matchCode },
        { label: '比赛摘要', value: this.detail.matchSummary },
        { label: '来源时间', value: this.parseTime(this.detail.sourceTime, '{y}-{m}-{d} {h}:{i}:{s}') },
        { label: '让分值', value: this.detail.handicapValue == null ? null : this.detail.handicapValue },
      ];
    },
    oddsRecordTrail() {
      const createTime = this.parseTime(this.detail.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const updateTime = this.parseTime(this.detail.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return [
        { key: 'create', label: '创建记录', value: this.formatAuditActor(this.detail.createBy), hint: createTime ? `创建时间 · ${createTime}` : '', icon: 'el-icon-edit-outline', state: 'success' },
        { key: 'update', label: '最近更新', value: this.formatAuditActor(this.detail.updateBy), hint: updateTime ? `更新时间 · ${updateTime}` : '', icon: 'el-icon-refresh', state: 'warning' },
      ];
    },
    oddsActiveDescription() {
      const activeFlag = this.detail.activeFlag;
      if (activeFlag === null || activeFlag === undefined || activeFlag === '') {
        return '有效状态未设置';
      }
      return activeFlag === 'Y'
        ? '当前有效版本，删除前需先切换至其他版本'
        : '非当前有效版本';
    },
    // 状态标识放在卡片标题右侧，颜色和脉冲只表达当前有效版本
    oddsStatusState() {
      if (this.detail.activeFlag === 'Y') {
        return 'active';
      }
      if (this.detail.activeFlag === 'N') {
        return 'inactive';
      }
      return 'unset';
    },
    oddsStatusLabel() {
      if (this.detail.activeFlag === 'Y') {
        return '当前有效';
      }
      if (this.detail.activeFlag === 'N') {
        return '历史版本';
      }
      return '状态未设置';
    },
    detailMatrix() {
      return ODDS_MATRIX_ROWS.map((item) => {
        const manualWeight = this.detail[item.weightField];
        return {
          type: item.type,
          typeName: this.selectDictLabel(this.dict.type.fx67ll_dortmund_odds_type || [], item.type)
            || item.oddsLabel || item.type,
          odds: this.detail[item.oddsField],
          manualWeight,
          // 此处 appliedWeight 仅为倍率详情页的有效手工权重展示值（空值默认1.0000），
          // 不是回报组合明细表的 AI applied_weight 字段，也不参与任何金额计算。
          appliedWeight: formatOddsWeight(manualWeight),
        };
      });
    },
  },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      oddsList: [],
      daterangeSourceTime: [],
      daterangeCreateTime: [],
      daterangeUpdateTime: [],
      isMoreQuery: false,
      selectedMatch: null,
      matchSelectorVisible: false,
      queryParams: {
        pageNum: 1,
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
        oddsCode: null,
        matchCode: null,
        activeFlag: null,
        beginSourceTime: null,
        endSourceTime: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      detailVisible: false,
      detailLoading: false,
      detail: {},
      matchDetailVisible: false,
      matchDetailId: null,
      matchDetailSnapshot: null,
      pageScene: "list",
      editLoading: false,
      editMode: "add",
      editForm: {},
      submitting: false,
      copyingId: null,
    };
  },
  created() {
    const routeMatchId = this.$route.query.matchId || null;
    if (routeMatchId) {
      getMatch(routeMatchId).then((response) => {
        const match = response.data || null;
        if (match && match.matchCode) {
          this.selectedMatch = match;
          this.queryParams.matchCode = match.matchCode;
        }
        this.getList();
      }).catch(() => {
        this.getList();
      });
    } else {
      this.getList();
    }
  },
  methods: {
    // 空用户名来自第三方导入或历史数据，统一标注来源，避免列表审计列为空。
    formatAuditActor(value) {
      return formatAuditActor(value);
    },
    formatWeight(value, emptyText) {
      return formatOddsWeight(value, emptyText);
    },
    // 倍率值保留原始 0，仅真正缺失时显示占位符
    formatOddsValue(value) {
      return this.displayValue(value, '-');
    },
    // 空值处理：仅 null、undefined 和空白字符串视为缺失，保留数字 0
    displayValue(value, fallback = '-') {
      if (value === null || value === undefined) {
        return fallback;
      }
      const normalized = String(value).trim();
      return normalized === '' ? fallback : normalized;
    },
    // 字典值转标签；字典尚未加载时回退到原始值，避免误显示为未设置
    displayDict(options, value, fallback = '-') {
      if (value === null || value === undefined || value === '') {
        return fallback;
      }
      return this.selectDictLabel(options || [], value) || String(value);
    },
    // 保留数字 0，仅把 null、undefined 和空白字符串视为缺失
    hasDisplayValue(value) {
      if (value === null || value === undefined) {
        return false;
      }
      return String(value).trim() !== '';
    },
    getList() {
      this.loading = true;
      this.queryParams.beginSourceTime = null;
      this.queryParams.endSourceTime = null;
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
      if (this.daterangeSourceTime && this.daterangeSourceTime.length === 2) {
        this.queryParams.beginSourceTime = this.daterangeSourceTime[0];
        this.queryParams.endSourceTime = this.daterangeSourceTime[1];
      }
      if (this.daterangeCreateTime && this.daterangeCreateTime.length === 2) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (this.daterangeUpdateTime && this.daterangeUpdateTime.length === 2) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listOdds(this.queryParams).then((response) => {
        this.oddsList = this.formatObjectArrayNullProperty(response.rows || []);
        this.total = response.total || 0;
      }).catch(() => {
        this.oddsList = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.daterangeSourceTime = [];
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.selectedMatch = null;
      this.handleQuery();
    },
    formatSelectedMatch(match) {
      return match ? (match.matchSummary || match.matchCode) : "";
    },
    handleMatchSelectorConfirm(match) {
      this.selectedMatch = match || null;
      this.queryParams.matchCode = match ? match.matchCode : null;
      this.handleQuery();
    },
    handleAdd() {
      this.editMode = "add";
      this.editForm = this.buildEmptyForm();
      this.pageScene = "edit";
    },
    handleUpdate(row) {
      this.editLoading = true;
      this.editForm = {};
      getOdds(row.oddsId).then((response) => {
        const detail = { ...(row || {}), ...((response && response.data) || {}) };
        // 有效版本由后端冻结，进入编辑前拦截，避免用户填完表单后才收到保存失败提示
        if (detail.activeFlag === "Y") {
          if (!this.$auth.hasPermi("dortmund:odds:add")) {
            this.$modal.msgWarning("当前有效倍率记录已冻结。您没有新增倍率版本的权限，请联系管理员。");
            return;
          }
          return this.$modal.confirm("当前有效倍率记录已冻结，不能直接修改。是否基于当前版本新建一条有效倍率记录？原版本将保留为历史版本。").then(() => {
            this.openCopyScene(detail);
          }).catch(() => {
            // 用户取消时停留在列表，不产生任何数据变更
          });
        }
        this.editMode = "update";
        this.editForm = detail;
        this.pageScene = "edit";
      }).catch(() => {
        this.pageScene = "list";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    handleCopy(row) {
      this.copyingId = row.oddsId;
      getOdds(row.oddsId).then((response) => {
        this.openCopyScene({ ...(row || {}), ...((response && response.data) || {}) });
      }).catch(() => {
        // 接口错误由请求拦截器统一提示，列表状态保持不变
      }).finally(() => {
        this.copyingId = null;
      });
    },
    // 复制业务字段并生成新编码；主键置空后按新增接口提交，原版本和引用关系均不受影响
    openCopyScene(source) {
      const detail = source || {};
      this.editMode = "copy";
      this.editForm = {
        ...detail,
        oddsId: null,
        activeFlag: "Y",
        oddsCode: generateBusinessCode("odds", detail.sourceTime),
        newMatch: this.buildEmptyForm().newMatch,
      };
      this.pageScene = "edit";
    },
    handleDetail(row) {
      const snapshot = { ...(row || {}) };
      this.detail = snapshot;
      this.detailLoading = true;
      this.detailVisible = true;
      getOdds(row.oddsId).then((response) => {
        this.detail = { ...snapshot, ...((response && response.data) || {}) };
      }).catch(() => {
        // 接口异常时保留列表快照，避免详情抽屉空白
      }).finally(() => {
        this.detailLoading = false;
      });
    },
    hasMatchId(row) {
      return Boolean(row && row.matchId !== null && row.matchId !== undefined && row.matchId !== '');
    },
    // 复用比赛记录页的详情抽屉，直接查看当前倍率对应比赛，不跳转页面。
    handleMatchDetail(row) {
      if (!this.hasMatchId(row)) {
        return;
      }
      this.matchDetailSnapshot = { ...(row || {}) };
      this.matchDetailId = row.matchId;
      this.matchDetailVisible = true;
    },
    // 让分值保留数值语义：正值为绿、负值为红，零和空值保持中性。
    handicapToneClass(value) {
      if (value === null || value === undefined || String(value).trim() === '') {
        return 'is-empty';
      }
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue === 0) {
        return 'is-neutral';
      }
      return numericValue > 0 ? 'is-positive' : 'is-negative';
    },
    detailWeightPercent(value) {
      const weight = Number(value);
      const normalized = Number.isFinite(weight) ? weight : 1;
      return `${Math.max(0, Math.min(100, normalized * 100))}%`;
    },
    handleSceneSave(data) {
      const isCopy = this.editMode === "copy";
      const isCreate = this.editMode === "add" || isCopy;
      const payload = isCopy ? { ...data, activeFlag: "Y" } : data;
      this.submitting = true;
      const request = isCreate ? addOdds(payload) : updateOdds(payload);
      request.then(() => {
        this.$modal.msgSuccess(isCopy ? "新版本创建成功" : isCreate ? "新增成功" : "修改成功");
        this.pageScene = "list";
        this.getList();
      }).catch(() => {
      }).finally(() => {
        this.submitting = false;
      });
    },
    handleActivate(row) {
      this.$modal.confirm(`确认将倍率记录「${row.oddsCode || row.oddsId}」设为当前有效版本？同场比赛的其他版本会自动失效。`).then(() => {
        return activateOdds(row.oddsId);
      }).then(() => {
        this.$modal.msgSuccess("设置成功");
        this.getList();
      }).catch(() => {
      });
    },
    handleDelete(row) {
      this.$modal.confirm(`是否确认删除倍率记录「${row.oddsCode || row.oddsId}」？`).then(() => {
        return delOdds(row.oddsId);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {
      });
    },
    handleExport() {
      this.download("/dortmund/odds/export", { ...this.queryParams },
        `odds_${new Date().getTime()}.xlsx`);
    },
    handleSceneBack() {
      this.pageScene = "list";
      this.getList();
    },
    buildEmptyForm() {
      return {
        oddsId: null,
        oddsCode: null,
        matchId: null,
        sourceTime: null,
        handicapValue: null,
        homeWinOdds: null,
        drawOdds: null,
        awayWinOdds: null,
        handicapHomeWinOdds: null,
        handicapDrawOdds: null,
        handicapAwayWinOdds: null,
        homeWinWeight: null,
        drawWeight: null,
        awayWinWeight: null,
        handicapHomeWinWeight: null,
        handicapDrawWeight: null,
        handicapAwayWinWeight: null,
        oddsRemark: null,
        newMatch: {
          seasonId: null,
          homeTeamId: null,
          awayTeamId: null,
          matchTime: null,
          matchRemark: null,
        },
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.odds-match-summary-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 3px 9px;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: #27ad60;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  outline: none;
  transition: color .18s ease, background-color .18s ease, border-color .18s ease, transform .18s ease;

  >span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  >i:first-child {
    flex: 0 0 auto;
    font-size: 13px;
  }

  .odds-match-summary-arrow {
    flex: 0 0 auto;
    font-size: 12px;
    opacity: .45;
    transition: opacity .18s ease, transform .18s ease;
  }

  &:hover,
  &:focus-visible {
    color: #1f8d50;
    background: #effaf3;
    border-color: #d7eddf;

    .odds-match-summary-arrow {
      opacity: 1;
      transform: translateX(2px);
    }
  }

  &:active {
    transform: scale(.985);
  }
}

.odds-handicap-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  border: 1px solid transparent;
  border-radius: 999px;

  &.is-positive {
    color: #238a53;
    background: #eaf8f0;
    border-color: #d6eddf;
  }

  &.is-negative {
    color: #d84a4a;
    background: #fef1f1;
    border-color: #f5d3d3;
  }

  &.is-neutral,
  &.is-empty {
    color: #7d8b84;
    background: #f5f7f6;
    border-color: #e7ece9;
  }
}

.odds-filter ::v-deep .el-select,
.odds-filter ::v-deep .el-date-editor {
  width: 220px;
}

.scene-switch-enter-active,
.scene-switch-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.scene-switch-enter,
.scene-switch-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.odds-detail-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  padding: 2px 0;
}

.odds-detail-field {
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

.odds-matrix-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
}

.odds-matrix-table {
  width: 100% !important;

  ::v-deep .el-table__header,
  ::v-deep .el-table__body {
    width: 100% !important;
  }

  ::v-deep th,
  ::v-deep td {
    padding-right: 6px;
    padding-left: 6px;
  }
}

.odds-value,
.odds-weight-text {
  font-variant-numeric: tabular-nums;
}

.odds-value {
  font-weight: 700;
  color: #26362e;
}

.odds-weight-text {
  font-size: 12px;
  font-weight: 600;
  color: #52635a;
}

.odds-detail-empty {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 13px 14px;
  font-size: 12px;
  color: #8a9790;
  background: #f7faf8;
  border-left: 2px solid #dbe9e0;

  i {
    font-size: 14px;
  }
}

.odds-status-indicator {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 3px 10px 3px 8px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  color: #7c8b84;
  background: #f4f8f6;
  border: 1px solid #e6eee9;
  border-radius: 999px;
}

.odds-status-dot {
  position: relative;
  display: block;
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
}

.odds-status-indicator[data-state='active'] {
  color: #25885b;
  background: #edf8f2;
  border-color: #d5ecdf;
}

.odds-status-indicator[data-state='active'] .odds-status-dot::after {
  position: absolute;
  inset: 0;
  content: '';
  background: currentColor;
  border-radius: 50%;
  transform-origin: center;
  animation: oddsStatusPulse 1.8s ease-out infinite;
}

.odds-status-indicator[data-state='inactive'] {
  color: #7c8b84;
}

.odds-status-indicator[data-state='unset'] {
  color: #98a29d;
}

@keyframes oddsStatusPulse {
  0% {
    opacity: .42;
    transform: scale(1);
  }

  70%,
  100% {
    opacity: 0;
    transform: scale(2.45);
  }
}

.odds-weight-cell {
  display: grid;
  gap: 5px;
  justify-items: center;
  min-width: 0;
}

.odds-weight-track {
  display: block;
  width: 78px;
  max-width: 100%;
  height: 5px;
  overflow: hidden;
  background: #edf2ef;
  border-radius: 999px;

  i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #3f8f77 0%, #62b393 100%);
    border-radius: inherit;
    transition: width .35s cubic-bezier(.25, .8, .3, 1);
  }
}

@media (prefers-reduced-motion: reduce) {

  .odds-match-summary-link,
  .odds-match-summary-link .odds-match-summary-arrow {
    transition: none;
  }

  .odds-weight-track i {
    transition: none;
  }

  .odds-status-indicator[data-state='active'] .odds-status-dot::after {
    animation: none;
  }
}

@media (max-width: 520px) {
  .odds-detail-field-grid {
    grid-template-columns: 1fr;
    gap: 13px;
  }

  .odds-matrix-table ::v-deep th,
  .odds-matrix-table ::v-deep td {
    padding-right: 4px;
    padding-left: 4px;
  }
}
</style>
