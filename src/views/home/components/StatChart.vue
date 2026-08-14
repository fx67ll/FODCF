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
 * ECharts 轻量封装
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
        this.$nextTick(this.render);
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
  // keep-alive 重新激活时画布尺寸可能与容器脱节，先校正再按当前数据重绘
  activated() {
    this.$nextTick(() => {
      if (this.chart) {
        this.chart.resize();
        this.chart.setOption(this.option, true);
      }
    });
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
      } else {
        // setOption 不会重新测量容器：面板动画 / 布局变化后画布尺寸可能失真，
        // 先 resize 校正，否则新数据绘制在旧尺寸画布上表现为「图表不刷新」
        this.chart.resize();
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
