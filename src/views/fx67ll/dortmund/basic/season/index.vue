<template>
  <div class="app-container dl-page">
    <transition name="dl-filter">
      <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
        label-width="68px">
        <el-form-item label="赛季编码" prop="seasonCode" v-if="isMoreQuery">
          <el-input v-model="queryParams.seasonCode" placeholder="请输入赛季编码" clearable @input="handleFilterInput"
            @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="赛季名称" prop="seasonName">
          <el-input v-model="queryParams.seasonName" placeholder="请输入赛季名称" clearable @input="handleFilterInput"
            @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="开始日期" prop="seasonStartDate" v-if="isMoreQuery">
          <el-date-picker clearable v-model="queryParams.seasonStartDate" type="date" value-format="yyyy-MM-dd"
            popper-class="dortmund-theme-popper" placeholder="请选择赛季开始日期" @change="handleFilterChange">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="结束日期" prop="seasonEndDate" v-if="isMoreQuery">
          <el-date-picker clearable v-model="queryParams.seasonEndDate" type="date" value-format="yyyy-MM-dd"
            popper-class="dortmund-theme-popper" placeholder="请选择赛季结束日期" @change="handleFilterChange">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="赛季状态" prop="seasonStatus" v-if="isMoreQuery">
          <el-select v-model="queryParams.seasonStatus" style="width: 100%" placeholder="请选择赛季状态" clearable
            popper-class="dortmund-theme-popper" @change="handleFilterChange" @keyup.enter.native="handleQuery">
            <el-option v-for="dict in dict.type.fx67ll_dortmund_status" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" v-if="isMoreQuery">
          <el-date-picker v-model="daterangeCreateTime" style="width: 360px" value-format="yyyy-MM-dd HH:mm:ss"
            type="datetimerange" popper-class="dortmund-theme-popper" range-separator="-" start-placeholder="开始时间"
            end-placeholder="结束时间" clearable @change="handleFilterChange"></el-date-picker>
        </el-form-item>
        <el-form-item label="更新时间" v-if="isMoreQuery">
          <el-date-picker v-model="daterangeUpdateTime" style="width: 360px" value-format="yyyy-MM-dd HH:mm:ss"
            type="datetimerange" popper-class="dortmund-theme-popper" range-separator="-" start-placeholder="开始时间"
            end-placeholder="结束时间" clearable @change="handleFilterChange"></el-date-picker>
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
          v-hasPermi="['dortmund:season:add']">新增</el-button>
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['dortmund:season:edit']">修改</el-button>
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['dortmund:season:remove']">删除</el-button>
        <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:season:export']">导出</el-button> -->
        <transition name="dl-chip">
          <span class="dl-selected-chip" v-if="ids.length > 0"><i class="el-icon-circle-check"></i>已选 {{ ids.length }}
            项</span>
        </transition>
      </div>
      <div class="dl-toolbar-side">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </div>

    <div class="dl-list-card">
      <el-table v-loading="loading" :data="seasonList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="46" align="center" />
        <el-table-column label="赛季名称" align="center" prop="seasonName" min-width="80" fixed="left"
          show-overflow-tooltip />
        <el-table-column label="赛季开始日期" align="center" prop="seasonStartDate" width="118" fixed="left"
          class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.seasonStartDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="赛季结束日期" align="center" prop="seasonEndDate" width="118" fixed="left"
          class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.seasonEndDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="赛季编码" align="center" prop="seasonCode" min-width="190" show-overflow-tooltip />
        <el-table-column label="赛季状态" align="center" prop="seasonStatus" width="100">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.fx67ll_dortmund_status" :value="scope.row.seasonStatus" />
          </template>
        </el-table-column>
        <el-table-column label="赛季排序" align="center" prop="seasonSort" width="96" sortable="seasonSort"
          :sort-orders="['descending', 'ascending']" />
        <el-table-column label="赛季备注" align="center" prop="seasonRemark" min-width="200"
          :show-overflow-tooltip="true" />
        <el-table-column label="记录创建者" align="center" prop="createBy" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ formatAuditActor(scope.row.createBy) }}</template>
        </el-table-column>
        <el-table-column label="记录创建时间" align="center" prop="createTime" width="150" class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="记录更新者" align="center" prop="updateBy" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ formatAuditActor(scope.row.updateBy) }}</template>
        </el-table-column>
        <el-table-column label="记录更新时间" align="center" prop="updateTime" width="150" class-name="dortmund-nowrap-cell">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width dortmund-action-column"
          fixed="right" width="122">
          <template slot-scope="scope">
            <dortmund-action-button label="详情" icon="el-icon-document" action="detail" @click="handleDetail(scope.row)"
              v-hasPermi="['dortmund:season:query']" />
            <dortmund-action-button label="修改" icon="el-icon-edit" action="edit" @click="handleUpdate(scope.row)"
              v-hasPermi="['dortmund:season:edit']" />
            <dortmund-action-button label="删除" icon="el-icon-delete" action="delete" @click="handleDelete(scope.row)"
              v-hasPermi="['dortmund:season:remove']" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      :page-sizes="pageSizes" @pagination="getList" />

    <dortmund-detail-drawer :visible.sync="detailVisible" title="赛季详情"
      :subtitle="detailData.seasonCode ? `赛季编码 · ${detailData.seasonCode}` : '查看赛季完整资料与审计信息'" icon="el-icon-trophy"
      tone="green" size="640px" feature="season" :loading="detailLoading">
      <section class='season-detail-banner'>
        <div class='season-detail-banner-main'>
          <span class='season-detail-kicker'>SEASON DOSSIER</span>
          <div class='season-detail-title-row'>
            <h3>{{ detailData.seasonName || '-' }}</h3>
            <dict-tag
              v-if='detailData.seasonStatus !== null && detailData.seasonStatus !== undefined && detailData.seasonStatus !== ""'
              :options='dict.type.fx67ll_dortmund_status' :value='detailData.seasonStatus' />
            <span v-else class='season-detail-status-empty'>状态未设置</span>
          </div>
          <span class='season-detail-code'>
            <i class='el-icon-collection-tag'></i>{{ detailData.seasonCode || '-' }}
          </span>
        </div>
        <div class='season-detail-period'>
          <div class='season-detail-date'>
            <span>开幕</span>
            <strong>{{ detailData.seasonStartDate || '-' }}</strong>
          </div>
          <div class='season-detail-range'><i></i><em></em><i></i></div>
          <div class='season-detail-date is-end'>
            <span>收官</span>
            <strong>{{ detailData.seasonEndDate || '-' }}</strong>
          </div>
        </div>
      </section>

      <div class='season-detail-stat-grid'>
        <article v-for='item in seasonMetrics' :key='item.label' class='season-detail-stat'>
          <span class='season-detail-stat-icon'><i :class='item.icon'></i></span>
          <span class='season-detail-stat-label'>{{ item.label }}</span>
          <strong class='season-detail-stat-value'>{{ item.value === null || item.value === undefined || item.value ===
            '' ?
            '-' : item.value }}</strong>
        </article>
      </div>

      <dortmund-detail-card title="赛季备注" icon="el-icon-document" tone="green">
        <div class="dortmund-detail-text-block">{{ detailData.seasonRemark || '暂无备注' }}</div>
      </dortmund-detail-card>

      <dortmund-detail-card title="记录轨迹" subtitle="创建与最近更新审计" icon="el-icon-time" tone="green">
        <dortmund-record-trail :items="seasonRecordTrail" empty-text="暂无赛季记录轨迹" />
      </dortmund-detail-card>
      <template slot="footer">
        <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="detailVisible = false">关闭</el-button>
      </template>
    </dortmund-detail-drawer>

    <!-- 添加或修改赛季管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="640px"
      :style="`top: ${getDialogVerticalOffset(520)}`" append-to-body custom-class="season-edit-dialog">
      <template slot="title">
        <div class="dialog-header">
          <div class="dialog-header-icon">
            <i class="el-icon-trophy"></i>
          </div>
          <div class="dialog-header-text">
            <div class="dialog-header-title">{{ title }}</div>
            <div class="dialog-header-sub">赛季是全部业务的数据底座，编码创建后不可修改</div>
          </div>
        </div>
      </template>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item prop="seasonCode">
              <template slot="label">
                <dortmund-form-label label="赛季编码" tip="必填；1-23个字符，全局唯一；可自动生成 SEA-YYYYMMDD-XXXXXX；创建后不可修改" />
              </template>
              <!-- 编码创建后不可修改，需要更换编码时新建资源、迁移引用并停用旧资源 -->
              <dortmund-code-input v-model="form.seasonCode" code-kind="season" :date-value="form.seasonStartDate"
                :maxlength="limits.seasonCode" placeholder="请输入或自动生成赛季编码" :disabled="form.seasonId != null" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="seasonName">
              <template slot="label">
                <dortmund-form-label label="赛季名称" tip="必填；1-233个字符，例如：2025-2026赛季德甲联赛" />
              </template>
              <el-input v-model="form.seasonName" :maxlength="limits.seasonName" show-word-limit
                placeholder="请输入赛季名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="seasonStartDate">
              <template slot="label">
                <dortmund-form-label label="开始日期" tip="必填；格式yyyy-MM-dd，且不得晚于结束日期" />
              </template>
              <el-date-picker clearable v-model="form.seasonStartDate" type="date" value-format="yyyy-MM-dd"
                popper-class="dortmund-theme-popper" style="width: 100%" placeholder="请选择赛季开始日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="seasonEndDate">
              <template slot="label">
                <dortmund-form-label label="结束日期" tip="必填；格式yyyy-MM-dd，且不得早于开始日期" />
              </template>
              <el-date-picker clearable v-model="form.seasonEndDate" type="date" value-format="yyyy-MM-dd"
                popper-class="dortmund-theme-popper" style="width: 100%" placeholder="请选择赛季结束日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="seasonStatus">
              <template slot="label">
                <dortmund-form-label label="赛季状态" tip="必填；0=进行中，1=已结束，2=未开始" />
              </template>
              <el-select v-model="form.seasonStatus" style="width: 100%" placeholder="请选择赛季状态"
                popper-class="dortmund-theme-popper">
                <el-option v-for="dict in dict.type.fx67ll_dortmund_status" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="seasonSort">
              <template slot="label">
                <dortmund-form-label label="赛季排序" :tip="seasonSortTip" />
              </template>
              <el-input-number v-model="form.seasonSort" :min="seasonSortRange.min" :max="seasonSortRange.max" :step="1"
                style="width: 100%" placeholder="请输入赛季排序" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="seasonRemark">
              <template slot="label">
                <dortmund-form-label label="赛季备注" tip="选填；最多1023个字符，可说明赛事级别、规则等" />
              </template>
              <el-input v-model="form.seasonRemark" type="textarea" :rows="3" :maxlength="limits.seasonRemark"
                show-word-limit placeholder="请输入赛季备注内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="submitForm">确
          定</el-button>
        <el-button class="dortmund-theme-cancel" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSeason, getSeason, delSeason, addSeason, updateSeason } from "@/api/fx67ll/dortmund/season";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundCodeInput from "@/views/fx67ll/dortmund/other/component/DortmundCodeInput/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";
