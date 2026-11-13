<template>
  <!-- 多特蒙德统一赛季选择器：固定赛季接口与展示字段 -->
  <common-enhanced-select ref="seasonSelect" v-bind="$attrs" v-on="$listeners" :api-func="listSeason"
    value-key="seasonId" label-key="seasonName" placeholder="请选择所属赛季" />
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "DortmundSeasonSelect",
  inheritAttrs: false,
  components: { CommonEnhancedSelect },
  data() {
    return {
      listSeason,
    };
  },
  methods: {
    refresh() {
      this.$refs.seasonSelect.refresh();
    },
  },
};
</script>
