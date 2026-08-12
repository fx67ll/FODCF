<template>
  <main class="home-shell admin-home">
    <!-- 顶部欢迎区 -->
    <section class="hero reveal">
      <div class="hero-copy">
        <span class="hero-kicker"><i class="el-icon-s-operation"></i> ADMINISTRATOR CONSOLE · FODCF</span>
        <h1>{{ greeting }}，{{ userName }}</h1>
        <p>管理员数据工作台 · https://vip.fx67ll.com</p>
        <p class="hero-tip"><i class="el-icon-magic-stick"></i> 今日 · {{ fresh.tip }}</p>
        <div class="hero-actions">
          <button type="button" class="hero-btn primary" @click="openFirstQuick">
            <i class="el-icon-position"></i>
            <span class="hero-btn-copy">
              <strong>继续最近工作</strong>
              <small v-if="resumeTarget">{{ resumeTarget }}</small>
            </span>
          </button>
          <button class="hero-btn secondary security" type="button" @click="openFail2Ban">
            <i class="el-icon-key"></i>
            <span class="hero-btn-copy">
              <strong class="hero-defence">安全防护</strong>
              <small class="hero-stat" :class="{ loaded: fail2banAttackCount !== null }">
                <template v-if="fail2banAttackCount !== null">
                  已拦截 <b>{{ formatAttackCount(fail2banAttackCount) }}</b> 次攻击
                </template>
                <template v-else>防护运行中</template>
              </small>
            </span>
          </button>
        </div>
      </div>
      <div class="hero-time">
        <span>{{ nowDate }}</span>
        <strong>{{ nowTime }}</strong>
        <small><i class="el-icon-circle-check"></i> 控制台数据已就绪</small>
        <small class="hero-quote"><i class="el-icon-coffee"></i> {{ fresh.quote }}</small>
      </div>
      <span class="hero-orbit orbit-a"></span>
      <span class="hero-orbit orbit-b"></span>
    </section>

    <!-- 旧首页迁移内容置顶（需求 #7） -->
    <origin-block />

    <!-- 关键指标 -->
    <section class="metric-grid reveal reveal-1">
      <home-metric-card icon="el-icon-menu" :value="accessibleMenus.length" label="可访问菜单" note="当前权限范围" />
      <home-metric-card icon="el-icon-mouse" alt="alt-1" :value="summary.totalVisits" label="一周打开次数" note="本机聚合记录" />
      <home-metric-card icon="el-icon-date" alt="alt-2" :value="summary.activeDays" label="活跃天数" note="最近 7 个自然日" />
      <home-metric-card icon="el-icon-tickets" alt="alt-3" :value="lotteryTotalBets" label="累计购买注数" note="号码台账累计" />
    </section>

    <!-- 常用入口 + 访问趋势 -->
    <section class="grid two-col reveal reveal-2">
      <home-quick-access :items="quickItems" />
      <home-trend-chart-panel :option="trendOption" :has-data="summary.totalVisits > 0" empty-title="还没有访问记录"
        empty-desc="打开任意业务菜单后，这里会生成近 7 天访问趋势" />
    </section>

    <!-- 号码台账统计（需求 #8）+ 服务脉搏 + 日常通勤（需求 #9） -->
    <section class="grid three-col reveal reveal-3">
      <section class="panel lottery-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">NUMBER LEDGER</span>
            <h3>号码台账</h3>
          </div>
          <button v-if="lotteryPath" type="button" class="panel-glyph-btn" title="号码台账" @click="goPath(lotteryPath)">
            <i class="el-icon-coin panel-glyph glyph-rotate"></i>
          </button>
          <i v-else class="el-icon-coin panel-glyph glyph-rotate"></i>
        </div>

        <div class="lottery-summary">
          <div>
            <strong>￥{{ lotteryTotalSpent }}</strong>
            <small>总购买金额</small>
          </div>
          <div>
            <strong>￥{{ lotteryTotalWon }}</strong>
            <small>中奖金额</small>
          </div>
          <div>
            <strong :class="{ positive: lotteryRecovery >= 100 }">{{ lotteryRecovery }}%</strong>
            <small>利润回本率</small>
          </div>
        </div>

        <div v-if="lotteryHasData" class="lottery-chart">
          <home-stat-chart :option="lotteryTypeOption" :has-data="true" empty-icon="el-icon-coin" empty-title="暂无号码台账数据"
            empty-desc="在号码台账页录入记录后，这里会按彩种汇总购买与中奖金额" />
        </div>
        <home-empty-state v-else inline icon="el-icon-coin" title="暂无号码台账数据" desc="在号码台账页录入记录后，这里会按彩种汇总购买与中奖金额" />

        <button v-if="lotteryPath" type="button" class="panel-link" @click="goPath(lotteryPath)">
          平平淡淡才是真 <i class="el-icon-right"></i>
        </button>
      </section>

      <home-service-status />

      <section class="panel commute-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">DAILY COMMUTE</span>
            <h3>日常通勤</h3>
          </div>
          <button type="button" class="panel-glyph-btn compass" title="通勤地图（新窗口打开）" @click="openCommuteMap">
            <i class="el-icon-discover panel-glyph compass-needle"></i>
          </button>
        </div>
        <div class="commute-frame">
          <iframe v-if="commuteLoaded" :src="commuteUrl" title="日常通勤地图" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade" @load="commuteLoading = false"></iframe>
          <div v-if="commuteLoading" class="commute-loading"><i class="el-icon-loading"></i> 正在加载通勤地图…</div>
        </div>
        <a class="panel-link" :href="commuteUrl" target="_blank" rel="noopener noreferrer">
          在新窗口打开 <i class="el-icon-top-right"></i>
        </a>
      </section>
    </section>

    <!-- 未开奖号码快捷核对（需求 #3）+ Tomcat 服务管理（需求 #5） -->
    <section class="grid two-col reveal reveal-4">
      <home-undrawn-numbers />
      <home-tomcat-control />
    </section>

    <!-- 最近活动时间线（需求 #3：时间线增强，按最近访问时间回溯，与常用入口按频率区分） -->
    <home-recent-activity class="reveal reveal-5" :items="recentItems" @navigate="goPath" />

    <!-- 底部备忘录（需求 #2：与管理员首页其他模块统一） -->
    <home-memo-block class="reveal reveal-5" />
  </main>
