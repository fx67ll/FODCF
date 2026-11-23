<template>
  <!-- 方案关联比赛侧边弹窗：复用方案详情中的比赛列表与下钻逻辑。 -->
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="关联比赛" :subtitle="subtitle" icon="el-icon-football"
    tone="green" size="760px" feature="plan" :level="level" :shifted="matchDetailVisible">
    <div class="plan-linked-summary">
      <span class="plan-linked-summary-icon"><i class="el-icon-football"></i></span>
      <div>
        <strong>{{ planLabel || '当前方案' }} 共关联 {{ (matches || []).length }} 场比赛</strong>
        <p>比赛清单由已关联回报组合自动派生并去重，点击“详情”可继续查看比赛信息。</p>
      </div>
    </div>

    <dortmund-plan-linked-matches-table :matches="matches || []" :level="level" empty-text="当前方案暂未关联比赛"
      @detail-change="matchDetailVisible = $event" />

    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>
  </dortmund-detail-drawer>
</template>

<script>
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundPlanLinkedMatchesTable
  from "@/views/fx67ll/dortmund/other/component/DortmundPlanLinkedMatchesTable/index";

export default {
  name: "DortmundPlanMatchesDrawer",
  components: { DortmundDetailDrawer, DortmundPlanLinkedMatchesTable },
  props: {
    visible: { type: Boolean, default: false },
    matches: { type: Array, default: () => [] },
    planLabel: { type: String, default: "" },
    level: { type: [Number, String], default: 1 },
  },
  data() {
    return {
      matchDetailVisible: false,
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
    subtitle() {
      return this.planLabel ? `方案 · ${this.planLabel}` : "查看方案关联比赛清单";
    },
  },
  watch: {
    visible(value) {
      if (!value) {
        this.matchDetailVisible = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.plan-linked-summary {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px 15px;
  margin-bottom: 14px;
  color: #52615a;
  background: #f2fbf6;
  border: 1px solid #dcebe3;
  border-radius: 12px;

  strong {
    display: block;
    margin-bottom: 3px;
    color: #2b3a36;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: #7c8b84;
  }
}

.plan-linked-summary-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #27ad60;
  background: #e2f6eb;
  border-radius: 9px;
}
</style>