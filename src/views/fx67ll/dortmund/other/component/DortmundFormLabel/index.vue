<template>
  <span class="dortmund-form-label">
    <em v-if="required" class="dortmund-form-label-required" aria-hidden="true">*</em>
    <el-tooltip v-if="tip" :content="tip" placement="top" popper-class="dortmund-theme-popper">
      <span class="dortmund-form-label-text is-help" tabindex="0" :aria-label="`${label}填写说明`">{{ label }}</span>
    </el-tooltip>
    <span v-else>{{ label }}</span>
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

.dortmund-form-label-text.is-help {
  cursor: help;
  transition: color .18s ease;
}

.dortmund-form-label-text.is-help:hover,
.dortmund-form-label-text.is-help:focus {
  color: #27ad60;
  outline: none;
}

.dortmund-form-label-required {
  color: #f56c6c;
  font-style: normal;
  line-height: 1;
}
</style>
