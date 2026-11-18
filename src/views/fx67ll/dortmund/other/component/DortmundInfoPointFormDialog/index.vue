<template>
  <el-dialog :visible.sync="dialogVisible" :title="dialogTitle" :width="dialogWidth"
    :style="`top: ${getDialogVerticalOffset(530)}`" append-to-body custom-class="dortmund-info-point-form-dialog"
    :close-on-click-modal="false">
    <template slot="title">
      <div class="dialog-header">
        <div class="dialog-header-icon">
          <i class="el-icon-notebook-2"></i>
        </div>
        <div class="dialog-header-text">
          <div class="dialog-header-title">{{ dialogTitle }}</div>
          <div class="dialog-header-sub">统一维护信息内容、来源与生效时间窗</div>
        </div>
      </div>
    </template>
    <dortmund-info-point-form ref="infoForm" :form="localForm" :mode="mode" :show-season="showSeason"
      :show-teams="showTeams" :show-advanced="showAdvanced" :selected-teams="selectedTeams"
      :loading="loading || submitting" :label-width="labelWidth" @select-teams="$emit('select-teams')" />
    <div slot="footer" class="dialog-footer">
      <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="handleSubmit">{{
        submitLabel }}</el-button>
      <el-button class="dortmund-theme-cancel" @click="handleCancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import DortmundInfoPointForm from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointForm/index";

export default {
  name: "DortmundInfoPointFormDialog",
  components: { DortmundInfoPointForm },
  props: {
    visible: { type: Boolean, default: false },
    value: { type: Object, default: () => ({}) },
    mode: { type: String, default: "add" },
    infoPointType: { type: String, default: "M" },
    showSeason: { type: Boolean, default: false },
    showTeams: { type: Boolean, default: false },
    showAdvanced: { type: Boolean, default: false },
    selectedTeams: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    submitting: { type: Boolean, default: false },
    dialogWidth: { type: String, default: "760px" },
  },
  data() {
    return {
      localForm: { ...this.value },
      labelWidth: "130px",
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    dialogTitle() {
      return this.mode === "update" ? "编辑关联信息点" : "新增关联信息点";
    },
    submitLabel() {
      return this.mode === "update" ? "保 存" : "确 定";
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.syncForm();
        this.$nextTick(() => this.$refs.infoForm && this.$refs.infoForm.clearValidate());
      }
    },
    value: {
      deep: true,
      handler(value) {
        if (!this.visible) {
          this.localForm = { ...(value || {}) };
        } else if (this.showTeams) {
          this.localForm.teamIds = [...((value && value.teamIds) || [])];
        }
      },
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    syncForm() {
      this.localForm = { ...(this.value || {}) };
      if (this.showTeams && !Array.isArray(this.localForm.teamIds)) {
        this.localForm.teamIds = [];
      }
    },
    handleCancel() {
      this.dialogVisible = false;
    },
    handleSubmit() {
      this.$refs.infoForm.validate().then((valid) => {
        if (!valid) {
          return;
        }
        this.$emit("save", {
          ...this.$refs.infoForm.getSubmitData(),
          infoPointType: this.localForm.infoPointType || this.infoPointType,
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.dialog-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f2;
}

.dialog-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.3);
}

.dialog-header-title {
  color: #2b3a36;
  font-size: 16px;
  font-weight: 700;
}

.dialog-header-sub {
  margin-top: 2px;
  color: #7c8b84;
  font-size: 12px;
}
</style>

<style lang="scss">
.dortmund-info-point-form-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(46, 204, 113, 0.18);

  .el-dialog__body {
    max-height: 68vh;
    padding-top: 18px;
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 14px 20px 18px;
    border-top: 1px solid #f0f4f2;
  }

  .el-dialog__body .el-form {
    animation: dortmundInfoPointFormFadeUp 0.3s ease 0.05s both;
  }
}

@keyframes dortmundInfoPointFormFadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 800px) {
  .dortmund-info-point-form-dialog {
    width: calc(100% - 24px) !important;
    margin-top: 5vh !important;

    .el-dialog__body {
      max-height: 72vh;
      padding: 18px 14px 8px;
    }
  }
}
</style>
