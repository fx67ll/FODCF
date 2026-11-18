<template>
  <!-- 业务编码输入：保留手工录入，并提供符合表结构约束的一键生成入口 -->
  <div class="dortmund-code-field">
    <el-input :value="value" :maxlength="maxlength" :show-word-limit="showWordLimit" :disabled="disabled"
      :placeholder="placeholder" class="dortmund-code-input" @input="$emit('input', $event)"
      @blur="$emit('blur', $event)" />
    <el-button native-type="button" class="dortmund-code-generate-btn" icon="el-icon-magic-stick" :disabled="disabled"
      :title="generateTip" :aria-label="generateTip" @click="handleGenerate">
      <span>自动生成</span>
    </el-button>
  </div>
</template>

<script>
import { generateBusinessCode } from "@/views/fx67ll/dortmund/utils/codeGenerator";

export default {
  name: "DortmundCodeInput",
  props: {
    // 当前编码值（由宿主表单 v-model 维护）
    value: {
      type: [String, Number],
      default: null,
    },
    // 编码业务类型，决定前缀与默认日期来源
    codeKind: {
      type: String,
      required: true,
    },
    // 业务日期（如比赛时间、来源时间、赛季开始日期），为空时使用当前本地日期
    dateValue: {
      type: [String, Date],
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "",
    },
    maxlength: {
      type: [String, Number],
      default: 23,
    },
    showWordLimit: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    generateTip() {
      return "按业务日期自动生成编码；保存时仍由后端校验全局唯一性";
    },
  },
  methods: {
    // 生成结果同步回宿主的 v-model，并触发 change 以便 el-form-item 重新校验
    handleGenerate() {
      const generatedCode = generateBusinessCode(this.codeKind, this.dateValue);
      this.$emit("input", generatedCode);
      this.$emit("change", generatedCode);
      this.$emit("generated", generatedCode);
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-code-field {
  display: flex;
  gap: 8px;
  align-items: stretch;
  width: 100%;
}

.dortmund-code-input {
  flex: 1 1 auto;
  min-width: 0;
}

.dortmund-code-generate-btn {
  flex: 0 0 auto;
  min-width: 108px;
  min-height: 32px;
  height: auto;
  padding: 0 14px;
  font-weight: 500;
  color: #238c52;
  white-space: nowrap;
  background: linear-gradient(135deg, #f4fcf7 0%, #e8f8ef 100%);
  border-color: #cfe9da;
  border-radius: 8px;
  box-shadow: 0 2px 7px rgba(46, 204, 113, 0.08);
  transition: background 0.2s ease, border-color 0.2s ease,
    box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease;

  span {
    white-space: nowrap;
  }

  &:hover,
  &:focus {
    color: #fff;
    background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
    border-color: #27ad60;
    box-shadow: 0 6px 14px rgba(46, 204, 113, 0.24);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: none;
    transform: translateY(0) scale(0.98);
  }

  &.is-disabled,
  &:disabled {
    color: #a8b5af;
    background: #f7faf8;
    border-color: #e5eee9;
    box-shadow: none;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dortmund-code-generate-btn {
    transition: none;

    &:hover,
    &:focus,
    &:active {
      transform: none;
    }
  }
}
</style>
