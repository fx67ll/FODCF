<template>
  <!-- T类型录入场景：复用统一信息点表单，宿主负责归属球队选择和提交 -->
  <div class="dortmund-secondary-page info-edit-scene info-edit-scene-t">
    <div class="info-edit-hero">
      <div class="info-edit-hero-left">
        <div class="info-edit-hero-icon">
          <i class="el-icon-trophy"></i>
        </div>
        <div class="info-edit-hero-text">
          <div class="info-edit-hero-title-row">
            <h2>{{ editMode === "add" ? "新增赛季球队信息点" : "修改赛季球队信息点" }}</h2>
            <span class="info-edit-hero-type">T · 赛季球队信息点</span>
          </div>
          <p>绑定赛季与至少一支球队，适用于长期有效的赛季球队类信息</p>
        </div>
      </div>
      <el-button type="text" class="dortmund-theme-text info-edit-hero-back" icon="el-icon-back"
        @click="handleBackToList">返回总览</el-button>
    </div>

    <dortmund-info-point-form ref="infoForm" :form="editForm" :mode="editMode" show-season show-teams show-advanced
      lock-teams-on-edit :selected-teams="selectedTeams" :loading="editLoading"
      @select-teams="teamSelectorVisible = true" />

    <div class="info-edit-footer">
      <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="submitEditForm">保
        存</el-button>
      <el-button class="dortmund-theme-cancel" @click="handleBackToList">返回总览</el-button>
    </div>

    <dortmund-team-selector-modal :visible.sync="teamSelectorVisible" multiple :selected-items="selectedTeams"
      @confirm="handleTeamSelectorConfirm" />
  </div>
</template>

<script>
import DortmundInfoPointForm from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointForm/index";
import DortmundTeamSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundTeamSelectorModal/index";

export default {
  name: "InfoEditTScene",
  components: { DortmundInfoPointForm, DortmundTeamSelectorModal },
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
      editForm: this.buildEditForm(),
      selectedTeams: this.buildSelectedTeams(),
      teamSelectorVisible: false,
    };
  },
  watch: {
    initialForm: {
      deep: true,
      immediate: true,
      handler() {
        this.editForm = this.buildEditForm();
        this.selectedTeams = this.buildSelectedTeams();
      },
    },
  },
  methods: {
    // 从父页面传入的初始表单复制出本场景可编辑副本（避免直接改动父页面数据）
    buildEditForm() {
      const initial = this.initialForm || {};
      return {
        infoPointId: initial.infoPointId || null,
        infoPointType: initial.infoPointType || "T",
        seasonId: initial.seasonId || null,
        seasonName: initial.seasonName || null,
        teamIds: [...(initial.teamIds || [])],
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
      };
    },
    buildSelectedTeams() {
      const rels = (this.initialForm && this.initialForm.teamRels) || [];
      return rels.filter((rel) => rel.relationStatus === "0").map((rel) => ({
        teamId: rel.teamId,
        teamName: rel.teamName || `球队 ${rel.teamId}`,
      }));
    },
    handleTeamSelectorConfirm(teams) {
      this.selectedTeams = teams || [];
      this.editForm.teamIds = this.selectedTeams.map((team) => team.teamId);
    },
    handleBackToList() {
      this.$emit("back");
    },
    // 新增提交完整归属；修改只提交信息内容和已有球队集合，类型与赛季保持只读
    buildSubmitData() {
      const data = this.$refs.infoForm.getSubmitData();
      if (this.editMode === "add") {
        return {
          ...data,
          infoPointType: "T",
          seasonId: this.editForm.seasonId,
          teamIds: this.editForm.teamIds || [],
        };
      }
      return {
        infoPointId: data.infoPointId,
        teamIds: data.teamIds,
        pointTitle: data.pointTitle,
        pointContent: data.pointContent,
        sourceName: data.sourceName,
        sourceUrl: data.sourceUrl,
        sourcePublishTime: data.sourcePublishTime,
        collectTime: data.collectTime,
        effectiveStartTime: data.effectiveStartTime,
        effectiveEndTime: data.effectiveEndTime,
        allowPublic: data.allowPublic,
        pointRemark: data.pointRemark,
      };
    },
    submitEditForm() {
      this.$refs.infoForm.validate().then((valid) => {
        if (!valid) {
          return;
        }
        this.$emit("save", this.buildSubmitData());
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.info-edit-scene {
  --info-accent: #2ecc71;
  --info-accent-dark: #27ad60;
  --info-accent-soft: #e7f8ee;
  --info-accent-ramp: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
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
  color: #fff;
  font-size: 20px;
  background: var(--info-accent-ramp);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.3);
  transition: transform 0.25s ease;

  &:hover {
    transform: rotate(-6deg) scale(1.05);
  }
}

.info-edit-hero-text h2 {
  margin: 0;
  color: #2b3a36;
  font-size: 16px;
  font-weight: 700;
}

.info-edit-hero-title-row {
  display: flex;
  align-items: center;
}

.info-edit-hero-type {
  flex-shrink: 0;
  padding: 2px 10px;
  margin-left: 10px;
  color: var(--info-accent-dark);
  font-size: 12px;
  font-weight: 600;
  background: var(--info-accent-soft);
  border-radius: 999px;
}

.info-edit-hero-text p {
  margin: 4px 0 0;
  color: #7c8b84;
  font-size: 12px;
}

.info-edit-hero-back {
  flex-shrink: 0;
}

.info-edit-footer {
  padding: 14px 20px;
  margin-top: 4px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: infoEditFadeUp 0.3s ease 0.2s both;
}

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

@media (max-width: 767px) {
  .info-edit-hero {
    align-items: flex-start;
    padding: 14px;
  }

  .info-edit-hero-type {
    display: none;
  }
}
</style>
