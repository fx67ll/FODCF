<template>
  <el-drawer :visible.sync="drawerVisible" :title="title" direction="rtl" :size="drawerSize" append-to-body
    :custom-class="drawerClass" destroy-on-close :wrapper-closable="false" @open="handleOpen" @opened="handleOpened"
    @closed="handleClosed">
    <div class="list-selector-shell">
      <div class="list-selector-content">
        <div class="list-selector-guide">
          <span class="list-selector-guide-icon">
            <i :class="multiple ? 'el-icon-finished' : 'el-icon-circle-check'"></i>
          </span>
          <div>
            <strong>{{ multiple ? "可跨页选择多条记录" : "请选择一条记录" }}</strong>
            <p>{{ multiple ? "勾选结果会在分页切换和筛选时保留" : "单击行完成选中，双击行可直接确认" }}</p>
          </div>
        </div>

        <el-form v-if="searchFields.length || $slots.search" :model="searchForm" size="small" inline
          class="list-selector-search" label-width="76px">
          <el-form-item v-for="field in visibleSearchFields" :key="field.key" :label="field.label">
            <el-select v-if="field.type === 'select'" v-model="searchForm[field.key]" :placeholder="field.placeholder"
              popper-class="dortmund-theme-popper" clearable filterable class="list-selector-search-control">
              <el-option v-for="item in field.options || []" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
            <el-date-picker v-else-if="field.type === 'datetimerange'" v-model="searchForm[field.key]"
              type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss" range-separator="-"
              :start-placeholder="field.startPlaceholder || '开始时间'" :end-placeholder="field.endPlaceholder || '结束时间'"
              clearable class="list-selector-search-control is-range" />
            <el-input v-else v-model="searchForm[field.key]" :placeholder="field.placeholder" clearable
              class="list-selector-search-control" @keyup.enter.native="handleSearch" />
          </el-form-item>
          <!-- 复杂控件由业务选择器注入；标准字段仍由 searchFields 配置，避免通用组件耦合业务组件。 -->
          <slot name="search" :search-form="searchForm" :search="handleSearch" :reset="handleReset" />
          <el-form-item class="list-selector-search-actions">
            <el-button type="primary" icon="el-icon-search" :loading="loading" @click="handleSearch">搜索</el-button>
            <el-button icon="el-icon-refresh" :disabled="loading" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>

        <div v-if="loadError" class="list-selector-error" role="alert">
          <i class="el-icon-warning-outline"></i>
          <span>候选数据加载失败，请检查网络后重试。</span>
          <el-button type="text" icon="el-icon-refresh" @click="loadRows">重新加载</el-button>
        </div>

        <transition name="selector-preview">
          <div v-if="selectedRows.length" class="list-selector-preview">
            <span class="list-selector-preview-title">
              <i class="el-icon-finished"></i>已选 {{ selectedRows.length }} 项
            </span>
            <div class="list-selector-preview-items">
              <el-tag v-for="row in selectedRows" :key="row[valueKey]" closable size="small"
                @close="handleRemoveSelected(row)">{{ getRowLabel(row) }}</el-tag>
            </div>
            <el-button v-if="multiple" type="text" class="list-selector-clear"
              @click="handleClearSelected">清空</el-button>
          </div>
        </transition>

        <div ref="tableRegion" class="list-selector-table-region">
          <el-table ref="selectorTable" v-loading="loading" :data="rows" :row-key="valueKey" size="small"
            :height="tableHeight" class="list-selector-table" highlight-current-row @row-click="handleRowClick"
            @row-dblclick="handleRowDoubleClick" @selection-change="handleSelectionChange">
            <el-table-column v-if="multiple" type="selection" width="46" align="center" reserve-selection
              :selectable="isRowSelectable" />
            <el-table-column v-else width="46" align="center">
              <template slot-scope="scope">
                <el-radio :value="selectedValue" :label="scope.row[valueKey]" :disabled="!isRowSelectable(scope.row)"
                  class="list-selector-radio">
                  <span></span>
                </el-radio>
              </template>
            </el-table-column>
            <el-table-column v-for="column in columns" :key="column.prop" :label="column.label" :prop="column.prop"
              :min-width="column.minWidth || 120" align="center" show-overflow-tooltip>
              <template slot-scope="scope">{{ formatColumn(column, scope.row) }}</template>
            </el-table-column>
            <el-table-column v-if="showDetail" label="操作" width="68" align="center" fixed="right">
              <template slot-scope="scope">
                <el-tooltip content="查看详情" placement="top" popper-class="dortmund-theme-popper">
                  <button type="button" class="list-selector-detail" aria-label="查看详情"
                    @click.stop="$emit('detail', scope.row)">
                    <i class="el-icon-document"></i>
                  </button>
                </el-tooltip>
              </template>
            </el-table-column>
            <template slot="empty">
              <div class="list-selector-empty">
                <i :class="loadError ? 'el-icon-warning-outline' : 'el-icon-search'"></i>
                <p>{{ loadError ? "候选数据暂不可用" : "未找到可选择的记录" }}</p>
              </div>
            </template>
          </el-table>
        </div>
        <pagination v-show="total > 0" :total="total" :page.sync="pageNum" :limit.sync="internalPageSize"
          :page-sizes="pageSizes" :layout="paginationLayout" :pager-count="paginationPagerCount" :auto-scroll="false"
          :popper-class="paginationPopperClass" class="list-selector-pagination" @pagination="loadRows" />
      </div>

      <div class="list-selector-footer">
        <span class="list-selector-footer-summary">
          {{ selectedRows.length ? `已选择 ${selectedRows.length}${maxCount > 0 ? ` / ${maxCount}` : ""} 项` : "尚未选择" }}
        </span>
        <div class="list-selector-footer-actions">
          <el-button class="dortmund-theme-cancel" @click="handleCancel">取 消</el-button>
          <el-button type="success" class="dortmund-theme-confirm" :disabled="!selectedRows.length"
            @click="handleConfirm">确认选择</el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "ListSelectorModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    apiFunc: {
      type: Function,
      required: true,
    },
    queryParams: {
      type: Object,
      default: () => ({}),
    },
    columns: {
      type: Array,
      default: () => [],
    },
    searchFields: {
      type: Array,
      default: () => [],
    },
    selectedItems: {
      type: Array,
      default: () => [],
    },
    valueKey: {
      type: String,
      default: "id",
    },
    labelKey: {
      type: String,
      default: "name",
    },
    labelFormatter: {
      type: Function,
      default: null,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    maxCount: {
      type: Number,
      default: 0,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100],
    },
    // 分页每页条数下拉挂载到 body，由调用方传入主题弹层类名；保持通用组件不绑定具体业务主题。
    paginationPopperClass: {
      type: String,
      default: "",
    },
    // 业务页面可按列表字段密度覆盖标准抽屉宽度；移动端仍自动使用全屏/自适应宽度。
    drawerWidth: {
      type: String,
      default: "1040px",
    },
    showDetail: {
      type: Boolean,
      default: false,
    },
    rowSelectable: {
      type: Function,
      default: null,
    },
    rowSelectableMessage: {
      type: String,
      default: "",
    },
    // 子详情侧弹层打开时，当前选择器向左错位，避免完全遮挡并体现层级。
    shifted: {
      type: Boolean,
      default: false,
    },
    // 业务选择器开启后，筛选值变化自动刷新候选；搜索按钮仍保留用于手动刷新。
    autoQuery: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      rows: [],
      total: 0,
      pageNum: 1,
      internalPageSize: this.pageSize,
      searchForm: this.buildSearchForm(),
      selectedRows: [],
      requestSerial: 0,
      syncingSelection: false,
      loadError: false,
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1440,
      tableHeight: 320,
      tableResizeObserver: null,
      autoSearchTimer: null,
      autoSearchSuppressed: false,
    };
  },
  computed: {
    drawerClass() {
      return `list-selector-drawer${this.shifted ? " is-shifted" : ""}`;
    },
    // type=slot 仍初始化 searchForm，但具体控件由业务侧 search 插槽渲染。
    visibleSearchFields() {
      return (this.searchFields || []).filter((field) => field.type !== "slot");
    },
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    drawerSize() {
      if (this.viewportWidth < 768) {
        return "100%";
      }
      if (this.viewportWidth < 1200) {
        return "92%";
      }
      return this.drawerWidth || "1040px";
    },
    paginationLayout() {
      return this.viewportWidth < 768
        ? "sizes, prev, pager, next"
        : "total, sizes, prev, pager, next, jumper";
    },
    paginationPagerCount() {
      return this.viewportWidth < 768 ? 5 : 7;
    },
    selectedValue() {
      const row = this.selectedRows[0];
      return row ? row[this.valueKey] : null;
    },
  },
  watch: {
    searchForm: {
      deep: true,
      handler() {
        this.scheduleAutoSearch();
      },
    },
    "selectedRows.length"() {
      this.scheduleTableMeasure();
    },
    loadError() {
      this.scheduleTableMeasure();
    },
  },
  mounted() {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleViewportResize);
    }
  },
  beforeDestroy() {
    this.clearAutoSearchTimer();
    this.disconnectTableResizeObserver();
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleViewportResize);
    }
  },
  methods: {
    buildSearchForm() {
      return (this.searchFields || []).reduce((result, field) => {
        result[field.key] = typeof field.defaultValueFactory === "function"
          ? field.defaultValueFactory()
          : (field.defaultValue !== undefined ? field.defaultValue : null);
        return result;
      }, {});
    },
    handleOpen() {
      this.suppressAutoSearchOnce();
      this.handleViewportResize();
      this.pageNum = 1;
      this.internalPageSize = this.pageSize;
      this.searchForm = this.buildSearchForm();
      const selectedMap = new Map();
      (this.selectedItems || []).filter(Boolean).forEach((row) => {
        const rowId = row[this.valueKey];
        if (rowId !== null && rowId !== undefined) {
          selectedMap.set(rowId, row);
        }
      });
      this.selectedRows = [...selectedMap.values()];
      if (this.maxCount > 0 && this.selectedRows.length > this.maxCount) {
        this.selectedRows = this.selectedRows.slice(0, this.maxCount);
        this.$modal.msgWarning(`最多只能选择 ${this.maxCount} 项，已保留前 ${this.maxCount} 项`);
      }
      this.loadError = false;
      this.loadRows();
      this.scheduleTableMeasure();
    },
    handleClosed() {
      this.requestSerial += 1;
      this.loading = false;
      this.clearAutoSearchTimer();
      this.autoSearchSuppressed = false;
      this.disconnectTableResizeObserver();
    },
    handleOpened() {
      this.connectTableResizeObserver();
      this.scheduleTableMeasure();
    },
    connectTableResizeObserver() {
      this.disconnectTableResizeObserver();
      const ResizeObserverCtor = typeof window !== "undefined" ? window.ResizeObserver : null;
      if (!ResizeObserverCtor || !this.$refs.tableRegion) {
        return;
      }
      this.tableResizeObserver = new ResizeObserverCtor(() => this.scheduleTableMeasure());
      this.tableResizeObserver.observe(this.$refs.tableRegion);
    },
    disconnectTableResizeObserver() {
      if (this.tableResizeObserver) {
        this.tableResizeObserver.disconnect();
        this.tableResizeObserver = null;
      }
    },
    scheduleTableMeasure() {
      this.$nextTick(() => {
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => this.measureTableHeight());
          return;
        }
        this.measureTableHeight();
      });
    },
    measureTableHeight() {
      const region = this.$refs.tableRegion;
      if (!region) {
        return;
      }
      const height = Math.floor(region.getBoundingClientRect().height);
      if (height <= 0) {
        return;
      }
      const nextHeight = Math.max(120, height);
      if (Math.abs(nextHeight - this.tableHeight) <= 1) {
        return;
      }
      this.tableHeight = nextHeight;
      this.$nextTick(() => {
        if (this.$refs.selectorTable) {
          this.$refs.selectorTable.doLayout();
        }
      });
    },
    handleViewportResize() {
      if (typeof window === "undefined") {
        return;
      }
      this.viewportWidth = window.innerWidth;
      this.scheduleTableMeasure();
    },
    loadRows() {
      const requestSerial = ++this.requestSerial;
      this.loading = true;
      this.loadError = false;
      const query = {
        pageNum: this.pageNum,
        pageSize: this.internalPageSize,
        ...this.queryParams,
        ...this.buildQuerySearch(),
      };
      Promise.resolve().then(() => {
        if (typeof this.apiFunc !== "function") {
          throw new Error("selector api is unavailable");
        }
        return this.apiFunc(query);
      }).then((response) => {
        if (requestSerial !== this.requestSerial) {
          return;
        }
        const result = response || {};
        const hasTopLevelList = Array.isArray(result.rows) || result.total !== undefined;
        const payload = hasTopLevelList ? result : result.data;
        this.rows = Array.isArray(payload)
          ? payload
          : (payload && Array.isArray(payload.rows) ? payload.rows : []);
        this.total = Array.isArray(payload)
          ? payload.length
          : (payload && Number(payload.total)) || this.rows.length;
        this.syncTableSelection();
        this.scheduleTableMeasure();
      }).catch(() => {
        if (requestSerial !== this.requestSerial) {
          return;
        }
        this.rows = [];
        this.total = 0;
        this.loadError = true;
      }).finally(() => {
        if (requestSerial === this.requestSerial) {
          this.loading = false;
        }
      });
    },
    handleSearch() {
      this.pageNum = 1;
      this.loadRows();
    },
    scheduleAutoSearch() {
      if (!this.autoQuery || !this.visible || this.autoSearchSuppressed) {
        return;
      }
      this.clearAutoSearchTimer();
      this.autoSearchTimer = setTimeout(() => {
        this.autoSearchTimer = null;
        if (!this.autoSearchSuppressed) {
          this.handleSearch();
        }
      }, 180);
    },
    clearAutoSearchTimer() {
      if (this.autoSearchTimer) {
        clearTimeout(this.autoSearchTimer);
        this.autoSearchTimer = null;
      }
    },
    // 打开与重置会程序化替换筛选对象，跳过该次深度监听，避免和显式加载重复请求。
    suppressAutoSearchOnce() {
      this.autoSearchSuppressed = true;
      this.clearAutoSearchTimer();
      this.$nextTick(() => {
        setTimeout(() => {
          this.autoSearchSuppressed = false;
        }, 0);
      });
    },
    buildQuerySearch() {
      const result = { ...this.searchForm };
      (this.searchFields || []).forEach((field) => {
        if (field.type !== "datetimerange") {
          return;
        }
        const range = this.searchForm[field.key];
        delete result[field.key];
        const rangeKeys = field.rangeKeys || [];
        if (Array.isArray(range) && range.length === 2 && rangeKeys.length === 2) {
          result[rangeKeys[0]] = range[0];
          result[rangeKeys[1]] = range[1];
        }
      });
      return result;
    },
    handleReset() {
      this.suppressAutoSearchOnce();
      this.searchForm = this.buildSearchForm();
      this.handleSearch();
    },
    handleRowClick(row, column) {
      if (!this.isRowSelectable(row)) {
        this.notifyRowDisabled();
        return;
      }
      if (this.multiple) {
        if (column && column.type === "selection") {
          return;
        }
        this.$refs.selectorTable && this.$refs.selectorTable.toggleRowSelection(row);
        return;
      }
      this.selectedRows = [row];
    },
    handleRowDoubleClick(row) {
      if (!this.isRowSelectable(row)) {
        this.notifyRowDisabled();
        return;
      }
      if (this.multiple) {
        return;
      }
      this.selectedRows = [row];
      this.handleConfirm();
    },
    handleSelectionChange(rows) {
      if (!this.multiple || this.syncingSelection) {
        return;
      }
      const currentPageIds = new Set(this.rows.map((row) => row[this.valueKey]));
      const retainedRows = this.selectedRows.filter((row) => !currentPageIds.has(row[this.valueKey]));
      const selectedMap = new Map([...retainedRows, ...rows].map((row) => [row[this.valueKey], row]));
      let selectedRows = [...selectedMap.values()];
      if (this.maxCount > 0 && selectedRows.length > this.maxCount) {
        selectedRows = selectedRows.slice(0, this.maxCount);
        this.$modal.msgWarning(`最多只能选择 ${this.maxCount} 项`);
        this.$nextTick(() => this.syncTableSelection());
      }
      this.selectedRows = selectedRows;
    },
    isRowSelectable(row) {
      if (typeof this.rowSelectable !== "function") {
        return true;
      }
      try {
        return this.rowSelectable(row) !== false;
      } catch (error) {
        return true;
      }
    },
    notifyRowDisabled() {
      if (this.rowSelectableMessage) {
        this.$modal.msgWarning(this.rowSelectableMessage);
      }
    },
    syncTableSelection() {
      if (!this.$refs.selectorTable) {
        return;
      }
      if (!this.multiple) {
        const selectedId = this.selectedValue;
        const selectedRow = this.rows.find((row) => row[this.valueKey] === selectedId);
        this.$nextTick(() => this.$refs.selectorTable && this.$refs.selectorTable.setCurrentRow(selectedRow || null));
        return;
      }
      const selectedIds = this.selectedRows.map((row) => row[this.valueKey]);
      this.$nextTick(() => {
        this.syncingSelection = true;
        this.$refs.selectorTable.clearSelection();
        this.rows.forEach((row) => {
          if (selectedIds.includes(row[this.valueKey])) {
            this.$refs.selectorTable.toggleRowSelection(row, true);
          }
        });
        this.$nextTick(() => {
          this.syncingSelection = false;
        });
      });
    },
    handleRemoveSelected(row) {
      this.selectedRows = this.selectedRows.filter((item) => item[this.valueKey] !== row[this.valueKey]);
      const target = this.rows.find((item) => item[this.valueKey] === row[this.valueKey]);
      if (this.multiple && target && this.$refs.selectorTable) {
        this.$refs.selectorTable.toggleRowSelection(target, false);
      } else if (!this.multiple && this.$refs.selectorTable) {
        this.$refs.selectorTable.setCurrentRow(null);
      }
    },
    handleClearSelected() {
      this.selectedRows = [];
      if (this.$refs.selectorTable) {
        this.syncingSelection = true;
        this.$refs.selectorTable.clearSelection();
        this.$nextTick(() => {
          this.syncingSelection = false;
        });
      }
    },
    handleConfirm() {
      if (this.maxCount > 0 && this.selectedRows.length > this.maxCount) {
        this.$modal.msgWarning(`最多只能选择 ${this.maxCount} 项`);
        return;
      }
      const value = this.multiple ? this.selectedRows.map((row) => row[this.valueKey]) : this.selectedValue;
      this.$emit("input", value);
      this.$emit("confirm", this.multiple ? [...this.selectedRows] : this.selectedRows[0]);
      this.drawerVisible = false;
    },
    handleCancel() {
      this.drawerVisible = false;
    },
    getRowLabel(row) {
      if (!row) {
        return "-";
      }
      try {
        if (this.labelFormatter) {
          return this.labelFormatter(row);
        }
        return row[this.labelKey] || row[this.valueKey] || "-";
      } catch (error) {
        return row[this.labelKey] || row[this.valueKey] || "-";
      }
    },
    formatColumn(column, row) {
      try {
        if (column.formatter) {
          return column.formatter(row);
        }
        const value = row[column.prop];
        return value !== null && value !== undefined && value !== "" ? value : "-";
      } catch (error) {
        return "-";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.list-selector-shell {
  --selector-theme: var(--current-color, #2ecc71);
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f7f9f8;
  overflow: hidden;
}

.list-selector-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 16px 20px 0;
  overflow: hidden;
}

.list-selector-content>.list-selector-guide,
.list-selector-content>.list-selector-search,
.list-selector-content>.list-selector-error,
.list-selector-content>.list-selector-preview {
  flex-shrink: 0;
}

.list-selector-guide {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 12px;
  color: #52615a;
  background: #fff;
  border: 1px solid #e5ebe7;
  border-radius: 12px;

  strong {
    display: block;
    margin-bottom: 2px;
    font-size: 13px;
    color: #26362f;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: #8a9791;
  }
}

.list-selector-guide-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  margin-right: 11px;
  color: var(--selector-theme);
  background: #eef9f3;
  border-radius: 10px;
}

.list-selector-search {
  padding: 13px 14px 1px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e5ebe7;
  border-radius: 12px;
}

.list-selector-search-control {
  width: 190px;
}

.list-selector-search-control.is-range {
  width: 330px;
}

.list-selector-detail {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #347f62;
  cursor: pointer;
  background: transparent;
  border: 1px solid #e4ebe7;
  border-radius: 8px;
  outline: none;
  transition: color .18s ease, background-color .18s ease, border-color .18s ease,
    box-shadow .18s ease, transform .18s ease;

  i {
    font-size: 14px;
    transition: transform .22s cubic-bezier(.34, 1.4, .64, 1);
  }

  &:hover {
    color: #2f7459;
    background: #edf9f2;
    border-color: #bfe2cd;
    box-shadow: 0 4px 10px rgba(47, 132, 96, .12);
  }

  &:hover i {
    transform: scale(1.16);
  }

  &:active {
    transform: scale(.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(72, 127, 115, .42);
    outline-offset: 2px;
  }
}

.list-selector-search-actions {
  margin-left: 2px;
}

.list-selector-error {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #a66a18;
  background: #fdf6ec;
  border: 1px solid #f7dfb7;
  border-radius: 10px;

  >i {
    margin-right: 7px;
    font-size: 15px;
  }

  .el-button {
    padding: 0;
    margin-left: auto;
  }
}

.list-selector-preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-height: 120px;
  padding: 9px 12px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dcebe3;
  border-left: 3px solid var(--selector-theme);
  border-radius: 10px;
}

.list-selector-preview-title {
  flex-shrink: 0;
  padding-top: 2px;
  line-height: 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--selector-theme);
}

