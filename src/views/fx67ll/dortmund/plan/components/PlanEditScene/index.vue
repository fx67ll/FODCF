<template>
  <!-- 方案计划编写场景（创建/修改共用整页，进入场景时从父页面初始表单复制出可编辑副本） -->
  <div class="dortmund-secondary-page plan-edit-scene">
    <!-- 头部横幅：渐变图标 + 标题 + 副标题 -->
    <div class="plan-edit-hero">
      <div class="plan-edit-hero-left">
        <div class="plan-edit-hero-icon">
          <i class="el-icon-notebook-2"></i>
        </div>
        <div class="plan-edit-hero-text">
          <h2>{{ editMode === "add" ? "编写方案计划" : "修改方案计划" }}</h2>
          <p>填写正文后关联已采用回报组合，系统自动派生比赛并汇总金额</p>
        </div>
      </div>
      <el-button type="text" class="dortmund-theme-text plan-edit-hero-back" icon="el-icon-back"
        @click="handleBackToList">返回总览
      </el-button>
    </div>

    <div class="plan-edit-body">
      <!-- 左侧：表单主区 -->
      <div class="plan-edit-main">
        <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="110px" class="plan-edit-form"
          v-loading="editLoading">
          <!-- 分区一：方案内容 -->
          <div class="plan-edit-card">
            <div class="plan-edit-card-header">
              <span class="plan-edit-card-chip">
                <i class="el-icon-edit-outline"></i>
              </span>
              <span class="plan-edit-card-title">方案内容</span>
              <el-button type="success" plain size="mini" class="plan-combination-recalculate" icon="el-icon-refresh"
                :loading="detailLoading" :disabled="!selectedCombinationCount"
                @click="handleRecalculate">重新计算</el-button>
            </div>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item prop="planContent">
                  <template slot="label">
                    <dortmund-form-label label="方案计划" tip="必填；1-1023个字符" />
                  </template>
                  <el-input v-model="editForm.planContent" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                    placeholder="请输入方案计划" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item prop="planRate">
                  <template slot="label">
                    <dortmund-form-label label="录入倍率" tip="选填；普通十进制数，不允许科学计数法；填写时须大于0，最多18位整数和6位小数；留空使用后端自动计算值" />
                  </template>
                  <el-input v-model="editForm.planRate" clearable :disabled="selectedCombinationCount === 0"
                    placeholder="默认根据关联回报组合自动计算，可手动调整" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item prop="planAmount">
                  <template slot="label">
                    <dortmund-form-label label="录入金额" tip="选填；普通十进制数，不允许科学计数法；填写时须大于等于0，最多22位整数和2位小数；留空使用后端自动计算值" />
                  </template>
                  <el-input v-model="editForm.planAmount" clearable :disabled="selectedCombinationCount === 0"
                    placeholder="默认根据关联回报组合自动计算，可手动调整" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item prop="planRemark">
                  <template slot="label">
                    <dortmund-form-label label="其他说明" tip="选填；最多1023个字符" />
                  </template>
                  <el-input v-model="editForm.planRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                    placeholder="请输入其他说明" />
                </el-form-item>
              </el-col>
              <el-col :span="24" v-if="editMode === 'update'">
                <el-form-item label="摘要状态">
                  <div class="plan-summary-flag">
                    <el-radio-group v-model="editForm.summaryUpdateFlag" size="mini">
                      <el-radio-button label="Y">标记待刷新</el-radio-button>
                      <el-radio-button label="N" :disabled="!editForm.summaryContent">标记为已同步</el-radio-button>
                    </el-radio-group>
                    <span class="plan-summary-flag-tip">
                      仅当摘要已存在且正文、金额、说明、组合关系均未变化时可提交 N；后端检测到变化或摘要为空时会强制改为 Y。
                    </span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 分区二：关联回报组合 -->
          <div class="plan-edit-card" v-loading="detailLoading">
            <div class="plan-edit-card-header">
              <span class="plan-edit-card-chip">
                <i class="el-icon-trophy"></i>
              </span>
              <span class="plan-edit-card-title">关联回报组合</span>
              <span class="plan-edit-card-count" :class="{ ok: selectedCombinationCount > 0 }">
                共{{ selectedCombinationCount }}条
              </span>
            </div>
            <el-form-item label="回报组合" prop="combinationIds">
              <div class="plan-combination-selector">
                <el-input :value="selectedCombinationSummary" readonly placeholder="可选择 0 至多条已采用的回报组合"
                  prefix-icon="el-icon-trophy" @click="combinationSelectorVisible = true" />
                <el-button type="success" plain icon="el-icon-s-operation"
                  @click="combinationSelectorVisible = true">选择组合</el-button>
              </div>
            </el-form-item>
            <div class="plan-edit-tip">
              比赛清单由组合明细自动派生并去重，不能直接增删比赛；回报组合可暂不关联，后续再补充
            </div>
            <div class="plan-combination-empty" v-if="!selectedCombinationCount">
              暂未关联回报组合，可直接保存为 0 条
            </div>
            <div class="plan-combination-load-error" v-if="combinationDetailErrorIds.length" role="alert">
              <i class="el-icon-warning-outline"></i>
              <span>{{ combinationDetailErrorIds.length }} 条组合明细未完整加载，已保留选择，可重试恢复预览。</span>
              <el-button type="text" class="dortmund-theme-text" icon="el-icon-refresh"
                @click="retryCombinationDetails">重试加载</el-button>
            </div>
            <div class="plan-combination-list" v-if="selectedCombinationCount">
              <div class="plan-combination-item" v-for="combination in selectedCombinationPreviewList"
                :key="combination.combinationId">
                <span class="plan-combination-title">{{ combination.combinationTitle || combination.combinationCode ||
                  `组合 ${combination.combinationId}` }}</span>
                <span class="plan-combination-metrics is-error" v-if="combination._detailLoadFailed">
                  明细加载失败
                </span>
                <span class="plan-combination-metrics" v-else>
                  回报 {{ formatMoneyDisplay(combination.estimatedReturn) }} · {{ combination.matchCount ||
                    (combination.matches || []).length }}场
                </span>
              </div>
            </div>
          </div>
        </el-form>

        <div class="plan-edit-footer">
          <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="submitEditForm">保
            存</el-button>
          <el-button class="dortmund-theme-cancel" @click="handleBackToList">返回总览</el-button>
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
            <span class="plan-preview-label">组合数</span>
            <span class="plan-preview-value" :class="{ ok: selectedCombinationCount > 0 }">
              {{ selectedCombinationCount || "尚未关联" }}
            </span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">自动倍率</span>
            <span class="plan-preview-value">{{ autoPreview.planRate || "按组合保存后生成" }}</span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">自动金额</span>
            <span class="plan-preview-value">{{ autoPreview.planAmount || "按组合保存后生成" }}</span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">手工倍率</span>
            <span class="plan-preview-value">{{ editForm.planRate || "使用自动值" }}</span>
          </div>
          <div class="plan-preview-row">
            <span class="plan-preview-label">手工金额</span>
            <span class="plan-preview-value">{{ editForm.planAmount || "使用自动值" }}</span>
          </div>
          <div class="plan-preview-hint" :class="{ ok: selectedCombinationCount > 0 }">
            <i :class="selectedCombinationCount > 0 ? 'el-icon-success' : 'el-icon-info'"></i>
            <span v-if="selectedCombinationCount > 0">已按组合明细派生 {{ derivedMatchCount }} 场去重比赛</span>
            <span v-else>尚未关联回报组合，可直接保存，后续在编辑中补充</span>
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

        <!-- 已派生比赛预览（只读，来源为组合明细） -->
        <div class="plan-preview-card" v-if="derivedMatches.length > 0">
          <div class="plan-preview-title">
            <i class="el-icon-football"></i>
            <span>比赛清单</span>
          </div>
          <div class="plan-preview-match" v-for="(match, index) in derivedMatches" :key="'p-open-' + index">
            <span class="plan-preview-match-vs">{{ formatMatchLabel(match) }}</span>
          </div>
        </div>
      </div>
    </div>

    <dortmund-combination-selector-modal :visible.sync="combinationSelectorVisible" multiple
      :selected-items="combinationDetails" @confirm="handleCombinationSelectorConfirm" />
  </div>
