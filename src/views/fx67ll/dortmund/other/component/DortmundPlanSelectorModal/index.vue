<template>
  <list-selector-modal :visible.sync="dialogVisible" title="选择关联方案计划" :api-func="listPlan" :columns="columns"
    :search-fields="searchFields" :selected-items="selectedItems" value-key="planId" label-key="planContent"
    :label-formatter="formatPlanLabel" multiple :page-size="pageSize" :page-sizes="pageSizes" auto-query
    @confirm="$emit('confirm', $event)" />
</template>

<script>
import { listPlan } from "@/api/fx67ll/dortmund/plan";
import ListSelectorModal from "@/components/ListSelectorModal/index";
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundPlanSelectorModal",
  components: { ListSelectorModal },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    selectedItems: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      listPlan,
      pageSize: DORTMUND_PAGINATION.defaultPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      columns: [
        { label: "方案正文", prop: "planContent", minWidth: 200 },
        {
          label: "预计本金",
          prop: "effectiveExpectedPrincipal",
          minWidth: 100,
          formatter: (row) => this.formatMoney(this.effectiveExpectedPrincipal(row)),
        },
        {
          label: "预计倍率",
          prop: "effectiveExpectedOdds",
          minWidth: 96,
          formatter: (row) => this.effectiveExpectedOdds(row),
        },
        {
          label: "预计回报",
          prop: "effectiveExpectedReturn",
          minWidth: 110,
          formatter: (row) => this.formatMoney(this.effectiveExpectedReturn(row)),
        },
        {
          label: "实际本金",
          prop: "planActualPrincipal",
          minWidth: 100,
          formatter: (row) => this.formatMoney(row.planActualPrincipal),
        },
        {
          label: "实际倍率",
          prop: "planActualOdds",
          minWidth: 96,
          formatter: (row) => this.formatNumber(row.planActualOdds),
        },
        {
          label: "实际回报",
          prop: "planActualReturn",
          minWidth: 110,
          formatter: (row) => this.formatMoney(row.planActualReturn),
        },
        { label: "关联比赛", prop: "matchCount", minWidth: 80 },
        {
          label: "创建时间",
          prop: "createTime",
          minWidth: 150,
          formatter: (row) => this.parseTime(row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-",
        },
      ],
      searchFields: [
        { key: "planContent", label: "方案正文", placeholder: "请输入正文关键字" },
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
    formatMoney(value) {
      if (value === null || value === undefined || value === "") {
        return "-";
      }
      return formatMoneyDisplay(value);
    },
    effectiveExpectedOdds(row) {
      const value = row.effectiveExpectedOdds ?? row.planExpectedOdds;
      return value === null || value === undefined || value === "" ? "-" : value;
    },
    effectiveExpectedPrincipal(row) {
      return row.effectiveExpectedPrincipal ?? row.planExpectedPrincipal ?? row.calculatedExpectedPrincipal;
    },
    effectiveExpectedReturn(row) {
      return row.effectiveExpectedReturn ?? row.planExpectedReturn ?? row.calculatedExpectedReturn;
    },
    formatNumber(value) {
      return value === null || value === undefined || value === "" ? "-" : value;
    },
    formatPlanLabel(row) {
      const content = row.planContent || "未填写正文";
      const summary = content.length > 34 ? `${content.slice(0, 34)}…` : content;
      return `${summary}（${row.matchCount || 0} 场）`;
    },
  },
};
</script>
