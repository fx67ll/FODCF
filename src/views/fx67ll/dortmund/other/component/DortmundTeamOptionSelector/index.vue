<template>
  <div class="team-option-selector" :class="selectorSizeClass" :style="selectorStyle">
    <div class="team-option-trigger" :class="{ 'is-disabled': disabled, 'is-empty': !hasValue, 'is-active': drawerVisible }"
      tabindex="0" role="button" :aria-disabled="disabled" @click="openDrawer" @keyup.enter.native="openDrawer">
      <div class="team-option-trigger-value">
        <template v-if="hasValue">
          <el-tag v-if="multiple" v-for="item in selectedDisplayOptions" :key="item.value" size="small" closable
            :type="item.type || 'info'" @close.stop="removeValue(item.value)">
            {{ item.label }}
          </el-tag>
          <span v-else class="team-option-single">{{ selectedDisplayOptions[0].label }}</span>
        </template>
        <span v-else class="team-option-placeholder">{{ placeholder }}</span>
      </div>
      <i class="el-icon-arrow-down team-option-arrow"></i>
    </div>

    <el-drawer :visible.sync="drawerVisible" :title="drawerTitle" :size="drawerSize" direction="rtl" append-to-body
      custom-class="team-option-drawer" destroy-on-close :wrapper-closable="false">
      <div class="team-option-drawer-shell">
        <div class="team-option-guide">
          <span class="team-option-guide-icon">
            <i :class="multiple ? 'el-icon-finished' : 'el-icon-circle-check'"></i>
          </span>
          <div>
            <strong>{{ guideTitle }}</strong>
            <p>{{ guideDescription }}</p>
          </div>
        </div>

        <div class="team-option-search-card">
          <el-input v-model="keyword" size="small" clearable prefix-icon="el-icon-search"
            class="team-option-search-input" :placeholder="searchPlaceholder"
            @keyup.enter.native="applySearch" />
          <div class="team-option-search-actions">
            <el-button size="small" type="primary" icon="el-icon-search" :loading="loading"
              @click="applySearch">搜索</el-button>
            <el-button size="small" icon="el-icon-refresh" class="dortmund-theme-cancel" :disabled="loading"
              @click="resetSearch">重置</el-button>
          </div>
        </div>

        <transition name="team-option-preview">
          <div v-if="draftDisplayOptions.length" class="team-option-preview">
            <span class="team-option-preview-title">
              <i class="el-icon-finished"></i>已选 {{ draftDisplayOptions.length }} 项
            </span>
            <div class="team-option-preview-items">
              <el-tag v-for="item in draftDisplayOptions" :key="item.value" size="small" closable
                :type="item.type || 'info'" @close="removeDraftValue(item.value)">{{ item.label }}</el-tag>
            </div>
            <el-button v-if="multiple" type="text" class="team-option-preview-clear"
              @click="clearDraftValues">清空</el-button>
          </div>
        </transition>

        <div class="team-option-list-region">
          <div v-if="loading" class="team-option-loading">
            <i class="el-icon-loading"></i><span>正在加载球队选项</span>
          </div>
          <el-table v-else :data="pagedOptions" size="small" row-key="value" height="100%" class="team-option-table"
            :row-class-name="getRowClassName" @row-click="handleRowClick" @row-dblclick="handleRowDoubleClick">
            <el-table-column v-if="multiple" width="54" align="center">
              <template slot-scope="scope">
                <el-checkbox :value="draftValues.includes(scope.row.value)" @click.native.stop
                  @change="toggleDraft(scope.row.value)" />
              </template>
            </el-table-column>
            <el-table-column v-else width="54" align="center">
              <template slot-scope="scope">
                <el-radio :value="draftValues[0]" :label="scope.row.value" @click.native.stop
                @change="toggleDraft(scope.row.value)"><span></span></el-radio>
              </template>
            </el-table-column>
            <el-table-column label="选项" min-width="220">
              <template slot-scope="scope">
                <el-tag v-if="optionType === 'tag'" :type="scope.row.type || 'info'" size="small">
                  {{ scope.row.label }}
                </el-tag>
                <span v-else class="team-option-row-label">{{ scope.row.label }}</span>
              </template>
            </el-table-column>
            <template slot="empty">
              <div class="team-option-empty">
                <i class="el-icon-search"></i>
                <p>{{ allowCreate ? '未找到匹配选项，可直接关闭后在表单中录入其他值' : '未找到匹配选项，请调整搜索条件' }}</p>
              </div>
            </template>
          </el-table>
        </div>

        <div class="team-option-pagination">
          <el-pagination background small :layout="paginationLayout" :pager-count="paginationPagerCount"
            :page-sizes="pageSizes" :page-size="pageSize" :total="filteredOptions.length"
            :current-page.sync="pageNum" popper-class="dortmund-theme-popper"
            @size-change="handlePageSizeChange" />
        </div>

        <div v-if="allowCreate" class="team-option-custom-row">
          <span><i class="el-icon-edit-outline"></i> 未找到时可直接录入</span>
          <el-input v-model="customValue" size="small" clearable
            :maxlength="customMaxlength"
            :placeholder="optionType === 'tag' ? '输入自定义标签' : '输入自定义主场'" @keyup.enter.native="addCustomValue" />
          <el-button size="small" type="primary" plain :disabled="!customValue.trim()"
            @click="addCustomValue">加入候选</el-button>
        </div>

        <div class="team-option-footer">
          <span>已选 {{ draftValues.length }} 项</span>
          <div class="team-option-footer-actions">
            <el-button size="small" class="dortmund-theme-cancel" @click="drawerVisible = false">取 消</el-button>
            <el-button size="small" type="success" class="dortmund-theme-confirm" :disabled="!draftValues.length"
              @click="confirmSelection">
              确认选择
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { getTeamOptions } from "@/api/fx67ll/dortmund/team";
import {
  DORTMUND_LIMITS,
  DORTMUND_PAGINATION,
  DORTMUND_TAG_SPLIT_PATTERN,
  TEAM_TAG_FALLBACK_OPTIONS,
  TEAM_VENUE_FALLBACK_OPTIONS,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

function normalizeOption(item, fallbackType) {
  if (!item) return null;
  const value = String(item.value == null ? item.label || "" : item.value).trim();
  if (!value) return null;
  return {
    label: String(item.label == null ? value : item.label).trim() || value,
    value,
    type: item.type || fallbackType,
  };
}

function mergeOptions(localOptions, remoteOptions) {
  const result = [];
  const seen = new Set();
  [...(localOptions || []), ...(remoteOptions || [])].forEach((item) => {
    const option = normalizeOption(item, "info");
    if (!option || seen.has(option.value)) return;
    seen.add(option.value);
    result.push(option);
  });
  return result;
}

export default {
  name: "DortmundTeamOptionSelector",
  props: {
    value: {
      type: [String, Array],
      default: null,
    },
    optionType: {
      type: String,
      required: true,
      validator: (value) => ["venue", "tag"].includes(value),
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "请选择",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    allowCreate: {
      type: Boolean,
      default: true,
    },
    size: {
      type: String,
      default: "default",
      validator: (value) => ["default", "medium", "small", "mini"].includes(value),
    },
    width: {
      type: [String, Number],
      default: null,
    },
  },
  data() {
    return {
      drawerVisible: false,
      loading: false,
      keyword: "",
      appliedKeyword: "",
      pageNum: 1,
      pageSize: DORTMUND_PAGINATION.selectorPageSize,
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      remoteOptions: [],
      localOptions: [],
      remoteLoaded: false,
      customValue: "",
      draftValues: [],
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1440,
    };
  },
  computed: {
    fallbackOptions() {
      return this.optionType === "tag" ? TEAM_TAG_FALLBACK_OPTIONS : TEAM_VENUE_FALLBACK_OPTIONS;
    },
    options() {
      return mergeOptions([...this.fallbackOptions, ...this.localOptions], this.remoteOptions);
    },
    selectedValues() {
      if (this.multiple) {
        return Array.isArray(this.value)
          ? this.value.map((item) => String(item || "").trim()).filter(Boolean)
          : String(this.value || "")
            .split(DORTMUND_TAG_SPLIT_PATTERN)
            .map((item) => item.trim())
            .filter(Boolean);
      }
      return this.value == null || String(this.value).trim() === "" ? [] : [String(this.value).trim()];
    },
    selectedDisplayOptions() {
      return this.selectedValues.map((value) => {
        const matched = this.options.find((item) => item.value === value);
        return matched || { label: value, value, type: "info" };
      });
    },
    draftDisplayOptions() {
      return this.draftValues.map((value) => {
        const matched = this.options.find((item) => item.value === value);
        return matched || { label: value, value, type: "info" };
      });
    },
    hasValue() {
      return this.selectedDisplayOptions.length > 0;
    },
    optionLabel() {
      return this.optionType === "tag" ? "球队标签" : "球队主场";
    },
    guideTitle() {
      return this.multiple ? `可跨页选择多个${this.optionLabel}` : `请选择一个${this.optionLabel}`;
    },
    guideDescription() {
      return this.multiple
        ? "勾选结果会在分页切换和筛选时保留"
        : "单击行完成选中，双击行可直接确认";
    },
    searchPlaceholder() {
      return `搜索${this.optionLabel}`;
    },
    selectorSizeClass() {
      return `team-option-selector--${this.size}`;
    },
    selectorStyle() {
      if (this.width === null || this.width === undefined || this.width === "") {
        return {};
      }
      return { width: typeof this.width === "number" ? `${this.width}px` : this.width };
    },
    filteredOptions() {
      const keyword = this.appliedKeyword.trim().toLowerCase();
      return keyword
        ? this.options.filter((item) => item.label.toLowerCase().includes(keyword)
          || item.value.toLowerCase().includes(keyword))
        : this.options;
    },
    pagedOptions() {
      const start = (this.pageNum - 1) * this.pageSize;
      return this.filteredOptions.slice(start, start + this.pageSize);
    },
    drawerTitle() {
      return this.optionType === "tag" ? "选择球队标签" : "选择球队主场";
    },
    drawerSize() {
      return this.viewportWidth < 768 ? "100%" : "560px";
    },
    paginationLayout() {
      return this.viewportWidth < 768
        ? "sizes, prev, pager, next"
        : "total, sizes, prev, pager, next";
    },
    paginationPagerCount() {
      return this.viewportWidth < 768 ? 5 : 7;
    },
    customMaxlength() {
      return this.optionType === "tag" ? DORTMUND_LIMITS.teamTag : DORTMUND_LIMITS.teamVenue;
    },
  },
  mounted() {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleResize);
    }
    this.loadOptions();
  },
  beforeDestroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleResize);
    }
  },
  methods: {
    handleResize() {
      this.viewportWidth = window.innerWidth;
    },
    loadOptions() {
      if (this.loading) return;
      this.loading = true;
      getTeamOptions()
        .then((response) => {
          const data = (response && response.data) || {};
          this.remoteOptions = this.optionType === "tag"
            ? data.teamTagOptions || []
            : data.teamVenueOptions || [];
          // 空响应也视为合法结果；内置目录仍在 options 中兜底。
          this.remoteLoaded = true;
        })
        .catch(() => {
          // 接口失败时保留内置选项，避免表单不可用。
          this.remoteOptions = [];
          this.remoteLoaded = false;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    openDrawer() {
      if (this.disabled) return;
      this.draftValues = [...this.selectedValues];
      this.keyword = "";
      this.appliedKeyword = "";
      this.customValue = "";
      this.pageNum = 1;
      this.drawerVisible = true;
      if (!this.remoteLoaded) this.loadOptions();
    },
    applySearch() {
      this.appliedKeyword = this.keyword.trim();
      this.pageNum = 1;
    },
    handlePageSizeChange(size) {
      this.pageSize = size;
      this.pageNum = 1;
    },
    resetSearch() {
      this.keyword = "";
      this.appliedKeyword = "";
      this.pageNum = 1;
    },
    toggleDraft(value) {
      if (!this.multiple) {
        this.draftValues = [value];
        return;
      }
      const index = this.draftValues.indexOf(value);
      if (index >= 0) this.draftValues.splice(index, 1);
      else this.draftValues.push(value);
    },
    handleRowClick(row) {
      this.toggleDraft(row.value);
    },
    handleRowDoubleClick(row) {
      if (this.multiple) return;
      this.draftValues = [row.value];
      this.confirmSelection();
    },
    removeDraftValue(value) {
      this.draftValues = this.draftValues.filter((item) => item !== value);
    },
    clearDraftValues() {
      this.draftValues = [];
    },
    getRowClassName({ row }) {
      return this.draftValues.includes(row.value) ? "is-draft-selected" : "";
    },
    addCustomValue() {
      const rawValues = this.multiple
        ? String(this.customValue || "").split(DORTMUND_TAG_SPLIT_PATTERN)
        : [this.customValue];
      const values = rawValues
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      if (!values.length) return;
      values.forEach((value) => {
        if (!this.options.some((item) => item.value === value)) {
          this.localOptions.push({ label: value, value, type: "info" });
        }
        if (this.multiple) {
          if (!this.draftValues.includes(value)) this.draftValues.push(value);
        } else {
          this.draftValues = [value];
        }
      });
      this.customValue = "";
    },
    confirmSelection() {
      const value = this.multiple ? [...this.draftValues] : this.draftValues[0] || null;
      this.$emit("input", value);
      this.$emit("change", value);
      this.drawerVisible = false;
    },
    removeValue(value) {
      if (this.disabled) return;
      const next = this.selectedValues.filter((item) => item !== value);
      this.$emit("input", this.multiple ? next : next[0] || null);
      this.$emit("change", this.multiple ? next : next[0] || null);
    },
  },
};
</script>

<style lang="scss" scoped>
.team-option-selector {
  --team-option-theme: var(--current-color, #2ecc71);
  display: block;
  width: 100%;
  min-width: 0;
}

.team-option-trigger {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover,
  &:focus,
  &.is-active {
    border-color: var(--team-option-theme);
    outline: none;
    box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.12);
  }

  &.is-empty {
    color: #a8b5af;
  }

  &.is-disabled {
    cursor: not-allowed;
    background: #f5f7fa;
    opacity: 0.72;
  }
}

.team-option-selector--medium .team-option-trigger {
  min-height: 36px;
  padding: 5px 12px;
}

.team-option-selector--small .team-option-trigger {
  min-height: 32px;
  padding: 3px 11px;
  font-size: 13px;
}

.team-option-selector--mini .team-option-trigger {
  min-height: 28px;
  padding: 1px 9px;
  font-size: 12px;
}

.team-option-trigger-value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.team-option-trigger ::v-deep .el-tag {
  max-width: 100%;
}

.team-option-trigger ::v-deep .el-tag .el-tag__close {
  color: var(--team-option-theme);
}

.team-option-trigger ::v-deep .el-tag .el-tag__close:hover {
  color: #fff;
  background-color: var(--team-option-theme);
}

.team-option-single,
.team-option-placeholder {
  overflow: hidden;
  font-size: inherit;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-option-arrow {
  flex-shrink: 0;
  color: #a8b5af;
}

.team-option-drawer-shell {
  --team-option-theme: var(--current-color, #2ecc71);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 14px 18px 0;
  overflow: hidden;
  background: #f7f9f8;
}

.team-option-guide,
.team-option-search-card,
.team-option-preview,
.team-option-pagination,
.team-option-custom-row,
.team-option-footer {
  flex-shrink: 0;
}

.team-option-guide {
  display: flex;
  align-items: center;
  padding: 11px 13px;
  margin-bottom: 10px;
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

.team-option-guide-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  margin-right: 11px;
  color: var(--team-option-theme);
  background: #eef9f3;
  border-radius: 10px;
}

.team-option-search-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #e5ebe7;
  border-radius: 12px;
}

.team-option-search-input {
  width: 100%;
  min-width: 0;
}

.team-option-search-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.team-option-search-actions ::v-deep .el-button + .el-button {
  margin-left: 0;
}

.team-option-preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-height: 108px;
  padding: 9px 12px;
  margin-bottom: 10px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dcebe3;
  border-left: 3px solid var(--team-option-theme);
  border-radius: 10px;
}

.team-option-preview-title {
  flex-shrink: 0;
  padding-top: 2px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--team-option-theme);
}

.team-option-preview-items {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 64px;
  min-width: 0;
  padding-right: 4px;
  overflow-y: auto;

  ::v-deep .el-tag {
    max-width: 100%;
    height: auto;
    min-height: 24px;
    padding-top: 2px;
    padding-bottom: 2px;
    color: var(--team-option-theme);
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
    background: #e7f8ee;
    border-color: #bfe8d1;
  }

  ::v-deep .el-tag .el-tag__close {
    color: var(--team-option-theme);

    &:hover {
      color: #fff;
      background-color: var(--team-option-theme);
    }
  }
}

.team-option-preview-clear {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 4px;
  margin-left: auto;
}

.team-option-preview-enter-active,
.team-option-preview-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.team-option-preview-enter,
.team-option-preview-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.team-option-loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 0;
  color: #8a9892;
  background: #fff;
}

