<template>
  <section class="panel memo-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">RICH MEMO</span>
        <div class="panel-title-row">
          <h3>备忘录</h3>
          <panel-refresh v-if="canList" :loading="refreshing" :timestamp="lastRefreshTime" @refresh="refresh" />
        </div>
      </div>
      <div class="panel-head-actions">
        <button v-if="hasMemoMenu" type="button" class="panel-glyph-btn" title="管理全部备忘" @click="openMemoMenu">
          <i class="el-icon-folder-opened panel-glyph glyph-nudge"></i>
        </button>
        <button v-if="canAdd" type="button" class="memo-write" @click="handleAdd">
          <i class="el-icon-edit"></i> 写备忘
        </button>
        <i v-if="!canAdd" class="el-icon-edit-outline panel-glyph glyph-wobble"></i>
      </div>
    </div>

    <!-- 有列表权限：展示最近备忘 -->
    <div v-if="canList" v-loading="loading" :class="{ 'refresh-flash': flashing }" class="memo-body">
      <button v-for="item in memos" :key="item.noteId" type="button" class="memo-item" :class="{ clickable: canEdit }"
        @click="canEdit && handleEdit(item)">
        <span class="memo-pin"></span>
        <span class="memo-copy">
          <strong>{{ titleOf(item) }}</strong>
          <small>{{ snippet(item.noteContent) }}</small>
        </span>
        <span class="meta">
          <span class="meta-by"><i class="el-icon-user"></i>{{ item.createBy || "我" }}</span>
          <span class="meta-time">{{ formatTime(item.updateTime || item.createTime) }}</span>
        </span>
      </button>

      <home-empty-state v-if="!loading && !memos.length" inline icon="el-icon-edit" :title="canAdd ? '还没有备忘' : '暂无备忘记录'"
        :desc="canAdd ? '点击「写备忘」，随手记录一条富文本备忘' : '有备忘记录后会展示在这里'" />
    </div>

    <!-- 无列表权限：不调用接口，避免 403 报错，仅静态空状态 -->
    <div v-else class="memo-body">
      <home-empty-state inline icon="el-icon-lock" title="暂无备忘录访问权限" desc="当前账号未开放备忘录查看权限" />
    </div>

    <!-- 写备忘 / 编辑弹窗（与富文本备忘页共享同一组件） -->
    <memo-edit-dialog :visible.sync="dialogOpen" :model="editModel" @success="handleSaved" />
  </section>
</template>

<script>
import { listNoteLog } from "@/api/fx67ll/note/log";
import MemoEditDialog from "@/views/fx67ll/note/component/MemoEditDialog.vue";
import panelRefreshMixin from "../refreshMixin";
import PanelRefresh from "./PanelRefresh.vue";
import HomeEmptyState from "./EmptyState.vue";

