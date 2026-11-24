/**
 * dort 模块列表筛选自动查询混入。
 * 下拉、日期和业务选择器变化后立即查询；文本输入使用短延迟防抖，搜索按钮仍保留用于手动刷新。
 */
export default {
  data() {
    return {
      dortmundFilterAutoTimer: null,
    };
  },
  beforeDestroy() {
    if (this.dortmundFilterAutoTimer) {
      clearTimeout(this.dortmundFilterAutoTimer);
      this.dortmundFilterAutoTimer = null;
    }
  },
  methods: {
    handleFilterChange() {
      this.scheduleDortmundFilterQuery(0);
    },
    handleFilterInput() {
      this.scheduleDortmundFilterQuery(320);
    },
    scheduleDortmundFilterQuery(delay = 0) {
      if (this.dortmundFilterAutoTimer) {
        clearTimeout(this.dortmundFilterAutoTimer);
      }
      this.dortmundFilterAutoTimer = setTimeout(() => {
        this.dortmundFilterAutoTimer = null;
        if (typeof this.handleQuery === "function") {
          this.handleQuery();
        }
      }, delay);
    },
  },
};