</template>

<script>
import { listTotalReward } from "@/api/fx67ll/lottery/log";
import { getFail2banStatus } from "@/api/fx67ll/server/fail2ban";
import { getMenuUsageSummary } from "@/utils/menu-frequency";
import {
  collectAccessibleMenus,
  greetingText,
  buildTrendOption,
  buildLotteryTypeOption,
  dailyFreshContent,
  pickDefaultQuickMenus,
} from "./helpers";
import OriginBlock from "./components/OriginBlock.vue";
import HomeQuickAccess from "./components/QuickAccess.vue";
import HomeStatChart from "./components/StatChart.vue";
import HomeMetricCard from "./components/MetricCard.vue";
import HomeTrendChartPanel from "./components/TrendChartPanel.vue";
import HomeServiceStatus from "./components/ServiceStatus.vue";
import HomeEmptyState from "./components/EmptyState.vue";
import HomeMemoBlock from "./components/MemoBlock.vue";
import HomeRecentActivity from "./components/RecentActivity.vue";
import HomeUndrawnNumbers from "./components/UndrawnNumbers.vue";
import HomeTomcatControl from "./components/TomcatControl.vue";

const LOTTERY_TYPE_LABEL = { 1: "大乐透", 2: "双色球", 3: "排列三", 4: "排列五", 5: "七星彩" };

