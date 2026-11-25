<template>
  <el-popover v-if="permitted" v-model="visible" placement="bottom-end" width="330" trigger="click"
    popper-class="dortmund-export-menu-popper">
    <div class="export-menu-panel">
      <div class="export-menu-head">
        <span class="export-menu-mark"><i class="el-icon-download"></i></span>
        <div>
          <strong>{{ title }}导出</strong>
          <p>导出当前筛选条件和账号可见范围内的全部数据</p>
        </div>
      </div>
      <button v-for="option in options" :key="option.type" type="button" class="export-option"
        :class="`is-${option.type}`" @click="handleExport(option.type)">
        <span class="export-option-icon"><i :class="option.icon"></i></span>
        <span class="export-option-copy">
          <strong>{{ option.label }}</strong>
          <small>{{ option.description }}</small>
        </span>
        <i class="el-icon-arrow-right export-option-arrow"></i>
      </button>
      <p class="export-menu-tip"><i class="el-icon-info"></i>JSON 与 SQL 不会截断分页，导出范围为筛选结果全量。</p>
    </div>
    <el-button slot="reference" type="warning" plain size="mini" icon="el-icon-download" :loading="loading">
      {{ buttonLabel }}
    </el-button>
  </el-popover>
</template>

<script>
import { checkPermi } from "@/utils/common/permission";
import { download } from "@/utils/common/request";

export default {
  name: "DortmundExportMenu",
  props: {
    title: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    permission: {
      type: String,
      default: "",
    },
    params: {
      type: [Object, Function],
      default: () => ({}),
    },
    filePrefix: {
      type: String,
      default: "dortmund-export",
    },
    buttonLabel: {
      type: String,
      default: "导出",
    },
  },
  data() {
    return {
      visible: false,
      loading: false,
    };
  },
  computed: {
    permitted() {
      return !this.permission || checkPermi([this.permission]);
    },
    options() {
      return [
        { type: "excel", label: "Excel 工作簿", description: "适合人工查看、核对和二次整理", icon: "el-icon-document" },
        { type: "json", label: "JSON 数据", description: "保留业务字段结构，适合程序交换与备份", icon: "el-icon-document-copy" },
        { type: "sql", label: "插入 SQL", description: "生成可审阅的 INSERT 语句，按业务表字段输出", icon: "el-icon-coin" },
      ];
    },
  },
  methods: {
    resolveParams() {
      const params = typeof this.params === "function" ? this.params() : this.params;
      return { ...(params || {}) };
    },
    handleExport(type) {
      if (this.loading) return;
      this.visible = false;
      this.loading = true;
      // 文件名后缀与后端 Content-Type 同步；导出接口继续沿用原有权限和当前用户数据范围。
      const extension = type === "excel" ? "xlsx" : type;
      const timestamp = this.formatTimestamp(new Date());
      download(this.endpoint, { ...this.resolveParams(), exportType: type },
        `${this.filePrefix}-${timestamp}.${extension}`).finally(() => {
          this.loading = false;
        });
    },
    formatTimestamp(date) {
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.export-menu-panel {
  padding: 2px;
}

.export-menu-head {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  padding: 7px 8px 12px;
  border-bottom: 1px solid #e8f1eb;

  strong {
    display: block;
    font-size: 14px;
    color: #273c30;
  }

  p {
    margin: 4px 0 0;
    font-size: 11px;
    line-height: 1.55;
    color: #84948a;
  }
}

.export-menu-mark {
  display: flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #fff;
  background: linear-gradient(135deg, #2fa866, #63c98c);
  border-radius: 9px;
  box-shadow: 0 5px 12px rgba(47, 168, 102, .22);
}

.export-option {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  padding: 11px 9px;
  margin-top: 5px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: #f3fbf6;
    border-color: #ccebd9;
    box-shadow: 0 6px 16px rgba(47, 168, 102, .1);
  }

  &:active {
    background: #eaf8f0;
  }
}

.export-option-icon {
  display: flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  border-radius: 9px;
}

.is-excel .export-option-icon {
  color: #2d8f57;
  background: #e9f8ef;
}

.is-json .export-option-icon {
  color: #3979b8;
  background: #eaf4ff;
}

.is-sql .export-option-icon {
  color: #9a7134;
  background: #fff6e6;
}

.export-option-copy {
  flex: 1;
  min-width: 0;

  strong,
  small {
    display: block;
  }

  strong {
    font-size: 13px;
    color: #2f4337;
  }

  small {
    margin-top: 3px;
    font-size: 11px;
    line-height: 1.5;
    color: #87978d;
  }
}

.export-option-arrow {
  font-size: 12px;
  color: #b2c0b7;
}

.export-menu-tip {
  display: flex;
  gap: 5px;
  padding: 9px 8px 3px;
  margin: 4px 0 0;
  font-size: 10px;
  line-height: 1.55;
  color: #97a59c;
  border-top: 1px dashed #e6efe9;
}
</style>
