<template>
  <!-- 数值模拟版本管理弹窗（版本启用停用） -->
  <el-dialog title="管理模拟版本" :visible.sync="dialogVisible" :close-on-click-modal="false" width="560px"
    :style="`top: ${getDialogVerticalOffset(420)}`" append-to-body>
    <div class="sim-version-manage-tip">
      <i class="el-icon-info"></i>
      停用后版本将不在版本下拉中展示，轮次记录仍保留，可随时重新启用；停用当前选中版本时将自动切换到最新启用版本
    </div>
    <div class="sim-version-manage-list" v-loading="switching">
      <div class="sim-version-manage-item" v-for="version in simVersionList" :key="version.versionId"
        :class="{ disabled: version.delFlag === '2' }">
        <div class="sim-version-manage-info">
          <div class="sim-version-manage-title">
            <span class="sim-version-manage-no">版本{{ version.versionNo }}</span>
            <span class="sim-version-manage-tag" :class="version.simMode === 'half' ? 'half' : 'full'">{{
              version.simMode === "half" ? "半量滚动" : "全量滚动" }}</span>
          </div>
          <div class="sim-version-manage-desc">
            初始 {{ version.initialValue }} · 系数 {{ version.coefficient }} · 目标 {{ version.targetValue }}
          </div>
          <div class="sim-version-manage-time">{{ parseTime(version.createTime, "{y}-{m}-{d} {h}:{i}") }}</div>
        </div>
        <el-switch :value="version.delFlag === '2' ? '2' : '0'" active-value="0" inactive-value="2"
          active-color="#2ecc71" @change="(val) => handleVersionSwitch(version, val)" />
      </div>
      <div class="sim-version-manage-empty" v-if="simVersionList.length === 0">暂无版本记录</div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="dialogVisible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { updateExtraSimulateVersion } from "@/api/fx67ll/dortmund/extraSimulate";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimVersionManageDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 数值模拟版本记录列表
    simVersionList: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // 版本启用停用提交中状态
      switching: false,
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 切换版本启用停用状态，保存后通知父组件刷新版本列表
    handleVersionSwitch(version, delFlag) {
      const self = this;
      this.switching = true;
      updateExtraSimulateVersion({
        versionId: version.versionId,
        delFlag: delFlag,
      })
        .then(() => {
          self.$modal.msgSuccess(
            delFlag === "2" ? `版本${version.versionNo}已停用` : `版本${version.versionNo}已启用`
          );
          self.$emit("success");
        })
        .finally(() => {
          self.switching = false;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.sim-version-manage-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 14px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #8392a5;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  i {
    margin-top: 2px;
    color: #2ecc71;
  }
}

.sim-version-manage-list {
  max-height: 360px;
  overflow-y: auto;
}

.sim-version-manage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.25s ease;

  &:hover {
    border-color: #2ecc71;
    box-shadow: 0 2px 10px rgba(46, 204, 113, 0.12);
  }

  &.disabled {
    background: #f8fafc;

    .sim-version-manage-no,
    .sim-version-manage-desc,
    .sim-version-manage-time {
      color: #c0c4cc;
    }
  }
}

.sim-version-manage-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sim-version-manage-no {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.sim-version-manage-tag {
  padding: 1px 8px;
  font-size: 12px;
  border-radius: 10px;

  &.full {
    color: #2ecc71;
    background: #eafaf3;
  }

  &.half {
    color: #f39c12;
    background: #fdf6ec;
  }
}

.sim-version-manage-desc {
  margin-bottom: 2px;
  font-size: 12px;
  color: #8392a5;
}

.sim-version-manage-time {
  font-size: 12px;
  color: #b0b6bf;
}

.sim-version-manage-empty {
  padding: 32px 0;
  font-size: 13px;
  color: #909399;
  text-align: center;
}
</style>
