<template>
  <el-tag :type="option.tagType" :size="size" effect="plain" class="verification-status-tag"
    :class="{ 'is-no-combination': noCombination }" :title="option.label">
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
    // 复用 sys_yes_no 字典：Y 已达成、N 未达成、null 未核验。
    status: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: "mini",
    },
    // 未关联回报组合是独立占位状态，与“未核验”的 null 状态区分展示。
    noCombination: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    option() {
      if (this.noCombination) {
        return { value: "NO_COMBINATION", label: "未关联组合", tagType: "info" };
      }
      return getReturnVerificationOption(this.status);
    },
    iconClass() {
      if (this.noCombination) {
        return "el-icon-link";
      }
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

.verification-status-tag.is-no-combination {
  color: #7f8c85;
  background: #f8faf9;
  border-color: #dfe6e2;
  border-style: dashed;
}
</style>