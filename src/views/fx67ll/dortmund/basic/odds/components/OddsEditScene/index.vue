<template>
  <div class="odds-edit-scene">
    <div class="odds-edit-hero">
      <div class="odds-edit-hero-left">
        <div class="odds-edit-hero-icon">
          <i class="el-icon-data-analysis"></i>
        </div>
        <div class="odds-edit-hero-text">
          <div class="odds-edit-hero-title-row">
            <h2>{{ editMode === "add" ? "新增倍率记录" : "修改倍率记录" }}</h2>
            <span class="odds-edit-hero-type">Odds · 倍率版本</span>
          </div>
          <p>维护比赛六类赔率与手工权重，保存后可单独设为有效版本</p>
        </div>
      </div>
      <el-button type="text" icon="el-icon-back" class="odds-edit-hero-back" @click="handleBackToList">返回总览
      </el-button>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="100px" class="odds-edit-form"
      v-loading="editLoading">
      <div class="odds-edit-card">
        <div class="odds-edit-card-header">
          <span class="odds-edit-card-chip"><i class="el-icon-document"></i></span>
          <span class="odds-edit-card-title">基础信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="8">
            <el-form-item label="记录编码" prop="oddsCode">
              <el-input v-model="editForm.oddsCode" maxlength="23" show-word-limit placeholder="请输入倍率记录编码" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="来源时间" prop="sourceTime">
              <el-date-picker v-model="editForm.sourceTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="请选择来源时间" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="让分值" prop="handicapValue">
              <el-input v-model="editForm.handicapValue" placeholder="必填，如 -0.25" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="odds-edit-card">
        <div class="odds-edit-card-header">
          <span class="odds-edit-card-chip"><i class="el-icon-connection"></i></span>
          <span class="odds-edit-card-title">归属设置</span>
          <span class="odds-edit-card-tip" v-if="editMode === 'update'">修改时保留原有比赛归属</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="关联比赛" prop="matchId" v-if="editMode === 'add' && !newMatchVisible">
              <div class="odds-match-picker">
                <el-input :value="formatSelectedMatch(selectedMatch)" readonly placeholder="请选择关联比赛"
                  prefix-icon="el-icon-football" @focus="matchSelectorVisible = true" />
                <el-button type="primary" plain icon="el-icon-s-operation"
                  @click="matchSelectorVisible = true">选择比赛</el-button>
                <el-button type="text" class="odds-create-match-btn" icon="el-icon-circle-plus-outline"
                  @click="toggleNewMatch">当场新建比赛</el-button>
              </div>
              <div class="odds-association-hint">可选择已有比赛，或在当前倍率记录中同步新建一场比赛</div>
            </el-form-item>
            <el-form-item label="关联比赛" prop="matchId" v-else-if="editMode === 'add' && newMatchVisible">
              <div class="odds-inline-control">
                <el-tag type="success" size="small"><i class="el-icon-plus"></i> 当场新建比赛</el-tag>
                <el-button type="text" icon="el-icon-close" @click="toggleNewMatch">改选已有比赛</el-button>
              </div>
            </el-form-item>
            <el-form-item label="关联比赛" v-else>
              <el-input :value="formatSelectedMatch(editForm)" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <transition name="odds-panel">
          <div class="odds-new-match" v-if="editMode === 'add' && newMatchVisible">
            <div class="odds-new-match-title">
              <i class="el-icon-football"></i>
              <span>当场新建比赛资料</span>
              <small>赛季、主队、客队和比赛时间均为必填</small>
            </div>
            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="所属赛季" prop="newMatch.seasonId" label-width="96px">
                  <common-enhanced-select ref="newSeasonSelect" v-model="editForm.newMatch.seasonId" valueKey="seasonId"
                    labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="比赛时间" prop="newMatch.matchTime" label-width="96px">
                  <el-date-picker v-model="editForm.newMatch.matchTime" type="datetime"
                    value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择比赛时间" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="主队" prop="newMatch.homeTeamId" label-width="96px">
                  <common-enhanced-select ref="newHomeTeamSelect" v-model="editForm.newMatch.homeTeamId"
                    valueKey="teamId" labelKey="teamName" :api-func="listTeam" placeholder="请选择主队" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="客队" prop="newMatch.awayTeamId" label-width="96px">
                  <common-enhanced-select ref="newAwayTeamSelect" v-model="editForm.newMatch.awayTeamId"
                    valueKey="teamId" labelKey="teamName" :api-func="listTeam" placeholder="请选择客队" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="比赛备注" label-width="96px">
                  <el-input v-model="editForm.newMatch.matchRemark" placeholder="请输入比赛备注（可空）" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </transition>
      </div>

      <div class="odds-edit-card">
        <div class="odds-edit-card-header">
          <span class="odds-edit-card-chip"><i class="el-icon-set-up"></i></span>
          <span class="odds-edit-card-title">六类赔率权重</span>
          <span class="odds-edit-card-tip">手工权重为空时按 100 参与计算</span>
        </div>
        <div class="odds-matrix-grid">
          <div class="odds-matrix-item" v-for="row in oddsRows" :key="row.key">
            <div class="odds-matrix-head">
              <dict-tag :options="dict.type.fx67ll_dortmund_odds_type || []" :value="row.type" />
            </div>
            <el-form-item label="赔率" :prop="row.oddsField" label-width="56px">
              <el-input v-model="editForm[row.oddsField]" placeholder="大于 0" />
            </el-form-item>
            <el-form-item label="权重" :prop="row.weightField" label-width="56px">
              <el-input v-model="editForm[row.weightField]" placeholder="空默认 100" />
            </el-form-item>
          </div>
        </div>
      </div>

      <div class="odds-edit-card">
        <div class="odds-edit-card-header">
          <span class="odds-edit-card-chip"><i class="el-icon-chat-line-square"></i></span>
          <span class="odds-edit-card-title">附加说明</span>
        </div>
        <el-form-item label="其他说明" prop="oddsRemark">
          <el-input v-model="editForm.oddsRemark" type="textarea" :rows="3" maxlength="1023" show-word-limit
            placeholder="请输入其他说明（可空）" />
        </el-form-item>
      </div>
    </el-form>

    <div class="odds-edit-footer">
      <el-button type="primary" :loading="submitting" @click="submitForm">保 存</el-button>
      <el-button @click="handleBackToList">返回总览</el-button>
    </div>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible"
      :selected-items="selectedMatchItem ? [selectedMatchItem] : []" @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";

