<template>
  <!-- 自由发电机计划功能总览页：聚合模块全部页面入口与核心数据，一页直达各项操作 -->
  <div class="dortmund-overview">
    <!-- 顶部欢迎横幅 -->
    <div class="overview-hero">
      <div class="overview-hero-left">
        <div class="overview-hero-icon">
          <i class="el-icon-menu"></i>
        </div>
        <div class="overview-hero-text">
          <h2>自由发电机计划 · 功能总览</h2>
          <p>聚合自由发电机计划行动的全部页面入口，从基础资料到盈亏模拟，一页直达</p>
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
        </div>
        <i class="el-icon-arrow-right stat-card-go"></i>
      </div>
    </div>

    <!-- 功能分区快捷操作 -->
    <div class="overview-section" v-for="section in sections" :key="section.title">
      <div class="overview-section-header">
        <span class="overview-section-title">
          <i :class="section.icon"></i> {{ section.title }}
        </span>
        <span class="overview-section-desc">{{ section.desc }}</span>
      </div>
      <div class="overview-cards">
        <div class="action-card" v-for="card in section.cards" :key="card.title" @click="handleCardAction(card.action)">
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

    <!-- 标准操作流指引（按顺序完成一轮完整业务闭环） -->
    <div class="overview-flow">
      <div class="overview-section-header">
        <span class="overview-section-title">
          <i class="el-icon-guide"></i> 标准操作流
        </span>
        <span class="overview-section-desc">按此顺序完成一轮完整业务闭环</span>
      </div>
      <div class="flow-steps">
        <div class="flow-step-item" v-for="(step, index) in flowSteps" :key="index">
          <div class="flow-step" @click="handleCardAction(step)">
            <span class="flow-step-no">{{ index + 1 }}</span>
            <span class="flow-step-text">{{ step.text }}</span>
          </div>
          <i class="el-icon-right flow-step-arrow" v-if="index < flowSteps.length - 1"></i>
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
      // 数据卡片配置
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
      // 标准操作流指引步骤
      flowSteps: [
        { text: "维护赛季", type: "jump", componentPath: PAGE_COMPONENTS.season },
        { text: "维护球队", type: "jump", componentPath: PAGE_COMPONENTS.team },
        { text: "编排比赛", type: "jump", componentPath: PAGE_COMPONENTS.match },
        { text: "编写方案计划", type: "jump", componentPath: PAGE_COMPONENTS.plan },
        { text: "录入信息点", type: "jump", componentPath: PAGE_COMPONENTS.info },
        { text: "记录外快盈亏", type: "extra", extraMode: "extra" },
        { text: "数值模拟验证", type: "extra", extraMode: "simulate" },
      ],
    };
  },
  created() {
    this.loadStatTotals();
  },
  methods: {
    // 加载核心数据总览：每个接口只取总数，失败时该卡片占位不影响其他卡片
    loadStatTotals() {
      this.statCards.forEach((item) => {
        item
          .apiFunc({ pageNum: 1, pageSize: 1 })
          .then((response) => {
            this.$set(this.statTotals, item.key, response.total || 0);
          })
          .catch(() => {
            // 无权限或接口异常时占位展示，避免单个失败拖垮整排卡片
            this.$set(this.statTotals, item.key, "-");
          });
      });
    },
    // 数据卡片数值展示：未返回时显示加载占位
    formatStatValue(key) {
      const value = this.statTotals[key];
      return value === undefined ? "…" : value;
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
  background: #fff;
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

.stat-card-go {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--ov-muted);
  transition: transform 0.25s ease, color 0.25s ease;
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

.overview-section:nth-of-type(3) .overview-cards,
.overview-section:nth-of-type(4) .overview-cards {
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
  color: var(--ov-primary-dark);
  background: var(--ov-primary-soft);
  border-radius: 999px;
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
}

.flow-step-text {
  font-size: 13px;
  color: var(--ov-ink-soft);
}

.flow-step-arrow {
  margin: 0 10px 8px;
  font-size: 14px;
  color: var(--ov-primary);
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

/* ===== 响应式：窄屏降列 ===== */
@media screen and (max-width: 1400px) {
  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 1000px) {

  .overview-cards,
  .overview-section:nth-of-type(3) .overview-cards,
  .overview-section:nth-of-type(4) .overview-cards {
    grid-template-columns: 1fr;
  }

  .overview-hero {
    flex-direction: column;
    align-items: flex-start;

    .el-button {
      margin-top: 14px;
    }
  }
}

@media screen and (max-width: 640px) {
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
