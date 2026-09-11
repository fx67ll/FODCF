<template>
  <div class="simulate-pane">
    <!-- 数值模拟操作台 -->
    <sim-operation-panel :sim-form="simForm" :sim-version-list="simVersionList" :current-version-id="currentVersionId"
      :sim-now-value="simNowValue" :sim-next-start-value="simNextStartValue" :sim-next-round-no="simNextRoundNo"
      :sim-progress="simProgress" :sim-required-rounds="simRequiredRounds" :sim-finished="simFinished"
      :sim-target-hit="simTargetHit" :sim-loading="simLoading" :sim-submitting="simSubmitting"
      :sim-last-round="simLastRound" @version-change="handleSimVersionChange" @record="handleSimRound"
      @restart="handleSimRestart" @delete-last="handleSimDeleteLast" @manage-version="simVersionManageOpen = true" />

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

    <!-- 版本管理弹窗 -->
    <sim-version-manage-dialog :visible.sync="simVersionManageOpen" :sim-version-list="simVersionList"
      @success="handleSimVersionManaged" />
  </div>
</template>

<script>
import {
  listExtraSimulate,
  addExtraSimulate,
  delExtraSimulate,
  listExtraSimulateVersion,
  addExtraSimulateVersion,
} from "@/api/fx67ll/dortmund/extraSimulate";

import SimOperationPanel from "../SimOperationPanel/SimOperationPanel.vue";
import SimRoundTable from "../SimRoundTable/SimRoundTable.vue";
import SimCompareTable from "../SimCompareTable/SimCompareTable.vue";
import SimRecordDialog from "../SimRecordDialog/SimRecordDialog.vue";
import SimVersionManageDialog from "../SimVersionManageDialog/SimVersionManageDialog.vue";

// 数值模拟参数本地缓存键
const SIM_CONFIG_CACHE_KEY = "dortmund-extra-sim-config";

