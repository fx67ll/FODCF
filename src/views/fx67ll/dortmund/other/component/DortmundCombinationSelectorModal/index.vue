<template>
  <list-selector-modal :visible.sync="dialogVisible" title="选择关联回报组合" :api-func="loadCombinations"
    :query-params="queryParams" :columns="columns" :search-fields="searchFields" :selected-items="selectedItems"
    value-key="combinationId" label-key="combinationTitle" :label-formatter="formatCombinationLabel"
    :multiple="multiple" @confirm="$emit('confirm', $event)" />
</template>

<script>
import { listCombination } from "@/api/fx67ll/dortmund/returnCombination";
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
            { label: "主观模式", value: "S" },
            { label: "AI 模式", value: "A" },
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
      return listCombination({
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        keyword: query.keyword,
        generationMode: query.generationMode,
        adoptedFlag: "Y",
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
  },
};
</script>
