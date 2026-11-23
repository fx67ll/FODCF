<template>
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="回报组合详情" :subtitle="subtitle" icon="el-icon-connection"
    tone="green" size="780px" :loading="loading" feature="return" :level="level">
    <return-manual-result v-if="isManual" :combination="detail" :batch="batchContext"
      :can-view-reason="hasRemarkQueryPermission" />
    <return-analysis-result v-else :combination="detail" :batch="batchContext"
      :can-view-reason="hasRemarkQueryPermission" />

    <dortmund-detail-card v-if="hasImageQueryPermission" title="组合图片" icon="el-icon-picture-outline" tone="amber">
      <return-image-upload :combination-id="detail.combinationId || null" :images="detail.images || []"
        :adopted-flag="detail.adoptedFlag || ''" :plan-linked="Boolean(detail.planLinked)"
        :can-upload="hasImageUploadPermission" @changed="refreshDetail(false)" />
    </dortmund-detail-card>

    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>
  </dortmund-detail-drawer>
</template>

<script>
import { checkPermi } from "@/utils/common/permission";
import { getCombination, getGeneration } from "@/api/fx67ll/dortmund/returnCombination";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import ReturnManualResult from "@/views/fx67ll/dortmund/return/components/ReturnManualResult/index";
import ReturnAnalysisResult from "@/views/fx67ll/dortmund/return/components/ReturnAnalysisResult/index";
import ReturnImageUpload from "@/views/fx67ll/dortmund/return/components/ReturnImageUpload/index";

export default {
  name: "DortmundReturnCombinationDetailDrawer",
  components: {
    DortmundDetailDrawer, DortmundDetailCard, ReturnManualResult, ReturnAnalysisResult,
    ReturnImageUpload
  },
  props: {
    visible: { type: Boolean, default: false },
    combinationId: { type: [Number, String], default: null },
    snapshot: { type: Object, default: () => ({}) },
    // 由列表直接打开时为 1，由方案或已采用组合抽屉继续下钻时为 2 或 3。
    level: { type: [Number, String], default: 1 },
  },
  data() {
    return {
      loading: false,
      detail: {},
      batch: {},
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    subtitle() {
      if (this.detail.combinationCode) {
        return `组合编码 · ${this.detail.combinationCode}`;
      }
      return this.isManual ? "查看组合指标、第三方AI分析与逐场理由"
        : "查看组合指标、证据链、图片与逐场明细";
    },
    batchContext() {
      if (!this.batch || !this.detail) {
        return null;
      }
      return this.batch.generationId && String(this.batch.generationId) === String(this.detail.generationId)
        ? this.batch : null;
    },
    isManual() {
      const source = String(this.detail.resultSource || this.batch.resultSource || "");
      return source === "M";
    },
    hasImageQueryPermission() {
      return checkPermi(["dortmund:return:image:query"]);
    },
    hasImageUploadPermission() {
      return checkPermi(["dortmund:return:image:upload"]);
    },
    hasRemarkQueryPermission() {
      return checkPermi(["dortmund:return:remark:query"]);
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.refreshDetail(true);
      }
    },
    combinationId(value) {
      if (this.visible && value) {
        this.refreshDetail(true);
      }
    },
  },
  methods: {
    normalizeCombinationId(value) {
      const id = Number(value);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    refreshDetail(showLoading = true) {
      const targetId = this.combinationId || (this.snapshot && this.snapshot.combinationId)
        || (this.detail && this.detail.combinationId);
      const normalizedId = this.normalizeCombinationId(targetId);
      if (!normalizedId) {
        this.detail = { ...(this.snapshot || {}) };
        this.batch = {};
        return Promise.resolve();
      }
      const snapshot = { ...(this.snapshot || {}), ...(this.detail || {}) };
      if (showLoading) {
        this.loading = true;
      }
      return getCombination(normalizedId).then((response) => {
        this.detail = { ...snapshot, ...((response && response.data) || {}) };
        if (!this.detail.generationId) {
          this.batch = {};
          return null;
        }
        return getGeneration(this.detail.generationId).then((generationResponse) => {
          this.batch = (generationResponse && generationResponse.data) || {};
        }).catch(() => {
          // 批次上下文只增强来源说明，失败不影响组合主体展示。
          this.batch = {};
        });
      }).catch(() => {
        // 请求拦截器已经提示错误；保留打开前的列表快照。
      }).finally(() => {
        if (showLoading) {
          this.loading = false;
        }
      });
    },
  },
};
</script>
