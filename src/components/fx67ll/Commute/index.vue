<template>
  <div>
    <i class="el-icon-discover" @click="goto" />
  </div>
</template>
<script>
export default {
  name: "fx67llCommute",
  data() {
    return { url: "https://map.fx67ll.com/daily" };
  },
  methods: {
    /** 新窗口打开日常通勤地图 */
    goto() {
      window.open(this.url, "_blank");
    },
  },
};
</script>
