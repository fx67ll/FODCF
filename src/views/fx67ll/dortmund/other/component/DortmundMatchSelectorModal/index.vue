<template>
  <div class="dortmund-match-selector">
    <list-selector-modal :visible.sync="dialogVisible" :title="multiple ? '选择比赛' : '选择单场比赛'" :api-func="listMatch"
      :query-params="selectorQueryParams" :columns="columns" :search-fields="searchFields" :max-count="maxCount"
      :selected-items="selectedItems" value-key="matchId" label-key="matchCode" :label-formatter="formatMatchLabel"
      :multiple="multiple" :page-size="pageSize" :page-sizes="pageSizes" :show-detail="true"
      :shifted="detailLayerVisible" drawer-width="1120px" auto-query @detail="openMatchDetail"
      pagination-popper-class="dortmund-theme-popper" :row-selectable="isMatchSelectable"
      row-selectable-message="该比赛已开赛或开赛时间无效，不能用于回报组合分析" @confirm="$emit('confirm', $event)">
      <template v-slot:homeTeam="{ row }">
        <span class="selector-team-name home is-clickable" :class="teamLeagueClass(row, 'home')" role="button"
          tabindex="0" @click.stop="openTeamDetail(row, 'home')" @keyup.enter.stop="openTeamDetail(row, 'home')">
          {{ row.homeTeamName || "-" }}
        </span>
      </template>
      <template v-slot:awayTeam="{ row }">
        <span class="selector-team-name away is-clickable" :class="teamLeagueClass(row, 'away')" role="button"
          tabindex="0" @click.stop="openTeamDetail(row, 'away')" @keyup.enter.stop="openTeamDetail(row, 'away')">
          {{ row.awayTeamName || "-" }}
        </span>
      </template>
    </list-selector-modal>
    <dortmund-match-detail-drawer :visible.sync="matchDetailVisible" :match-id="selectedDetailMatchId"
      :snapshot="selectedDetailSnapshot" :level="2" />
    <dortmund-team-detail-drawer :visible.sync="teamDetailVisible" :team-id="selectedDetailTeamId"
      :snapshot="selectedDetailTeamSnapshot" :level="2" />
  </div>
</template>

<script>
import { listMatch } from "@/api/fx67ll/dortmund/match";
import ListSelectorModal from "@/components/ListSelectorModal/index";
import DortmundMatchDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundMatchDetailDrawer/index";
import DortmundTeamDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundTeamDetailDrawer/index";
import {
  DORTMUND_PAGINATION,
  resolveDortmundLeagueTheme,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundMatchSelectorModal",
  components: { ListSelectorModal, DortmundMatchDetailDrawer, DortmundTeamDetailDrawer },
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
    // 信息点等历史业务场景需要选择任意状态的比赛；默认仍只展示未开赛赛程。
    allowAllMatchStatuses: {
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
      teamDetailVisible: false,
      selectedDetailTeamId: null,
      selectedDetailTeamSnapshot: {},
      columns: [
        {
          label: "所属赛季",
          prop: "seasonName",
          minWidth: 130,
        },
        {
          label: "主队名称",
          prop: "homeTeamName",
          minWidth: 160,
          slot: "homeTeam",
        },
        {
          label: "客队名称",
          prop: "awayTeamName",
          minWidth: 160,
          slot: "awayTeam",
        },
        {
          label: "球队主场",
          prop: "matchVenue",
          minWidth: 180,
        },
        {
          label: "比赛时间",
          prop: "matchTime",
          minWidth: 160,
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
    detailLayerVisible() {
      return this.matchDetailVisible || this.teamDetailVisible;
    },
    selectorQueryParams() {
      return {
        ...(this.allowAllMatchStatuses ? {} : { matchStatus: "0" }),
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
    // 主客队名称与比赛记录页保持一致，按“地区/联赛”解析主题；点击后打开对应球队详情，不中断当前比赛选择。
    teamLeagueClass(row, side) {
      const prefix = side === "away" ? "away" : "home";
      const league = resolveDortmundLeagueTheme(row[`${prefix}TeamCountry`]);
      return league ? `league-${league}` : "";
    },
    openTeamDetail(row, side) {
      const prefix = side === "away" ? "away" : "home";
      const teamId = row && row[`${prefix}TeamId`];
      if (!teamId) {
        return;
      }
      this.selectedDetailTeamSnapshot = {
        teamId,
        teamName: row[`${prefix}TeamName`],
        teamCountry: row[`${prefix}TeamCountry`],
        teamCode: row[`${prefix}TeamCode`],
      };
      this.selectedDetailTeamId = teamId;
      this.teamDetailVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 主客队胶囊沿用比赛记录列表的七联赛柔和配色，保持跨页面识别一致。 */
.selector-team-name {
  display: inline-block;
  max-width: 150px;
  padding: 2px 10px;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 999px;

  &.home {
    color: #27ad60;
    background: #e7f8ee;
  }

  &.away {
    color: #8a6b3d;
    background: #faf3e6;
  }

  &.is-clickable {
    cursor: pointer;
    transition: color .18s ease, background-color .18s ease, border-color .18s ease, box-shadow .18s ease;
  }

  &.is-clickable:hover,
  &.is-clickable:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(39, 173, 96, .14), 0 3px 8px rgba(39, 173, 96, .12);
  }

  &.is-clickable:active {
    box-shadow: 0 0 0 2px rgba(39, 173, 96, .2);
  }
}

.selector-team-name.home.league-bundesliga {
  color: #2f7d5a;
  background: #e9f8ef;
  border: 1px solid #cfeedd;
}

.selector-team-name.away.league-bundesliga {
  color: #5d8f78;
  background: #f5fbf7;
  border: 1px dashed #dbece3;
}

.selector-team-name.home.league-premier-league {
  color: #346fa8;
  background: #eaf4ff;
  border: 1px solid #cfe4fa;
}

.selector-team-name.away.league-premier-league {
  color: #6389b0;
  background: #f5f9ff;
  border: 1px dashed #dce8f6;
}

.selector-team-name.home.league-la-liga {
  color: #a96535;
  background: #fff3e8;
  border: 1px solid #f4d9bf;
}

.selector-team-name.away.league-la-liga {
  color: #b98862;
  background: #fff9f4;
  border: 1px dashed #f0e2d5;
}

.selector-team-name.home.league-serie-a {
  color: #6e56a5;
  background: #f3efff;
  border: 1px solid #ded3fa;
}

.selector-team-name.away.league-serie-a {
  color: #9180b8;
  background: #faf8ff;
  border: 1px dashed #e7e0f5;
}

.selector-team-name.home.league-ligue-1 {
  color: #ad5876;
  background: #fff0f5;
  border: 1px solid #f4d3df;
}

.selector-team-name.away.league-ligue-1 {
  color: #c5869b;
  background: #fff8fa;
  border: 1px dashed #f1e0e6;
}

.selector-team-name.home.league-j1 {
  color: #2c8584;
  background: #e9f9f8;
  border: 1px solid #ccebea;
}

.selector-team-name.away.league-j1 {
  color: #689f9e;
  background: #f4fcfc;
  border: 1px dashed #dcefee;
}

.selector-team-name.home.league-j2 {
  color: #927534;
  background: #fbf7e8;
  border: 1px solid #ecdfb9;
}

.selector-team-name.away.league-j2 {
  color: #ab9665;
  background: #fdfbf4;
  border: 1px dashed #eee5d2;
}

@media (prefers-reduced-motion: reduce) {
  .selector-team-name.is-clickable {
    transition: none;
  }
}
</style>
