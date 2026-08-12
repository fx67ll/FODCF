<template>
  <!--
    首页派发组件：根据当前登录用户渲染管理员 / 非管理员首页。
    旧首页已备份至 index-legacy.vue（需求 #1），菜单与路由逻辑保持不变（需求 #7）。
    组件名保持 "Index"，与路由 name 一致，确保 keep-alive 缓存命中。
  -->
  <component :is="homeComponent"></component>
</template>

<script>
import AdminHome from "./home/AdminHome.vue";
import UserHome from "./home/UserHome.vue";

// 超级管理员用户名（与 Navbar.vue 的 isAdmin 判定保持一致）
const SUPER_ADMIN_NAME = "fx67ll";

export default {
  name: "Index",
  components: { AdminHome, UserHome },
  computed: {
    homeComponent() {
      return this.$store.state.user.name === SUPER_ADMIN_NAME ? "AdminHome" : "UserHome";
    },
  },
};
</script>

<style lang="scss">
/* 首页共享样式（全局，供 AdminHome / UserHome 及子组件复用） */
@import "./home/home.scss";
</style>
