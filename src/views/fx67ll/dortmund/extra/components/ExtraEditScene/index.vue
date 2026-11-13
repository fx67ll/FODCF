<template>
  <div class="app-container dl-page extra-entry-page">
    <div class="extra-entry-backdrop" aria-hidden="true">
      <span class="extra-entry-orb extra-entry-orb--mint"></span>
      <span class="extra-entry-orb extra-entry-orb--sky"></span>
      <span class="extra-entry-orb extra-entry-orb--sun"></span>
    </div>

    <div class="extra-entry-shell">
      <section class="extra-entry-hero">
        <div class="extra-entry-hero-main">
          <div class="extra-entry-hero-icon">
            <i class="el-icon-coin"></i>
          </div>
          <div class="extra-entry-hero-copy">
            <div class="extra-entry-eyebrow">
              <span class="extra-entry-eyebrow-dot"></span>
              {{ isAdd ? "新建记录" : `记录 #${extraId}` }}
            </div>
            <h1>{{ pageTitle }}</h1>
            <p>{{ pageSubtitle }}</p>
          </div>
        </div>
        <el-button type="text" class="dortmund-theme-text extra-entry-hero-back" icon="el-icon-back"
          :disabled="submitting" @click="handleCancel">
          返回列表
        </el-button>
      </section>

      <el-form ref="form" :model="form" :rules="rules" label-position="top" class="extra-entry-form"
        v-loading="formLoading" element-loading-text="正在读取记录数据">
        <div class="extra-entry-grid">
          <main class="extra-entry-main">
            <transition name="extra-card">
              <section v-if="isAdd && preExtraData.createTime && !formLoading" class="entry-card reference-card">
                <div class="entry-card-header">
                  <span class="entry-card-chip entry-card-chip--sky">
                    <i class="el-icon-time"></i>
                  </span>
                  <div class="entry-card-heading">
                    <h2>上次记录参考</h2>
                    <p>{{ parseTime(preExtraData.createTime, "{y}-{m}-{d} {h}:{i}") }} 已带入本次表单</p>
                  </div>
                  <el-button type="text" class="dortmund-theme-text" icon="el-icon-refresh-right"
                    @click="handleRestorePreExtra">恢复参考值</el-button>
                </div>
                <div class="reference-metrics">
                  <div class="reference-metric">
                    <span>总金额</span>
                    <strong>{{ formatAmount(preExtraData.extraMoney) }}</strong>
                  </div>
                  <div class="reference-metric">
                    <span>盈亏金额</span>
                    <strong :class="moneyTone(preExtraData.winMoney)">
                      {{ formatSignedAmount(preExtraData.winMoney) }}
                    </strong>
                  </div>
                  <div class="reference-metric">
                    <span>当前本金</span>
                    <strong>{{ formatAmount(preExtraData.seedMoney) }}</strong>
                  </div>
                  <div class="reference-metric">
                    <span>落袋金额</span>
                    <strong>{{ formatAmount(preExtraData.saveMoney) }}</strong>
                  </div>
                  <div class="reference-metric">
                    <span>目标金额</span>
                    <strong>{{ formatAmount(preExtraData.targetMoney) }}</strong>
                  </div>
                </div>
                <p class="reference-tip">
                  总金额、当前本金、落袋金额与目标金额已自动填入；修改总金额或盈亏金额后，系统会按历史基准实时推算另一项。
                </p>
              </section>
            </transition>

            <transition name="extra-card">
              <section v-if="isAdd && !preExtraData.createTime && !formLoading" class="entry-card reference-empty">
                <span class="reference-empty-icon"><i class="el-icon-magic-stick"></i></span>
                <div>
                  <h2>这是第一笔外快盈亏记录</h2>
                  <p>没有历史数据可参考，填写本次实际金额即可开始建立台账。</p>
                </div>
              </section>
            </transition>

            <section class="entry-card amount-card">
              <div class="entry-card-header">
                <span class="entry-card-chip"><i class="el-icon-wallet"></i></span>
                <div class="entry-card-heading">
                  <h2>金额与盈亏</h2>
                  <p>金额联动自动推算，落袋金额独立录入</p>
                </div>
                <el-button type="text" class="dortmund-theme-text" icon="el-icon-refresh-left"
                  @click="handleResetHistoricalData">重置初始值</el-button>
              </div>

              <el-row :gutter="18">
                <el-col :xs="24" :sm="12">
                  <el-form-item prop="extraMoney" class="money-form-item">
                    <span slot="label" class="entry-field-label">当前总金额 <small>联动推算</small></span>
                    <el-input v-model="form.extraMoney" class="money-input money-input--primary" maxlength="23"
                      prefix-icon="el-icon-coin" placeholder="请输入当前外快总金额" @input="handleExtraMoneyChangeDubounce" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item prop="isWin" class="money-form-item">
                    <span slot="label" class="entry-field-label">盈亏状态 <small>随金额自动更新</small></span>
                    <el-radio-group v-model="form.isWin" class="win-switch" @change="handleIsWinChange">
                      <el-radio-button v-for="dict in dict.type.sys_yes_no || []" :key="dict.value" :label="dict.value">
                        <i :class="dict.value === 'Y' ? 'el-icon-top-right' : 'el-icon-bottom-right'"></i>
                        {{ dict.label }}
                      </el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item prop="seedMoney" class="money-form-item">
                    <span slot="label" class="entry-field-label">当前本金 <small>独立录入</small></span>
                    <el-input v-model="form.seedMoney" class="money-input" maxlength="23"
                      prefix-icon="el-icon-bank-card" placeholder="请输入当前投入本金" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item prop="winMoney" class="money-form-item">
                    <span slot="label" class="entry-field-label">盈亏金额 <small>联动推算</small></span>
                    <el-input v-model="form.winMoney" class="money-input" maxlength="23" prefix-icon="el-icon-data-line"
                      placeholder="请输入外快盈亏金额" @input="handleWinMoneyChangeDubounce" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item prop="saveMoney" class="money-form-item">
                    <span slot="label" class="entry-field-label">落袋金额 <small>不联动其他金额</small></span>
                    <el-input v-model="form.saveMoney" class="money-input" maxlength="23" prefix-icon="el-icon-box"
                      placeholder="请输入已经落袋为安的盈利金额" @input="handleSaveMoneyChangeDubounce" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item prop="targetMoney" class="money-form-item">
                    <span slot="label" class="entry-field-label">目标金额 <small>用于进度预览</small></span>
                    <el-input v-model="form.targetMoney" class="money-input" maxlength="23" prefix-icon="el-icon-flag"
                      placeholder="请输入目标金额" />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>

            <section class="entry-card plan-card">
              <div class="entry-card-header">
                <span class="entry-card-chip entry-card-chip--sky"><i class="el-icon-collection-tag"></i></span>
                <div class="entry-card-heading">
                  <h2>关联方案计划</h2>
                  <p>可选关联，支持侧边抽屉跨页多选与当场新建</p>
                </div>
              </div>
              <plan-link-selector ref="planLinkSelector" :plan-ids="planLink.planIds"
                :hidden-plan-count="planLink.hiddenPlanCount" :plans="planLink.plans" />
            </section>

            <section class="entry-card remark-card">
              <div class="entry-card-header">
                <span class="entry-card-chip entry-card-chip--sun"><i class="el-icon-edit-outline"></i></span>
                <div class="entry-card-heading">
                  <h2>记录说明</h2>
                  <p>补充本次盈亏背景、落袋安排或后续计划</p>
                </div>
              </div>
              <el-form-item prop="extraRemark" class="remark-form-item">
                <el-input v-model="form.extraRemark" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                  placeholder="请输入外快备注内容" />
              </el-form-item>
            </section>
          </main>

          <aside class="extra-entry-side">
            <section class="entry-card snapshot-card">
              <div class="snapshot-aura" aria-hidden="true"></div>
              <div class="snapshot-heading">
                <span><i class="el-icon-data-analysis"></i> 本次记录预览</span>
                <span class="snapshot-state" :class="`is-${winTone}`">{{ statusText }}</span>
              </div>
              <p class="snapshot-label">记录后净沉淀</p>
              <div class="snapshot-value-wrap">
                <transition name="amount-pop" mode="out-in">
                  <strong :key="snapshotValueKey" class="snapshot-value" :class="`is-${netTone}`">
                    {{ formattedNetMoney }}
                  </strong>
                </transition>
              </div>
              <p class="snapshot-caption">当前总金额 - 当前本金</p>
              <div class="snapshot-divider"></div>
              <div class="snapshot-grid">
                <div class="snapshot-grid-item">
                  <span>本次盈亏</span>
                  <strong :class="moneyTone(form.winMoney)">{{ formatSignedAmount(form.winMoney) }}</strong>
                </div>
                <div class="snapshot-grid-item">
                  <span>已落袋</span>
                  <strong>{{ formatAmount(form.saveMoney) }}</strong>
                </div>
                <div class="snapshot-grid-item">
                  <span>当前本金</span>
                  <strong>{{ formatAmount(form.seedMoney) }}</strong>
                </div>
                <div class="snapshot-grid-item">
                  <span>目标金额</span>
                  <strong>{{ formatAmount(form.targetMoney) }}</strong>
                </div>
              </div>
              <div class="target-progress">
                <div class="target-progress-head">
                  <span>目标进度</span>
                  <strong>{{ targetProgressText }}</strong>
                </div>
                <div class="target-progress-track">
                  <span class="target-progress-bar" :style="{ width: `${targetProgress}%` }"></span>
                </div>
                <div class="target-progress-foot">
                  <span>{{ targetGapLabel }}</span>
                  <span>{{ formatAmount(form.targetMoney) }}</span>
                </div>
              </div>
            </section>

            <section class="entry-card guide-card">
              <div class="guide-heading">
                <span class="guide-icon"><i class="el-icon-sunny"></i></span>
                <div>
                  <h3>录入提示</h3>
                  <p>提交前会进行统一一致性校验</p>
                </div>
              </div>
              <div class="guide-list">
                <div v-for="(tip, index) in guidanceTips" :key="`${tip.tone}-${index}`" class="guide-tip"
                  :class="`is-${tip.tone}`">
                  <i :class="tip.icon"></i>
                  <span>{{ tip.text }}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <footer class="extra-entry-footer">
          <div class="extra-entry-footer-copy">
            <i class="el-icon-info"></i>
            <span>{{ isAdd ? "保存后将立即写入盈亏台账" : "保存后将同步更新记录与方案计划关联" }}</span>
          </div>
          <div class="extra-entry-footer-actions">
            <el-button class="dortmund-theme-cancel" :disabled="submitting" @click="handleCancel">取消</el-button>
            <el-button type="success" class="dortmund-theme-confirm extra-entry-submit" :loading="submitting"
              @click="submitForm">
              {{ isAdd ? "保存记录" : "保存修改" }}
            </el-button>
          </div>
        </footer>
      </el-form>
    </div>
  </div>
