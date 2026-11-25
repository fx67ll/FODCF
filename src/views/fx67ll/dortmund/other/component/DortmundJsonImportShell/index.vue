<template>
  <el-drawer :visible.sync="drawerVisible" :size="responsiveSize" direction="rtl" append-to-body destroy-on-close
    :with-header="false" :wrapper-closable="false" :close-on-press-escape="!importing" :before-close="handleBeforeClose"
    custom-class="dortmund-json-import-drawer" @closed="handleClosed">
    <div class="json-import-shell">
      <header class="json-import-header">
        <div class="json-import-heading">
          <span class="json-import-mark"><i :class="icon"></i></span>
          <div class="json-import-title">
            <h2>{{ title }}</h2>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <el-button type="text" class="json-import-close" icon="el-icon-close" aria-label="关闭导入面板" :disabled="importing"
          @click="closeDrawer" />
      </header>

      <div class="json-import-content">
        <div class="json-import-content-inner">
          <section class="json-import-intro">
            <span class="json-import-intro-mark"><i :class="icon"></i></span>
            <div class="json-import-intro-copy">
              <strong>{{ introTitle }}</strong>
              <p>{{ introDescription }}</p>
            </div>
            <div class="json-import-intro-actions">
              <el-button size="mini" class="json-import-tool-btn is-template" type="primary" plain
                icon="el-icon-download" :disabled="importing" @click="$emit('download-template')">下载 JSON 模板</el-button>
              <el-button v-if="hasPrompt" size="mini" class="json-import-tool-btn is-prompt" type="success" plain
                icon="el-icon-view" :disabled="importing" @click="$emit('show-prompt')">查看 AI 采集提示词</el-button>
              <el-button size="mini" class="json-import-tool-btn is-format" type="warning" plain icon="el-icon-tickets"
                :disabled="importing" @click="$emit('show-format')">字段格式说明</el-button>
            </div>
          </section>

          <section class="json-import-card" :class="{ 'is-input-expanded': !parsed && localSourceType === 'paste' }">
            <header class="json-import-card-head">
              <div class="json-import-card-title">
                <span class="json-import-step">1</span>
                <div>
                  <strong>输入标准 JSON</strong>
                  <p>{{ sourceHint }}</p>
                </div>
              </div>
              <el-radio-group v-model="localSourceType" size="mini" class="json-import-switch" :disabled="importing"
                @change="handleSourceTypeChange">
                <el-radio-button label="paste"><i class="el-icon-document"></i> 粘贴 JSON</el-radio-button>
                <el-radio-button label="file"><i class="el-icon-folder-opened"></i> 选择文件</el-radio-button>
              </el-radio-group>
            </header>

            <div class="json-import-card-body">
              <transition name="json-import-switch" mode="out-in">
                <div v-if="localSourceType === 'paste'" key="paste" class="json-import-paste">
                  <el-input :value="rawJson" type="textarea" :rows="9" resize="none" spellcheck="false"
                    :disabled="importing" :placeholder="placeholder" @input="handleRawInput" />
                  <div class="json-import-meta">
                    <span><i class="el-icon-document"></i>{{ rawJson.length }} 字符</span>
                    <span v-if="rawJson.trim()" class="is-ready"><i class="el-icon-circle-check"></i>已输入，等待解析</span>
                    <span v-else><i class="el-icon-info"></i>支持直接粘贴 AI 返回的 JSON</span>
                  </div>
                </div>

                <div v-else key="file" class="json-import-file">
                  <el-upload drag action="#" accept=".json,application/json" :auto-upload="false"
                    :show-file-list="false" :disabled="importing" :on-change="handleFileChange"
                    class="json-import-uploader">
                    <div class="json-import-drop">
                      <span class="json-import-drop-mark"><i class="el-icon-upload"></i></span>
                      <strong>将 JSON 文件拖到这里，或点击选择文件</strong>
                      <span>仅支持 .json，单个文件不超过 10MB；选择后自动读取并校验。</span>
                    </div>
                  </el-upload>
                  <transition name="json-import-chip">
                    <div v-if="fileName" class="json-import-file-chip">
                      <i class="el-icon-document-checked"></i>
                      <span :title="fileName">{{ fileName }}</span>
                      <el-button type="text" icon="el-icon-close" :disabled="importing"
                        @click="$emit('clear')">移除</el-button>
                    </div>
                  </transition>
                </div>
              </transition>
            </div>
          </section>

          <transition name="json-import-feedback">
            <el-alert v-if="parseMessage" class="json-import-alert" type="error" :closable="false" show-icon
              :title="parseMessage" />
            <el-alert v-else-if="parsed && invalidCount" class="json-import-alert" type="warning" :closable="false"
              show-icon :title="`${invalidCount} 条数据存在字段或格式问题，已在预览中标记；问题条目不可勾选。`" />
          </transition>

          <transition name="json-import-panel">
            <section v-if="parsed" class="json-import-card json-import-preview">
              <header class="json-import-card-head is-preview">
                <div class="json-import-card-title">
                  <span class="json-import-step is-active">2</span>
                  <div>
                    <strong>选择需要导入的{{ entityLabel }}</strong>
                    <p>反复解析不会写入数据；只有勾选且通过后端校验的条目才会落库。</p>
                  </div>
                </div>
                <div class="json-import-stats">
                  <span class="is-total"><b>{{ totalCount }}</b> 条识别</span>
                  <span class="is-valid"><b>{{ validCount }}</b> 条可导入</span>
                  <span class="is-invalid"><b>{{ invalidCount }}</b> 条需修正</span>
                </div>
              </header>

              <div class="json-import-preview-toolbar">
                <span>已选择 <b>{{ selectedCount }}</b> 条</span>
                <div class="json-import-preview-actions">
                  <el-button type="text" size="mini" icon="el-icon-finished" :disabled="!validCount || importing"
                    @click="$emit('select-all')">全选有效项</el-button>
                  <el-button type="text" size="mini" icon="el-icon-delete" :disabled="!selectedCount || importing"
                    @click="$emit('clear-selection')">清空选择</el-button>
                </div>
              </div>

              <div class="json-import-preview-body">
                <slot name="preview"></slot>
              </div>
            </section>
          </transition>
        </div>
      </div>

      <footer class="json-import-footer">
        <span class="json-import-footer-tip" :class="{ 'is-parsed': parsed }">
          <i :class="parsed ? 'el-icon-lock' : 'el-icon-info'"></i>
          <span>{{ parsed ? parsedTip : idleTip }}</span>
        </span>
        <div class="json-import-footer-actions">
          <el-button size="small" class="json-import-btn" :disabled="importing" @click="closeDrawer">取消</el-button>
          <el-button size="small" class="json-import-btn" type="warning" plain icon="el-icon-refresh-left"
            :disabled="importing || !rawJson.trim()" @click="$emit('clear')">清空</el-button>
          <el-button size="small" class="json-import-btn" type="success" plain icon="el-icon-magic-stick"
            :loading="parsing" :disabled="!rawJson.trim() || importing" @click="$emit('parse')">解析并校验</el-button>
          <el-button size="small" class="json-import-btn is-import" type="primary" icon="el-icon-upload2"
            :loading="importing" :disabled="!selectedCount" @click="openImportConfirm">确认导入 {{ selectedCount }}
            条</el-button>
        </div>
      </footer>

      <!-- 勾选只改变本地预览状态；必须经过该确认步骤才会调用导入接口。 -->
      <el-dialog title="确认导入" :visible.sync="confirmVisible" width="min(520px, 92vw)" append-to-body
        custom-class="dortmund-json-import-confirm-dialog" :close-on-click-modal="false"
        :close-on-press-escape="!importing">
        <div class="json-import-confirm">
          <span class="json-import-confirm-mark"><i class="el-icon-warning-outline"></i></span>
          <div class="json-import-confirm-copy">
            <strong>将写入 {{ selectedCount }} 条{{ entityLabel }}</strong>
            <p>当前仅完成本地解析与勾选，数据库中尚未产生任何记录。确认后才会提交服务端校验并写入；任一条失败整批回滚。</p>
            <div class="json-import-confirm-stats">
              <span><b>{{ selectedCount }}</b> 条已选择</span>
              <span><b>{{ validCount }}</b> 条通过前端预检</span>
            </div>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button size="small" :disabled="importing" @click="confirmVisible = false">返回检查</el-button>
          <el-button size="small" type="primary" icon="el-icon-upload2" :loading="importing" :disabled="!selectedCount"
            @click="confirmImport">确认写入</el-button>
        </span>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "DortmundJsonImportShell",
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    icon: { type: String, default: "el-icon-upload2" },
    size: { type: String, default: "1080px" },
    entityLabel: { type: String, required: true },
    introTitle: { type: String, required: true },
    introDescription: { type: String, required: true },
    sourceHint: { type: String, required: true },
    placeholder: { type: String, default: "" },
    idleTip: { type: String, required: true },
    parsedTip: { type: String, required: true },
    rawJson: { type: String, default: "" },
    sourceType: { type: String, default: "paste" },
    fileName: { type: String, default: "" },
    parsed: { type: Boolean, default: false },
    parsing: { type: Boolean, default: false },
    importing: { type: Boolean, default: false },
    parseMessage: { type: String, default: "" },
    totalCount: { type: Number, default: 0 },
    validCount: { type: Number, default: 0 },
    invalidCount: { type: Number, default: 0 },
    selectedCount: { type: Number, default: 0 },
    hasPrompt: { type: Boolean, default: false },
  },
  data() {
    return {
      viewportWidth: typeof window === "undefined" ? 1440 : window.innerWidth,
      confirmVisible: false,
    };
  },
  watch: {
    // 抽屉由宿主关闭时同步收起确认层，避免确认框脱离当前导入上下文。
    visible(value) {
      if (!value) this.confirmVisible = false;
    },
    selectedCount(value) {
      if (!value) this.confirmVisible = false;
    },
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
    localSourceType: {
      get() {
        return this.sourceType;
      },
      set(value) {
        this.$emit("update:sourceType", value);
      },
    },
    // 窄屏使用百分比宽度，避免固定像素宽度超出视口。
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
    handleRawInput(value) {
      this.$emit("update:rawJson", value);
      this.$emit("raw-input", value);
    },
    handleSourceTypeChange(value) {
      this.$emit("update:sourceType", value);
      this.$emit("source-type-change", value);
    },
    handleFileChange(file) {
      this.$emit("file-change", file);
    },
    openImportConfirm() {
      if (this.importing || !this.selectedCount) return;
      this.confirmVisible = true;
    },
    confirmImport() {
      if (this.importing || !this.selectedCount) return;
      this.confirmVisible = false;
      this.$emit("import");
    },
    closeDrawer() {
      if (this.importing) return;
      this.drawerVisible = false;
    },
    handleBeforeClose(done) {
      if (this.importing) return;
      done();
    },
    handleClosed() {
      this.$emit("closed");
    },
  },
};
</script>

