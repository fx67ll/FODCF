<template>
  <!-- M类型录入场景：先定比赛，再写内容和来源（蓝色比赛风格，进入场景时从父页面初始表单复制出可编辑副本） -->
  <div class="dortmund-secondary-page info-edit-scene info-edit-scene-m">
    <!-- 头部横幅：渐变图标 + 类型徽标 + 标题 -->
    <div class="info-edit-hero">
      <div class="info-edit-hero-left">
        <div class="info-edit-hero-icon">
          <i class="el-icon-football"></i>
        </div>
        <div class="info-edit-hero-text">
          <div class="info-edit-hero-title-row">
            <h2>{{ editMode === "add" ? "新增比赛临时信息点" : "修改比赛临时信息点" }}</h2>
            <span class="info-edit-hero-type">M · 比赛临时信息点</span>
          </div>
          <p>绑定单场比赛，适用于围绕该场比赛的临时性信息</p>
        </div>
      </div>
      <el-button type="text" class="dortmund-theme-text info-edit-hero-back" icon="el-icon-back"
        @click="handleBackToList">返回总览
      </el-button>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="130px" class="info-edit-form"
      v-loading="editLoading">
      <!-- 分区一：归属设置（比赛VS横幅 + 比赛选择） -->
      <div class="info-edit-card">
        <div class="info-edit-card-header">
          <span class="info-edit-card-chip">
            <i class="el-icon-connection"></i>
          </span>
          <span class="info-edit-card-title">归属设置</span>
          <span class="info-edit-card-tip" v-if="editMode === 'update'">归属创建后不可修改</span>
        </div>
        <!-- 比赛VS横幅：选中或已有比赛的对阵实时展示 -->
        <div class="info-edit-vs-banner" v-if="matchBannerVisible">
          <div class="info-edit-vs-teams">
            <span class="info-edit-vs-team">{{ matchBannerText.homeText }}</span>
            <span class="info-edit-vs-badge">VS</span>
            <span class="info-edit-vs-team">{{ matchBannerText.awayText }}</span>
          </div>
          <div class="info-edit-vs-time" v-if="matchBannerText.matchTimeText">
            {{ matchBannerText.matchTimeText }}
          </div>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="关联比赛" prop="matchId" v-if="editMode === 'add' && !newMatchVisible">
              <dortmund-binding-control :display-text="formatMatchVsTimeText(selectedMatchRow)" show-create
                @select="matchSelectorVisible = true" @create="toggleNewMatch" />
              <div class="info-edit-field-hint">可选择已有比赛，或在当前信息点中同步新建一场比赛</div>
            </el-form-item>
            <el-form-item label="关联比赛" v-else-if="editMode === 'add' && newMatchVisible">
              <div class="info-new-match-control">
                <el-tag type="success" size="small"><i class="el-icon-plus"></i> 当场新建比赛</el-tag>
                <el-button type="text" class="dortmund-theme-text" icon="el-icon-close"
                  @click="toggleNewMatch">改选已有比赛</el-button>
              </div>
            </el-form-item>
            <el-form-item label="关联比赛" v-else>
              <el-input :value="formatMatchColumnText(editForm)" disabled />
            </el-form-item>
            <transition name="info-panel">
              <dortmund-inline-match-create v-if="editMode === 'add' && newMatchVisible" :form="editForm.newMatch" />
            </transition>
          </el-col>
        </el-row>
      </div>

      <!-- 分区二：信息内容 -->
      <div class="info-edit-card">
        <div class="info-edit-card-header">
          <span class="info-edit-card-chip">
            <i class="el-icon-document"></i>
          </span>
          <span class="info-edit-card-title">信息内容</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item prop="pointTitle">
              <template slot="label">
                <dortmund-form-label label="信息点标题" tip="必填；1-233个字符" />
              </template>
              <el-input v-model="editForm.pointTitle" :maxlength="limits.infoTitle" show-word-limit
                placeholder="请输入信息点标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="pointContent">
              <template slot="label">
                <dortmund-form-label label="信息点内容" tip="必填；当前界面与后端业务限制为最多1023个字符" />
              </template>
              <el-input v-model="editForm.pointContent" type="textarea" :rows="4" :maxlength="limits.infoContent"
                show-word-limit placeholder="请输入客观信息内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 分区三：来源与时间 -->
      <div class="info-edit-card">
        <div class="info-edit-card-header">
          <span class="info-edit-card-chip">
            <i class="el-icon-time"></i>
          </span>
          <span class="info-edit-card-title">来源与时间</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item prop="sourceName">
              <template slot="label">
                <dortmund-form-label label="信息来源名称" tip="必填；1-233个字符" />
              </template>
              <el-input v-model="editForm.sourceName" :maxlength="limits.infoSourceName" show-word-limit
                placeholder="请输入信息来源名称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="sourceUrl">
              <template slot="label">
                <dortmund-form-label label="信息来源地址" tip="选填；最多1023个字符，建议填写完整URL" />
              </template>
              <el-input v-model="editForm.sourceUrl" :maxlength="limits.infoSourceUrl" show-word-limit
                placeholder="请输入信息来源地址" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="sourcePublishTime">
              <template slot="label">
                <dortmund-form-label label="来源发布时间" tip="选填；格式yyyy-MM-dd HH:mm:ss" />
              </template>
              <el-date-picker clearable v-model="editForm.sourcePublishTime" type="datetime"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
                placeholder="请选择来源发布时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="collectTime">
              <template slot="label">
                <dortmund-form-label label="信息采集时间" tip="必填；格式yyyy-MM-dd HH:mm:ss" />
              </template>
              <el-date-picker clearable v-model="editForm.collectTime" type="datetime"
                popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
                placeholder="请选择信息采集时间">
              </el-date-picker>
              <div class="info-edit-field-hint">信息被采集或录入系统的时间点</div>
            </el-form-item>
          </el-col>
          <!-- 生效/失效时间并排展示，中间“至”连接 -->
          <el-col :span="24">
            <el-form-item class="info-edit-time-window">
              <template slot="label">
                <dortmund-form-label label="生效时间窗口" tip="两端均可为空；填写时开始时间不得晚于结束时间" />
              </template>
              <div class="info-edit-time-row">
                <el-date-picker clearable v-model="editForm.effectiveStartTime" type="datetime"
                  popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
                  placeholder="请选择生效时间（空表示不限制）" />
                <span class="info-edit-time-connector">至</span>
                <el-date-picker clearable v-model="editForm.effectiveEndTime" type="datetime"
                  popper-class="dortmund-theme-popper" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%"
                  placeholder="请选择失效时间（空表示不限制）" />
              </div>
              <div class="info-edit-field-hint">留空表示不限制；两者都填时，生效时间不得晚于失效时间</div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 分区四：附加设置 -->
      <div class="info-edit-card">
        <div class="info-edit-card-header">
          <span class="info-edit-card-chip">
            <i class="el-icon-setting"></i>
          </span>
          <span class="info-edit-card-title">附加设置</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item prop="allowPublic">
              <template slot="label">
                <dortmund-form-label label="是否可公开" tip="必填；0=不可公开，1=可公开" />
              </template>
              <el-radio-group v-model="editForm.allowPublic">
                <el-radio v-for="dict in dict.type.fx67ll_dortmund_allow_public" :key="dict.value"
                  :label="dict.value">{{
                    dict.label }}</el-radio>
              </el-radio-group>
              <div class="info-edit-field-hint">控制该信息点内容是否允许进入对外公开文本</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="pointRemark">
              <template slot="label">
                <dortmund-form-label label="备注" tip="选填；最多1023个字符" />
              </template>
              <el-input v-model="editForm.pointRemark" type="textarea" :rows="2" :maxlength="limits.infoRemark"
                show-word-limit placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <div class="info-edit-footer">
      <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="submitEditForm">保
        存</el-button>
      <el-button class="dortmund-theme-cancel" @click="handleBackToList">返回总览</el-button>
    </div>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible"
      :selected-items="selectedMatchRow && selectedMatchRow.matchId ? [selectedMatchRow] : []"
      @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundBindingControl from "@/views/fx67ll/dortmund/other/component/DortmundBindingControl/index";
