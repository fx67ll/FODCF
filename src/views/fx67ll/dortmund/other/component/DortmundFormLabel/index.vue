<template>
  <span class="dortmund-form-label">
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
</style>
