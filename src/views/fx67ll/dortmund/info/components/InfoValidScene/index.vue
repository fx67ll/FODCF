<template>
  <!-- 信息点有效性场景：按一场比赛只读分出「将进入分析」和「被排除」（自包含查询场景） -->
  <div class="info-valid-scene">
    <div class="info-edit-header">
      <div class="info-edit-header-left">
        <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
        <span class="info-edit-title">信息点有效性</span>
      </div>
    </div>

    <div class="info-valid-search">
      <common-enhanced-select ref="validMatchSelect" v-model="validMatchId" valueKey="matchId" labelKey="matchName"
        :api-func="listMatch" placeholder="请选择要查询有效性的比赛" @change="handleValidMatchChange" />
    </div>

    <div v-loading="validLoading">
      <!-- 将进入分析 -->
      <div class="info-valid-group">
        <div class="info-valid-group-header">
          <span class="info-valid-group-title success"><i class="el-icon-circle-check"></i> 将进入分析（{{
            validList.length }} 条）</span>
        </div>
        <el-table :data="validList" empty-text="暂无将进入分析的信息点">
          <el-table-column label="信息点类型" align="center" prop="infoPointType" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="scope.row.infoPointType" />
            </template>
          </el-table-column>
          <el-table-column label="信息点标题" align="center" prop="pointTitle" min-width="160"
            :show-overflow-tooltip="true" />
          <el-table-column label="信息点内容" align="center" prop="pointContent" min-width="200"
            :show-overflow-tooltip="true" />
          <el-table-column label="信息来源" align="center" prop="sourceName" width="120" :show-overflow-tooltip="true" />
          <el-table-column label="是否可公开" align="center" prop="allowPublic" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="scope.row.allowPublic" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 被排除 -->
      <div class="info-valid-group">
        <div class="info-valid-group-header">
          <span class="info-valid-group-title danger"><i class="el-icon-circle-close"></i> 被排除（{{
            excludedList.length }} 条）</span>
        </div>
        <el-table :data="excludedList" empty-text="暂无被排除的信息点">
          <el-table-column label="信息点类型" align="center" prop="infoPointType" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="scope.row.infoPointType" />
            </template>
          </el-table-column>
          <el-table-column label="信息点标题" align="center" prop="pointTitle" min-width="160"
            :show-overflow-tooltip="true" />
          <el-table-column label="信息点内容" align="center" prop="pointContent" min-width="200"
            :show-overflow-tooltip="true" />
          <el-table-column label="信息来源" align="center" prop="sourceName" width="120" :show-overflow-tooltip="true" />
          <el-table-column label="排除原因" align="center" prop="excludeReason" width="240" :show-overflow-tooltip="true" />
          <el-table-column label="是否可公开" align="center" prop="allowPublic" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="scope.row.allowPublic" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { listValidInfoPoint } from "@/api/fx67ll/dortmund/infoPoint";
import { listMatch } from "@/api/fx67ll/dortmund/match";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "InfoValidScene",
  dicts: ["fx67ll_dortmund_info_point_type", "fx67ll_dortmund_allow_public"],
  components: { CommonEnhancedSelect },
  data() {
    return {
      // 有效性场景加载状态
      validLoading: false,
      // 有效性场景所选比赛
      validMatchId: null,
      // 有效性查询结果
      validResultList: [],
    };
  },
  computed: {
    // 将进入分析的信息点
    validList() {
      return this.validResultList.filter(item => item.valid);
    },
    // 被排除的信息点
    excludedList() {
      return this.validResultList.filter(item => !item.valid);
    },
  },
  created() {
    // 比赛下拉包装接口：为每个选项拼装 matchName 展示文案（后台比赛数据无 matchName 冗余字段）
    this.listMatch = (query) => {
      return listMatch(query).then((response) => {
        const rows = (response.rows || []).map((match) => ({
          ...match,
          matchName: this.formatMatchVsTimeText(match),
        }));
        return { ...response, rows };
      });
    };
  },
  methods: {
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
    // 所选比赛变化后查询
    handleValidMatchChange(val) {
      if (val == null || val === "") {
        this.validResultList = [];
        return;
      }
      this.getValidList(val);
    },
    // 查询比赛的有效信息点（只读，不录入、不执行分析）
    getValidList(matchId) {
      this.validLoading = true;
      listValidInfoPoint(matchId).then(response => {
        this.validResultList = response.data || [];
      }).finally(() => {
        this.validLoading = false;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* 有效性场景头部 */
.info-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.info-edit-header-left {
  display: flex;
  align-items: center;
}

.info-edit-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 有效性场景 */
.info-valid-search {
  margin-bottom: 16px;
}

.info-valid-search .el-select {
  width: 360px;
}

.info-valid-group {
  margin-bottom: 16px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-valid-group-header {
  margin-bottom: 12px;
}

.info-valid-group-title {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.info-valid-group-title i {
  margin-right: 6px;
}

.info-valid-group-title.success {
  color: #2ecc71;
}

.info-valid-group-title.danger {
  color: #ff5a5f;
}
</style>