</template>

<script>
import {
  listExtra,
  getExtra,
  addExtra,
  updateExtra,
} from "@/api/fx67ll/dortmund/extra";
import {
  resolveRoutePathByComponent,
  resolveRoutePathByMenuComponent,
} from "@/utils/fx67ll/utils";
import PlanLinkSelector from "../PlanLinkSelector/index.vue";
import _ from "underscore";

// 二级录入页保存成功后通知列表页刷新（仅当前浏览器会话有效）
const EXTRA_EDIT_REFRESH_KEY = "dortmund-extra-edit-refresh-required";

const EMPTY_PRE_EXTRA = () => ({
  extraMoney: 0,
  winMoney: 0,
  seedMoney: 0,
  saveMoney: 0,
  targetMoney: 0,
  createTime: null,
});

const EMPTY_PLAN_LINK = () => ({
  planIds: [],
  hiddenPlanCount: 0,
  plans: [],
});

export default {
  name: "DortmundExtraEdit",
  dicts: ["sys_yes_no"],
  components: { PlanLinkSelector },
  data() {
    return {
      extraId: null,
      formLoading: true,
      submitting: false,
      allowRouteLeave: false,
      form: {
        extraMoney: 0,
        isWin: "",
        winMoney: 0,
        seedMoney: 0,
        saveMoney: 0,
        targetMoney: 0,
        extraRemark: "",
      },
      rules: {
        extraMoney: [
          { required: true, message: "当前外快总金额不能为空", trigger: "blur" },
        ],
        isWin: [
          { required: true, message: "是否盈利不能为空", trigger: "change" },
        ],
        winMoney: [
          { required: true, message: "外快盈亏金额不能为空", trigger: "blur" },
        ],
        seedMoney: [
          { required: true, message: "当前投入本金不能为空", trigger: "blur" },
        ],
        saveMoney: [
          {
            required: true,
            message: "已经落袋为安的盈利金额不能为空",
            trigger: "change",
          },
        ],
        targetMoney: [
          { required: true, message: "目标金额不能为空", trigger: "blur" },
        ],
      },
      preExtraData: EMPTY_PRE_EXTRA(),
      origForm: null,
      planLink: EMPTY_PLAN_LINK(),
      formSnapshot: null,
    };
  },
  computed: {
    isAdd() {
      return this.extraId == null;
    },
    pageTitle() {
      return this.isAdd ? "新增外快盈亏记录" : "修订外快盈亏记录";
    },
    pageSubtitle() {
      return this.isAdd
        ? "沿用上次金额作为参考，只修改本次变化；计划关联可随时补充。"
        : "调整金额后实时重算，保存时统一校验并同步方案计划关联。";
    },
    netMoneyNumber() {
      return this.toNumber(this.form.extraMoney) - this.toNumber(this.form.seedMoney);
    },
    winMoneyNumber() {
      return this.toNumber(this.form.winMoney);
    },
    formattedNetMoney() {
      return this.formatSignedAmount(this.netMoneyNumber);
    },
    snapshotValueKey() {
      return `${this.formattedNetMoney}-${this.netTone}`;
    },
    netTone() {
      return this.moneyTone(this.netMoneyNumber);
    },
    winTone() {
      return this.moneyTone(this.winMoneyNumber);
    },
    statusText() {
      if (this.winMoneyNumber > 0) {
        return "盈利记录";
      }
      if (this.winMoneyNumber < 0) {
        return "亏损记录";
      }
      return "持平记录";
    },
    targetProgress() {
      const target = this.toNumber(this.form.targetMoney);
      if (target <= 0) {
        return 0;
      }
      const progress = (this.netMoneyNumber / target) * 100;
      return Math.min(100, Math.max(0, progress));
    },
    targetProgressText() {
      if (this.toNumber(this.form.targetMoney) <= 0) {
        return "未设置";
      }
      return `${this.targetProgress.toFixed(1)}%`;
    },
    targetGapLabel() {
      const target = this.toNumber(this.form.targetMoney);
      if (target <= 0) {
        return "设置目标金额后可查看差距";
      }
      const gap = target - this.netMoneyNumber;
      return gap >= 0
        ? `距目标还差 ${this.formatAmount(gap)}`
        : `已超出目标 ${this.formatAmount(Math.abs(gap))}`;
    },
    guidanceTips() {
      if (this.formLoading) {
        return [
          {
            tone: "info",
            icon: "el-icon-loading",
            text: "正在读取记录与关联数据，请稍候。",
          },
        ];
      }
      const tips = [];
      this.checkFormConsistency().forEach((text) => {
        tips.push({ tone: "warn", icon: "el-icon-warning-outline", text });
      });
      if (this.isAdd && !this.preExtraData.createTime) {
        tips.push({
          tone: "info",
          icon: "el-icon-magic-stick",
          text: "首笔记录没有历史基准，盈亏金额会按当前填写值直接保存。",
        });
      }
      if (this.winMoneyNumber > 0) {
        tips.push({
          tone: "success",
          icon: "el-icon-top-right",
          text: "本次为盈利记录，落袋金额不会自动联动，请按实际安排填写。",
        });
      } else if (this.winMoneyNumber < 0) {
        tips.push({
          tone: "warn",
          icon: "el-icon-bottom-right",
          text: "本次为亏损记录，落袋金额应保持为 0 或符合实际历史净盈利。",
        });
      }
      if (this.targetProgress >= 100) {
        tips.push({
          tone: "success",
          icon: "el-icon-trophy",
          text: "当前净沉淀已达到或超过目标金额。",
        });
      }
      if (tips.length === 0) {
        tips.push({
          tone: "info",
          icon: "el-icon-info",
          text: "总金额与盈亏金额任一项变化，都会按历史基准同步推算另一项。",
        });
      }
      return tips.slice(0, 3);
    },
  },
  created() {
    this.bootstrapPage();
  },
  beforeRouteLeave(to, from, next) {
    if (this.allowRouteLeave || !this.hasUnsavedChanges()) {
      next();
      return;
    }
    this.$modal
      .confirm("当前记录尚未保存，确定离开吗？")
      .then(() => next())
      .catch(() => next(false));
  },
  beforeDestroy() {
    [
      this.handleExtraMoneyChangeDubounce,
      this.handleWinMoneyChangeDubounce,
      this.handleSaveMoneyChangeDubounce,
    ].forEach((handler) => {
      if (handler && typeof handler.cancel === "function") {
        handler.cancel();
      }
    });
  },
  methods: {
    normalizeExtraId(value) {
      if (value == null || value === "") {
        return null;
      }
      const idText = String(value).trim();
      return /^\d+$/.test(idText) ? idText : null;
    },
    bootstrapPage() {
      const query = this.$route.query || {};
      this.extraId = query.mode === "add" ? null : this.normalizeExtraId(query.id);
      this.reset();
      this.origForm = null;
      this.planLink = EMPTY_PLAN_LINK();
      this.preExtraData = EMPTY_PRE_EXTRA();
      if (!this.isAdd && this.extraId == null) {
        this.$modal.msgWarning("缺少待编辑记录编号，已返回外快盈亏列表。");
        this.allowRouteLeave = true;
        this.$nextTick(() => this.goBackToList());
        return;
      }
      if (this.isAdd) {
        this.getPreExtraMoney();
      } else {
        this.getExtraDetail();
      }
    },
    getExtraDetail() {
      this.formLoading = true;
      getExtra(this.extraId)
        .then((response) => {
          if (!response || !response.data) {
            this.$modal.msgWarning("未查询到外快盈亏记录，已返回列表。");
            this.allowRouteLeave = true;
            this.goBackToList();
            return;
          }
          const detail = response.data;
          this.form = { ...this.form, ...detail };
          this.origForm = { ...detail };
          delete this.origForm.plans;
          delete this.origForm.planCount;
          delete this.origForm.hiddenPlanCount;
          this.planLink = {
            planIds: (detail.plans || []).map((plan) => plan.planId),
            hiddenPlanCount: detail.hiddenPlanCount || 0,
            plans: detail.plans || [],
          };
          this.$nextTick(() => {
            this.captureFormSnapshot();
            this.$refs.form && this.$refs.form.clearValidate();
          });
        })
        .finally(() => {
          this.formLoading = false;
        });
    },
    getPreExtraMoney() {
      this.formLoading = true;
      this.preExtraData = EMPTY_PRE_EXTRA();
      listExtra({ pageNum: 1, pageSize: 1 })
        .then((response) => {
          if (response && response.code === 200) {
            const lastData = response.rows && response.rows[0];
            if (lastData) {
              this.preExtraData = {
                extraMoney: this.toNumber(lastData.extraMoney),
                winMoney: this.toNumber(lastData.winMoney),
                seedMoney: this.toNumber(lastData.seedMoney),
                saveMoney: this.toNumber(lastData.saveMoney),
                targetMoney: this.toNumber(lastData.targetMoney),
                createTime: lastData.createTime || null,
              };
              this.form.extraMoney = this.preExtraData.extraMoney;
              this.form.seedMoney = this.preExtraData.seedMoney;
              this.form.saveMoney = this.preExtraData.saveMoney;
              this.form.targetMoney = this.preExtraData.targetMoney;
              this.handleWinMoneyCount();
            } else {
              this.$modal.msgWarning("暂无历史外快盈亏记录数据！");
            }
          } else {
            this.$modal.msgError("查询外快盈亏记录失败！");
          }
        })
        .finally(() => {
          this.formLoading = false;
          this.$nextTick(() => this.captureFormSnapshot());
        });
    },
    reset() {
      this.form = {
        extraId: null,
        extraMoney: 0,
        isWin: "",
        winMoney: 0,
        seedMoney: 0,
        saveMoney: 0,
        targetMoney: 0,
        extraRemark: "",
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      };
      this.resetForm("form");
    },
    captureFormSnapshot() {
      this.formSnapshot = JSON.stringify(this.form);
    },
    hasUnsavedChanges() {
      if (!this.formSnapshot) {
        return false;
      }
      const formChanged = JSON.stringify(this.form) !== this.formSnapshot;
      const selector = this.$refs.planLinkSelector;
      const planChanged = Boolean(
        selector &&
        typeof selector.getSubmitData === "function" &&
        selector.getSubmitData()
      );
      return formChanged || planChanged;
    },
    handleCancel() {
      if (this.submitting) {
        return;
      }
      this.goBackToList();
    },
    goBackToList() {
      const from = this.$route.query.from;
      const safeFrom =
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("//") &&
        !from.startsWith("/dortmund/extra-edit");
      this.$router
        .push(safeFrom ? from : this.resolveExtraListPath())
        .catch(() => { });
    },
    resolveExtraListPath() {
      const componentPath = "fx67ll/dortmund/extra/index";
      let path = resolveRoutePathByMenuComponent(
        this.$store.state.permission.menuRouters,
        componentPath
      );
      if (!path) {
        path = resolveRoutePathByComponent(this.$router, componentPath);
      }
      return path || "/ai/solution/extra";
    },
    handleExtraMoneyChangeDubounce: _.debounce(function (val) {
      this.handleExtraMoneyChange(val);
    }, 444),
    handleExtraMoneyChange(val) {
      if (val !== "" && val != null) {
        this.form.extraMoney = this.padMoneyToTwoDecimal(val);
        this.handleWinMoneyCount();
      }
    },
    padMoneyToTwoDecimal(val) {
      const money = parseFloat(val);
      return isNaN(money) ? val : money.toFixed(2);
    },
    handleWinMoneyChangeDubounce: _.debounce(function () {
      this.handleWinMoneyChange();
    }, 444),
    handleWinMoneyChange() {
      const winMoney = parseFloat(this.form && this.form.winMoney);
      if (!isNaN(winMoney)) {
        this.form.winMoney = this.padMoneyToTwoDecimal(this.form.winMoney);
        this.form.isWin = parseFloat(this.form.winMoney) > 0 ? "Y" : "N";
        this.form.extraMoney = this.calcExtraMoneyByForm();
      }
    },
    handleIsWinChange(val) {
      const winMoney = parseFloat((this.form && this.form.winMoney) || 0);
      const derivedIsWin = !isNaN(winMoney) && winMoney > 0 ? "Y" : "N";
      if (!isNaN(winMoney) && val !== derivedIsWin) {
        this.$modal
          .confirm("是否盈利与盈亏金额正负不符，是否保留当前手动选择？")
          .catch(() => {
            this.form.isWin = derivedIsWin;
          });
      }
    },
    handleSaveMoneyChangeDubounce: _.debounce(function () {
      this.handleSaveMoneyChange();
    }, 444),
    handleSaveMoneyChange() {
      const saveMoney = parseFloat(this.form && this.form.saveMoney);
      if (isNaN(saveMoney) || saveMoney === 0) {
        return;
      }
      if (saveMoney < 0) {
        this.$modal.msgWarning("落袋金额不可能为负数，请确认填写无误！");
        return;
      }
      const netMoney =
        parseFloat((this.form && this.form.extraMoney) || 0) -
        parseFloat((this.form && this.form.seedMoney) || 0);
      if (isNaN(netMoney)) {
        return;
      }
      if (netMoney < 0) {
        this.$modal.msgWarning(
          "历史净盈利为负数（总金额 - 当前本金 < 0），落袋金额只能为0，请确认填写无误！"
        );
        return;
      }
      if (saveMoney > netMoney) {
        this.$modal.msgWarning(
          "落袋金额已超过当前历史净盈利（总金额 - 当前本金），请确认填写无误！"
        );
      }
    },
    calcPreNetMoney() {
      if (this.isAdd) {
        return (
          parseFloat((this.preExtraData && this.preExtraData.extraMoney) || 0) -
          parseFloat((this.preExtraData && this.preExtraData.seedMoney) || 0)
        );
      }
      const orig = this.origForm || {};
      return (
        parseFloat(orig.extraMoney || 0) -
        parseFloat(orig.seedMoney || 0) -
        parseFloat(orig.winMoney || 0)
      );
    },
    calcWinMoneyByForm() {
      return (
        parseFloat((this.form && this.form.extraMoney) || 0) -
        parseFloat((this.form && this.form.seedMoney) || 0) -
        this.calcPreNetMoney()
      ).toFixed(2);
    },
    calcExtraMoneyByForm() {
      return (
        parseFloat((this.form && this.form.winMoney) || 0) +
        parseFloat((this.form && this.form.seedMoney) || 0) +
        this.calcPreNetMoney()
      ).toFixed(2);
    },
    handleWinMoneyCount() {
      const nowWinMoney = this.calcWinMoneyByForm();
      this.form.isWin = parseFloat(nowWinMoney) > 0 ? "Y" : "N";
      this.form.winMoney = nowWinMoney;
    },
    handleRestorePreExtra() {
      this.restorePreExtraToForm();
      this.$modal.msgSuccess("已恢复为上次记录数据");
    },
    restorePreExtraToForm() {
      this.form.extraMoney = this.preExtraData.extraMoney;
      this.form.seedMoney = this.preExtraData.seedMoney;
      this.form.saveMoney = this.preExtraData.saveMoney;
      this.form.targetMoney = this.preExtraData.targetMoney;
      this.handleWinMoneyCount();
    },
    handleResetHistoricalData() {
      if (this.isAdd) {
        if (!this.preExtraData || !this.preExtraData.createTime) {
          this.$modal.msgWarning("暂无历史外快盈亏记录数据，无法重置！");
          return;
        }
        this.restorePreExtraToForm();
      } else {
        if (!this.origForm) {
          this.$modal.msgWarning("暂无原始记录数据，无法重置！");
          return;
        }
        this.form = { ...this.form, ...this.origForm };
      }
      this.$refs.form && this.$refs.form.clearValidate();
      this.$modal.msgSuccess("数据已重置!");
    },
    checkFormConsistency() {
      const warnList = [];
      const winMoney = parseFloat((this.form && this.form.winMoney) || 0);
      const derivedIsWin = !isNaN(winMoney) && winMoney > 0 ? "Y" : "N";
      if (this.form && this.form.isWin !== derivedIsWin) {
        warnList.push("是否盈利与盈亏金额正负不一致");
      }
      const saveMoney = parseFloat(this.form && this.form.saveMoney);
      if (!isNaN(saveMoney) && saveMoney !== 0) {
        if (saveMoney < 0) {
          warnList.push("落袋金额不可能为负数");
        } else {
          const netMoney =
            parseFloat((this.form && this.form.extraMoney) || 0) -
            parseFloat((this.form && this.form.seedMoney) || 0);
          if (!isNaN(netMoney)) {
            if (netMoney < 0) {
              warnList.push("历史净盈利为负数，落袋金额只能为0");
            } else if (saveMoney > netMoney) {
              warnList.push("落袋金额超过历史净盈利");
            }
          }
        }
      }
      return warnList;
    },
    submitForm() {
      if (this.formLoading || this.submitting) {
        return;
      }
      this.$refs.form.validate((valid) => {
        if (!valid) {
          return;
        }
        this.form.extraMoney = this.padMoneyToTwoDecimal(this.form.extraMoney);
        this.form.winMoney = this.padMoneyToTwoDecimal(this.form.winMoney);
        const warnList = this.checkFormConsistency();
        if (warnList.length > 0) {
          this.$modal
            .confirm(`检测到以下逻辑不一致：${warnList.join("；")}。是否仍要提交？`)
            .then(() => this.doSubmitForm())
            .catch(() => { });
        } else {
          this.doSubmitForm();
        }
      });
    },
    doSubmitForm() {
      if (this.submitting) {
        return;
      }
      const selector = this.$refs.planLinkSelector;
      const planLinkData =
        selector && typeof selector.getSubmitData === "function"
          ? selector.getSubmitData()
          : null;
      const payload = { ...this.form, ...(planLinkData || {}) };
      const isUpdate = this.form.extraId != null;
      this.submitting = true;
      const request = isUpdate ? updateExtra(payload) : addExtra(payload);
      request
        .then(() => {
          this.allowRouteLeave = true;
          sessionStorage.setItem(EXTRA_EDIT_REFRESH_KEY, "1");
          this.$modal.msgSuccess(isUpdate ? "修改成功" : "新增成功");
          this.goBackToList();
        })
        .finally(() => {
          this.submitting = false;
        });
    },
    toNumber(value) {
      const numberValue = parseFloat(value);
      return isNaN(numberValue) ? 0 : numberValue;
    },
    formatAmount(value) {
      const numberValue = parseFloat(value);
      return isNaN(numberValue) ? "-" : numberValue.toFixed(2);
    },
    formatSignedAmount(value) {
      const numberValue = parseFloat(value);
      if (isNaN(numberValue)) {
        return "-";
      }
      const fixed = numberValue.toFixed(2);
      return numberValue > 0 ? `+${fixed}` : fixed;
    },
    moneyTone(value) {
      const numberValue = parseFloat(value);
      if (isNaN(numberValue) || numberValue === 0) {
        return "is-flat";
      }
      return numberValue > 0 ? "is-win" : "is-lose";
    },
  },
};
</script>

