<template>
  <!-- 方案计划编写场景（创建/修改共用整页，进入场景时从父页面初始表单复制出可编辑副本） -->
  <div class="plan-edit-scene">
    <!-- 头部横幅：渐变图标 + 标题 + 副标题 -->
    <div class="plan-edit-hero">
      <div class="plan-edit-hero-left">
        <div class="plan-edit-hero-icon">
          <i class="el-icon-notebook-2"></i>
        </div>
        <div class="plan-edit-hero-text">
          <h2>{{ editMode === "add" ? "编写方案计划" : "修改方案计划" }}</h2>
          <p>填写正文与金额后关联比赛，至少关联一场，可当场新建比赛一并保存</p>
        </div>
      </div>
      <el-button type="text" icon="el-icon-back" class="plan-edit-hero-back" @click="handleBackToList">返回总览
      </el-button>
    </div>

    <div class="plan-edit-body">
      <!-- 左侧：表单主区 -->
      <div class="plan-edit-main">
        <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="90px" class="plan-edit-form"
          v-loading="editLoading">
          <!-- 分区一：方案内容 -->
          <div class="plan-edit-card">
            <div class="plan-edit-card-header">
              <span class="plan-edit-card-chip">
                <i class="el-icon-edit-outline"></i>
              </span>
              <span class="plan-edit-card-title">方案内容</span>
            </div>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="方案计划" prop="planContent">
                  <el-input v-model="editForm.planContent" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                    placeholder="请输入方案计划" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="录入倍率" prop="planRate">
                  <el-input v-model="editForm.planRate" placeholder="请输入录入倍率（可空，有值时必须大于0）" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="录入金额" prop="planAmount">
                  <el-input v-model="editForm.planAmount" placeholder="请输入录入金额（可空，有值时必须大于等于0）" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="其他说明" prop="planRemark">
                  <el-input v-model="editForm.planRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                    placeholder="请输入其他说明" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 分区二：关联比赛 -->
          <div class="plan-edit-card">
            <div class="plan-edit-card-header">
              <span class="plan-edit-card-chip">
                <i class="el-icon-football"></i>
              </span>
              <span class="plan-edit-card-title">关联比赛</span>
              <span class="plan-edit-card-count" :class="{ ok: previewMatchCount > 0 }">
                共{{ previewMatchCount }}场
              </span>
              <el-button type="text" icon="el-icon-circle-plus-outline" class="plan-edit-new-toggle"
                v-if="hasPlanAddPermission" @click="toggleNewMatchPanel">
                {{ newMatchVisible ? "收起当场新建" : "当场新建比赛" }}
              </el-button>
            </div>

            <el-form-item label="已有比赛" prop="matchIds">
              <common-enhanced-select ref="editMatchSelect" v-model="editForm.matchIds" valueKey="matchId"
                labelKey="matchName" :api-func="listMatch" :query-params="{ matchStatus: '0' }" multiple
                placeholder="请选择已有正常比赛（可多选）" @change="handleMatchIdsChange" />
            </el-form-item>
            <div class="plan-edit-tip">
              已关联、后来被关闭的比赛保持只读展示，不能再新选已关闭比赛
            </div>
            <!-- 已关联但后来被关闭的比赛：只读展示 -->
            <div class="plan-closed-match-list" v-if="closedMatchList.length > 0">
              <el-tag v-for="match in closedMatchList" :key="match.matchId" size="small" type="info"
                style="margin-right: 4px; margin-bottom: 4px;">
                {{ formatMatchLabel(match) }}（已关闭）
              </el-tag>
            </div>

            <!-- 当场新建比赛滑出面板（同页面板，只能选已有赛季和球队，与方案计划同一事务） -->
            <transition name="slide-panel" @before-enter="handlePanelBeforeEnter" @enter="handlePanelEnter"
              @leave="handlePanelLeave">
              <div class="plan-new-match-panel" :class="{ shake: newMatchShake }" v-if="newMatchVisible">
                <div class="plan-new-match-panel-title">
                  <i class="el-icon-collection-tag"></i>
                  <span>当场新建比赛（只能选择已有赛季和球队，资料状态必须为正常，与方案计划同一事务保存）</span>
                </div>
                <!-- 对阵行：主队 VS 客队 -->
                <el-row :gutter="12" class="plan-new-match-vs-row">
                  <el-col :span="10">
                    <el-form-item label="主队名称" prop="newMatch.homeTeamId" label-width="76px">
                      <common-enhanced-select ref="newMatchHomeTeamSelect" v-model="editForm.newMatch.homeTeamId"
                        valueKey="teamId" labelKey="teamName" :api-func="listTeam" placeholder="请选择已有主队" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" class="plan-new-match-vs-col">
                    <span class="plan-new-match-vs">VS</span>
                  </el-col>
                  <el-col :span="10">
                    <el-form-item label="客队名称" prop="newMatch.awayTeamId" label-width="76px">
                      <common-enhanced-select ref="newMatchAwayTeamSelect" v-model="editForm.newMatch.awayTeamId"
                        valueKey="teamId" labelKey="teamName" :api-func="listTeam" placeholder="请选择已有客队" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="所属赛季" prop="newMatch.seasonId" label-width="90px">
                      <common-enhanced-select ref="newMatchSeasonSelect" v-model="editForm.newMatch.seasonId"
                        valueKey="seasonId" labelKey="seasonName" :api-func="listSeason" placeholder="请选择已有赛季" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="比赛时间" prop="newMatch.matchTime" label-width="90px">
                      <el-date-picker clearable v-model="editForm.newMatch.matchTime" type="datetime"
                        value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择比赛时间">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="比赛场地" label-width="90px">
                      <el-select v-model="editForm.newMatch.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地"
                        clearable filterable allow-create default-first-option>
                        <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label"
                          :value="item.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="比赛备注" label-width="90px">
                      <el-input v-model="editForm.newMatch.matchRemark" placeholder="请输入比赛备注内容" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="plan-edit-tip">
                  没有可选的赛季或球队时，请前往赛季页或球队页先创建；赛果仍只能在比赛页补填
                </div>
                <div class="plan-new-match-actions">
                  <el-button type="success" plain icon="el-icon-plus" size="mini" :disabled="!isNewMatchFilled"
                    @click="handleAddNewMatch">加入本场</el-button>
                </div>
              </div>
            </transition>

            <!-- 已加入的当场新建比赛：小卡片，可移除可继续编辑 -->
            <transition-group name="match-card-pop" tag="div" class="plan-new-match-list"
              v-if="newMatchList.length > 0">
              <div class="plan-new-match-item" v-for="(match, index) in newMatchList" :key="'new' + index">
                <div class="plan-new-match-item-main">
                  <span class="plan-new-match-item-vs">
                    {{ formatNewMatchVsText(match) }}
                  </span>
                  <span class="plan-new-match-item-time">{{ formatNewMatchTimeText(match) }}</span>
                </div>
                <div class="plan-new-match-item-sub" v-if="match.matchVenue || match.matchRemark">
                  {{ [match.matchVenue, match.matchRemark].filter(Boolean).join(" · ") }}
                </div>
                <div class="plan-new-match-item-ops">
                  <el-button type="text" size="mini" icon="el-icon-edit" @click="handleEditNewMatch(index)">编辑
                  </el-button>
                  <el-button type="text" size="mini" icon="el-icon-delete"
                    @click="handleRemoveNewMatch(index)">移除</el-button>
                </div>
              </div>
            </transition-group>
          </div>

          <!-- 分区三：图片区（仅指定用户渲染） -->
          <div class="plan-edit-card" v-if="hasImageUploadPermission">
            <div class="plan-edit-card-header">
              <span class="plan-edit-card-chip">
                <i class="el-icon-picture-outline"></i>
              </span>
              <span class="plan-edit-card-title">方案计划图片</span>
              <span class="plan-edit-card-count">{{ (editForm.planImageObjectKeys || []).length }} / 2</span>
            </div>
            <plan-image-upload v-model="editForm.planImageObjectKeys" />
          </div>
        </el-form>

        <div class="plan-edit-footer">
          <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
          <el-button @click="handleBackToList">返回总览</el-button>
        </div>
      </div>

      <!-- 右侧：实时摘要预览栏（窄屏自动隐藏，纯展示） -->
      <div class="plan-edit-preview">
        <div class="plan-preview-card plan-preview-main">
          <div class="plan-preview-title">
            <i class="el-icon-data-board"></i>
            <span>实时摘要</span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">关联比赛</span>
            <span class="plan-preview-value" :class="{ ok: previewMatchCount > 0 }">
              {{ previewMatchCount > 0 ? "已关联 " + previewMatchCount + " 场" : "尚未关联" }}
            </span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">录入倍率</span>
            <span class="plan-preview-value">{{ editForm.planRate || "空" }}</span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">录入金额</span>
            <span class="plan-preview-value">{{ editForm.planAmount || "空" }}</span>
          </div>
          <div class="plan-preview-row" v-if="hasImageUploadPermission">
            <span class="plan-preview-label">方案图片</span>
            <span class="plan-preview-value">{{ (editForm.planImageObjectKeys || []).length }} 张</span>
          </div>
          <!-- 完整度提示：镜像提交校验口径 -->
          <div class="plan-preview-hint" :class="previewMatchCount > 0 ? 'ok' : 'warn'">
            <i :class="previewMatchCount > 0 ? 'el-icon-success' : 'el-icon-warning-outline'"></i>
            <span v-if="previewMatchCount > 0">已满足「至少关联一场比赛」的保存条件</span>
            <span v-else>保存前至少要关联一场比赛，已有比赛或当场新建均可</span>
          </div>
        </div>

        <!-- 正文摘要预览 -->
        <div class="plan-preview-card" v-if="editForm.planContent">
          <div class="plan-preview-title">
            <i class="el-icon-document"></i>
            <span>正文预览</span>
          </div>
          <div class="plan-preview-content">{{ editForm.planContent }}</div>
        </div>

        <!-- 已选比赛预览（已有比赛取多选展示文案，当场新建取小卡片口径） -->
        <div class="plan-preview-card" v-if="previewMatchCount > 0">
          <div class="plan-preview-title">
            <i class="el-icon-football"></i>
            <span>比赛清单</span>
          </div>
          <div class="plan-preview-match" v-for="(match, index) in closedMatchList" :key="'p-closed-' + index">
            <span class="plan-preview-match-vs">{{ formatMatchLabel(match) }}</span>
            <span class="plan-preview-match-flag">已关闭</span>
          </div>
          <div class="plan-preview-match" v-for="(match, index) in selectedMatchPreviewList" :key="'p-open-' + index">
            <span class="plan-preview-match-vs">{{ formatMatchLabel(match) }}</span>
          </div>
          <div class="plan-preview-match plan-preview-match-new" v-for="(match, index) in newMatchList"
            :key="'p-new-' + index">
            <span class="plan-preview-match-vs">{{ formatNewMatchVsText(match) }}</span>
            <span class="plan-preview-match-flag">新建</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";
