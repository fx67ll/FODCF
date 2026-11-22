<template>
  <div class="dortmund-match-selector">
    <list-selector-modal :visible.sync="dialogVisible" :title="multiple ? '选择比赛' : '选择单场比赛'" :api-func="listMatch"
      :query-params="selectorQueryParams" :columns="columns" :search-fields="searchFields" :max-count="maxCount"
      :selected-items="selectedItems" value-key="matchId" label-key="matchCode" :label-formatter="formatMatchLabel"
      :multiple="multiple" :page-size="pageSize" :page-sizes="pageSizes" :show-detail="true" @detail="openMatchDetail"
      :row-selectable="isMatchSelectable" row-selectable-message="该比赛已开赛或开赛时间无效，不能用于回报组合分析"
      @confirm="$emit('confirm', $event)" />
    <dortmund-match-detail-drawer :visible.sync="matchDetailVisible" :match-id="selectedDetailMatchId"
      :snapshot="selectedDetailSnapshot" />
  </div>
</template>

<script>
import { listMatch } from "@/api/fx67ll/dortmund/match";
import ListSelectorModal from "@/components/ListSelectorModal/index";
import DortmundMatchDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundMatchDetailDrawer/index";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundMatchSelectorModal",
  components: { ListSelectorModal, DortmundMatchDetailDrawer },
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
    requireActiveOdds: {
      type: Boolean,
      default: false,
    },
    maxCount: {
      type: Number,
      default: 0,
    },
    defaultMatchTimeDays: {
      type: Number,
      default: 0,
    },
    restrictPastMatches: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      listMatch,
      pageSize: DORTMUND_PAGINATION.defaultPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      matchDetailVisible: false,
      selectedDetailMatchId: null,
      selectedDetailSnapshot: {},
      columns: [
        {
          label: "对阵",
          prop: "matchup",
          minWidth: 260,
          formatter: (row) => [row.homeTeamName, row.awayTeamName].filter(Boolean).join(" vs ") || "-",
        },
        {
          label: "比赛时间",
          prop: "matchTime",
          minWidth: 170,
          formatter: (row) => this.parseTime(row.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-",
        },
      ],
      searchFields: [
        { key: "teamName", label: "对阵球队", placeholder: "请输入主队或客队名称" },
        {
          key: "matchTimeRange",
          label: "比赛时间",
          type: "datetimerange",
          rangeKeys: ["beginMatchTime", "endMatchTime"],
          defaultValueFactory: () => this.defaultMatchTimeDays > 0
            ? this.buildDefaultMatchTimeRange() : null,
        },
      ],
    };
  },
  computed: {
    selectorQueryParams() {
      return {
        matchStatus: "0",
        ...(this.requireActiveOdds ? { hasActiveOdds: "Y" } : {}),
        ...this.queryParams,
      };
    },
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
    buildDefaultMatchTimeRange() {
      const start = new Date();
      const end = new Date(start.getTime() + this.defaultMatchTimeDays * 24 * 60 * 60 * 1000);
      return [
        this.parseTime(start, "{y}-{m}-{d} {h}:{i}:{s}"),
        this.parseTime(end, "{y}-{m}-{d} {h}:{i}:{s}"),
      ];
    },
    isMatchSelectable(row) {
      if (!this.restrictPastMatches) {
        return true;
      }
      const matchTime = this.parseTime(row && row.matchTime, "{y}-{m}-{d} {h}:{i}:{s}");
      if (!matchTime) {
        return false;
      }
      const timestamp = new Date(matchTime.replace(/-/g, "/")).getTime();
      return Number.isFinite(timestamp) && timestamp >= Date.now();
    },
    formatMatchLabel(row) {
      const matchTime = this.parseTime(row.matchTime, "{y}-{m}-{d} {h}:{i}:{s}");
      const teams = [row.homeTeamName, row.awayTeamName].filter(Boolean).join(" vs ");
      return teams ? `${teams}${matchTime ? `（${matchTime}）` : ""}` : row.matchCode;
    },
    // 选择器内直接打开共享比赛详情，业务页面无需重复接线详情事件。
    openMatchDetail(row) {
      this.selectedDetailSnapshot = { ...(row || {}) };
      this.selectedDetailMatchId = row && row.matchId;
      this.matchDetailVisible = Boolean(this.selectedDetailMatchId);
    },
  },
};
</script>