export default {
  name: "AdminHome",
  components: { OriginBlock, HomeQuickAccess, HomeStatChart, HomeMetricCard, HomeTrendChartPanel, HomeServiceStatus, HomeEmptyState, HomeMemoBlock, HomeRecentActivity, HomeUndrawnNumbers, HomeTomcatControl },
  data() {
    return {
      now: new Date(),
      timer: null,
      summary: getMenuUsageSummary(this.$store.state.user.name),
      fresh: dailyFreshContent(),
      // 号码台账逐彩种聚合（来自后端 listTotalReward，与统计弹窗同源）
      lotteryTotalRewards: [],
      // 需求 #1：Fail2Ban 拦截攻击次数（用于丰富安全防护按钮标签）；null 表示未加载 / 不可用
      fail2banAttackCount: null,
      commuteUrl: "https://map.fx67ll.com/daily",
      commuteLoaded: false,
      commuteLoading: true,
    };
  },
  computed: {
    userName() {
      return this.$store.state.user.name || "管理员";
    },
    greeting() {
      return greetingText();
    },
    nowDate() {
      const pad = (value) => String(value).padStart(2, "0");
      return `${this.now.getFullYear()}.${pad(this.now.getMonth() + 1)}.${pad(this.now.getDate())}`;
    },
    nowTime() {
      const pad = (value) => String(value).padStart(2, "0");
      return `${pad(this.now.getHours())}:${pad(this.now.getMinutes())}`;
    },
    accessibleMenus() {
      return collectAccessibleMenus(this.$store.getters.sidebarRouters);
    },
    // 需求 #2：「继续最近工作」按钮描述即将恢复的任务（取首个常用入口标题）
    resumeTarget() {
      return this.quickItems.length ? this.quickItems[0].title : "";
    },
    quickItems() {
      const allowed = new Set(this.accessibleMenus.map((item) => item.path));
      const frequent = this.summary.topMenus.filter((item) => allowed.has(item.path)).slice(0, 6);
      if (frequent.length) return frequent;
      // 无本机使用记录：按时段优先级匹配默认入口（需求 #4 / #5）
      const defaults = pickDefaultQuickMenus(this.accessibleMenus, new Date().getHours());
      return defaults.length
        ? defaults
        : this.accessibleMenus.filter((item) => item.path !== "/index").slice(0, 6);
    },
    trendOption() {
      return buildTrendOption(this.summary.dailyTrend);
    },
    // 按 numberType 聚合，固定输出 5 个彩种（含无记录的彩种，保证���表稳定呈现）
    // 数据源：后端 listTotalReward（与「历史号码中奖金额统计」弹窗同源），修正前端聚合偏差（需求 #4）
    lotteryTypeStats() {
      const labelToType = {};
      Object.entries(LOTTERY_TYPE_LABEL).forEach(([type, label]) => {
        labelToType[label] = Number(type);
      });
      const byType = {};
      (this.lotteryTotalRewards || []).forEach((row) => {
        const type = labelToType[row.lotteryType];
        if (!type) return; // 未知彩种聚合行忽略，保证图表稳定
        byType[type] = {
          type,
          tickets: Number(row.totalTickets) || 0,
          numbers: Number(row.totalNumbers) || 0,
          won: Number(row.totalWinningAmount) || 0,
        };
      });
      return [1, 2, 3, 4, 5].map((type) => {
        const stat = byType[type] || { type, tickets: 0, numbers: 0, won: 0 };
        // 每注 ￥2，总花费 = 注数 × 2（与统计弹窗口径一致）
        const spent = stat.numbers * 2;
        const recovery = spent ? Math.round((stat.won / spent) * 100) : 0;
        return { ...stat, label: LOTTERY_TYPE_LABEL[type] || `彩种${type}`, spent, recovery };
      });
    },
    lotteryTotalTickets() {
      return this.lotteryTypeStats.reduce((sum, stat) => sum + stat.tickets, 0);
    },
    // 累计购买注数（需求 #2：指标卡由「期数」改为「注数」）
    lotteryTotalBets() {
      return this.lotteryTypeStats.reduce((sum, stat) => sum + stat.numbers, 0);
    },
    lotteryTotalSpent() {
      return this.lotteryTypeStats.reduce((sum, stat) => sum + stat.spent, 0);
    },
    lotteryTotalWon() {
      return this.lotteryTypeStats.reduce((sum, stat) => sum + stat.won, 0);
    },
    lotteryRecovery() {
      const spent = this.lotteryTotalSpent;
      if (!spent) return 0;
      const rate = (this.lotteryTotalWon / spent) * 100;
      return Math.round(rate * 10) / 10;
    },
    lotteryHasData() {
      return this.lotteryTotalTickets > 0;
    },
    lotteryTypeOption() {
      return buildLotteryTypeOption(this.lotteryTypeStats);
    },
    lotteryPath() {
      // 从可访问菜单中稳健地找到号码台账路径，避免硬编码
      const match = this.accessibleMenus.find((item) => /lottery\/log/.test(item.path));
      return match ? match.path : "";
    },
    // Fail2Ban 监控页路径（动态解析，避免硬编码后端菜单路径）
    fail2banPath() {
      const match = this.accessibleMenus.find((item) => /fail2ban/i.test(item.path));
      return match ? match.path : "";
    },
    // 最近活动时间线数据（已按 lastVisitedAt 倒序，来自 menu-frequency）
    recentItems() {
      return this.summary.recentMenus || [];
    },
  },
  mounted() {
    this.fetchLotteryTotal();
    // 需求 #1：拉取 Fail2Ban 攻击数据，丰富安全防护按钮标签（失败静默回退纯标签）
    this.fetchFail2banStatus();
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 30000);
    // 延迟挂载通勤 iframe，避免阻塞首屏
    this.$nextTick(() => {
      this.commuteLoaded = true;
    });
  },
  activated() {
    // keep-alive 重新激活时刷新本机统计
    this.summary = getMenuUsageSummary(this.userName);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    fetchLotteryTotal() {
      // 直接消费后端逐彩种聚合（listTotalReward），与「历史号码中奖金额统计」弹窗同源，
      // 修正前端 listLog(9999) 自行聚合带来的注数遗漏与超长截断偏差（需求 #4）
      listTotalReward()
        .then((response) => {
          this.lotteryTotalRewards = (response && response.rows) || [];
        })
        .catch(() => {
          this.lotteryTotalRewards = [];
        });
    },
    openFirstQuick() {
      if (this.quickItems.length) this.goPath(this.quickItems[0].path);
    },
    goPath(path) {
      if (!path) return;
      this.$router.push(path).catch(() => { });
    },
    // 需求 #2：服务大盘按钮去重后改为跳 Fail2Ban 监控（与下方运行稳定性卡片不再重复）
    openFail2Ban() {
      if (this.fail2banPath) {
        this.goPath(this.fail2banPath);
      } else {
        this.$message.warning("未找到 Fail2Ban 监控入口，请确认当前账号菜单权限");
      }
    },
    // 需求 #1：读取 Fail2Ban 服务状态中的拦截攻击次数（与 Fail2Ban 监控页同源）
    fetchFail2banStatus() {
      getFail2banStatus()
        .then((response) => {
          const data = (response && response.data) || {};
          // 系统不匹配 / 未安装：功能不可用，回退纯标签
          if (data.status === "系统不匹配" || data.status === "未安装") {
            this.fail2banAttackCount = null;
            return;
          }
          this.fail2banAttackCount = Number(data.totalFailedAttempts) || 0;
        })
        .catch(() => {
          this.fail2banAttackCount = null;
        });
    },
    // 需求 #1：攻击次数紧凑展示（千 / 万）
    formatAttackCount(value) {
      const n = Number(value) || 0;
      if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
      return String(n);
    },
    // 需求 #7：日常通勤指南针点击在新窗口打开通勤地图
    openCommuteMap() {
      if (this.commuteUrl) window.open(this.commuteUrl, "_blank");
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
.hero {
  position: relative;
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: space-between;
  padding: 36px 42px;
  margin-bottom: 18px;
  overflow: hidden;
  background: linear-gradient(120deg, #e9f9ef 0%, #f4fcf7 55%, #ffffff 100%);
  border: 1px solid #d3eede;
  border-radius: var(--home-radius);
  box-shadow: var(--home-shadow);
}

.hero-copy {
  position: relative;
  z-index: 2;

  h1 {
    margin: 10px 0 12px;
    color: $ink;
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 600;
  }

  p {
    margin: 0;
    color: $muted;
    font-size: 14px;
  }

  .hero-tip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 12px;
    padding: 6px 13px;
    color: $primary-dark;
    background: rgba(46, 204, 113, 0.1);
    border: 1px solid rgba(46, 204, 113, 0.18);
    border-radius: 999px;
    font-size: 12px;

    i {
      color: $primary;
    }
  }
}

.hero-kicker {
  color: $primary-dark;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;

  i {
    margin-right: 5px;
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;

  .hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border: 0;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;

    >i {
      font-size: 18px;
    }

    .hero-btn-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.25;

      strong {
        font-size: 14px;
        font-weight: 600;
      }

      small {
        margin-top: 2px;
        font-size: 11px;
        opacity: 0.85;
      }
    }

    &.primary {
      color: #fff;
      background: linear-gradient(135deg, $primary, $primary-dark);
      box-shadow: 0 8px 18px rgba(46, 204, 113, 0.25);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(46, 204, 113, 0.34);
      }
    }

    /* 需求 #2：安全防护按钮——图标 + 文字 + 醒目统计条，复合卡片式 */
    &.secondary.security {
      color: $primary-dark;
      background: #fff;
      border: 1px solid #c7ebd3;

      .hero-stat {
        padding: 2px 10px;
        color: $primary-dark;
        background: var(--home-primary-softer);
        border-radius: 999px;
        font-weight: 600;

        b {
          // color: $primary-dark;
          font-weight: 700;
        }

        /* 需求 #2：已加载统计时用主色渐变高亮，优化过窄绿色区域 */
        &.loaded {
          color: #fff;
          background: linear-gradient(135deg, $primary, $primary-dark);
        }
      }

      .hero-defence {
        text-indent: 8px;
      }

      &:hover {
        transform: translateY(-2px);
        background: var(--home-primary-softer);
        box-shadow: 0 12px 24px rgba(46, 204, 113, 0.18);
      }
    }
  }
}

