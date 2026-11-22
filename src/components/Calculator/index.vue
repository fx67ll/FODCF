<template>
  <!-- 通用数值计算器：不依赖业务接口，供表单中的金额、倍率等手工核算复用。 -->
  <el-dialog :visible.sync="dialogVisible" title="数值计算器" width="424px" custom-class="shared-calculator-dialog"
    append-to-body :close-on-click-modal="false" @opened="handleOpened" @closed="handleClosed">
    <div class="calculator-panel">
      <div class="calculator-display" :class="{ 'is-error': hasError }">
        <div class="calculator-expression">{{ expression || " " }}</div>
        <div class="calculator-value">{{ display }}</div>
      </div>

      <div class="calculator-hint">
        <i class="el-icon-info"></i>
        <span>用于方案实际本金、实际回报和实际倍率的快速核算；计算结果不会自动写入表单。</span>
      </div>

      <div class="calculator-keypad">
        <button v-for="key in keypad" :key="key.value" type="button" class="calculator-key" :class="key.className"
          :aria-label="key.ariaLabel || key.label" @click="handleKeyClick(key)">
          <i v-if="key.icon" :class="key.icon"></i>
          <span v-else>{{ key.label }}</span>
        </button>
      </div>
    </div>

    <span slot="footer" class="calculator-footer">
      <span class="calculator-copy-tip">{{ copyTip }}</span>
      <el-button size="small" icon="el-icon-document-copy" class="calculator-copy-button" @click="handleCopy">
        快速复制
      </el-button>
      <el-button size="small" type="success" class="dortmund-theme-confirm" @click="dialogVisible = false">
        关闭
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
const OPERATOR_SYMBOLS = Object.freeze({
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
});

const KEYPAD = Object.freeze([
  { value: "clear", label: "C", ariaLabel: "清空", action: "clear", className: "is-function" },
  { value: "backspace", label: "⌫", ariaLabel: "退格", action: "backspace", className: "is-function" },
  { value: "percent", label: "%", ariaLabel: "百分比", action: "percent", className: "is-function" },
  { value: "divide", label: "÷", ariaLabel: "除以", action: "operator", operator: "divide", className: "is-operator" },
  { value: "7", label: "7", action: "digit" },
  { value: "8", label: "8", action: "digit" },
  { value: "9", label: "9", action: "digit" },
  { value: "multiply", label: "×", ariaLabel: "乘以", action: "operator", operator: "multiply", className: "is-operator" },
  { value: "4", label: "4", action: "digit" },
  { value: "5", label: "5", action: "digit" },
  { value: "6", label: "6", action: "digit" },
  { value: "subtract", label: "−", ariaLabel: "减去", action: "operator", operator: "subtract", className: "is-operator" },
  { value: "1", label: "1", action: "digit" },
  { value: "2", label: "2", action: "digit" },
  { value: "3", label: "3", action: "digit" },
  { value: "add", label: "+", ariaLabel: "加上", action: "operator", operator: "add", className: "is-operator" },
  { value: "sign", label: "±", ariaLabel: "切换正负", action: "sign", className: "is-function" },
  { value: "0", label: "0", action: "digit" },
  { value: "decimal", label: ".", ariaLabel: "小数点", action: "decimal" },
  { value: "equals", label: "=", ariaLabel: "等于", action: "equals", className: "is-equals" },
]);