<style lang="scss" scoped>
.extra-entry-page {
  --extra-green: var(--current-color, #2ecc71);
  --extra-green-deep: #1c9e55;
  --extra-ink: #22312b;
  --extra-muted: #7c8b84;
  --extra-line: #e2eee7;
  --extra-soft: #f4fbf7;
  position: relative;
  max-width: 1420px;
  margin: 0 auto;
  padding-bottom: 8px;
  color: var(--extra-ink);
  isolation: isolate;
}

.extra-entry-backdrop {
  position: absolute;
  top: -30px;
  right: -50px;
  left: -50px;
  z-index: -1;
  height: 430px;
  overflow: hidden;
  pointer-events: none;
}

.extra-entry-orb {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.7;
}

.extra-entry-orb--mint {
  top: -100px;
  right: 12%;
  width: 290px;
  height: 290px;
  background: radial-gradient(circle, rgba(46, 204, 113, 0.16), rgba(46, 204, 113, 0));
  animation: extraOrbDrift 10s ease-in-out infinite;
}

.extra-entry-orb--sky {
  top: 30px;
  left: 4%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(100, 181, 246, 0.13), rgba(100, 181, 246, 0));
  animation: extraOrbDrift 12s ease-in-out 1.2s infinite reverse;
}

.extra-entry-orb--sun {
  top: 170px;
  right: 1%;
  width: 170px;
  height: 170px;
  background: radial-gradient(circle, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0));
  animation: extraOrbDrift 9s ease-in-out 0.6s infinite;
}

