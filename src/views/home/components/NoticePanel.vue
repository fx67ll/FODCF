<template>
  <section class="panel notice-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">NOTICE BOARD</span>
        <div class="panel-title-row">
          <h3>通知公告</h3>
          <panel-refresh v-if="canList" :loading="refreshing" :timestamp="lastRefreshTime" @refresh="refresh" />
        </div>
      </div>
      <div class="panel-head-actions">
        <button v-if="canList" type="button" class="panel-glyph-btn" title="管理全部公告" @click="goManage">
          <i class="el-icon-folder-opened panel-glyph glyph-nudge"></i>
        </button>
        <button v-if="canAdd" type="button" class="notice-write" @click="handleAdd">
          <i class="el-icon-bell"></i> 写公告
        </button>
      </div>
    </div>

    <!-- 有列表权限：展示最近公告，可查看 / 编辑 / 上下架 / 删除 -->
    <div v-if="canList" v-loading="loading" :class="{ 'refresh-flash': flashing }" class="notice-body">
      <div v-for="item in notices" :key="item.noticeId" class="notice-item">
        <span class="notice-type-tag" :class="'type-' + item.noticeType">{{ typeText(item.noticeType) }}</span>
        <button type="button" class="notice-copy" @click="handleView(item)">
          <strong>{{ item.noticeTitle }}</strong>
          <small>{{ item.createBy || "我" }} · {{ formatTime(item.createTime) }}</small>
        </button>
        <span class="notice-status" :class="item.status === '0' ? 'on' : 'off'">{{ statusText(item.status) }}</span>
        <div class="notice-ops">
          <button v-if="canEdit" type="button" title="编辑公告" @click="handleEdit(item)">
            <i class="el-icon-edit"></i>
          </button>
          <button v-if="canEdit" type="button" :title="item.status === '0' ? '下架公告' : '上架公告'"
            @click="handleShelf(item)">
            <i :class="item.status === '0' ? 'el-icon-bottom' : 'el-icon-top'"></i>
          </button>
          <button v-if="canRemove" type="button" title="删除公告" @click="handleDelete(item)">
            <i class="el-icon-delete"></i>
          </button>
        </div>
      </div>

      <home-empty-state v-if="!loading && !notices.length" inline icon="el-icon-bell" title="还没有公告"
        :desc="canAdd ? '点击「写公告」，保存即直接发布，全员首页可见' : '有公告记录后会展示在这里'" />
    </div>

    <!-- 无列表权限：不调用接口，避免 403 报错，仅静态空状态 -->
    <div v-else class="notice-body">
      <home-empty-state inline icon="el-icon-lock" title="暂无公告访问权限" desc="当前账号未开放公告查看权限" />
    </div>

    <!-- 写公告 / 编辑弹窗（富文本，直接发布） -->
    <notice-compose-dialog :visible.sync="dialogOpen" :model="editModel" @success="handleSaved" />
    <!-- 公告详情弹窗（信封样式，与公告条/公告页共享） -->
    <notice-detail-dialog :visible.sync="detailOpen" :notice="detailNotice" />
  </section>
</template>

<script>
import { listNotice, getNotice, delNotice, updateNotice } from "@/api/system/notice";
import NoticeDetailDialog from "@/views/system/notice/component/NoticeDetailDialog.vue";
import panelRefreshMixin from "../refreshMixin";
import PanelRefresh from "./PanelRefresh.vue";
import HomeEmptyState from "./EmptyState.vue";
import NoticeComposeDialog from "@/views/system/notice/component/NoticeComposeDialog.vue";
import { NOTICE_MANAGE_PATH } from "@/views/system/notice/constants";

