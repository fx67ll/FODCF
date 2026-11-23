<template>
  <div class="dortmund-kickoff-time-picker">
    <el-date-picker :value="value" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
      popper-class="dortmund-theme-popper" :disabled="disabled" :placeholder="placeholder" :clearable="clearable"
      class="dortmund-kickoff-time-input" @input="handleInput" @change="handleChange" />
    <el-popover v-model="quickPanelVisible" placement="bottom-end" width="320" trigger="click" :disabled="disabled"
      popper-class="dortmund-theme-popper dortmund-kickoff-time-popper">
      <div class="dortmund-kickoff-quick-panel">
        <div class="dortmund-kickoff-quick-head">
          <span><i class="el-icon-time"></i>常用开球时间</span>
          <small :title="quickTip">{{ quickTip }}</small>
        </div>
        <div class="dortmund-kickoff-quick-section" role="group" aria-label="快捷日期">
          <span class="dortmund-kickoff-section-label">日期</span>
          <div class="dortmund-kickoff-date-list">
            <button v-for="option in quickDates" :key="option.label" type="button" class="dortmund-kickoff-date-item"
              :class="{ 'is-active': isActiveDate(option) }" :disabled="disabled" @click="applyDate(option)">
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="dortmund-kickoff-quick-section" role="group" aria-label="常用开球时间">
          <span class="dortmund-kickoff-section-label">时间</span>
          <div class="dortmund-kickoff-quick-list" role="group" aria-label="常用开球时间">
            <button v-for="slot in quickSlots" :key="slot.label" type="button" class="dortmund-kickoff-quick-item"
              :class="{ 'is-active': isActiveSlot(slot) }" :disabled="disabled"
              :title="slot.dayOffset ? '次日 00:00' : `今天 ${slot.label}`" @click="applySlot(slot)">
              {{ slot.label }}
            </button>
          </div>
        </div>
      </div>
      <el-button slot="reference" type="success" plain icon="el-icon-time" class="dortmund-kickoff-quick-trigger"
        :disabled="disabled" title="常用开球时间">
        常用开球时间
      </el-button>
    </el-popover>
  </div>
</template>