export default {
  name: "OddsEditScene",
  dicts: ["fx67ll_dortmund_odds_type"],
  components: { DortmundMatchSelectorModal },
  props: {
    editMode: {
      type: String,
      default: "add",
    },
    initialForm: {
      type: Object,
      default: () => ({}),
    },
    editLoading: {
      type: Boolean,
      default: false,
    },
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const checkPositiveNumber = (label) => (rule, value, callback) => {
      if (value == null || value === "") {
        callback(new Error(label + "不能为空"));
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value)) || parseFloat(value) <= 0) {
        callback(new Error(label + "必须为大于 0 的数字"));
        return;
      }
      callback();
    };
    const checkWeight = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("权重必须为非负数字"));
        return;
      }
      if (parseFloat(value) > 100) {
        callback(new Error("权重不能大于 100"));
        return;
      }
      callback();
    };
    return {
      listSeason,
      listTeam,
      selectedMatch: null,
      matchSelectorVisible: false,
      editForm: this.buildEditForm(),
      newMatchVisible: false,
      oddsRows: [
        { key: "homeWin", type: "HW", oddsField: "homeWinOdds", weightField: "homeWinWeight" },
        { key: "draw", type: "DR", oddsField: "drawOdds", weightField: "drawWeight" },
        { key: "awayWin", type: "AW", oddsField: "awayWinOdds", weightField: "awayWinWeight" },
        { key: "handicapHomeWin", type: "HH", oddsField: "handicapHomeWinOdds", weightField: "handicapHomeWinWeight" },
        { key: "handicapDraw", type: "HD", oddsField: "handicapDrawOdds", weightField: "handicapDrawWeight" },
        { key: "handicapAwayWin", type: "HA", oddsField: "handicapAwayWinOdds", weightField: "handicapAwayWinWeight" },
      ],
      editRules: {
        oddsCode: [{ required: true, message: "记录编码不能为空", trigger: "blur" }],
        sourceTime: [{ required: true, message: "来源时间不能为空", trigger: "change" }],
        matchId: [{
          validator: (rule, value, callback) => {
            if (this.newMatchVisible || (value != null && value !== "")) {
              callback();
              return;
            }
            callback(new Error("请选择关联比赛或当场新建比赛"));
          },
          trigger: "change",
        }],
        "newMatch.seasonId": [{ required: true, message: "新比赛所属赛季不能为空", trigger: "change" }],
        "newMatch.homeTeamId": [{ required: true, message: "新比赛主队不能为空", trigger: "change" }],
        "newMatch.awayTeamId": [{ required: true, message: "新比赛客队不能为空", trigger: "change" }],
        "newMatch.matchTime": [{ required: true, message: "新比赛比赛时间不能为空", trigger: "change" }],
        handicapValue: [{
          required: true,
          validator: (rule, value, callback) => {
            if (value == null || value === "") {
              callback(new Error("让分值不能为空"));
              return;
            }
            if (!/^[+-]?\d+(\.\d+)?$/.test(String(value))) {
              callback(new Error("让分值必须为数字"));
              return;
            }
            callback();
          },
          trigger: "blur",
        }],
        homeWinOdds: [{ validator: checkPositiveNumber("主胜赔率"), trigger: "blur" }],
        drawOdds: [{ validator: checkPositiveNumber("平局赔率"), trigger: "blur" }],
        awayWinOdds: [{ validator: checkPositiveNumber("客胜赔率"), trigger: "blur" }],
        handicapHomeWinOdds: [{ validator: checkPositiveNumber("让分主胜赔率"), trigger: "blur" }],
        handicapDrawOdds: [{ validator: checkPositiveNumber("让分平局赔率"), trigger: "blur" }],
        handicapAwayWinOdds: [{ validator: checkPositiveNumber("让分客胜赔率"), trigger: "blur" }],
        homeWinWeight: [{ validator: checkWeight, trigger: "blur" }],
        drawWeight: [{ validator: checkWeight, trigger: "blur" }],
        awayWinWeight: [{ validator: checkWeight, trigger: "blur" }],
        handicapHomeWinWeight: [{ validator: checkWeight, trigger: "blur" }],
        handicapDrawWeight: [{ validator: checkWeight, trigger: "blur" }],
        handicapAwayWinWeight: [{ validator: checkWeight, trigger: "blur" }],
      },
    };
  },
  computed: {
    selectedMatchItem() {
      return this.editMode === "update" ? this.editForm : this.selectedMatch;
    },
  },
  methods: {
    formatSelectedMatch(match) {
      return match ? (match.matchSummary || match.matchCode) : "";
    },
    handleMatchSelectorConfirm(match) {
      this.selectedMatch = match || null;
      this.editForm.matchId = match ? match.matchId : null;
    },
    buildEditForm() {
      const initial = this.initialForm || {};
      const newMatch = initial.newMatch || {};
      return {
        oddsId: initial.oddsId || null,
        oddsCode: initial.oddsCode || null,
        matchId: initial.matchId || null,
        matchSummary: initial.matchSummary || null,
        matchCode: initial.matchCode || null,
        sourceTime: initial.sourceTime || null,
        handicapValue: initial.handicapValue || null,
        homeWinOdds: initial.homeWinOdds || null,
        drawOdds: initial.drawOdds || null,
        awayWinOdds: initial.awayWinOdds || null,
        handicapHomeWinOdds: initial.handicapHomeWinOdds || null,
        handicapDrawOdds: initial.handicapDrawOdds || null,
        handicapAwayWinOdds: initial.handicapAwayWinOdds || null,
        homeWinWeight: initial.homeWinWeight || null,
        drawWeight: initial.drawWeight || null,
        awayWinWeight: initial.awayWinWeight || null,
        handicapHomeWinWeight: initial.handicapHomeWinWeight || null,
        handicapDrawWeight: initial.handicapDrawWeight || null,
        handicapAwayWinWeight: initial.handicapAwayWinWeight || null,
        oddsRemark: initial.oddsRemark || null,
        newMatch: {
          seasonId: newMatch.seasonId || null,
          homeTeamId: newMatch.homeTeamId || null,
          awayTeamId: newMatch.awayTeamId || null,
          matchTime: newMatch.matchTime || null,
          matchRemark: newMatch.matchRemark || null,
        },
      };
    },
    toggleNewMatch() {
      this.newMatchVisible = !this.newMatchVisible;
      if (this.newMatchVisible) {
        this.editForm.matchId = null;
        this.selectedMatch = null;
        this.editForm.newMatch = this.buildEmptyNewMatch();
      }
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate(["matchId"]);
      });
    },
    buildEmptyNewMatch() {
      return {
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchRemark: null,
      };
    },
    handleBackToList() {
      this.$emit("back");
    },
    submitForm() {
      this.$refs.editForm.validate((valid) => {
        if (!valid) {
          return;
        }
        if (this.newMatchVisible && this.editForm.newMatch.homeTeamId === this.editForm.newMatch.awayTeamId) {
          this.$modal.msgError("新比赛的主队和客队不能相同");
          return;
        }
        const data = {
          oddsCode: this.editForm.oddsCode,
          sourceTime: this.editForm.sourceTime,
          handicapValue: this.editForm.handicapValue,
          homeWinOdds: this.editForm.homeWinOdds,
          drawOdds: this.editForm.drawOdds,
          awayWinOdds: this.editForm.awayWinOdds,
          handicapHomeWinOdds: this.editForm.handicapHomeWinOdds,
          handicapDrawOdds: this.editForm.handicapDrawOdds,
          handicapAwayWinOdds: this.editForm.handicapAwayWinOdds,
          homeWinWeight: this.editForm.homeWinWeight,
          drawWeight: this.editForm.drawWeight,
          awayWinWeight: this.editForm.awayWinWeight,
          handicapHomeWinWeight: this.editForm.handicapHomeWinWeight,
          handicapDrawWeight: this.editForm.handicapDrawWeight,
          handicapAwayWinWeight: this.editForm.handicapAwayWinWeight,
          oddsRemark: this.editForm.oddsRemark,
        };
        if (this.editMode === "add") {
          if (this.newMatchVisible) {
            data.newMatch = {
              seasonId: this.editForm.newMatch.seasonId,
              homeTeamId: this.editForm.newMatch.homeTeamId,
              awayTeamId: this.editForm.newMatch.awayTeamId,
              matchTime: this.editForm.newMatch.matchTime,
              matchRemark: this.editForm.newMatch.matchRemark,
            };
          } else {
            data.matchId = this.editForm.matchId;
          }
        } else {
          data.oddsId = this.editForm.oddsId;
          data.matchId = this.editForm.matchId;
        }
        this.$emit("save", data);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.odds-edit-scene {
  --odds-accent: #2ecc71;
  --odds-accent-dark: #27ad60;
  --odds-accent-soft: #e7f8ee;
  --odds-accent-ramp: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  --odds-accent-shadow: rgba(46, 204, 113, 0.3);
}

.odds-edit-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: linear-gradient(135deg, #ffffff 0%, var(--odds-accent-soft) 100%);
  border: 1px solid #e2eee7;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: oddsEditFadeUp 0.3s ease both;
}

.odds-edit-hero-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.odds-edit-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 14px;
  font-size: 20px;
  color: #fff;
  background: var(--odds-accent-ramp);
  border-radius: 12px;
  box-shadow: 0 6px 16px var(--odds-accent-shadow);
  transition: transform 0.25s ease;

  &:hover {
    transform: rotate(-6deg) scale(1.05);
  }
}

.odds-edit-hero-text h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.odds-edit-hero-title-row {
  display: flex;
  align-items: center;
}

.odds-edit-hero-type {
  flex-shrink: 0;
  margin-left: 10px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--odds-accent-dark);
  background: var(--odds-accent-soft);
  border-radius: 999px;
}

.odds-edit-hero-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #7c8b84;
}