import { listMatch } from "@/api/fx67ll/dortmund/match";

import { teamVenueOptions } from "@/utils/constant/football";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import PlanImageUpload from "../PlanImageUpload/index";

export default {
  name: "PlanEditScene",
  components: { CommonEnhancedSelect, PlanImageUpload },
  props: {
    // 编写场景模式（add新增 update修改）
    editMode: {
      type: String,
      default: "add",
    },
    // 进入场景时的初始表单（父页面构建，本场景复制出可编辑副本）
    initialForm: {
      type: Object,
      default: () => ({}),
    },
    // 修改时已关联、后来被关闭的比赛（只读展示，后端保持原关联不动）
    closedMatchList: {
      type: Array,
      default: () => [],
    },
    // 编写场景表单遮罩层
    editLoading: {
      type: Boolean,
      default: false,
    },
    // 编写场景提交中状态
    submitting: {
      type: Boolean,
      default: false,
    },
    // 是否拥有图片上传权限（仅指定用户，决定图片分区是否渲染）
    hasImageUploadPermission: {
      type: Boolean,
      default: false,
    },
    // 是否拥有方案计划新增权限（决定当场新建比赛入口是否显示）
    hasPlanAddPermission: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    // 倍率有值时必须大于0，十进制字符串校验
    const checkPlanRate = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("录入倍率只能为非负十进制数字"));
        return;
      }
      if (parseFloat(value) <= 0) {
        callback(new Error("录入倍率有值时必须大于0"));
        return;
      }
      callback();
    };
    // 金额有值时必须大于等于0，十进制字符串校验
    const checkPlanAmount = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("录入金额只能为非负十进制数字"));
        return;
      }
      callback();
    };
    return {
      // 编写场景表单参数（创建与修改共用，从父页面初始表单复制，修改时另带 planId）
      editForm: this.buildEditForm(),
      // 编写场景表单校验
      editRules: {
        planContent: [
          { required: true, message: "方案计划不能为空", trigger: "blur" }
        ],
        planRate: [
          { validator: checkPlanRate, trigger: "blur" }
        ],
        planAmount: [
          { validator: checkPlanAmount, trigger: "blur" }
        ],
        "newMatch.seasonId": [
          { required: true, message: "新比赛所属赛季不能为空", trigger: "change" }
        ],
        "newMatch.homeTeamId": [
          { required: true, message: "新比赛主队不能为空", trigger: "change" }
        ],
        "newMatch.awayTeamId": [
          { required: true, message: "新比赛客队不能为空", trigger: "change" }
        ],
        "newMatch.matchTime": [
          { required: true, message: "新比赛比赛时间不能为空", trigger: "blur" }
        ],
      },
      // 当场新建比赛面板开关
      newMatchVisible: false,
      // 当场新建比赛面板校验失败抖动标记（触发shake动画后自动清除）
      newMatchShake: false,
      // 已加入的当场新建比赛列表（提交进 newMatches）
      newMatchList: [],
      // 球场预设选项数组
      teamVenueOptions,
    };
  },
  computed: {
    // 当场新建比赛必填项是否填写完整
    isNewMatchFilled() {
      const newMatch = this.editForm?.newMatch || {};
      return newMatch.seasonId != null && newMatch.homeTeamId != null && newMatch.awayTeamId != null
        && newMatch.matchTime != null && newMatch.matchTime !== "";
    },
    // 编写场景已关联比赛总数（已有比赛 + 当场新建，修改时另含已关闭比赛）
    previewMatchCount() {
      return (this.editForm.matchIds || []).length + this.newMatchList.length + this.closedMatchList.length;
    },
    // 编写场景已选正常比赛对象预览列表（从多选组件已加载选项里取，取不到时兜底空）
    selectedMatchPreviewList() {
      const selectRef = this.$refs["editMatchSelect"];
      // originOptions为全量已加载选项，不受输入过滤影响
      const options = (selectRef && selectRef.originOptions) || [];
      const idSet = new Set(this.editForm.matchIds || []);
      return options.filter((match) => idSet.has(match.matchId));
    },
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    this.listTeam = listTeam;
    // 比赛下拉包装接口：为每个选项拼装 matchName 展示文案（后台比赛数据无 matchName 冗余字段）
    this.listMatch = (query) => {
      return listMatch(query).then((response) => {
        const rows = (response.rows || []).map((match) => ({
          ...match,
          matchName: this.formatMatchLabel(match),
        }));
        return { ...response, rows };
      });
    };
  },
  methods: {
    // 从父页面传入的初始表单复制出本场景可编辑副本（避免直接改动父页面数据）
    buildEditForm() {
      const initial = this.initialForm || {};
      return {
        planId: initial.planId || null,
        planContent: initial.planContent || null,
        planRate: initial.planRate || null,
        planAmount: initial.planAmount || null,
        planRemark: initial.planRemark || null,
        matchIds: [...(initial.matchIds || [])],
        newMatches: [],
        planImageObjectKeys: [...(initial.planImageObjectKeys || [])],
        // 当场新建比赛面板表单同步初始化，避免展开面板取值报错
        newMatch: this.buildEmptyNewMatch(),
      };
    },
    // 构建当场新建比赛的空表单对象
    buildEmptyNewMatch() {
      return {
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchRemark: null,
      };
    },
    // 展开/收起当场新建比赛面板
    toggleNewMatchPanel() {
      this.newMatchVisible = !this.newMatchVisible;
      if (!this.newMatchVisible) {
        this.editForm.newMatch = this.buildEmptyNewMatch();
      }
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
      });
    },
    // 比赛多选变化：暂存到 editForm.matchIds
    handleMatchIdsChange(val) {
      this.editForm.matchIds = val;
    },
    // 当场新建比赛加入已建列表
    handleAddNewMatch() {
      this.$refs["editForm"].validateField(["newMatch.seasonId", "newMatch.homeTeamId", "newMatch.awayTeamId", "newMatch.matchTime"], (errMsg) => {
        if (errMsg) {
          // 校验失败时面板抖动提示，短暂展示后自动复位
          this.newMatchShake = true;
          setTimeout(() => {
            this.newMatchShake = false;
          }, 450);
          return;
        }
        const newMatch = this.editForm.newMatch;
        if (newMatch.homeTeamId === newMatch.awayTeamId) {
          this.$modal.msgError("新比赛主队和客队不能相同！");
          this.newMatchShake = true;
          setTimeout(() => {
            this.newMatchShake = false;
          }, 450);
          return;
        }
        this.newMatchList.push({ ...newMatch });
        // 加入后清空面板内容，可继续新建下一场
        this.editForm.newMatch = this.buildEmptyNewMatch();
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
        });
      });
    },
    // 移除一条已加入的当场新建比赛
    handleRemoveNewMatch(index) {
      this.newMatchList.splice(index, 1);
    },
    // 一键回填编辑一条已加入的当场新建比赛（面板已有未加入草稿时提示先处理草稿）
    handleEditNewMatch(index) {
      const draft = this.editForm.newMatch || {};
      const draftFilled = draft.seasonId != null || draft.homeTeamId != null || draft.awayTeamId != null
        || draft.matchTime != null;
      if (this.newMatchVisible && draftFilled) {
        this.$modal.msgWarning("请先处理面板中未加入的比赛草稿，再编辑已加入的比赛");
        return;
      }
      const [match] = this.newMatchList.splice(index, 1);
      if (!match) {
        return;
      }
      this.editForm.newMatch = { ...match };
      this.newMatchVisible = true;
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
      });
    },
    // 面板展开动画：进入前记录真实高度，从零高度开始过渡
    handlePanelBeforeEnter(el) {
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
      el.style.overflow = "hidden";
    },
    // 面板展开动画：过渡到真实高度后复位样式，保证内容自适应
    handlePanelEnter(el, done) {
      const targetHeight = el.scrollHeight ? el.scrollHeight + "px" : "600px";
      el.style.transition = "max-height 0.35s ease, opacity 0.3s ease";
      // 强制回流后再赋目标高度，确保过渡生效
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.style.maxHeight = targetHeight;
      el.style.opacity = "1";
      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        el.removeEventListener("transitionend", onEnd);
        el.style.transition = "";
        el.style.maxHeight = "";
        el.style.opacity = "";
        el.style.overflow = "";
        done();
      };
      // 只认max-height结束事件，避免opacity先结束提前复位样式
      const onEnd = (event) => {
        if (event.target === el && event.propertyName === "max-height") {
          finish();
        }
      };
      el.addEventListener("transitionend", onEnd);
      setTimeout(finish, 400);
    },
    // 面板收起动画：从当前高度过渡回零后完成移除
    handlePanelLeave(el, done) {
      const startHeight = el.scrollHeight ? el.scrollHeight + "px" : "600px";
      el.style.maxHeight = startHeight;
      el.style.opacity = "1";
      el.style.overflow = "hidden";
      el.style.transition = "max-height 0.3s ease, opacity 0.25s ease";
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        el.removeEventListener("transitionend", onEnd);
        el.style.transition = "";
        el.style.maxHeight = "";
        el.style.opacity = "";
        el.style.overflow = "";
        done();
      };
      const onEnd = (event) => {
        if (event.target === el && event.propertyName === "max-height") {
          finish();
        }
      };
      el.addEventListener("transitionend", onEnd);
      setTimeout(finish, 350);
    },
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
    // 比赛下拉展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchLabel(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 当场新建比赛对阵文案：从已选主客队行取球队名（面板选择未经过本地映射，取不到时兜底占位）
    formatNewMatchVsText(match) {
      const homeName = this.findTeamNameById(match.homeTeamId);
      const awayName = this.findTeamNameById(match.awayTeamId);
      return `${homeName} vs ${awayName}`;
    },
    // 按球队ID取球队名（取不到时兜底占位，供当场新建比赛卡片与预览展示）
    findTeamNameById(teamId) {
      const candidates = [this.$refs["newMatchHomeTeamSelect"], this.$refs["newMatchAwayTeamSelect"]]
        .map((ref) => (ref && ref.originOptions) || [])
        .flat();
      const team = candidates.find((item) => item.teamId === teamId);
      return (team && team.teamName) || "球队";
    },
    // 当场新建比赛时间文案（时间为空时兜底占位）
    formatNewMatchTimeText(match) {
      return this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}") || "时间待定";
    },
    /** 提交按钮：校验通过后构建请求体交由父页面提交，失败时保留已填文字、选择与图片 */
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        // 至少一场比赛（已有比赛 + 当场新建，修改时后端另保留已关联的关闭比赛）
        const totalMatchCount = (this.editForm.matchIds || []).length + this.newMatchList.length;
        if (this.editMode === "add" && totalMatchCount === 0) {
          this.$modal.msgError("方案计划至少要关联一场比赛！");
          return;
        }
        if (this.editMode === "update" && totalMatchCount === 0 && this.closedMatchList.length === 0) {
          this.$modal.msgError("方案计划保存后至少要关联一场比赛！");
          return;
        }
        const isAdd = this.editMode === "add";
        const data = {
          planContent: this.editForm.planContent,
          planRate: this.editForm.planRate,
          planAmount: this.editForm.planAmount,
          planRemark: this.editForm.planRemark,
          matchIds: this.editForm.matchIds || [],
          newMatches: this.newMatchList.map(match => ({
            seasonId: match.seasonId,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            matchTime: match.matchTime,
            matchVenue: match.matchVenue,
            // 新建比赛资料状态必须为正常，赛果可空
            matchStatus: "0",
            matchRemark: match.matchRemark,
          })),
        };
        if (!isAdd) {
          data.planId = this.editForm.planId;
        }
        // 图片对象键只在拥有上传权限且操作过图片区时提交（全部移除时为空数组）
        if (this.hasImageUploadPermission) {
          data.planImageObjectKeys = this.editForm.planImageObjectKeys || [];
        }
        this.$emit("save", data);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* ===== 编写场景头部横幅 ===== */
