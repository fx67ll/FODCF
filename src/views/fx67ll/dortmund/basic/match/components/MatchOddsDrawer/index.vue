<template>
  <el-drawer :visible.sync="drawerVisible" title="比赛关联倍率" :size="drawerSize" direction="rtl" append-to-body
    destroy-on-close custom-class="match-odds-drawer" :wrapper-closable="false" @opened="handleOpened">
    <div class="match-odds-drawer-body">
      <div class="match-odds-summary" v-if="match">
        <div class="match-odds-summary-icon"><i class="el-icon-odometer"></i></div>
        <div class="match-odds-summary-copy">
          <div class="match-odds-summary-title">
            <strong>{{ matchSummary }}</strong>
            <el-tag size="mini" effect="plain" type="success">比赛 #{{ match.matchId }}</el-tag>
          </div>
          <div class="match-odds-summary-meta">
            <span><i class="el-icon-tickets"></i>{{ match.matchCode || "-" }}</span>
            <span><i class="el-icon-time"></i>{{ matchTimeText }}</span>
            <span><i class="el-icon-location-outline"></i>{{ match.matchVenue || "未填写场地" }}</span>
          </div>
        </div>
      </div>
      <dortmund-odds-inline-editor v-if="match && match.matchId" :match-id="match.matchId"
        @refresh="$emit('refresh')" />
    </div>
  </el-drawer>
</template>

<script>
import DortmundOddsInlineEditor from "@/views/fx67ll/dortmund/other/component/DortmundOddsInlineEditor/index.vue";

export default {
  name: "MatchOddsDrawer",
  components: { DortmundOddsInlineEditor },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    match: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1440,
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
    drawerSize() {
      if (this.viewportWidth < 768) {
        return "100%";
      }
      if (this.viewportWidth < 1400) {
        return "94%";
      }
      return "1080px";
    },
    matchSummary() {
      if (!this.match) {
        return "比赛详情";
      }
      return `${this.match.homeTeamName || "主队"} vs ${this.match.awayTeamName || "客队"}`;
    },
    matchTimeText() {
      return this.parseTime(this.match && this.match.matchTime, "{y}-{m}-{d} {h}:{i}") || "未填写比赛时间";
    },
  },
  mounted() {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleViewportResize);
    }
  },
  beforeDestroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleViewportResize);
    }
  },
  methods: {
    handleViewportResize() {
      if (typeof window !== "undefined") {
        this.viewportWidth = window.innerWidth;
      }
    },
    handleOpened() {
      // 抽屉打开后再允许内部表格重新测量，避免隐藏状态下宽度为 0
      this.$nextTick(() => {
        this.$emit("opened");
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.match-odds-drawer-body {
  min-height: 100%;
  padding: 18px 20px 28px;
  background: #f7f9f8;
}

.match-odds-summary {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 17px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #e7f8ee 100%);
  border: 1px solid #dcebe3;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.08);
}

.match-odds-summary-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.28);
}

.match-odds-summary-copy {
  min-width: 0;
}

.match-odds-summary-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  strong {
    color: #26362f;
    font-size: 15px;
  }
}

.match-odds-summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 14px;
  margin-top: 6px;
  color: #7c8b84;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

@media (max-width: 767px) {
  .match-odds-drawer-body {
    padding: 12px;
  }

  .match-odds-summary {
    align-items: flex-start;
  }
}
</style>

<style lang="scss">
.match-odds-drawer {
  border-radius: 14px 0 0 14px;
  box-shadow: -12px 0 36px rgba(31, 61, 46, 0.16);

  .el-drawer__header {
    padding: 18px 22px 15px;
    margin-bottom: 0;
    color: #26362f;
    font-weight: 700;
    border-bottom: 1px solid #e3e9e6;
  }

  .el-drawer__body {
    overflow: auto;
  }
}

@media (max-width: 767px) {
  .match-odds-drawer {
    border-radius: 0;

    .el-drawer__header {
      padding: 16px 14px 13px;
    }
  }
}
</style>