<style lang="scss" scoped>
.json-import-shell {
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
  animation: jsonImportHeadingIn .3s ease both;
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

  &.is-disabled {
    cursor: not-allowed;
    opacity: .45;
  }
}

@keyframes jsonImportHeadingIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.json-import-content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 18px 24px 22px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-color: #cbd8d1 transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd8d1;
    border: 2px solid transparent;
    border-radius: 999px;
    background-clip: padding-box;
  }
}

.json-import-content-inner {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-height: 0;
  max-width: 100%;
}

.json-import-intro {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f1faf5 0%, #fbfdfc 64%, #f4faf7 100%);
  border: 1px solid #dceee3;
  border-radius: 12px;
  animation: json-import-rise .3s ease both;
}

.json-import-intro-mark {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  color: #2fa866;
  font-size: 15px;
  background: #fff;
  border: 1px solid #d6ecdf;
  border-radius: 9px;
  box-shadow: 0 4px 10px rgba(47, 168, 102, .08);
  place-items: center;
}

.json-import-intro-copy {
  flex: 1 1 420px;
  min-width: 0;

  strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    color: #2b4335;
  }

  p {
    margin: 3px 0 0;
    font-size: 11px;
    line-height: 1.6;
    color: #75867c;
  }
}

.json-import-intro-actions {
  display: flex;
  flex: 1 1 100%;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-start;
  padding: 0 0 0 44px;
  position: relative;
  left: -3px;

  .el-button {
    margin-left: 0;
  }
}

