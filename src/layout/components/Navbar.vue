<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container"
      @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!topNav" />
    <top-nav id="topmenu-container" class="topmenu-container" v-if="topNav" />

    <div class="right-menu">
      <template v-if="device !== 'mobile'">
        <search id="header-search" class="right-menu-item" />

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <!-- <el-tooltip content="源码地址" placement="bottom">
          <fx67ll-git id="fx67ll-git" class="right-menu-item hover-effect" />
        </el-tooltip> -->

        <el-tooltip content="移动端APP" placement="bottom">
          <fx67ll-h5 id="fx67ll-h5" class="right-menu-item hover-effect" />
        </el-tooltip>

        <!-- 监控大盘：新窗口打开公开服务状态页 -->
        <el-tooltip content="监控大盘" placement="bottom">
          <fx67ll-monitor id="fx67ll-monitor" class="right-menu-item hover-effect" />
        </el-tooltip>

        <!-- 日常通勤：新窗口打开通勤地图（仅超级管理员可见） -->
        <el-tooltip v-if="isAdmin" content="日常通勤" placement="bottom">
          <fx67ll-commute id="fx67ll-commute" class="right-menu-item hover-effect" />
        </el-tooltip>

        <!-- 通知公告铃铛 -->
        <el-tooltip content="通知公告" placement="bottom">
          <fx67ll-notice id="fx67ll-notice" class="right-menu-item hover-effect" />
        </el-tooltip>

        <!-- <el-tooltip content="布局大小" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip> -->
      </template>

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar" />
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/user/profile" v-if="!isUser">
            <el-dropdown-item>个人中心</el-dropdown-item>
          </router-link>
          <el-dropdown-item @click.native="setting = true">
            <span>布局设置</span>
          </el-dropdown-item>
          <el-dropdown-item divided @click.native="logout">
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Breadcrumb from "@/components/Breadcrumb";
import TopNav from "@/components/TopNav";
import Hamburger from "@/components/Hamburger";
import Screenfull from "@/components/Screenfull";
import SizeSelect from "@/components/SizeSelect";
import Search from "@/components/HeaderSearch";
import fx67llGit from "@/components/fx67ll/Git";
import fx67llH5 from "@/components/fx67ll/H5";
import fx67llMonitor from "@/components/fx67ll/Monitor";
import fx67llNotice from "@/components/fx67ll/Notice";
import fx67llCommute from "@/components/fx67ll/Commute";

import Cookies from "js-cookie";

export default {
  components: {
    Breadcrumb,
    TopNav,
    Hamburger,
    Screenfull,
    SizeSelect,
    Search,
    fx67llGit,
    fx67llH5,
    fx67llMonitor,
    fx67llNotice,
    fx67llCommute,
  },
  data() {
    return {
      isUser: false,
    };
  },
  mounted() {
    if (
      Cookies.get("username") === "user" ||
      parseInt(Cookies.get("userId")) > 100000
    ) {
      this.isUser = true;
    } else {
      this.isUser = false;
    }
  },
  computed: {
    ...mapGetters(["sidebar", "avatar", "device", "name"]),
    // 是否为 fx67ll 超级管理员
    isAdmin() {
      return this.name === "fx67ll";
    },
    setting: {
      get() {
        return this.$store.state.settings.showSettings;
      },
      set(val) {
        this.$store.dispatch("settings/changeSetting", {
          key: "showSettings",
          value: val,
        });
      },
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav;
      },
    },
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch("app/toggleSideBar");
    },
    async logout() {
      this.$confirm("确定注销并退出系统吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$store.dispatch("LogOut").then(() => {
            location.href = "/index";
          });
        })
        .catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    // transform 对普通行内元素的兼容性不一致，统一建立可变换的行内块。
    #header-search ::v-deep .search-icon,
    #screenfull ::v-deep .screenfull-icon,
    #fx67ll-h5 ::v-deep .el-icon-mobile-phone,
    #fx67ll-monitor ::v-deep .el-icon-monitor,
    #fx67ll-commute ::v-deep .el-icon-discover,
    #fx67ll-notice ::v-deep .el-icon-bell {
      display: inline-block;
      backface-visibility: hidden;
      will-change: transform;
    }

    #header-search:hover ::v-deep .search-icon {
      animation: nav-search-inspect 0.9s ease-in-out infinite;
    }

    #screenfull:hover ::v-deep .screenfull-icon {
      animation: nav-fullscreen-expand 1.2s ease-in-out infinite;
    }

    #fx67ll-h5:hover ::v-deep .el-icon-mobile-phone {
      animation: nav-phone-vibrate 0.35s linear infinite;
    }

    #fx67ll-monitor:hover ::v-deep .el-icon-monitor {
      animation: nav-monitor-scan 1.1s ease-in-out infinite;
    }

    #fx67ll-commute:hover ::v-deep .el-icon-discover {
      transform-origin: center;
      animation: nav-compass-sway 3.2s ease-in-out infinite;
    }

    #fx67ll-notice:hover ::v-deep .el-icon-bell {
      transform-origin: top center;
      animation: nav-bell-ring 0.6s ease-in-out infinite;
    }

    .avatar-container:hover .user-avatar {
      animation: nav-avatar-glow 1.5s ease-in-out infinite;
      will-change: box-shadow, border-radius;
    }

    // 产品决策：右上角图标悬浮动效在所有主流浏览器中保持一致，主动忽略
    // 系统级「减少动态效果」设置，避免不同设备效果不一致（曾因该设置导致动效在家用浏览器失效）。
    // 若后续需恢复无障碍降级，可重新引入 @media (prefers-reduced-motion: reduce) 分支。

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>

