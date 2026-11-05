<template>
  <!-- 版本作废第二步确认弹窗（输入"确认作废"完成安全验证） -->
  <el-dialog title="作废版本二次确认" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false"
    :style="`top: ${getDialogVerticalOffset(430)}`" append-to-body custom-class="sim-invalidate-danger-dialog"
    @open="handleDialogOpen" @close="handleCancel">
    <template slot="title">
      <div class="invalidate-danger-header">
        <div class="invalidate-danger-header-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="invalidate-danger-header-text">
          <div class="invalidate-danger-header-title">作废版本二次确认</div>
          <div class="invalidate-danger-header-sub">第二步：输入"确认作废"完成安全验证</div>
        </div>
      </div>
    </template>
    <div class="confirm-content">
      <!-- 危险操作警告横幅 -->
      <div class="extreme-danger-banner">
        <div class="danger-banner-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="danger-banner-body">
          <div class="danger-banner-title">极度危险操作 · 最终确认</div>
          <div class="danger-banner-desc">即将作废「{{ versionInfo.versionName || `版本${versionInfo.versionNo}`
          }}」，作废后版本从列表中隐藏且不可恢复，请完成下方验证后谨慎执行</div>
        </div>
      </div>

      <!-- 验证说明 -->
      <div class="verify-desc">
        为防止误操作，请在下方输入框中输入
        <span class="confirm-keyword">{{ confirmKeyword }}</span>
        完成安全验证。
      </div>

      <!-- 输入验证区 -->
      <div class="verify-input-wrap">
        <el-form size="small">
          <el-form-item label="安全验证" required style="margin-bottom: 0;">
            <el-input v-model="inputValue" :placeholder="`请输入：${confirmKeyword}`"
              :class="['verify-input', inputError ? 'is-error' : '']" @input="inputError = false"
              @keyup.enter.native="handleConfirm" ref="confirmInput" clearable />
          </el-form-item>
        </el-form>
        <div v-if="inputError" class="input-error-tip">
          <i class="el-icon-close-circle"></i>
          输入内容不匹配，请输入"{{ confirmKeyword }}"
        </div>
      </div>

      <!-- 安全提示 -->
      <div class="audit-tip">
        <i class="el-icon-info" style="color: #409eff; margin-right: 5px;"></i>
        作废采用软删除，记录仍保留在数据库中，但不在任何列表中展示
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="danger" :loading="loading" :disabled="inputValue.trim() !== confirmKeyword"
        @click="handleConfirm">
        {{ confirmKeyword }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimVersionInvalidateDangerDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    // 待作废的版本记录
    version: {
      type: Object,
      default: () => ({}),
    },
    // 作废提交中状态
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      inputValue: "",
      inputError: false,
    };
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
    // 待作废版本信息（无选中版本时展示占位）
    versionInfo() {
      return this.version || {};
    },
    confirmKeyword() {
      return "确认作废";
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.inputValue = "";
        this.inputError = false;
      }
    },
  },
  methods: {
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    handleDialogOpen() {
      this.$nextTick(() => {
        if (this.$refs.confirmInput) {
          this.$refs.confirmInput.focus();
        }
      });
    },
    handleConfirm() {
      if (this.inputValue.trim() !== this.confirmKeyword) {
        this.inputError = true;
        return;
      }
      this.$emit("confirm");
    },
    handleCancel() {
      this.dialogVisible = false;
      this.inputValue = "";
      this.inputError = false;
    },
  },
};
</script>

<style scoped>
/* 弹窗视觉语言：圆角与红色危险风格（与 extra/simulate 弹窗同一风格体系，危险操作保持红色基调） */
::v-deep .sim-invalidate-danger-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(245, 108, 108, 0.18);
}

.invalidate-danger-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f7f0f0;
}

.invalidate-danger-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #f56c6c 0%, #e74c3c 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(245, 108, 108, 0.3);
}

.invalidate-danger-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #c0392b;
}

.invalidate-danger-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #b08d8d;
}

::v-deep .sim-invalidate-danger-dialog .el-dialog__body {
  padding-top: 16px;
}

::v-deep .sim-invalidate-danger-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f7f0f0;
}

.extreme-danger-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff1f0 0%, #ffe4e4 100%);
  border: 1px solid #ffb3b3;
  border-left: 4px solid #f56c6c;
  border-radius: 8px;
  animation: invalidateDangerFadeUp 0.3s ease both;
}

.danger-banner-icon {
  flex-shrink: 0;
  color: #f56c6c;
  font-size: 22px;
  line-height: 1;
  margin-top: 1px;
}

.danger-banner-body {
  flex: 1;
}

.danger-banner-title {
  font-size: 14px;
  font-weight: 700;
  color: #c0392b;
  letter-spacing: 0.5px;
}

.danger-banner-desc {
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
  line-height: 1.5;
}

.verify-desc {
  margin-top: 18px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.confirm-keyword {
  display: inline-block;
  font-weight: 700;
  color: #f56c6c;
  background-color: #fff1f0;
  border: 1px solid #ffb3b3;
  border-radius: 3px;
  padding: 0 6px;
  font-size: 12px;
}

.verify-input-wrap {
  margin-top: 15px;
}

.input-error-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 4px;
}

::v-deep .verify-input.is-error .el-input__inner {
  border-color: #f56c6c;
  background-color: #fff5f5;
}

.audit-tip {
  margin-top: 15px;
  padding: 10px 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
  line-height: 1.6;
  animation: invalidateDangerFadeUp 0.3s ease 0.1s both;
}

@keyframes invalidateDangerFadeUp {
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