import DortmundInlineMatchCreate from "@/views/fx67ll/dortmund/other/component/DortmundInlineMatchCreate/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import {
  DORTMUND_LIMITS,
  DORTMUND_MATCH_RESULT_OPTIONS,
  DORTMUND_STATUS_OPTIONS,
  dateRangeRule,
  enumRule,
  optionalTextRule,
  requiredTextRule,
  trimText,
} from "@/views/fx67ll/dortmund/other/utils/validation";

export default {
  name: "InfoEditMScene",
  dicts: ["fx67ll_dortmund_allow_public"],
  components: {
    DortmundFormLabel, DortmundMatchSelectorModal, DortmundBindingControl, DortmundInlineMatchCreate
  },
  props: {
    // 录入场景模式（add新增 update修改）
    editMode: {
      type: String,
      default: "add",
    },
    // 进入场景时的初始表单（父页面构建，本场景复制出可编辑副本）
    initialForm: {
      type: Object,
      default: () => ({}),
    },
    // 录入场景表单遮罩层
    editLoading: {
      type: Boolean,
      default: false,
    },
    // 录入场景提交中状态
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 录入场景表单参数（创建与修改共用，从父页面初始表单复制）
      editForm: this.buildEditForm(),
      newMatchVisible: false,
      // 录入场景表单校验
      editRules: {
        matchId: [
          {
            validator: (rule, value, callback) => {
              if (this.newMatchVisible || (value != null && value !== "")) {
                callback();
                return;
              }
              callback(new Error("请选择关联比赛或当场新建比赛"));
            },
            trigger: "change",
          }
        ],
        pointTitle: [requiredTextRule("信息点标题", DORTMUND_LIMITS.infoTitle)],
        pointContent: [requiredTextRule("信息点内容", DORTMUND_LIMITS.infoContent)],
        sourceName: [requiredTextRule("信息来源名称", DORTMUND_LIMITS.infoSourceName)],
        sourceUrl: [optionalTextRule("信息来源地址", DORTMUND_LIMITS.infoSourceUrl)],
        pointRemark: [optionalTextRule("备注", DORTMUND_LIMITS.infoRemark)],
        allowPublic: [enumRule("是否可公开", DORTMUND_STATUS_OPTIONS, true)],
        collectTime: [
          { required: true, message: "信息采集时间不能为空", trigger: "change" }
        ],
        effectiveStartTime: [dateRangeRule("生效时间", () => this.editForm.effectiveStartTime,
          () => this.editForm.effectiveEndTime)],
        effectiveEndTime: [dateRangeRule("生效时间", () => this.editForm.effectiveStartTime,
          () => this.editForm.effectiveEndTime)],
        "newMatch.matchCode": [requiredTextRule("新比赛编码", DORTMUND_LIMITS.matchCode)],
        "newMatch.seasonId": [{ required: true, message: "新比赛所属赛季不能为空", trigger: "change" }],
        "newMatch.homeTeamId": [{ required: true, message: "新比赛主队不能为空", trigger: "change" }],
        "newMatch.awayTeamId": [{ required: true, message: "新比赛客队不能为空", trigger: "change" }],
        "newMatch.matchTime": [{ required: true, message: "新比赛比赛时间不能为空", trigger: "change" }],
        "newMatch.matchStatus": [enumRule("新比赛状态", DORTMUND_STATUS_OPTIONS, true)],
        "newMatch.matchVenue": [optionalTextRule("新球队主场", DORTMUND_LIMITS.matchVenue)],
        "newMatch.matchResult": [enumRule("新比赛结果", DORTMUND_MATCH_RESULT_OPTIONS, false)],
        "newMatch.matchRemark": [optionalTextRule("新比赛备注", DORTMUND_LIMITS.matchRemark)],
      },
      // M类型新增时所选比赛的完整行（VS横幅展示用，仅编辑场景展示不进入提交数据）
      selectedMatchRow: this.buildSelectedMatch(),
      matchSelectorVisible: false,
    };
  },
  computed: {
    limits() {
      return DORTMUND_LIMITS;
    },
    // VS横幅是否展示（修改时有归属即展示，新增时选中比赛后展示）
    matchBannerVisible() {
      return !!this.editForm.matchId;
    },
    // VS横幅文案（修改取详情字段，新增取所选比赛行，取不到时兜底占位）
    matchBannerText() {
      const detail = this.editForm || {};
      let homeText = detail.homeTeamName;
      let awayText = detail.awayTeamName;
      let matchTime = detail.matchTime;
      const selected = this.selectedMatchRow || {};
      if (this.editMode === "add") {
        homeText = selected.homeTeamName;
        awayText = selected.awayTeamName;
        matchTime = selected.matchTime;
      }
      const homeResult = homeText || (detail.matchId || selected.matchId ? "主队" : "");
      const awayResult = awayText || (detail.matchId || selected.matchId ? "客队" : "");
      return {
        homeText: homeResult,
        awayText: awayResult,
        matchTimeText: this.parseTime(matchTime, "{y}-{m}-{d} {h}:{i}:{s}") || "",
      };
    },
  },
  methods: {
    buildSelectedMatch() {
      const initial = this.initialForm || {};
      return initial.matchId ? {
        matchId: initial.matchId,
        matchCode: initial.matchCode,
        matchSummary: initial.matchSummary,
        homeTeamName: initial.homeTeamName,
        awayTeamName: initial.awayTeamName,
        matchTime: initial.matchTime,
      } : {};
    },
    // 从父页面传入的初始表单复制出本场景可编辑副本（避免直接改动父页面数据）
    buildEditForm() {
      const initial = this.initialForm || {};
      return {
        infoPointId: initial.infoPointId || null,
        infoPointType: initial.infoPointType || "M",
        matchId: initial.matchId || null,
        // 归属只读展示用的冗余字段（不进入提交数据）
        matchTime: initial.matchTime || null,
        homeTeamName: initial.homeTeamName || null,
        awayTeamName: initial.awayTeamName || null,
        pointTitle: initial.pointTitle || null,
        pointContent: initial.pointContent || null,
        sourceName: initial.sourceName || null,
        sourceUrl: initial.sourceUrl || null,
        sourcePublishTime: initial.sourcePublishTime || null,
        collectTime: initial.collectTime || null,
        effectiveStartTime: initial.effectiveStartTime || null,
        effectiveEndTime: initial.effectiveEndTime || null,
        allowPublic: initial.allowPublic || "0",
        pointRemark: initial.pointRemark || null,
        newMatch: {
          matchCode: null,
          seasonId: null,
          homeTeamId: null,
          awayTeamId: null,
          matchTime: null,
          matchVenue: null,
          matchStatus: "0",
          matchResult: null,
          matchRemark: null,
        },
      };
    },
    handleMatchSelectorConfirm(match) {
      this.selectedMatchRow = match || {};
      this.editForm.matchId = match ? match.matchId : null;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate("matchId");
      });
    },
    toggleNewMatch() {
      this.newMatchVisible = !this.newMatchVisible;
      if (this.newMatchVisible) {
        this.selectedMatchRow = {};
        this.editForm.matchId = null;
      }
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate(["matchId"]);
      });
    },
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      if (!match || !match.matchId) {
        return "";
      }
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}");
      const vsText = [match.homeTeamName, match.awayTeamName].filter(Boolean).join(" vs ");
      const matchText = vsText || match.matchSummary || match.matchCode || `比赛 ${match.matchId}`;
      return matchTime ? `${matchText}（${matchTime}）` : matchText;
    },
    // 比赛列展示文案：主队 vs 客队 + 开赛时间
    formatMatchColumnText(row) {
      if (row.infoPointType !== "M" || !row.matchId) {
        return "";
      }
      return this.formatMatchVsTimeText(row);
    },
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
    // 类型字段按场景清理：M不提交seasonId和teamIds
    buildSubmitData() {
      const data = {
        pointTitle: trimText(this.editForm.pointTitle),
        pointContent: trimText(this.editForm.pointContent),
        sourceName: trimText(this.editForm.sourceName),
        sourceUrl: trimText(this.editForm.sourceUrl),
        sourcePublishTime: this.editForm.sourcePublishTime,
        collectTime: this.editForm.collectTime,
        effectiveStartTime: this.editForm.effectiveStartTime,
        effectiveEndTime: this.editForm.effectiveEndTime,
        allowPublic: this.editForm.allowPublic,
        pointRemark: trimText(this.editForm.pointRemark),
      };
      if (this.editMode === "add") {
        data.infoPointType = "M";
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
      } else {
        data.infoPointId = this.editForm.infoPointId;
      }
      return data;
    },
    /** 提交按钮：校验通过后构建请求体交由父页面提交 */
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        if (this.newMatchVisible && this.editForm.newMatch.homeTeamId != null && this.editForm.newMatch.awayTeamId != null
          && String(this.editForm.newMatch.homeTeamId) === String(this.editForm.newMatch.awayTeamId)) {
          this.$modal.msgError("新比赛的主队和客队不能相同");
          return;
        }
        this.$emit("save", this.buildSubmitData());
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* ===== 录入场景头部横幅（T/M共用结构，色彩随场景主题变量走） ===== */
.info-edit-scene {
  /* 绿色赛季主题默认变量（T场景），M场景覆盖为蓝色比赛主题 */
  --info-accent: #2ecc71;
  --info-accent-dark: #27ad60;
  --info-accent-soft: #e7f8ee;
  --info-accent-ramp: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  --info-accent-shadow: rgba(46, 204, 113, 0.3);
}

