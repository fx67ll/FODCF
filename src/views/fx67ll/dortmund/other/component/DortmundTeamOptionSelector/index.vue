<template>
  <div class="team-option-selector">
    <div class="team-option-trigger" :class="{ 'is-disabled': disabled, 'is-empty': !hasValue }" tabindex="0"
      role="button" :aria-disabled="disabled" @click="openDrawer" @keyup.enter.native="openDrawer">
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
        <div class="team-option-search-row">
          <el-input v-model="keyword" size="small" clearable prefix-icon="el-icon-search"
            :placeholder="multiple ? '搜索标签，可多选' : '搜索主场'" @keyup.enter.native="applySearch" />
          <el-button size="small" type="primary" icon="el-icon-search" @click="applySearch">搜索</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="resetSearch">重置</el-button>
        </div>

        <div class="team-option-tip">
          <i class="el-icon-info"></i>
          <span>{{ multiple ? '支持跨页勾选多个标签；双击不自动确认，避免误提交。' : '单击行选择主场，双击行可直接确认。' }}</span>
        </div>

        <div v-if="loading" class="team-option-loading">
          <i class="el-icon-loading"></i><span>正在加载球队选项</span>
        </div>
        <el-table v-else :data="pagedOptions" size="small" row-key="value" class="team-option-table"
          @row-click="handleRowClick" @row-dblclick="handleRowDoubleClick">
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
              <p>未找到匹配选项，可直接关闭后在表单中录入其他值</p>
            </div>
          </template>
        </el-table>

        <div class="team-option-pagination">
          <span>共 {{ filteredOptions.length }} 项</span>
          <el-pagination background small layout="prev, pager, next" :page-size="pageSize" :total="filteredOptions.length"
            :current-page.sync="pageNum" />
        </div>

        <div v-if="allowCreate" class="team-option-custom-row">
          <span><i class="el-icon-edit-outline"></i> 未找到时可直接录入</span>
          <el-input v-model="customValue" size="small" clearable
            :maxlength="customMaxlength"
            :placeholder="optionType === 'tag' ? '输入自定义标签' : '输入自定义主场'" @keyup.enter.native="addCustomValue" />
          <el-button size="small" plain :disabled="!customValue.trim()" @click="addCustomValue">加入候选</el-button>
        </div>

        <div class="team-option-footer">
          <span>已选 {{ draftValues.length }} 项</span>
          <div>
            <el-button size="small" @click="drawerVisible = false">取消</el-button>
            <el-button size="small" type="success" :disabled="!draftValues.length" @click="confirmSelection">
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
  },
  data() {
    return {
      drawerVisible: false,
      loading: false,
      keyword: "",
      appliedKeyword: "",
      pageNum: 1,
      pageSize: DORTMUND_PAGINATION.selectorPageSize,
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
    hasValue() {
      return this.selectedDisplayOptions.length > 0;
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
.team-option-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 36px;
  padding: 6px 10px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus {
    border-color: #61c88d;
    outline: none;
    box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.08);
  }

  &.is-empty {
    color: #a8b5af;
  }

  &.is-disabled {
    cursor: not-allowed;
    background: #f5f7fa;
  }
}

.team-option-trigger-value {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.team-option-single,
.team-option-placeholder {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-option-arrow {
  flex-shrink: 0;
  color: #a8b5af;
}

.team-option-drawer-shell {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 110px);
  padding: 0 18px 16px;
}

.team-option-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
}

.team-option-tip {
  display: flex;
  gap: 7px;
  margin: 12px 0;
  padding: 9px 11px;
  color: #70847a;
  font-size: 12px;
  background: #f5fbf7;
  border: 1px solid #e3eee8;
  border-radius: 9px;
}

.team-option-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 220px;
  color: #8a9892;
}

.team-option-table {
  flex: 1;
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

.team-option-pagination,
.team-option-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  color: #7c8b84;
  font-size: 12px;
}

.team-option-custom-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
  color: #7c8b84;
  font-size: 12px;
  border-top: 1px solid #edf3ef;
}

.team-option-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #edf3ef;
}

@media (max-width: 767px) {
  .team-option-search-row {
    grid-template-columns: 1fr auto;
  }

  .team-option-search-row .el-button:last-child {
    grid-column: 1 / -1;
  }

  .team-option-custom-row {
    grid-template-columns: 1fr auto;
  }

  .team-option-custom-row > span {
    grid-column: 1 / -1;
  }
}
</style>

<style lang="scss">
.team-option-drawer {
  .el-drawer__body {
    padding-top: 0;
    overflow: auto;
  }
}
</style>