.plan-edit-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #f2fbf6 100%);
  border: 1px solid #e2eee7;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: planEditFadeUp 0.3s ease both;
}

.plan-edit-hero-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.plan-edit-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 14px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.3);
  transition: transform 0.25s ease;

  &:hover {
    transform: rotate(-6deg) scale(1.05);
  }
}

.plan-edit-hero-text h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.plan-edit-hero-text p {
  margin: 0;
  font-size: 12px;
  color: #7c8b84;
}

.plan-edit-hero-back {
  flex-shrink: 0;
}

/* ===== 编写场景双栏布局：左表单右预览 ===== */
.plan-edit-body {
  display: flex;
  align-items: flex-start;
}

.plan-edit-main {
  flex: 1;
  min-width: 0;
}

.plan-edit-preview {
  flex-shrink: 0;
  width: 300px;
  margin-left: 16px;
}

.plan-edit-form {
  padding: 0;
  background: none;
  border-radius: 0;
  box-shadow: none;
}

/* 编写场景分区卡片 */
.plan-edit-card {
  margin-bottom: 16px;
  padding: 16px 20px 8px;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: planEditFadeUp 0.3s ease both;

  &:nth-of-type(2) {
    animation-delay: 0.05s;
  }

  &:nth-of-type(3) {
    animation-delay: 0.1s;
  }
}

