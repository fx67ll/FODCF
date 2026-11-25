<template>
  <!-- 方案关联比赛统一列表：详情面板与列表页侧边弹窗共用同一套列、空态和下钻行为。 -->
  <div class="plan-linked-match-table-wrap">
    <el-table :data="matches || []" size="small" :empty-text="emptyText" class="plan-linked-table">
      <el-table-column label="比赛时间" align="center" prop="matchTime" width="150" class-name="dortmund-nowrap-cell">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="主队" align="center" prop="homeTeamName" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="linked-team-name home is-clickable" role="button" tabindex="0"
            @click.stop="openTeamDetail(scope.row, 'home')" @keyup.enter.stop="openTeamDetail(scope.row, 'home')">
            {{ scope.row.homeTeamName || '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="客队" align="center" prop="awayTeamName" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="linked-team-name away is-clickable" role="button" tabindex="0"
            @click.stop="openTeamDetail(scope.row, 'away')" @keyup.enter.stop="openTeamDetail(scope.row, 'away')">
            {{ scope.row.awayTeamName || '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="比赛结果" align="center" prop="matchResult" width="100">
        <template slot-scope="scope">
          <dict-tag v-if="hasMatchResult(scope.row.matchResult)" :options="dict.type.fx67ll_match_result"
            :value="scope.row.matchResult" />
          <dortmund-result-empty-tag v-else />
        </template>
      </el-table-column>
      <el-table-column label="倍率赛果" align="center" prop="oddsResult" width="150">
        <template slot-scope="scope">
          <dortmund-odds-result-tags :value="scope.row.oddsResult" empty-text="未登记" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="76" fixed="right">
        <template slot-scope="scope">
          <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
            @click="openMatchDetail(scope.row)" />
        </template>
      </el-table-column>
    </el-table>

    <dortmund-match-detail-drawer :visible.sync="matchDetailVisible" :match-id="selectedMatchId"
      :snapshot="selectedMatch" :level="nestedLevel" />
    <dortmund-team-detail-drawer :visible.sync="teamDetailVisible" :team-id="selectedTeamId"
      :snapshot="selectedTeamSnapshot" :level="nestedLevel" />
  </div>
</template>

<script>
import { DORTMUND_DRAWER_LAYOUT } from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundOddsResultTags from "@/views/fx67ll/dortmund/other/component/DortmundOddsResultTags/index";
import DortmundMatchDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundMatchDetailDrawer/index";
import DortmundResultEmptyTag from "@/views/fx67ll/dortmund/other/component/DortmundResultEmptyTag/index";
import DortmundTeamDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundTeamDetailDrawer/index";

export default {
  name: "DortmundPlanLinkedMatchesTable",
  dicts: ["fx67ll_match_result"],
  components: {
    DortmundActionButton, DortmundOddsResultTags, DortmundMatchDetailDrawer, DortmundResultEmptyTag,
    DortmundTeamDetailDrawer,
  },
  props: {
    // 方案详情或列表快照中的关联比赛集合。
    matches: {
      type: Array,
      default: () => [],
    },
    // 当前宿主抽屉层级；比赛详情下钻固定加一级。
    level: {
      type: [Number, String],
      default: 1,
    },
    emptyText: {
      type: String,
      default: "暂无关联比赛",
    },
  },
  data() {
    return {
      matchDetailVisible: false,
      selectedMatchId: null,
      selectedMatch: null,
      teamDetailVisible: false,
      selectedTeamId: null,
      selectedTeamSnapshot: {},
    };
  },
  computed: {
    nestedLevel() {
      const current = Number.parseInt(this.level, 10);
      const normalized = Number.isFinite(current) ? current : 1;
      return Math.min(DORTMUND_DRAWER_LAYOUT.maxLevel, Math.max(1, normalized) + 1);
    },
    nestedDetailVisible() {
      return this.matchDetailVisible || this.teamDetailVisible;
    },
  },
  watch: {
    // 比赛或球队详情任一打开时通知宿主抽屉左移，避免多级侧弹窗互相遮挡。
    nestedDetailVisible(value) {
      this.$emit("detail-change", value);
    },
  },
  methods: {
    // 历史导入数据可能以 "-" 表示未产生赛果，展示层与空值统一处理。
    hasMatchResult(value) {
      if (!this.hasValue(value)) {
        return false;
      }
      return String(value).trim() !== "-";
    },
    hasValue(value) {
      return value !== null && value !== undefined && value !== "";
    },
    openMatchDetail(row) {
      if (!row || row.matchId === null || row.matchId === undefined) {
        return;
      }
      this.selectedMatch = { ...row };
      this.selectedMatchId = row.matchId;
      this.matchDetailVisible = true;
    },
    // 主客队名称沿用比赛记录的点击反馈，直接查看对应球队详情。
    openTeamDetail(row, side) {
      const prefix = side === "away" ? "away" : "home";
      const teamId = row && row[`${prefix}TeamId`];
      if (!teamId) {
        return;
      }
      this.selectedTeamSnapshot = {
        teamId,
        teamName: row[`${prefix}TeamName`],
        teamCountry: row[`${prefix}TeamCountry`],
        teamCode: row[`${prefix}TeamCode`],
      };
      this.selectedTeamId = teamId;
      this.teamDetailVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.plan-linked-match-table-wrap {
  width: 100%;
}

.plan-linked-table {
  overflow: hidden;
  border: 1px solid #e3eee8;
  border-radius: 10px;

  &::before {
    display: none;
  }

  ::v-deep .el-table__header-wrapper th,
  ::v-deep .el-table__fixed-header-wrapper th {
    font-weight: 600;
    color: #44604f;
    background-color: #f3f9f5;
    border-bottom: 1px solid #e3eee8;
  }

  ::v-deep .el-table__body td.el-table__cell {
    border-bottom: 1px solid #f0f5f2;
  }

  ::v-deep .el-table__body tr {
    transition: background-color .18s ease;
  }

  ::v-deep .el-table__body tr:hover>td.el-table__cell {
    background-color: #f0faf4;
  }

  ::v-deep .el-table__body td.el-table__cell .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ::v-deep .dortmund-action-column .cell {
    display: flex;
    justify-content: center;
  }
}

/* 关联比赛列表沿用比赛记录页的主客队胶囊与无位移点击反馈。 */
.linked-team-name {
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
    z-index: 1;
    outline: none;
    box-shadow: 0 0 0 2px rgba(39, 173, 96, .14), 0 3px 8px rgba(39, 173, 96, .12);
  }

  &.is-clickable:active {
    box-shadow: 0 0 0 2px rgba(39, 173, 96, .2);
  }
}
</style>
