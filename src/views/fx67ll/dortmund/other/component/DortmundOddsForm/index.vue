<template>
  <div class="dortmund-odds-form">
    <div class="dortmund-odds-form-card">
      <div class="dortmund-odds-form-header">
        <span class="dortmund-odds-form-chip"><i class="el-icon-document"></i></span>
        <span class="dortmund-odds-form-title">基础信息</span>
        <span class="dortmund-odds-form-tip">编码、来源时间与让分值</span>
      </div>
      <div class="dortmund-odds-form-grid">
        <el-form-item :prop="fieldProp('oddsCode')" class="dortmund-odds-form-field">
          <template slot="label">
            <dortmund-form-label label="倍率编码" tip="必填；1-23个字符，同一用户内唯一；可按来源时间自动生成 ODDS-YYYYMMDD-XXXXXX" />
          </template>
          <dortmund-code-input v-model="form.oddsCode" code-kind="odds" :date-value="form.sourceTime" :maxlength="limits.oddsCode"
            :disabled="disabled" placeholder="请输入或自动生成倍率编码" />
        </el-form-item>
        <el-form-item :prop="fieldProp('sourceTime')" class="dortmund-odds-form-field">
          <template slot="label">
            <dortmund-form-label label="来源时间" tip="必填；按yyyy-MM-dd HH:mm:ss选择，提交时自动转换为后端ISO时间格式" />
          </template>
          <el-date-picker v-model="form.sourceTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
            popper-class="dortmund-theme-popper" style="width: 100%" :disabled="disabled" placeholder="请选择来源时间" />
        </el-form-item>
        <el-form-item :prop="fieldProp('handicapValue')" class="dortmund-odds-form-field">
          <template slot="label">
            <dortmund-form-label label="让分值" tip="必填；范围-999999.99至999999.99，最多2位小数" />
          </template>
          <el-input v-model="form.handicapValue" :disabled="disabled" placeholder="如 -1" />
        </el-form-item>
      </div>
    </div>

    <slot></slot>

    <div class="dortmund-odds-form-card">
      <div class="dortmund-odds-form-header">
        <span class="dortmund-odds-form-chip"><i class="el-icon-set-up"></i></span>
        <span class="dortmund-odds-form-title">六类倍率权重</span>
        <span class="dortmund-odds-form-tip">权重范围为 0.0000-1.0000，为空时按 1.0000 参与计算</span>
      </div>
      <div class="dortmund-odds-matrix">
        <div class="dortmund-odds-matrix-item" v-for="(row, index) in oddsRows" :key="row.key">
          <div class="dortmund-odds-matrix-head">
            <dict-tag :options="dict.type.fx67ll_dortmund_odds_type || []" :value="row.type" />
            <span>第 {{ index + 1 }} 组</span>
          </div>
          <div class="dortmund-odds-matrix-fields">
            <el-form-item :prop="fieldProp(row.oddsField)" class="dortmund-odds-form-field">
              <template slot="label">
                <dortmund-form-label label="倍率" tip="必填；大于0且不超过999999.9999，最多4位小数" />
              </template>
              <el-input v-model="form[row.oddsField]" :disabled="disabled" placeholder="大于 0" />
            </el-form-item>
            <el-form-item :prop="fieldProp(row.weightField)" class="dortmund-odds-form-field">
              <template slot="label">
                <dortmund-form-label label="权重" tip="选填；0.0000-1.0000，最多4位小数；留空按1.0000处理" />
              </template>
              <el-input v-model="form[row.weightField]" :disabled="disabled" placeholder="空默认 1.0000" />
            </el-form-item>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRemark" class="dortmund-odds-form-card">
      <div class="dortmund-odds-form-header">
        <span class="dortmund-odds-form-chip"><i class="el-icon-chat-line-square"></i></span>
        <span class="dortmund-odds-form-title">记录说明</span>
        <span class="dortmund-odds-form-tip">选填，最多 1023 个字符</span>
      </div>
      <el-form-item :prop="fieldProp('oddsRemark')" class="dortmund-odds-form-field is-full">
        <template slot="label">
          <dortmund-form-label label="其他说明" tip="选填；最多1023个字符" />
        </template>
        <el-input v-model="form.oddsRemark" type="textarea" :rows="3" :maxlength="limits.oddsRemark" show-word-limit
          :disabled="disabled" placeholder="请输入其他说明（可空）" />
      </el-form-item>
    </div>
  </div>
</template>

<script>
import DortmundFormLabel from "@/views/fx67ll/dortmund/other/component/DortmundFormLabel/index";
import DortmundCodeInput from "@/views/fx67ll/dortmund/other/component/DortmundCodeInput/index";
import { ODDS_MATRIX_ROWS } from "@/views/fx67ll/dortmund/other/utils/odds";
import { DORTMUND_LIMITS } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundOddsForm",
  dicts: ["fx67ll_dortmund_odds_type"],
  components: { DortmundFormLabel, DortmundCodeInput },
  props: {
    // 由宿主页面持有的倍率表单对象，本组件只负责字段布局，不创建嵌套表单
    form: {
      type: Object,
      required: true,
    },
    // 嵌套在比赛编排表单时传入 newOdds. 前缀，保证 el-form 规则路径一致
    prefix: {
      type: String,
      default: "",
    },
    showRemark: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      limits: DORTMUND_LIMITS,
      oddsRows: ODDS_MATRIX_ROWS,
    };
  },
  methods: {
    fieldProp(field) {
      return `${this.prefix}${field}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-odds-form {
  --odds-form-accent: #2ecc71;
  --odds-form-accent-dark: #27ad60;
  --odds-form-accent-soft: #e7f8ee;
}

.dortmund-odds-form-card {
  padding: 16px 20px 8px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
}

.dortmund-odds-form-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.dortmund-odds-form-chip {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--odds-form-accent-dark);
  font-size: 14px;
  background: var(--odds-form-accent-soft);
  border-radius: 8px;
}

.dortmund-odds-form-title {
  color: #2b3a36;
  font-size: 14px;
  font-weight: 700;
}

.dortmund-odds-form-tip {
  padding: 1px 8px;
  color: #909399;
  font-size: 12px;
  background: #f0f4f2;
  border-radius: 999px;
}

.dortmund-odds-form-grid,
.dortmund-odds-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px;
  padding-bottom: 8px;
}

.dortmund-odds-matrix {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.dortmund-odds-matrix-item {
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

.dortmund-odds-matrix-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  >span {
    color: #8a9791;
    font-size: 12px;
  }
}

.dortmund-odds-matrix-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 10px;
}

/* 顶部字段标签：覆盖宿主表单的统一 label-width，窄屏下不会横向挤压输入框 */
.dortmund-odds-form-field {
  margin-bottom: 14px;

  &.is-full {
    margin-bottom: 8px;
  }

  ::v-deep .el-form-item__label {
    display: flex;
    float: none;
    align-items: center;
    width: 100% !important;
    padding: 0 0 6px;
    line-height: 20px;
    text-align: left;
    box-sizing: border-box;
  }

  ::v-deep .el-form-item__content {
    margin-left: 0 !important;
    line-height: normal;
  }
}

@media (max-width: 767px) {
  .dortmund-odds-form-card {
    padding: 14px 12px 6px;
  }

  .dortmund-odds-form-grid,
  .dortmund-odds-matrix {
    grid-template-columns: 1fr;
  }

  .dortmund-odds-form-tip {
    display: none;
  }
}
</style>