.odds-edit-hero-back {
  flex-shrink: 0;
}

.odds-edit-form {
  padding: 0;
  background: none;
  border-radius: 0;
  box-shadow: none;
}

.odds-edit-card {
  padding: 16px 20px 8px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: oddsEditFadeUp 0.3s ease both;

  &:nth-of-type(2) {
    animation-delay: 0.05s;
  }

  &:nth-of-type(3) {
    animation-delay: 0.1s;
  }

  &:nth-of-type(4) {
    animation-delay: 0.15s;
  }
}

.odds-edit-card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.odds-edit-card-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  font-size: 14px;
  color: var(--odds-accent-dark);
  background: var(--odds-accent-soft);
  border-radius: 8px;
}

.odds-edit-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #2b3a36;
}

.odds-edit-card-tip {
  margin-left: 10px;
  padding: 1px 8px;
  font-size: 12px;
  color: #909399;
  background: #f0f4f2;
  border-radius: 999px;
}

.odds-inline-control {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.odds-inline-control .el-select,
.odds-inline-control .el-input {
  flex: 1;
  min-width: 0;
}

.odds-inline-control .el-button,
.odds-inline-control .el-tag {
  flex-shrink: 0;
}

.odds-match-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;

  .el-input {
    flex: 1;
    min-width: 0;
  }

  .el-button {
    flex-shrink: 0;
    margin-left: 0;
  }
}

