<template>
  <!-- 添加或修改外快盈亏记录对话框 -->
  <el-dialog :title="title" :visible.sync="dialogVisible" :close-on-click-modal="false" width="800px"
    :style="`top: ${getDialogVerticalOffset(isAdd ? 570 : 450)}`" append-to-body @open="handleDialogOpen">
    <el-form ref="form" :model="form" :rules="rules" v-loading="formLoading" label-width="80px">
      <!-- 新增时展示上一次记录参考 -->
      <div class="pre-extra-reference" v-if="isAdd">
        <div class="pre-extra-reference-header">
          <div class="pre-extra-reference-header-left">
            <span class="pre-extra-reference-title">上次记录参考</span>
            <span class="pre-extra-reference-time" v-if="preExtraData.createTime">{{
              parseTime(preExtraData.createTime, "{y}-{m}-{d} {h}:{i}")
            }}</span>
          </div>
          <el-button type="text" size="mini" icon="el-icon-refresh-right"
            @click="handleRestorePreExtra">恢复上次数据</el-button>
        </div>
        <div class="pre-extra-reference-body">
          <div class="pre-extra-reference-item">
            <span class="pre-extra-reference-label">总金额</span>
            <span class="pre-extra-reference-value">{{ preExtraData.extraMoney }}</span>
          </div>
          <div class="pre-extra-reference-item">
            <span class="pre-extra-reference-label">盈亏金额</span>
            <span class="pre-extra-reference-value">{{
              preExtraData.winMoney > 0 ? "+" + preExtraData.winMoney : preExtraData.winMoney
            }}</span>
          </div>
          <div class="pre-extra-reference-item">
            <span class="pre-extra-reference-label">当前本金</span>
            <span class="pre-extra-reference-value">{{ preExtraData.seedMoney }}</span>
          </div>
          <div class="pre-extra-reference-item">
            <span class="pre-extra-reference-label">落袋金额</span>
            <span class="pre-extra-reference-value">{{ preExtraData.saveMoney }}</span>
          </div>
          <div class="pre-extra-reference-item">
            <span class="pre-extra-reference-label">目标金额</span>
            <span class="pre-extra-reference-value">{{ preExtraData.targetMoney }}</span>
          </div>
        </div>
        <div class="pre-extra-reference-tip">
          上次的总金额、当前本金、落袋金额、目标金额已自动填入下方表单，请按本次实际情况修改，盈亏金额与是否盈利将自动计算
        </div>
      </div>

      <!-- 一行两列 -->
      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="总金额" prop="extraMoney">
            <el-input v-model="form.extraMoney" placeholder="请输入当前外快总金额" @input="handleExtraMoneyChangeDubounce" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否盈利" prop="isWin">
            <el-select v-model="form.isWin" style="width: 100%" placeholder="请选择是否盈利" @change="handleIsWinChange">
              <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="盈亏金额" prop="winMoney">
            <el-input v-model="form.winMoney" placeholder="请输入外快盈亏金额" @input="handleWinMoneyChangeDubounce" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="当前本金" prop="seedMoney">
            <el-input v-model="form.seedMoney" placeholder="请输入当前投入本金" @input="handleSeedMoneyChangeDubounce" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="落袋金额" prop="saveMoney">
            <el-input v-model="form.saveMoney" placeholder="请输入已经落袋为安的盈利金额" @input="handleSaveMoneyChangeDubounce" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目标金额" prop="targetMoney">
            <el-input v-model="form.targetMoney" placeholder="请输入目标金额" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 备注单独一行 -->
      <el-form-item label="外快备注" prop="extraRemark">
        <el-input v-model="form.extraRemark" type="textarea" :rows="3" :maxlength="1023" show-word-limit
          placeholder="请输入外快备注内容" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="cancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  listExtra,
  getExtra,
  addExtra,
  updateExtra,
} from "@/api/fx67ll/dortmund/extra";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

import _ from "underscore";