.info-edit-scene-m {
  --info-accent: var(--current-color, #2ecc71);
  --info-accent-dark: var(--current-color, #27ad60);
  --info-accent-soft: #e7f8ee;
  --info-accent-ramp: linear-gradient(135deg, var(--current-color, #2ecc71) 0%, #27ad60 100%);
  --info-accent-shadow: rgba(46, 204, 113, 0.3);
}

.info-edit-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: linear-gradient(135deg, #ffffff 0%, var(--info-accent-soft) 100%);
  border: 1px solid #e2eee7;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: infoEditFadeUp 0.3s ease both;
}

.info-edit-hero-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.info-edit-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 14px;
  font-size: 20px;
  color: #fff;
  background: var(--info-accent-ramp);
  border-radius: 12px;
  box-shadow: 0 6px 16px var(--info-accent-shadow);
  transition: transform 0.25s ease;

  &:hover {
    transform: rotate(-6deg) scale(1.05);
  }
}

.info-edit-hero-text h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.info-edit-hero-title-row {
  display: flex;
  align-items: center;
}

.info-edit-hero-type {
  flex-shrink: 0;
  margin-left: 10px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--info-accent-dark);
  background: var(--info-accent-soft);
  border-radius: 999px;
}

.info-edit-hero-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #7c8b84;
}

.info-edit-hero-back {
  flex-shrink: 0;
}

/* ===== 录入场景分区卡片（错落入场） ===== */
.info-edit-form {
  padding: 0;
  background: none;
  border-radius: 0;
  box-shadow: none;
}

.info-edit-card {
  margin-bottom: 16px;
  padding: 16px 20px 8px;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: infoEditFadeUp 0.3s ease both;

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

.info-edit-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.info-edit-card-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  font-size: 14px;
  color: var(--info-accent-dark);
  background: var(--info-accent-soft);
  border-radius: 8px;
}

.info-edit-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #2b3a36;
}

