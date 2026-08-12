<template>
  <article class="metric-card">
    <span class="metric-icon" :class="altClass"><i :class="icon"></i></span>
    <div class="metric-body">
      <span class="metric-value" :class="{ text: textMode }">{{ value }}</span>
      <span class="metric-label">{{ label }}</span>
    </div>
    <small v-if="note" class="metric-note">{{ note }}</small>
  </article>
</template>

<script>
/**
 * 通用指标小卡片（卡片级抽取，需求 #5b）
 * 替换 AdminHome / UserHome .metric-grid 内手写的 <article>，
 * 视觉与原 .metric-card 完全一致（样式由 home.scss 全局提供）。
 */
export default {
  name: "HomeMetricCard",
  props: {
    icon: { type: String, default: "el-icon-menu" },
    value: { type: [String, Number], default: "" },
    label: { type: String, default: "" },
    note: { type: String, default: "" },
    // 指标图标配色变体：'' / 'alt-1' / 'alt-2' / 'alt-3'
    alt: { type: String, default: "" },
    // 文本型指标（如「运行中」），用较小字号
    textMode: { type: Boolean, default: false },
  },
  computed: {
    altClass() {
      return this.alt || "";
    },
  },
};
</script>