.team-option-list-region {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5ebe7;
  border-radius: 12px;
}

.team-option-table {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.team-option-table ::v-deep .el-table::before {
  display: none;
}

.team-option-table ::v-deep th.el-table__cell {
  font-weight: 600;
  color: #53635b;
  background: #f3f7f5;
}

.team-option-table ::v-deep td.el-table__cell {
  border-bottom-color: #edf3ef;
}

.team-option-table ::v-deep .el-table__row {
  cursor: pointer;
}

.team-option-table ::v-deep .el-table__body tr:hover > td.el-table__cell {
  background: #f1fbf5;
}

.team-option-table ::v-deep .el-table__body tr.is-draft-selected > td.el-table__cell {
  background: #edf8f2;
}

.team-option-row-label {
  color: #2b3a36;
  font-size: 13px;
}

.team-option-empty {
  padding: 28px 0;
  color: #96a39c;
  text-align: center;

  i {
    font-size: 26px;
  }

  p {
    margin: 8px 0 0;
    font-size: 12px;
  }
}

.team-option-pagination {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  min-height: 32px;
  margin: 10px 0 0;
}

.team-option-pagination ::v-deep .el-pagination {
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

.team-option-pagination ::v-deep .el-pagination > * {
  margin-left: 0;
}

.team-option-pagination ::v-deep .el-pagination .el-pager {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.team-option-pagination ::v-deep .el-pagination .el-pager li,
.team-option-pagination ::v-deep .el-pagination button {
  margin: 0;
}

.team-option-pagination ::v-deep .el-pagination__total {
  font-size: 12px;
  color: #7c8b84;
}

.team-option-pagination ::v-deep .el-pagination.is-background .el-pager li:not(.disabled) {
  color: #52615a;
  background-color: #f7faf8;
  border: 1px solid #e2ebe6;
}

.team-option-pagination ::v-deep .el-pagination.is-background .el-pager li:not(.disabled):not(.active):hover {
  color: var(--team-option-theme);
  background-color: #e7f8ee;
  border-color: #bfe8d1;
}

.team-option-pagination ::v-deep .el-pagination.is-background .el-pager li:not(.disabled).active {
  color: #fff;
  background-color: var(--team-option-theme);
  border-color: var(--team-option-theme);
}

.team-option-pagination ::v-deep .el-pagination.is-background .btn-prev,
.team-option-pagination ::v-deep .el-pagination.is-background .btn-next {
  color: #52615a;
  background-color: #f7faf8;
  border: 1px solid #e2ebe6;
}

.team-option-pagination ::v-deep .el-pagination.is-background .btn-prev:not(:disabled):hover,
.team-option-pagination ::v-deep .el-pagination.is-background .btn-next:not(:disabled):hover {
  color: var(--team-option-theme);
  background-color: #e7f8ee;
  border-color: #bfe8d1;
}

.team-option-pagination ::v-deep .el-pagination__sizes .el-input__inner,
.team-option-pagination ::v-deep .el-pagination__jump .el-input__inner {
  border-radius: 6px;
}

.team-option-pagination ::v-deep .el-pagination__sizes .el-input__inner:focus,
.team-option-pagination ::v-deep .el-pagination__jump .el-input__inner:focus {
  border-color: var(--team-option-theme);
}

.team-option-table ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: var(--team-option-theme);
  border-color: var(--team-option-theme);
}

.team-option-table ::v-deep .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background-color: var(--team-option-theme);
  border-color: var(--team-option-theme);
}

.team-option-table ::v-deep .el-checkbox__input.is-focus .el-checkbox__inner,
.team-option-table ::v-deep .el-radio__input.is-checked .el-radio__inner {
  border-color: var(--team-option-theme);
}

.team-option-table ::v-deep .el-radio__input.is-checked .el-radio__inner {
  background-color: var(--team-option-theme);
}

.team-option-custom-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
  margin-top: 2px;
  color: #7c8b84;
  font-size: 12px;
  border-top: 1px solid #edf3ef;
}

