<template>
  <div class="app-container dl-page">
    <!-- 场景切换：总览列表 / T录入 / M录入 / 有效性 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <transition name="dl-filter">
          <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true"
            v-show="showSearch" label-width="82px">
            <el-form-item label="信息点类型" prop="infoPointType">
              <el-select v-model="queryParams.infoPointType" placeholder="请选择信息点类型" clearable
                @change="handleQueryTypeChange">
                <el-option v-for="dict in dict.type.fx67ll_dortmund_info_point_type" :key="dict.value"
                  :label="dict.label" :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="所属赛季" prop="seasonId" v-if="queryParams.infoPointType === 'T'">
              <dortmund-season-select ref="seasonSelect" v-model="queryParams.seasonId" :enter-callback="handleQuery" />
            </el-form-item>
            <el-form-item label="所属比赛" prop="matchId" v-if="queryParams.infoPointType === 'M'">
              <el-input :value="formatSelectedMatch(selectedMatch)" readonly placeholder="请选择所属比赛"
                @click.native="matchSelectorVisible = true" />
            </el-form-item>
            <el-form-item label="信息点标题" prop="pointTitle">
              <el-input v-model="queryParams.pointTitle" placeholder="请输入信息点标题关键字" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="信息点状态" prop="pointStatus" v-if="isMoreQuery">
              <el-select v-model="queryParams.pointStatus" placeholder="请选择信息点状态" clearable>
                <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="是否可公开" prop="allowPublic" v-if="isMoreQuery">
              <el-select v-model="queryParams.allowPublic" placeholder="请选择是否可公开" clearable>
                <el-option v-for="dict in dict.type.fx67ll_dortmund_allow_public" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
                type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
                clearable></el-date-picker>
            </el-form-item>
            <el-form-item label="更新时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd"
                type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
                clearable></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              <el-button type="success" class="dl-more-btn" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'"
                size="mini" @click="handleMoreQuery">
                {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
              </el-button>
            </el-form-item>
          </el-form>
        </transition>

        <div class="dl-toolbar">
          <div class="dl-toolbar-actions">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAddT"
              v-hasPermi="['dortmund:info:point:add']">新增赛季球队信息点</el-button>
            <el-button type="primary" icon="el-icon-football" size="mini" class="info-add-match-btn" @click="handleAddM"
              v-hasPermi="['dortmund:info:point:add']">新增比赛临时信息点</el-button>
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:info:point:edit']">修改</el-button>
            <!-- 信息点没有删除动作，不渲染删除按钮 -->
            <transition name="dl-chip">
              <span class="dl-selected-chip" v-if="ids.length > 0"><i class="el-icon-circle-check"></i>已选 {{ ids.length
              }} 项</span>
            </transition>
          </div>
          <div class="dl-toolbar-side">
            <!-- 展示视图切换：卡片视图为默认，偏好持久化到本地缓存 -->
            <view-switch v-model="viewMode" @change="handleViewModeChange" />
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </div>
        </div>

        <!-- 卡片视图（默认）/ 列表视图（原总览列表），切换带过渡 -->
        <transition name="dl-view" mode="out-in">
          <info-card-pane v-if="viewMode === 'card'" key="card" :rows="infoPointList" :loading="loading"
            @detail="handleViewDetail" @update="handleUpdate" @changeStatus="handleChangeStatus" />
          <div v-else key="list" class="dl-list-card">
            <info-list-pane :rows="infoPointList" :loading="loading" @selection-change="handleSelectionChange"
              @detail="handleViewDetail" @update="handleUpdate" @changeStatus="handleChangeStatus" />
          </div>
        </transition>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />

        <!-- 信息点详情对话框（只读） -->
        <info-detail-dialog :visible.sync="detailOpen" :detail-model="detailModel" :detail-loading="detailLoading" />
      </div>

      <!-- T类型录入场景：赛季 → 球队 → 内容 → 来源和时间窗（绿色赛季风格） -->
      <info-edit-t-scene key="editT" v-else-if="pageScene === 'editT'" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave" />

      <!-- M类型录入场景：先定比赛，再写内容和来源（蓝色比赛风格） -->
      <info-edit-m-scene key="editM" v-else-if="pageScene === 'editM'" :edit-mode="editMode" :initial-form="editForm"
        :edit-loading="editLoading" :submitting="submitting" @back="handleSceneBack" @save="handleSceneSave" />

      <!-- 有效性场景：按一场比赛只读分出「将进入分析」和「被排除」 -->
      <info-valid-scene key="valid" v-else @back="handleSceneBack" />
    </transition>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" :selected-items="[selectedMatch]"
      @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import { listInfoPoint, getInfoPoint, addInfoPoint, updateInfoPoint, changeInfoPointStatus } from "@/api/fx67ll/dortmund/infoPoint";
import { addMatch } from "@/api/fx67ll/dortmund/match";
import ViewSwitch from "@/components/ViewSwitch/index.vue";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundSeasonSelect from "@/views/fx67ll/dortmund/other/component/DortmundSeasonSelect/index";
import InfoCardPane from "./components/InfoCardPane/index.vue";
import InfoListPane from "./components/InfoListPane/index.vue";
import InfoDetailDialog from "./components/InfoDetailDialog/index.vue";
import InfoEditTScene from "./components/InfoEditTScene/index.vue";
import InfoEditMScene from "./components/InfoEditMScene/index.vue";
import InfoValidScene from "./components/InfoValidScene/index.vue";

// 总览列表展示视图偏好本地持久缓存的key（card卡片视图 list列表视图）
const VIEW_MODE_KEY = "dortmund-info-view-mode";

export default {
  name: "Info",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_info_point_type", "fx67ll_dortmund_allow_public"],
  components: { ViewSwitch, InfoCardPane, InfoListPane, InfoDetailDialog, InfoEditTScene, InfoEditMScene, InfoValidScene, DortmundMatchSelectorModal, DortmundSeasonSelect },
  data() {
    return {
      // 页面场景（list总览列表 editT赛季球队录入 editM比赛临时录入 valid有效性查询）
      pageScene: "list",
      // 总览列表展示视图（card卡片视图默认 list列表视图），偏好持久化到本地缓存
      viewMode: "card",
      // 录入场景模式（add新增 update修改）
      editMode: "add",
      // 遮罩层
      loading: true,
      // 录入场景表单遮罩层
      editLoading: false,
      // 录入场景提交中状态
      submitting: false,
      // 详情对话框开关
      detailOpen: false,
      // 详情加载状态
      detailLoading: false,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 信息点表格数据
      infoPointList: [],
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      selectedMatch: null,
      matchSelectorVisible: false,
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        infoPointType: null,
        seasonId: null,
        matchId: null,
        pointTitle: null,
        pointStatus: null,
        allowPublic: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 完整只读详情（详情对话框展示）
      detailModel: {},
      // 录入场景初始表单（进入录入场景前由父页面构建，场景组件复制出可编辑副本）
      editForm: {},
    };
  },
  created() {
    // 读取本地缓存的展示视图偏好（非法值兜底为卡片视图）
    this.viewMode = localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "card";
    this.getList();
  },
  activated() {
    // 路由缓存复用时同步本地缓存的展示视图偏好，保持切换即时生效
    const cachedMode = localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "card";
    if (cachedMode !== this.viewMode) {
      this.viewMode = cachedMode;
    }
  },
  methods: {
    // 展示视图切换：偏好写入本地缓存，仅切换展示不重新拉取数据
    handleViewModeChange(mode) {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询信息点列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      // 类型切换时清理不适用字段，隐藏字段不被提交
      if (this.queryParams.infoPointType === "T") {
        this.queryParams.matchId = null;
        this.selectedMatch = null;
      } else if (this.queryParams.infoPointType === "M") {
        this.queryParams.seasonId = null;
      } else {
        this.queryParams.seasonId = null;
        this.queryParams.matchId = null;
        this.selectedMatch = null;
      }
      listInfoPoint(this.queryParams).then(response => {
        this.infoPointList = this.formatObjectArrayNullProperty(response.rows || []);
        this.total = response.total;
      }).finally(() => {
        this.loading = false;
      });
    },
    /** 高级搜索按钮操作 */
    handleMoreQuery() {
      this.isMoreQuery = !this.isMoreQuery;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    // 类型筛选变化时重新查询
    handleQueryTypeChange() {
      this.handleQuery();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.selectedMatch = null;
      this.handleQuery();
    },
    formatSelectedMatch(match) {
      return match ? this.formatMatchVsTimeText(match) : "";
    },
    handleMatchSelectorConfirm(match) {
      this.selectedMatch = match || null;
      this.queryParams.matchId = match ? match.matchId : null;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.infoPointId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增T类型信息点：进入赛季球队录入场景 */
    handleAddT() {
      this.editMode = "add";
      this.resetEditScene("T");
      this.pageScene = "editT";
    },
    /** 新增M类型信息点：进入比赛临时录入场景 */
    handleAddM() {
      this.editMode = "add";
      this.resetEditScene("M");
      this.pageScene = "editM";
    },
    /** 修改按钮操作：拉取详情后按类型进入对应录入场景 */
    handleUpdate(row) {
      const infoPointId = row.infoPointId || this.ids;
      this.editLoading = true;
      getInfoPoint(infoPointId).then(response => {
        const detail = response.data || {};
        this.editMode = "update";
        // 从详情中挑选允许修改的字段构建初始表单；类型、归属和状态只读，状态只走启停动作
        this.editForm = {
          infoPointId: detail.infoPointId,
          infoPointType: detail.infoPointType,
          seasonId: detail.seasonId,
          // 归属只读展示用的冗余字段（不进入提交数据）
          seasonName: detail.seasonName,
          teamIds: (detail.teamRels || []).filter(rel => rel.relationStatus === "0").map(rel => rel.teamId),
          teamRels: detail.teamRels || [],
          matchId: detail.matchId,
          matchTime: detail.matchTime,
          homeTeamName: detail.homeTeamName,
          awayTeamName: detail.awayTeamName,
          pointTitle: detail.pointTitle,
          pointContent: detail.pointContent,
          sourceName: detail.sourceName,
          sourceUrl: detail.sourceUrl,
          sourcePublishTime: detail.sourcePublishTime,
          collectTime: detail.collectTime,
          effectiveStartTime: detail.effectiveStartTime,
          effectiveEndTime: detail.effectiveEndTime,
          allowPublic: detail.allowPublic || "0",
          pointRemark: detail.pointRemark,
        };
        this.pageScene = detail.infoPointType === "T" ? "editT" : "editM";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    // 重置录入场景初始表单（场景组件每次进入重新挂载，自带可选球队加载与表单重置）
    resetEditScene(infoPointType) {
      this.editForm = {
        infoPointId: null,
        infoPointType: infoPointType,
        seasonId: null,
        teamIds: [],
        matchId: null,
        pointTitle: null,
        pointContent: null,
        sourceName: null,
        sourceUrl: null,
        sourcePublishTime: null,
        collectTime: null,
        effectiveStartTime: null,
        effectiveEndTime: null,
        allowPublic: "0",
        pointRemark: null,
      };
    },
    // 场景返回总览并刷新列表
    handleSceneBack() {
      this.pageScene = "list";
      this.getList();
    },
    // 场景保存：录入场景校验并构建请求体后回传，父页面负责提交
    handleSceneSave(data) {
      const isAdd = this.editMode === "add";
      this.submitting = true;
      const request = isAdd && data.newMatch
        ? addMatch({
          ...data.newMatch,
          newInfoPoints: [{ ...data, infoPointType: "M", allowPublic: "0" }],
        })
        : isAdd ? addInfoPoint(data) : updateInfoPoint(data);
      request.then(() => {
        this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
        this.handleSceneBack();
      }).catch(() => {
        // 保存失败时留在录入场景并保留已填内容，可直接重试
      }).finally(() => {
        this.submitting = false;
      });
    },
    /** 启停按钮操作：状态动作成功后重新拉取列表 */
    handleChangeStatus(row) {
      const targetStatus = row.pointStatus === "0" ? "1" : "0";
      const actionText = targetStatus === "0" ? "启用" : "停用";
      this.$modal.confirm(`是否确认${actionText}信息点编号为"${row.infoPointId}"的数据项？`).then(() => {
        return changeInfoPointStatus({ infoPointId: row.infoPointId, pointStatus: targetStatus });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess(`${actionText}成功`);
      }).catch(() => { });
    },
    /** 详情按钮操作：只读展示完整详情 */
    handleViewDetail(row) {
      this.detailLoading = true;
      this.detailModel = {};
      this.detailOpen = true;
      getInfoPoint(row.infoPointId).then(response => {
        this.detailModel = response.data || {};
      }).finally(() => {
        this.detailLoading = false;
      });
    },
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
  }
};
</script>

<style lang="scss" scoped>
.info-add-match-btn {
  color: #fff;
  background: var(--current-color, #2ecc71);
  border-color: var(--current-color, #2ecc71);
  box-shadow: 0 5px 12px rgba(31, 61, 46, 0.18);
  transition: filter 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover,
  &:focus {
    color: #fff;
    background: var(--current-color, #2ecc71);
    border-color: var(--current-color, #2ecc71);
    box-shadow: 0 7px 16px rgba(31, 61, 46, 0.22);
    filter: brightness(0.94);
    transform: translateY(-1px);
  }
}

/* 场景切换过渡动画 */
.scene-switch-enter-active,
.scene-switch-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.scene-switch-enter,
.scene-switch-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