</template>

<script>
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { getCombination, getGeneration } from "@/api/fx67ll/dortmund/returnCombination";
import DortmundCombinationSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundCombinationSelectorModal/index";
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import {
  DORTMUND_LIMITS,
  decimalRule,
  optionalTextRule,
  requiredTextRule,
  trimText,
} from "@/views/fx67ll/dortmund/utils/validation";

export default {
  name: "PlanEditScene",
  components: { DortmundCombinationSelectorModal, DortmundFormLabel },
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
    // 修改时由后端派生的历史比赛（只读展示）
    readonlyMatches: {
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
  },
  data() {
    return {
      // 编写场景表单参数（创建与修改共用，从父页面初始表单复制，修改时另带 planId）
      editForm: this.buildEditForm(),
      // 编写场景表单校验
      editRules: {
        planContent: [requiredTextRule("方案计划", DORTMUND_LIMITS.planContent)],
        planRate: [decimalRule("录入倍率", {
          minExclusive: 0, maxIntegerDigits: 18, maxFractionDigits: 6,
        })],
        planAmount: [decimalRule("录入金额", {
          min: 0, maxIntegerDigits: 22, maxFractionDigits: 2,
        })],
        planRemark: [optionalTextRule("其他说明", DORTMUND_LIMITS.planRemark)],
        combinationIds: [],
      },
      // 选中组合的明细缓存
      combinationDetails: [],
      // 明细加载状态
      detailLoading: false,
      combinationSelectorVisible: false,
      combinationLoadSerial: 0,
      combinationDetailErrorIds: [],
    };
  },
  computed: {
    // 当场新建比赛必填项是否填写完整
    isNewMatchFilled() {
      const newMatch = this.editForm?.newMatch || {};
      return newMatch.seasonId != null && newMatch.homeTeamId != null && newMatch.awayTeamId != null
        && newMatch.matchTime != null && newMatch.matchTime !== "";
    },
    // 已选回报组合数量
    selectedCombinationCount() {
      return (this.editForm.combinationIds || []).length;
    },
    selectedCombinationSummary() {
      const count = this.selectedCombinationCount;
      if (!count) {
        return "";
      }
      const first = this.selectedCombinationPreviewList[0];
      const firstName = first && (first.combinationTitle || first.combinationCode);
      return count === 1 && firstName ? firstName : `已选择 ${count} 条已采用组合`;
    },
    // 已选组合的只读预览（优先使用已加载明细，退回选项摘要）
    selectedCombinationPreviewList() {
      const selectedIds = new Set(this.editForm.combinationIds || []);
      return this.combinationDetails.filter((item) => selectedIds.has(item.combinationId));
    },
    // 组合明细派生并去重后的比赛清单
    derivedMatches() {
      const matchMap = new Map();
      this.combinationDetails.forEach((combination) => {
        (combination.matches || []).forEach((match) => {
          if (match.matchId != null && !matchMap.has(match.matchId)) {
            matchMap.set(match.matchId, match);
          }
        });
      });
      return Array.from(matchMap.values());
    },
    derivedMatchCount() {
      return this.derivedMatches.length;
    },
    // 自动值前端预览：仅用于展示；保存时由后端重新汇总并写入最终值
    autoPreview() {
      if (!this.combinationDetails.length) {
        return { planRate: null, planAmount: null };
      }
      let totalReturn = 0;
      let totalInput = 0;
      this.combinationDetails.forEach((combination) => {
        totalReturn += Number(combination.estimatedReturn || 0);
        totalInput += Number(combination.generationInputAmount || 0);
      });
      const planAmount = totalInput > 0 ? totalReturn.toFixed(2) : null;
      const planRate = totalInput > 0 ? (totalReturn / totalInput).toFixed(4) : null;
      return { planRate, planAmount };
    },
  },
  watch: {
    // 最后一条组合移除后，同步清空手工倍率与金额，避免留下无归属的覆盖值
    selectedCombinationCount(value) {
      if (!value) {
        this.resetManualAdjustment();
      }
    },
  },
  created() {
    if (this.editForm.combinationIds.length) {
      this.handleCombinationChange(this.editForm.combinationIds);
    }
  },
  methods: {
    // 从父页面传入的初始表单复制出本场景可编辑副本
    buildEditForm() {
      const initial = this.initialForm || {};
      const combinationIds = [...(initial.combinationIds || [])];
      return {
        planId: initial.planId || null,
        planContent: initial.planContent || null,
        planRate: combinationIds.length ? initial.planRate || null : null,
        planAmount: combinationIds.length ? initial.planAmount || null : null,
        planRemark: initial.planRemark || null,
        combinationIds,
        summaryUpdateFlag: initial.summaryUpdateFlag || "Y",
        summaryContent: initial.summaryContent || null,
      };
    },
    // 组合多选变化：拉取最新明细并生成前端预览
    handleCombinationChange(combinationIds, forceRefresh = false) {
      const selectedIds = [...new Set((combinationIds || []).filter((id) => id !== null && id !== undefined))];
      const loadSerial = ++this.combinationLoadSerial;
      const loadedMap = new Map(this.combinationDetails.map((item) => [item.combinationId, item]));
      this.combinationDetails = selectedIds.map((id) => loadedMap.get(id) || this.createCombinationPlaceholder(id));
      const missingIds = forceRefresh ? selectedIds : selectedIds.filter((id) => {
        const detail = loadedMap.get(id);
        return !detail || detail._detailLoaded !== true || detail._partialLoadError;
      });
      if (!missingIds.length) {
        this.combinationDetailErrorIds = this.combinationDetailErrorIds.filter((id) => selectedIds.includes(id));
        this.detailLoading = false;
        return Promise.resolve();
      }
      this.detailLoading = true;
      return Promise.all(missingIds.map((combinationId) => this.loadCombinationDetail(combinationId)
        .then((detail) => ({ combinationId, detail }))
        .catch(() => ({ combinationId, detail: null }))))
        .then((results) => {
          if (loadSerial !== this.combinationLoadSerial) {
            return;
          }
          const detailMap = new Map(this.combinationDetails.map((item) => [item.combinationId, item]));
          const errorIds = new Set(this.combinationDetailErrorIds.filter((id) => selectedIds.includes(id)));
          results.forEach(({ combinationId, detail }) => {
            if (detail) {
              detailMap.set(combinationId, detail);
              if (detail._partialLoadError) {
                errorIds.add(combinationId);
              } else {
                errorIds.delete(combinationId);
              }
            } else {
              detailMap.set(combinationId, this.createCombinationPlaceholder(
                combinationId,
                detailMap.get(combinationId),
                true
              ));
              errorIds.add(combinationId);
            }
          });
          this.combinationDetails = selectedIds.map((id) => detailMap.get(id));
          this.combinationDetailErrorIds = [...errorIds];
        })
        .finally(() => {
          if (loadSerial === this.combinationLoadSerial) {
            this.detailLoading = false;
          }
        });
    },
    handleCombinationSelectorConfirm(combinations) {
      const selectedRows = Array.isArray(combinations) ? combinations.filter(Boolean) : [];
      this.editForm.combinationIds = selectedRows.map((item) => item.combinationId);
      const detailMap = new Map(this.combinationDetails.map((item) => [item.combinationId, item]));
      selectedRows.forEach((item) => {
        detailMap.set(item.combinationId, { ...(detailMap.get(item.combinationId) || {}), ...item });
      });
      this.combinationDetails = this.editForm.combinationIds.map((id) => (
        detailMap.get(id) || this.createCombinationPlaceholder(id)
      ));
      const detailRequest = this.handleCombinationChange(this.editForm.combinationIds);
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate("combinationIds");
      });
      return detailRequest;
    },
    // 拉取单条组合与所属生成批次，组合内容只读
    loadCombinationDetail(combinationId) {
      return getCombination(combinationId).then((combinationResponse) => {
        const combination = {
          combinationId,
          ...((combinationResponse && combinationResponse.data) || {}),
        };
        if (!combination.generationId) {
          return { ...combination, _detailLoaded: true };
        }
        return getGeneration(combination.generationId).then((generationResponse) => {
          const generation = (generationResponse && generationResponse.data) || {};
          return {
            ...combination,
            generationInputAmount: generation.inputAmount || 0,
            _detailLoaded: true,
          };
        }).catch(() => ({
          ...combination,
          generationInputAmount: 0,
          _detailLoaded: true,
          _partialLoadError: true,
        }));
      });
    },
    createCombinationPlaceholder(combinationId, source = {}, loadFailed = false) {
      return {
        ...source,
        combinationId,
        combinationTitle: source.combinationTitle || source.combinationCode || `组合 ${combinationId}`,
        _detailLoaded: false,
        _detailLoadFailed: loadFailed,
      };
    },
    retryCombinationDetails() {
      if (!this.detailLoading) {
        this.handleCombinationChange([...(this.editForm.combinationIds || [])]);
      }
    },
    // 重新拉取关联组合快照、清空手工覆盖并刷新自动预览；最终值仍以后端保存结果为准
    handleRecalculate() {
      if (!this.selectedCombinationCount || this.detailLoading) {
        return;
      }
      this.resetManualAdjustment();
      this.handleCombinationChange([...(this.editForm.combinationIds || [])], true).then(() => {
        if (this.combinationDetailErrorIds.length) {
          this.$modal.msgWarning("部分回报组合明细刷新失败，请稍后重试；当前保留已有选择");
          return;
        }
        this.$modal.msgSuccess("已刷新关联回报组合并重新计算；保存后以后端结果为准");
      }).catch(() => {
        this.$modal.msgWarning("重新计算未完成，请检查网络后重试；当前保留已有选择");
      });
    },
    // 清空手工调整字段，恢复后端自动计算口径
    resetManualAdjustment() {
      this.editForm.planRate = null;
      this.editForm.planAmount = null;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate(["planRate", "planAmount"]);
      });
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
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    /** 提交按钮：校验通过后构建请求体交由父页面提交，失败时保留已填文字和组合选择 */
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        const isAdd = this.editMode === "add";
        const hasCombination = this.selectedCombinationCount > 0;
        const data = {
          planContent: trimText(this.editForm.planContent),
          planRate: hasCombination ? trimText(this.editForm.planRate) : null,
          planAmount: hasCombination ? trimText(this.editForm.planAmount) : null,
          planRemark: trimText(this.editForm.planRemark),
          combinationIds: this.editForm.combinationIds || [],
        };
        if (!isAdd) {
          data.planId = this.editForm.planId;
          data.summaryUpdateFlag = this.editForm.summaryUpdateFlag || "Y";
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

.plan-combination-recalculate {
  margin-left: auto;
}

.plan-summary-flag {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-summary-flag-tip {
  flex: 1;
  min-width: 260px;
  font-size: 12px;
  line-height: 1.5;
  color: #7c8b84;
}

.plan-combination-selector {
  display: flex;
  align-items: center;
  gap: 12px;

  .el-input {
    flex: 1;
    min-width: 0;
  }

  .el-button {
    flex-shrink: 0;
  }
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

.plan-combination-empty {
  padding: 12px;
  margin: 10px 0;
  font-size: 12px;
  color: #b88230;
  text-align: center;
  background: #fdf6ec;
  border: 1px dashed #f5e6c8;
  border-radius: 10px;
}

.plan-combination-load-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  margin: 10px 0;
  font-size: 12px;
  color: #a66a18;
  background: #fdf6ec;
  border: 1px solid #f5dfbb;
  border-radius: 10px;

  .el-button {
    flex-shrink: 0;
    padding: 0;
    margin-left: auto;
  }
}

.plan-combination-list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.plan-combination-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  background: #f9fcfa;
  border: 1px solid #e8f2ed;
  border-radius: 10px;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    border-color: #2ecc71;
    box-shadow: 0 6px 14px rgba(46, 204, 113, 0.12);
    transform: translateY(-1px);
  }
}

.plan-combination-title {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: #2b3a36;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.plan-combination-metrics {
  flex-shrink: 0;
  font-size: 11px;
  color: #7c8b84;

  &.is-error {
    color: #e6a23c;
  }
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

@media screen and (max-width: 767px) {
  .plan-combination-selector {
    align-items: stretch;
    flex-direction: column;

    .el-button {
      align-self: flex-start;
    }
  }

  .plan-edit-tip {
    padding-left: 0;
  }

  .plan-combination-load-error {
    align-items: flex-start;
    flex-wrap: wrap;

    .el-button {
      margin-left: 22px;
    }
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
