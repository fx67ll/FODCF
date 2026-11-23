<template>
  <!-- 倍率赛果可能包含多个标准倍率类型，统一按字典标签展示，避免各页面各自拼接。 -->
  <div class="dortmund-odds-result-tags" :class="{ 'is-empty': !normalizedTokens.length }">
    <template v-if="normalizedTokens.length">
      <el-tag v-for="token in normalizedTokens" :key="token" size="mini" effect="plain" type="success">
        {{ tokenLabel(token) }}
      </el-tag>
    </template>
    <dortmund-result-empty-tag v-else :text="emptyText" />
  </div>
</template>

<script>
import { splitDortmundOddsResult } from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundResultEmptyTag from "@/views/fx67ll/dortmund/other/component/DortmundResultEmptyTag/index";

export default {
  name: "DortmundOddsResultTags",
  components: { DortmundResultEmptyTag },
  dicts: ["fx67ll_dortmund_odds_type"],
  props: {
    value: {
      type: [String, Array],
      default: null,
    },
    emptyText: {
      type: String,
      default: "未登记",
    },
  },
  computed: {
    normalizedTokens() {
      return splitDortmundOddsResult(this.value);
    },
  },
  methods: {
    tokenLabel(token) {
      const options = (this.dict && this.dict.type && this.dict.type.fx67ll_dortmund_odds_type) || [];
      const matched = options.find((item) => String(item.value) === token);
      return matched ? matched.label : token;
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-odds-result-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: center;
}
</style>
