<template>
  <div class="dortmund-match-binding-control">
    <el-input :value="displayText" readonly :disabled="disabled" :placeholder="placeholder"
      prefix-icon="el-icon-football" @click="handleSelect" />
    <el-button type="primary" plain icon="el-icon-s-operation" :disabled="disabled" @click="handleSelect">{{ selectLabel
      }}</el-button>
    <el-button v-if="showCreate" type="text" class="match-binding-create" icon="el-icon-circle-plus-outline"
      :disabled="disabled" @click="$emit('create')">{{ createLabel }}</el-button>
  </div>
</template>

<script>
export default {
  name: "DortmundMatchBindingControl",
  props: {
    displayText: { type: String, default: "" },
    placeholder: { type: String, default: "请选择关联比赛" },
    selectLabel: { type: String, default: "选择比赛" },
    showCreate: { type: Boolean, default: false },
    createLabel: { type: String, default: "当场新建比赛" },
    disabled: { type: Boolean, default: false },
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
.dortmund-match-binding-control {
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

.match-binding-create {
  padding-right: 4px;
  padding-left: 4px;
}

@media (max-width: 767px) {
  .dortmund-match-binding-control {
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
