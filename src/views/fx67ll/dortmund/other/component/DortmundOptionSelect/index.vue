<template>
  <el-select :value="value" v-bind="$attrs" v-on="$listeners" style="width: 100%">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
      <el-tag v-if="optionType === 'tag' && item.type" :type="item.type" size="mini">{{ item.label }}</el-tag>
      <template v-else>{{ item.label }}</template>
    </el-option>
  </el-select>
</template>

<script>
import { teamCountryOptions, teamTagOptions, teamVenueOptions } from "@/utils/constant/football";

const dortmundOptionMap = {
  country: teamCountryOptions,
  tag: teamTagOptions,
  venue: teamVenueOptions,
};

export default {
  name: "DortmundOptionSelect",
  props: {
    value: {
      type: [String, Number, Array],
      default: null,
    },
    optionType: {
      type: String,
      required: true,
      validator: (value) => Object.keys(dortmundOptionMap).includes(value),
    },
  },
  computed: {
    options() {
      return dortmundOptionMap[this.optionType] || [];
    },
  },
};
</script>