.extra-entry-shell {
  position: relative;
}

.extra-entry-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  margin-bottom: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(242, 252, 247, 0.96) 58%, rgba(249, 252, 255, 0.96) 100%);
  border: 1px solid #dceee4;
  border-radius: 18px;
  box-shadow: 0 16px 36px rgba(46, 204, 113, 0.09);
  animation: extraHeroIn 0.42s ease both;
}

.extra-entry-hero::after {
  position: absolute;
  top: -70px;
  right: -50px;
  width: 230px;
  height: 230px;
  content: "";
  background: radial-gradient(circle, rgba(46, 204, 113, 0.1), rgba(46, 204, 113, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.extra-entry-hero-main {
  display: flex;
  align-items: center;
  min-width: 0;
}

.extra-entry-hero-back {
  flex-shrink: 0;
}

.extra-entry-hero-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-right: 14px;
  font-size: 22px;
  color: #fff;
  background: linear-gradient(135deg, #4bd98a 0%, #27ad60 100%);
  border-radius: 14px;
  box-shadow: 0 10px 22px rgba(46, 204, 113, 0.27);
  animation: extraIconFloat 3.2s ease-in-out infinite;
}

.extra-entry-hero-copy {
  min-width: 0;
}

.extra-entry-eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #5d8c73;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.extra-entry-eyebrow-dot {
  width: 6px;
  height: 6px;
  background: var(--extra-green);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.1);
}

.extra-entry-hero h1 {
  margin: 0 0 5px;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
  color: #21312a;
  letter-spacing: -0.02em;
}

.extra-entry-hero p {
  max-width: 660px;
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--extra-muted);
}

