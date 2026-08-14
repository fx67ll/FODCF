<template>
  <!-- 紧贴面板标题的图标式刷新按钮 + 最后刷新时间戳，共享样式位于 home.scss -->
  <span class="panel-refresh-wrap">
    <button type="button" class="panel-refresh" title="手动刷新" :disabled="loading" @click="$emit('refresh')">
      <i class="el-icon-refresh" :class="{ spinning: loading }"></i>
    </button>
    <span v-if="timestamp" class="panel-refresh-time">{{ timestamp }}</span>
  </span>
</template>

<script>
/**
 * 纯展示刷新按钮：不含业务，取数与时间戳维护由使用方面板完成（配合 refreshMixin）
 */
export default {
  name: "PanelRefresh",
  props: {
    // 刷新进行中：按钮禁用 + 图标无限旋转
    loading: { type: Boolean, default: false },
    // 最后刷新时间戳文案，为空时不展示
    timestamp: { type: String, default: "" },
  },
};
</script>