export default {
  name: "HomeMemoBlock",
  components: { MemoEditDialog, PanelRefresh, HomeEmptyState },
  mixins: [panelRefreshMixin],
  data() {
    return {
      loading: false,
      memos: [],
      dialogOpen: false,
      // 当前编辑的备忘对象；空对象视为新增
      editModel: {},
    };
  },
  computed: {
    canList() {
      return this.hasPerm("note:log:list");
    },
    canAdd() {
      return this.hasPerm("note:log:add");
    },
    canEdit() {
      return this.hasPerm("note:log:edit");
    },
    // 是否存在备忘录菜单入口（用于「管理全部备忘」）
    hasMemoMenu() {
      const menus = this.$store.getters.sidebarRouters || [];
      return this.findMemoPath(menus, "") !== "";
    },
  },
  mounted() {
    // 仅在有列表权限时拉取，避免无权限账号触发 403 全局错误提示
    if (this.canList) {
      this.fetchMemos();
    }
  },
  methods: {
    hasPerm(perm) {
      const perms = this.$store.getters.permissions || [];
      return perms.indexOf("*:*:*") !== -1 || perms.indexOf(perm) !== -1;
    },
    // 面板刷新：标题右侧按钮触发，供欢迎区一键刷新调用
    refresh() {
      if (!this.canList) return Promise.resolve();
      return this.runRefresh(() => this.fetchMemos());
    },
    fetchMemos() {
      this.loading = true;
      listNoteLog({ pageNum: 1, pageSize: 5 })
        .then((response) => {
          this.memos = (response && response.rows) || [];
        })
        .catch(() => {
          this.memos = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    titleOf(item) {
      return item.noteRemark ? item.noteRemark : "无标题备忘";
    },
    snippet(html) {
      const text = String(html || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      return text ? (text.length > 64 ? text.slice(0, 64) + "…" : text) : "（空内容）";
    },
    formatTime(time) {
      if (!time) return "—";
      return this.parseTime ? this.parseTime(time, "{m}-{d} {h}:{i}") : String(time);
    },
    handleAdd() {
      this.editModel = {};
      this.dialogOpen = true;
    },
    handleEdit(item) {
      this.editModel = {
        noteId: item.noteId,
        noteRemark: item.noteRemark || "",
        noteContent: item.noteContent || "",
      };
      this.dialogOpen = true;
    },
    // 共享弹窗保存成功后刷新列表
    handleSaved() {
      if (this.canList) this.fetchMemos();
    },
    findMemoPath(routes, parent) {
      // 在可访问菜单里定位富文本记录菜单路径。
      // sidebarRouters 中 component 已被 filterAsyncRouter 替换为组件对象，不能按 component 匹配，
      // 否则永远找不到菜单入口，右上角按钮退化为不显示（与未开奖号码卡片历史问题同因）。
      let result = "";
      (routes || []).some((route) => {
        if (!route || route.hidden) return false;
        const path = this.joinPath(parent, route.path);
        if (/note\/log/i.test(path)) {
          result = path;
          return true;
        }
        if (route.children && route.children.length) {
          result = this.findMemoPath(route.children, path);
          if (result) return true;
        }
        return false;
      });
      return result;
    },
    joinPath(parent, child) {
      if (!child) return parent || "/";
      if (/^(https?:)?\/\//.test(child)) return child;
      if (child.charAt(0) === "/") return child;
      return `${parent || ""}/${child}`.replace(/\/{2,}/g, "/");
    },
    openMemoMenu() {
      const path = this.findMemoPath(this.$store.getters.sidebarRouters || [], "");
      if (path) this.$router.push(path).catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;

.memo-panel {
  display: flex;
  flex-direction: column;
  /* 修复紧贴上一面板（活动/架构面板）导致的缺少上边距问题 */
  margin-top: 18px;
  margin-bottom: 18px;
}

.memo-write {
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

.panel-glyph {
  color: $primary;
  font-size: 22px;
}

/* 右上角「管理全部备忘」图标按钮（悬浮动效由共享 .glyph-nudge 提供） */
.panel-glyph-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;

  .panel-glyph {
    transition: color 0.3s ease, transform 0.3s ease;
  }

  &:hover .panel-glyph {
    color: $primary-dark;
  }
}

.memo-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memo-item {
  display: flex;
  align-items: center;
  padding: 12px 4px;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #eef3f0;
  transition: background 0.2s ease;

  &.clickable {
    cursor: pointer;
  }

  &:hover {
    background: var(--home-primary-softer);
  }

  &:last-of-type {
    border-bottom: 0;
  }
}

.memo-pin {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  margin-right: 12px;
  background: $primary;
  border-radius: 50%;
}

.memo-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;

  strong {
    overflow: hidden;
    color: $ink;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.meta {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 12px;
  color: $muted;
  font-size: 10px;

  .meta-by {
    margin-bottom: 4px;

    i {
      margin-right: 3px;
    }
  }
}

.panel-head {
  i {
    cursor: pointer;
  }
}
</style>
