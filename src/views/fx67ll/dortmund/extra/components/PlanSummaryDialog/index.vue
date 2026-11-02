<template>
  <!-- 关联方案计划只读摘要弹窗（盈亏记录/模拟轮次共用，展示当前用户可见的方案计划摘要） -->
  <el-dialog :title="title" :visible.sync="dialogVisible" :close-on-click-modal="false" width="680px"
    :style="`top: ${getDialogVerticalOffset(440)}`" append-to-body custom-class="plan-summary-dialog">
    <template slot="title">
      <div class="plan-summary-header">
        <div class="plan-summary-header-icon">
          <i class="el-icon-collection-tag"></i>
        </div>
        <div class="plan-summary-header-text">
          <div class="plan-summary-header-title">{{ title }}</div>
          <div class="plan-summary-header-sub">只读摘要展示，关联维护请在原录入页操作</div>
        </div>
      </div>
    </template>
    <div class="plan-summary-body" v-loading="loading">
      <!-- 可见方案摘要卡片 -->
      <template v-if="plans.length > 0">
        <div class="plan-summary-item" v-for="(plan, index) in plans" :key="plan.planId"
          :style="{ animationDelay: index * 0.05 + 's' }">
          <div class="plan-summary-item-header">
            <span class="plan-summary-item-content">{{ plan.planContent }}</span>
            <span class="plan-summary-item-extra">倍率：{{ plan.planRate || '空' }} 金额：{{ plan.planAmount || '空'
              }}</span>
          </div>
          <div class="plan-summary-item-matches">
            <el-tag v-for="match in plan.matches || []" :key="match.matchId" size="mini" effect="plain"
              class="plan-summary-match-tag">{{ formatPlanMatchText(match) }}</el-tag>
          </div>
        </div>
      </template>
      <!-- 无可见关联占位 -->
      <div class="plan-summary-empty" v-else>暂无有权查看的关联方案计划</div>
      <!-- 不可见关联提示横幅 -->
      <div class="plan-summary-hidden-tip" v-if="hiddenCount > 0">另有 {{ hiddenCount }} 条无权查看的关联，方案计划本身不会删除
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "PlanSummaryDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 弹窗标题（盈亏记录/模拟轮次各自传入）
    title: {
      type: String,
      default: "关联方案计划",
    },
    // 摘要加载状态
    loading: {
      type: Boolean,
      default: false,
    },
    // 当前用户可见的方案计划摘要数据
    plans: {
      type: Array,
      default: () => [],
    },
    // 无权查看的关联条数
    hiddenCount: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 摘要比赛标签文案：主队 vs 客队 + 开赛时间 + 当前赛果
    formatPlanMatchText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      const timeText = matchTime ? `（${matchTime}）` : "";
      const resultText = match.matchResult ? `，赛果：${match.matchResult}` : "";
      return `${vsText}${timeText}${resultText}`;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 弹窗视觉语言：圆角、渐变图标（与 extra/simulate 弹窗同一风格体系） */
::v-deep .plan-summary-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(46, 204, 113, 0.18);
}

.plan-summary-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f2;
}

.plan-summary-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.3);
}

.plan-summary-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.plan-summary-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8b84;
}

.plan-summary-body {
  min-height: 80px;
}

::v-deep .plan-summary-dialog .el-dialog__body {
  padding-top: 16px;
}

::v-deep .plan-summary-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f4f2;
}

/* 方案摘要卡片：阶梯入场 + 悬浮提亮 */
.plan-summary-item {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #f8fafb;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  animation: planSummaryFadeUp 0.3s ease both;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #bfe8cf;
    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.1);
    transform: translateY(-2px);
  }
}

.plan-summary-item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.plan-summary-item-content {
  flex: 1;
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.plan-summary-item-extra {
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.plan-summary-item-matches {
  display: flex;
  flex-wrap: wrap;
}

.plan-summary-match-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.plan-summary-empty {
  padding: 12px 0;
  font-size: 13px;
  color: #909399;
  text-align: center;
}

.plan-summary-hidden-tip {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #a0712a;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border: 1px solid #f3d19e;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
}

@keyframes planSummaryFadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
