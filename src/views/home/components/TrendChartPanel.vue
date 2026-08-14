<template>
  <section class="panel chart-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">LOCAL INSIGHTS</span>
        <h3>菜单访问趋势</h3>
      </div>
      <span class="range-tag"><i class="el-icon-lock"></i> 仅本机</span>
    </div>
    <home-stat-chart :option="option" :has-data="hasData" :empty-title="emptyTitle" :empty-desc="emptyDesc" />
  </section>
</template>

<script>
import HomeStatChart from "./StatChart.vue";

/**
 * 菜单访问趋势面板（卡片级抽取）
 * 管理员 / 非管理员首页该面板标记完全相同，抽出后各引一行。
 * 内部复用 HomeStatChart（含空状态）。
 */
export default {
  name: "HomeTrendChartPanel",
  components: { HomeStatChart },
  props: {
    option: { type: Object, default: () => ({}) },
    hasData: { type: Boolean, default: false },
    emptyTitle: { type: String, default: "还没有访问记录" },
    emptyDesc: { type: String, default: "" },
  },
};
</script>

<style lang="scss" scoped>
.chart-panel {
  display: flex;
  flex-direction: column;
}

.panel-head {
  i {
    cursor: pointer;
  }
}
</style>
