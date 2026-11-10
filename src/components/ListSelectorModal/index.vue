<template>
  <el-dialog :visible.sync="dialogVisible" :title="title" width="1080px" append-to-body top="7vh"
    custom-class="list-selector-dialog" destroy-on-close @open="handleOpen">
    <el-form :model="searchForm" size="small" inline class="list-selector-search" label-width="82px">
      <el-form-item v-for="field in searchFields" :key="field.key" :label="field.label">
        <el-select v-if="field.type === 'select'" v-model="searchForm[field.key]" :placeholder="field.placeholder"
          clearable filterable style="width: 200px">
          <el-option v-for="item in field.options || []" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-else v-model="searchForm[field.key]" :placeholder="field.placeholder" clearable
          @keyup.enter.native="handleSearch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="list-selector-preview" v-if="selectedRows.length">
      <span class="list-selector-preview-title">
        <i class="el-icon-finished"></i>已选 {{ selectedRows.length }} 项
      </span>
      <div class="list-selector-preview-items">
        <el-tag v-for="row in selectedRows" :key="row[valueKey]" closable size="small"
          @close="handleRemoveSelected(row)">{{ getRowLabel(row) }}</el-tag>
      </div>
    </div>

    <el-table ref="selectorTable" v-loading="loading" :data="rows" :row-key="valueKey" size="small" height="420"
      highlight-current-row @row-click="handleRowClick" @selection-change="handleSelectionChange">
      <el-table-column v-if="multiple" type="selection" width="42" align="center" reserve-selection />
      <el-table-column v-for="column in columns" :key="column.prop" :label="column.label" :prop="column.prop"
        :min-width="column.minWidth || 120" align="center" show-overflow-tooltip>
        <template slot-scope="scope">{{ formatColumn(column, scope.row) }}</template>
      </el-table-column>
      <template slot="empty">
        <i class="el-icon-search"></i>
        <p>未找到可选择的记录</p>
      </template>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="pageNum" :limit.sync="pageSize"
      layout="total, prev, pager, next, jumper" @pagination="loadRows" />

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" :disabled="!selectedRows.length" @click="handleConfirm">确 定</el-button>
    </div>
  </el-dialog>
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
    pageSize: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      loading: false,
      rows: [],
      total: 0,
      pageNum: 1,
      pageSize: this.pageSize,
      searchForm: this.buildSearchForm(),
      selectedRows: [],
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    selectedValue() {
      const row = this.selectedRows[0];
      return row ? row[this.valueKey] : null;
    },
  },
  methods: {
    buildSearchForm() {
      return (this.searchFields || []).reduce((result, field) => {
        result[field.key] = field.defaultValue !== undefined ? field.defaultValue : null;
        return result;
      }, {});
    },
    handleOpen() {
      this.pageNum = 1;
      this.pageSize = this.pageSize;
      this.searchForm = this.buildSearchForm();
      this.selectedRows = (this.selectedItems || []).filter(Boolean);
      this.loadRows();
    },
    loadRows() {
      this.loading = true;
      const query = {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        ...this.queryParams,
        ...this.searchForm,
      };
      Promise.resolve(this.apiFunc(query)).then((response) => {
        this.rows = response.rows || [];
        this.total = response.total || 0;
        this.syncTableSelection();
      }).catch(() => {
        this.rows = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    handleSearch() {
      this.pageNum = 1;
      this.loadRows();
    },
    handleReset() {
      this.searchForm = this.buildSearchForm();
      this.handleSearch();
    },
    handleRowClick(row) {
      if (this.multiple) {
        this.$refs.selectorTable && this.$refs.selectorTable.toggleRowSelection(row);
        return;
      }
      this.selectedRows = [row];
    },
    handleSelectionChange(rows) {
      if (!this.multiple) {
        return;
      }
      this.selectedRows = rows;
    },
    syncTableSelection() {
      if (!this.multiple || !this.$refs.selectorTable) {
        return;
      }
      const selectedIds = this.selectedRows.map((row) => row[this.valueKey]);
      this.$nextTick(() => {
        this.$refs.selectorTable.clearSelection();
        this.rows.forEach((row) => {
          if (selectedIds.includes(row[this.valueKey])) {
            this.$refs.selectorTable.toggleRowSelection(row, true);
          }
        });
      });
    },
    handleRemoveSelected(row) {
      this.selectedRows = this.selectedRows.filter((item) => item[this.valueKey] !== row[this.valueKey]);
      const target = this.rows.find((item) => item[this.valueKey] === row[this.valueKey]);
      if (target && this.$refs.selectorTable) {
        this.$refs.selectorTable.toggleRowSelection(target, false);
      }
    },
    handleConfirm() {
      const value = this.multiple ? this.selectedRows.map((row) => row[this.valueKey]) : this.selectedValue;
      this.$emit("input", value);
      this.$emit("confirm", this.multiple ? [...this.selectedRows] : this.selectedRows[0]);
      this.dialogVisible = false;
    },
    handleCancel() {
      this.dialogVisible = false;
    },
    getRowLabel(row) {
      if (this.labelFormatter) {
        return this.labelFormatter(row);
      }
      return row[this.labelKey] || row[this.valueKey];
    },
    formatColumn(column, row) {
      if (column.formatter) {
        return column.formatter(row);
      }
      return row[column.prop] || "-";
    },
  },
};
</script>

<style lang="scss" scoped>
.list-selector-search {
  padding: 4px 6px;
  margin-bottom: 10px;
  background: #f8fbf9;
  border-radius: 10px;
}

.list-selector-preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f2fbf6;
  border: 1px solid #dcebe3;
  border-radius: 10px;
}

.list-selector-preview-title {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #27ad60;
}

.list-selector-preview-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.list-selector-dialog {
  border-radius: 14px;

  .el-dialog__body {
    padding-top: 14px;
  }
}
</style>