.hero-time {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;

  span,
  small {
    color: $muted;
    letter-spacing: 0.06em;
  }

  strong {
    margin: 4px 0;
    color: $primary;
    font-size: 54px;
    font-weight: 400;
    line-height: 1;
  }

  small i {
    color: $primary;
  }

  .hero-quote {
    margin-top: 8px;
    max-width: 240px;
    color: $primary-dark;
    font-style: italic;
  }
}

.hero-orbit {
  position: absolute;
  border: 1px solid rgba(46, 204, 113, 0.2);
  border-radius: 50%;
}

.orbit-a {
  right: -50px;
  width: 260px;
  height: 260px;
}

.orbit-b {
  right: 40px;
  width: 110px;
  height: 110px;
  border-color: rgba(46, 204, 113, 0.35);
}

/* ===== 指标网格 ===== */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
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
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr) minmax(280px, 1fr);
}

.chart-panel,
.lottery-panel,
.commute-panel {
  display: flex;
  flex-direction: column;
}

.panel-glyph {
  color: $primary;
  font-size: 22px;
}

/* ===== 号码台账 ===== */
.lottery-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;

  >div {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: var(--home-primary-softer);
    border-radius: var(--home-radius-sm);
  }

  strong {
    color: $ink;
    font-size: 19px;
    font-weight: 600;

    &.positive {
      color: $primary-dark;
    }
  }

  small {
    margin-top: 3px;
    color: $muted;
    font-size: 11px;
  }
}

