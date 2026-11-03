<template>
  <!-- 阶段时间轴：节点左右交错排布，窄屏自动收起为单侧；脊柱按上线进度渐变填色（阶段配置与进度由父页面传入） -->
  <div class="workflow-timeline" :style="{ '--wf-spine-progress': progressPercent + '%' }">
    <div class="workflow-stage" v-for="(stage, stageIndex) in stages" :key="stage.title"
      :style="{ animationDelay: stageIndex * 0.08 + 's' }">
      <!-- 阶段标题横幅（推进前沿阶段带呼吸圆点） -->
      <div class="stage-banner" :class="{ done: isStageDone(stage), frontier: stageIndex === frontierStageIndex }">
        <span class="stage-banner-pulse" v-if="stageIndex === frontierStageIndex"></span>
        <span class="stage-banner-no">{{ stageIndex + 1 }}</span>
        <span class="stage-banner-title">{{ stage.title }}</span>
        <span class="stage-banner-count" :class="{ done: isStageDone(stage) }">
          {{ stageDoneCount(stage) }}/{{ stage.nodes.length }}
        </span>
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
          <span class="stage-node-corner" v-if="!node.done">开发中</span>
          <div class="stage-node-icon">
            <i :class="node.icon"></i>
            <span class="stage-node-badge" v-if="node.done">
              <i class="el-icon-check"></i>
            </span>
            <span class="stage-node-lock" v-else>
              <i class="el-icon-lock"></i>
            </span>
          </div>
          <div class="stage-node-info">
            <div class="stage-node-title">{{ node.title }}</div>
            <div class="stage-node-desc">{{ node.desc }}</div>
          </div>
          <div class="stage-node-tail">
            <i class="el-icon-position" v-if="node.done"></i>
            <i class="el-icon-time" v-else></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "WorkflowTimeline",
  props: {
    // 全流程阶段配置（done 为节点上线状态，componentPath 为已上线节点跳转目标）
    stages: {
      type: Array,
      default: () => [],
    },
    // 整体上线进度百分比（脊柱渐变填色截止位置）
    progressPercent: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      // 正在跳转动画中的节点key（260ms 后交由父页面执行真实跳转）
      jumpingKey: "",
    };
  },
  computed: {
    // 当前推进前沿阶段下标（第一个存在未上线节点的阶段，全部上线时返回-1）
    frontierStageIndex() {
      return this.stages.findIndex((stage) => !this.isStageDone(stage));
    },
  },
  methods: {
    // 阶段是否全部节点已上线
    isStageDone(stage) {
      return stage.nodes.every((node) => node.done);
    },
    // 阶段内已上线节点数（横幅进度用）
    stageDoneCount(stage) {
      return stage.nodes.filter((node) => node.done).length;
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
    // 节点点击：未上线提示开发中，已上线播放点击动画后交由父页面跳转
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
        self.$emit("navigate", node);
      }, 260);
    },
  },
};
</script>

<style lang="scss" scoped>
/* ===== 阶段时间轴 ===== */
.workflow-timeline {
  position: relative;
  max-width: 960px;
  margin: 0 auto;
  padding: 26px 0 10px;

  /* 中央脊柱：绿色段按上线进度截止，之后回落为灰色（--wf-spine-progress 由行内样式注入） */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 3px;
    margin-left: -1.5px;
    border-radius: 2px;
    background: linear-gradient(to bottom,
        var(--wf-primary) 0%,
        var(--wf-primary) var(--wf-spine-progress, 0%),
        var(--wf-border) var(--wf-spine-progress, 0%),
        var(--wf-border) 100%);
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
  transition: border-color 0.25s ease;

  &.done {
    border-color: var(--wf-primary);
  }

  /* 推进前沿阶段：呼吸圆点提示当前进度所在 */
  &.frontier {
    border-color: var(--wf-primary-dark);
  }
}

.stage-banner-pulse {
  width: 8px;
  height: 8px;
  margin-right: 8px;
  background: var(--wf-primary);
  border-radius: 50%;
  animation: frontierPulse 1.6s ease infinite;
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

/* 阶段进度小徽标：n/m */
.stage-banner-count {
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

.stage-banner-status {
  margin-left: 6px;
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
  position: relative;
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

  /* 未上线节点：虚线边框置灰不可点，点击仅提示 */
  &.todo {
    background: #fafcfb;
    border: 1px dashed #ccd8d2;

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

/* 未上线节点右上角"开发中"角标 */
.stage-node-corner {
  position: absolute;
  top: -1px;
  right: 14px;
  z-index: 1;
  padding: 1px 8px;
  font-size: 11px;
  color: #9aa8a1;
  background: #f0f4f2;
  border: 1px solid #e2eee7;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.stage-node-icon {
  position: relative;
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
  transition: transform 0.25s ease;
}

.stage-node-card.done:hover .stage-node-icon {
  transform: rotate(-6deg) scale(1.06);
}

.stage-node-card.todo .stage-node-icon {
  color: #9faea6;
  background: #f0f4f2;
}

/* 已上线节点图标右下角对勾徽标 */
.stage-node-badge {
  position: absolute;
  right: -5px;
  bottom: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 11px;
  color: #fff;
  background: var(--wf-primary);
  border: 2px solid #fff;
  border-radius: 50%;
}

/* 未上线节点图标右下角小锁徽标 */
.stage-node-lock {
  position: absolute;
  right: -5px;
  bottom: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #fff;
  background: #c6d1cb;
  border: 2px solid #fff;
  border-radius: 50%;
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
  transition: transform 0.25s ease;
}

.stage-node-card.done:hover .stage-node-tail {
  transform: translateX(3px);
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

@keyframes frontierPulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.45);
  }

  50% {
    box-shadow: 0 0 0 7px rgba(46, 204, 113, 0);
  }
}

/* ===== 响应式：窄屏收起为单侧时间轴 ===== */
@media screen and (max-width: 768px) {
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
