<template>
  <article class="metric-card">
    <span class="metric-icon" :class="altClass"><i :class="icon"></i></span>
    <div class="metric-body">
      <span class="metric-value" :class="{ text: textMode }">
        <animated-number v-if="isCountable" :value="Number(value)" :trigger="trigger" />
        <template v-else>{{ value }}</template>
      </span>
      <span class="metric-label">{{ label }}</span>
    </div>
    <small v-if="note" class="metric-note">{{ note }}</small>
  </article>
</template>

<script>
import AnimatedNumber from "./AnimatedNumber.vue";

/**
 * 通用指标小卡片（卡片级抽取）
 * 替换 AdminHome / UserHome .metric-grid 内手写的 <article>，
 * 视觉与原 .metric-card 完全一致（样式由 home.scss 全局提供）。
 */
export default {
  name: "HomeMetricCard",
  components: { AnimatedNumber },
  props: {
    icon: { type: String, default: "el-icon-menu" },
    value: { type: [String, Number], default: "" },
    label: { type: String, default: "" },
    note: { type: String, default: "" },
    // 指标图标配色变体：'' / 'alt-1' / 'alt-2' / 'alt-3'
    alt: { type: String, default: "" },
    // 文本型指标���如「运行中」），用较小字号
    textMode: { type: Boolean, default: false },
    // 透传给 AnimatedNumber 的刷新触发器，主动刷新后重播滚动
    trigger: { type: Number, default: 0 },
  },
  computed: {
    altClass() {
      return this.alt || "";
    },
    // 数值型指标启用滚动计数；文本型 / 非有限数字直接展示
    isCountable() {
      return !this.textMode && typeof this.value !== "boolean" && Number.isFinite(Number(this.value)) && String(this.value).trim() !== "";
    },
  },
};
</script>
