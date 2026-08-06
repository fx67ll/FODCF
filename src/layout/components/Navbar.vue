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

    // 右上角图标悬浮语义动效：每个图标悬停时播放与其语义匹配的循环动效
    // 仅在用户未开启「减少动效」系统偏好时启用，兼顾无障碍
    @media (prefers-reduced-motion: no-preference) {
      #header-search:hover ::v-deep .search-icon {
        animation: nav-search-wiggle 0.6s ease-in-out infinite;
      }

      #screenfull:hover ::v-deep .screenfull-icon {
        animation: nav-expand 1.4s ease-in-out infinite;
      }

      #fx67ll-h5:hover ::v-deep .el-icon-mobile-phone {
        animation: nav-phone-vibrate 0.35s linear infinite;
      }

      #fx67ll-monitor:hover ::v-deep .el-icon-monitor {
        animation: nav-monitor-breathe 1.6s ease-in-out infinite;
      }

      #fx67ll-commute:hover ::v-deep .el-icon-discover {
        transform-origin: center;
        animation: nav-compass-wobble 1.2s ease-in-out infinite;
      }

      #fx67ll-notice:hover ::v-deep .el-icon-bell {
        transform-origin: top center;
        animation: nav-bell-ring 0.6s ease-in-out infinite;
      }

      .avatar-container:hover .user-avatar {
        animation: nav-avatar-breathe 1.4s ease-in-out infinite;
      }
    }

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
@keyframes nav-search-wiggle {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes nav-expand {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes nav-phone-vibrate {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-1.5px); }
  40% { transform: translateX(1.5px); }
  60% { transform: translateX(-1.5px); }
  80% { transform: translateX(1.5px); }
}

@keyframes nav-monitor-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}

@keyframes nav-compass-wobble {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-25deg); }
  75% { transform: rotate(25deg); }
}

@keyframes nav-bell-ring {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(18deg); }
  40% { transform: rotate(-18deg); }
  60% { transform: rotate(12deg); }
  80% { transform: rotate(-12deg); }
}

@keyframes nav-avatar-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
</style>