.plan-edit-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.plan-edit-card-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  font-size: 14px;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 8px;
}

.plan-edit-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #2b3a36;
}

.plan-edit-card-count {
  margin-left: 10px;
  padding: 1px 8px;
  font-size: 12px;
  color: #7c8b84;
  background: #f0f4f2;
  border-radius: 999px;

  &.ok {
    color: #27ad60;
    background: #e7f8ee;
  }
}

.plan-edit-new-toggle {
  margin-left: auto;
}

.plan-new-match-panel .plan-edit-tip {
  padding-left: 14px;
}

.plan-edit-tip {
  margin: 4px 0 8px;
  padding-left: 106px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

/* 已关联但后来被关闭的比赛只读标签 */
.plan-closed-match-list {
  padding-left: 106px;
}

/* ===== 当场新建比赛滑出面板 ===== */
.plan-new-match-panel {
  padding: 14px 14px 14px 0;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f2fbf6 100%);
  border: 1px solid #dcebe3;
  border-left: 4px solid #2ecc71;
  border-radius: 12px;

  /* 校验失败抖动提示 */
  &.shake {
    animation: planPanelShake 0.4s ease;
  }
}

.plan-new-match-panel-title {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding-left: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
}

.plan-new-match-panel-title i {
  margin-right: 6px;
  color: #2ecc71;
}