export default {
  name: "ExtraEditDialog",
  dicts: ["sys_yes_no"],
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 修改的记录ID（新增时为空）
    extraId: {
      type: [Number, Array],
      default: null,
    },
  },
  data() {
    return {
      // 弹出层标题
      title: "",
      // 表单参数
      form: {
        extraMoney: 0,
        isWin: "",
        winMoney: 0,
        seedMoney: 0,
        saveMoney: 0,
        targetMoney: 0,
        extraRemark: "",
      },
      // 表单遮罩层
      formLoading: false,
      // 表单校验
      rules: {
        extraMoney: [
          {
            required: true,
            message: "当前外快总金额不能为空",
            trigger: "blur",
          },
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
      // 上一次外快数据
      preExtraData: {
        extraMoney: 0,
        winMoney: 0,
        seedMoney: 0,
        saveMoney: 0,
        targetMoney: 0,
        createTime: null,
      },
      // 编辑模式下的本条记录原值快照
      origForm: null,
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    // 是否是新增
    isAdd() {
      return this.extraId == null;
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 弹窗打开时按新增/修改模式初始化
    handleDialogOpen() {
      this.reset();
      this.origForm = null;
      if (this.isAdd) {
        this.title = "添加外快盈亏记录";
        this.getPreExtraMoney();
      } else {
        this.title = "修改外快盈亏记录";
        this.getExtraDetail();
      }
    },
    // 查询修改的记录详情
    getExtraDetail() {
      const self = this;
      getExtra(this.extraId).then((response) => {
        if (response?.data) {
          self.form = {
            ...self.form,
            ...response?.data
          };
          self.origForm = { ...response?.data };
        }
      });
    },
    // 取消按钮
    cancel() {
      this.dialogVisible = false;
      this.reset();
    },
    // 表单重置
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
    // 外快总额监听防抖
    handleExtraMoneyChangeDubounce: _.debounce(function (val) {
      this.handleExtraMoneyChange(val);
    }, 444),
    // 外快总额监听
    handleExtraMoneyChange(val) {
      if (val !== "" && val != null) {
        this.handleWinMoneyCount();
      }
    },
    // 本金监听防抖
    handleSeedMoneyChangeDubounce: _.debounce(function (val) {
      this.handleSeedMoneyChange(val);
    }, 444),
    // 本金监听
    handleSeedMoneyChange(val) {
      if (val !== "" && val != null) {
        this.handleWinMoneyCount();
      }
    },
    // 盈亏金额手动监听防抖
    handleWinMoneyChangeDubounce: _.debounce(function () {
      this.handleWinMoneyChange();
    }, 444),
    // 盈亏金额手动监听，按正负号重算是否盈利
    handleWinMoneyChange() {
      const winMoney = parseFloat(this.form?.winMoney);
      if (!isNaN(winMoney)) {
        this.form.isWin = winMoney > 0 ? "Y" : "N";
      }
    },
    // 是否盈利手动监听，与盈亏金额正负不符时弹窗提醒
    handleIsWinChange(val) {
      const winMoney = parseFloat(this.form?.winMoney || 0);
      const derivedIsWin = (!isNaN(winMoney) && winMoney > 0) ? "Y" : "N";
      if (!isNaN(winMoney) && val !== derivedIsWin) {
        this.$modal
          .confirm("是否盈利与盈亏金额正负不符，是否保留当前手动选择？")
          .catch(() => {
            this.form.isWin = derivedIsWin;
          });
      }
    },
    // 落袋金额监听防抖
    handleSaveMoneyChangeDubounce: _.debounce(function () {
      this.handleSaveMoneyChange();
    }, 444),
    // 落袋金额超过历史净盈利时提醒
    handleSaveMoneyChange() {
      const saveMoney = parseFloat(this.form?.saveMoney);
      const netMoney =
        parseFloat(this.form?.extraMoney || 0) -
        parseFloat(this.form?.seedMoney || 0);
      if (!isNaN(saveMoney) && !isNaN(netMoney) && saveMoney > netMoney) {
        this.$modal.msgWarning("落袋金额已超过当前历史净盈利（总金额 - 当前本金），请确认填写无误！");
      }
    },
    // 按当前表单计算盈亏金额（新增模式以最新记录为基准，编辑模式以本条记录原值为基准）
    calcWinMoneyByForm() {
      if (this.isAdd) {
        const preExtraMoney = parseFloat(this.preExtraData?.extraMoney || 0);
        const preSeedMoney = parseFloat(this.preExtraData?.seedMoney || 0);
        return (
          parseFloat(this.form?.extraMoney || 0) -
          parseFloat(this.form?.seedMoney || 0) -
          (preExtraMoney - preSeedMoney)
        ).toFixed(2);
      }
      const orig = this.origForm || {};
      const deltaExtraMoney =
        parseFloat(this.form?.extraMoney || 0) - parseFloat(orig.extraMoney || 0);
      const deltaSeedMoney =
        parseFloat(this.form?.seedMoney || 0) - parseFloat(orig.seedMoney || 0);
      return (
        parseFloat(orig.winMoney || 0) +
        deltaExtraMoney -
        deltaSeedMoney
      ).toFixed(2);
    },
    // 计算当前表单各类金额
    handleWinMoneyCount() {
      const nowWinMoney = this.calcWinMoneyByForm();
      this.form.isWin = parseFloat(nowWinMoney) > 0 ? "Y" : "N";
      this.form.winMoney = nowWinMoney;
    },
    // 查询上一次外快
    getPreExtraMoney() {
      const self = this;
      const queryParams = {
        pageNum: 1,
        pageSize: 1,
      };
      this.formLoading = true;
      listExtra(queryParams)
        .then((res) => {
          if (res?.code === 200) {
            if (res?.rows && res?.rows?.length > 0 && res.rows?.[0]) {
              const lastDataObj = res.rows[0];
              self.preExtraData = {
                extraMoney: parseFloat(lastDataObj?.extraMoney || 0),
                winMoney: parseFloat(lastDataObj?.winMoney || 0),
                seedMoney: parseFloat(lastDataObj?.seedMoney || 0),
                saveMoney: parseFloat(lastDataObj?.saveMoney || 0),
                targetMoney: parseFloat(lastDataObj?.targetMoney || 0),
                createTime: lastDataObj?.createTime || null,
              };
              // 参考数据直接预填入表单，用户只需修改本次有变化的字段
              self.form.extraMoney = self.preExtraData.extraMoney;
              self.form.seedMoney = self.preExtraData.seedMoney;
              self.form.saveMoney = self.preExtraData.saveMoney;
              self.form.targetMoney = self.preExtraData.targetMoney;
              // 预填后按基准计算一次，保证盈亏金额与是否盈利初始一致（本次未变动时盈亏为0，按持平处理）
              self.handleWinMoneyCount();
            } else {
              self.$modal.msgWarning("暂无历史外快盈亏记录数据！");
            }
          } else {
            self.$modal.msgError("查询外快盈亏记录失败！");
          }
        })
        .finally(() => {
          self.formLoading = false;
        });
    },
    // 一键恢复表单为上次记录的预填数据
    handleRestorePreExtra() {
      this.form.extraMoney = this.preExtraData.extraMoney;
      this.form.seedMoney = this.preExtraData.seedMoney;
      this.form.saveMoney = this.preExtraData.saveMoney;
      this.form.targetMoney = this.preExtraData.targetMoney;
      this.handleWinMoneyCount();
      this.$modal.msgSuccess("已恢复为上次记录数据");
    },
    // 提交前一致性终检，返回矛盾提示列表
    checkFormConsistency() {
      const warnList = [];
      const winMoney = parseFloat(this.form?.winMoney || 0);
      const derivedIsWin = (!isNaN(winMoney) && winMoney > 0) ? "Y" : "N";
      if (this.form?.isWin !== derivedIsWin) {
        warnList.push("是否盈利与盈亏金额正负不一致");
      }
      const saveMoney = parseFloat(this.form?.saveMoney || 0);
      const netMoney =
        parseFloat(this.form?.extraMoney || 0) -
        parseFloat(this.form?.seedMoney || 0);
      if (!isNaN(saveMoney) && !isNaN(netMoney) && saveMoney > netMoney) {
        warnList.push("落袋金额超过历史净盈利");
      }
      return warnList;
    },
    /** 提交按钮 */
    submitForm() {
      const self = this;
      this.$refs["form"].validate((valid) => {
        if (valid) {
          const warnList = self.checkFormConsistency();
          if (warnList && warnList.length > 0) {
            self.$modal
              .confirm(`检测到以下逻辑不一致：${warnList.join("；")}。是否仍要提交？`)
              .then(function () {
                self.doSubmitForm();
              })
              .catch(() => { });
          } else {
            self.doSubmitForm();
          }
        }
      });
    },
    // 实际提交
    doSubmitForm() {
      const self = this;
      if (self.form.extraId != null) {
        updateExtra(self.form).then((response) => {
          self.$modal.msgSuccess("修改成功");
          self.dialogVisible = false;
          self.$emit("success");
        });
      } else {
        addExtra(self.form).then((response) => {
          self.$modal.msgSuccess("新增成功");
          self.dialogVisible = false;
          self.$emit("success");
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.pre-extra-reference {
  margin-bottom: 18px;
  padding: 12px 16px;
  background-color: #f8f9fb;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.pre-extra-reference-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.pre-extra-reference-header-left {
  display: flex;
  align-items: baseline;
}

.pre-extra-reference-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.pre-extra-reference-time {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.pre-extra-reference-body {
  display: flex;
  flex-wrap: wrap;
}

.pre-extra-reference-item {
  min-width: 96px;
  margin-right: 24px;
}

.pre-extra-reference-label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
}

.pre-extra-reference-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.pre-extra-reference-tip {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
</style>
