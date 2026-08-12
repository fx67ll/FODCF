<template>
  <main class="home-shell user-home">
    <!-- 公告条（需求 #5：保留非管理员首页公告条） -->
    <home-notice-banner class="reveal" />

    <!-- 欢迎区 -->
    <section class="welcome-hero reveal reveal-1">
      <div class="welcome-copy">
        <span class="hero-kicker"><i class="el-icon-s-custom"></i> WELCOME TO FODCF</span>
        <h1>{{ greeting }}，{{ userName }}</h1>
        <p>你的轻量工作台已经准备好。常用入口会根据最近一周的使用习惯自动排列。</p>
        <div class="session-line">
          <span><i class="el-icon-circle-check"></i> 当前会话已认证</span>
          <span><i class="el-icon-date"></i> {{ dateText }}</span>
        </div>
      </div>
      <div class="welcome-visual">
        <span class="visual-orbit orbit-a"></span>
        <span class="visual-orbit orbit-b"></span>
        <div class="visual-badge"><i class="el-icon-sunny"></i></div>
        <small>轻量 · 清晰 · 安全</small>
      </div>
    </section>

    <!-- 旧首页迁移内容置顶（需求 #7） -->
    <origin-block />


    <!-- 项目技术架构 + 隐私说明 -->
    <section class="panel arch-panel reveal reveal-5">
      <div class="panel-head">
        <div>
          <span class="eyebrow">ARCHITECTURE</span>
          <h3>项目技术架构</h3>
        </div>
        <i class="el-icon-cpu panel-glyph glyph-pulse"></i>
      </div>
      <div class="tech-flow">
        <div class="tech-node"><span>VIEW</span><strong>Vue 2</strong><small>响应式界面</small></div>
        <i class="el-icon-right"></i>
        <div class="tech-node"><span>UI</span><strong>Element</strong><small>组件体系</small></div>
        <i class="el-icon-right"></i>
        <div class="tech-node"><span>API</span><strong>Axios</strong><small>安全通信</small></div>
        <i class="el-icon-right"></i>
        <div class="tech-node"><span>STORE</span><strong>Vuex</strong><small>状态管理</small></div>
      </div>
      <p class="privacy-note">
        <i class="el-icon-lock"></i>
        首页仅展示账户基础信息、浏览器本机使用统计及公开服务状态，不加载任何业务敏感数据。
      </p>
    </section>

    <!-- 关键指标（仅非敏感信息，左两张对齐管理员首页） -->
    <section class="metric-grid reveal reveal-2">
      <home-metric-card icon="el-icon-menu" :value="accessibleMenus.length" label="可访问菜单" note="当前权限范围" />
      <home-metric-card icon="el-icon-date" alt="alt-1" :value="summary.activeDays" label="活跃天数" note="最近 7 个自然日" />
      <home-metric-card icon="el-icon-mouse" alt="alt-2" :value="summary.totalVisits" label="一周访问次数" note="本机记录" />
      <home-metric-card icon="el-icon-connection" alt="alt-3" :value="serviceBadge" label="服务状态" :text-mode="true" />
    </section>

    <!-- 常用入口 + 访问趋势（仅本机数据） -->
    <section class="grid two-col reveal reveal-3">
      <home-quick-access :items="quickItems" />
      <home-trend-chart-panel :option="trendOption" :has-data="summary.totalVisits > 0" empty-title="还没有访问记录"
        empty-desc="打开任意菜单后，这里会生成你的访问趋势" />
    </section>

    <!-- 账户与活动 + 服务脉搏 + 常用链接 -->
    <section class="grid three-col reveal reveal-4">
      <section class="panel info-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">ACCOUNT &amp; ACTIVITY</span>
            <h3>账户与活动</h3>
          </div>
          <i class="el-icon-user-solid panel-glyph glyph-bounce"></i>
        </div>
        <ul class="info-list">
          <li><span>账户</span><strong>{{ userName }}</strong></li>
          <li><span>角色</span><strong>{{ roleText }}</strong></li>
          <!-- 需求 #6：移除始终为空的用户编号行，改为展示头像（每次登录必定有值） -->
          <li class="avatar-row"><span>头像</span><img class="info-avatar" :src="avatar" :alt="userName" /></li>
        </ul>
        <div class="info-activity">
          <span class="eyebrow">最近活动 · 本机</span>
          <div v-if="recentActivities.length" class="activity-strip">
            <button v-for="item in recentActivities" :key="item.path" type="button" class="activity-chip"
              @click="goPath(item.path)">
              <i class="el-icon-time"></i>{{ item.title }}
            </button>
          </div>
          <p v-else class="activity-empty">还没有活动记录，访问过的菜单会出现在这里。</p>
        </div>
      </section>

      <home-service-status />

      <section class="panel links-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">FRIENDLY LINKS</span>
            <h3>常用链接</h3>
          </div>
          <i class="el-icon-link panel-glyph glyph-nudge"></i>
        </div>
        <a v-for="link in friendlyLinks" :key="link.name" :href="link.url" target="_blank" rel="noopener noreferrer"
          class="link-item">
          <span class="link-icon" :style="{ background: link.color }"><i :class="link.icon"></i></span>
          <span class="link-copy">
            <strong>{{ link.name }}</strong>
            <small>{{ link.desc }}</small>
          </span>
          <i class="el-icon-arrow-right"></i>
        </a>
      </section>
    </section>

    <!-- 最近活动时间线（需求 #4：置于项目技术架构卡片下方，复用管理员首页优化版） -->
    <home-recent-activity class="reveal reveal-6 recent-spacer" :items="recentItems" @navigate="goPath" />

    <!-- 底部备忘录（需求 #2：从公告条后移至页面底部） -->
    <home-memo-block class="reveal reveal-6" />
  </main>