export default {
  name: "Calculator",
  props: {
    // 弹层可见状态，支持 .sync 双向绑定。
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      display: "0",
      expression: "",
      accumulator: null,
      pendingOperator: null,
      waitingForOperand: false,
      justEvaluated: false,
      hasError: false,
      copyTip: "复制结果后可粘贴到实际字段",
      keypad: KEYPAD,
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
  },
  beforeDestroy() {
    this.detachKeyboardListener();
  },
  methods: {
    handleOpened() {
      this.attachKeyboardListener();
    },
    handleClosed() {
      this.detachKeyboardListener();
    },
    attachKeyboardListener() {
      window.addEventListener("keydown", this.handleWindowKeydown);
    },
    detachKeyboardListener() {
      window.removeEventListener("keydown", this.handleWindowKeydown);
    },
    handleWindowKeydown(event) {
      if (!this.visible) {
        return;
      }
      const key = event.key;
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        this.inputDigit(key);
        return;
      }
      if (key === ".") {
        event.preventDefault();
        this.inputDecimal();
        return;
      }
      if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();
        this.chooseOperator({ "+": "add", "-": "subtract", "*": "multiply", "/": "divide" }[key]);
        return;
      }
      if (key === "Enter" || key === "=") {
        event.preventDefault();
        this.calculateResult();
        return;
      }
      if (key === "Backspace") {
        event.preventDefault();
        this.backspace();
        return;
      }
      if (key === "Escape") {
        event.preventDefault();
        this.dialogVisible = false;
        return;
      }
      if (key === "Delete" || key.toLowerCase() === "c") {
        event.preventDefault();
        this.clearAll();
      }
    },
    handleKeyClick(key) {
      if (key.action === "digit") {
        this.inputDigit(key.label);
      } else if (key.action === "decimal") {
        this.inputDecimal();
      } else if (key.action === "operator") {
        this.chooseOperator(key.operator);
      } else if (key.action === "equals") {
        this.calculateResult();
      } else if (key.action === "clear") {
        this.clearAll();
      } else if (key.action === "backspace") {
        this.backspace();
      } else if (key.action === "percent") {
        this.applyPercent();
      } else if (key.action === "sign") {
        this.toggleSign();
      }
    },
    inputDigit(digit) {
      if (this.hasError) {
        this.clearAll();
      }
      if (this.waitingForOperand || this.justEvaluated) {
        this.display = digit;
        this.waitingForOperand = false;
        if (this.justEvaluated) {
          this.expression = "";
          this.accumulator = null;
          this.pendingOperator = null;
        }
        this.justEvaluated = false;
        return;
      }
      this.display = this.display === "0" ? digit : `${this.display}${digit}`;
      this.display = this.limitDisplayLength(this.display);
    },
    inputDecimal() {
      if (this.hasError) {
        this.clearAll();
      }
      if (this.waitingForOperand || this.justEvaluated) {
        this.display = "0.";
        this.waitingForOperand = false;
        if (this.justEvaluated) {
          this.expression = "";
          this.accumulator = null;
          this.pendingOperator = null;
        }
        this.justEvaluated = false;
        return;
      }
      if (!this.display.includes(".")) {
        this.display = `${this.display}.`;
      }
    },
    chooseOperator(operator) {
      if (this.hasError) {
        this.clearAll();
      }
      const currentValue = this.parseDisplay();
      if (this.pendingOperator && !this.waitingForOperand) {
        const result = this.calculate(this.accumulator, currentValue, this.pendingOperator);
        if (result === null) {
          return;
        }
        this.accumulator = result;
        this.display = this.formatNumber(result);
      } else {
        this.accumulator = currentValue;
      }
      this.pendingOperator = operator;
      this.waitingForOperand = true;
      this.justEvaluated = false;
      this.expression = `${this.formatNumber(this.accumulator)} ${OPERATOR_SYMBOLS[operator]}`;
    },
    calculateResult() {
      if (this.hasError || !this.pendingOperator) {
        return;
      }
      const rightValue = this.parseDisplay();
      const leftValue = this.accumulator === null ? 0 : this.accumulator;
      const result = this.calculate(leftValue, rightValue, this.pendingOperator);
      if (result === null) {
        return;
      }
      this.expression = `${this.formatNumber(leftValue)} ${OPERATOR_SYMBOLS[this.pendingOperator]} ${this.formatNumber(rightValue)} =`;
      this.display = this.formatNumber(result);
      this.accumulator = result;
      this.pendingOperator = null;
      this.waitingForOperand = true;
      this.justEvaluated = true;
    },
    calculate(leftValue, rightValue, operator) {
      if (operator === "divide" && rightValue === 0) {
        this.hasError = true;
        this.display = "除数不能为 0";
        this.expression = "";
        this.accumulator = null;
        this.pendingOperator = null;
        this.waitingForOperand = true;
        return null;
      }
      if (operator === "add") {
        return leftValue + rightValue;
      }
      if (operator === "subtract") {
        return leftValue - rightValue;
      }
      if (operator === "multiply") {
        return leftValue * rightValue;
      }
      return leftValue / rightValue;
    },
    applyPercent() {
      if (this.hasError) {
        return;
      }
      const value = this.parseDisplay() / 100;
      this.display = this.formatNumber(value);
      this.expression = `${this.display}%`;
      this.justEvaluated = false;
    },
    toggleSign() {
      if (this.hasError || this.display === "0") {
        return;
      }
      this.display = this.display.startsWith("-") ? this.display.slice(1) : `-${this.display}`;
    },
    backspace() {
      if (this.hasError) {
        this.clearAll();
        return;
      }
      if (this.waitingForOperand) {
        return;
      }
      this.display = this.display.length > 1 ? this.display.slice(0, -1) : "0";
      if (this.display === "-") {
        this.display = "0";
      }
    },
    clearAll() {
      this.display = "0";
      this.expression = "";
      this.accumulator = null;
      this.pendingOperator = null;
      this.waitingForOperand = false;
      this.justEvaluated = false;
      this.hasError = false;
    },
    parseDisplay() {
      const value = Number(this.display);
      return Number.isFinite(value) ? value : 0;
    },
    formatNumber(value) {
      if (!Number.isFinite(value)) {
        return "错误";
      }
      const normalized = Number.parseFloat(value.toPrecision(12));
      if (Math.abs(normalized) >= 1e15) {
        return normalized.toExponential(8);
      }
      return String(normalized);
    },
    limitDisplayLength(value) {
      const [integerPart, decimalPart] = value.split(".");
      if (integerPart.length <= 15) {
        return value;
      }
      return decimalPart === undefined ? integerPart.slice(0, 15) : `${integerPart.slice(0, 15)}.${decimalPart}`;
    },
    async handleCopy() {
      const text = this.display;
      // 0 是有效的业务结果（例如实际回报为零），只拒绝复制错误状态。
      if (this.hasError) {
        this.copyTip = "当前没有可复制的有效结果";
        return;
      }
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          this.fallbackCopyText(text);
        }
        this.copyTip = `已复制：${text}`;
        this.$message.success("计算结果已复制");
      } catch (error) {
        this.copyTip = "复制失败，请手动选择结果";
        this.$message.error("复制失败，请手动选择结果");
      }
    },
    fallbackCopyText(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        if (!document.execCommand("copy")) {
          throw new Error("copy failed");
        }
      } finally {
        document.body.removeChild(textarea);
      }
    },
  },
};
</script>

