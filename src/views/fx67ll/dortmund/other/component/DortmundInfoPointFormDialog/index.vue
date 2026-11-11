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
    <el-form ref="infoPointForm" :model="localForm" :rules="formRules" label-width="104px"
      v-loading="loading || submitting">
      <el-row :gutter="20">
        <el-col v-if="showSeason" :xs="24" :md="12">
          <el-form-item label="所属赛季" prop="seasonId">
            <common-enhanced-select v-model="localForm.seasonId" valueKey="seasonId" labelKey="seasonName"
              :api-func="listSeason" placeholder="请选择所属赛季" />
          </el-form-item>
        </el-col>
        <el-col v-if="showTeams" :xs="24" :md="12">
          <el-form-item label="关联球队" prop="teamIds">
            <dortmund-binding-control entity-type="team" select-label="选择球队"
              :display-text="formatSelectedTeams(selectedTeams)" placeholder="请选择关联球队"
              @select="$emit('select-teams')" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="信息标题" prop="pointTitle">
            <el-input v-model="localForm.pointTitle" maxlength="255" show-word-limit placeholder="请输入信息标题" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="信息内容" prop="pointContent">
            <el-input v-model="localForm.pointContent" type="textarea" :rows="4" maxlength="1023" show-word-limit
              placeholder="请输入客观信息内容" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="来源名称" prop="sourceName">
            <el-input v-model="localForm.sourceName" maxlength="255" placeholder="请输入来源名称" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="来源地址" prop="sourceUrl">
            <el-input v-model="localForm.sourceUrl" maxlength="512" placeholder="请输入来源地址" />
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :xs="24" :md="12">
          <el-form-item label="发布时间" prop="sourcePublishTime">
            <el-date-picker v-model="localForm.sourcePublishTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%" placeholder="请选择发布时间" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="showAdvanced ? 12 : 24">
          <el-form-item label="采集时间" prop="collectTime">
            <el-date-picker v-model="localForm.collectTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%" placeholder="请选择采集时间" />
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :span="24">
          <el-form-item label="生效窗口">
            <div class="info-point-time-row">
              <el-date-picker v-model="localForm.effectiveStartTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="生效时间（可空）" />
              <span>至</span>
              <el-date-picker v-model="localForm.effectiveEndTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="失效时间（可空）" />
            </div>
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :xs="24" :md="12">
          <el-form-item label="是否公开" prop="allowPublic">
            <el-radio-group v-model="localForm.allowPublic" class="dortmund-theme-radio">
              <el-radio label="0">不可公开</el-radio>
              <el-radio label="1">可公开</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :span="24">
          <el-form-item label="备注" prop="pointRemark">
            <el-input v-model="localForm.pointRemark" type="textarea" :rows="2" maxlength="1023" show-word-limit
              placeholder="请输入备注（可空）" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="handleSubmit">{{
        submitLabel
        }}</el-button>
      <el-button class="dortmund-theme-cancel" @click="handleCancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import DortmundBindingControl from "@/views/fx67ll/dortmund/other/component/DortmundBindingControl/index";

export default {
  name: "DortmundInfoPointFormDialog",
  components: { CommonEnhancedSelect, DortmundBindingControl },
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
      listSeason,
      localForm: { ...this.value },
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
    formRules() {
      const rules = {
        pointTitle: [{ required: true, message: "信息标题不能为空", trigger: "blur" }],
        pointContent: [{ required: true, message: "信息内容不能为空", trigger: "blur" }],
        sourceName: [{ required: true, message: "来源名称不能为空", trigger: "blur" }],
        collectTime: [{ required: true, message: "采集时间不能为空", trigger: "change" }],
        effectiveStartTime: [{ validator: this.validateTimeWindow, trigger: "change" }],
        effectiveEndTime: [{ validator: this.validateTimeWindow, trigger: "change" }],
      };
      if (this.showSeason) {
        rules.seasonId = [{ required: true, message: "所属赛季不能为空", trigger: "change" }];
      }
      if (this.showTeams) {
        rules.teamIds = [{ required: true, type: "array", min: 1, message: "至少选择一支球队", trigger: "change" }];
      }
      return rules;
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.syncForm();
        this.$nextTick(() => this.$refs.infoPointForm && this.$refs.infoPointForm.clearValidate());
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
    validateTimeWindow(rule, value, callback) {
      if (this.localForm.effectiveStartTime && this.localForm.effectiveEndTime
        && this.localForm.effectiveStartTime > this.localForm.effectiveEndTime) {
        callback(new Error("生效时间不能晚于失效时间"));
        return;
      }
      callback();
    },
    formatSelectedTeams(teams) {
      return (teams || []).map((team) => team.teamName || `球队 ${team.teamId}`).join("、");
    },
    handleCancel() {
      this.dialogVisible = false;
    },
    handleSubmit() {
      this.$refs.infoPointForm.validate((valid) => {
        if (!valid) {
          return;
        }
        this.$emit("save", {
          ...this.localForm,
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
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.3);
}

.dialog-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.dialog-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8b84;
}

.info-point-time-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-point-time-row .el-date-editor {
  flex: 1;
  min-width: 0;
}

.info-point-time-row>span {
  flex-shrink: 0;
  color: var(--current-color, #2ecc71);
  font-weight: 600;
}

@media (max-width: 767px) {

  .info-point-time-row {
    align-items: stretch;
    flex-direction: column;
  }

  .info-point-time-row>span {
    display: none;
  }
}
</style>

<style lang="scss">
.dortmund-info-point-form-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(46, 204, 113, 0.18);

  .el-dialog__body {
    padding-top: 18px;
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
      padding: 18px 14px 8px;
    }
  }
}
</style>
