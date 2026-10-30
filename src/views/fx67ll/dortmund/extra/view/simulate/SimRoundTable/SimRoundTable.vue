<template>
  <!-- 数值模拟轮次记录卡片 -->
  <div class="status-card">
    <div class="status-header">
      <h2>轮次记录</h2>
      <el-tag size="small" effect="plain" type="success">共 {{ total }} 轮</el-tag>
    </div>

    <el-table v-loading="loading" :data="rounds" empty-text="暂无模拟轮次记录，点击操作台按钮确认记录第一轮">
      <el-table-column label="轮次" align="center" prop="roundNo" width="60" />
      <el-table-column label="模式" align="center" prop="simMode" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.simMode === "half" ? "半量" : "全量" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮开始数值" align="center" prop="startValue">
        <template slot-scope="scope">
          <span>{{ formatSimNumber(scope.row.startValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮参与数值" align="center" prop="joinValue">
        <template slot-scope="scope">
          <span>{{ formatSimNumber(scope.row.joinValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际回收数值" align="center" prop="returnValue">
        <template slot-scope="scope">
          <span>{{ formatSimNumber(scope.row.returnValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮结果" align="center" prop="isHit" width="90">
        <template slot-scope="scope">
          <span style="color: #2ecc71" v-if="scope.row.isHit === 'Y'">达成</span>
          <span style="color: #ff5a5f" v-else>未达成</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮结束数值" align="center" prop="endValue">
        <template slot-scope="scope">
          <span :style="{ color: scope.row.endValue >= scope.row.startValue ? '#2ecc71' : '#ff5a5f' }">{{
            formatSimNumber(scope.row.endValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数值变动" align="center" prop="roundChange" width="80">
        <template slot-scope="scope">
          <span>×{{ scope.row.roundChange }}</span>
        </template>
      </el-table-column>
      <el-table-column label="关联方案计划" align="center" prop="planCount" width="110">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.planCount > 0" size="small" effect="plain" type="success" class="round-plan-count-tag"
            @click.native="handleViewRoundPlans(scope.row)">{{ scope.row.planCount
            }} 条</el-tag>
          <span v-else>未关联</span>
        </template>
      </el-table-column>
      <el-table-column label="记录时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="pageNumValue" :limit.sync="pageSizeValue"
      :page-sizes="[10, 23, 50, 100]" @pagination="$emit('pagination')" />

    <!-- 关联方案计划只读摘要弹窗（点击轮次关联列打开，已有轮次没有补关联入口） -->
    <el-dialog title="本轮关联方案计划" :visible.sync="roundPlansOpen" :close-on-click-modal="false" width="680px"
      :style="`top: ${getDialogVerticalOffset(440)}`" append-to-body>
      <div class="round-plans-body" v-loading="roundPlansLoading">
        <template v-if="roundPlansList.length > 0">
          <div class="round-plans-item" v-for="plan in roundPlansList" :key="plan.planId">
            <div class="round-plans-item-header">
              <span class="round-plans-item-content">{{ plan.planContent }}</span>
              <span class="round-plans-item-extra">倍率：{{ plan.planRate || '空' }} 金额：{{ plan.planAmount || '空'
                }}</span>
            </div>
            <div class="round-plans-item-matches">
              <el-tag v-for="match in plan.matches || []" :key="match.matchId" size="mini" effect="plain"
                class="round-plans-match-tag">{{ formatRoundPlanMatchText(match) }}</el-tag>
            </div>
          </div>
        </template>
        <div class="round-plans-empty" v-else>暂无有权查看的关联方案计划</div>
        <div class="round-plans-hidden-tip" v-if="roundPlansHiddenCount > 0">另有 {{ roundPlansHiddenCount }}
          条无权查看的关联</div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="roundPlansOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getSimRoundPlans } from "@/api/fx67ll/dortmund/extraSimulate";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimRoundTable",
  props: {
    // 轮次记录列表数据
    rounds: {
      type: Array,
      default: () => [],
    },
    // 轮次记录总条数
    total: {
      type: Number,
      default: 0,
    },
    // 列表加载状态
    loading: {
      type: Boolean,
      default: false,
    },
    // 当前页码
    page: {
      type: Number,
      default: 1,
    },
    // 每页条数
    limit: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      // 关联方案计划只读摘要弹窗开关
      roundPlansOpen: false,
      // 关联方案计划摘要加载状态
      roundPlansLoading: false,
      // 关联方案计划摘要数据（当前用户可见的集合）
      roundPlansList: [],
      // 关联方案计划不可见关联条数
      roundPlansHiddenCount: 0,
    };
  },
  computed: {
    pageNumValue: {
      get() {
        return this.page;
      },
      set(val) {
        this.$emit("update:page", val);
      },
    },
    pageSizeValue: {
      get() {
        return this.limit;
      },
      set(val) {
        this.$emit("update:limit", val);
      },
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 点击轮次关联方案计划列：只读弹出当前用户可见的方案计划摘要
    handleViewRoundPlans(row) {
      this.roundPlansList = [];
      this.roundPlansHiddenCount = 0;
      this.roundPlansOpen = true;
      this.roundPlansLoading = true;
      getSimRoundPlans(row.simId).then((response) => {
        this.roundPlansList = response?.data?.plans || [];
        this.roundPlansHiddenCount = response?.data?.hiddenPlanCount || 0;
      }).finally(() => {
        this.roundPlansLoading = false;
      });
    },
    // 摘要比赛标签文案：主队 vs 客队 + 开赛时间 + 当前赛果
    formatRoundPlanMatchText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      const timeText = matchTime ? `（${matchTime}）` : "";
      const resultText = match.matchResult ? `，赛果：${match.matchResult}` : "";
      return `${vsText}${timeText}${resultText}`;
    },
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

.round-plan-count-tag {
  cursor: pointer;
}

.round-plans-body {
  min-height: 80px;
}

.round-plans-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: #f8f9fb;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.round-plans-item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.round-plans-item-content {
  flex: 1;
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.round-plans-item-extra {
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.round-plans-item-matches {
  display: flex;
  flex-wrap: wrap;
}

.round-plans-match-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.round-plans-empty {
  padding: 12px 0;
  font-size: 13px;
  color: #909399;
  text-align: center;
}

.round-plans-hidden-tip {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #a0712a;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border: 1px solid #f3d19e;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
}
</style>