<style lang="scss">
/* 弹层挂载到 body，使用独立类名设置非全屏尺寸与主题外观。 */
.shared-calculator-dialog {
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(31, 62, 48, 0.22);

  .el-dialog__header {
    padding: 16px 20px 12px;
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(64, 158, 255, 0.05));
    border-bottom: 1px solid rgba(46, 204, 113, 0.12);
  }

  .el-dialog__title {
    font-size: 15px;
    font-weight: 700;
    color: #2b3a36;
  }

  .el-dialog__headerbtn {
    top: 17px;
  }

  .el-dialog__body {
    padding: 16px 18px 14px;
  }

  .el-dialog__footer {
    padding: 0 18px 16px;
  }
}

@media screen and (max-width: 520px) {
  .shared-calculator-dialog {
    width: calc(100vw - 24px) !important;
    margin-top: 6vh !important;
  }
}
</style>

<style lang="scss" scoped>
.calculator-panel {
  display: grid;
  gap: 12px;
}

.calculator-display {
  padding: 14px 15px 12px;
  overflow: hidden;
  text-align: right;
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.11), rgba(64, 158, 255, 0.055));
  border: 1px solid rgba(46, 204, 113, 0.22);
  border-radius: 12px;

  &.is-error {
    background: rgba(245, 108, 108, 0.08);
    border-color: rgba(245, 108, 108, 0.28);

    .calculator-value {
      color: #c45656;
    }
  }
}

.calculator-expression {
  min-height: 18px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: #7c8b84;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calculator-value {
  margin-top: 4px;
  overflow: hidden;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.25;
  color: #1f6f47;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calculator-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  line-height: 1.55;
  color: #7c8b84;

  i {
    flex-shrink: 0;
    margin-top: 2px;
    color: #2ecc71;
  }
}

.calculator-keypad {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.calculator-key {
  display: grid;
  place-items: center;
  min-height: 46px;
  padding: 0;
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
  color: #30443a;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(220, 235, 226, 0.96);
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(31, 62, 48, 0.05);
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease,
    box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #1f8b4d;
    background: rgba(46, 204, 113, 0.08);
    border-color: rgba(46, 204, 113, 0.34);
    box-shadow: 0 5px 12px rgba(46, 204, 113, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(46, 204, 113, 0.42);
    outline-offset: 1px;
  }

  &.is-function {
    color: #60736a;
    background: rgba(247, 251, 249, 0.94);
  }

  &.is-operator {
    color: #1f8b4d;
    background: rgba(46, 204, 113, 0.08);
    border-color: rgba(46, 204, 113, 0.24);
  }

  &.is-equals {
    color: #fff;
    background: linear-gradient(135deg, #2ecc71, #27ad60);
    border-color: transparent;
    box-shadow: 0 6px 14px rgba(46, 204, 113, 0.22);

    &:hover {
      color: #fff;
      background: linear-gradient(135deg, #37d77b, #2bb964);
      border-color: transparent;
    }
  }
}

.calculator-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.calculator-copy-tip {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  color: #8a9892;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calculator-copy-button,
.calculator-footer .el-button {
  margin-left: 0;
}

@media screen and (max-width: 520px) {
  .calculator-key {
    min-height: 42px;
  }

  .calculator-copy-tip {
    display: none;
  }

  .calculator-footer {
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .calculator-key {
    transition: none;
  }
}
</style>
