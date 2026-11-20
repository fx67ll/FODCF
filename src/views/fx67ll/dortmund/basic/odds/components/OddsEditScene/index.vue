<template>
  <div class="dortmund-secondary-page odds-edit-scene">
    <div class="odds-edit-hero">
      <div class="odds-edit-hero-left">
        <div class="odds-edit-hero-icon">
          <i class="el-icon-data-analysis"></i>
        </div>
        <div class="odds-edit-hero-text">
          <div class="odds-edit-hero-title-row">
            <h2>{{ heroTitle }}</h2>
            <span class="odds-edit-hero-type">Odds · 倍率版本</span>
          </div>
          <p>{{ heroDescription }}</p>
        </div>
      </div>
      <el-button type="text" class="dortmund-theme-text odds-edit-hero-back" icon="el-icon-back"
        @click="handleBackToList">返回总览
      </el-button>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="120px" class="odds-edit-form"
      v-loading="editLoading">
      <dortmund-odds-form :form="editForm">

        <div class="odds-edit-card">
          <div class="odds-edit-card-header">
            <span class="odds-edit-card-chip"><i class="el-icon-connection"></i></span>
            <span class="odds-edit-card-title">归属设置</span>
            <span class="odds-edit-card-tip" v-if="editMode !== 'add'">{{ associationTip }}</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="关联比赛" prop="matchId" v-if="editMode === 'add' && !newMatchVisible">
                <dortmund-binding-control :display-text="formatSelectedMatch(selectedMatch)" show-create
                  @select="matchSelectorVisible = true" @create="toggleNewMatch" />
                <div class="odds-association-hint">可选择已有比赛，或在当前倍率记录中同步新建一场比赛</div>
              </el-form-item>
              <el-form-item label="关联比赛" prop="matchId" v-else-if="editMode === 'add' && newMatchVisible">
                <div class="odds-inline-control">
                  <el-tag type="success" size="small"><i class="el-icon-plus"></i> 当场新建比赛</el-tag>
                  <el-button type="text" class="dortmund-theme-text" icon="el-icon-close"
                    @click="toggleNewMatch">改选已有比赛</el-button>
                </div>
              </el-form-item>
              <el-form-item label="关联比赛" v-else>
                <el-input :value="formatSelectedMatch(editForm)" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <transition name="odds-panel">
            <dortmund-inline-match-create v-if="editMode === 'add' && newMatchVisible" :form="editForm.newMatch" />
          </transition>
        </div>

      </dortmund-odds-form>
    </el-form>

    <div class="odds-edit-footer">
      <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="submitForm">保 存</el-button>
      <el-button class="dortmund-theme-cancel" @click="handleBackToList">返回总览</el-button>
    </div>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible"
      :selected-items="selectedMatchItem ? [selectedMatchItem] : []" @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundBindingControl from "@/views/fx67ll/dortmund/other/component/DortmundBindingControl/index";
import DortmundInlineMatchCreate from "@/views/fx67ll/dortmund/other/component/DortmundInlineMatchCreate/index";
import DortmundOddsForm from "@/views/fx67ll/dortmund/other/component/DortmundOddsForm/index";
import { buildOddsRules, trimOddsFields } from "@/views/fx67ll/dortmund/other/utils/odds";
import {
  DORTMUND_LIMITS,
  DORTMUND_MATCH_RESULT_OPTIONS,
  DORTMUND_STATUS_OPTIONS,
  enumRule,
  optionalTextRule,
  requiredTextRule,
  trimText,
} from "@/views/fx67ll/dortmund/other/utils/validation";

