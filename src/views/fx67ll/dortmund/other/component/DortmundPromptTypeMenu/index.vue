<template>
  <el-popover v-model="visible" placement="bottom-start" width="344" trigger="click" append-to-body :disabled="disabled"
    popper-class="dortmund-prompt-type-popper">
    <div class="prompt-type-panel">
      <div class="prompt-type-head">
        <span class="prompt-type-mark"><i class="el-icon-s-operation"></i></span>
        <div class="prompt-type-heading">
          <strong>{{ title }}</strong>
          <p>{{ subtitle }}</p>
        </div>
      </div>

      <div class="prompt-type-options">
        <button v-for="option in options" :key="option.command" type="button" class="prompt-type-option"
          :class="`is-${option.tone || 'green'}`" @click="selectOption(option)">
          <span class="prompt-type-option-icon"><i :class="option.icon"></i></span>
          <span class="prompt-type-option-copy">
            <strong>{{ option.label }}</strong>
            <small>{{ option.description }}</small>
          </span>
          <i class="el-icon-arrow-right prompt-type-option-arrow"></i>
        </button>
      </div>

      <p class="prompt-type-tip"><i class="el-icon-info"></i>{{ tip }}</p>
    </div>

    <el-button slot="reference" size="mini" class="prompt-type-trigger" type="success" plain icon="el-icon-view"
      :class="{ 'is-open': visible }" :disabled="disabled" aria-haspopup="true">
      <span class="prompt-type-trigger-label">
        查看 AI 采集提示词
        <i class="el-icon-arrow-down prompt-type-trigger-arrow"></i>
      </span>
    </el-button>
  </el-popover>
</template>

<script>
export default {
  name: "DortmundPromptTypeMenu",
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    tip: {
      type: String,
      default: "",
    },
    options: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      visible: false,
    };
  },
  watch: {
    disabled(value) {
      if (value) this.visible = false;
    },
  },
  methods: {
    selectOption(option) {
      if (this.disabled || !option || !option.command) return;
      this.visible = false;
      this.$emit("select", option.command);
    },
  },
};
</script>

<style lang="scss" scoped>
.prompt-type-panel {
  padding: 2px;
  animation: promptTypePanelIn .2s ease both;
}

.prompt-type-head {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  padding: 7px 8px 12px;
  border-bottom: 1px solid #e8f1eb;
}

.prompt-type-mark {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  color: #fff;
  background: linear-gradient(135deg, #2fa866, #63c98c);
  border-radius: 9px;
  box-shadow: 0 5px 12px rgba(47, 168, 102, .22);
  place-items: center;
}

.prompt-type-heading {
  min-width: 0;

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

.prompt-type-options {
  display: grid;
  gap: 5px;
  padding-top: 5px;
}

.prompt-type-option {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  padding: 11px 9px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease,
    transform .18s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: #f3fbf6;
    border-color: #ccebd9;
    box-shadow: 0 6px 16px rgba(47, 168, 102, .1);
    transform: translateX(2px);
  }

  &:active {
    background: #eaf8f0;
    transform: translateX(2px) scale(.99);
  }
}

.prompt-type-option-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  font-size: 16px;
  border-radius: 9px;
  place-items: center;
}

.is-green .prompt-type-option-icon {
  color: #2d8f57;
  background: #e9f8ef;
}

.is-blue .prompt-type-option-icon {
  color: #3979b8;
  background: #eaf4ff;
}

.is-orange .prompt-type-option-icon {
  color: #a06d1f;
  background: #fff5e3;
}

.prompt-type-option-copy {
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

.prompt-type-option-arrow {
  flex: 0 0 auto;
  font-size: 12px;
  color: #b2c0b7;
  transition: color .18s ease, transform .18s ease;
}

.prompt-type-option:hover .prompt-type-option-arrow,
.prompt-type-option:focus-visible .prompt-type-option-arrow {
  color: #2fa866;
  transform: translateX(2px);
}

.prompt-type-tip {
  display: flex;
  gap: 5px;
  padding: 9px 8px 3px;
  margin: 4px 0 0;
  font-size: 10px;
  line-height: 1.55;
  color: #97a59c;
  border-top: 1px dashed #e6efe9;

  i {
    flex: 0 0 auto;
    margin-top: 2px;
  }
}

.prompt-type-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 11px;
  font-weight: 500;
  color: #2b9c61;
  background: #f4fcf7;
  border-color: #cfeedd;
  border-radius: 8px;
  box-shadow: none;
  transition: color .18s ease, border-color .18s ease, background-color .18s ease,
    box-shadow .18s ease, transform .18s ease;

  ::v-deep span {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    margin-left: 0;
  }

  ::v-deep>i {
    margin-right: 5px;
    font-size: 13px;
    line-height: 1;
  }

  &:hover:not(.is-disabled),
  &:focus:not(.is-disabled),
  &.is-open:not(.is-disabled) {
    color: #218b52;
    background: #ebf9f1;
    border-color: #9ad8b5;
    box-shadow: 0 5px 12px rgba(47, 168, 102, .13);
    transform: translateY(-1px);
  }

  &:active:not(.is-disabled) {
    transform: translateY(0) scale(.98);
  }
}

.prompt-type-trigger-label {
  white-space: nowrap;
}

.prompt-type-trigger-arrow {
  margin-left: 2px;
  font-size: 12px;
  transition: transform .2s ease;
}

.prompt-type-trigger.is-open .prompt-type-trigger-arrow {
  transform: rotate(180deg);
}

@keyframes promptTypePanelIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .prompt-type-panel {
    animation: none;
  }

  .prompt-type-option,
  .prompt-type-option-arrow,
  .prompt-type-trigger,
  .prompt-type-trigger-arrow {
    transition: none;
  }
}
</style>