<script>
import {
  DORTMUND_KICKOFF_DATE_OPTIONS,
  DORTMUND_KICKOFF_TIME_SLOTS,
  DORTMUND_KICKOFF_TIME_TIP,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseDateTime(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const matched = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!matched) return null;
  const date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]),
    Number(matched[4]), Number(matched[5]), Number(matched[6] || 0), 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default {
  name: "DortmundKickoffTimePicker",
  props: {
    value: {
      type: [String, Date],
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: "请选择比赛时间",
    },
  },
  data() {
    return {
      quickDates: DORTMUND_KICKOFF_DATE_OPTIONS,
      quickSlots: DORTMUND_KICKOFF_TIME_SLOTS,
      quickTip: DORTMUND_KICKOFF_TIME_TIP,
      quickPanelVisible: false,
    };
  },
  methods: {
    handleInput(value) {
      this.$emit("input", value);
    },
    handleChange(value) {
      this.$emit("change", value);
    },
    // 日期标签与时间标签独立生效：先选日期时保留当前时分，先选时间时以当前日期为基准。
    applyDate(option) {
      if (this.disabled) return;
      const selected = parseDateTime(this.value);
      const now = new Date();
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + option.dayOffset);
      date.setHours(selected ? selected.getHours() : now.getHours(),
        selected ? selected.getMinutes() : now.getMinutes(), 0, 0);
      this.emitValue(formatDateTime(date));
    },
    applySlot(slot) {
      if (this.disabled) return;
      const selected = parseDateTime(this.value);
      const date = selected ? new Date(selected) : new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + slot.dayOffset);
      date.setHours(slot.hour, slot.minute, 0, 0);
      this.emitValue(formatDateTime(date));
    },
    // 快捷面板连续选择日期和时间时保持打开，由用户在组合完成后点击面板外侧收起。
    emitValue(value) {
      this.$emit("input", value);
      this.$emit("change", value);
    },
    isActiveDate(option) {
      const selected = parseDateTime(this.value);
      if (!selected) return false;
      const target = new Date();
      target.setHours(0, 0, 0, 0);
      target.setDate(target.getDate() + option.dayOffset);
      return selected.getFullYear() === target.getFullYear()
        && selected.getMonth() === target.getMonth()
        && selected.getDate() === target.getDate();
    },
    isActiveSlot(slot) {
      const selected = parseDateTime(this.value);
      if (!selected) return false;
      // 日期已由独立日期标签控制；时间标签只比较时分，24:00 落值仍高亮 24:00。
      return selected.getHours() === slot.hour
        && selected.getMinutes() === slot.minute;
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-kickoff-time-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.dortmund-kickoff-time-input {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
}

.dortmund-kickoff-quick-trigger {
  flex-shrink: 0;
  margin-left: 0;
  white-space: nowrap;
}

.dortmund-kickoff-quick-panel {
  min-width: 0;
}

.dortmund-kickoff-quick-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
  line-height: 1.4;

  span {
    flex-shrink: 0;
    font-size: 11px;
    color: #52615a;
  }

  i {
    margin-right: 3px;
    color: #2ecc71;
  }

  small {
    min-width: 0;
    overflow: hidden;
    font-size: 10px;
    color: #9aa8a0;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dortmund-kickoff-quick-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 7px;
}

.dortmund-kickoff-section-label {
  flex: 0 0 28px;
  padding-top: 5px;
  font-size: 10px;
  color: #8a9791;
}

.dortmund-kickoff-date-list {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  min-width: 0;
}

.dortmund-kickoff-date-item {
  min-height: 25px;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 11px;
  line-height: 1.4;
  color: #52615a;
  cursor: pointer;
  background: #f7faf8;
  border: 1px solid #e2ebe6;
  border-radius: 6px;
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;

  &:hover,
  &:focus {
    color: #238c52;
    background: #edf9f2;
    border-color: #bfe8d1;
    outline: none;
  }

  &.is-active {
    color: #fff;
    background: #2ecc71;
    border-color: #2ecc71;
  }

  &:disabled {
    color: #a8b5af;
    cursor: not-allowed;
    background: #f5f7fa;
  }
}

.dortmund-kickoff-quick-list {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
  gap: 5px;
  min-width: 0;
}

.dortmund-kickoff-quick-item {
  min-height: 25px;
  padding: 2px 5px;
  font-family: inherit;
  font-size: 11px;
  line-height: 1.4;
  color: #52615a;
  cursor: pointer;
  background: #f7faf8;
  border: 1px solid #e2ebe6;
  border-radius: 6px;
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;

  &:hover,
  &:focus {
    color: #238c52;
    background: #edf9f2;
    border-color: #bfe8d1;
    outline: none;
  }

  &.is-active {
    color: #fff;
    background: #2ecc71;
    border-color: #2ecc71;
  }

  &:disabled {
    color: #a8b5af;
    cursor: not-allowed;
    background: #f5f7fa;
  }
}

@media screen and (max-width: 767px) {
  .dortmund-kickoff-time-picker {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .dortmund-kickoff-time-input {
    flex-basis: 100%;
    width: 100%;
  }

  .dortmund-kickoff-quick-trigger {
    align-self: flex-start;
  }

  .dortmund-kickoff-quick-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;

    small {
      text-align: left;
      white-space: normal;
    }
  }

  .dortmund-kickoff-quick-list {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  }

  .dortmund-kickoff-quick-section {
    flex-direction: column;
    gap: 4px;
  }

  .dortmund-kickoff-section-label {
    flex-basis: auto;
    padding-top: 0;
  }

  .dortmund-kickoff-date-list,
  .dortmund-kickoff-quick-list {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {

  .dortmund-kickoff-quick-item,
  .dortmund-kickoff-date-item {
    transition: none;
  }
}
</style>
