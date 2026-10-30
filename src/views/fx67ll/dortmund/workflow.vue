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

    <!-- 图例说明 -->
    <div class="workflow-legend">
      <span class="legend-item">
        <span class="legend-dot done"></span> 已上线，点击节点跳转页面
      </span>
      <span class="legend-item">
        <span class="legend-dot todo"></span> 开发中，敬请期待
      </span>
    </div>

    <!-- 阶段时间轴：节点左右交错排布，窄屏自动收起为单侧 -->
    <div class="workflow-timeline">
      <div class="workflow-stage" v-for="(stage, stageIndex) in stages" :key="stage.title"
        :style="{ animationDelay: stageIndex * 0.08 + 's' }">
        <!-- 阶段标题横幅 -->
        <div class="stage-banner" :class="{ done: isStageDone(stage) }">
          <span class="stage-banner-no">{{ stageIndex + 1 }}</span>
          <span class="stage-banner-title">{{ stage.title }}</span>
          <span class="stage-banner-status" :class="{ done: isStageDone(stage) }">
            {{ isStageDone(stage) ? "已上线" : "开发中" }}
          </span>
        </div>

        <!-- 阶段内节点 -->
        <div class="stage-node" v-for="node in stage.nodes" :key="node.key"
          :class="{ left: nodeSide(node) === 'left', right: nodeSide(node) === 'right' }">
          <div class="stage-node-card"
            :class="[{ done: node.done, todo: !node.done }, { jumping: jumpingKey === node.key }]"
            @click="handleNodeClick(node)">
            <div class="stage-node-icon">
              <i :class="node.icon"></i>
            </div>
            <div class="stage-node-info">
              <div class="stage-node-title">{{ node.title }}</div>
              <div class="stage-node-desc">{{ node.desc }}</div>
            </div>
            <div class="stage-node-tail">
              <i class="el-icon-circle-check" v-if="node.done"></i>
              <i class="el-icon-time" v-else></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { resolveRoutePathByComponent } from "@/utils/fx67ll/utils";

// 各页面的菜单 component 值（与负责人手工菜单维护口径一致，用于解析真实跳转路径）
const PAGE_COMPONENTS = {
  season: "fx67ll/dortmund/basic/season/index",
  team: "fx67ll/dortmund/basic/team/index",
  match: "fx67ll/dortmund/basic/match/index",
  plan: "fx67ll/dortmund/plan/index",
  info: "fx67ll/dortmund/info/index",
  extra: "fx67ll/dortmund/extra/index",
};

// 外快盈亏页模式本地持久缓存的key（与 extra/index.vue 保持一致）
const EXTRA_PAGE_MODE_KEY = "dortmund-extra-page-mode";

