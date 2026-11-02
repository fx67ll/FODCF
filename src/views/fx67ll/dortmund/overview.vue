<template>
  <!-- 自由发电机计划功能总览页：聚合模块全部页面入口与核心数据，一页直达各项操作 -->
  <div class="dortmund-overview">
    <!-- 顶部欢迎横幅：问候语 + 今日日期 + 全流程图入口 -->
    <div class="overview-hero">
      <div class="overview-hero-left">
        <div class="overview-hero-icon">
          <i class="el-icon-menu"></i>
        </div>
        <div class="overview-hero-text">
          <h2>{{ greetingText }}，这里是自由发电机计划功能总览</h2>
          <p>{{ heroDateText }} · 聚合行动全部页面入口，从基础资料到盈亏模拟，一页直达</p>
        </div>
      </div>
      <el-button type="success" plain icon="el-icon-share" @click="handleJump(pageComponents.workflow)">
        查看全流程图
      </el-button>
    </div>

    <!-- 核心数据总览（真实接口统计，无权限或异常时显示占位符） -->
    <div class="overview-stats">
      <div class="stat-card" v-for="(item, index) in statCards" :key="item.key"
        :style="{ animationDelay: index * 0.06 + 's' }" @click="handleJump(item.componentPath)">
        <div class="stat-card-icon">
          <i :class="item.icon"></i>
        </div>
        <div class="stat-card-info">
          <div class="stat-card-value">{{ formatStatValue(item.key) }}</div>
          <div class="stat-card-label">{{ item.label }}</div>
          <div class="stat-card-sub" :title="formatStatSubText(item)">{{ formatStatSub(item) }}</div>
        </div>
        <i class="el-icon-arrow-right stat-card-go"></i>
      </div>
    </div>

    <!-- 盈亏速览卡：从最近盈亏记录派生累计盈亏/胜率/近十次走势条形 -->
    <div class="overview-extra-brief" v-if="extraBriefReady">
      <div class="extra-brief-main">
        <div class="extra-brief-icon">
          <i class="el-icon-coin"></i>
        </div>
        <div class="extra-brief-blocks">
          <div class="extra-brief-block">
            <div class="extra-brief-value" :class="briefMoneyClass(extraBrief.netMoney)">{{
              formatBriefMoney(extraBrief.netMoney) }}</div>
            <div class="extra-brief-label">累计盈亏（近{{ extraBrief.loadedCount }}笔）</div>
          </div>
          <div class="extra-brief-block">
            <div class="extra-brief-value">{{ extraBrief.winRate }}</div>
            <div class="extra-brief-label">最近记录胜率</div>
          </div>
          <div class="extra-brief-block">
            <div class="extra-brief-trend">
              <span class="trend-bar" v-for="(bar, barIndex) in extraBrief.trendBars" :key="barIndex" :class="bar.cls"
                :style="{ height: bar.height + '%' }"></span>
            </div>
            <div class="extra-brief-label">近十次盈亏走势</div>
          </div>
        </div>
        <div class="extra-brief-actions">
          <el-button size="mini" type="success" plain icon="el-icon-edit"
            @click="handleCardAction({ type: 'extra', extraMode: 'extra' })">记一笔</el-button>
          <el-button size="mini" type="success" plain icon="el-icon-cpu"
            @click="handleCardAction({ type: 'extra', extraMode: 'simulate' })">去模拟</el-button>
        </div>
      </div>
      <div class="extra-brief-tip" v-if="extraBriefPartial">记录较多，仅统计最近加载的数据，查看全部请进入盈亏页</div>
    </div>

    <!-- 功能分区快捷操作 -->
    <div :class="['overview-section', section.layout === 'two' ? 'overview-section-two' : '']"
      v-for="(section, sectionIndex) in sections" :key="section.title">
      <div class="overview-section-header">
        <span class="overview-section-title">
          <i :class="section.icon"></i> {{ section.title }}
        </span>
        <span class="overview-section-desc">{{ section.desc }}</span>
      </div>
      <div class="overview-cards">
        <div class="action-card" v-for="card in section.cards" :key="card.title"
          :style="{ animationDelay: sectionIndex * 0.08 + 's' }" @click="handleCardAction(card.action)">
          <div class="action-card-head">
            <div class="action-card-icon">
              <i :class="card.icon"></i>
            </div>
            <div class="action-card-title">{{ card.title }}</div>
            <i class="el-icon-arrow-right action-card-go"></i>
          </div>
          <div class="action-card-desc">{{ card.desc }}</div>
          <div class="action-card-features">
            <span class="feature-tag" v-for="feature in card.features" :key="feature">{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 标准操作流指引：编号节点 + 虚线连接，按顺序完成一轮完整业务闭环 -->
    <div class="overview-flow">
      <div class="overview-section-header">
        <span class="overview-section-title">
          <i class="el-icon-guide"></i> 标准操作流
        </span>
        <span class="overview-section-desc">按此顺序完成一轮完整业务闭环</span>
      </div>
      <div class="flow-steps">
        <div class="flow-step-item" v-for="(step, index) in flowSteps" :key="index">
          <el-tooltip :content="step.tip" placement="top">
            <div class="flow-step" @click="handleCardAction(step)">
              <span class="flow-step-no">{{ index + 1 }}</span>
              <span class="flow-step-text">{{ step.text }}</span>
            </div>
          </el-tooltip>
          <span class="flow-step-arrow" v-if="index < flowSteps.length - 1"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";
import { listMatch } from "@/api/fx67ll/dortmund/match";
import { listPlan } from "@/api/fx67ll/dortmund/plan";
import { listInfoPoint } from "@/api/fx67ll/dortmund/infoPoint";
import { listExtra } from "@/api/fx67ll/dortmund/extra";

import { resolveRoutePathByComponent } from "@/utils/fx67ll/utils";

// 各子页面的菜单 component 值（与负责人手工菜单维护口径一致，用于解析真实跳转路径）
const PAGE_COMPONENTS = {
  season: "fx67ll/dortmund/basic/season/index",
  team: "fx67ll/dortmund/basic/team/index",
  match: "fx67ll/dortmund/basic/match/index",
  plan: "fx67ll/dortmund/plan/index",
  info: "fx67ll/dortmund/info/index",
  extra: "fx67ll/dortmund/extra/index",
  workflow: "fx67ll/dortmund/workflow/index",
};

// 外快盈亏页模式本地持久缓存的key（与 extra/index.vue 保持一致）
const EXTRA_PAGE_MODE_KEY = "dortmund-extra-page-mode";

export default {
  name: "DortmundOverview",
  data() {
    return {
      // 页面组件常量（模板内使用）
      pageComponents: PAGE_COMPONENTS,
      // 核心数据总览（异步填充，undefined加载中、'-'无权限或异常）
      statTotals: {},
      // 核心数据副标题（每张卡最新一条记录的摘要，空表示加载中）
      statSubs: {},
      // 盈亏速览数据（异步派生，null表示无权限或异常）
      extraBrief: null,
      // 盈亏速览是否只统计了部分记录
      extraBriefPartial: false,
      // 数据卡片配置（subText 为副标题取值函数，从同一次接口返回的 rows[0] 派生）
      statCards: [
        { key: "season", label: "赛季总数", icon: "el-icon-trophy", componentPath: PAGE_COMPONENTS.season, apiFunc: listSeason },
        { key: "team", label: "球队总数", icon: "el-icon-s-flag", componentPath: PAGE_COMPONENTS.team, apiFunc: listTeam },
        { key: "match", label: "比赛总数", icon: "el-icon-football", componentPath: PAGE_COMPONENTS.match, apiFunc: listMatch },
        { key: "plan", label: "方案计划", icon: "el-icon-notebook-2", componentPath: PAGE_COMPONENTS.plan, apiFunc: listPlan },
        { key: "info", label: "信息点", icon: "el-icon-document", componentPath: PAGE_COMPONENTS.info, apiFunc: listInfoPoint },
        { key: "extra", label: "盈亏记录", icon: "el-icon-coin", componentPath: PAGE_COMPONENTS.extra, apiFunc: listExtra },
      ],
      // 功能分区快捷操作配置
      sections: [
        {
          title: "基础资料",
          icon: "el-icon-files",
          desc: "赛季、球队、比赛是全部业务的数据底座",
          layout: "three",
          cards: [
            {
              title: "赛季管理",
              icon: "el-icon-trophy",
              desc: "维护赛季编码、名称与起止日期，受引用时结束赛季而非删除",
              features: ["新增赛季", "修改启停", "编码只读"],
              action: { type: "jump", componentPath: PAGE_COMPONENTS.season },
            },
            {
              title: "球队管理",
              icon: "el-icon-s-flag",
              desc: "维护球队中英文名、Logo与主场资料，受引用时停用而非删除",
              features: ["新增球队", "资料维护", "标签展示"],
              action: { type: "jump", componentPath: PAGE_COMPONENTS.team },
            },
            {
              title: "比赛管理",
              icon: "el-icon-football",
              desc: "总览加编排双场景，当场新建赛季球队与比赛同一事务保存",
              features: ["总览编排", "当场新建", "赛果维护"],
              action: { type: "jump", componentPath: PAGE_COMPONENTS.match },
            },
          ],
        },
        {
          title: "方案与信息",
          icon: "el-icon-notebook-2",
          desc: "围绕比赛沉淀方案计划与信息点，为后续分析供数",
          layout: "two",
          cards: [
            {
              title: "方案计划",
              icon: "el-icon-notebook-2",
              desc: "三场景编写方案计划，关联多场比赛，当场新建比赛，图片最多两张",
              features: ["编写回顾", "关联比赛", "图片区"],
              action: { type: "jump", componentPath: PAGE_COMPONENTS.plan },
            },
            {
              title: "信息点",
              icon: "el-icon-document",
              desc: "赛季球队与比赛临时两类信息点统一管理，支持按比赛查询有效性",
              features: ["双类录入", "启停管理", "有效性查询"],
              action: { type: "jump", componentPath: PAGE_COMPONENTS.info },
            },
          ],
        },
        {
          title: "盈亏中心",
          icon: "el-icon-coin",
          desc: "真实盈亏台账与策略数值模拟，均可选关联方案计划",
          layout: "two",
          cards: [
            {
              title: "外快盈亏记录",
              icon: "el-icon-coin",
              desc: "真实盈亏台账，支持合并连续历史、走势图与方案计划关联",
              features: ["记录台账", "合并历史", "关联方案"],
              action: { type: "extra", extraMode: "extra" },
            },
            {
              title: "数值模拟",
              icon: "el-icon-cpu",
              desc: "版本化策略数值模拟，轮次记录可关联方案计划并只读回看",
              features: ["版本管理", "轮次记录", "关联方案"],
              action: { type: "extra", extraMode: "simulate" },
            },
          ],
        },
      ],
      // 标准操作流指引步骤（tip 为悬停提示文案）
      flowSteps: [
        { text: "维护赛季", tip: "录入赛季编码与起止日期", type: "jump", componentPath: PAGE_COMPONENTS.season },
        { text: "维护球队", tip: "录入球队资料与标签", type: "jump", componentPath: PAGE_COMPONENTS.team },
        { text: "编排比赛", tip: "建立对阵与开赛时间", type: "jump", componentPath: PAGE_COMPONENTS.match },
        { text: "编写方案计划", tip: "围绕比赛沉淀方案并关联", type: "jump", componentPath: PAGE_COMPONENTS.plan },
        { text: "录入信息点", tip: "沉淀客观信息供后续分析", type: "jump", componentPath: PAGE_COMPONENTS.info },
        { text: "记录外快盈亏", tip: "真实盈亏入账并关联方案", type: "extra", extraMode: "extra" },
        { text: "数值模拟验证", tip: "版本化模拟验证策略", type: "extra", extraMode: "simulate" },
      ],
    };
  },
  computed: {
    // 顶部问候语：按当前小时段返回
    greetingText() {
      const hour = new Date().getHours();
      if (hour < 6) {
        return "夜深了";
      }
      if (hour < 12) {
        return "早上好";
      }
      if (hour < 18) {
        return "下午好";
      }
      return "晚上好";
    },
    // 顶部今日日期文案
    heroDateText() {
      const weekTexts = ["日", "一", "二", "三", "四", "五", "六"];
      const now = new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekTexts[now.getDay()]}`;
    },
    // 盈亏速览卡是否可展示（无权限或异常时整体隐藏，不占位）
    extraBriefReady() {
      return this.extraBrief !== null;
    },
  },
  created() {
    this.loadStatTotals();
    this.loadExtraBrief();
  },
  methods: {
    // 加载核心数据总览：每个接口只取第一条记录派生总数与副标题，失败时该卡片占位不影响其他卡片
    loadStatTotals() {
      this.statCards.forEach((item) => {
        item
          .apiFunc({ pageNum: 1, pageSize: 1 })
          .then((response) => {
            this.animateStatValue(item.key, response.total || 0);
            this.$set(this.statSubs, item.key, this.deriveStatSub(item.key, response.rows));
          })
          .catch(() => {
            // 无权限或接口异常时占位展示，避免单个失败拖垮整排卡片
            this.$set(this.statTotals, item.key, "-");
            this.$set(this.statSubs, item.key, "");
          });
      });
    },
    // 数值滚动动画：requestAnimationFrame 约600毫秒从0滚到目标值（缓出曲线收尾）
    animateStatValue(key, targetValue) {
      if (typeof targetValue !== "number" || targetValue <= 0) {
        this.$set(this.statTotals, key, targetValue);
        return;
      }
      const duration = 600;
      const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.$set(this.statTotals, key, Math.round(targetValue * eased));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    },
    // 从第一条记录派生卡片副标题（无记录时返回占位文案）
    deriveStatSub(key, rows) {
      const firstRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!firstRow) {
        return "暂无记录";
      }
      switch (key) {
        case "season":
          return `最新：${firstRow.seasonName || firstRow.seasonCode || "-"}`;
        case "team":
          return `最新：${firstRow.teamName || firstRow.teamNameShort || "-"}`;
        case "match":
          return `最新：${this.formatMatchBrief(firstRow)}`;
        case "plan":
          return `最新：${this.formatPlanBrief(firstRow)}`;
        case "info":
          return `最新：${firstRow.pointTitle || "-"}`;
        case "extra":
          return `最新盈亏：${this.formatSignedMoney(firstRow.winMoney)}`;
        default:
          return "";
      }
    },
    // 比赛摘要文案：主队 vs 客队（取不到球队名时兜底占位）
    formatMatchBrief(row) {
      const homeText = row.homeTeamName || "主队";
      const awayText = row.awayTeamName || "客队";
      return `${homeText} vs ${awayText}`;
    },
    // 方案摘要文案：内容过长时截断展示
    formatPlanBrief(row) {
      const content = row.planContent || "-";
      return content.length > 12 ? content.slice(0, 12) + "…" : content;
    },
    // 带符号金额文案：正数带加号，非法值返回占位符
    formatSignedMoney(value) {
      const money = parseFloat(value);
      if (isNaN(money)) {
        return "-";
      }
      return money > 0 ? `+${money}` : `${money}`;
    },
    // 数据卡片数值展示：未返回时显示加载占位
    formatStatValue(key) {
      const value = this.statTotals[key];
      return value === undefined ? "…" : value;
    },
    // 数据卡片副标题展示：未返回时显示加载占位
    formatStatSub(item) {
      const value = this.statSubs[item.key];
      return value === undefined ? "…" : value;
    },
    // 数据卡片副标题完整文案（悬浮提示用）
    formatStatSubText(item) {
      return this.formatStatSub(item);
    },
    // 加载盈亏速览：取最近一批记录派生累计盈亏、胜率与近十次走势，失败时整卡隐藏
    loadExtraBrief() {
      listExtra({ pageNum: 1, pageSize: 50 }).then((response) => {
        const rows = response.rows || [];
        const total = response.total || 0;
        this.extraBriefPartial = total > rows.length;
        this.extraBrief = this.buildExtraBrief(rows);
      }).catch(() => {
        // 无权限或接口异常时隐藏速览卡，不影响页面其他区块
        this.extraBrief = null;
      });
    },
    // 从最近记录派生盈亏速览数据
    buildExtraBrief(rows) {
      let netMoney = 0;
      let winCount = 0;
      rows.forEach((item) => {
        const winMoney = parseFloat(item.winMoney);
        if (!isNaN(winMoney)) {
          netMoney += winMoney;
          if (item.isWin === "Y") {
            winCount += 1;
          }
        }
      });
      // 近十次走势条形：按时间正序展示最近十条，红亏绿赢灰平，高度按绝对值占比缩放
      const recentRows = rows.slice(0, 10);
      const maxAbs = Math.max(1, ...recentRows.map((item) => Math.abs(parseFloat(item.winMoney) || 0)));
      const trendBars = recentRows
        .slice()
        .reverse()
        .map((item) => {
          const winMoney = parseFloat(item.winMoney) || 0;
          const cls = winMoney > 0 ? "win" : winMoney < 0 ? "lose" : "zero";
          return { cls, height: Math.max(18, Math.round((Math.abs(winMoney) / maxAbs) * 100)) };
        });
      const loadedCount = rows.length;
      return {
        netMoney: netMoney.toFixed(2),
        loadedCount: loadedCount,
        winRate: loadedCount === 0 ? "-" : `${Math.round((winCount / loadedCount) * 100)}%`,
        trendBars: trendBars,
      };
    },
    // 速览金额展示（正数带加号）
    formatBriefMoney(value) {
      const money = parseFloat(value);
      if (isNaN(money)) {
        return "-";
      }
      return money > 0 ? `+${money}` : `${money}`;
    },
    // 速览金额配色：正数绿、负数红、零灰
    briefMoneyClass(value) {
      const money = parseFloat(value);
      if (isNaN(money) || money === 0) {
        return "zero";
      }
      return money > 0 ? "win" : "lose";
    },
    // 卡片动作分发：页面跳转或外快盈亏模式预置跳转
    handleCardAction(action) {
      if (!action) {
        return;
      }
      if (action.type === "extra") {
        // 预置外快盈亏页模式（extra盈亏记录 simulate数值模拟），落地即为目标页签
        localStorage.setItem(EXTRA_PAGE_MODE_KEY, action.extraMode || "extra");
        this.handleJump(PAGE_COMPONENTS.extra);
        return;
      }
      this.handleJump(action.componentPath);
    },
    // 跳转目标页面：按菜单 component 解析真实路由，未配置时提示不硬跳
    handleJump(componentPath) {
      const path = resolveRoutePathByComponent(this.$router, componentPath);
      if (!path) {
        this.$modal.msgWarning("目标页面菜单未配置，请联系负责人维护菜单后重试");
        return;
      }
      this.$router.push(path).catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
/* 主题色板：与首页一致的主色 #2ecc71 清新风格 */
.dortmund-overview {
  --ov-primary: #2ecc71;
  --ov-primary-dark: #27ad60;
  --ov-primary-soft: #e7f8ee;
  --ov-primary-softer: #f2fbf6;
  --ov-ink: #2b3a36;
  --ov-ink-soft: #44604f;
  --ov-muted: #7c8b84;
  --ov-border: #e2eee7;
  --ov-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  --ov-shadow-hover: 0 16px 34px rgba(46, 204, 113, 0.16);

  min-height: calc(100vh - 84px);
  padding: 22px;
  cursor: default;
  color: var(--ov-ink);
  background: radial-gradient(circle at 92% 0%, rgba(46, 204, 113, 0.12), transparent 22%),
    radial-gradient(circle at 0% 12%, rgba(46, 204, 113, 0.06), transparent 26%), #f3faf6;
}

/* ===== 顶部欢迎横幅 ===== */
.overview-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f2fbf6 100%);
  border: 1px solid var(--ov-border);
  border-radius: 18px;
  box-shadow: var(--ov-shadow);
  animation: overviewFadeUp 0.35s ease both;
}

.overview-hero-left {
  display: flex;
  align-items: center;
}

.overview-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-right: 16px;
  font-size: 26px;
  color: #fff;
  background: linear-gradient(135deg, var(--ov-primary) 0%, var(--ov-primary-dark) 100%);
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.3);
  transition: transform 0.25s ease;

  &:hover {
    transform: rotate(-6deg) scale(1.05);
  }
}

.overview-hero-text h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.overview-hero-text p {
  margin: 0;
  font-size: 13px;
  color: var(--ov-muted);
}

/* ===== 核心数据总览 ===== */
.overview-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--ov-border);
  border-radius: 14px;
  box-shadow: var(--ov-shadow);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: overviewFadeUp 0.35s ease both;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--ov-shadow-hover);

    .stat-card-go {
      transform: translateX(3px);
      color: var(--ov-primary);
    }

    .stat-card-icon {
      transform: scale(1.06);
    }
  }
}

.stat-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: var(--ov-primary);
  background: var(--ov-primary-soft);
  border-radius: 10px;
  transition: transform 0.25s ease;
}

.stat-card-info {
  flex: 1;
  min-width: 0;
}

.stat-card-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ov-ink);
}

.stat-card-label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ov-muted);
}

.stat-card-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #9aa8a1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card-go {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--ov-muted);
  transition: transform 0.25s ease, color 0.25s ease;
}

/* ===== 盈亏速览卡 ===== */
.overview-extra-brief {
  margin-top: 16px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f7fdf9 100%);
  border: 1px solid var(--ov-border);
  border-radius: 18px;
  box-shadow: var(--ov-shadow);
  animation: overviewFadeUp 0.35s ease 0.1s both;
}

.extra-brief-main {
  display: flex;
  align-items: center;
}

.extra-brief-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  margin-right: 18px;
  font-size: 24px;
  color: #fff;
  background: linear-gradient(135deg, var(--ov-primary) 0%, var(--ov-primary-dark) 100%);
  border-radius: 13px;
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.28);
}

.extra-brief-blocks {
  display: flex;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
  gap: 28px;
}

.extra-brief-block {
  min-width: 120px;
}

.extra-brief-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;

  &.win {
    color: var(--ov-primary-dark);
  }

  &.lose {
    color: #ff5a5f;
  }

  &.zero {
    color: var(--ov-ink);
  }
}

.extra-brief-label {
  margin-top: 3px;
  font-size: 12px;
  color: var(--ov-muted);
}

/* 近十次盈亏走势条形：纯CSS迷你柱状 */
.extra-brief-trend {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 34px;
  margin-bottom: 3px;
}

.trend-bar {
  width: 10px;
  border-radius: 3px 3px 0 0;
  animation: trendBarGrow 0.4s ease both;

  &.win {
    background: linear-gradient(to top, var(--ov-primary) 0%, #7ee5a8 100%);
  }

  &.lose {
    background: linear-gradient(to top, #ff5a5f 0%, #ff9a9d 100%);
  }

  &.zero {
    background: #d5ddd9;
  }
}

.extra-brief-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 18px;
}

.extra-brief-tip {
  margin-top: 12px;
  font-size: 11px;
  color: #a8b5af;
}

/* ===== 功能分区 ===== */
.overview-section {
  margin-top: 22px;
}

.overview-section-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 14px;
}

.overview-section-title {
  font-size: 16px;
  font-weight: 600;

  i {
    margin-right: 6px;
    color: var(--ov-primary);
  }
}

.overview-section-desc {
  margin-left: 12px;
  font-size: 12px;
  color: var(--ov-muted);
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.overview-section-two .overview-cards {
  grid-template-columns: repeat(2, 1fr);
}

.action-card {
  padding: 18px;
  background: #fff;
  border: 1px solid var(--ov-border);
  border-radius: 14px;
  box-shadow: var(--ov-shadow);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  animation: overviewFadeUp 0.35s ease both;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--ov-primary);
    box-shadow: var(--ov-shadow-hover);

    .action-card-go {
      transform: translateX(3px);
      color: var(--ov-primary);
    }

    .action-card-icon {
      transform: rotate(-6deg) scale(1.06);
    }

    .feature-tag {
      &:nth-child(1) {
        transition-delay: 0s;
      }

      &:nth-child(2) {
        transition-delay: 0.04s;
      }

      &:nth-child(3) {
        transition-delay: 0.08s;
      }

      background: var(--ov-primary-soft);
      color: var(--ov-primary-dark);
    }
  }
}

.action-card-head {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.action-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin-right: 10px;
  font-size: 18px;
  color: #fff;
  background: linear-gradient(135deg, var(--ov-primary) 0%, var(--ov-primary-dark) 100%);
  border-radius: 10px;
  transition: transform 0.25s ease;
}

.action-card-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}

.action-card-go {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--ov-muted);
  transition: transform 0.25s ease, color 0.25s ease;
}

.action-card-desc {
  min-height: 36px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ov-ink-soft);
}

.action-card-features {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.feature-tag {
  margin-right: 6px;
  margin-bottom: 6px;
  padding: 2px 10px;
  font-size: 12px;
  color: var(--ov-ink-soft);
  background: var(--ov-primary-softer);
  border-radius: 999px;
  transition: background 0.25s ease, color 0.25s ease;
}

/* ===== 标准操作流 ===== */
.overview-flow {
  margin-top: 22px;
  padding: 18px 22px 22px;
  background: #fff;
  border: 1px solid var(--ov-border);
  border-radius: 18px;
  box-shadow: var(--ov-shadow);
  animation: overviewFadeUp 0.35s ease both;
}

.flow-steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 8px;
}

.flow-step-item {
  display: flex;
  align-items: center;
}

.flow-step {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  margin-bottom: 8px;
  background: var(--ov-primary-softer);
  border: 1px solid var(--ov-border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: var(--ov-primary-soft);
    border-color: var(--ov-primary);
    transform: translateY(-2px);

    .flow-step-no {
      background: var(--ov-primary-dark);
      transform: scale(1.08);
    }
  }
}

.flow-step-no {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--ov-primary);
  border-radius: 50%;
  transition: transform 0.25s ease, background 0.25s ease;
}

.flow-step-text {
  font-size: 13px;
  color: var(--ov-ink-soft);
}

/* 步骤间虚线连接箭头 */
.flow-step-arrow {
  position: relative;
  width: 22px;
  height: 2px;
  margin: 0 4px 8px;
  background-image: linear-gradient(to right, var(--ov-primary) 55%, transparent 45%);
  background-size: 8px 2px;
  background-repeat: repeat-x;
  opacity: 0.55;
}

/* ===== 入场动画 ===== */
@keyframes overviewFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes trendBarGrow {
  from {
    height: 0;
  }
}

/* ===== 响应式：窄屏降列 ===== */
@media screen and (max-width: 1400px) {
  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 1000px) {

  .overview-cards,
  .overview-section-two .overview-cards {
    grid-template-columns: 1fr;
  }

  .overview-hero {
    flex-direction: column;
    align-items: flex-start;

    .el-button {
      margin-top: 14px;
    }
  }

  .extra-brief-main {
    flex-direction: column;
    align-items: flex-start;

    .extra-brief-actions {
      flex-direction: row;
      margin-top: 14px;
      margin-left: 0;
    }
  }
}

@media screen and (max-width: 640px) {
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
