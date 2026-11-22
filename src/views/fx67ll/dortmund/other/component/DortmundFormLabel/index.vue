<template>
  <span class="dortmund-form-label">
    <em v-if="required" class="dortmund-form-label-required" aria-hidden="true">*</em>
    <span>{{ label }}</span>
    <el-tooltip v-if="tip" :content="tip" placement="top" popper-class="dortmund-theme-popper">
      <i class="el-icon-question dortmund-form-label-tip" tabindex="0" :aria-label="`${label}填写说明`"></i>
    </el-tooltip>
  </span>
</template>

<script>
export default {
  name: 'DortmundFormLabel',
  props: {
    label: {
      type: String,
      required: true
    },
    tip: {
      type: String,
      default: ''
    },
    // Element UI 会依据 form-item 的 required 规则自动显示星号；仅在无规则但需要视觉提示时启用，避免双星号。
    required: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
.dortmund-form-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.dortmund-form-label-tip {
  flex-shrink: 0;
  color: #8aa79a;
  font-size: 13px;
  cursor: help;

  &:hover,
  &:focus {
    color: #27ad60;
    outline: none;
  }
}

.dortmund-form-label-required {
  color: #f56c6c;
  font-style: normal;
  line-height: 1;
}
</style>
