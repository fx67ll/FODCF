<template>
  <!-- 自由发电机计划需求全流程图：每个页面一个节点，已上线节点支持点击跳转，未上线节点提示开发中 -->
  <div class="dortmund-workflow">
    <!-- 顶部介绍横幅与整体进度 -->
    <div class="workflow-hero">
      <div class="workflow-hero-left">
        <div class="workflow-hero-icon">
          <i class="el-icon-share"></i>
        </div>
        <div class="workflow-hero-text">
          <h2>自由发电机计划 · 需求全流程</h2>
          <p>从数据基石到运行观测共六个阶段，点击已上线节点直达页面，未上线节点开发中敬请期待</p>
          <p class="workflow-hero-hint">{{ progressHintText }}</p>
        </div>
      </div>
      <div class="workflow-hero-progress">
        <el-progress type="circle" :percentage="progressPercent" :width="86" :stroke-width="8" color="#2ecc71" />
        <div class="workflow-hero-progress-text">
          <div class="progress-count">{{ doneNodeCount }} / {{ totalNodeCount }}</div>
          <div class="progress-label">节点已上线</div>
        </div>
      </div>
    </div>

    <!-- 图例说明（附实时统计） -->
    <div class="workflow-legend">
      <span class="legend-item">
        <span class="legend-dot done"></span> 已上线 {{ doneNodeCount }} 个，点击节点跳转页面
      </span>
      <span class="legend-item">
        <span class="legend-dot todo"></span> 开发中 {{ todoNodeCount }} 个，敬请期待
      </span>
    </div>

    <!-- 阶段时间轴：节点左右交错排布，窄屏自动收起为单侧；脊柱按上线进度渐变填色 -->
    <workflow-timeline :stages="stages" :progress-percent="progressPercent" @navigate="handleNavigate" />
  </div>
</template>

<script>
import { resolveRoutePathByComponent, resolveRoutePathByMenuComponent } from "@/utils/fx67ll/utils";

import WorkflowTimeline from "./components/WorkflowTimeline/index.vue";

// 各页面的菜单 component 值（与负责人手工菜单维护口径一致，用于解析真实跳转路径）
const PAGE_COMPONENTS = {
  season: "fx67ll/dortmund/basic/season/index",
  team: "fx67ll/dortmund/basic/team/index",
  match: "fx67ll/dortmund/basic/match/index",
  odds: "fx67ll/dortmund/odds/index",
  returnCombination: "fx67ll/dortmund/return/index",
  plan: "fx67ll/dortmund/plan/index",
  info: "fx67ll/dortmund/info/index",
  extra: "fx67ll/dortmund/extra/index",
};

// 外快盈亏页模式本地持久缓存的key（与 extra/index.vue 保持一致）
const EXTRA_PAGE_MODE_KEY = "dortmund-extra-page-mode";

