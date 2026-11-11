<template>
  <!-- 信息点列表视图（总览列表的另一种展示形式，数据与操作均来自父页面） -->
  <div class="info-list-pane">
    <el-table v-loading="loading" :data="rows" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="信息点类型" align="center" prop="infoPointType" width="100" fixed="left">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="scope.row.infoPointType" />
        </template>
      </el-table-column>
      <el-table-column label="所属赛季" align="center" prop="seasonName" width="110" fixed="left" />
      <el-table-column label="所属比赛" align="center" prop="matchId" width="200" :show-overflow-tooltip="true"
        fixed="left">
        <template slot-scope="scope">
          <span>{{ formatMatchColumnText(scope.row) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="关联球队" align="center" prop="teamRels" min-width="180" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ formatTeamRelsText(scope.row) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="信息点标题" align="center" prop="pointTitle" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="信息点内容" align="center" prop="pointContent" min-width="200" :show-overflow-tooltip="true" />
      <el-table-column label="信息来源" align="center" prop="sourceName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="来源发布时间" align="center" prop="sourcePublishTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.sourcePublishTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="信息点状态" align="center" prop="pointStatus" width="90">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.pointStatus" />
        </template>
      </el-table-column>
      <el-table-column label="是否可公开" align="center" prop="allowPublic" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="scope.row.allowPublic" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="180">
        <template slot-scope="scope">
          <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
            @click="$emit('detail', scope.row)" v-hasPermi="['dortmund:info:point:query']">详情</el-button>
          <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-edit"
            @click="$emit('update', scope.row)" v-hasPermi="['dortmund:info:point:edit']">修改</el-button>
          <el-button size="mini" type="text" class="dortmund-theme-text"
            :icon="scope.row.pointStatus === '0' ? 'el-icon-close' : 'el-icon-open'"
            @click="$emit('changeStatus', scope.row)" v-hasPermi="['dortmund:info:point:changeStatus']">{{
              scope.row.pointStatus === '0' ? '停用' : '启用'
            }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: "InfoListPane",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_info_point_type", "fx67ll_dortmund_allow_public"],
  props: {
    // 信息点列表数据（与卡片视图同一份，父页面持有）
    rows: {
      type: Array,
      default: () => [],
    },
    // 列表加载状态
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    // 多选框选中数据（透传给父页面维护选中数组）
    handleSelectionChange(selection) {
      this.$emit("selection-change", selection);
    },
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 比赛列展示文案：主队 vs 客队 + 开赛时间
    formatMatchColumnText(row) {
      if (row.infoPointType !== "M" || !row.matchId) {
        return "";
      }
      return this.formatMatchVsTimeText(row);
    },
    // 关联球队摘要：当前有效关系在前，停用历史在后
    formatTeamRelsText(row) {
      if (row.infoPointType !== "T" || !(row.teamRels || []).length) {
        return "";
      }
      return row.teamRels.map(rel => rel.teamName || ("球队" + rel.teamId)).join("、");
    },
  },
};
</script>
