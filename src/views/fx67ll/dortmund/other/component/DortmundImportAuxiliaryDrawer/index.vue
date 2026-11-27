<template>
  <el-drawer :visible.sync="drawerVisible" :size="responsiveSize" direction="rtl" append-to-body destroy-on-close
    :with-header="false" :wrapper-closable="false" custom-class="dortmund-json-import-drawer dortmund-import-aux-drawer"
    @closed="$emit('closed')">
    <div class="import-aux-shell">
      <header class="json-import-header">
        <div class="json-import-heading">
          <span class="json-import-mark"><i :class="icon"></i></span>
          <div class="json-import-title">
            <h2>{{ title }}</h2>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <el-button type="text" class="json-import-close" icon="el-icon-close" :aria-label="`关闭${title}`"
          @click="closeDrawer" />
      </header>

      <div class="import-aux-content">
        <div class="import-aux-content-inner">
          <slot></slot>
        </div>
      </div>

      <footer class="json-import-footer">
        <span v-if="footerTip || $slots['footer-tip']" class="json-import-footer-tip">
          <i class="el-icon-info"></i>
          <span>
            <slot name="footer-tip">{{ footerTip }}</slot>
          </span>
        </span>
        <div class="json-import-footer-actions">
          <slot name="footer-actions"></slot>
          <el-button size="small" class="json-import-btn" @click="closeDrawer">关闭</el-button>
        </div>
      </footer>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "DortmundImportAuxiliaryDrawer",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "el-icon-document",
    },
    size: {
      type: String,
      default: "880px",
    },
    footerTip: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      viewportWidth: typeof window === "undefined" ? 1440 : window.innerWidth,
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    responsiveSize() {
      return this.viewportWidth < 1240 ? "94%" : this.size;
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleResize() {
      this.viewportWidth = window.innerWidth;
    },
    closeDrawer() {
      this.drawerVisible = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.import-aux-shell {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  color: #2b3a33;
  background:
    radial-gradient(circle at 100% 0, rgba(46, 204, 113, .06), transparent 34%),
    #f7faf8;
}

.json-import-header {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 16px 64px 16px 20px;
  margin-bottom: 0;
  color: #2b3a36;
  background: #fff;
  border-bottom: 1px solid #e3eee8;
}

.json-import-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  animation: importAuxHeadingIn .3s ease both;
}

.json-import-mark {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(46, 204, 113, .3);
  place-items: center;
}

.json-import-title {
  display: grid;
  gap: 3px;
  min-width: 0;
  flex: 1;

  h2 {
    overflow: hidden;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2b3a36;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    overflow: hidden;
    margin: 3px 0 0;
    font-size: 12px;
    color: #8a9a92;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.json-import-close {
  position: absolute;
  top: 18px;
  right: 20px;
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  padding: 0;
  margin: 0;
  color: #718078;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 10px;
  transition: color .22s ease, background-color .22s ease,
    box-shadow .22s ease, transform .28s cubic-bezier(.22, .8, .32, 1.2);
  place-items: center;

  ::v-deep i {
    font-size: 20px;
  }

  &:hover:not(.is-disabled),
  &:focus-visible:not(.is-disabled) {
    color: #2ecc71;
    background: rgba(46, 204, 113, .1);
    box-shadow: 0 4px 12px rgba(46, 204, 113, .16);
    transform: rotate(90deg) scale(1.04);
  }

  &:active:not(.is-disabled) {
    transform: rotate(90deg) scale(.92);
  }
}

.import-aux-content {
  flex: 1;
  min-height: 0;
  padding: 18px 22px 22px;
  overflow-y: auto;
}

.import-aux-content-inner {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
}

.json-import-footer {
  display: flex;
  flex: 0 0 auto;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 9px 24px;
  background: #fff;
  border-top: 1px solid #e5ece8;
}

.json-import-footer-tip {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: flex-start;
  min-width: 0;
  font-size: 11px;
  line-height: 1.55;
  color: #87998e;

  i {
    flex: 0 0 auto;
    margin-top: 2px;
  }

  span {
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

.json-import-footer-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;

  .el-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 14px;
    margin-left: 0;
    font-weight: 500;
    border-radius: 8px;
    white-space: nowrap;
    transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease,
      border-color .18s ease, color .18s ease;

    ::v-deep span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0;
    }

    ::v-deep i {
      margin-right: 5px;
      font-size: 13px;
      line-height: 1;
    }
  }

  .el-button:hover:not(.is-disabled) {
    transform: translateY(-1px);
  }
}

::v-deep .json-import-code {
  flex: 1;
  min-height: 220px;
  max-height: none;
  padding: 15px 17px;
  margin: 0;
  overflow: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #d8eee1;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #183226;
  border-radius: 10px;
}

::v-deep .json-import-field-table th {
  font-weight: 600;
  color: #405848;
  background: #f3f9f5;
}

@keyframes importAuxHeadingIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 900px) {
  .json-import-header {
    padding: 16px 56px 16px 16px;
  }

  .json-import-close {
    top: 18px;
    right: 16px;
  }

  .import-aux-content {
    padding: 14px 18px 18px;
  }

  .json-import-footer {
    gap: 10px;
    padding: 9px 18px;
  }

  .json-import-footer-tip {
    display: none;
  }

  .json-import-footer-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .json-import-heading {
    animation: none;
  }

  .json-import-close,
  .json-import-footer-actions .el-button {
    transition: none;
  }
}
</style>
