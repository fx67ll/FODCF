<template>
  <list-selector-modal :visible.sync="dialogVisible" title="选择关联回报组合" :api-func="loadCombinations"
    :query-params="queryParams" :columns="columns" :search-fields="searchFields" :selected-items="selectedItems"
    value-key="combinationId" label-key="combinationTitle" :label-formatter="formatCombinationLabel"
    :multiple="multiple" @confirm="$emit('confirm', $event)" />
</template>

<script>
import { listPlanReturnOptions } from "@/api/fx67ll/dortmund/plan";
import ListSelectorModal from "@/components/ListSelectorModal/index";

export default {
  name: "DortmundCombinationSelectorModal",
  components: { ListSelectorModal },
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
      columns: [
        { label: "组合标题", prop: "combinationTitle", minWidth: 190 },
        { label: "组合编码", prop: "combinationCode", minWidth: 150 },
        { label: "组合倍率", prop: "combinedOdds", minWidth: 100 },
        { label: "预计回报", prop: "estimatedReturn", minWidth: 110 },
        { label: "比赛数", prop: "matchCount", minWidth: 90 },
        { label: "审核时间", prop: "reviewTime", minWidth: 140 },
      ],
      searchFields: [
        {
          key: "keyword",
          label: "回报组合",
          placeholder: "请输入标题或编码",
        },
        {
          key: "generationMode",
          label: "生成模式",
          type: "select",
          placeholder: "请选择生成模式",
          options: [
            { label: "人工权重", value: "S" },
            { label: "AI 权重", value: "A" },
          ],
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
    loadCombinations(query = {}) {
      return listPlanReturnOptions().then((response) => {
        const keyword = String(query.keyword || "").trim().toLowerCase();
        const generationMode = query.generationMode;
        const sourceRows = Array.isArray(response && response.data) ? response.data : [];
        const filteredRows = sourceRows.filter((item) => {
          if (generationMode && item.generationMode !== generationMode) {
            return false;
          }
          if (!keyword) {
            return true;
          }
          return [item.combinationTitle, item.combinationCode]
            .some((value) => String(value || "").toLowerCase().includes(keyword));
        });
        const pageNum = Math.max(Number(query.pageNum) || 1, 1);
        const pageSize = Math.max(Number(query.pageSize) || 10, 1);
        const startIndex = (pageNum - 1) * pageSize;
        return {
          rows: filteredRows.slice(startIndex, startIndex + pageSize),
          total: filteredRows.length,
        };
      });
    },
    formatCombinationLabel(row) {
      return `${row.combinationTitle || row.combinationCode}（回报 ${row.estimatedReturn || 0}）`;
    },
  },
};
</script>