/* 对阵行：主队 VS 客队 */
.plan-new-match-vs-col {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 4px;
}

.plan-new-match-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 13px;
  font-weight: 700;
  color: #27ad60;
  background: #e7f8ee;
  border: 1px solid #c8edd8;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.15);
  animation: planVsPulse 1.8s ease infinite;
}

.plan-new-match-actions {
  padding-left: 14px;
}

/* ===== 已加入的当场新建比赛小卡片 ===== */
.plan-new-match-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.plan-new-match-item {
  flex: 1 1 260px;
  max-width: 100%;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e7f8ee;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #2ecc71;
    box-shadow: 0 8px 18px rgba(46, 204, 113, 0.14);
  }
}

.plan-new-match-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plan-new-match-item-vs {
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a36;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-new-match-item-time {
  flex-shrink: 0;
  margin-left: 10px;
  padding: 1px 8px;
  font-size: 12px;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;
}

.plan-new-match-item-sub {
  margin-top: 4px;
  overflow: hidden;
  font-size: 12px;
  color: #7c8b84;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-new-match-item-ops {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* 小卡片进出动画 */
.match-card-pop-enter-active,
.match-card-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.match-card-pop-enter,
.match-card-pop-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

/* 面板过渡兜底（高度与透明度动画由JS钩子驱动，此段仅在不支持JS钩子时兜底透明度） */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.3s ease;
}

.slide-panel-enter,
.slide-panel-leave-to {
  opacity: 0;
}

/* ===== 右侧实时摘要预览栏 ===== */
.plan-preview-card {
  margin-bottom: 14px;
  padding: 14px 16px;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: planEditFadeUp 0.3s ease 0.1s both;
}

.plan-preview-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a36;

  i {
    margin-right: 6px;
    color: #2ecc71;
  }
}