.extra-entry-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
}

.extra-entry-main,
.extra-entry-side {
  min-width: 0;
}

.entry-card {
  position: relative;
  padding: 18px 20px;
  margin-bottom: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--extra-line);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(46, 204, 113, 0.07);
  animation: extraCardIn 0.38s ease both;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;

  &:hover {
    border-color: #d1e8dc;
    box-shadow: 0 16px 34px rgba(46, 204, 113, 0.1);
  }
}

.amount-card {
  animation-delay: 0.04s;
}

.plan-card {
  animation-delay: 0.08s;
}

.remark-card {
  animation-delay: 0.12s;
}

.entry-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.entry-card-chip {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 15px;
  color: #27ad60;
  background: #e9f9f0;
  border-radius: 10px;
}

.entry-card-chip--sky {
  color: #3285b8;
  background: #edf7fd;
}

.entry-card-chip--sun {
  color: #b9861f;
  background: #fff8e8;
}

.entry-card-heading {
  min-width: 0;
  margin-right: auto;
}

.entry-card-heading h2 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 750;
  color: #25342d;
}

.entry-card-heading p {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: #8a9892;
}

.reference-card {
  padding-bottom: 14px;
  background: linear-gradient(135deg, #f5fcf8 0%, #fbfdff 100%);
  border-color: #d9eee4;
}

.reference-card::before {
  position: absolute;
  top: 0;
  left: -30%;
  width: 40%;
  height: 100%;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-18deg);
  animation: extraReferenceShine 1.1s ease 0.35s both;
  pointer-events: none;
}

