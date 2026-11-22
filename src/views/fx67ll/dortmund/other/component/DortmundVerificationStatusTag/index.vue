<template>
  <el-tag :type="option.tagType" :size="size" effect="plain" class="verification-status-tag"
    :title="option.label">
    <i :class="iconClass"></i>
    <span>{{ option.label }}</span>
  </el-tag>
</template>

<script>
import {
  DORTMUND_RETURN_VERIFICATION_STATUS,
  getReturnVerificationOption,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundVerificationStatusTag",
  props: {
    // 复用 sys_yes_no 字典：Y 核验成功、N 核验失败、null 未核验。
    status: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: "mini",
    },
  },
  computed: {
    option() {
      return getReturnVerificationOption(this.status);
    },
    iconClass() {
      if (this.option.value === DORTMUND_RETURN_VERIFICATION_STATUS.success) {
        return "el-icon-circle-check";
      }
      if (this.option.value === DORTMUND_RETURN_VERIFICATION_STATUS.failed) {
        return "el-icon-circle-close";
      }
      return "el-icon-time";
    },
  },
};
</script>

<style lang="scss" scoped>
.verification-status-tag {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  font-weight: 600;

  i {
    font-size: 12px;
  }
}
</style>
