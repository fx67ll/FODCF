<template>
  <!-- 开启新版本确认弹窗（需输入版本名称，确认后才创建版本） -->
  <el-dialog title="开启新版本" :visible.sync="dialogVisible" :close-on-click-modal="false" width="520px"
    :style="`top: ${getDialogVerticalOffset(520)}`" append-to-body @open="handleDialogOpen">
    <div class="sim-version-create-body">
      <!-- 开启说明 -->
      <div class="sim-version-create-banner">
        <div class="banner-icon">
          <i class="el-icon-plus"></i>
        </div>
        <div class="banner-body">
          <div class="banner-title">即将开启新的数值模拟版本</div>
          <div class="banner-desc">历史轮次将归档到旧版本，新版本从初始数值重新开始模拟</div>
        </div>
      </div>

      <!-- 版本名称录入 -->
      <el-form ref="simVersionForm" :model="simVersionForm" :rules="simVersionRules" label-width="0"
        class="sim-version-create-form" @submit.native.prevent>
        <el-form-item prop="versionName">
          <div class="sim-version-create-label">版本名称</div>
          <el-input v-model="simVersionForm.versionName" maxlength="20" show-word-limit placeholder="请输入新版本名称"
            clearable />
          <div class="sim-version-create-tip">名称仅用于辨识版本，创建后随版本保存</div>
        </el-form-item>
      </el-form>

      <!-- 随版本保存的参数配置 -->
      <div class="sim-version-create-config">
        <div class="config-title">
          <i class="el-icon-set-up"></i>
          以下配置将随新版本保存
        </div>
        <div class="config-grid">
          <div class="config-item">
            <div class="config-label">模拟模式</div>
            <div class="config-value">{{ simForm.simMode === "half" ? "半量滚动" : "全量滚动" }}</div>
          </div>
          <div class="config-item">
            <div class="config-label">初始数值</div>
            <div class="config-value">{{ formatSimNumber(simForm.initialValue) }}</div>
          </div>
          <div class="config-item">
            <div class="config-label">每轮系数</div>
            <div class="config-value">{{ formatSimNumber(simForm.coefficient) }}</div>
          </div>
          <div class="config-item">
            <div class="config-label">目标数值</div>
            <div class="config-value">{{ formatSimNumber(simForm.targetValue) }}</div>
          </div>
        </div>
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="success" :loading="submitting" :disabled="!simVersionForm.versionName.trim()"
        @click="handleConfirm">确认开启</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimVersionCreateDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 数值模拟参数配置（随新版本保存）
    simForm: {
      type: Object,
      required: true,
    },
    // 版本创建中状态
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 新版本表单（版本名称）
      simVersionForm: {
        versionName: "",
      },
      // 新版本表单校验
      simVersionRules: {
        versionName: [
          {
            required: true,
            message: "版本名称不能为空",
            trigger: "blur",
          },
          {
            pattern: /^\S+.*\S+$|^\S+$/,
            message: "版本名称不能为纯空格",
            trigger: "blur",
          },
        ],
      },
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
  },
  watch: {
    // 弹窗关闭时重置版本名称输入
    visible(val) {
      if (!val) {
        this.simVersionForm.versionName = "";
        this.$nextTick(() => {
          this.$refs["simVersionForm"] && this.$refs["simVersionForm"].clearValidate();
        });
      }
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 弹窗打开时清除历史校验状态
    handleDialogOpen() {
      this.$nextTick(() => {
        this.$refs["simVersionForm"] && this.$refs["simVersionForm"].clearValidate();
      });
    },
    // 确认开启，交由父组件创建版本
    handleConfirm() {
      this.$refs["simVersionForm"].validate((valid) => {
        if (!valid) {
          return;
        }
        this.$emit("confirm", this.simVersionForm.versionName.trim());
      });
    },
    // 取消开启新版本
    handleCancel() {
      this.dialogVisible = false;
    },
    // 数值模拟金额格式化，保留两位小数
    formatSimNumber(value) {
      return parseFloat(value || 0).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
.sim-version-create-body {
  padding: 0 4px;
}

/* 开启说明横幅 */
.sim-version-create-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #eafaf3 0%, #d5f5e6 100%);
  border: 1px solid #b7ecd2;
  border-left: 4px solid #2ecc71;
  border-radius: 8px;
  animation: simVersionCreateFadeDown 0.3s ease;

  .banner-icon {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    line-height: 34px;
    text-align: center;
    color: #ffffff;
    font-size: 18px;
    background: #2ecc71;
    border-radius: 50%;
    animation: simVersionCreateSpin 0.45s ease;
  }

  .banner-title {
    font-size: 14px;
    font-weight: 700;
    color: #1e8e55;
    letter-spacing: 0.5px;
  }

  .banner-desc {
    margin-top: 4px;
    font-size: 12px;
    color: #43a86e;
    line-height: 1.5;
  }
}

/* 版本名称录入 */
.sim-version-create-form {
  margin-bottom: 16px;
  animation: simVersionCreateFadeDown 0.3s ease 0.05s both;

  ::v-deep .el-form-item {
    margin-bottom: 0;
  }

  ::v-deep .el-form-item__content {
    line-height: normal;
  }
}

.sim-version-create-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.sim-version-create-form ::v-deep .el-input__inner {
  height: 40px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.25s ease;

  &:focus {
    border-color: #2ecc71;
    box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
  }
}

.sim-version-create-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

/* 随版本保存的参数配置 */
.sim-version-create-config {
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  animation: simVersionCreateFadeDown 0.3s ease 0.1s both;

  .config-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #303133;

    i {
      color: #2ecc71;
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .config-item {
    padding: 10px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.25s ease;

    &:hover {
      border-color: #2ecc71;
      box-shadow: 0 2px 10px rgba(46, 204, 113, 0.12);
    }
  }

  .config-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #8392a5;
  }

  .config-value {
    font-size: 15px;
    font-weight: 700;
    color: #1f2d3d;
  }
}

@keyframes simVersionCreateFadeDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes simVersionCreateSpin {
  from {
    transform: rotate(-90deg) scale(0.6);
    opacity: 0;
  }

  to {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
}
</style>