<style lang="scss">
/*
 * 首页右上角图标悬浮语义动效 keyframes（全局，供上方 scoped 样式引用）
 * 动效与图标语义一一对应，各不相同
 */
@keyframes nav-search-inspect {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  25% {
    transform: translate(-2px, -1px) scale(1.05);
  }

  50% {
    transform: translate(1px, -2px) scale(1.1);
  }

  75% {
    transform: translate(2px, 1px) scale(1.05);
  }
}

@keyframes nav-fullscreen-expand {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }
}

@keyframes nav-phone-vibrate {

  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-1.5px);
  }

  40% {
    transform: translateX(1.5px);
  }

  60% {
    transform: translateX(-1.5px);
  }

  80% {
    transform: translateX(1.5px);
  }
}

@keyframes nav-monitor-scan {

  0%,
  100% {
    transform: translateY(0);
    filter: brightness(1);
  }

  50% {
    transform: translateY(-3px);
    filter: brightness(1.35);
  }
}

@keyframes nav-compass-sway {

  0%,
  8% {
    transform: rotate(0deg) scale(1);
  }

  12% {
    transform: rotate(5deg) scale(1.02);
  }

  19% {
    transform: rotate(-26deg) scale(1.09);
  }

  28% {
    transform: rotate(22deg) scale(1.08);
  }

  36% {
    transform: rotate(-16deg) scale(1.06);
  }

  43% {
    transform: rotate(10deg) scale(1.04);
  }

  49% {
    transform: rotate(-6deg) scale(1.03);
  }

  54% {
    transform: rotate(3deg) scale(1.01);
  }

  58%,
  72% {
    transform: rotate(0deg) scale(1);
  }

  78% {
    transform: rotate(8deg) scale(1.03);
  }

  84% {
    transform: rotate(-6deg) scale(1.02);
  }

  89% {
    transform: rotate(3deg) scale(1.01);
  }

  93% {
    transform: rotate(-1deg) scale(1);
  }

  96%,
  100% {
    transform: rotate(0deg) scale(1);
  }
}

@keyframes nav-bell-ring {

  0%,
  100% {
    transform: rotate(0deg);
  }

  20% {
    transform: rotate(18deg);
  }

  40% {
    transform: rotate(-18deg);
  }

  60% {
    transform: rotate(12deg);
  }

  80% {
    transform: rotate(-12deg);
  }
}

@keyframes nav-avatar-glow {

  0%,
  100% {
    border-radius: 10px;
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }

  50% {
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.22);
  }
}
</style>
