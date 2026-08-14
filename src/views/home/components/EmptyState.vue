<template>
  <div class="home-empty" :class="{ inline: inline }">
    <div class="home-empty-icon"><i :class="icon"></i></div>
    <p class="home-empty-title">{{ title }}</p>
    <p v-if="desc" class="home-empty-desc">{{ desc }}</p>
  </div>
</template>

<script>
/**
 * 通用空状态（图表无数据时的空状态展示）
 */
export default {
  name: "HomeEmptyState",
  props: {
    icon: { type: String, default: "el-icon-pie-chart" },
    title: { type: String, default: "暂无数据" },
    desc: { type: String, default: "" },
    inline: { type: Boolean, default: false },
  },
};
</script>

<style lang="scss" scoped>
.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 24px 16px;
  text-align: center;
  color: var(--home-muted, #7c8b84);

  &.inline {
    min-height: 120px;
  }
}

.home-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  margin-bottom: 14px;
  color: var(--home-primary, #2ecc71);
  background: var(--home-primary-soft, #e7f8ee);
  border-radius: 16px;
  font-size: 26px;
  opacity: 0.85;
}

.home-empty-title {
  margin: 0;
  color: var(--home-ink, #2b3a36);
  font-size: 14px;
  font-weight: 600;
}

.home-empty-desc {
  margin: 6px 0 0;
  max-width: 260px;
  font-size: 12px;
  line-height: 1.7;
}
</style>