.team-option-custom-row ::v-deep .el-input {
  width: 100%;
  min-width: 0;
}

.team-option-custom-row ::v-deep .el-button {
  margin-left: 0;
}

.team-option-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  margin-right: -18px;
  margin-left: -18px;
  padding: 12px 18px 16px;
  color: #7c8b84;
  font-size: 12px;
  background: #fff;
  border-top: 1px solid #edf3ef;
}

.team-option-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-option-footer-actions ::v-deep .el-button + .el-button {
  margin-left: 0;
}

@media (max-width: 767px) {
  .team-option-drawer-shell {
    padding: 12px 12px 0;
  }

  .team-option-guide {
    padding: 10px 11px;
  }

  .team-option-search-card {
    grid-template-columns: 1fr;
  }

  .team-option-search-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .team-option-search-actions ::v-deep .el-button {
    width: 100%;
    margin-left: 0;
  }

  .team-option-preview {
    flex-wrap: wrap;
  }

  .team-option-preview-title {
    width: 100%;
  }

  .team-option-custom-row {
    grid-template-columns: 1fr auto;
  }

  .team-option-custom-row > span {
    grid-column: 1 / -1;
  }

  .team-option-pagination {
    justify-content: center;
  }

  .team-option-pagination ::v-deep .el-pagination {
    width: 100%;
    justify-content: center;
    row-gap: 6px;
  }

  .team-option-footer {
    margin-right: -12px;
    margin-left: -12px;
    padding: 12px;
  }

  .team-option-footer > span {
    display: none;
  }

  .team-option-footer-actions {
    width: 100%;
  }

  .team-option-footer-actions .el-button {
    flex: 1;
  }
}

@media (max-height: 720px) {
  .team-option-guide {
    display: none;
  }

  .team-option-search-card {
    margin-bottom: 8px;
  }

  .team-option-preview {
    max-height: 84px;
    margin-bottom: 8px;
  }

  .team-option-preview-items {
    max-height: 52px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .team-option-trigger,
  .team-option-preview-enter-active,
  .team-option-preview-leave-active {
    transition: none;
  }
}
</style>

<style lang="scss">
.team-option-drawer {
  border-radius: 14px 0 0 14px;
  box-shadow: -12px 0 36px rgba(31, 61, 46, 0.16);

  .el-drawer__header {
    padding: 18px 20px 15px;
    margin-bottom: 0;
    font-weight: 700;
    color: #26362f;
    border-bottom: 1px solid #e3e9e6;
  }

  .el-drawer__body {
    padding: 0;
    overflow: hidden;
    background: #f7f9f8;
  }

  .el-drawer__close-btn:hover {
    color: #2ecc71;
  }
}

@media (max-width: 767px) {
  .team-option-drawer {
    border-radius: 0;

    .el-drawer__header {
      padding: 16px 14px 13px;
    }
  }
}
</style>