</template>

<script>
import { getMenuUsageSummary } from "@/utils/menu-frequency";
import { collectAccessibleMenus, greetingText, formatClock, buildTrendOption } from "./helpers";
import { NOTICE_PUBLIC_PATH } from "@/views/system/notice/constants";
import HomeNoticeBanner from "./components/NoticeBanner.vue";
import HomeMemoBlock from "./components/MemoBlock.vue";
import HomeRecentActivity from "./components/RecentActivity.vue";
import OriginBlock from "./components/OriginBlock.vue";
import HomeQuickAccess from "./components/QuickAccess.vue";
import HomeMetricCard from "./components/MetricCard.vue";
import HomeTrendChartPanel from "./components/TrendChartPanel.vue";
import HomeServiceStatus from "./components/ServiceStatus.vue";

export default {
  name: "UserHome",
  components: { HomeNoticeBanner, HomeMemoBlock, HomeRecentActivity, OriginBlock, HomeQuickAccess, HomeMetricCard, HomeTrendChartPanel, HomeServiceStatus },
  data() {
    return {
      now: new Date(),
      timer: null,
      summary: getMenuUsageSummary(this.$store.state.user.name),
      friendlyLinks: [
        { name: "FODCF 移动端", desc: "轻量生活应用", url: "https://life.fx67ll.com/", icon: "el-icon-mobile-phone", color: "#2ecc71" },
        { name: "系统公告", desc: "查看公告来信", url: NOTICE_PUBLIC_PATH, icon: "el-icon-bell", color: "#f5b041" },
        { name: "系统服务状态", desc: "公开脱敏状态大盘", url: "/status", icon: "el-icon-monitor", color: "#58d68d" },
        { name: "Element UI", desc: "前端组件文档", url: "https://element.eleme.cn/", icon: "el-icon-guide", color: "#5dade2" },
        { name: "Vue.js", desc: "渐进式框架官网", url: "https://vuejs.org/", icon: "el-icon-reading", color: "#af7ac5" },
      ],
    };
  },
  computed: {
    userName() {
      return this.$store.state.user.name || "用户";
    },
    // 需求 #6：头像（替代始终为空的用户编号）
    avatar() {
      return this.$store.getters.avatar || "";
    },
    roles() {
      return this.$store.getters.roles || [];
    },
    roleText() {
      return this.roles.length ? this.roles.join(" / ") : "普通用户";
    },
    greeting() {
      return greetingText();
    },
    dateText() {
      return formatClock(this.now);
    },
    serviceBadge() {
      // 仅作为概要文字展示，具体状态由服务脉搏面板拉取
      return "运行中";
    },
    accessibleMenus() {
      return collectAccessibleMenus(this.$store.getters.sidebarRouters);
    },
    quickItems() {
      const allowed = new Set(this.accessibleMenus.map((item) => item.path));
      const frequent = this.summary.topMenus.filter((item) => allowed.has(item.path)).slice(0, 6);
      // 默认入口排除「表单构建」(/tool/build)，避免低频构建工具占据常用位
      const isFormBuilder = (item) => /\/tool\/build/.test(item.path) || /表单构建/.test(item.title || "");
      return frequent.length ? frequent : this.accessibleMenus.filter((item) => !isFormBuilder(item)).slice(0, 6);
    },
    trendOption() {
      return buildTrendOption(this.summary.dailyTrend);
    },
    recentActivities() {
      return this.summary.recentMenus.slice(0, 4);
    },
    // 最近活动时间线数据（需求 #4）：交由 RecentActivity 组件内置上限与滚动
    recentItems() {
      return this.summary.recentMenus || [];
    },
  },
  mounted() {
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 30000);
  },
  activated() {
    this.summary = getMenuUsageSummary(this.userName);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    goPath(path) {
      if (!path) return;
      this.$router.push(path).catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;

/* ===== 欢迎区 ===== */
.welcome-hero {
  position: relative;
  display: flex;
  min-height: 200px;
  align-items: center;
  justify-content: space-between;
  padding: 32px 40px;
  margin: 18px 0;
  overflow: hidden;
  background: linear-gradient(120deg, #e9f9ef, #f6fcf9 55%, #ffffff);
  border: 1px solid #d3eede;
  border-radius: var(--home-radius);
  box-shadow: var(--home-shadow);
}

.welcome-copy {
  position: relative;
  z-index: 2;

  h1 {
    margin: 9px 0 12px;
    color: $ink;
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 600;
  }

  p {
    max-width: 620px;
    margin: 0;
    color: $muted;
    font-size: 14px;
    line-height: 1.8;
  }
}

.hero-kicker {
  color: $primary-dark;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;

  i {
    margin-right: 5px;
  }
}

.session-line {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 22px;
  color: #5f746f;
  font-size: 12px;

  i {
    margin-right: 4px;
    color: $primary;
  }
}

.welcome-visual {
  position: relative;
  display: flex;
  width: 160px;
  height: 160px;
  flex: 0 0 160px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $primary;
}

.visual-badge {
  position: relative;
  z-index: 2;
  display: flex;
  width: 84px;
  height: 84px;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #c7ebd3;
  border-radius: 26px;
  box-shadow: 0 12px 28px rgba(46, 204, 113, 0.18);
  transform: rotate(8deg);

  i {
    font-size: 38px;
    transform: rotate(-8deg);
  }
}

.welcome-visual small {
  position: relative;
  z-index: 2;
  margin-top: 16px;
  color: #6f8498;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.visual-orbit {
  position: absolute;
  border: 1px solid rgba(46, 204, 113, 0.22);
  border-radius: 50%;
}

.orbit-a {
  width: 150px;
  height: 150px;
}

.orbit-b {
  width: 112px;
  height: 112px;
  border-color: rgba(46, 204, 113, 0.4);
}

/* ===== 指标网格 ===== */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
}

.metric-value {
  &.text {
    font-size: 18px;
    word-break: break-all;
  }
}

.metric-icon {
  &.alt-1 {
    background: #f5b041;
  }

  &.alt-2 {
    background: #5dade2;
  }

  &.alt-3 {
    background: #af7ac5;
  }
}

/* ===== 通用网格 ===== */
.grid {
  display: grid;
  gap: 18px;
  margin-bottom: 18px;
}

.two-col {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
}

.three-col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chart-panel,
.info-panel,
.links-panel,
.arch-panel {
  display: flex;
  flex-direction: column;
}

.arch-panel {
  margin-top: 18px;
}

.panel-glyph {
  color: $primary;
  font-size: 22px;
}

/* ===== 账户与活动 ===== */
.info-list {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eef3f0;
    font-size: 13px;

    span {
      color: $muted;
    }

    strong {
      color: $ink;
    }
  }
}

/* 需求 #6：头像行（替代空用户编号） */
.info-list li.avatar-row {
  align-items: center;
}

.info-avatar {
  width: 38px;
  height: 38px;
  border: 1px solid var(--home-border);
  border-radius: 50%;
  background: var(--home-primary-softer);
  object-fit: cover;
}

/* 需求 #6：最近活动卡片上方补足间距 */
.recent-spacer {
  margin-top: 18px;
}

.info-activity {
  padding-top: 4px;
}

.activity-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.activity-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  color: $primary-dark;
  background: var(--home-primary-softer);
  border: 1px solid var(--home-border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.25s ease;

  i {
    color: $primary;
  }

  &:hover {
    color: #fff;
    background: $primary;
    border-color: $primary;

    i {
      color: #fff;
    }
  }
}

.activity-empty {
  margin: 10px 0 0;
  color: $muted;
  font-size: 12px;
  line-height: 1.7;
}

/* ===== 常用链接 ===== */
.link-item {
  display: flex;
  align-items: center;
  padding: 11px 0;
  color: $ink;
  border-bottom: 1px solid #eef3f0;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(3px);
  }

  &:last-child {
    border-bottom: 0;
  }
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  margin-right: 12px;
  color: #fff;
  border-radius: 11px;
  font-size: 18px;
}

