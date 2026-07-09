<template>
  <div class="notice-bell">
    <i class="el-icon-bell" @click="goto" />
  </div>
</template>

<script>
import { getNoticePath } from "@/views/system/notice/constants";

export default {
  name: "fx67llNotice",
  methods: {
    /** 跳转公告列表页：超级管理员 fx67ll 进公告管理，其他人进公开公告列表 */
    goto() {
      const path = getNoticePath(this.$store.state.user.name);
      this.$router.push(path).catch(() => { });
    },
  },
};
</script>
