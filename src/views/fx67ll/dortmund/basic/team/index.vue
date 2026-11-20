<template>
  <div class="app-container dl-page">
    <template v-if="!open">
      <transition name="dl-filter">
        <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
          label-width="72px">
          <el-form-item label="球队编码" prop="teamCode" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamCode" placeholder="请输入球队编码" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <!-- 这下面个参数都可以用这个参数来模糊搜索 -->
          <el-form-item label="搜索球队" prop="teamName" v-if="!isMoreQuery">
            <el-input v-model="queryParams.teamName" placeholder="请输入球队全称/昵称/简称/英文" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队全称" prop="teamName" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamName" placeholder="请输入球队全称" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队昵称" prop="teamNameShort" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamNameShort" placeholder="请输入球队昵称/简称" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队英文" prop="teamNameEn" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamNameEn" placeholder="请输入球队英文" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队主场" prop="teamVenue" v-if="isMoreQuery">
            <dortmund-option-select v-model="queryParams.teamVenue" option-type="venue" placeholder="请选择或输入球队主场" />
          </el-form-item>
          <el-form-item label="地区/联赛" prop="teamCountry">
            <dortmund-option-select v-model="queryParams.teamCountry" option-type="country" placeholder="请选择或输入地区/联赛" />
          </el-form-item>
          <el-form-item label="球队标签" prop="teamTag" v-if="isMoreQuery">
            <dortmund-option-select v-model="queryParams.teamTag" option-type="tag" placeholder="请选择或输入球队标签" />
          </el-form-item>
          <el-form-item label="球队状态" prop="teamStatus" v-if="isMoreQuery">
            <el-select v-model="queryParams.teamStatus" style="width: 100%" placeholder="请选择球队状态" clearable
              popper-class="dortmund-theme-popper" @keyup.enter.native="handleQuery">
              <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
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
            v-hasPermi="['dortmund:team:add']">新增</el-button>
          <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
            v-hasPermi="['dortmund:team:edit']">修改</el-button>
          <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['dortmund:team:remove']">删除</el-button>
          <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:team:export']">导出</el-button> -->
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
        <el-table v-loading="loading" :data="teamList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="46" align="center" />
          <el-table-column label="球队编码" align="center" prop="teamCode" min-width="90" :show-overflow-tooltip="true"
            fixed="left" />
          <el-table-column label="球队全称" align="center" prop="teamName" min-width="180" :show-overflow-tooltip="true"
            fixed="left" />
          <el-table-column label="球队昵称" align="center" prop="teamNameShort" min-width="110"
            :show-overflow-tooltip="true" />
          <el-table-column label="球队英文" align="center" prop="teamNameEn" min-width="140"
            :show-overflow-tooltip="true" />
          <el-table-column label="球队Logo" align="center" prop="teamLogoUrl" width="88">
            <template slot-scope="scope">
              <!-- 判断Logo地址是否有效（非空、非'-'） -->
              <div v-if="scope.row.teamLogoUrl && scope.row.teamLogoUrl !== '-'" class="team-logo-cell">
                <el-image :src="scope.row.teamLogoUrl" fit="cover" class="team-logo-img"
                  :preview-src-list="[scope.row.teamLogoUrl]" placeholder="加载中..."
                  error-icon="el-icon-picture-outline" />
              </div>
              <!-- 无效地址时显示占位文本/图标 -->
              <div v-else class="team-logo-empty">
                <i class="el-icon-picture-outline"></i>
                暂无Logo
              </div>
            </template>
          </el-table-column>
          <el-table-column label="球队主场" align="center" prop="teamVenue" min-width="150" :show-overflow-tooltip="true" />
          <el-table-column label="地区/联赛" align="center" prop="teamCountry" min-width="130" show-overflow-tooltip />
          <el-table-column label="球队标签" align="center" prop="teamTag" min-width="200">
            <template slot-scope="scope">
              <!-- 遍历拆分后的标签数组，匹配对应 type 渲染彩色标签 -->
              <el-tag v-for="(tag, index) in scope.row.teamTag" :key="index" size="mini" :type="getTagType(tag.trim())"
                style="margin-right: 4px; margin-bottom: 4px;">
                {{ tag.trim() }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="球队状态" align="center" prop="teamStatus" width="96">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.teamStatus" />
            </template>
          </el-table-column>
          <el-table-column label="球队排序" align="center" prop="teamSort" width="96" sortable="teamSort"
            :sort-orders="['descending', 'ascending']" />
          <el-table-column label="球队备注" align="center" prop="teamRemark" min-width="200"
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
            fixed="right" width="122">
            <template slot-scope="scope">
              <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
                @click="handleDetail(scope.row)" v-hasPermi="['dortmund:team:query']" />
              <dortmund-action-button label="修改" icon="el-icon-edit" action="edit" @click="handleUpdate(scope.row)"
                v-hasPermi="['dortmund:team:edit']" />
              <dortmund-action-button label="删除" icon="el-icon-delete" action="delete" @click="handleDelete(scope.row)"
                v-hasPermi="['dortmund:team:remove']" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
        @pagination="getList" />
    </template>

    <!-- 添加或修改球队管理二级页面 -->
    <team-edit-scene v-else key="edit" :edit-mode="editMode" :initial-form="form" :submitting="submitting"
      @back="cancel" @save="submitForm" />

    <dortmund-detail-drawer :visible.sync="detailVisible" title="球队详情"
      :subtitle="detailData.teamName || '查看球队资料、归属标签与审计信息'" icon="el-icon-s-custom" tone="green" size="680px"
      feature="team" :loading="detailLoading">
      <section class='team-detail-hero'>
        <div class='team-detail-crest'>
          <el-image v-if='detailData.teamLogoUrl' :src='detailData.teamLogoUrl' fit='cover'
            :preview-src-list='[detailData.teamLogoUrl]' error-icon='el-icon-picture-outline' />
          <i v-else class='el-icon-postcard'></i>
        </div>
        <div class='team-detail-headline'>
          <span class='team-detail-kicker'>球队档案</span>
          <div class='team-detail-title-row'>
            <h3>{{ displayValue(detailData.teamName, '未填写球队全称') }}</h3>
            <dict-tag
              v-if='detailData.teamStatus !== null && detailData.teamStatus !== undefined && detailData.teamStatus !== ""'
              :options='dict.type.sys_normal_disable' :value='detailData.teamStatus' />
            <span v-else class='team-detail-status-empty'>状态未设置</span>
          </div>
          <p>{{ displayValue(detailData.teamNameShort, '未填写昵称') }}<template
              v-if='displayValue(detailData.teamNameEn, "")'> · {{ detailData.teamNameEn }}</template></p>
          <span class='team-detail-code'><i class='el-icon-collection-tag'></i>{{
            displayValue(detailData.teamCode, '未填写编码') }}</span>
        </div>
      </section>

      <div class='team-detail-summary'>
        <article v-for='item in teamSummaryMetrics' :key='item.label' class='team-detail-summary-item'>
          <span class='team-detail-summary-icon'><i :class='item.icon'></i></span>
          <div class='team-detail-summary-copy'>
            <span>{{ item.label }}</span>
            <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
          </div>
        </article>
      </div>

      <dortmund-detail-card title='身份与编码' icon='el-icon-postcard' tone='green'>
        <div class='team-detail-field-grid'>
          <div v-for='item in teamIdentityFields' :key='item.label' class='team-detail-field'>
            <span>{{ item.label }}</span>
            <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
          </div>
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title='主场与归属' icon='el-icon-office-building' tone='green'>
        <div class='team-detail-field-grid'>
          <div v-for='item in teamOwnershipFields' :key='item.label' class='team-detail-field'>
            <span>{{ item.label }}</span>
            <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
          </div>
        </div>
      </dortmund-detail-card>

      <dortmund-detail-card title='球队标签' icon='el-icon-price-tag' tone='green'>
        <div v-if='teamTagList.length' class='team-detail-tag-wall'>
          <el-tag v-for='tag in teamTagList' :key='tag' size='small' effect='plain' :type='getTagType(tag)'>
            <i class='el-icon-collection-tag'></i>{{ tag }}
          </el-tag>
        </div>
        <div v-else class='team-detail-empty'><i class='el-icon-price-tag'></i><span>暂无球队标签</span></div>
      </dortmund-detail-card>

      <dortmund-detail-card title='球队备注' icon='el-icon-document' tone='green'>
        <div class='dortmund-detail-text-block team-detail-remark'>{{ displayValue(detailData.teamRemark, '暂无备注')
        }}</div>
      </dortmund-detail-card>

      <dortmund-detail-card title='记录轨迹' subtitle='归属、创建与最近更新' icon='el-icon-time' tone='green'>
        <dortmund-record-trail :items='teamRecordTrail' empty-text='暂无球队记录轨迹' />
      </dortmund-detail-card>
      <template slot="footer">
        <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="detailVisible = false">关闭</el-button>
      </template>
    </dortmund-detail-drawer>
  </div>
</template>

<script>
import { listTeam, getTeam, delTeam, addTeam, updateTeam } from "@/api/fx67ll/dortmund/team";

import {
  DORTMUND_PAGINATION,
  DORTMUND_TAG_SPLIT_PATTERN,
  TEAM_TAG_FALLBACK_OPTIONS,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import TeamEditScene from "./components/TeamEditScene/index.vue";
import DortmundOptionSelect from "@/views/fx67ll/dortmund/other/component/DortmundOptionSelect/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";

export default {
  name: "Team",
  dicts: ["sys_normal_disable"],
  components: { TeamEditScene, DortmundOptionSelect, DortmundDetailDrawer, DortmundDetailCard, DortmundActionButton, DortmundRecordTrail },
  computed: {
    teamTagList() {
      return this.formatTeamTagList(this.detailData.teamTag);
    },
    teamSummaryMetrics() {
      return [
        { label: '球队标签', value: this.teamTagList.length ? `${this.teamTagList.length} 个` : '暂无标签', icon: 'el-icon-price-tag' },
        { label: '展示排序', value: this.detailData.teamSort == null ? null : this.detailData.teamSort, emptyText: '未设置', icon: 'el-icon-sort' },
        { label: '地区/联赛', value: this.detailData.teamCountry, icon: 'el-icon-location-outline' },
        { label: '主场', value: this.detailData.teamVenue, icon: 'el-icon-office-building' },
      ];
    },
    teamIdentityFields() {
      return [
        { label: '球队ID', value: this.detailData.teamId },
        { label: '球队编码', value: this.detailData.teamCode },
        { label: '球队全称', value: this.detailData.teamName },
        { label: '球队昵称', value: this.detailData.teamNameShort },
        { label: '球队英文', value: this.detailData.teamNameEn },
      ];
    },
    teamOwnershipFields() {
      return [
        { label: '主场', value: this.detailData.teamVenue },
        { label: '地区/联赛', value: this.detailData.teamCountry },
        { label: '球队状态', value: this.displayDict(this.dict.type.sys_normal_disable, this.detailData.teamStatus, '未设置') },
        { label: '展示排序', value: this.detailData.teamSort == null ? null : this.detailData.teamSort, emptyText: '未设置' },
        { label: '归属用户ID', value: this.detailData.userId },
      ];
    },
    teamRecordTrail() {
      const createTime = this.parseTime(this.detailData.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const updateTime = this.parseTime(this.detailData.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return [
        { key: 'owner', label: '归属用户ID', value: this.detailData.userId, icon: 'el-icon-user' },
        { key: 'create', label: '创建记录', value: this.detailData.createBy, hint: createTime ? `创建时间 · ${createTime}` : '', icon: 'el-icon-edit-outline', state: 'success' },
        { key: 'update', label: '最近更新', value: this.detailData.updateBy, hint: updateTime ? `更新时间 · ${updateTime}` : '', icon: 'el-icon-refresh', state: 'warning' },
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
      // 球队管理表格数据
      teamList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 只读详情抽屉与当前详情快照
      detailVisible: false,
      detailLoading: false,
      detailData: {},
      // 编辑场景模式
      editMode: "add",
      // 编辑提交状态
      submitting: false,
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
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamVenue: null,
        teamCountry: null,
        teamStatus: null,
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
        teamNameShort: [
          { required: true, message: "球队昵称不能为空", trigger: "blur" }
        ],
        teamNameEn: [
          { required: true, message: "球队英文不能为空", trigger: "blur" }
        ],
        teamLogoUrl: [
          { required: true, message: "球队Logo不能为空", trigger: "blur" }
        ],
        teamCountry: [
          { required: true, message: "地区/联赛不能为空", trigger: "blur" }
        ],
        teamTag: [
          { required: true, message: "球队标签不能为空", trigger: "blur" }
        ],
        teamStatus: [
          { required: true, message: "球队状态不能为空", trigger: "blur" }
        ],
      },
      // 球队标签预设选项数组
      teamTagOptions: TEAM_TAG_FALLBACK_OPTIONS,
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    /** 根据标签值获取对应的 type（配色） */
    getTagType(tagValue) {
      // 从预设数组中查找匹配的标签
      const matchTag = this.teamTagOptions.find(item => item.value === tagValue);
      // 有匹配则返回对应 type，无匹配返回默认 info
      return matchTag ? matchTag.type : "info";
    },
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
        const teamListTmp = (response.rows || []).map(item => ({
          ...item,
          teamTag: this.formatTeamTagList(item.teamTag),
        }));
        this.teamList = this.formatObjectArrayNullProperty(teamListTmp);
        this.total = response.total;
      }).catch(() => {
        this.teamList = [];
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
      this.ids = selection.map(item => item.teamId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.editMode = "add";
      this.open = true;
      this.title = "添加球队管理";
    },
    // 详情按钮操作：先展示列表快照，再拉取详情补齐标签、归属与原始零值
    handleDetail(row) {
      const snapshot = { ...(row || {}) };
      this.detailData = snapshot;
      this.detailLoading = true;
      this.detailVisible = true;
      getTeam(snapshot.teamId).then(response => {
        const detail = response.data || {};
        if (detail.teamId == null) {
          this.$modal.msgWarning("球队不存在或已删除，请刷新后重试");
          return;
        }
        this.detailData = { ...snapshot, ...detail };
      }).catch(() => {
        // 接口异常时保留列表快照，避免详情抽屉空白
      }).finally(() => {
        this.detailLoading = false;
      });
    },
    // 球队标签兼容接口字符串与表单数组两种表示
    formatTeamTagList(value) {
      if (Array.isArray(value)) {
        return value.map((item) => String(item || "").trim()).filter(Boolean);
      }
      return String(value || "")
        .split(DORTMUND_TAG_SPLIT_PATTERN)
        .map((item) => item.trim())
        .filter(Boolean);
    },
    // 空值处理：仅 null、undefined 和空白字符串视为缺失，数字 0 正常展示
    displayValue(value, fallback = "-") {
      if (value === null || value === undefined) {
        return fallback;
      }
      const normalized = String(value).trim();
      return normalized === "" ? fallback : normalized;
    },
    // 字典值转标签，字典尚未加载时使用明确的业务兜底文案
    displayDict(options, value, fallback = "-") {
      if (value === null || value === undefined || value === "") {
        return fallback;
      }
      return this.selectDictLabel(options || [], value) || String(value);
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const teamId = row.teamId || this.ids
      getTeam(teamId).then(response => {
        const formDataObj = response.data;
        formDataObj.teamTag = this.formatTeamTagList(formDataObj && formDataObj.teamTag);
        this.form = formDataObj;
        this.editMode = "update";
        this.open = true;
        this.title = "修改球队管理";
      }).catch(() => {
        // 接口异常由请求拦截器统一提示，避免重复弹窗
      });
    },
    /** 提交按钮 */
    submitForm(formData) {
      this.submitting = true;
      const request = formData.teamId != null ? updateTeam(formData) : addTeam(formData);
      request.then(() => {
        this.$modal.msgSuccess(formData.teamId != null ? "修改成功" : "新增成功");
        this.open = false;
        this.getList();
      }).catch(() => {
      }).finally(() => {
        this.submitting = false;
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
      this.download('dortmund/team/export', {
        ...this.queryParams
      }, `team_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
/* 列表Logo单元格：固定尺寸圆角预览 */
.team-logo-cell {
  display: inline-flex;

  .team-logo-img {
    display: block;
    width: 50px;
    height: 50px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #e2eee7;
    transition: transform 0.2s ease;

    /* el-image 的内部 img 不继承组件根节点尺寸，列表单元格必须显式撑满并裁切。 */
    ::v-deep .el-image__inner {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover {
      transform: scale(1.06);
    }
  }
}

.team-logo-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: #a8b5af;
  font-size: 11px;
  background: #f4f8f6;
  border: 1px dashed #dce9e2;
  border-radius: 8px;

  i {
    margin-right: 3px;
    font-size: 14px;
  }
}

/* 详情抽屉 Logo 与备注：限制预览尺寸，避免长图撑破抽屉 */
.team-detail-logo-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
}

.team-detail-logo,
.team-detail-logo-empty {
  width: 92px;
  height: 92px;
  border-radius: 12px;
}

.team-detail-logo {
  background: #f7faf8;
  border: 1px solid #e2eee7;
}

.team-detail-logo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #9aa8a1;
  background: #f7faf8;
  border: 1px dashed #dce9e2;

  i {
    margin-right: 3px;
  }
}

.team-detail-remark {
  flex: 1 1 260px;
  min-width: 0;
}

.team-detail-hero {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px 0 18px;
  margin-bottom: 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf1ef;
  border-radius: 0;
  box-shadow: none;
}

.team-detail-crest {
  display: grid;
  flex: 0 0 76px;
  place-items: center;
  width: 76px;
  height: 76px;
  overflow: hidden;
  color: #3b8666;
  background: #f4faf6;
  border: 1px solid #dcebe3;
  border-radius: 12px;
  box-shadow: none;

  i {
    font-size: 30px;
  }

  .el-image {
    width: 100%;
    height: 100%;
  }
}

.team-detail-headline {
  min-width: 0;
  flex: 1;

  .team-detail-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 750;
    line-height: 1.3;
    color: #1f2d28;
    overflow-wrap: anywhere;
  }

  p {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.55;
    color: #75847c;
    overflow-wrap: anywhere;
  }
}

.team-detail-code {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-top: 8px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #47705d;
  background: #f0f8f3;
  border-radius: 999px;

  i {
    font-size: 12px;
  }
}

.team-detail-status-empty {
  padding: 2px 8px;
  font-size: 11px;
  color: #8b9791;
  background: #f4f8f6;
  border-radius: 999px;
}

.team-detail-kicker {
  display: block;
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #3f8f77;
  letter-spacing: .15em;
}

.team-detail-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 0;
  padding: 4px 0;
  border-bottom: 1px solid #edf1ef;
}

.team-detail-summary-item {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 12px 15px;
  border-left: 1px solid #edf1ef;

  &:first-child {
    padding-left: 0;
    border-left: 0;
  }
}

.team-detail-summary-icon {
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  color: #3f8f77;
  font-size: 14px;
  background: #eff8f3;
  border-radius: 8px;
  place-items: center;
}

.team-detail-summary-copy {
  min-width: 0;

  span {
    display: block;
    margin-bottom: 3px;
    font-size: 10px;
    font-weight: 700;
    color: #7c8b84;
    letter-spacing: .05em;
  }

  strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
    color: #26362e;
    overflow-wrap: anywhere;
  }
}

.team-detail-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px 24px;
  padding: 2px 0;
}

.team-detail-field {
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

.team-detail-tag-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  ::v-deep .el-tag {
    height: 28px;
    padding: 0 11px;
    line-height: 26px;
    border-color: #dcebe3;
  }

  i {
    margin-right: 4px;
  }
}

.team-detail-empty {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 14px;
  font-size: 12px;
  color: #8a9790;
  background: #f7faf8;
  border-left: 2px solid #dbe9e0;

  i {
    font-size: 14px;
  }
}

.team-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.team-detail-fact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 0;
  padding: 4px 0 14px;
  margin-bottom: 0;
  border-bottom: 1px solid #edf1ef;
}

.team-detail-fact {
  min-width: 0;
  padding: 10px 16px;
  background: transparent;
  border: 0;
  border-left: 1px solid #edf1ef;
  border-radius: 0;
  box-shadow: none;

  &:first-child {
    padding-left: 0;
    border-left: 0;
  }

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
    line-height: 1.5;
    color: #26362e;
    overflow-wrap: anywhere;
  }
}

@media (max-width: 620px) {
  .team-detail-hero {
    flex-wrap: wrap;
    padding: 2px 0 16px;
  }

  .team-detail-crest {
    flex-basis: 60px;
    width: 60px;
    height: 60px;
    border-radius: 10px;
  }

  .team-detail-headline h3 {
    font-size: 19px;
  }

  .team-detail-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .team-detail-summary-item {
    padding: 10px 12px;

    &:nth-child(odd) {
      padding-left: 0;
      border-left: 0;
    }
  }

  .team-detail-fact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .team-detail-fact {
    padding: 10px 12px;
    border-left: 1px solid #edf1ef;
  }

  .team-detail-fact:nth-child(odd) {
    padding-left: 0;
    border-left: 0;
  }
}

/* 弹窗视觉语言：圆角、渐变图标、入场动画（与 extra/simulate 弹窗同一风格体系） */
::v-deep .team-edit-dialog {
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

::v-deep .team-edit-dialog .el-dialog__body {
  padding-top: 18px;
}

::v-deep .team-edit-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f4f2;
}

/* 表单区随弹窗打开做阶梯入场 */
::v-deep .team-edit-dialog .el-dialog__body .el-form {
  animation: teamFormFadeUp 0.3s ease 0.05s both;
}

@keyframes teamFormFadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
