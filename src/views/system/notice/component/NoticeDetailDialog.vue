<template>
  <!-- :style="`top: ${getDialogVerticalOffset(0)}`" -->
  <el-dialog :title="notice.noticeTitle" :visible.sync="dialogVisible" :close-on-click-modal="false" width="780px"
    append-to-body custom-class="notice-detail-dialog">
    <div class="notice-detail-meta">
      <span class="notice-type-tag" :class="'type-' + notice.noticeType">{{ typeText(notice.noticeType) }}</span>
      <span class="notice-detail-author">发布者：{{ notice.createBy || "系统" }}</span>
      <span class="notice-detail-time">发布时间：{{ parseTime(notice.createTime) }}</span>
    </div>
    <el-divider></el-divider>
    <div class="notice-detail-content" v-html="notice.noticeContent"></div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
// import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "NoticeDetailDialog",
  dicts: ["sys_notice_type"],
  props: {
    // 是否显示弹窗（支持 .sync）
    visible: {
      type: Boolean,
      default: false,
    },
    // 公告详情对象
    notice: {
      type: Object,
      default: () => ({}),
    },
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
    // getDialogVerticalOffset(offset) {
    //   return getDialogVerticalOffset(offset);
    // },
    /** 类型文本 */
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((d) => d.value === noticeType);
      return dict ? dict.label : "公告";
    },
    /** 关闭弹窗 */
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .notice-detail-dialog {
  .notice-detail-meta {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #909399;

    .notice-type-tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      color: #fff;
      margin-right: 16px;

      &.type-1 {
        background: #ff9900;
      }

      &.type-2 {
        background: #2ecc71;
      }
    }

    .notice-detail-author {
      margin-right: 16px;
    }
  }

  .notice-detail-content {
    font-size: 14px;
    color: #303133;
    line-height: 1.8;
    max-height: 420px;
    overflow-y: auto;
    padding: 0 4px;

    img {
      max-width: 100%;
      border-radius: 4px;
    }

    p {
      margin: 8px 0;
    }
  }
}
</style>