.link-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;

  strong {
    font-size: 14px;
  }

  small {
    margin-top: 4px;
    color: $muted;
    font-size: 11px;
  }
}

.link-item>i {
  color: #a6aeaa;
}

/* ===== 技术架构 ===== */
.tech-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.tech-flow>i {
  color: #b9dec6;
}

.tech-node {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  text-align: center;

  span {
    color: $primary-dark;
    font-size: 9px;
    letter-spacing: 0.12em;
  }

  strong {
    margin: 5px 0;
    color: $ink;
    font-size: 15px;
  }

  small {
    color: $muted;
    font-size: 10px;
  }
}

.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 22px 0 0;
  padding: 12px 14px;
  background: var(--home-primary-softer);
  border-left: 3px solid $primary;
  border-radius: 6px;
  color: #5f746f;
  font-size: 12px;
  line-height: 1.7;

  i {
    margin-top: 2px;
    color: $primary;
  }
}

.panel-head {
  i {
    cursor: pointer;
  }
}

/* ===== 响应式 ===== */
@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .three-col {
    grid-template-columns: repeat(2, 1fr);
  }

  .arch-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {

  .two-col,
  .three-col {
    grid-template-columns: 1fr;
  }

  .welcome-visual {
    display: none;
  }
}

@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .tech-flow {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .tech-node {
    flex: 0 0 40%;
  }

  .tech-flow>i {
    display: none;
  }
}
</style>