export default {
  name: "OddsEditScene",
  dicts: ["fx67ll_dortmund_odds_type"],
  components: {
    DortmundMatchSelectorModal,
    DortmundBindingControl,
    DortmundInlineMatchCreate,
    DortmundOddsForm,
  },
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
    return {
      selectedMatch: null,
      matchSelectorVisible: false,
      editForm: this.buildEditForm(),
      newMatchVisible: false,
      editRules: {
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
        "newMatch.matchCode": [requiredTextRule("新比赛编码", DORTMUND_LIMITS.matchCode)],
        "newMatch.seasonId": [{ required: true, message: "新比赛所属赛季不能为空", trigger: "change" }],
        "newMatch.homeTeamId": [{ required: true, message: "新比赛主队不能为空", trigger: "change" }],
        "newMatch.awayTeamId": [{ required: true, message: "新比赛客队不能为空", trigger: "change" }],
        "newMatch.matchTime": [{ required: true, message: "新比赛比赛时间不能为空", trigger: "change" }],
        "newMatch.matchStatus": [enumRule("新比赛状态", DORTMUND_STATUS_OPTIONS, true)],
        "newMatch.matchVenue": [optionalTextRule("新球队主场", DORTMUND_LIMITS.matchVenue)],
        "newMatch.matchResult": [enumRule("新比赛结果", DORTMUND_MATCH_RESULT_OPTIONS, false)],
        "newMatch.matchRemark": [optionalTextRule("新比赛备注", DORTMUND_LIMITS.matchRemark)],
        ...buildOddsRules(),
      },
    };
  },
  computed: {
    selectedMatchItem() {
      return this.editMode === "add" ? this.selectedMatch : this.editForm;
    },
    heroTitle() {
      if (this.editMode === "copy") {
        return "基于当前版本新建";
      }
      return this.editMode === "add" ? "新增倍率记录" : "修改倍率记录";
    },
    heroDescription() {
      if (this.editMode === "copy") {
        return "已复制原版本的比赛归属、六类倍率与手工权重；保存后形成新的当前有效版本";
      }
      return "维护比赛六类倍率与手工权重，保存后可单独设为有效版本";
    },
    associationTip() {
      return this.editMode === "copy" ? "新版本沿用原比赛归属，原版本保留为历史记录" : "修改时保留原有比赛归属";
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
        oddsId: this.editMode === "copy" ? null : (initial.oddsId || null),
        oddsCode: initial.oddsCode || null,
        matchId: initial.matchId || null,
        matchSummary: initial.matchSummary || null,
        matchCode: initial.matchCode || null,
        sourceTime: initial.sourceTime || null,
        handicapValue: initial.handicapValue === undefined || initial.handicapValue === null
          ? null
          : initial.handicapValue,
        homeWinOdds: initial.homeWinOdds || null,
        drawOdds: initial.drawOdds || null,
        awayWinOdds: initial.awayWinOdds || null,
        handicapHomeWinOdds: initial.handicapHomeWinOdds || null,
        handicapDrawOdds: initial.handicapDrawOdds || null,
        handicapAwayWinOdds: initial.handicapAwayWinOdds || null,
        homeWinWeight: initial.homeWinWeight === undefined ? null : initial.homeWinWeight,
        drawWeight: initial.drawWeight === undefined ? null : initial.drawWeight,
        awayWinWeight: initial.awayWinWeight === undefined ? null : initial.awayWinWeight,
        handicapHomeWinWeight: initial.handicapHomeWinWeight === undefined ? null : initial.handicapHomeWinWeight,
        handicapDrawWeight: initial.handicapDrawWeight === undefined ? null : initial.handicapDrawWeight,
        handicapAwayWinWeight: initial.handicapAwayWinWeight === undefined ? null : initial.handicapAwayWinWeight,
        oddsRemark: initial.oddsRemark || null,
        newMatch: {
          matchCode: newMatch.matchCode || null,
          seasonId: newMatch.seasonId || null,
          homeTeamId: newMatch.homeTeamId || null,
          awayTeamId: newMatch.awayTeamId || null,
          matchTime: newMatch.matchTime || null,
          matchVenue: newMatch.matchVenue || null,
          matchStatus: newMatch.matchStatus || "0",
          matchResult: newMatch.matchResult || null,
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
        matchCode: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchStatus: "0",
        matchResult: null,
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
        if (this.newMatchVisible && this.editForm.newMatch.homeTeamId != null && this.editForm.newMatch.awayTeamId != null
          && String(this.editForm.newMatch.homeTeamId) === String(this.editForm.newMatch.awayTeamId)) {
          this.$modal.msgError("新比赛的主队和客队不能相同");
          return;
        }
        const data = trimOddsFields(this.editForm);
        if (this.editMode === "add" || this.editMode === "copy") {
          if (this.newMatchVisible) {
            data.newMatch = {
              matchCode: trimText(this.editForm.newMatch.matchCode),
              seasonId: this.editForm.newMatch.seasonId,
              homeTeamId: this.editForm.newMatch.homeTeamId,
              awayTeamId: this.editForm.newMatch.awayTeamId,
              matchTime: this.editForm.newMatch.matchTime,
              matchVenue: trimText(this.editForm.newMatch.matchVenue),
              matchStatus: this.editForm.newMatch.matchStatus,
              matchResult: trimText(this.editForm.newMatch.matchResult),
              matchRemark: trimText(this.editForm.newMatch.matchRemark),
            };
          } else {
            data.matchId = this.editForm.matchId;
          }
          if (this.editMode === "copy") {
            data.activeFlag = "Y";
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

  .odds-new-match-title small {
    display: none;
  }
}
</style>
