<template>
  <list-selector-modal :visible.sync="dialogVisible" title="选择关联方案计划" :api-func="listPlan" :columns="columns"
    :search-fields="searchFields" :selected-items="selectedItems" value-key="planId" label-key="planContent"
    :label-formatter="formatPlanLabel" multiple @confirm="$emit('confirm', $event)" />
</template>

<script>
import { listPlan } from "@/api/fx67ll/dortmund/plan";
import ListSelectorModal from "@/components/ListSelectorModal/index";

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
      columns: [
        { label: "方案正文", prop: "planContent", minWidth: 260 },
        { label: "录入倍率", prop: "planRate", minWidth: 110 },
        { label: "录入金额", prop: "planAmount", minWidth: 120 },
        { label: "关联比赛", prop: "matchCount", minWidth: 90 },
        {
          label: "创建时间",
          prop: "createTime",
          minWidth: 150,
          formatter: (row) => this.parseTime(row.createTime, "{y}-{m}-{d} {h}:{i}") || "-",
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
    formatPlanLabel(row) {
      const content = row.planContent || "未填写正文";
      const summary = content.length > 34 ? `${content.slice(0, 34)}…` : content;
      return `${summary}（${row.matchCount || 0} 场）`;
    },
  },
};
</script>