.json-import-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 11px;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: none;
  transition: color .18s ease, border-color .18s ease, background-color .18s ease,
    box-shadow .18s ease, transform .18s ease;

  ::v-deep span {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    justify-content: center;
    margin-left: 0;
  }

  ::v-deep i {
    margin-right: 5px;
    font-size: 13px;
    line-height: 1;
  }

  &:hover:not(.is-disabled),
  &:focus:not(.is-disabled) {
    box-shadow: 0 5px 12px rgba(64, 158, 255, .12);
    transform: translateY(-1px);
  }

  &:active:not(.is-disabled) {
    transform: translateY(0) scale(.98);
  }

  &.is-disabled {
    cursor: not-allowed;
    box-shadow: none;
    opacity: .62;
    transform: none;
  }

  &.is-template {
    color: #2f8be6;
    background: #f5faff;
    border-color: #cfe5fc;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #1f7edb;
      background: #edf6ff;
      border-color: #9fcdf8;
      box-shadow: 0 5px 12px rgba(64, 158, 255, .14);
    }
  }

  &.is-prompt {
    color: #2b9c61;
    background: #f4fcf7;
    border-color: #cfeedd;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #218b52;
      background: #ebf9f1;
      border-color: #9ad8b5;
      box-shadow: 0 5px 12px rgba(47, 168, 102, .13);
    }
  }

  &.is-format {
    color: #c78320;
    background: #fffaf1;
    border-color: #f3e0bd;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #b47112;
      background: #fff5e5;
      border-color: #edc889;
      box-shadow: 0 5px 12px rgba(230, 162, 60, .14);
    }
  }
}

