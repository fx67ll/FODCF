<template>
  <!-- 比赛结果与倍率赛果的空值共用同一标签和基线，避免列表空态出现视觉差异。 -->
  <span class="dortmund-result-empty">
    <el-tag size="mini" effect="plain" type="info" class="dortmund-result-empty-tag">{{ text }}</el-tag>
  </span>
</template>

<script>
export default {
  name: "DortmundResultEmptyTag",
  props: {
    text: {
      type: String,
      default: "未登记",
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-result-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;
}
</style>
