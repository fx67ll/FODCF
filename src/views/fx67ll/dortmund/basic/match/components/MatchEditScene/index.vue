<template>
  <!-- 比赛编排场景：新增/修改共用整页，按填写顺序铺开（进入场景时从父页面初始表单复制出可编辑副本） -->
  <div class="match-edit-scene">
    <div class="match-edit-header">
      <div class="match-edit-header-left">
        <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
        <span class="match-edit-title">{{ editMode === "add" ? "新增比赛" : "修改比赛" }}</span>
      </div>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="85px" class="match-edit-form"
      v-loading="editLoading">
      <el-row :gutter="20">
        <!-- 所属赛季：可选已有，也可当场新增（仅新增比赛时，修改时不支持当场新建） -->
        <el-col :span="12">
          <el-form-item label="所属赛季" prop="seasonId">
            <div class="match-edit-item">
              <common-enhanced-select ref="editSeasonSelect" v-model="editForm.seasonId" valueKey="seasonId"
                labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季"
                :disabled="newSeasonVisible || editMode !== 'add'" @change="handleEditSeasonChange" />
              <el-button type="text" icon="el-icon-circle-plus-outline" class="match-edit-inline-btn"
                v-if="editMode === 'add'" @click="toggleNewSeasonPanel">
                {{ newSeasonVisible ? "收起当场新增" : "当场新增赛季" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>
        <!-- 比赛时间：带时分秒，与后台 datetime 列和唯一索引一致 -->
        <el-col :span="12">
          <el-form-item label="比赛时间" prop="matchTime">
            <el-date-picker clearable v-model="editForm.matchTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%" placeholder="请选择比赛时间">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <!-- 当场新增赛季滑出面板（面板组件v-if重新挂载自带表单重置） -->
        <el-col :span="24" v-if="newSeasonVisible">
          <transition name="slide-panel">
            <match-new-season-panel ref="newSeasonPanel" />
          </transition>
        </el-col>

        <!-- 主队 -->
        <el-col :span="12">
          <el-form-item label="主队名称" prop="homeTeamId">
            <div class="match-edit-item">
              <common-enhanced-select ref="editHomeTeamSelect" v-model="editForm.homeTeamId" valueKey="teamId"
                labelKey="teamName" :api-func="listTeam" placeholder="请选择主队名称"
                :disabled="newHomeTeamVisible || editMode !== 'add'" @change="handleEditHomeTeamChange" />
              <el-button type="text" icon="el-icon-circle-plus-outline" class="match-edit-inline-btn"
                v-if="editMode === 'add'" @click="toggleNewTeamPanel('home')">
                {{ newHomeTeamVisible ? "收起当场新增" : "当场新增主队" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>
        <!-- 客队 -->
        <el-col :span="12">
          <el-form-item label="客队名称" prop="awayTeamId">
            <div class="match-edit-item">
              <common-enhanced-select ref="editAwayTeamSelect" v-model="editForm.awayTeamId" valueKey="teamId"
                labelKey="teamName" :api-func="listTeam" placeholder="请选择客队名称"
                :disabled="newAwayTeamVisible || editMode !== 'add'" @change="handleEditAwayTeamChange" />
              <el-button type="text" icon="el-icon-circle-plus-outline" class="match-edit-inline-btn"
                v-if="editMode === 'add'" @click="toggleNewTeamPanel('away')">
                {{ newAwayTeamVisible ? "收起当场新增" : "当场新增客队" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>

        <!-- 当场新增主队面板 -->
        <el-col :span="24" v-if="newHomeTeamVisible">
          <transition name="slide-panel">
            <match-new-team-panel ref="newHomeTeamPanel" side="home" />
          </transition>
        </el-col>

        <!-- 当场新增客队面板 -->
        <el-col :span="24" v-if="newAwayTeamVisible">
          <transition name="slide-panel">
            <match-new-team-panel ref="newAwayTeamPanel" side="away" />
          </transition>
        </el-col>

        <el-col :span="12">
          <el-form-item label="比赛场地" prop="matchVenue">
            <el-select v-model="editForm.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable filterable
              allow-create default-first-option>
              <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="比赛状态" prop="matchStatus">
            <el-select v-model="editForm.matchStatus" style="width: 100%" placeholder="请选择比赛状态">
              <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="比赛结果" prop="matchResult">
            <el-select v-model="editForm.matchResult" style="width: 100%" placeholder="请选择比赛结果（可空）" clearable>
              <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="比赛备注" prop="matchRemark">
            <el-input v-model="editForm.matchRemark" type="textarea" placeholder="请输入比赛备注内容" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="match-edit-footer">
      <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
      <el-button @click="handleBackToList">返回总览</el-button>
    </div>
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";

import { teamVenueOptions } from "@/utils/constant/football";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import MatchNewSeasonPanel from "../MatchNewSeasonPanel/index";
import MatchNewTeamPanel from "../MatchNewTeamPanel/index";

export default {
  name: "MatchEditScene",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: { CommonEnhancedSelect, MatchNewSeasonPanel, MatchNewTeamPanel },
  props: {
    // 编排场景模式（add新增 update修改）
    editMode: {
      type: String,
      default: "add",
    },
    // 进入场景时的初始表单（父页面构建，本场景复制出可编辑副本）
    initialForm: {
      type: Object,
      default: () => ({}),
    },
    // 编排场景表单遮罩层
    editLoading: {
      type: Boolean,
      default: false,
    },
    // 编排场景提交中状态
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    // 归属字段的校验：已选已有记录或已展开当场新增面板均视为已填写
    const checkSeasonFilled = (rule, value, callback) => {
      if ((value != null && value !== "") || this.newSeasonVisible) {
        callback();
      } else {
        callback(new Error("所属赛季不能为空"));
      }
    };
    const checkHomeTeamFilled = (rule, value, callback) => {
      if ((value != null && value !== "") || this.newHomeTeamVisible) {
        callback();
      } else {
        callback(new Error("主队名称不能为空"));
      }
    };
    const checkAwayTeamFilled = (rule, value, callback) => {
      if ((value != null && value !== "") || this.newAwayTeamVisible) {
        callback();
      } else {
        callback(new Error("客队名称不能为空"));
      }
    };
    return {
      // 编排场景表单参数（创建与修改共用，从父页面初始表单复制）
      editForm: this.buildEditForm(),
      // 编排场景表单校验
      editRules: {
        seasonId: [
          { required: true, validator: checkSeasonFilled, trigger: "change" }
        ],
        homeTeamId: [
          { required: true, validator: checkHomeTeamFilled, trigger: "change" }
        ],
        awayTeamId: [
          { required: true, validator: checkAwayTeamFilled, trigger: "change" }
        ],
        matchTime: [
          { required: true, message: "比赛时间不能为空", trigger: "blur" }
        ],
        matchStatus: [
          { required: true, message: "比赛状态不能为空", trigger: "blur" }
        ],
      },
      // 当场新增赛季面板开关
      newSeasonVisible: false,
      // 当场新增主队面板开关
      newHomeTeamVisible: false,
      // 当场新增客队面板开关
      newAwayTeamVisible: false,
      // 球场预设选项数组（比赛场地可选项）
      teamVenueOptions,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    this.listTeam = listTeam;
  },
  methods: {
    // 从父页面传入的初始表单复制出本场景可编辑副本（避免直接改动父页面数据）
    buildEditForm() {
      const initial = this.initialForm || {};
      return {
        matchId: initial.matchId || null,
        seasonId: initial.seasonId || null,
        homeTeamId: initial.homeTeamId || null,
        awayTeamId: initial.awayTeamId || null,
        matchTime: initial.matchTime || null,
        matchVenue: initial.matchVenue || null,
        matchStatus: initial.matchStatus || null,
        matchResult: initial.matchResult || null,
        matchRemark: initial.matchRemark || null,
      };
    },
    // 展开/收起当场新增赛季面板（展开时清空已选赛季，收起时还原可选；面板v-if重新挂载自带表单重置）
    toggleNewSeasonPanel() {
      this.newSeasonVisible = !this.newSeasonVisible;
      if (this.newSeasonVisible) {
        this.editForm.seasonId = null;
      }
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate("seasonId");
      });
    },
    // 展开/收起当场新增主队/客队面板（面板v-if重新挂载自带表单重置）
    toggleNewTeamPanel(side) {
      if (side === "home") {
        this.newHomeTeamVisible = !this.newHomeTeamVisible;
        if (this.newHomeTeamVisible) {
          this.editForm.homeTeamId = null;
        }
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate("homeTeamId");
        });
      } else {
        this.newAwayTeamVisible = !this.newAwayTeamVisible;
        if (this.newAwayTeamVisible) {
          this.editForm.awayTeamId = null;
        }
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate("awayTeamId");
        });
      }
    },
    // 已选已有赛季时收起当场新增面板
    handleEditSeasonChange(val) {
      if (val != null && val !== "") {
        this.newSeasonVisible = false;
      }
    },
    // 已选已有主队时收起当场新增面板
    handleEditHomeTeamChange(val) {
      if (val != null && val !== "") {
        this.newHomeTeamVisible = false;
      }
    },
    // 已选已有客队时收起当场新增面板
    handleEditAwayTeamChange(val) {
      if (val != null && val !== "") {
        this.newAwayTeamVisible = false;
      }
    },
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
    // 保存失败后由父页面回调：重新拉取下拉选项，便于直接重试
    refreshSelectOptions() {
      this.$refs["editSeasonSelect"] && this.$refs["editSeasonSelect"].refresh();
      this.$refs["editHomeTeamSelect"] && this.$refs["editHomeTeamSelect"].refresh();
      this.$refs["editAwayTeamSelect"] && this.$refs["editAwayTeamSelect"].refresh();
    },
    // 构建提交体：新增带可选 newSeason/newHomeTeam/newAwayTeam，修改不带当场新建字段
    buildSubmitData() {
      const isAdd = this.editMode === "add";
      const data = {
        matchTime: this.editForm.matchTime,
        matchVenue: this.editForm.matchVenue,
        matchStatus: this.editForm.matchStatus,
        matchResult: this.editForm.matchResult,
        matchRemark: this.editForm.matchRemark,
      };
      if (isAdd) {
        // 当场新增面板展开时提交新建体，否则提交已选记录ID
        if (this.newSeasonVisible) {
          data.newSeason = this.$refs["newSeasonPanel"].getSubmitData();
        } else {
          data.seasonId = this.editForm.seasonId;
        }
        if (this.newHomeTeamVisible) {
          data.newHomeTeam = this.$refs["newHomeTeamPanel"].getSubmitData();
        } else {
          data.homeTeamId = this.editForm.homeTeamId;
        }
        if (this.newAwayTeamVisible) {
          data.newAwayTeam = this.$refs["newAwayTeamPanel"].getSubmitData();
        } else {
          data.awayTeamId = this.editForm.awayTeamId;
        }
      } else {
        data.matchId = this.editForm.matchId;
        data.seasonId = this.editForm.seasonId;
        data.homeTeamId = this.editForm.homeTeamId;
        data.awayTeamId = this.editForm.awayTeamId;
      }
      return data;
    },
    // 逐个校验编排表单与已展开的当场新增面板，全部通过后构建提交体交由父页面提交
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        // 面板组件自带Promise化的validate，未展开的面板直接视为通过
        const validatePanel = (refName) => {
          const panel = this.$refs[refName];
          if (!panel) {
            return Promise.resolve(true);
          }
          return panel.validate();
        };
        Promise.all([
          validatePanel("newSeasonPanel"),
          validatePanel("newHomeTeamPanel"),
          validatePanel("newAwayTeamPanel"),
        ]).then(results => {
          if (results.some(item => !item)) {
            return;
          }
          // 主客队不能相同（当场新建的主客队由后台在创建后校验）
          if (this.editForm.homeTeamId != null && this.editForm.awayTeamId != null
            && this.editForm.homeTeamId === this.editForm.awayTeamId) {
            this.$modal.msgError("比赛主队和客队不能相同！");
            return;
          }
          this.$emit("save", this.buildSubmitData());
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* 编排场景头部 */
.match-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.match-edit-header-left {
  display: flex;
  align-items: center;
}

.match-edit-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.match-edit-form {
  padding: 20px 20px 4px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 选择器与当场新增入口同行排布 */
.match-edit-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.match-edit-item .el-select {
  flex: 1;
}

.match-edit-inline-btn {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0 4px;
}

/* 面板滑出过渡动画 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-panel-enter,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 编排场景底部按钮 */
.match-edit-footer {
  margin-top: 16px;
  padding: 14px 20px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
