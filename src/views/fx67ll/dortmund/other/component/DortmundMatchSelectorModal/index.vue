<template>
  <list-selector-modal :visible.sync="dialogVisible" :title="multiple ? '选择比赛' : '选择单场比赛'" :api-func="listMatch"
    :query-params="{ matchStatus: '0', ...queryParams }" :columns="columns" :search-fields="searchFields"
    :selected-items="selectedItems" value-key="matchId" label-key="matchCode" :label-formatter="formatMatchLabel"
    :multiple="multiple" @confirm="$emit('confirm', $event)" />
</template>

<script>
import { listMatch } from "@/api/fx67ll/dortmund/match";
import ListSelectorModal from "@/components/ListSelectorModal/index";

export default {
  name: "DortmundMatchSelectorModal",
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
      listMatch,
      columns: [
        { label: "比赛编码", prop: "matchCode", minWidth: 120 },
        { label: "所属赛季", prop: "seasonName", minWidth: 140 },
        { label: "对阵", prop: "matchSummary", minWidth: 220 },
        { label: "比赛时间", prop: "matchTime", minWidth: 140, formatter: (row) => this.parseTime(row.matchTime, "{y}-{m}-{d} {h}:{i}") || "-" },
        { label: "场地", prop: "matchVenue", minWidth: 140 },
      ],
      searchFields: [
        { key: "matchCode", label: "比赛编码", placeholder: "请输入比赛编码" },
        { key: "matchVenue", label: "比赛场地", placeholder: "请输入比赛场地" },
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
    formatMatchLabel(row) {
      const matchTime = this.parseTime(row.matchTime, "{y}-{m}-{d} {h}:{i}");
      const teams = [row.homeTeamName, row.awayTeamName].filter(Boolean).join(" vs ");
      return teams ? `${teams}${matchTime ? `（${matchTime}）` : ""}` : row.matchCode;
    },
  },
};
</script>
