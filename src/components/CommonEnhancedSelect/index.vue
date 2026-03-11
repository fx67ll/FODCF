<template>
  <el-select v-model="innerValue" :placeholder="placeholder" clearable filterable :filter-method="handleFilter"
    @change="handleChange" @keyup.enter.native="handleEnter" ref="selectRef">
    <el-option v-for="item in options" :key="item[valueKey]" :label="item[labelKey]" :value="item[valueKey]" />
  </el-select>
</template>

<script>
export default {
  name: "CommonEnhancedSelect", // 通用增强下拉组件
  props: {
    // 直接传入原生接口函数
    apiFunc: {
      type: Function,
      required: true,
      validator: (val) => typeof val === "function"
    },
    // 下拉选项的value字段
    valueKey: {
      type: String,
      default: "Id"
    },
    // 下拉选项的label字段
    labelKey: {
      type: String,
      default: "Name"
    },
    // 占位符
    placeholder: {
      type: String,
      default: "请选择"
    },
    // 接口额外传参（会合并到分页参数中，可选）
    queryParams: {
      type: Object,
      default: () => ({})
    },
    // 绑定值（v-model）
    value: {
      type: [String, Number, null],
      default: null
    },
    // 回车触发的回调函数（可选）
    enterCallback: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      innerValue: this.value, // 内部绑定值（解决v-model双向绑定）
      options: [], // 展示的下拉选项
      originOptions: [] // 原始接口数据（用于过滤）
    };
  },
  watch: {
    // 监听外部value变化，同步到内部
    value(newVal) {
      this.innerValue = newVal;
    },
    // 初始化时自动加载数据
    apiFunc: {
      immediate: true,
      handler() {
        this.loadOptions();
      }
    }
  },
  methods: {
    /** 加载下拉选项数据（直接调用传入的原生接口函数） */
    async loadOptions() {
      try {
        // 构造接口参数：分页（拉全量）+ 自定义传参
        const params = {
          pageNum: 1,
          pageSize: 1023, // 后期如果不够再修改调用接口方式
          ...this.queryParams
        };
        // 直接调用传入的原生接口函数
        const response = await this.apiFunc(params);
        // 适配返回格式：{rows: 数组, total: 数字}
        this.originOptions = response.rows || [];
        this.options = [...this.originOptions];
      } catch (error) {
        console.error("通用增强下拉加载数据失败：", error);
        this.options = [];
        this.originOptions = [];
      }
    },
    /** 前台模糊过滤（匹配label字段） */
    handleFilter(val) {
      if (!val) {
        this.options = [...this.originOptions];
        return;
      }
      // 不区分大小写模糊匹配label字段
      this.options = this.originOptions.filter(item => {
        const label = item[this.labelKey] || "";
        return label.toLowerCase().includes(val.toLowerCase());
      });
    },
    /** 下拉值变化，向父组件派发事件（实现v-model） */
    handleChange(val) {
      this.innerValue = val;
      this.$emit("input", val); // 触发v-model更新
      this.$emit("change", val); // 对外暴露change事件
    },
    /** 回车触发回调（适配原@keyup.enter.native逻辑） */
    handleEnter() {
      if (typeof this.enterCallback === "function") {
        this.enterCallback();
      }
    },
    /** 手动刷新下拉数据（供父组件调用） */
    refresh() {
      this.loadOptions();
    }
  }
};
</script>