.reference-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.reference-metric {
  min-width: 0;
  padding: 9px 10px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(220, 238, 228, 0.85);
  border-radius: 10px;
}

.reference-metric span {
  display: block;
  margin-bottom: 2px;
  font-size: 10px;
  color: #8b9892;
}

.reference-metric strong {
  display: block;
  overflow: hidden;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #33453d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reference-tip {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.55;
  color: #829189;
}

.reference-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #fbfefc, #f7fbff);
  border-style: dashed;
}

.reference-empty-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: #2ecc71;
  background: #eaf9f0;
  border-radius: 13px;
}

.reference-empty h2 {
  margin: 0 0 3px;
  font-size: 14px;
  color: #2f4139;
}

.reference-empty p {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: #829189;
}

.money-form-item {
  margin-bottom: 18px;
}

.entry-field-label {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #40524a;
}

.entry-field-label small {
  font-size: 10px;
  font-weight: 400;
  color: #9aa8a1;
}

::v-deep .money-form-item .el-form-item__label {
  padding-bottom: 5px;
  line-height: 20px;
}

::v-deep .money-input .el-input__inner {
  height: 44px;
  padding-left: 38px;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: #26372f;
  background: #fbfdfc;
  border-color: #dfece5;
  border-radius: 11px;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

::v-deep .money-input .el-input__prefix {
  left: 12px;
  font-size: 15px;
  color: #91a59a;
  transition: color 0.22s ease;
}

::v-deep .money-input--primary .el-input__inner {
  font-size: 16px;
  font-weight: 700;
  color: #1f5138;
  background: linear-gradient(135deg, #ffffff, #f3fcf7);
  border-color: #cbe9d8;
  box-shadow: inset 0 0 0 1px rgba(46, 204, 113, 0.03);
}

::v-deep .money-input--primary .el-input__prefix {
  color: #2ecc71;
}

::v-deep .money-input .el-input__inner:focus {
  background: #fff;
  border-color: var(--extra-green);
  box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.11);
}

::v-deep .win-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
}

