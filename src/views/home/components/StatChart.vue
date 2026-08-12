<template>
  <div class="stat-chart">
    <div v-if="hasData" ref="canvas" class="stat-chart-canvas"></div>
    <home-empty-state v-else :icon="emptyIcon" :title="emptyTitle" :desc="emptyDesc" />
  </div>
</template>

<script>
import * as echarts from "echarts";
import HomeEmptyState from "./EmptyState.vue";

/**
 * ECharts 轻量封装（对应需求 #3 / #10）
 * - 传入完整 option，自动 init / resize / dispose
 * - hasData 为 false 时展示统一空状态，避免出现空画布
 */
export default {
  name: "HomeStatChart",
  components: { HomeEmptyState },
  props: {
    option: { type: Object, default: () => ({}) },
    hasData: { type: Boolean, default: true },
    emptyIcon: { type: String, default: "el-icon-data-line" },
    emptyTitle: { type: String, default: "暂无访问记录" },
    emptyDesc: { type: String, default: "开始使用后，这里会生成你的数据图表" },
    height: { type: String, default: "260px" },
  },
  data() {
    return { chart: null };
  },
  watch: {
    option: {
      deep: true,
      handler() {
        this.render();
      },
    },
    hasData(value) {
      if (value) {
        this.$nextTick(this.render);
      }
    },
  },
  mounted() {
    if (this.hasData) {
      this.render();
    }
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    handleResize() {
      if (this.chart) this.chart.resize();
    },
    render() {
      if (!this.hasData || !this.$refs.canvas) return;
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.canvas);
      }
      this.chart.setOption(this.option, true);
    },
  },
};
</script>

<style lang="scss" scoped>
.stat-chart {
  width: 100%;
}

.stat-chart-canvas {
  width: 100%;
  height: 260px;
}
</style>