export default {
  name: "DortmundWorkflow",
  data() {
    return {
      // 正在跳转动画中的节点key（260ms 后执行真实跳转）
      jumpingKey: "",
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
          title: "阶段二 · 计划与信息",
          nodes: [
            { key: "plan", title: "方案计划", desc: "三场景编写，关联比赛，图片最多两张", icon: "el-icon-notebook-2", done: true, componentPath: PAGE_COMPONENTS.plan },
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
    // 全部节点数
    totalNodeCount() {
      return this.stages.reduce((sum, stage) => sum + stage.nodes.length, 0);
    },
    // 整体上线进度百分比
    progressPercent() {
      return this.totalNodeCount === 0 ? 0 : Math.round((this.doneNodeCount / this.totalNodeCount) * 100);
    },
  },
  methods: {
    // 阶段是否全部节点已上线
    isStageDone(stage) {
      return stage.nodes.every((node) => node.done);
    },
    // 节点左右交错：按全局节点序号交替，左偶右奇
    nodeSide(targetNode) {
      let nodeIndex = 0;
      for (const stage of this.stages) {
        for (const node of stage.nodes) {
          if (node.key === targetNode.key) {
            return nodeIndex % 2 === 0 ? "left" : "right";
          }
          nodeIndex += 1;
        }
      }
      return "left";
    },
    // 节点点击：未上线提示开发中，已上线播放点击动画后跳转
    handleNodeClick(node) {
      if (!node.done) {
        this.$modal.msgWarning(`「${node.title}」正在开发中，敬请期待`);
        return;
      }
      // 动画播放中忽略重复点击，避免多次跳转
      if (this.jumpingKey) {
        return;
      }
      this.jumpingKey = node.key;
      const self = this;
      setTimeout(() => {
        self.jumpingKey = "";
        // 外快盈亏页按节点预置模式（盈亏记录/数值模拟）
        if (node.extraMode) {
          localStorage.setItem(EXTRA_PAGE_MODE_KEY, node.extraMode);
        }
        const path = resolveRoutePathByComponent(self.$router, node.componentPath);
        if (!path) {
          self.$modal.msgWarning("目标页面菜单未配置，请联系负责人维护菜单后重试");
          return;
        }
        self.$router.push(path).catch(() => { });
      }, 260);
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
  background: #fff;
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

/* ===== 阶段时间轴 ===== */
.workflow-timeline {
  position: relative;
  max-width: 960px;
  margin: 0 auto;
  padding: 26px 0 10px;

  /* 中央脊柱 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    margin-left: -1px;
    background: linear-gradient(to bottom, var(--wf-primary) 0%, var(--wf-border) 100%);
  }
}

.workflow-stage {
  position: relative;
  animation: workflowFadeUp 0.4s ease both;
}

/* 阶段标题横幅：骑跨在脊柱上 */
.stage-banner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  width: fit-content;
  margin: 10px auto 20px;
  padding: 8px 18px;
  background: #fff;
  border: 1px solid var(--wf-border);
  border-radius: 999px;
  box-shadow: var(--wf-shadow);

  &.done {
    border-color: var(--wf-primary);
  }
}

.stage-banner-no {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--wf-primary);
  border-radius: 50%;
}

.stage-banner:not(.done) .stage-banner-no {
  background: #b3c4ba;
}

.stage-banner-title {
  font-size: 14px;
  font-weight: 600;
}

.stage-banner-status {
  margin-left: 10px;
  padding: 1px 8px;
  font-size: 12px;
  color: var(--wf-muted);
  background: #f0f4f2;
  border-radius: 999px;

  &.done {
    color: var(--wf-primary-dark);
    background: var(--wf-primary-soft);
  }
}

/* 节点：左右交错排布 */
.stage-node {
  position: relative;
  display: flex;
  width: 50%;
  padding: 0 34px 20px;
  box-sizing: border-box;

  /* 脊柱上的连接圆点 */
  &::before {
    content: "";
    position: absolute;
    top: 22px;
    width: 10px;
    height: 10px;
    background: #fff;
    border: 2px solid var(--wf-primary);
    border-radius: 50%;
  }

  /* 节点到脊柱的连接横线 */
  &::after {
    content: "";
    position: absolute;
    top: 27px;
    width: 24px;
    height: 2px;
    background: var(--wf-border);
  }

  &.left {
    justify-content: flex-end;
    padding-left: 0;

    &::before {
      right: -5px;
    }

    &::after {
      right: 5px;
    }
  }

  &.right {
    margin-left: 50%;
    justify-content: flex-start;
    padding-right: 0;

    &::before {
      left: -5px;
    }

    &::after {
      left: 5px;
    }
  }
}

.stage-node-card {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 380px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid var(--wf-border);
  border-radius: 14px;
  box-shadow: var(--wf-shadow);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &.done:hover {
    transform: translateY(-3px);
    border-color: var(--wf-primary);
    box-shadow: var(--wf-shadow-hover);
  }

  /* 未上线节点置灰不可点，点击仅提示 */
  &.todo {
    background: #fafcfb;

    .stage-node-title,
    .stage-node-desc {
      color: var(--wf-muted);
    }

    .stage-node-tail {
      color: #c6d1cb;
    }
  }

  /* 点击跳转动画：轻微回弹放大 */
  &.jumping {
    animation: nodeJump 0.26s ease;
    border-color: var(--wf-primary);
  }
}

.stage-node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 19px;
  color: #fff;
  background: linear-gradient(135deg, var(--wf-primary) 0%, var(--wf-primary-dark) 100%);
  border-radius: 10px;
}

.stage-node-card.todo .stage-node-icon {
  color: #9faea6;
  background: #f0f4f2;
}

.stage-node-info {
  flex: 1;
  min-width: 0;
}

.stage-node-title {
  font-size: 14px;
  font-weight: 600;
}

.stage-node-desc {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--wf-muted);
}

.stage-node-tail {
  flex-shrink: 0;
  margin-left: 10px;
  font-size: 18px;
  color: var(--wf-primary);
}

/* ===== 动画 ===== */
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

@keyframes nodeJump {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.94);
  }

  100% {
    transform: scale(1.03);
  }
}

/* ===== 响应式：窄屏收起为单侧时间轴 ===== */
@media screen and (max-width: 768px) {
  .workflow-hero {
    flex-direction: column;
    align-items: flex-start;

    .workflow-hero-progress {
      margin-top: 14px;
      margin-left: 0;
    }
  }

  .workflow-timeline::before {
    left: 12px;
  }

  .stage-banner {
    margin-left: 34px;
  }

  .stage-node {
    width: 100%;
    padding: 0 0 16px 34px;

    &.left,
    &.right {
      margin-left: 0;
      justify-content: flex-start;
      padding-right: 0;
      padding-left: 34px;

      &::before {
        left: 7px;
        right: auto;
      }

      &::after {
        left: 17px;
        right: auto;
        width: 12px;
      }
    }
  }

  .stage-node-card {
    max-width: none;
  }
}
</style>
