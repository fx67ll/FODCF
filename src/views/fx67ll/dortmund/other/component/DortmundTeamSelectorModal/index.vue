<template>
  <div class="dortmund-team-selector">
    <list-selector-modal :visible.sync="dialogVisible" :title="multiple ? '选择球队' : '选择球队'" :api-func="listTeam"
      :query-params="{ teamStatus: '0', ...queryParams }" :columns="columns" :search-fields="searchFields"
      :selected-items="selectedItems" value-key="teamId" label-key="teamName" :multiple="multiple" :page-size="pageSize"
      :page-sizes="pageSizes" :show-detail="true" :shifted="teamDetailVisible" drawer-width="1120px" auto-query
      pagination-popper-class="dortmund-theme-popper" @detail="openTeamDetail" @confirm="$emit('confirm', $event)">
      <template v-slot:search="{ searchForm }">
        <el-form-item label="地区/联赛">
          <dortmund-team-option-selector v-model="searchForm.teamCountry" option-type="country" :multiple="false"
            :allow-create="false" clearable size="small" width="190px" placeholder="请选择地区/联赛" />
        </el-form-item>
      </template>
    </list-selector-modal>
    <dortmund-team-detail-drawer :visible.sync="teamDetailVisible" :team-id="selectedDetailTeamId"
      :snapshot="selectedDetailSnapshot" :level="2" />
  </div>
</template>

<script>
import { listTeam } from "@/api/fx67ll/dortmund/team";
import ListSelectorModal from "@/components/ListSelectorModal/index";
import DortmundTeamOptionSelector
  from "@/views/fx67ll/dortmund/other/component/DortmundTeamOptionSelector/index";
import DortmundTeamDetailDrawer
  from "@/views/fx67ll/dortmund/other/component/DortmundTeamDetailDrawer/index";
import { DORTMUND_PAGINATION } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundTeamSelectorModal",
  components: { ListSelectorModal, DortmundTeamOptionSelector, DortmundTeamDetailDrawer },
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
      pageSize: DORTMUND_PAGINATION.defaultPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      teamDetailVisible: false,
      selectedDetailTeamId: null,
      selectedDetailSnapshot: {},
      columns: [
        // 选择器补齐球队识别字段，标签等长文本仍由详情抽屉承接。
        { label: "球队全称", prop: "teamName", minWidth: 190 },
        { label: "球队昵称", prop: "teamNameShort", minWidth: 130 },
        { label: "球队英文", prop: "teamNameEn", minWidth: 200 },
        { label: "球队主场", prop: "teamVenue", minWidth: 170 },
        { label: "地区/联赛", prop: "teamCountry", minWidth: 150 },
      ],
      searchFields: [
        { key: "teamCountry", label: "地区/联赛", type: "slot" },
        { key: "teamName", label: "球队名称", placeholder: "请输入球队全称/昵称/简称/英文" },
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
  methods: {
    // 侧弹窗内打开共享球队详情，列表页与所有选择器保持同一交互。
    openTeamDetail(row) {
      this.selectedDetailSnapshot = { ...(row || {}) };
      this.selectedDetailTeamId = row && row.teamId;
      this.teamDetailVisible = Boolean(this.selectedDetailTeamId);
    },
  },
};
</script>