.json-import-card {
  background: #fff;
  border: 1px solid #e3ece7;
  border-radius: 12px;
  box-shadow: 0 5px 18px rgba(38, 74, 53, .05);
  animation: json-import-rise .32s ease both;
}

.json-import-card-head {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #fbfdfc;
  border-bottom: 1px solid #eaf1ed;
  border-radius: 12px 12px 0 0;
}

.json-import-card-head.is-preview {
  align-items: flex-start;
  background: linear-gradient(135deg, #f3fbf6, #fbfdfc);
}

.json-import-card-title {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;

  >div {
    min-width: 0;
  }

  strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    color: #2c4336;
  }

  p {
    margin: 3px 0 0;
    font-size: 11px;
    line-height: 1.55;
    color: #84938a;
  }
}

.json-import-step {
  display: grid;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  margin-top: 1px;
  font-size: 12px;
  font-weight: 700;
  color: #6d8377;
  background: #f1f6f3;
  border: 1px solid #dfeae3;
  border-radius: 8px;
  place-items: center;
  transition: color .2s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease;

  &.is-active {
    color: #fff;
    background: #2fa866;
    border-color: #2fa866;
    box-shadow: 0 0 0 3px rgba(47, 168, 102, .12);
    animation: json-import-step-pulse .38s ease both;
  }
}

.json-import-switch {
  flex: 0 0 auto;
  padding: 2px;
  overflow: hidden;
  background: #f2f8f5;
  border: 1px solid #e0eee6;
  border-radius: 10px;

  ::v-deep .el-radio-button__inner {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    height: 26px;
    padding: 0 12px;
    color: #5b7164;
    background: transparent;
    border: 0;
    border-radius: 7px;
    box-shadow: none;
    transition: color .18s ease, background-color .18s ease, box-shadow .18s ease,
      transform .18s ease;
  }

  ::v-deep .el-radio-button__inner i {
    margin-right: 0;
    font-size: 13px;
    line-height: 1;
  }

  ::v-deep .el-radio-button__inner:hover {
    color: #238a52;
    background: #e8f6ee;
  }

  ::v-deep .el-radio-button__orig-radio:checked+.el-radio-button__inner {
    color: #fff;
    background: #2fa866;
    border-color: transparent;
    box-shadow: 0 3px 9px rgba(47, 168, 102, .22);
  }

  ::v-deep .el-radio-button__orig-radio:focus+.el-radio-button__inner {
    box-shadow: 0 0 0 2px rgba(47, 168, 102, .18);
  }

  ::v-deep .el-radio-button__orig-radio:checked:focus+.el-radio-button__inner {
    box-shadow: 0 3px 9px rgba(47, 168, 102, .22), 0 0 0 2px rgba(47, 168, 102, .16);
  }
}