.info-edit-card-tip {
  margin-left: 10px;
  padding: 1px 8px;
  font-size: 12px;
  color: #909399;
  background: #f0f4f2;
  border-radius: 999px;
}

/* 字段级提示行 */
.info-edit-field-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.info-new-match-control {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  .el-button,
  .el-tag {
    flex-shrink: 0;
  }
}

.info-new-match {
  padding: 12px 14px 0;
  margin-top: 2px;
  background: #f6fbf8;
  border: 1px dashed #cbe8d8;
  border-radius: 12px;
}

.info-new-match-title {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 4px 12px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a36;

  i {
    color: var(--info-accent-dark);
  }

  small {
    margin-left: auto;
    font-size: 12px;
    font-weight: 400;
    color: #909399;
  }
}

.info-panel-enter-active,
.info-panel-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.info-panel-enter,
.info-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 生效时间窗并排布局 */
.info-edit-time-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.info-edit-time-connector {
  flex-shrink: 0;
  margin: 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--info-accent-dark);
}

/* ===== M场景比赛VS横幅 ===== */
.info-edit-vs-banner {
  padding: 14px 18px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #ffffff 0%, var(--info-accent-soft) 100%);
  border: 1px solid #dce8f0;
  border-radius: 12px;
  animation: infoEditFadeUp 0.3s ease both;
}