::v-deep .win-switch .el-radio-button {
  width: 100%;
}

::v-deep .win-switch .el-radio-button__inner {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font-size: 13px;
  line-height: 42px;
  color: #6c7b74;
  background: #fbfdfc;
  border-color: #dfece5;
  box-shadow: none;
  transition: color 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

::v-deep .win-switch .el-radio-button:first-child .el-radio-button__inner {
  border-radius: 11px 0 0 11px;
}

::v-deep .win-switch .el-radio-button:last-child .el-radio-button__inner {
  border-radius: 0 11px 11px 0;
}

::v-deep .win-switch .el-radio-button__orig-radio:checked+.el-radio-button__inner {
  color: #fff;
  background: linear-gradient(135deg, #42d27e, #27ad60);
  border-color: #27ad60;
  box-shadow: 0 7px 16px rgba(46, 204, 113, 0.2);
}

::v-deep .win-switch .el-radio-button__inner i {
  margin-right: 4px;
}

.plan-card ::v-deep .plan-link-selector {
  padding: 0;
  margin-bottom: 0;
  background: transparent;
  border: 0;
}

.remark-form-item {
  margin-bottom: 0;
}

::v-deep .remark-form-item .el-textarea__inner {
  min-height: 112px !important;
  padding: 11px 13px;
  font-size: 13px;
  line-height: 1.65;
  color: #32443b;
  background: #fbfdfc;
  border-color: #dfece5;
  border-radius: 11px;
}

.extra-entry-side {
  position: sticky;
  top: 100px;
}

.snapshot-card {
  padding: 20px;
  overflow: hidden;
  background: linear-gradient(145deg, #ffffff 0%, #f4fcf7 54%, #eef9f4 100%);
  border-color: #d5ece0;
  box-shadow: 0 16px 34px rgba(46, 204, 113, 0.11);
  animation-delay: 0.06s;
}

.snapshot-aura {
  position: absolute;
  top: -110px;
  right: -90px;
  width: 230px;
  height: 230px;
  background: radial-gradient(circle, rgba(46, 204, 113, 0.18), rgba(46, 204, 113, 0) 68%);
  border-radius: 50%;
  pointer-events: none;
  animation: extraAuraBreathe 5s ease-in-out infinite;
}

.snapshot-heading {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #3a5146;
}

.snapshot-heading i {
  margin-right: 5px;
  color: #2ecc71;
}

.snapshot-state {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  color: #718078;
  background: #eff5f1;
  border-radius: 999px;
}

.snapshot-state.is-win {
  color: #208b50;
  background: #e6f9ee;
}

.snapshot-state.is-lose {
  color: #c15a55;
  background: #fff0ee;
}

.snapshot-label {
  margin: 20px 0 3px;
  font-size: 11px;
  color: #7c8b84;
}

.snapshot-value-wrap {
  min-height: 48px;
}

.snapshot-value {
  display: inline-block;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.035em;
  color: #34463d;
}

.snapshot-value.is-win {
  color: #1c9e55;
  text-shadow: 0 8px 22px rgba(46, 204, 113, 0.18);
}

.snapshot-value.is-lose {
  color: #e45d57;
  text-shadow: 0 8px 22px rgba(228, 93, 87, 0.14);
}

.snapshot-caption {
  margin: 2px 0 0;
  font-size: 11px;
  color: #92a099;
}

.snapshot-divider {
  height: 1px;
  margin: 16px 0;
  background: linear-gradient(90deg, rgba(46, 204, 113, 0.18), rgba(46, 204, 113, 0.02));
}

.snapshot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.snapshot-grid-item {
  padding: 9px 10px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(217, 236, 226, 0.82);
  border-radius: 10px;
}

.snapshot-grid-item span {
  display: block;
  margin-bottom: 2px;
  font-size: 10px;
  color: #8c9a93;
}

.snapshot-grid-item strong {
  display: block;
  overflow: hidden;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #33473d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-progress {
  padding-top: 16px;
}

.target-progress-head,
.target-progress-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  color: #85948c;
}

.target-progress-head strong {
  font-size: 12px;
  color: #2e7551;
}

.target-progress-track {
  height: 7px;
  margin: 7px 0 6px;
  overflow: hidden;
  background: #e7f1eb;
  border-radius: 999px;
}

.target-progress-bar {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #58da91, #2ecc71, #1fa85a);
  border-radius: inherit;
  box-shadow: 0 0 12px rgba(46, 204, 113, 0.22);
  transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.guide-card {
  padding: 16px 18px;
  animation-delay: 0.14s;
}

.guide-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.guide-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #b88620;
  background: #fff8e9;
  border-radius: 10px;
}

.guide-heading h3 {
  margin: 0 0 2px;
  font-size: 13px;
  color: #33443b;
}

.guide-heading p {
  margin: 0;
  font-size: 10px;
  color: #8c9a93;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-tip {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 10px;
  font-size: 11px;
  line-height: 1.55;
  color: #61726a;
  background: #f7faf8;
  border: 1px solid #e8f0eb;
  border-radius: 9px;
}

.guide-tip i {
  flex-shrink: 0;
  margin-top: 1px;
  color: #7c8b84;
}

.guide-tip.is-success {
  color: #357a57;
  background: #f1fbf6;
  border-color: #d8efe2;
}

.guide-tip.is-success i {
  color: #2ecc71;
}

.guide-tip.is-warn {
  color: #9e722d;
  background: #fffaf0;
  border-color: #f3e7ca;
}

.guide-tip.is-warn i {
  color: #e6a23c;
}

.guide-tip.is-info i {
  color: #58a6d2;
}

.extra-entry-footer {
  position: sticky;
  bottom: 14px;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
  margin-top: 2px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #dcece3;
  border-radius: 15px;
  box-shadow: 0 14px 34px rgba(35, 79, 54, 0.12);
  backdrop-filter: blur(12px);
  animation: extraFooterIn 0.4s ease 0.16s both;
}

.extra-entry-footer-copy {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #7d8d85;
}

.extra-entry-footer-copy i {
  color: #2ecc71;
}

.extra-entry-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.extra-entry-submit {
  min-width: 112px;
  border-radius: 9px !important;
}

.is-win {
  color: #1c9e55 !important;
}

.is-lose {
  color: #e45d57 !important;
}

.is-flat {
  color: #7c8b84 !important;
}

.extra-card-enter-active,
.extra-card-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.extra-card-enter,
.extra-card-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.amount-pop-enter-active,
.amount-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease, filter 0.18s ease;
}

.amount-pop-enter {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(8px) scale(0.96);
}

.amount-pop-leave-to {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(-7px) scale(1.02);
}

@keyframes extraHeroIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes extraCardIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes extraFooterIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes extraIconFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-3px) rotate(-3deg);
  }
}