.json-import-card.is-input-expanded {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 296px;
}

.json-import-card.is-input-expanded .json-import-card-head {
  flex: 0 0 auto;
}

.json-import-card.is-input-expanded .json-import-card-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.json-import-card.is-input-expanded .json-import-paste {
  flex: 1 1 auto;
  min-height: 0;
}

.json-import-card-body {
  box-sizing: border-box;
  padding: 14px;
}

.json-import-paste {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.json-import-paste ::v-deep .el-textarea {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.json-import-paste ::v-deep .el-textarea__inner {
  min-height: 176px !important;
  padding: 11px 12px;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.65;
  color: #33463b;
  background: #fbfdfc;
  border-color: #dce8e1;
  border-radius: 9px;
  transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;

  &:hover {
    border-color: #b9d9c5;
  }

  &:focus {
    background: #fff;
    border-color: #55bc80;
    box-shadow: 0 0 0 3px rgba(47, 168, 102, .1);
  }
}

.json-import-card.is-input-expanded .json-import-paste ::v-deep .el-textarea__inner {
  height: 100% !important;
}

.json-import-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  justify-content: space-between;
  font-size: 11px;
  line-height: 1.5;
  color: #8b9a91;

  span {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  .is-ready {
    color: #2e9b5c;
  }
}

.json-import-file {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.json-import-uploader ::v-deep .el-upload,
.json-import-uploader ::v-deep .el-upload-dragger {
  width: 100%;
}

.json-import-uploader ::v-deep .el-upload-dragger {
  padding: 20px 16px;
  background: linear-gradient(145deg, #fbfefc, #f3faf6);
  border: 1px dashed #b9dec9;
  border-radius: 11px;
  transition: background-color .2s ease, border-color .2s ease, box-shadow .2s ease;

  &:hover {
    background: #f2fbf6;
    border-color: #55bc80;
    box-shadow: 0 8px 20px rgba(47, 168, 102, .09);
  }
}

.json-import-drop {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 132px;
  text-align: center;
  pointer-events: none;

  strong {
    font-size: 13px;
    color: #356149;
  }

  span {
    font-size: 11px;
    line-height: 1.55;
    color: #8a9b91;
  }
}

.json-import-drop-mark {
  display: flex !important;
  justify-content: center;
  align-items: center !important;
  // display: grid;
  width: 80px;
  height: 60px;
  font-size: 20px;
  color: #2fa866;
  background: #e9f9f0;
  border-radius: 12px;
  place-items: center;
  transition: transform .2s ease;
}

.json-import-drop-mark>.el-icon-upload {
  margin-top: 16px !important;
}


.json-import-uploader:hover .json-import-drop-mark {
  transform: translateY(-2px);
}

.json-import-file-chip {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 11px;
  font-size: 12px;
  color: #3b7452;
  background: #effaf3;
  border: 1px solid #d3ecdd;
  border-radius: 9px;

  >span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.json-import-alert {
  margin: 0;
  border-radius: 10px;
}

.json-import-preview {
  overflow: hidden;
}

.json-import-stats {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;

  span {
    padding: 4px 9px;
    font-size: 11px;
    line-height: 1.4;
    border: 1px solid transparent;
    border-radius: 999px;
  }

  b {
    margin-right: 2px;
    font-size: 13px;
  }

  .is-total {
    color: #587264;
    background: #f2f7f4;
    border-color: #e1ece5;
  }

  .is-valid {
    color: #2d8752;
    background: #ecfaf1;
    border-color: #cfeddb;
  }

  .is-invalid {
    color: #b25b45;
    background: #fff6f2;
    border-color: #f3ddd5;
  }
}

.json-import-preview-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  font-size: 11px;
  color: #7f9186;
  background: #fff;
  border-bottom: 1px solid #edf3ef;

  b {
    color: #248a53;
  }
}

.json-import-preview-actions {
  display: flex;
  gap: 2px;
  align-items: center;

  .el-button {
    margin-left: 0;
  }
}

.json-import-preview-body {
  padding: 0 14px 14px;
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

  &.is-parsed {
    color: #6f8679;
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
      transition: transform .18s ease;
    }
  }

  .el-button:hover:not(.is-disabled) {
    transform: translateY(-1px);
  }

  .el-button:active:not(.is-disabled) {
    transform: translateY(0) scale(.98);
  }

  .is-import {
    position: relative;
    overflow: hidden;
    color: #fff !important;
    background: linear-gradient(135deg, #57a8ff 0%, #409eff 56%, #348ff0 100%) !important;
    border-color: #409eff !important;
    box-shadow: 0 6px 15px rgba(64, 158, 255, .2);

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, .24) 48%,
          transparent 72%);
      transform: translateX(-120%);
      transition: transform .48s ease;
    }

    ::v-deep .el-icon-upload2 {
      transition: transform .18s ease;
    }

    &:hover,
    &:focus {
      color: #fff !important;
      background: linear-gradient(135deg, #68b2ff 0%, #4aa7ff 56%, #3b98f5 100%) !important;
      border-color: #66b1ff !important;
      box-shadow: 0 7px 16px rgba(64, 158, 255, .26);
    }

    &:hover:not(.is-disabled)::after,
    &:focus:not(.is-disabled)::after {
      transform: translateX(120%);
    }

    &:hover:not(.is-disabled) ::v-deep .el-icon-upload2,
    &:focus:not(.is-disabled) ::v-deep .el-icon-upload2 {
      transform: translateY(-1px);
    }

    &.is-disabled {
      color: #fff !important;
      background: #a0cfff !important;
      border-color: #a0cfff !important;
      box-shadow: none;
    }
  }
}

.json-import-confirm {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 2px 2px 4px;
}

.json-import-confirm-mark {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 21px;
  color: #2d8752;
  background: #ecf8f1;
  border: 1px solid #d7eee1;
  border-radius: 12px;
}

.json-import-confirm-copy {
  min-width: 0;

  strong {
    display: block;
    margin-bottom: 7px;
    font-size: 15px;
    color: #2f493b;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.7;
    color: #6f8377;
  }
}

.json-import-confirm-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;

  span {
    padding: 5px 9px;
    font-size: 11px;
    color: #5d7568;
    background: #f3f8f5;
    border: 1px solid #e0ece5;
    border-radius: 999px;
  }

  b {
    color: #248a53;
  }
}

@keyframes json-import-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes json-import-step-pulse {
  0% {
    transform: scale(.86);
  }

  60% {
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
  }
}

.json-import-switch-enter-active,
.json-import-switch-leave-active,
.json-import-panel-enter-active,
.json-import-panel-leave-active,
.json-import-feedback-enter-active,
.json-import-feedback-leave-active,
.json-import-chip-enter-active,
.json-import-chip-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.json-import-switch-enter,
.json-import-switch-leave-to,
.json-import-panel-enter,
.json-import-panel-leave-to,
.json-import-feedback-enter,
.json-import-feedback-leave-to,
.json-import-chip-enter,
.json-import-chip-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.json-import-panel-enter,
.json-import-panel-leave-to {
  transform: translateY(10px);
}

@media (max-width: 1280px) {
  .json-import-card-head {
    flex-wrap: wrap;
  }

  .json-import-switch {
    margin-left: 34px;
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

  .json-import-content {
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

  .json-import-footer-actions .el-button {
    padding: 0 10px;
  }
}

@media (prefers-reduced-motion: reduce) {

  .json-import-intro,
  .json-import-card,
  .json-import-step.is-active,
  .json-import-heading {
    animation: none;
  }

  .json-import-close,
  .json-import-tool-btn,
  .json-import-footer-actions .el-button,
  .json-import-footer-actions .el-button ::v-deep i,
  .json-import-drop-mark,
  .json-import-switch-enter-active,
  .json-import-switch-leave-active,
  .json-import-panel-enter-active,
  .json-import-panel-leave-active,
  .json-import-feedback-enter-active,
  .json-import-feedback-leave-active,
  .json-import-chip-enter-active,
  .json-import-chip-leave-active {
    transition: none;
  }
}
</style>
