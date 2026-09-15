<template>
  <!-- 数值模拟操作台卡片（模式选择、参数配置、实时概览与操作） -->
  <div class="status-card">
    <div class="status-header">
      <h2>数值模拟操作台</h2>
      <el-tag size="small" effect="plain" :type="simForm.simMode === 'half' ? 'warning' : 'success'">
        当前模式：{{ simForm.simMode === "half" ? "半量滚动" : "全量滚动" }}</el-tag>
    </div>

    <div class="operation-panel">
      <!-- 模拟版本：切换查看各版本轮次，切换后载入该版本参数，支持管理版本启用停用 -->
      <div class="sim-version-row">
        <span class="sim-version-label">模拟版本</span>
        <el-select :value="currentVersionId" size="small" class="sim-version-select" placeholder="暂无版本，记录本轮或重新模拟将自动开启"
          @change="$emit('version-change', $event)">
          <el-option v-for="version in simEnabledVersionList" :key="version.versionId"
            :label="`${version.versionName || `版本${version.versionNo}`}（${parseTime(version.createTime, '{m}-{d} {h}:{i}')}）`"
            :value="version.versionId" />
        </el-select>
        <el-tag size="small" effect="plain" type="info">启用 {{ simEnabledVersionList.length }} / 共 {{ simVersionList.length }} 个版本</el-tag>
        <el-button size="small" type="success" plain icon="el-icon-setting" class="sim-version-manage-btn"
          @click="$emit('manage-version')">版本管理</el-button>
      </div>

      <!-- 参数配置开关：默认收起，配置写入本地缓存 -->
      <div class="sim-config-toggle" @click="configExpanded = !configExpanded">
        <i class="el-icon-set-up"></i>
        <span class="sim-config-toggle-title">参数配置</span>
        <span class="sim-config-toggle-summary">{{ simConfigSummary }}</span>
        <span class="sim-config-toggle-tip">配置已本地缓存，开启新版本时随版本保存，切换版本自动载入该版本参数</span>
        <i class="el-icon-arrow-down sim-config-toggle-arrow" :class="{ expanded: configExpanded }"></i>
      </div>

      <!-- 模拟模式与参数配置（收起状态仅展示概要） -->
      <div class="sim-config-area" v-show="configExpanded">
        <!-- 模拟模式：卡片切换 -->
        <div class="type-card-group">
          <div class="type-card full-card" :class="{ active: simForm.simMode === 'full' }"
            @click="simForm.simMode = 'full'">
            <i class="el-icon-s-finance"></i>
            <div class="card-text">
              <div class="card-title">全量滚动模式</div>
              <div class="card-desc">每轮全部数值参与滚动</div>
            </div>
          </div>
          <div class="type-card half-card" :class="{ active: simForm.simMode === 'half' }"
            @click="simForm.simMode = 'half'">
            <i class="el-icon-wallet"></i>
            <div class="card-text">
              <div class="card-title">半量滚动模式</div>
              <div class="card-desc">每轮一半参与滚动，一半保留</div>
            </div>
          </div>
        </div>

        <!-- 模拟参数配置（标签不换行） -->
        <el-form :model="simForm" ref="simForm" size="small" :inline="true" class="sim-config-form" :rules="simRules"
          label-width="80px">
          <el-form-item label="初始数值" prop="initialValue">
            <el-input-number v-model="simForm.initialValue" :controls="false" :precision="2" :min="0.01"
              style="width: 140px" placeholder="请输入初始数值" />
          </el-form-item>
          <el-form-item label="每轮系数" prop="coefficient">
            <el-input-number v-model="simForm.coefficient" :controls="false" :precision="2" :min="1.01"
              style="width: 140px" placeholder="请输入每轮系数" />
          </el-form-item>
          <el-form-item label="目标数值" prop="targetValue">
            <el-input-number v-model="simForm.targetValue" :controls="false" :precision="2" :min="0.01"
              style="width: 160px" placeholder="请输入目标数值" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 当前模式规则说明 -->
    <el-alert :title="simRuleText" type="info" :closable="false" show-icon class="sim-rule-alert" />

    <!-- 实时数据概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ formatSimNumber(simNowValue) }}</div>
        <div class="stat-label">当前数值</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatSimNumber(simNextStartValue) }}</div>
        <div class="stat-label">下一轮开始数值</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ simNextRoundNo }}</div>
        <div class="stat-label">下一轮轮次</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ simProgress }}</div>
        <div class="stat-label">目标进度</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ simRequiredRounds }}</div>
        <div class="stat-label">连续达成所需轮次</div>
      </div>
    </div>

    <!-- 模拟操作 -->
    <div class="sim-actions">
      <el-button type="success" size="small" icon="el-icon-top" :disabled="simSubmitting"
        @click="$emit('record', true)">本轮达成</el-button>
      <el-button type="danger" size="small" icon="el-icon-bottom" :disabled="simSubmitting"
        @click="$emit('record', false)">本轮未达成</el-button>
      <el-button type="info" size="small" icon="el-icon-refresh" plain @click="$emit('restart')">重新模拟</el-button>
      <el-button type="danger" size="small" icon="el-icon-delete" plain :disabled="!simLastRound || simLoading"
        @click="$emit('delete-last')">删除上一轮</el-button>
    </div>

    <el-alert v-if="simFinished" :title="`当前版本数值已归零，下一轮将自动开启新版本并从初始数值 ${formatSimNumber(simForm.initialValue)} 重新开始`"
      type="error" :closable="false" show-icon class="sim-rule-alert" />
    <el-alert v-else-if="simTargetHit" title="已达成目标数值，可继续记录实际数值或重新模拟" type="success" :closable="false" show-icon
      class="sim-rule-alert" />
  </div>
