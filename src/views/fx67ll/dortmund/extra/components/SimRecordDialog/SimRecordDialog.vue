<template>
  <!-- 数值模拟记录本轮结果弹窗 -->
  <el-dialog title="记录本轮结果" :visible.sync="dialogVisible" :close-on-click-modal="false" width="480px"
    :style="`top: ${getDialogVerticalOffset(480)}`" append-to-body @open="handleDialogOpen">
    <div class="sim-record-body">
      <!-- 本轮结果徽标 -->
      <div class="sim-record-badge" :class="isHit === 'Y' ? 'success' : 'fail'">
        <i :class="isHit === 'Y' ? 'el-icon-top' : 'el-icon-bottom'"></i>
        <span>本轮{{ isHit === "Y" ? "达成" : "未达成" }}</span>
      </div>

      <!-- 本轮数值信息 -->
      <div class="sim-record-info">
        <div class="sim-record-info-item">
          <div class="sim-record-info-label">本轮开始数值</div>
          <div class="sim-record-info-value">{{ formatSimNumber(nextStartValue) }}</div>
        </div>
        <div class="sim-record-info-item">
          <div class="sim-record-info-label">本轮参与数值</div>
          <div class="sim-record-info-value">{{ formatSimNumber(joinValue) }}</div>
        </div>
      </div>

      <!-- 实际回收数值录入 -->
      <el-form ref="simRecordForm" :model="simRecordForm" :rules="simRecordRules" label-width="0"
        class="sim-record-form">
        <el-form-item prop="returnValue">
          <div class="sim-record-input-label">实际回收数值</div>
          <el-input-number v-model="simRecordForm.returnValue" :controls="false" :precision="2" :min="0"
            class="sim-record-input" placeholder="请输入实际回收数值" />
          <div class="sim-record-tip">默认按系数计算，可按实际数值修改，支持部分回本</div>
        </el-form-item>
      </el-form>

      <!-- 本轮结束数值预览 -->
      <div class="sim-record-end" :class="{ pulse: endValuePulsing }">
        <div class="sim-record-end-header">
          <span class="sim-record-end-label">本轮结束数值</span>
          <span class="sim-record-end-formula">{{ endValueFormula }}</span>
        </div>
        <div class="sim-record-end-value">{{ formatSimNumber(endValue) }}</div>
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" :loading="submitting" @click="submitSimRound">确 定</el-button>
      <el-button @click="cancelSimRecord">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimRecordDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 本轮是否达成（Y是 N否）
    isHit: {
      type: String,
      default: "Y",
    },
    // 模拟模式（full全量滚动 half半量滚动）
    simMode: {
      type: String,
      default: "full",
    },
    // 本轮使用系数
    coefficient: {
      type: Number,
      default: 2,
    },
    // 本轮开始数值
    nextStartValue: {
      type: Number,
      default: 0,
    },
    // 保存中状态
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 本轮结果表单（实际回收数值支持部分回本）
      simRecordForm: {
        returnValue: 0,
      },
      // 本轮结果表单校验
      simRecordRules: {
        returnValue: [
          {
            required: true,
            message: "实际回收数值不能为空",
            trigger: "blur",
          },
        ],
      },
      // 结束数值变动脉冲动画开关
      endValuePulsing: false,
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
    // 本轮参与数值（半量滚动为开始数值的一半）
    joinValue() {
      return this.simMode === "half"
        ? parseFloat((this.nextStartValue / 2).toFixed(2))
        : this.nextStartValue;
    },
    // 本轮结束数值（半量滚动保留另一半，全量滚动即实际回收数值）
    endValue() {
      const keepValue = this.simMode === "half" ? this.nextStartValue / 2 : 0;
      return parseFloat(
        (keepValue + parseFloat(this.simRecordForm.returnValue || 0)).toFixed(2)
      );
    },
    // 结束数值计算公式说明
    endValueFormula() {
      if (this.simMode === "half") {
        return `保留 ${this.formatSimNumber(this.nextStartValue / 2)} + 回收 ${this.formatSimNumber(this.simRecordForm.returnValue)} 计算`;
      }
      return `即本轮实际回收数值`;
    },
  },
  watch: {
    // 结束数值变动时触发脉冲动画
    endValue() {
      const self = this;
      this.endValuePulsing = false;
      this.$nextTick(() => {
        self.endValuePulsing = true;
      });
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 弹窗打开时按系数预填实际回收数值，可按实际数值修改
    handleDialogOpen() {
      this.simRecordForm.returnValue =
        this.isHit === "Y"
          ? parseFloat(
              (
                this.joinValue * parseFloat(this.coefficient || 0)
              ).toFixed(2)
            )
          : 0;
      this.$nextTick(() => {
        this.$refs["simRecordForm"] && this.$refs["simRecordForm"].clearValidate();
      });
    },
    // 确认提交，交由父组件保存
    submitSimRound() {
      this.$refs["simRecordForm"].validate((valid) => {
        if (!valid) {
          return;
        }
        this.$emit("confirm", {
          isHit: this.isHit,
          returnValue: this.simRecordForm.returnValue,
          joinValue: this.joinValue,
          endValue: this.endValue,
        });
      });
    },
    // 取消记录本轮结果
    cancelSimRecord() {
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
.sim-record-body {
  padding: 0 4px;
}

/* 本轮结果徽标 */
.sim-record-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 0;
  margin-bottom: 16px;
  border-radius: 8px;
  animation: simRecordFadeDown 0.3s ease;

  i {
    font-size: 20px;
  }

  span {
    font-size: 16px;
    font-weight: 600;
  }

  &.success {
    color: #2ecc71;
    background: linear-gradient(135deg, #eafaf3 0%, #d5f5e6 100%);
  }

  &.fail {
    color: #ff5a5f;
    background: linear-gradient(135deg, #fff1f1 0%, #ffe3e4 100%);
  }
}

/* 本轮数值信息 */
.sim-record-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  animation: simRecordFadeDown 0.3s ease 0.05s both;
}

.sim-record-info-item {
  padding: 12px;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.25s ease;

  &:hover {
    border-color: #2ecc71;
    box-shadow: 0 2px 10px rgba(46, 204, 113, 0.12);
  }
}

.sim-record-info-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #8392a5;
}

.sim-record-info-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
}

/* 实际回收数值录入 */
.sim-record-form {
  margin-bottom: 16px;
  animation: simRecordFadeDown 0.3s ease 0.1s both;

  ::v-deep .el-form-item {
    margin-bottom: 0;
  }

  ::v-deep .el-form-item__content {
    line-height: normal;
  }
}

.sim-record-input-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.sim-record-input {
  width: 100%;

  ::v-deep .el-input__inner {
    height: 40px;
    font-size: 16px;
    font-weight: 600;
    color: #2ecc71;
    text-align: center;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.25s ease;

    &:focus {
      border-color: #2ecc71;
      box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
    }
  }
}

.sim-record-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

/* 本轮结束数值预览 */
.sim-record-end {
  padding: 12px 16px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  animation: simRecordFadeDown 0.3s ease 0.15s both;
}

.sim-record-end.pulse {
  animation: simRecordPulse 0.35s ease;
}

.sim-record-end-header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sim-record-end-label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.sim-record-end-formula {
  font-size: 12px;
  color: #909399;
}

.sim-record-end-value {
  font-size: 24px;
  font-weight: 700;
  color: #2ecc71;
}

@keyframes simRecordFadeDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes simRecordPulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.03);
    box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.15);
  }

  100% {
    transform: scale(1);
  }
}
</style>
