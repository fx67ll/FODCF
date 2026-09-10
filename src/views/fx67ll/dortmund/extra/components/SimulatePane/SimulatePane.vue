<template>
  <div class="simulate-pane">
    <!-- 数值模拟操作台 -->
    <sim-operation-panel :sim-form="simForm" :sim-now-value="simNowValue" :sim-next-start-value="simNextStartValue"
      :sim-next-round-no="simNextRoundNo" :sim-progress="simProgress" :sim-required-rounds="simRequiredRounds"
      :sim-finished="simFinished" :sim-restart-pending="simRestartPending" :sim-target-hit="simTargetHit"
      :sim-loading="simLoading" :sim-submitting="simSubmitting" :sim-last-round="simLastRound"
      @record="handleSimRound" @restart="handleSimRestart" @delete-last="handleSimDeleteLast" />

    <!-- 轮次记录 -->
    <sim-round-table :rounds="simRounds" :total="simTotal" :loading="simLoading" :page.sync="simQueryParams.pageNum"
      :limit.sync="simQueryParams.pageSize" @pagination="getSimList" />

    <!-- 两种模式对比 -->
    <sim-compare-table :compare-list="simCompareList" />

    <div class="sim-footer-tip">本功能仅基于给定数值做滚动测算与模式对比，不构成任何参考建议</div>

    <!-- 记录本轮结果弹窗 -->
    <sim-record-dialog :visible.sync="simRecordOpen" :is-hit="simRecordIsHit" :sim-mode="simForm.simMode"
      :coefficient="simForm.coefficient" :next-start-value="simNextStartValue" :submitting="simSubmitting"
      @confirm="submitSimRound" />
  </div>
</template>

<script>
import {
  listExtraSimulate,
  addExtraSimulate,
  delExtraSimulate,
} from "@/api/fx67ll/dortmund/extraSimulate";

import SimOperationPanel from "../SimOperationPanel/SimOperationPanel.vue";
import SimRoundTable from "../SimRoundTable/SimRoundTable.vue";
import SimCompareTable from "../SimCompareTable/SimCompareTable.vue";
import SimRecordDialog from "../SimRecordDialog/SimRecordDialog.vue";

