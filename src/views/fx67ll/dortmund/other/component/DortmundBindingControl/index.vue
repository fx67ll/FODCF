<template>
  <div class="dortmund-binding-control">
    <el-input :value="displayText" readonly :disabled="disabled" :placeholder="placeholder" :prefix-icon="inputIcon"
      @click="handleSelect" />
    <el-button type="success" plain :icon="selectIcon" :disabled="disabled" @click="handleSelect">{{ selectLabel
    }}</el-button>
    <el-button v-if="showCreate" type="text" class="dortmund-theme-text binding-control-create"
      icon="el-icon-circle-plus-outline" :disabled="createDisabled" @click="$emit('create')">{{ createLabel
      }}</el-button>
  </div>
</template>

<script>
export default {
  name: "DortmundBindingControl",
  props: {
    displayText: { type: String, default: "" },
    placeholder: { type: String, default: "请选择关联比赛" },
    selectLabel: { type: String, default: "选择比赛" },
    showCreate: { type: Boolean, default: false },
    createLabel: { type: String, default: "当场新建比赛" },
    disabled: { type: Boolean, default: false },
    createDisabled: { type: Boolean, default: false },
    entityType: {
      type: String,
      default: "match",
      validator: (value) => ["match", "team"].includes(value),
    },
  },
  computed: {
    inputIcon() {
      return this.entityType === "team" ? "el-icon-user" : "el-icon-football";
    },
    selectIcon() {
      return this.entityType === "team" ? "el-icon-user" : "el-icon-s-operation";
    },
  },
  methods: {
    handleSelect() {
      if (!this.disabled) {
        this.$emit("select");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-binding-control {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;

  .el-input {
    flex: 1;
    min-width: 0;
  }

  .el-button {
    flex-shrink: 0;
    margin-left: 0;
  }
}

.binding-control-create {
  padding-right: 4px;
  padding-left: 4px;
}

@media (max-width: 767px) {
  .dortmund-binding-control {
    align-items: stretch;
    flex-wrap: wrap;

    .el-input {
      flex-basis: 100%;
    }

    .el-button {
      align-self: flex-start;
    }
  }
}
</style>