@keyframes extraOrbDrift {

  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(12px, -8px, 0);
  }
}

@keyframes extraAuraBreathe {

  0%,
  100% {
    opacity: 0.6;
    transform: scale(0.95);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes extraReferenceShine {
  from {
    left: -40%;
  }

  to {
    left: 120%;
  }
}

@media screen and (max-width: 1180px) {
  .extra-entry-grid {
    grid-template-columns: minmax(0, 1fr) 300px;
  }

  .reference-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 1024px) {
  .extra-entry-grid {
    grid-template-columns: 1fr;
  }

  .extra-entry-side {
    position: static;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
    gap: 16px;
  }

  .extra-entry-side .entry-card {
    margin-bottom: 0;
  }
}

@media screen and (max-width: 767px) {
  .extra-entry-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }

  .extra-entry-hero-back {
    align-self: flex-end;
  }

  .extra-entry-hero-icon {
    width: 40px;
    height: 40px;
    margin-right: 10px;
    font-size: 19px;
  }

  .extra-entry-hero h1 {
    font-size: 18px;
  }

  .entry-card {
    padding: 15px;
    border-radius: 14px;
  }

  .entry-card-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .entry-card-header .dortmund-theme-text {
    margin-left: 42px;
  }

  .reference-metrics,
  .extra-entry-side {
    grid-template-columns: 1fr;
  }

  .extra-entry-footer {
    align-items: stretch;
    flex-direction: column;
    bottom: 8px;
  }

  .extra-entry-footer-actions {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
  }

  .extra-entry-footer-actions .el-button {
    width: 100%;
    margin-left: 0;
  }

  .snapshot-value {
    font-size: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {

  .extra-entry-page *,
  .extra-entry-page *::before,
  .extra-entry-page *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