export default {
  name: "SimulatePane",
  components: { SimOperationPanel, SimRoundTable, SimCompareTable, SimRecordDialog, SimVersionManageDialog },
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
      // 数值模拟版本记录列表数据（接口按版本倒序返回，第一条为最新版本）
      simVersionList: [],
      // 数值模拟当前选中的版本主键
      currentVersionId: null,
      // 数值模拟轮次记录列表加载状态
      simLoading: false,
      // 数值模拟轮次记录保存中状态
      simSubmitting: false,
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
      // 数值模拟版本管理弹窗开关
      simVersionManageOpen: false,
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
    // 数值模拟下一轮是否从初始数值重新开始（当前版本无记录或上轮归零）
    simRestartFromInitial() {
      return !this.simLastRound || this.simLastRound.endValue <= 0;
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
    const self = this;
    this.loadSimConfigCache();
    this.getSimVersionList().then(() => {
      self.getSimList();
    });
  },
  watch: {
    // 数值模拟参数变动时写入本地缓存，下次进入页面自动恢复
    simForm: {
      handler(val) {
        localStorage.setItem(SIM_CONFIG_CACHE_KEY, JSON.stringify(val));
      },
      deep: true,
    },
  },
  methods: {
    // 载入本地缓存的参数配置，无版本选中时作为默认配置
    loadSimConfigCache() {
      const cached = localStorage.getItem(SIM_CONFIG_CACHE_KEY);
      if (!cached) {
        return;
      }
      try {
        const config = JSON.parse(cached);
        this.simForm = {
          simMode: config.simMode === "half" ? "half" : "full",
          initialValue: parseFloat(config.initialValue || 0) || 100,
          coefficient: parseFloat(config.coefficient || 0) || 2,
          targetValue: parseFloat(config.targetValue || 0) || 500000,
        };
      } catch (err) {
        // 缓存解析失败时保持默认配置
      }
    },
    // 查询数值模拟版本记录列表，无选中版本时默认选中最新启用版本，开启新版本后强制切换到最新版本
    getSimVersionList(isSelectLatest) {
      const self = this;
      return listExtraSimulateVersion().then((response) => {
        const rows = response?.rows || [];
        const enabledRows = rows.filter((item) => item.delFlag !== "2");
        self.simVersionList = rows;
        if (
          isSelectLatest ||
          !enabledRows.some((item) => item.versionId === self.currentVersionId)
        ) {
          const latestVersion = enabledRows.length > 0 ? enabledRows[0] : null;
          self.currentVersionId = latestVersion
            ? latestVersion.versionId
            : null;
          if (latestVersion) {
            self.loadSimVersionParams(latestVersion);
          }
        }
      });
    },
    // 切换数值模拟版本，载入该版本的参数配置并刷新轮次记录
    handleSimVersionChange(versionId) {
      this.currentVersionId = versionId;
      const version = this.simVersionList.find(
        (item) => item.versionId === versionId
      );
      if (version) {
        this.loadSimVersionParams(version);
      }
      this.getSimList();
    },
    // 载入数值模拟版本保存的参数配置
    loadSimVersionParams(version) {
      this.simForm.simMode = version.simMode || "full";
      this.simForm.initialValue = parseFloat(version.initialValue || 0);
      this.simForm.coefficient = parseFloat(version.coefficient || 0);
      this.simForm.targetValue = parseFloat(version.targetValue || 0);
    },
    // 版本管理弹窗保存成功后刷新版本列表，停用当前选中版本时自动切换到最新启用版本
    handleSimVersionManaged() {
      this.getSimVersionList().then(() => {
        this.getSimList();
      });
    },
    // 查询数值模拟轮次记录分页列表（接口按记录倒序返回）
    getSimList() {
      const self = this;
      if (!this.currentVersionId) {
        this.simRounds = [];
        this.simTotal = 0;
        this.simLatestRound = null;
        return;
      }
      this.simLoading = true;
      listExtraSimulate({
        ...this.simQueryParams,
        versionId: this.currentVersionId,
      })
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
      if (!this.currentVersionId) {
        this.simLatestRound = null;
        return;
      }
      listExtraSimulate({
        pageNum: 1,
        pageSize: 1,
        versionId: this.currentVersionId,
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
    // 提交本轮结果记录，当前版本已归零或尚无版本时自动开启新版本再记录
    submitSimRound(record) {
      const self = this;
      if (!this.currentVersionId || this.simFinished) {
        this.createSimVersion().then(() => {
          self.doSubmitSimRound(record);
        });
      } else {
        this.doSubmitSimRound(record);
      }
    },
    // 保存本轮结果记录，保存后下一轮从保存的结束数值继续
    doSubmitSimRound(record) {
      const self = this;
      this.simSubmitting = true;
      addExtraSimulate({
        versionId: self.currentVersionId,
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
          self.simRecordOpen = false;
          self.$modal.msgSuccess("本轮记录保存成功");
          self.getSimList();
        })
        .finally(() => {
          self.simSubmitting = false;
        });
    },
    // 以当前参数配置开启新的数值模拟版本，历史轮次归档到旧版本
    createSimVersion() {
      const self = this;
      return addExtraSimulateVersion({
        simMode: self.simForm.simMode,
        initialValue: self.formatSimNumber(self.simForm.initialValue),
        coefficient: self.formatSimNumber(self.simForm.coefficient),
        targetValue: self.formatSimNumber(self.simForm.targetValue),
      }).then(() => self.getSimVersionList(true));
    },
    // 手动开启新的数值模拟版本，下一轮从初始数值重新开始，历史轮次归档到旧版本
    handleSimRestart() {
      this.createSimVersion().then(() => {
        this.$modal.msgSuccess(
          `已开启新版本，下一轮将从初始数值 ${this.formatSimNumber(this.simForm.initialValue)} 重新开始`
        );
        this.getSimList();
      });
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