.list-selector-preview-items {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 72px;
  min-width: 0;
  padding-right: 4px;
  overflow-y: auto;

  ::v-deep .el-tag {
    max-width: 100%;
    height: auto;
    min-height: 24px;
    padding-top: 2px;
    padding-bottom: 2px;
    color: var(--selector-theme);
    background: #e7f8ee;
    border-color: #bfe8d1;
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  ::v-deep .el-tag .el-tag__close {
    color: var(--selector-theme);

    &:hover {
      color: #fff;
      background-color: var(--selector-theme);
    }
  }
}

.list-selector-clear {
  align-self: flex-start;
  flex-shrink: 0;
  padding: 4px;
}

.list-selector-table-region {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 12px;
}

.list-selector-table {
  width: 100%;
  background: #fff;
  border: 1px solid #e5ebe7;
  border-radius: 12px;

  ::v-deep th.el-table__cell {
    color: #53635b;
    background: #f3f7f5;
  }

  ::v-deep .el-table__row {
    cursor: pointer;
  }

  ::v-deep .el-table__row.current-row>td.el-table__cell {
    background: #edf8f2;
  }
}

.list-selector-pagination {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  height: auto !important;
  min-width: 0;
  margin: 8px 0 12px !important;
  padding: 0 !important;
  overflow: visible;
  background: transparent;

  ::v-deep .el-pagination {
    position: static;
    right: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    max-width: 100%;
    margin: 0;
    padding: 0;
    white-space: normal;
  }

  ::v-deep .el-pagination>* {
    margin-left: 0;
  }

  ::v-deep .el-pagination .el-pager {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  ::v-deep .el-pagination .el-pager li,
  ::v-deep .el-pagination button {
    margin: 0;
  }

  ::v-deep .el-pagination__total,
  ::v-deep .el-pagination__jump {
    margin: 0;
  }

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled) {
    color: #52615a;
    background-color: #f7faf8;
    border: 1px solid #e2ebe6;
  }

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled):not(.active):hover {
    color: var(--selector-theme);
    background-color: #e7f8ee;
    border-color: #bfe8d1;
  }

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled).active {
    color: #fff;
    background-color: var(--selector-theme);
    border-color: var(--selector-theme);
  }

  ::v-deep .el-pagination.is-background .btn-prev,
  ::v-deep .el-pagination.is-background .btn-next {
    color: #52615a;
    background-color: #f7faf8;
    border: 1px solid #e2ebe6;
  }

  ::v-deep .el-pagination.is-background .btn-prev:not(:disabled):hover,
  ::v-deep .el-pagination.is-background .btn-next:not(:disabled):hover {
    color: var(--selector-theme);
    background-color: #e7f8ee;
    border-color: #bfe8d1;
  }

  ::v-deep .el-pagination__jump .el-input__inner:focus,
  ::v-deep .el-pagination__sizes .el-input__inner:focus {
    border-color: var(--selector-theme);
  }
}

