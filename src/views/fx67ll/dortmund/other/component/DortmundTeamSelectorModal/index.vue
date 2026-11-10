<template>
  <list-selector-modal :visible.sync="dialogVisible" :title="multiple ? '选择球队' : '选择球队'" :api-func="listTeam"
    :query-params="{ teamStatus: '0', ...queryParams }" :columns="columns" :search-fields="searchFields"
    :selected-items="selectedItems" value-key="teamId" label-key="teamName" :multiple="multiple"
    @confirm="$emit('confirm', $event)" />
</template>

<script>
import { listTeam } from "@/api/fx67ll/dortmund/team";
import ListSelectorModal from "@/components/ListSelectorModal/index";

export default {
  name: "DortmundTeamSelectorModal",
  components: { ListSelectorModal },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    queryParams: {
      type: Object,
      default: () => ({}),
    },
    selectedItems: {
      type: Array,
      default: () => [],
    },
    multiple: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      listTeam,
      columns: [
        { label: "球队全称", prop: "teamName", minWidth: 160 },
        { label: "球队昵称", prop: "teamNameShort", minWidth: 110 },
        { label: "球队英文", prop: "teamNameEn", minWidth: 140 },
        { label: "主场", prop: "teamVenue", minWidth: 150 },
        { label: "地区/联赛", prop: "teamCountry", minWidth: 140 },
        { label: "标签", prop: "teamTag", minWidth: 160 },
      ],
      searchFields: [
        { key: "teamName", label: "球队名称", placeholder: "全称/昵称/简称/英文" },
        { key: "teamVenue", label: "主场", placeholder: "请输入主场" },
        { key: "teamCountry", label: "地区/联赛", placeholder: "请输入地区/联赛" },
      ],
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
  },
};
</script>