export default {
  name: "DortmundWorkflow",
  components: { WorkflowTimeline },
  data() {
    return {
      // 全流程六个阶段，done 为节点上线状态
      stages: [
        {
          title: "阶段一 · 数据基石",
          nodes: [
            { key: "season", title: "赛季管理", desc: "赛季编码、名称与起止日期维护", icon: "el-icon-trophy", done: true, componentPath: PAGE_COMPONENTS.season },
            { key: "team", title: "球队管理", desc: "球队中英文名、Logo与主场资料", icon: "el-icon-s-flag", done: true, componentPath: PAGE_COMPONENTS.team },
            { key: "match", title: "比赛管理", desc: "总览加编排双场景，当场新建同事务", icon: "el-icon-football", done: true, componentPath: PAGE_COMPONENTS.match },
          ],
        },
        {
          title: "阶段 1.5 · 版本与生成",
          nodes: [
            { key: "odds", title: "倍率版本", desc: "六类赔率版本、有效切换与当场创建", icon: "el-icon-odometer", done: true, componentPath: PAGE_COMPONENTS.odds },
            { key: "returnCombination", title: "回报组合", desc: "AI生成、批次复核与采用审核", icon: "el-icon-magic-stick", done: true, componentPath: PAGE_COMPONENTS.returnCombination },
          ],
        },
        {
          title: "阶段二 · 计划与信息",
          nodes: [
            { key: "plan", title: "方案计划", desc: "组合驱动编写，自动派生去重比赛", icon: "el-icon-notebook-2", done: true, componentPath: PAGE_COMPONENTS.plan },
            { key: "info", title: "信息点", desc: "两类信息点统一管理与有效性查询", icon: "el-icon-document", done: true, componentPath: PAGE_COMPONENTS.info },
          ],
        },
        {
          title: "阶段三 · 盈亏与模拟",
          nodes: [
            { key: "extra", title: "外快盈亏记录", desc: "真实盈亏台账，合并历史与走势图", icon: "el-icon-coin", done: true, componentPath: PAGE_COMPONENTS.extra, extraMode: "extra" },
            { key: "simulate", title: "数值模拟", desc: "版本化策略数值模拟与轮次记录", icon: "el-icon-cpu", done: true, componentPath: PAGE_COMPONENTS.extra, extraMode: "simulate" },
          ],
        },
        {
          title: "阶段四 · AI能力底座",
          nodes: [
            { key: "promptGroup", title: "Prompt分组", desc: "提示词分组管理", icon: "el-icon-collection", done: false },
            { key: "promptScene", title: "Prompt场景", desc: "提示词场景编排", icon: "el-icon-chat-dot-square", done: false },
            { key: "promptTemplate", title: "Prompt模板", desc: "提示词模板维护", icon: "el-icon-tickets", done: false },
            { key: "modelConfig", title: "模型配置", desc: "AI模型接入与参数配置", icon: "el-icon-setting", done: false },
            { key: "requestRule", title: "限流熔断规则", desc: "请求限流与熔断保护规则", icon: "el-icon-odometer", done: false },
          ],
        },
        {
          title: "阶段五 · 分析与产出",
          nodes: [
            { key: "innerAnalysis", title: "内部分析", desc: "基于信息点的内部AI分析", icon: "el-icon-data-analysis", done: false },
            { key: "matchScore", title: "比赛评分", desc: "比赛维度AI评分产出", icon: "el-icon-star-off", done: false },
            { key: "publicText", title: "公开客观文本", desc: "对外公开的客观文本生成", icon: "el-icon-reading", done: false },
          ],
        },
        {
          title: "阶段六 · 运行观测",
          nodes: [
            { key: "requestLog", title: "AI请求日志", desc: "请求明细日志查询", icon: "el-icon-document-copy", done: false },
            { key: "aiStat", title: "日月年统计", desc: "AI调用量日月年维度统计", icon: "el-icon-pie-chart", done: false },
          ],
        },
      ],
    };
  },
  computed: {
    // 已上线节点数
    doneNodeCount() {
      return this.stages.reduce((sum, stage) => sum + stage.nodes.filter((node) => node.done).length, 0);
    },
    // 未上线节点数
    todoNodeCount() {
      return this.totalNodeCount - this.doneNodeCount;
    },
    // 全部节点数
    totalNodeCount() {
      return this.stages.reduce((sum, stage) => sum + stage.nodes.length, 0);
    },
    // 整体上线进度百分比
    progressPercent() {
      return this.totalNodeCount === 0 ? 0 : Math.round((this.doneNodeCount / this.totalNodeCount) * 100);
    },
    // 当前推进前沿阶段下标（第一个存在未上线节点的阶段，全部上线时返回-1）
    frontierStageIndex() {
      return this.stages.findIndex((stage) => !stage.nodes.every((node) => node.done));
    },
    // 顶部进度提示文案：全部上线与推进中两种口径
    progressHintText() {
      if (this.frontierStageIndex === -1) {
        return `全部 ${this.totalNodeCount} 个节点已上线，全流程交付完成`;
      }
      const frontierStage = this.stages[this.frontierStageIndex];
      return `已上线 ${this.doneNodeCount}/${this.totalNodeCount} · 当前推进至「${frontierStage.title}」`;
    },
  },
  methods: {
    // 时间轴节点跳转：已上线节点点击动画结束后由时间轴组件回调
    handleNavigate(node) {
      // 外快盈亏页按节点预置模式（盈亏记录/数值模拟）
      if (node.extraMode) {
        localStorage.setItem(EXTRA_PAGE_MODE_KEY, node.extraMode);
      }
      // 优先按后端原始菜单路由数据匹配 component，未命中回退已注册路由尾段匹配
      let path = resolveRoutePathByMenuComponent(this.$store.state.permission.menuRouters, node.componentPath);
      if (!path) {
        path = resolveRoutePathByComponent(this.$router, node.componentPath);
      }
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
.dortmund-workflow {
  --wf-primary: #2ecc71;
  --wf-primary-dark: #27ad60;
  --wf-primary-soft: #e7f8ee;
  --wf-primary-softer: #f2fbf6;
  --wf-ink: #2b3a36;
  --wf-ink-soft: #44604f;
  --wf-muted: #7c8b84;
  --wf-border: #e2eee7;
  --wf-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  --wf-shadow-hover: 0 16px 34px rgba(46, 204, 113, 0.16);

  min-height: calc(100vh - 84px);
  padding: 22px;
  cursor: default;
  color: var(--wf-ink);
  background: radial-gradient(circle at 92% 0%, rgba(46, 204, 113, 0.12), transparent 22%),
    radial-gradient(circle at 0% 12%, rgba(46, 204, 113, 0.06), transparent 26%), #f3faf6;
}

/* ===== 顶部介绍横幅 ===== */
.workflow-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f2fbf6 100%);
  border: 1px solid var(--wf-border);
  border-radius: 18px;
  box-shadow: var(--wf-shadow);
  animation: workflowFadeUp 0.35s ease both;
}

.workflow-hero-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.workflow-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  margin-right: 16px;
  font-size: 26px;
  color: #fff;
  background: linear-gradient(135deg, var(--wf-primary) 0%, var(--wf-primary-dark) 100%);
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.3);
  transition: transform 0.25s ease;

  &:hover {
    transform: rotate(-6deg) scale(1.05);
  }
}

