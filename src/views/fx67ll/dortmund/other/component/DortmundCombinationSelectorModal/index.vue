<template>
  <div class="dortmund-combination-selector">
    <list-selector-modal :visible.sync="dialogVisible" title="选择关联回报组合" :api-func="loadCombinations"
      :query-params="queryParams" :columns="columns" :search-fields="searchFields" :selected-items="selectedItems"
      value-key="combinationId" label-key="combinationTitle" :label-formatter="formatCombinationLabel"
      :multiple="multiple" :page-size="pageSize" :page-sizes="pageSizes" show-detail :shifted="combinationDetailVisible"
      drawer-width="1120px" auto-query pagination-popper-class="dortmund-theme-popper" @detail="openCombinationDetail"
      @confirm="$emit('confirm', $event)">
      <template v-slot:deviationAmount="{ row }">
        <span :class="['combination-deviation', deviationTone(row.deviationAmount)]">
          <i v-if="deviationIcon(row.deviationAmount)" :class="deviationIcon(row.deviationAmount)"></i>
          {{ formatMoneyDisplay(row.deviationAmount) }}
        </span>
      </template>
      <template v-slot:verificationStatus="{ row }">
        <dortmund-verification-status-tag :status="row.verificationStatus" />
      </template>
      <template v-slot:adoptionStatus="{ row }">
        <el-tag :type="row.adoptedFlag === 'Y' ? 'success' : 'info'" size="mini">
          {{ row.adoptedFlag === "Y" ? "已采用" : "未采用" }}
        </el-tag>
      </template>
    </list-selector-modal>

    <dortmund-return-combination-detail-drawer :visible.sync="combinationDetailVisible"
      :combination-id="selectedDetailCombinationId" :snapshot="selectedDetailCombination" :level="2" />
  </div>
</template>

<script>
import { listCombination } from "@/api/fx67ll/dortmund/returnCombination";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import ListSelectorModal from "@/components/ListSelectorModal/index";
import DortmundReturnCombinationDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundReturnCombinationDetailDrawer/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundCombinationSelectorModal",
  components: {
    ListSelectorModal,
    DortmundReturnCombinationDetailDrawer,
    DortmundVerificationStatusTag,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    queryParams: {
      type: Object,
      default: () => ({}),
    },
    selectedItems: {
      type: Array,
      default: () => [],
    },
    multiple: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      pageSize: DORTMUND_PAGINATION.defaultPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      combinationDetailVisible: false,
      selectedDetailCombinationId: null,
      selectedDetailCombination: {},
      columns: [
        { label: "回报组合标题", prop: "combinationTitle", minWidth: 230 },
        { label: "场次", prop: "matchCount", minWidth: 80 },
        {
          label: "预计回报",
          prop: "estimatedReturn",
          minWidth: 100,
          formatter: (row) => formatMoneyDisplay(row.estimatedReturn),
        },
        { label: "偏差金额", prop: "deviationAmount", minWidth: 100, slot: "deviationAmount" },
        { label: "核验状态", prop: "verificationStatus", minWidth: 100, slot: "verificationStatus" },
        { label: "采用状态", prop: "adoptedFlag", minWidth: 100, slot: "adoptionStatus" },
        {
          label: "创建时间",
          prop: "createTime",
          minWidth: 160,
          formatter: (row) => this.parseTime(row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-",
        },
      ],
      searchFields: [
        {
          key: "keyword",
          label: "搜索组合",
          placeholder: "请输入组合标题或编码",
        },
        {
          key: "createTimeRange",
          label: "创建时间",
          type: "datetimerange",
          rangeKeys: ["beginCreateTime", "endCreateTime"],
          defaultValueFactory: () => this.buildDefaultCreateTimeRange(),
          startPlaceholder: "开始时间",
          endPlaceholder: "结束时间",
        },
      ],
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
  },
  methods: {
    // 默认圈定最近七天已采用组合，与方案编辑、列表筛选的有效数据口径保持一致。
    buildDefaultCreateTimeRange() {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      return [
        this.parseTime(start, "{y}-{m}-{d} {h}:{i}:{s}"),
        this.parseTime(end, "{y}-{m}-{d} {h}:{i}:{s}"),
      ];
    },
    loadCombinations(query = {}) {
      return listCombination({
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        keyword: query.keyword,
        adoptedFlag: "Y",
        beginCreateTime: query.beginCreateTime,
        endCreateTime: query.endCreateTime,
        sortField: "createTime",
        sortOrder: "desc",
      }).then((response) => {
        return {
          rows: (response && response.rows) || [],
          total: Number(response && response.total) || 0,
        };
      });
    },
    formatCombinationLabel(row) {
      return `${row.combinationTitle || row.combinationCode}（回报 ${row.estimatedReturn || 0}）`;
    },
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    // 偏差金额沿用回报组合工作台的色彩与箭头语义：正红向上、负绿向下、零灰。
    deviationTone(value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue === 0) return "is-zero";
      return numericValue > 0 ? "is-positive" : "is-negative";
    },
    deviationIcon(value) {
      const tone = this.deviationTone(value);
      if (tone === "is-positive") return "el-icon-top";
      if (tone === "is-negative") return "el-icon-bottom";
      return "";
    },
    // 选择器保持打开并左移，在当前层级上继续查看组合详情，不触发选择或确认。
    openCombinationDetail(row) {
      const combinationId = row && row.combinationId;
      if (combinationId === null || combinationId === undefined) {
        return;
      }
      this.selectedDetailCombination = { ...(row || {}) };
      this.selectedDetailCombinationId = combinationId;
      this.combinationDetailVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.combination-deviation {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  i {
    font-size: 12px;
  }

  &.is-positive {
    color: #ff5a5f;
  }

  &.is-negative {
    color: #2ecc71;
  }

  &.is-zero {
    font-weight: 400;
    color: #999999;
  }
}
</style>