/* ===== 号码台账逐彩种图表 ===== */
.lottery-chart {
  margin-bottom: 4px;
}

.panel-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  padding: 8px 14px;
  color: $primary-dark;
  background: var(--home-primary-softer);
  border: 1px solid var(--home-border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  text-decoration: none;
  transition: all 0.25s ease;

  &:hover {
    color: #fff;
    background: $primary;
    border-color: $primary;

    i {
      transform: translateX(3px);
    }
  }

  i {
    transition: transform 0.25s ease;
  }
}

/* ===== 通勤 iframe ===== */
.commute-frame {
  position: relative;
  flex: 1;
  min-height: 240px;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: var(--home-radius-sm);
  background: var(--home-primary-softer);

  iframe {
    width: 100%;
    height: 100%;
    min-height: 240px;
    border: 0;
  }
}

.commute-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: $muted;
  font-size: 12px;

  i {
    font-size: 22px;
    color: $primary;
  }
}

/* ===== 可点击面板装饰图标（需求 #7） ===== */
.panel-glyph-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;

  .panel-glyph {
    transition: color 0.3s ease, transform 0.3s ease;
  }

  /* 号码台账等图标：transform 由共享 .glyph-rotate 提供，仅保留配色加深 */
  &:not(.compass):hover .panel-glyph {
    color: $primary-dark;
  }

  /* 指南针：悬浮提速 + 加深 */
  &.compass:hover .panel-glyph {
    color: $primary-dark;
    animation-duration: 1.4s;
  }
}

/* 指南针循环旋转（需求 #7） */
.compass-needle {
  animation: compass-rotate 6s linear infinite;
}

.panel-head {
  i {
    cursor: pointer;
  }
}

@keyframes compass-rotate {
  to {
    transform: rotate(360deg);
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

  .commute-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {

  .two-col,
  .three-col {
    grid-template-columns: 1fr;
  }

  .hero-time {
    display: none;
  }
}

@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .lottery-summary {
    grid-template-columns: 1fr;
  }
}
</style>
