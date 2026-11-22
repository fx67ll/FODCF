<template>
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="比赛详情"
    :subtitle="detail.matchCode ? `比赛编码 · ${detail.matchCode}` : '查看对阵、状态与审计信息'" icon="el-icon-football" tone="green"
    size="680px" feature="match" :loading="loading">
    <dortmund-detail-card v-if="hasStage" title="对阵舞台" icon="el-icon-football" tone="green">
      <dortmund-detail-block variant="versus" tone="green" :home="detail.homeTeamName" :away="detail.awayTeamName"
        :items="versusFields" />
    </dortmund-detail-card>

    <dortmund-detail-card v-if="hasSchedule" title="赛程资料" icon="el-icon-date" tone="green">
      <dortmund-detail-block variant="metric" tone="green" :items="scheduleItems" />
    </dortmund-detail-card>

    <dortmund-detail-card v-if="hasStats" title="业务统计" icon="el-icon-data-analysis" tone="green">
      <div class="match-detail-metric-grid">
        <div class="match-detail-metric">
          <span>比赛结果</span>
          <strong>{{ displayDict(dict.type.fx67ll_match_result, detail.matchResult, '未产生赛果') }}</strong>
        </div>
        <div class="match-detail-metric">
          <span>分析次数</span>
          <strong>{{ displayValue(detail.analysisCount, '暂无分析') }}</strong>
        </div>
        <div class="match-detail-metric">
          <span>已采用组合</span>
          <el-button v-if="detail.adoptedCombinationCount > 0" type="text" class="dortmund-theme-text"
            @click="adoptedVisible = true">{{ detail.adoptedCombinationCount }} 条 · 查看</el-button>
          <strong v-else>暂无采用</strong>
        </div>
      </div>
    </dortmund-detail-card>

    <dortmund-detail-card title="归属与关联" icon="el-icon-connection" tone="green">
      <div class="match-detail-field-grid">
        <div class="match-detail-field">
          <span>比赛ID</span>
          <strong>{{ displayValue(detail.matchId) }}</strong>
        </div>
        <div class="match-detail-field">
          <span>比赛编码</span>
          <strong>{{ displayValue(detail.matchCode) }}</strong>
        </div>
        <div v-for="item in associationFields" :key="item.label" class="match-detail-field">
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value) }}</strong>
        </div>
      </div>
    </dortmund-detail-card>

    <dortmund-detail-card title="比赛备注" icon="el-icon-document" tone="green">
      <div class="dortmund-detail-text-block">{{ displayValue(detail.matchRemark, '暂无比赛备注') }}</div>
    </dortmund-detail-card>

    <dortmund-detail-card title="记录轨迹" subtitle="归属、创建与最近更新" icon="el-icon-time" tone="green">
      <dortmund-record-trail :items="recordTrail" empty-text="暂无比赛记录轨迹" />
    </dortmund-detail-card>
    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>

    <dortmund-adopted-combinations-drawer :visible.sync="adoptedVisible" :match-id="detail.matchId"
      :match-label="matchLabel" />
  </dortmund-detail-drawer>
</template>

<script>
import { getMatch } from "@/api/fx67ll/dortmund/match";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";
import DortmundAdoptedCombinationsDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundAdoptedCombinationsDrawer/index";

export default {
  name: "DortmundMatchDetailDrawer",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: {
    DortmundDetailDrawer, DortmundDetailCard, DortmundDetailBlock, DortmundRecordTrail,
    DortmundAdoptedCombinationsDrawer
  },
  props: {
    visible: { type: Boolean, default: false },
    matchId: { type: [Number, String], default: null },
    snapshot: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      loading: false,
      detail: {},
      adoptedVisible: false,
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    matchLabel() {
      const teams = [this.detail.homeTeamName, this.detail.awayTeamName].filter(Boolean).join(" vs ");
      return teams || this.detail.matchCode || "";
    },
    versusFields() {
      return [
        { label: "所属赛季", value: this.detail.seasonName, emptyText: "未关联赛季" },
        { label: "比赛时间", value: this.parseTime(this.detail.matchTime, "{y}-{m}-{d} {h}:{i}:{s}"), emptyText: "未记录" },
        { label: "球队主场", value: this.detail.matchVenue, emptyText: "未记录" },
      ];
    },
    scheduleItems() {
      return [
        { label: "所属赛季ID", value: this.detail.seasonId, emptyText: "未记录", icon: "el-icon-collection-tag" },
        { label: "比赛时间", value: this.parseTime(this.detail.matchTime, "{y}-{m}-{d} {h}:{i}:{s}"), emptyText: "未记录", icon: "el-icon-time" },
        { label: "球队主场", value: this.detail.matchVenue, emptyText: "未记录", icon: "el-icon-location-outline" },
        { label: "资料状态", value: this.displayDict(this.dict.type.sys_notice_status, this.detail.matchStatus, "未设置"), emptyText: "未设置", icon: "el-icon-data-analysis" },
      ];
    },
    hasStage() {
      return [this.detail.homeTeamName, this.detail.awayTeamName, this.detail.seasonName,
      this.detail.matchTime, this.detail.matchVenue].some(this.hasDisplayValue);
    },
    hasSchedule() {
      return [this.detail.seasonId, this.detail.matchTime, this.detail.matchVenue,
      this.detail.matchStatus].some(this.hasDisplayValue);
    },
    hasStats() {
      return [this.detail.matchResult, this.detail.analysisCount,
      this.detail.adoptedCombinationCount].some(this.hasDisplayValue);
    },
    associationFields() {
      return [
        { label: "所属赛季ID", value: this.detail.seasonId },
        { label: "主队球队ID", value: this.detail.homeTeamId },
        { label: "客队球队ID", value: this.detail.awayTeamId },
        { label: "归属用户ID", value: this.detail.userId },
      ];
    },
    recordTrail() {
      const createTime = this.parseTime(this.detail.createTime, "{y}-{m}-{d} {h}:{i}:{s}");
      const updateTime = this.parseTime(this.detail.updateTime, "{y}-{m}-{d} {h}:{i}:{s}");
      return [
        { key: "owner", label: "归属用户ID", value: this.detail.userId, icon: "el-icon-user" },
        {
          key: "create", label: "创建记录", value: this.detail.createBy,
          hint: createTime ? `创建时间 · ${createTime}` : "", icon: "el-icon-edit-outline", state: "success"
        },
        {
          key: "update", label: "最近更新", value: this.detail.updateBy,
          hint: updateTime ? `更新时间 · ${updateTime}` : "", icon: "el-icon-refresh", state: "warning"
        },
      ];
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.loadDetail();
      }
    },
  },
  methods: {
    loadDetail() {
      if (this.matchId === null || this.matchId === undefined || this.matchId === "") {
        this.detail = { ...(this.snapshot || {}) };
        return;
      }
      const snapshot = { ...(this.snapshot || {}) };
      this.detail = snapshot;
      this.loading = true;
      getMatch(this.matchId).then((response) => {
        const value = response && response.data;
        if (!value || value.matchId == null) {
          this.$modal.msgWarning("比赛不存在或已删除，请刷新后重试");
          return;
        }
        this.detail = { ...snapshot, ...value };
      }).catch(() => {
        // 接口失败时保留列表快照，详情仍可阅读。
      }).finally(() => {
        this.loading = false;
      });
    },
    hasDisplayValue(value) {
      return value !== null && value !== undefined && String(value).trim() !== "";
    },
    displayValue(value, fallback = "-") {
      return this.hasDisplayValue(value) ? String(value).trim() : fallback;
    },
    displayDict(options, value, fallback = "-") {
      if (!this.hasDisplayValue(value)) {
        return fallback;
      }
      return this.selectDictLabel(options || [], value) || String(value);
    },
  },
};
</script>

<style lang="scss" scoped>
.match-detail-metric-grid,
.match-detail-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.match-detail-metric,
.match-detail-field {
  padding: 11px 13px;
  background: #f7fbf8;
  border: 1px solid #e4efe8;
  border-radius: 10px;

  span {
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
    color: #87958e;
  }

  strong {
    display: block;
    font-size: 13px;
    color: #33463c;
    word-break: break-all;
  }
}

@media screen and (max-width: 640px) {

  .match-detail-metric-grid,
  .match-detail-field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