.odds-create-match-btn {
  padding-right: 4px;
  padding-left: 4px;
}

.odds-association-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.odds-new-match {
  padding: 12px 14px 0;
  margin-top: 2px;
  background: #f6fbf8;
  border: 1px dashed #cbe8d8;
  border-radius: 12px;
}

.odds-new-match-title {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 4px 12px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a36;

  i {
    color: var(--odds-accent-dark);
  }

  small {
    margin-left: auto;
    font-size: 12px;
    font-weight: 400;
    color: #909399;
  }
}

.odds-matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  padding-bottom: 8px;
}

.odds-matrix-item {
  padding: 14px;
  background: #fafffd;
  border: 1px solid #e2eee7;
  border-radius: 12px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 18px rgba(46, 204, 113, 0.1);
  }
}

.odds-matrix-head {
  margin-bottom: 12px;
}

.odds-edit-footer {
  padding: 14px 20px;
  margin-top: 4px;
  text-align: center;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: oddsEditFadeUp 0.3s ease 0.2s both;
}

.odds-panel-enter-active,
.odds-panel-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.odds-panel-enter,
.odds-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes oddsEditFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 767px) {
  .odds-inline-control {
    align-items: stretch;
    flex-direction: column;
  }

  .odds-inline-control .el-button {
    align-self: flex-start;
  }

  .odds-match-picker {
    align-items: stretch;
    flex-wrap: wrap;

    .el-input {
      flex-basis: 100%;
    }
  }

  .odds-new-match-title small {
    display: none;
  }
}
</style>