.plan-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.plan-preview-label {
  color: #7c8b84;
}

.plan-preview-value {
  font-weight: 600;
  color: #2b3a36;

  &.ok {
    color: #27ad60;
  }
}

/* 完整度提示行 */
.plan-preview-hint {
  display: flex;
  align-items: flex-start;
  padding: 8px 10px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 8px;

  i {
    margin-right: 6px;
    font-size: 14px;
  }

  &.ok {
    color: #27ad60;
    background: #f2fbf6;
    border: 1px solid #d5f0e2;
  }

  &.warn {
    color: #b88230;
    background: #fdf6ec;
    border: 1px solid #f5e6c8;
  }
}

.plan-preview-content {
  max-height: 160px;
  padding: 8px 10px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  word-break: break-all;
  white-space: pre-wrap;
  background: #fafcfb;
  border: 1px solid #e2eee7;
  border-radius: 8px;
}

.plan-preview-match {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.plan-preview-match-vs {
  overflow: hidden;
  color: #44604f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-preview-match-flag {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 11px;
  color: #7c8b84;
  background: #f0f4f2;
  border-radius: 999px;
}

.plan-preview-match-new .plan-preview-match-flag {
  color: #27ad60;
  background: #e7f8ee;
}

/* 编写场景进入动画 */
@keyframes planEditFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 面板校验失败抖动 */
@keyframes planPanelShake {

  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-6px);
  }

  40% {
    transform: translateX(6px);
  }

  60% {
    transform: translateX(-4px);
  }

  80% {
    transform: translateX(4px);
  }
}

/* 对阵徽标呼吸动效 */
@keyframes planVsPulse {

  0%,
  100% {
    box-shadow: 0 4px 10px rgba(46, 204, 113, 0.15);
  }

  50% {
    box-shadow: 0 4px 14px rgba(46, 204, 113, 0.4);
  }
}

/* 响应式：窄屏收起右侧预览栏 */
@media screen and (max-width: 1100px) {
  .plan-edit-preview {
    display: none;
  }
}

/* 编写场景底部按钮 */
.plan-edit-footer {
  margin-top: 4px;
  padding: 14px 20px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: planEditFadeUp 0.3s ease 0.15s both;
}
</style>
