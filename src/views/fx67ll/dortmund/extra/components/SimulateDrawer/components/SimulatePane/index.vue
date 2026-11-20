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
      :coefficient="simForm.coefficient" :next-start-value="simNextStartValue" :next-round-no="simNextRoundNo"
      :submitting="simSubmitting" @confirm="submitSimRound" />

    <!-- 版本管理弹窗 -->
    <sim-version-manage-dialog :visible.sync="simVersionManageOpen" :sim-version-list="simVersionList"
      @success="handleSimVersionManaged" @invalidate="handleSimVersionInvalidate" />

    <!-- 开启新版本确认弹窗 -->
    <sim-version-create-dialog :visible.sync="simVersionCreateOpen" :sim-form="simForm"
      :submitting="simVersionCreateSubmitting" @confirm="handleSimVersionCreateConfirm" />

    <!-- 版本作废两步确认弹窗 -->
    <sim-version-invalidate-confirm-dialog :visible.sync="simInvalidateConfirmOpen" :version="simInvalidateVersion"
      @need-secondary-confirm="simInvalidateDangerOpen = true" />
    <sim-version-invalidate-danger-dialog :visible.sync="simInvalidateDangerOpen" :version="simInvalidateVersion"
      :loading="simInvalidateSubmitting" @confirm="handleSimInvalidateConfirm" />

    <!-- 版本强制作废系统通知弹窗 -->
    <sim-version-invalid-notice-dialog :visible.sync="simInvalidNoticeOpen" :version="simInvalidNoticeVersion"
      :invalid-round-no="simInvalidNoticeRoundNo" />
  </div>
</template>

<script>
import {
  listExtraSimulate,
  addExtraSimulate,
  delExtraSimulate,
  listExtraSimulateVersion,
  addExtraSimulateVersion,
  invalidateExtraSimulateVersion,
} from "@/api/fx67ll/dortmund/extraSimulate";