import {
  DORTMUND_LIMITS,
  DORTMUND_SEASON_STATUS_OPTIONS,
  dateRangeRule,
  enumRule,
  integerRangeRule,
  optionalTextRule,
  requiredTextRule,
  trimTextFields,
} from "@/views/fx67ll/dortmund/other/utils/validation";
import {
  DORTMUND_PAGINATION,
  DORTMUND_SEASON_SORT_RANGE,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";
import filterAutoQuery from "@/views/fx67ll/dortmund/other/utils/filterAutoQuery";
export default {
  name: "Season",
  dicts: ["fx67ll_dortmund_status"],
  components: { DortmundFormLabel, DortmundCodeInput, DortmundDetailDrawer, DortmundDetailCard, DortmundActionButton, DortmundRecordTrail },
  mixins: [filterAutoQuery],
  computed: {
    limits() {
      return DORTMUND_LIMITS;
    },
    seasonSortTip() {
      return `选填；${this.seasonSortRange.min}-${this.seasonSortRange.max}的整数；数值越小越靠前，默认${this.seasonSortRange.defaultValue}`;
    },
    seasonMetrics() {
      return [
        { label: '赛季编码', value: this.detailData.seasonCode, icon: 'el-icon-collection-tag' },
        { label: '赛季状态', value: this.displayDict(this.dict.type.fx67ll_dortmund_status, this.detailData.seasonStatus, '未设置'), icon: 'el-icon-data-analysis' },
        { label: '赛季排序', value: this.detailData.seasonSort == null ? '-' : this.detailData.seasonSort, icon: 'el-icon-sort' },
      ];
    },
    seasonRecordTrail() {
      const createTime = this.parseTime(this.detailData.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const updateTime = this.parseTime(this.detailData.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return [
        { key: 'create', label: '创建记录', value: this.formatAuditActor(this.detailData.createBy), hint: createTime ? `创建时间 · ${createTime}` : '', icon: 'el-icon-edit-outline', state: 'success' },
        { key: 'update', label: '最近更新', value: this.formatAuditActor(this.detailData.updateBy), hint: updateTime ? `更新时间 · ${updateTime}` : '', icon: 'el-icon-refresh', state: 'warning' },
      ];
    },
  },
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
      // 只读详情抽屉与当前详情快照
      detailVisible: false,
      detailLoading: false,
      detailData: {},
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
        seasonCode: null,
        seasonName: null,
        seasonStartDate: null,
        seasonEndDate: null,
        seasonStatus: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      seasonSortRange: DORTMUND_SEASON_SORT_RANGE,
      // 提交中状态，防止重复提交
      submitting: false,
      // 表单校验
      rules: {
        seasonCode: [requiredTextRule("赛季编码", DORTMUND_LIMITS.seasonCode)],
        seasonName: [requiredTextRule("赛季名称", DORTMUND_LIMITS.seasonName)],
        seasonStartDate: [
          { required: true, message: "赛季开始日期不能为空", trigger: "change" },
          dateRangeRule("赛季日期", () => this.form.seasonStartDate, () => this.form.seasonEndDate)
        ],
        seasonEndDate: [
          { required: true, message: "赛季结束日期不能为空", trigger: "change" },
          dateRangeRule("赛季日期", () => this.form.seasonStartDate, () => this.form.seasonEndDate)
        ],
        seasonStatus: [enumRule("赛季状态", DORTMUND_SEASON_STATUS_OPTIONS, true)],
        seasonSort: [integerRangeRule("赛季排序", DORTMUND_SEASON_SORT_RANGE.min, DORTMUND_SEASON_SORT_RANGE.max, false)],
        seasonRemark: [optionalTextRule("赛季备注", DORTMUND_LIMITS.seasonRemark)],
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 空用户名来自第三方导入或历史数据，统一标注来源，避免列表审计列为空。
    formatAuditActor(value) {
      return formatAuditActor(value);
    },
    // 字典值转标签；字典尚未加载时回退到原始值，避免误显示为未设置
    displayDict(options, value, fallback = '-') {
      if (value === null || value === undefined || value === '') {
        return fallback;
      }
      return this.selectDictLabel(options || [], value) || String(value);
    },
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
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
      }).catch(() => {
        this.seasonList = [];
        this.total = 0;
      }).finally(() => {
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
    // 详情按钮操作：先展示列表快照，再拉取详情补齐关联字段与原始零值
    handleDetail(row) {
      const snapshot = { ...(row || {}) };
      this.detailData = snapshot;
      this.detailLoading = true;
      this.detailVisible = true;
      getSeason(snapshot.seasonId).then(response => {
        const detail = response.data || {};
        if (detail.seasonId == null) {
          this.$modal.msgWarning("赛季不存在或已删除，请刷新后重试");
          return;
        }
        this.detailData = { ...snapshot, ...detail };
      }).catch(() => {
        // 接口异常时保留列表快照，避免详情抽屉空白
      }).finally(() => {
        this.detailLoading = false;
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const seasonId = row.seasonId || this.ids
      getSeason(seasonId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改赛季管理";
      }).catch(() => {
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const data = trimTextFields(this.form, ["seasonCode", "seasonName", "seasonRemark"]);
          this.submitting = true;
          if (data.seasonId != null) {
            updateSeason(data).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            }).catch(() => {
            }).finally(() => {
              this.submitting = false;
            });
          } else {
            addSeason(data).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            }).catch(() => {
            }).finally(() => {
              this.submitting = false;
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
      this.download('dortmund/season/export', {
        ...this.queryParams
      }, `season_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
/* 弹窗视觉语言：圆角、渐变图标、入场动画（与 extra/simulate 弹窗同一风格体系） */
::v-deep .season-edit-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(46, 204, 113, 0.18);
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f2;
}

.dialog-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.3);
}

.dialog-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.dialog-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8b84;
}

/* 表单区随弹窗打开做阶梯入场 */
::v-deep .season-edit-dialog .el-dialog__body {
  padding-top: 18px;
}

::v-deep .season-edit-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f4f2;
}

::v-deep .season-edit-dialog .el-dialog__body .el-form {
  animation: seasonFormFadeUp 0.3s ease 0.05s both;
}

@keyframes seasonFormFadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.season-detail-banner {
  display: flex;
  gap: 22px;
  align-items: stretch;
  justify-content: space-between;
  padding: 20px 0 20px;
  margin: 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf1ef;
  border-radius: 0;
  box-shadow: none;
}

.season-detail-banner-main {
  min-width: 0;
  flex: 1;
}

.season-detail-kicker {
  display: block;
  margin-bottom: 7px;
  font-size: 10px;
  font-weight: 700;
  color: #3f8f77;
  letter-spacing: .16em;
}

.season-detail-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 25px;
    font-weight: 750;
    line-height: 1.25;
    color: #1f2d28;
    overflow-wrap: anywhere;
  }
}

.season-detail-status-empty {
  padding: 2px 8px;
  font-size: 11px;
  color: #8b9791;
  background: #f4f8f6;
  border-radius: 999px;
}

.season-detail-code {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #52786a;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.season-detail-period {
  display: flex;
  flex: 0 0 248px;
  gap: 14px;
  align-items: center;
  justify-content: flex-end;
  padding: 2px 0 2px 22px;
  background: transparent;
  border: 0;
  border-left: 1px solid #e7ede9;
  border-radius: 0;
}

.season-detail-date {
  min-width: 82px;
  text-align: center;

  span {
    display: block;
    margin-bottom: 5px;
    font-size: 10px;
    color: #8b9791;
    letter-spacing: .08em;
  }

  strong {
    display: block;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
    color: #26362e;
    white-space: nowrap;
  }
}

.season-detail-range {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 32px;

  i {
    width: 6px;
    height: 6px;
    background: #3f8f77;
    border-radius: 50%;
    box-shadow: none;
  }

  em {
    flex: 1;
    height: 1px;
    background: #cfddd6;
  }
}

.season-detail-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 8px 0 16px;
  margin-bottom: 0;
  border-bottom: 1px solid #edf1ef;
}

.season-detail-stat {
  position: relative;
  min-width: 0;
  padding: 12px 16px;
  overflow: visible;
  background: transparent;
  border: 0;
  border-left: 1px solid #edf1ef;
  border-radius: 0;
  box-shadow: none;

  &:first-child {
    padding-left: 0;
    border-left: 0;
  }
}

.season-detail-stat-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-bottom: 10px;
  color: #367b5d;
  background: #e9f6ee;
  border-radius: 9px;
}

.season-detail-stat-label {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #83918a;
  letter-spacing: .06em;
}

.season-detail-stat-value {
  position: relative;
  z-index: 1;
  display: block;
  font-size: 15px;
  font-weight: 720;
  color: #25362e;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .season-detail-banner {
    flex-direction: column;
  }

  .season-detail-period {
    flex-basis: auto;
    justify-content: flex-start;
  }

  .season-detail-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .season-detail-stat:nth-child(odd) {
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 420px) {
  .season-detail-stat-grid {
    grid-template-columns: 1fr;
  }

  .season-detail-stat {
    padding-left: 0;
    border-left: 0;
  }
}
</style>