.info-edit-vs-teams {
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-edit-vs-team {
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  color: #2b3a36;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-edit-vs-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  margin: 0 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--info-accent-dark);
  background: var(--info-accent-soft);
  border: 1px solid #cbe8d8;
  border-radius: 50%;
  animation: infoVsPulse 1.8s ease infinite;
}

.info-edit-vs-time {
  margin-top: 6px;
  font-size: 12px;
  color: #7c8b84;
  text-align: center;
}

/* 录入场景进入动画 */
@keyframes infoEditFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* VS徽标呼吸动效 */
@keyframes infoVsPulse {

  0%,
  100% {
    box-shadow: 0 4px 10px rgba(90, 125, 154, 0.15);
  }

  50% {
    box-shadow: 0 4px 14px rgba(90, 125, 154, 0.4);
  }
}

/* 录入场景底部按钮 */
.info-edit-footer {
  margin-top: 4px;
  padding: 14px 20px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: infoEditFadeUp 0.3s ease 0.2s both;
}

@media (max-width: 767px) {
  .info-new-match-control {
    align-items: stretch;
    flex-direction: column;
  }

  .info-new-match-title small {
    display: none;
  }

  .info-edit-hero {
    align-items: flex-start;
    padding: 14px;
  }

  .info-edit-hero-type,
  .info-edit-card-tip {
    display: none;
  }

  .info-edit-card {
    padding: 14px 12px 6px;
  }

}
</style>