import SimOperationPanel from "../SimOperationPanel/index.vue";
import SimRoundTable from "../SimRoundTable/index.vue";
import SimCompareTable from "../SimCompareTable/index.vue";
import SimRecordDialog from "../SimRecordDialog/index.vue";
import SimVersionManageDialog from "../SimVersionManageDialog/index.vue";
import SimVersionCreateDialog from "../SimVersionCreateDialog/index.vue";
import SimVersionInvalidateConfirmDialog from "../SimVersionInvalidateConfirmDialog/index.vue";
import SimVersionInvalidateDangerDialog from "../SimVersionInvalidateDangerDialog/index.vue";
import SimVersionInvalidNoticeDialog from "../SimVersionInvalidNoticeDialog/index.vue";
import {
  DORTMUND_LIMITS,
  DORTMUND_NUMERIC,
  DORTMUND_PAGINATION,
  DORTMUND_SIMULATION_DEFAULTS,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import { formatPlainDecimal } from "@/views/fx67ll/dortmund/other/utils/validation";

// 数值模拟参数本地缓存键
const SIM_CONFIG_CACHE_KEY = "dortmund-extra-sim-config";

export default {
  name: "SimulatePane",
  components: {
    SimOperationPanel,
    SimRoundTable,
    SimCompareTable,
    SimRecordDialog,
    SimVersionManageDialog,
    SimVersionCreateDialog,
    SimVersionInvalidateConfirmDialog,
    SimVersionInvalidateDangerDialog,
    SimVersionInvalidNoticeDialog,
  },
  data() {
    return {
      // 数值模拟参数配置
      simForm: {
        simMode: DORTMUND_SIMULATION_DEFAULTS.mode,
        initialValue: DORTMUND_SIMULATION_DEFAULTS.initialValue,
        coefficient: DORTMUND_SIMULATION_DEFAULTS.coefficient,
        targetValue: DORTMUND_SIMULATION_DEFAULTS.targetValue,
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
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
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
      // 数值模拟开启新版本确认弹窗开关
      simVersionCreateOpen: false,
      // 数值模拟开启新版本提交中状态
      simVersionCreateSubmitting: false,
      // 数值模拟暂存的本轮结果（开启新版本确认后继续保存）
      pendingSimRecord: null,
      // 数值模拟待作废的版本记录
      simInvalidateVersion: null,
      // 数值模拟版本作废第一步确认弹窗开关
      simInvalidateConfirmOpen: false,
      // 数值模拟版本作废第二步确认弹窗开关
      simInvalidateDangerOpen: false,
      // 数值模拟版本作废提交中状态
      simInvalidateSubmitting: false,
      // 数值模拟版本强制作废系统通知弹窗开关
      simInvalidNoticeOpen: false,
      // 数值模拟被强制作废的版本记录
      simInvalidNoticeVersion: null,
      // 数值模拟触发强制作废的负轮次
      simInvalidNoticeRoundNo: "",
    };
  },
  computed: {
    // 数值模拟当前模式每轮达成后的数值乘数
    simWinFactor() {
      const coefficient = this.toFiniteNumber(this.simForm.coefficient);
      return this.simForm.simMode === "half"
        ? (1 + coefficient) / 2
        : coefficient;
    },
    // 数值模拟最近一条轮次记录
    simLastRound() {
      return this.simLatestRound;
    },
    // 数值模拟下一轮是否从初始数值重新开始（当前版本无记录或上轮归零）
    simRestartFromInitial() {
      return !this.simLastRound || this.toFiniteNumber(this.simLastRound.endValue) <= 0;
    },
    // 数值模拟当前数值（最近一条记录的结束数值，无记录时为初始数值）
    simNowValue() {
      return this.simLastRound
        ? this.toFiniteNumber(this.simLastRound.endValue)
        : this.toFiniteNumber(this.simForm.initialValue);
    },
    // 数值模拟下一轮开始数值
    simNextStartValue() {
      return this.simRestartFromInitial
        ? this.toFiniteNumber(this.simForm.initialValue)
        : this.toFiniteNumber(this.simLastRound.endValue);
    },
    // 数值模拟下一轮轮次序号
    simNextRoundNo() {
      return this.simRestartFromInitial ? 1 : this.simLastRound.roundNo + 1;
    },
    // 数值模拟目标进度
    simProgress() {
      const targetValue = this.toFiniteNumber(this.simForm.targetValue);
      if (targetValue <= 0) {
        return "0.00%";
      }
      const progress = (this.simNowValue / targetValue) * 100;
      return Number.isFinite(progress)
        ? progress.toFixed(DORTMUND_NUMERIC.maxSimulationFractionDigits) + "%"
        : `0.${"0".repeat(DORTMUND_NUMERIC.maxSimulationFractionDigits)}%`;
    },
    // 数值模拟从下一轮开始数值连续达成达目标所需轮次
    simRequiredRounds() {
      return this.countSimRequiredRounds(
        this.simNextStartValue,
        this.toFiniteNumber(this.simForm.targetValue),
        this.simWinFactor
      );
    },
    // 数值模拟是否已归零终止
    simFinished() {
      return this.simLastRound != null && this.toFiniteNumber(this.simLastRound.endValue) <= 0;
    },
    // 数值模拟是否已达成目标数值
    simTargetHit() {
      const targetValue = this.toFiniteNumber(this.simForm.targetValue);
      return (
        this.simLastRound != null &&
        targetValue > 0 &&
        this.simNowValue >= targetValue
      );
    },
    // 数值模拟两种模式对比数据
    simCompareList() {
      const initialValue = this.toFiniteNumber(this.simForm.initialValue);
      const targetValue = this.toFiniteNumber(this.simForm.targetValue);
      const coefficient = this.toFiniteNumber(this.simForm.coefficient);
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
    this.getSimVersionList()
      .catch(() => {
        // 版本列表加载失败时保留空态，避免使用上一次进入页面时的旧版本继续提交
        self.simVersionList = [];
        self.currentVersionId = null;
      })
      .then(() => {
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
    // 将外部数值安全转换为有限数字，异常值按指定兜底值展示，避免污染后续计算
    toFiniteNumber(value, fallback = 0) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    },
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
          initialValue: this.toFiniteNumber(config.initialValue, 100) || 100,
          coefficient: this.toFiniteNumber(config.coefficient, 2) || 2,
          targetValue: this.toFiniteNumber(config.targetValue, 500000) || 500000,
        };
      } catch (err) {
        // 缓存解析失败时保持默认配置
      }
    },
    // 查询数值模拟版本记录列表，无选中版本时默认选中最新启用版本，开启新版本后强制切换到最新版本
    getSimVersionList(isSelectLatest) {
      const self = this;
      return listExtraSimulateVersion()
        .then((response) => {
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
        })
        .catch((error) => {
          // 查询失败时清空内存中的版本，避免继续基于过期版本创建轮次
          self.simVersionList = [];
          self.currentVersionId = null;
          throw error;
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
      const initialValue = this.toFiniteNumber(version.initialValue);
      const coefficient = this.toFiniteNumber(version.coefficient);
      const targetValue = this.toFiniteNumber(version.targetValue);
      this.simForm.simMode = version.simMode === "half" ? "half" : "full";
      this.simForm.initialValue = initialValue > 0 ? initialValue : 100;
      this.simForm.coefficient = coefficient > 1 ? coefficient : 2;
      this.simForm.targetValue = targetValue > 0 ? targetValue : 500000;
    },
    // 版本管理弹窗保存成功后刷新版本列表，停用当前选中版本时自动切换到最新启用版本
    handleSimVersionManaged() {
      this.getSimVersionList()
        .then(() => {
          this.getSimList();
        })
        .catch(() => {
          this.simRounds = [];
          this.simTotal = 0;
          this.simLatestRound = null;
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
        .catch(() => {
          // 列表失败时清空旧轮次，避免与当前版本、分页条件不一致
          self.simRounds = [];
          self.simTotal = 0;
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
        pageSize: DORTMUND_PAGINATION.existenceCheckPageSize,
        versionId: this.currentVersionId,
      }).then((response) => {
        const rows = response?.rows || [];
        self.simLatestRound =
          rows.length > 0 ? self.formatSimRound(rows[0]) : null;
      }).catch(() => {
        // 最近一轮失败时按无记录处理，禁止继续沿用旧轮次累加
        self.simLatestRound = null;
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
      if (!this.validateSimConfig()) {
        return;
      }
      this.simRecordIsHit = hit ? "Y" : "N";
      this.simRecordOpen = true;
    },
    // 提交本轮结果记录，当前版本已归零或尚无版本时先经确认弹窗开启新版本再记录
    submitSimRound(record) {
      if (!this.currentVersionId || this.simFinished) {
        // 暂存本轮结果，待开启新版本确认创建后再继续保存，取消则中止记录
        this.pendingSimRecord = record;
        this.simVersionCreateOpen = true;
      } else {
        this.doSubmitSimRound(record);
      }
    },
    // 保存本轮结果记录，保存后下一轮从保存的结束数值继续；可选携带关联方案计划数据
    doSubmitSimRound(record) {
      const self = this;
      if (!this.validateSimConfig() || !this.validateSimRound(record)) {
        return;
      }
      const roundNo = Number(record.roundNo);
      const startValue = this.toFiniteNumber(this.simNextStartValue);
      const endValue = this.toFiniteNumber(record.endValue);
      const roundChange = self.formatSimRoundChange(endValue / startValue);
      if (!roundChange) {
        this.$modal.msgWarning("本轮数值变动倍数超出可保存范围，请检查开始数值和结束数值");
        return;
      }
      this.simSubmitting = true;
      // 关联方案计划提交规则：没动过关联区域不带 planIds、newPlans（该轮不关联）
      const planLinkData = record.planLink || null;
      addExtraSimulate({
        versionId: self.currentVersionId,
        simMode: self.simForm.simMode,
        roundNo: roundNo,
        startValue: self.formatSimNumber(startValue),
        joinValue: self.formatSimNumber(record.joinValue),
        isHit: record.isHit,
        returnValue: self.formatSimNumber(record.returnValue),
        endValue: self.formatSimNumber(endValue),
        roundChange: roundChange,
        coefficient: self.formatSimNumber(self.simForm.coefficient),
        ...planLinkData,
      })
        .then(() => {
          self.simRecordOpen = false;
          if (roundNo < 0) {
            // 轮次为负，版本已被后端强制作废，弹窗告知并刷新版本列表
            self.simInvalidNoticeVersion =
              self.simVersionList.find(
                (item) => item.versionId === self.currentVersionId
              ) || { versionId: self.currentVersionId };
            self.simInvalidNoticeRoundNo = roundNo;
            self.simInvalidNoticeOpen = true;
            self.getSimVersionList()
              .then(() => {
                self.getSimList();
              })
              .catch(() => {
                self.simRounds = [];
                self.simTotal = 0;
                self.simLatestRound = null;
              });
          } else {
            self.$modal.msgSuccess("本轮记录保存成功");
            self.getSimList();
          }
        })
        .catch(() => {
          // 接口错误由请求拦截器统一提示，保留弹窗与已填内容供用户重试
        })
        .finally(() => {
          self.simSubmitting = false;
        });
    },
    // 以当前参数配置开启新的数值模拟版本，历史轮次归档到旧版本
    createSimVersion(versionName) {
      const self = this;
      return addExtraSimulateVersion({
        versionName: versionName,
        simMode: self.simForm.simMode,
        initialValue: self.formatSimNumber(self.simForm.initialValue),
        coefficient: self.formatSimNumber(self.simForm.coefficient),
        targetValue: self.formatSimNumber(self.simForm.targetValue),
      }).then(() => self.getSimVersionList(true));
    },
    // 手动开启新的数值模拟版本，先经确认弹窗输入版本名称，确认后才创建
    handleSimRestart() {
      this.pendingSimRecord = null;
      this.simVersionCreateOpen = true;
    },
    // 开启新版本确认弹窗确认后创建版本，有暂存的本轮结果时继续保存
    handleSimVersionCreateConfirm(versionName) {
      const self = this;
      if (!this.validateSimConfig()) {
        return;
      }
      this.simVersionCreateSubmitting = true;
      this.createSimVersion(versionName)
        .then(() => {
          self.simVersionCreateOpen = false;
          if (self.pendingSimRecord) {
            const record = self.pendingSimRecord;
            self.pendingSimRecord = null;
            self.doSubmitSimRound(record);
          } else {
            self.$modal.msgSuccess(
              `已开启新版本，下一轮将从初始数值 ${self.formatSimNumber(self.simForm.initialValue)} 重新开始`
            );
            self.getSimList();
          }
        })
        .catch(() => {
          // 创建失败时保留确认弹窗，用户可修改版本名后重试
        })
        .finally(() => {
          self.simVersionCreateSubmitting = false;
        });
    },
    // 打开版本作废第一步确认弹窗（版本管理弹窗内触发）
    handleSimVersionInvalidate(version) {
      this.simInvalidateVersion = version;
      this.simInvalidateConfirmOpen = true;
    },
    // 版本作废二次验证通过，正式作废版本并刷新版本列表，作废当前选中版本时自动切换到最新启用版本
    handleSimInvalidateConfirm() {
      const self = this;
      const version = this.simInvalidateVersion;
      if (!version || !version.versionId) {
        this.simInvalidateDangerOpen = false;
        return;
      }
      this.simInvalidateSubmitting = true;
      invalidateExtraSimulateVersion(version.versionId)
        .then(() => {
          self.simInvalidateDangerOpen = false;
          self.simInvalidateConfirmOpen = false;
          self.$modal.msgSuccess(
            `版本「${version.versionName || version.versionNo}」已作废`
          );
          self.getSimVersionList()
            .then(() => {
              self.getSimList();
            })
            .catch(() => {
              self.simRounds = [];
              self.simTotal = 0;
              self.simLatestRound = null;
            });
        })
        .catch(() => {
          // 作废失败时保留当前版本与确认弹窗，便于用户重试或取消
        })
        .finally(() => {
          self.simInvalidateSubmitting = false;
        });
    },
    // 删除最近一条数值模拟轮次记录，下一轮回退到上一条的结束数值；该轮有关联时确认文案追加提示
    handleSimDeleteLast() {
      const self = this;
      const lastRound = this.simLastRound;
      if (!lastRound) {
        return;
      }
      let confirmText = `是否确认删除第${lastRound.roundNo}轮记录（结束数值 ${this.formatSimNumber(lastRound.endValue)}）？删除后将从上一轮结束数值继续`;
      // 该轮有关联方案计划时追加提示：删除同时移除该轮的关联关系
      if (lastRound.planCount > 0) {
        confirmText += `；同时移除该轮的 ${lastRound.planCount} 条方案计划关联`;
      }
      this.$modal
        .confirm(confirmText)
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
      if (!Number.isFinite(initialValue) || !Number.isFinite(targetValue)
        || !Number.isFinite(winFactor) || initialValue <= 0
        || targetValue <= 0 || winFactor <= 1) {
        return "-";
      }
      if (initialValue >= targetValue) {
        return 0;
      }
      return Math.ceil(
        Math.log(targetValue / initialValue) / Math.log(winFactor)
      );
    },
    // 提交前校验模拟参数：数值必须为有限正式数字，并符合数据库文本长度与精度约束
    validateSimConfig() {
      if (!["full", "half"].includes(this.simForm.simMode)) {
        this.$modal.msgWarning("模拟模式不正确，请重新选择全量或半量滚动");
        return false;
      }
      const fields = [
        { label: "初始数值", value: this.simForm.initialValue, minExclusive: 0 },
        { label: "每轮系数", value: this.simForm.coefficient, minExclusive: 1 },
        { label: "目标数值", value: this.simForm.targetValue, minExclusive: 0 },
      ];
      for (const field of fields) {
        const text = String(field.value == null ? "" : field.value);
        const integerDigits = text.split(".")[0].replace(/^0+/, "").length;
        const numeric = Number(text);
        const decimalPattern = new RegExp(
          `^\\d+(?:\\.\\d{1,${DORTMUND_NUMERIC.maxSimulationFractionDigits}})?$`
        );
        if (!decimalPattern.test(text) || !Number.isFinite(numeric)
          || numeric <= field.minExclusive
          || integerDigits > DORTMUND_NUMERIC.maxSimulationIntegerDigits
          || text.length > DORTMUND_LIMITS.simulateValueText) {
          this.$modal.msgWarning(
            `${field.label}格式不正确，请填写大于${field.minExclusive}、最多` +
            `${DORTMUND_NUMERIC.maxSimulationIntegerDigits}位整数和` +
            `${DORTMUND_NUMERIC.maxSimulationFractionDigits}位小数的数字`
          );
          return false;
        }
      }
      return true;
    },
    // 提交前校验轮次与四类数值，防止零轮次、溢出轮次、负数和非有限数值进入接口
    validateSimRound(record) {
      const roundNo = Number(record && record.roundNo);
      if (!Number.isInteger(roundNo) || roundNo === 0
        || roundNo < DORTMUND_SIMULATION_DEFAULTS.roundNoMin
        || roundNo > DORTMUND_SIMULATION_DEFAULTS.roundNoMax) {
        this.$modal.msgWarning("本轮轮次必须为非零的32位整数");
        return false;
      }
      const valueFields = [
        { label: "本轮开始数值", value: this.simNextStartValue, allowZero: false },
        { label: "本轮参与数值", value: record && record.joinValue, allowZero: true },
        { label: "实际回收数值", value: record && record.returnValue, allowZero: true },
        { label: "本轮结束数值", value: record && record.endValue, allowZero: true },
      ];
      for (const field of valueFields) {
        const numeric = Number(field.value);
        if (!Number.isFinite(numeric) || numeric < 0 || (!field.allowZero && numeric === 0)) {
          this.$modal.msgWarning(`${field.label}格式不正确，请返回后重新录入`);
          return false;
        }
        const text = formatPlainDecimal(
          numeric,
          DORTMUND_NUMERIC.maxSimulationFractionDigits
        );
        const integerDigits = text.split(".")[0].replace(/^0+/, "").length;
        if (!text
          || integerDigits > DORTMUND_NUMERIC.maxSimulationIntegerDigits
          || text.length > DORTMUND_LIMITS.simulateValueText) {
          this.$modal.msgWarning(
            `${field.label}超出范围，请填写最多` +
            `${DORTMUND_NUMERIC.maxSimulationIntegerDigits}位整数和` +
            `${DORTMUND_NUMERIC.maxSimulationFractionDigits}位小数的数字`
          );
          return false;
        }
      }
      return true;
    },
    // 数值模拟变动倍数格式化为数据库可接受的两位小数普通十进制文本
    formatSimRoundChange(value) {
      const text = formatPlainDecimal(
        value,
        DORTMUND_NUMERIC.maxSimulationFractionDigits
      );
      if (!text) {
        return "";
      }
      const integerDigits = text.split(".")[0].replace(/^0+/, "").length;
      return integerDigits <= DORTMUND_NUMERIC.maxSimulationIntegerDigits
        && text.length <= DORTMUND_LIMITS.simulateValueText
        ? text
        : "";
    },
    // 数值模拟金额格式化，保留两位小数
    formatSimNumber(value) {
      const fractionDigits = DORTMUND_NUMERIC.maxSimulationFractionDigits;
      return formatPlainDecimal(
        value,
        fractionDigits,
        `0.${"0".repeat(fractionDigits)}`
      );
    },
    // 数值模拟乘数格式化，去除多余的零
    formatSimFactor(value) {
      const text = formatPlainDecimal(value, DORTMUND_NUMERIC.maxOddsFractionDigits);
      return text ? Number(text) : 0;
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