</template>

<script>
export default {
  name: "SimOperationPanel",
  props: {
    // 数值模拟参数配置
    simForm: {
      type: Object,
      required: true,
    },
    // 数值模拟版本记录列表
    simVersionList: {
      type: Array,
      default: () => [],
    },
    // 当前选中的版本主键
    currentVersionId: {
      type: [Number, String],
      default: null,
    },
    // 当前数值
    simNowValue: {
      type: Number,
      default: 0,
    },
    // 下一轮开始数值
    simNextStartValue: {
      type: Number,
      default: 0,
    },
    // 下一轮轮次序号
    simNextRoundNo: {
      type: Number,
      default: 1,
    },
    // 目标进度
    simProgress: {
      type: String,
      default: "0.00%",
    },
    // 连续达成所需轮次
    simRequiredRounds: {
      type: [Number, String],
      default: "-",
    },
    // 是否已归零终止
    simFinished: {
      type: Boolean,
      default: false,
    },
    // 是否已达成目标数值
    simTargetHit: {
      type: Boolean,
      default: false,
    },
    // 轮次记录列表加载状态
    simLoading: {
      type: Boolean,
      default: false,
    },
    // 轮次记录保存中状态
    simSubmitting: {
      type: Boolean,
      default: false,
    },
    // 最近一条轮次记录
    simLastRound: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      // 参数配置区域展开状态（默认收起）
      configExpanded: false,
      // 数值模拟参数校验
      simRules: {
        initialValue: [
          {
            required: true,
            message: "初始数值不能为空",
            trigger: "blur",
          },
        ],
        coefficient: [
          {
            required: true,
            message: "每轮系数不能为空",
            trigger: "blur",
          },
        ],
        targetValue: [
          {
            required: true,
            message: "目标数值不能为空",
            trigger: "blur",
          },
        ],
      },
    };
  },
  computed: {
    // 数值模拟启用的版本列表（停用版本不在下拉中展示）
    simEnabledVersionList() {
      return this.simVersionList.filter((item) => item.delFlag !== "2");
    },
    // 数值模拟参数配置概要（收起时展示当前模式与三项参数）
    simConfigSummary() {
      const modeText = this.simForm.simMode === "half" ? "半量" : "全量";
      return `${modeText} · 初始 ${this.formatSimNumber(this.simForm.initialValue)} · 系数 ${this.formatSimNumber(this.simForm.coefficient)} · 目标 ${this.formatSimNumber(this.simForm.targetValue)}`;
    },
    // 数值模拟当前模式规则说明
    simRuleText() {
      if (this.simForm.simMode === "half") {
        return `半量滚动模式：每轮以当前数值的一半参与滚动，另一半保留，本轮结束数值 = 保留的一半 + 实际回收数值；回收数值默认按系数计算，可按实际数值录入，支持部分回本`;
      }
      return `全量滚动模式：每轮以全部当前数值参与滚动，本轮结束数值 = 实际回收数值；回收数值默认按系数计算，可按实际数值录入，未达成不必然归零，支持部分回本`;
    },
  },
  methods: {
    // 数值模拟金额格式化，保留两位小数
    formatSimNumber(value) {
      return parseFloat(value || 0).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
.status-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.status-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2d3d;
}

.operation-panel {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  padding: 20px 24px;
  border: 1px solid #e2e8f0;
}

.sim-version-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.sim-version-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.sim-version-select {
  width: 260px;
}

.sim-version-manage-btn {
  margin-left: 0;
}

/* 参数配置开关 */
.sim-config-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  cursor: pointer;
  user-select: none;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.25s ease;

  &:hover {
    border-color: #2ecc71;

    .sim-config-toggle-arrow {
      color: #2ecc71;
    }
  }

  > i:first-child {
    font-size: 16px;
    color: #2ecc71;
  }
}

.sim-config-toggle-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  white-space: nowrap;
}

.sim-config-toggle-summary {
  font-size: 12px;
  color: #8392a5;
  white-space: nowrap;
}

.sim-config-toggle-tip {
  flex: 1;
  overflow: hidden;
  font-size: 12px;
  color: #b0b6bf;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sim-config-toggle-arrow {
  font-size: 14px;
  color: #8392a5;
  transition: transform 0.3s ease;

  &.expanded {
    transform: rotate(180deg);
  }
}

.sim-config-area {
  animation: simConfigFadeDown 0.3s ease;
}

@keyframes simConfigFadeDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.type-card-group {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.type-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.type-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.type-card i {
  font-size: 24px;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 8px;
  background: #f1f5f9;
}

.full-card i {
  color: #2ecc71;
  background: #eafaf3;
}

.half-card i {
  color: #f39c12;
  background: #fdf6ec;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 2px;
}

.card-desc {
  font-size: 12px;
  color: #8392a5;
}

/* 选中状态 */
.full-card.active {
  border-color: #2ecc71;
  background: #eafaf3;
  box-shadow: 0 2px 12px rgba(46, 204, 113, 0.15);
}

.half-card.active {
  border-color: #f39c12;
  background: #fdf6ec;
  box-shadow: 0 2px 12px rgba(243, 156, 18, 0.15);
}

.sim-config-form ::v-deep .el-form-item__label {
  white-space: nowrap;
}

.sim-rule-alert {
  margin: 16px 0 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.12);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2ecc71;
  margin-bottom: 4px;
  word-break: break-all;
}

.stat-label {
  font-size: 12px;
  color: #8392a5;
}

.sim-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 4px;
}

/* 响应式 */
@media (max-width: 1040px) {
  .type-card-group {
    flex-direction: column;
  }
}
</style>