.workflow-hero-text h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.workflow-hero-text p {
  margin: 0;
  font-size: 13px;
  color: var(--wf-muted);
}

/* 当前进度提示行 */
.workflow-hero-hint {
  margin-top: 6px !important;
  font-size: 12px !important;
  color: var(--wf-primary-dark);
}

.workflow-hero-progress {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 18px;
}

.workflow-hero-progress-text {
  margin-left: 14px;
  text-align: center;
}

.progress-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--wf-primary-dark);
}

.progress-label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--wf-muted);
}

/* ===== 图例说明 ===== */
.workflow-legend {
  display: flex;
  flex-wrap: wrap;
  margin: 16px 0 4px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid var(--wf-border);
  border-radius: 12px;
  box-shadow: var(--wf-shadow);
  animation: workflowFadeUp 0.35s ease 0.05s both;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  font-size: 12px;
  color: var(--wf-ink-soft);
}

.legend-dot {
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border-radius: 50%;

  &.done {
    background: var(--wf-primary);
    box-shadow: 0 0 0 3px var(--wf-primary-soft);
  }

  &.todo {
    background: #c6d1cb;
    box-shadow: 0 0 0 3px #f0f4f2;
  }
}

/* ===== 入场动画 ===== */
@keyframes workflowFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 响应式：窄屏竖排 ===== */
@media screen and (max-width: 768px) {
  .workflow-hero {
    flex-direction: column;
    align-items: flex-start;

    .workflow-hero-progress {
      margin-top: 14px;
      margin-left: 0;
    }
  }
}
</style>
