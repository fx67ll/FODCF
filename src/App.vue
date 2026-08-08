<template>
  <div id="app" :class="{ 'mobile-access-enabled': allowMobileAccess }">
    <div id="app-router"><router-view /> <theme-picker /></div>
    <div id="app-tip">非常抱歉！暂不支持宽度小于768px尺寸的设备访问！</div>
  </div>
</template>

<script>
import ThemePicker from "@/components/ThemePicker";

export default {
  name: "App",
  components: {
    ThemePicker,
  },
  computed: {
    allowMobileAccess() {
      const routeAllowsMobile = this.$route.matched.some(
        (record) => record.meta && record.meta.allowMobile === true
      );

      // 异步路由组件完成解析前，直接访问 /status 时 matched 可能仍为空。
      // 先按浏览器地址放行，避免移动端限制文案短暂闪现。
      const initialPath = window.location.pathname.replace(/\/+$/, "") || "/";
      return routeAllowsMobile || this.$route.path === "/status" || initialPath === "/status";
    },
  },
  metaInfo() {
    return {
      title: this.$store.state.settings.dynamicTitle && this.$store.state.settings.title,
      titleTemplate: (title) => {
        return title
          ? `${title} - ${process.env.VUE_APP_TITLE}`
          : process.env.VUE_APP_TITLE;
      },
    };
  },
};
</script>
<style lang="scss" scoped>
#app {
  width: 100%;
  height: 100%;

  #app-router {
    width: 100%;
    height: 100%;
  }

  .theme-picker {
    display: none;
  }

  #app-tip {
    display: none;
  }
}

// 默认不支持小屏设备，路由可通过 allowMobile 元数据显式豁免。
@media screen and (max-width: 767px) {
  #app:not(.mobile-access-enabled) {
    #app-router {
      display: none;
    }

    #app-tip {
      display: block !important;
      text-align: center;
      line-height: 15vw;
      font-size: 10vw;
      padding: 20vw 1vw 0 1vw;
    }
  }
}
</style>