export default {
  name: "HomeNoticePanel",
  components: { NoticeComposeDialog, NoticeDetailDialog, PanelRefresh, HomeEmptyState },
  dicts: ["sys_notice_type", "sys_notice_status"],
  mixins: [panelRefreshMixin],
  data() {
    return {
      loading: false,
      notices: [],
      dialogOpen: false,
      // 当前编辑的公告行；空对象视为新增
      editModel: {},
      detailOpen: false,
      detailNotice: {},
    };
  },
  computed: {
    canList() {
      return this.hasPerm("system:notice:list");
    },
    canAdd() {
      return this.hasPerm("system:notice:add");
    },
    canEdit() {
      return this.hasPerm("system:notice:edit");
    },
    canRemove() {
      return this.hasPerm("system:notice:remove");
    },
  },
  mounted() {
    // 仅在有列表权限时拉取，避免无权限账号触发 403 全局错误提示
    if (this.canList) {
      this.fetchNotices();
    }
  },
  methods: {
    hasPerm(perm) {
      const perms = this.$store.getters.permissions || [];
      return perms.indexOf("*:*:*") !== -1 || perms.indexOf(perm) !== -1;
    },
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((item) => item.value === noticeType);
      return dict ? dict.label : "公告";
    },
    statusText(status) {
      const dict = (this.dict.type.sys_notice_status || []).find((item) => item.value === status);
      return dict ? dict.label : "未知";
    },
    formatTime(time) {
      if (!time) return "—";
      return this.parseTime ? this.parseTime(time, "{y}-{m}-{d}") : String(time);
    },
    // 面板刷新：标题右侧按钮触发，供欢迎区一键刷新调用
    refresh() {
      if (!this.canList) return Promise.resolve();
      return this.runRefresh(() => this.fetchNotices());
    },
    fetchNotices() {
      this.loading = true;
      listNotice({ pageNum: 1, pageSize: 5 })
        .then((response) => {
          this.notices = (response && response.rows) || [];
        })
        .catch(() => {
          this.notices = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    handleAdd() {
      this.editModel = {};
      this.dialogOpen = true;
    },
    handleEdit(item) {
      this.editModel = { ...item };
      this.dialogOpen = true;
    },
    // 撰写弹窗保存成功后刷新列表
    handleSaved() {
      if (this.canList) this.fetchNotices();
    },
    // 查看公告详情（弹窗内容由接口返回的完整公告填充）
    handleView(item) {
      getNotice(item.noticeId)
        .then((response) => {
          this.detailNotice = (response && response.data) || {};
          this.detailOpen = true;
        })
        .catch(() => { });
    },
    // 上架 / 下架切换（与公告管理页同口径）
    handleShelf(item) {
      const nextStatus = item.status === "0" ? "1" : "0";
      const text = nextStatus === "0" ? "上架" : "下架";
      this.$modal
        .confirm(`确认将公告「${item.noticeTitle}」设为${text}吗？`)
        .then(() => {
          return updateNotice({
            noticeId: item.noticeId,
            status: nextStatus,
            noticeTitle: item.noticeTitle,
            noticeType: item.noticeType,
          });
        })
        .then(() => {
          item.status = nextStatus;
          this.$modal.msgSuccess(`${text}成功`);
        })
        .catch(() => { });
    },
    handleDelete(item) {
      this.$modal
        .confirm(`是否确认删除公告「${item.noticeTitle}」吗？`)
        .then(() => {
          return delNotice(item.noticeId);
        })
        .then(() => {
          this.fetchNotices();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
    },
    goManage() {
      this.$router.push(NOTICE_MANAGE_PATH).catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;

.notice-panel {
  display: flex;
  flex-direction: column;
  /* 与备忘录面板一致：避免紧贴上一面板 */
  margin-top: 18px;
}

.notice-write {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  color: #fff;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.24);
  cursor: pointer;
  font-size: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 9px 18px rgba(46, 204, 113, 0.3);
  }
}

/* 右上角「管理全部公告」图标按钮（悬浮动效由共享 .glyph-nudge 提供） */
.panel-glyph {
  color: $primary;
  font-size: 22px;
  transition: color 0.3s ease, transform 0.3s ease;
}

.panel-glyph-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;

  &:hover .panel-glyph {
    color: $primary-dark;
  }
}

.notice-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notice-item {
  display: flex;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid #eef3f0;
  transition: background 0.2s ease;

  &:hover {
    background: var(--home-primary-softer);

    .notice-ops {
      opacity: 1;
    }
  }

  &:last-of-type {
    border-bottom: 0;
  }
}

/* 类型标签（与公告条 NoticeBanner 同配色：通知橙 / 公告绿） */
.notice-type-tag {
  flex: 0 0 auto;
  margin-right: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;

  &.type-1 {
    background: linear-gradient(135deg, #fdba74, #f97316);
  }

  &.type-2 {
    background: linear-gradient(135deg, #86efac, #2ecc71);
  }
}

.notice-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;

  strong {
    overflow: hidden;
    color: $ink;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      color: $primary-dark;
    }
  }

  small {
    margin-top: 4px;
    overflow: hidden;
    color: $muted;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 上 / 下架状态点 */
.notice-status {
  flex: 0 0 auto;
  margin-left: 12px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10px;

  &.on {
    color: $primary-dark;
    background: var(--home-primary-soft);
  }

  &.off {
    color: #b9770e;
    background: #fff6e5;
  }
}

/* 行内操作：默认淡化，悬浮行时显现 */
.notice-ops {
  display: flex;
  flex: 0 0 auto;
  gap: 2px;
  margin-left: 10px;
  opacity: 0;
  transition: opacity 0.2s ease;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    color: $muted;
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: color 0.2s ease, background 0.2s ease;

    &:hover {
      color: $primary-dark;
      background: var(--home-primary-soft);
    }
  }
}

@media (max-width: 700px) {
  .notice-status {
    display: none;
  }
}
</style>