export default {
  name: "SimulatePane",
  components: { SimOperationPanel, SimRoundTable, SimCompareTable, SimRecordDialog },
  data() {
    return {
      // 数值模拟参数配置
      simForm: {
        simMode: "full",
        initialValue: 100,
        coefficient: 2,
        targetValue: 500000,
      },
      // 数值模拟轮次记录列表数据
      simRounds: [],
      // 数值模拟轮次记录列表加载状态
      simLoading: false,
      // 数值模拟轮次记录保存中状态
      simSubmitting: false,
      // 数值模拟是否已手动重置（下一轮从初始数值重新开始）
      simRestartPending: false,
      // 数值模拟轮次记录查询参数
      simQueryParams: {
        pageNum: 1,
        pageSize: 10,
      },
      // 数值模拟轮次记录总条数
      simTotal: 0,
      // 数值模拟最近一条轮次记录（单独查询，用于驱动下一轮开始数值与轮次）
      simLatestRound: null,
      // 数值模拟记录本轮结果弹窗开关
      simRecordOpen: false,
      // 数值模拟本轮结果（Y达成 N未达成），打开弹窗前记录
      simRecordIsHit: "Y",
    };
  },
  computed: {
    // 数值模拟当前模式每轮达成后的数值乘数
    simWinFactor() {
      return this.simForm.simMode === "half"
        ? (1 + parseFloat(this.simForm.coefficient || 0)) / 2
        : parseFloat(this.simForm.coefficient || 0);
    },
    // 数值模拟最近一条轮次记录
    simLastRound() {
      return this.simLatestRound;
    },
    // 数值模拟下一轮是否从初始数值重新开始（无记录、上轮归零或手动重置）
    simRestartFromInitial() {
      return (
        !this.simLastRound ||
        this.simLastRound.endValue <= 0 ||
        this.simRestartPending
      );
    },
    // 数值模拟当前数值（最近一条记录的结束数值，无记录时为初始数值）
    simNowValue() {
      return this.simLastRound
        ? this.simLastRound.endValue
        : parseFloat(this.simForm.initialValue || 0);
    },
    // 数值模拟下一轮开始数值
    simNextStartValue() {
      return this.simRestartFromInitial
        ? parseFloat(this.simForm.initialValue || 0)
        : this.simLastRound.endValue;
    },
    // 数值模拟下一轮轮次序号
    simNextRoundNo() {
      return this.simRestartFromInitial ? 1 : this.simLastRound.roundNo + 1;
    },
    // 数值模拟目标进度
    simProgress() {
      const targetValue = parseFloat(this.simForm.targetValue || 0);
      if (targetValue <= 0) {
        return "0.00%";
      }
      return ((this.simNowValue / targetValue) * 100).toFixed(2) + "%";
    },
    // 数值模拟从下一轮开始数值连续达成达目标所需轮次
    simRequiredRounds() {
      return this.countSimRequiredRounds(
        this.simNextStartValue,
        parseFloat(this.simForm.targetValue || 0),
        this.simWinFactor
      );
    },
    // 数值模拟是否已归零终止
    simFinished() {
      return this.simLastRound != null && this.simLastRound.endValue <= 0;
    },
    // 数值模拟是否已达成目标数值
    simTargetHit() {
      const targetValue = parseFloat(this.simForm.targetValue || 0);
      return (
        this.simLastRound != null &&
        targetValue > 0 &&
        this.simNowValue >= targetValue
      );
    },
    // 数值模拟两种模式对比数据
    simCompareList() {
      const initialValue = parseFloat(this.simForm.initialValue || 0);
      const targetValue = parseFloat(this.simForm.targetValue || 0);
      const coefficient = parseFloat(this.simForm.coefficient || 0);
      const halfWinFactor = (1 + coefficient) / 2;
      return [
        {
          compareDim: "每轮达成乘数",
          fullMode: "×" + this.formatSimFactor(coefficient),
          halfMode: "×" + this.formatSimFactor(halfWinFactor),
        },
        {
          compareDim: "每轮未达成乘数",
          fullMode: "×0",
          halfMode: "×0.5",
        },
        {
          compareDim: "连续达成达目标所需轮次",
          fullMode: this.countSimRequiredRounds(initialValue, targetValue, coefficient),
          halfMode: this.countSimRequiredRounds(initialValue, targetValue, halfWinFactor),
        },
        {
          compareDim: "单轮未达成后果",
          fullMode: "数值归零，模拟终止",
          halfMode: "数值减半，可继续",
        },
        {
          compareDim: "容错性",
          fullMode: "无",
          halfMode: "有",
        },
      ];
    },
  },
  created() {
    this.getSimList();
  },
  methods: {
    // 查询数值模拟轮次记录分页列表（接口按记录倒序返回）
    getSimList() {
      const self = this;
      this.simLoading = true;
      listExtraSimulate(this.simQueryParams)
        .then((response) => {
          self.simRounds = (response?.rows || []).map((item) =>
            self.formatSimRound(item)
          );
          self.simTotal = response?.total || 0;
        })
        .finally(() => {
          self.simLoading = false;
        });
      this.getSimLatestRound();
    },
    // 查询数值模拟最近一条轮次记录，驱动下一轮开始数值与轮次
    getSimLatestRound() {
      const self = this;
      listExtraSimulate({
        pageNum: 1,
        pageSize: 1,
      }).then((response) => {
        const rows = response?.rows || [];
        self.simLatestRound =
          rows.length > 0 ? self.formatSimRound(rows[0]) : null;
      });
    },
    // 数值模拟轮次记录数值字段格式化
    formatSimRound(item) {
      return {
        ...item,
        roundNo: parseInt(item.roundNo || 0),
        startValue: parseFloat(item.startValue || 0),
        joinValue: parseFloat(item.joinValue || 0),
        returnValue: parseFloat(item.returnValue || 0),
        endValue: parseFloat(item.endValue || 0),
        roundChange: this.formatSimFactor(item.roundChange || 0),
      };
    },
    // 打开记录本轮结果弹窗
    handleSimRound(hit) {
      this.simRecordIsHit = hit ? "Y" : "N";
      this.simRecordOpen = true;
    },
    // 提交本轮结果记录，保存后下一轮从保存的结束数值继续
    submitSimRound(record) {
      const self = this;
      this.simSubmitting = true;
      addExtraSimulate({
        simMode: self.simForm.simMode,
        roundNo: self.simNextRoundNo,
        startValue: self.formatSimNumber(self.simNextStartValue),
        joinValue: self.formatSimNumber(record.joinValue),
        isHit: record.isHit,
        returnValue: self.formatSimNumber(record.returnValue),
        endValue: self.formatSimNumber(record.endValue),
        roundChange: String(
          self.formatSimFactor(record.endValue / self.simNextStartValue)
        ),
        coefficient: self.formatSimNumber(self.simForm.coefficient),
      })
        .then(() => {
          self.simRestartPending = false;
          self.simRecordOpen = false;
          self.$modal.msgSuccess("本轮记录保存成功");
          self.getSimList();
        })
        .finally(() => {
          self.simSubmitting = false;
        });
    },
    // 手动重置数值模拟，下一轮从初始数值重新开始，历史记录保留
    handleSimRestart() {
      this.simRestartPending = true;
      this.$modal.msgSuccess(
        `下一轮将从初始数值 ${this.formatSimNumber(this.simForm.initialValue)} 重新开始`
      );
    },
    // 删除最近一条数值模拟轮次记录，下一轮回退到上一条的结束数值
    handleSimDeleteLast() {
      const self = this;
      const lastRound = this.simLastRound;
      if (!lastRound) {
        return;
      }
      this.$modal
        .confirm(
          `是否确认删除第${lastRound.roundNo}轮记录（结束数值 ${this.formatSimNumber(lastRound.endValue)}）？删除后将从上一轮结束数值继续`
        )
        .then(function () {
          return delExtraSimulate(lastRound.simId);
        })
        .then(() => {
          self.simRestartPending = false;
          self.$modal.msgSuccess("删除成功");
          self.getSimList();
        })
        .catch(() => { });
    },
    // 计算从初始数值连续达成达目标所需的最少轮次
    countSimRequiredRounds(initialValue, targetValue, winFactor) {
      if (initialValue <= 0 || targetValue <= 0 || winFactor <= 1) {
        return "-";
      }
      if (initialValue >= targetValue) {
        return 0;
      }
      return Math.ceil(
        Math.log(targetValue / initialValue) / Math.log(winFactor)
      );
    },
    // 数值模拟金额格式化，保留两位小数
    formatSimNumber(value) {
      return parseFloat(value || 0).toFixed(2);
    },
    // 数值模拟乘数格式化，去除多余的零
    formatSimFactor(value) {
      return parseFloat(parseFloat(value || 0).toFixed(4));
    },
  },
};
</script>

<style lang="scss" scoped>
.sim-footer-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}
</style>
