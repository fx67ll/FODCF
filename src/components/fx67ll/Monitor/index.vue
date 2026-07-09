<template>
  <div>
    <i class="el-icon-monitor" @click="goto" />
  </div>
</template>

<script>
export default {
  name: "fx67llMonitor",
  methods: {
    /** 新窗口打开公开服务状态大盘（/status 在 constantRoutes 中，免登录可访问） */
    goto() {
      const { origin } = window.location;
      window.open(origin + "/status", "_blank");
    },
  },
};
</script>
