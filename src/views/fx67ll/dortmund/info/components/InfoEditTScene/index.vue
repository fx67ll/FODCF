<template>
  <!-- T类型录入场景：赛季 → 球队 → 内容 → 来源和时间窗（绿色赛季风格，进入场景时从父页面初始表单复制出可编辑副本） -->
  <div class="info-edit-scene info-edit-scene-t">
    <!-- 头部横幅：渐变图标 + 类型徽标 + 标题 -->
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
      <el-button type="text" icon="el-icon-back" class="info-edit-hero-back" @click="handleBackToList">返回总览
      </el-button>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="110px" class="info-edit-form"
      v-loading="editLoading">
      <!-- 分区一：归属设置 -->
      <div class="info-edit-card">
        <div class="info-edit-card-header">
          <span class="info-edit-card-chip">
            <i class="el-icon-connection"></i>
          </span>
          <span class="info-edit-card-title">归属设置</span>
          <span class="info-edit-card-tip" v-if="editMode === 'update'">归属创建后不可修改</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属赛季" prop="seasonId">
              <!-- 新增时下拉选择；修改时归属只读展示（已关联赛季可能已被停用，不在正常赛季选项内） -->
              <common-enhanced-select v-if="editMode === 'add'" ref="seasonSelect" v-model="editForm.seasonId"
                valueKey="seasonId" labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" />
              <el-input v-else :value="editForm.seasonName || ('赛季' + editForm.seasonId)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联球队" prop="teamIds">
              <!-- 可选球队只限启用且在数据范围内的球队，不按赛季过滤；修改时保持已有关系不变可不改 -->
              <el-select v-model="editForm.teamIds" style="width: 100%" multiple filterable placeholder="请选择关联球队（可多选）"
                :disabled="editMode !== 'add'">
                <el-option v-for="team in teamOptions" :key="team.teamId" :label="team.teamName" :value="team.teamId" />
              </el-select>
              <!-- 修改时已有关系只读展示，球队集合为空表示保持现有关系不变 -->
              <div class="info-edit-field-hint" v-if="editMode === 'update' && (editForm.teamIds || []).length">
                当前已关联 {{ (editForm.teamIds || []).length }} 支球队，保持现状即可无需改动
              </div>
            </el-form-item>
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
            <el-form-item label="信息点标题" prop="pointTitle">
              <el-input v-model="editForm.pointTitle" :maxlength="1023" placeholder="请输入信息点标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="信息点内容" prop="pointContent">
              <el-input v-model="editForm.pointContent" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                placeholder="请输入客观信息内容" />
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
          <el-col :span="12">
            <el-form-item label="信息来源名称" prop="sourceName">
              <el-input v-model="editForm.sourceName" :maxlength="1023" placeholder="请输入信息来源名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源地址" prop="sourceUrl">
              <el-input v-model="editForm.sourceUrl" :maxlength="1023" placeholder="请输入来源地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源发布时间" prop="sourcePublishTime">
              <el-date-picker clearable v-model="editForm.sourcePublishTime" type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择来源发布时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信息采集时间" prop="collectTime">
              <el-date-picker clearable v-model="editForm.collectTime" type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择信息采集时间">
              </el-date-picker>
              <div class="info-edit-field-hint">信息被采集或录入系统的时间点</div>
            </el-form-item>
          </el-col>
          <!-- 生效/失效时间并排展示，中间“至”连接 -->
          <el-col :span="24">
            <el-form-item label="生效时间窗口" class="info-edit-time-window">
              <div class="info-edit-time-row">
                <el-date-picker clearable v-model="editForm.effectiveStartTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择生效时间（空表示不限制）" />
                <span class="info-edit-time-connector">至</span>
                <el-date-picker clearable v-model="editForm.effectiveEndTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择失效时间（空表示不限制）" />
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
          <el-col :span="12">
            <el-form-item label="是否可公开" prop="allowPublic">
              <el-radio-group v-model="editForm.allowPublic">
                <el-radio v-for="dict in dict.type.fx67ll_dortmund_allow_public" :key="dict.value"
                  :label="dict.value">{{
                    dict.label }}</el-radio>
              </el-radio-group>
              <div class="info-edit-field-hint">控制该信息点内容是否允许进入对外公开文本</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="pointRemark">
              <el-input v-model="editForm.pointRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <!-- 状态只通过启停动作修改，录入与修改表单不出现状态控件 -->
    </el-form>

    <div class="info-edit-footer">
      <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
      <el-button @click="handleBackToList">返回总览</el-button>
    </div>
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "InfoEditTScene",
  dicts: ["fx67ll_dortmund_allow_public"],
  components: { CommonEnhancedSelect },
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
    // 生效时间窗两端都有值时，开始不得晚于结束
    const checkEffectiveTimeWindow = (rule, value, callback) => {
      if (this.editForm.effectiveStartTime && this.editForm.effectiveEndTime
        && this.editForm.effectiveStartTime > this.editForm.effectiveEndTime) {
        callback(new Error("生效时间不得晚于失效时间"));
        return;
      }
      callback();
    };
    return {
      // 录入场景表单参数（创建与修改共用，从父页面初始表单复制）
      editForm: this.buildEditForm(),
      // 录入场景表单校验
      editRules: {
        seasonId: [
          { required: true, message: "所属赛季不能为空", trigger: "change" }
        ],
        teamIds: [
          { required: true, type: "array", min: 1, message: "至少要关联一支球队", trigger: "change" }
        ],
        pointTitle: [
          { required: true, message: "信息点标题不能为空", trigger: "blur" }
        ],
        pointContent: [
          { required: true, message: "信息点内容不能为空", trigger: "blur" }
        ],
        sourceName: [
          { required: true, message: "信息来源名称不能为空", trigger: "blur" }
        ],
        collectTime: [
          { required: true, message: "信息采集时间不能为空", trigger: "blur" }
        ],
        effectiveStartTime: [
          { validator: checkEffectiveTimeWindow, trigger: "blur" }
        ],
        effectiveEndTime: [
          { validator: checkEffectiveTimeWindow, trigger: "blur" }
        ],
      },
      // T类型可选球队选项（只含启用且在数据范围内的球队，不按赛季过滤）
      teamOptions: [],
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    // T类型可选球队选项进入场景即加载（新增选择与修改只读展示共用）
    this.loadTeamOptions();
  },
  methods: {
    // 从父页面传入的初始表单复制出本场景可编辑副本（避免直接改动父页面数据）
    buildEditForm() {
      const initial = this.initialForm || {};
      return {
        infoPointId: initial.infoPointId || null,
        infoPointType: initial.infoPointType || "T",
        seasonId: initial.seasonId || null,
        // 归属只读展示用的冗余字段（不进入提交数据）
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
    // 加载T类型可选球队选项（只取启用球队，与CommonEnhancedSelect数据口径一致）
    loadTeamOptions() {
      listTeam({ pageNum: 1, pageSize: 1023, teamStatus: "0", isNeedSort: "Y" }).then(response => {
        this.teamOptions = response.rows || [];
      });
    },
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
    // 类型字段按场景清理：T不提交matchId
    buildSubmitData() {
      const data = {
        pointTitle: this.editForm.pointTitle,
        pointContent: this.editForm.pointContent,
        sourceName: this.editForm.sourceName,
        sourceUrl: this.editForm.sourceUrl,
        sourcePublishTime: this.editForm.sourcePublishTime,
        collectTime: this.editForm.collectTime,
        effectiveStartTime: this.editForm.effectiveStartTime,
        effectiveEndTime: this.editForm.effectiveEndTime,
        allowPublic: this.editForm.allowPublic,
        pointRemark: this.editForm.pointRemark,
      };
      if (this.editMode === "add") {
        data.infoPointType = "T";
        data.seasonId = this.editForm.seasonId;
        data.teamIds = this.editForm.teamIds || [];
      } else {
        data.infoPointId = this.editForm.infoPointId;
        // 修改时类型与归属只读，球队集合为空表示保持现有关系不变
        data.teamIds = this.editForm.teamIds || [];
      }
      return data;
    },
    /** 提交按钮：校验通过后构建请求体交由父页面提交 */
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
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
/* ===== 录入场景头部横幅（T/M共用结构，色彩随场景主题变量走） ===== */
.info-edit-scene {
  /* 绿色赛季主题默认变量（T场景），M场景覆盖为蓝色比赛主题 */
  --info-accent: #2ecc71;
  --info-accent-dark: #27ad60;
  --info-accent-soft: #e7f8ee;
  --info-accent-ramp: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
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
</style>