.list-selector-radio {
  margin-right: 0;

  ::v-deep .el-radio__label {
    display: none;
  }
}

.list-selector-empty {
  padding: 24px 0;

  i {
    font-size: 26px;
    color: #b8c2bd;
  }

  p {
    margin: 7px 0 0;
    color: #909b96;
  }
}

.list-selector-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 14px 20px;
  background: #fff;
  border-top: 1px solid #e3e9e6;
  box-shadow: 0 -5px 18px rgba(38, 54, 47, 0.06);
}

.list-selector-footer-summary {
  font-size: 12px;
  color: #89958f;
}

.list-selector-footer-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.selector-preview-enter-active,
.selector-preview-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.selector-preview-enter,
.selector-preview-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 767px) {
  .list-selector-content {
    padding: 12px 12px 0;
  }

  .list-selector-search {
    padding: 12px 10px 0;
  }

  .list-selector-search-control {
    width: 100%;
  }

  .list-selector-search ::v-deep .el-form-item {
    width: 100%;
    margin-right: 0;
  }

  .list-selector-search ::v-deep .el-form-item__content {
    width: calc(100% - 76px);
  }

  .list-selector-search-actions ::v-deep .el-form-item__content {
    width: 100%;
    padding-left: 76px;
  }

  .list-selector-preview {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .list-selector-preview-title {
    width: 100%;
  }

  .list-selector-footer-summary {
    display: none;
  }

  .list-selector-footer {
    justify-content: flex-end;
    padding: 12px;
  }

  .list-selector-footer-actions {
    width: 100%;
  }

  .list-selector-footer-actions .el-button {
    flex: 1;
  }

  .list-selector-footer-actions .el-button+.el-button {
    margin-left: 8px;
  }

  .list-selector-pagination {
    justify-content: center;
    margin: 6px 0 10px !important;

    ::v-deep .el-pagination {
      width: 100%;
      justify-content: center;
      row-gap: 6px;
    }
  }
}

@media (max-height: 720px) {
  .list-selector-content {
    padding-top: 10px;
  }

  .list-selector-guide {
    display: none;
  }

  .list-selector-search {
    padding-top: 10px;
    margin-bottom: 8px;
  }

  .list-selector-error {
    margin-bottom: 8px;
  }

  .list-selector-preview {
    max-height: 96px;
    margin-bottom: 8px;
  }

  .list-selector-preview-items {
    max-height: 58px;
  }

  .list-selector-pagination {
    margin: 6px 0 8px !important;
  }
}
</style>

<style lang="scss">
.list-selector-drawer.el-drawer {
  border-radius: 14px 0 0 14px;
  box-shadow: -12px 0 36px rgba(31, 61, 46, 0.16);
  transition: right 0.22s ease;

  &.is-shifted {
    right: 18px;
  }

  .el-drawer__header {
    padding: 18px 22px 15px;
    margin-bottom: 0;
    color: #26362f;
    font-weight: 700;
    border-bottom: 1px solid #e3e9e6;
  }

  .el-drawer__body {
    overflow: hidden;
  }
}

@media (max-width: 767px) {
  .list-selector-drawer.el-drawer {
    border-radius: 0;

    &.is-shifted {
      right: 0;
    }

    .el-drawer__header {
      padding: 16px 14px 13px;
    }
  }
}
</style>
