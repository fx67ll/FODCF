<template>
  <section class="panel undrawn-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">UNDRAWN NUMBERS</span>
        <div class="panel-title-row">
          <h3>未开奖号码</h3>
          <panel-refresh v-if="canList" :loading="refreshing" :timestamp="lastRefreshTime" @refresh="refresh" />
        </div>
      </div>
      <div v-if="canList" class="panel-head-actions">
        <button v-if="hasLotteryMenu" type="button" class="panel-glyph-btn" title="号码台账" @click="openLotteryMenu">
          <i class="el-icon-tickets panel-glyph glyph-lift"></i>
        </button>
        <i v-else class="el-icon-tickets panel-glyph glyph-lift" title="号码台账"></i>
      </div>
      <i v-else class="el-icon-tickets panel-glyph glyph-lift" title="号码台账"></i>
    </div>

    <div v-if="canList" v-loading="loading" :class="{ 'refresh-flash': flashing }" class="undrawn-body">
      <!-- 固定汇总头（期数 + 未开奖注数） -->
      <div v-if="!loading && list.length" class="undrawn-summary">
        <span class="undrawn-summary-item"><b><animated-number :value="summary.periods" :trigger="refreshTick" /></b>
          期</span>
        <span class="undrawn-summary-sep"></span>
        <span class="undrawn-summary-item"><b><animated-number :value="summary.bets" :trigger="refreshTick" /></b>
          注未开奖</span>
      </div>

      <div v-for="item in list" :key="item.lotteryId" class="undrawn-item">
        <span class="undrawn-pin"></span>
        <div class="undrawn-copy">
          <div class="undrawn-top">
            <strong class="undrawn-issue">{{ item.dateCode || "无期号" }}</strong>
            <span class="undrawn-type">{{ typeText(item.numberType) }}</span>
          </div>
          <div class="undrawn-bets">
            <div v-if="item._recordBets.length" class="undrawn-bet-group">
              <span class="undrawn-bet-source">购买</span>
              <span v-for="(bet, idx) in item._recordBets" :key="`record-${idx}`" class="undrawn-bet">{{ bet }}</span>
            </div>
            <div v-if="item._chaseBets.length" class="undrawn-bet-group">
              <span class="undrawn-bet-source undrawn-bet-source-chase">追号</span>
              <span v-for="(bet, idx) in item._chaseBets" :key="`chase-${idx}`" class="undrawn-bet">{{ bet }}</span>
            </div>
            <span v-if="!item._recordBets.length && !item._chaseBets.length"
              class="undrawn-bet undrawn-bet-empty">（无号码）</span>
          </div>
        </div>
        <button type="button" class="undrawn-query" :disabled="queryingId === item.lotteryId"
          @click="queryReward(item)">
          <i :class="queryingId === item.lotteryId ? 'el-icon-loading' : 'el-icon-coordinate'"></i>
          {{ queryingId === item.lotteryId ? "查询中" : "查询开奖" }}
        </button>
      </div>

      <home-empty-state v-if="!loading && !list.length" inline icon="el-icon-circle-check" title="暂无未开奖记录"
        desc="已录入的号码都已开奖，点击「查询开奖」可在此快速核对" />
    </div>

    <!-- 无列表权限：不调接口，避免 403 -->
    <div v-else class="undrawn-body">
      <home-empty-state inline icon="el-icon-lock" title="暂无号码台账访问权限" desc="当前账号未开放号码台账查看权限" />
    </div>
  </section>
</template>

<script>
import { listLog } from "@/api/fx67ll/lottery/log";
import { queryRewardForRecord, LOTTERY_TYPE_TEXT, formatNumDisplay } from "@/views/fx67ll/lottery/log/rewardQueryHelper";
import panelRefreshMixin from "../refreshMixin";
import PanelRefresh from "./PanelRefresh.vue";
import AnimatedNumber from "./AnimatedNumber.vue";
import HomeEmptyState from "./EmptyState.vue";

export default {
  name: "HomeUndrawnNumbers",
  components: { PanelRefresh, HomeEmptyState, AnimatedNumber },
  mixins: [panelRefreshMixin],
  data() {
    return {
      loading: false,
      // 未开奖号码记录（仅展示号码台账默认查询返回的数据）
      list: [],
      // 当前正在查询开奖信息的记录主键
      queryingId: null,
    };
  },
  computed: {
    canList() {
      return this.hasPerm("lottery:log:list");
    },
    // 是否存在号码台账菜单入口
    hasLotteryMenu() {
      const menus = this.$store.getters.sidebarRouters || [];
      return this.findLotteryPath(menus, "") !== "";
    },
    // 卡片级固定汇总（期数 + 未开奖注数）
    summary() {
      const periods = this.list.length;
      const bets = this.list.reduce(
        (sum, item) =>
          sum +
          (item._recordBets || []).length +
          (item._chaseBets || []).length,
        0
      );
      return { periods, bets };
    },
  },
  mounted() {
    // 仅在有列表权限时拉取，避免无权限账号触发 403
    if (this.canList) {
      this.fetchUndrawn();
    }
  },
  methods: {
    hasPerm(perm) {
      const perms = this.$store.getters.permissions || [];
      return perms.indexOf("*:*:*") !== -1 || perms.indexOf(perm) !== -1;
    },
    typeText(numberType) {
      return LOTTERY_TYPE_TEXT[Number(numberType)] || "未知彩种";
    },
    // 拆分为逐注数组，每注独立一行展示（与号码台账表格视图一致）
    parseBets(numberText) {
      if (!numberText || numberText === "-") return [];
      return String(numberText)
        .split("/")
        .filter(Boolean)
        .map((bet) => formatNumDisplay(bet));
    },
    // 面板刷新：标题右侧按钮触发，供欢迎区一键刷新调用
    refresh() {
      if (!this.canList) return Promise.resolve();
      return this.runRefresh(() => this.fetchUndrawn());
    },
    fetchUndrawn() {
      this.loading = true;
      // 与号��台账页默认查询（handleQueryNoRewardInfo）同源：有期号 + 未记录中奖号码
      listLog({ pageNum: 1, pageSize: 10, hasDateCode: "Y", hasWinningNumber: "N" })
        .then((response) => {
          // 购买号码与固定追号分别解析，数据口径与号码台账保持一致。
          this.list = ((response && response.rows) || []).map((row) => ({
            ...row,
            _recordBets: this.parseBets(row.recordNumber),
            _chaseBets: this.parseBets(row.chaseNumber),
          }));
        })
        .catch(() => {
          this.list = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 逐条触发 mxnzp 开奖查询
    queryReward(item) {
      if (this.queryingId) return;
      this.queryingId = item.lotteryId;
      queryRewardForRecord(this, item, {
        // 网络查询结束时立即解除按钮禁用（常见路径下比兜底更及时）
        onLoadingChange: (val) => {
          if (!val) this.queryingId = null;
        },
        onSuccess: () => this.fetchUndrawn(),
      });
      // 兜底：用户取消二次确认弹窗等场景不会触发上面的回调，12 秒后强制解除
      setTimeout(() => {
        this.queryingId = null;
      }, 12000);
    },
    findLotteryPath(routes, parent) {
      let result = "";
      (routes || []).some((route) => {
        if (!route) return false;
        const path = this.joinPath(parent, route.path);
        // 按完整路由路径匹配（与号码台账面板口径一致）。
        // sidebarRouters 中 component 已被 filterAsyncRouter 替换为组件对象，不能再按 component 字符串匹配，
        // 否则永远找不到菜单入口，右上角图标退化为不可点击。
        if (/lottery\/log/i.test(path)) {
          result = path;
          return true;
        }
        if (route.children && route.children.length) {
          result = this.findLotteryPath(route.children, path);
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
    openLotteryMenu() {
      const path = this.findLotteryPath(this.$store.getters.sidebarRouters || [], "");
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

.undrawn-panel {
  display: flex;
  flex-direction: column;
}

.panel-glyph {
  color: $primary;
  font-size: 22px;
  transition: color 0.3s ease, transform 0.3s ease;
}

/* 悬浮动效收敛为共享工具类 .glyph-lift，仅保留配色加深 */
.panel-glyph:hover {
  color: $primary-dark;
}

.undrawn-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 380px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--home-primary-soft);
    border-radius: 99px;
  }
}

.undrawn-item {
  display: flex;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid #eef3f0;
  transition: background 0.2s ease;

  &:hover {
    background: var(--home-primary-softer);
  }

  &:last-of-type {
    border-bottom: 0;
  }
}

.undrawn-pin {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  margin-right: 12px;
  background: #f5b041;
  border-radius: 50%;
}

.undrawn-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.undrawn-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.undrawn-issue {
  overflow: hidden;
  color: $ink;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.undrawn-type {
  flex: 0 0 auto;
  padding: 2px 8px;
  color: $primary-dark;
  background: var(--home-primary-softer);
  border-radius: 999px;
  font-size: 10px;
}

/* 逐注独立成行（对齐号码台账表格视图） */
.undrawn-bets {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 5px;
}

.undrawn-bet-group {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 6px;
  align-items: baseline;

  .undrawn-bet:not(:first-of-type) {
    grid-column: 2;
  }
}

.undrawn-bet-source {
  padding: 1px 5px;
  color: $primary-dark;
  background: var(--home-primary-softer);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.6;
}

.undrawn-bet-source-chase {
  color: #b9770e;
  background: #fff6e5;
}

.undrawn-bet {
  color: $ink;
  font-size: 12px;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
  line-height: 1.7;
  letter-spacing: 0.02em;
}

.undrawn-bet-empty {
  color: $muted;
  font-family: inherit;
  font-style: italic;
}

.undrawn-query {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  padding: 6px 12px;
  color: #fff;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.22);
  cursor: pointer;
  font-size: 11px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(46, 204, 113, 0.3);
  }

  &:disabled {
    cursor: progress;
    opacity: 0.75;
  }
}

/* 右上图标可点击 + 悬浮动效，点击跳号码台账 */
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

  /* transform 由共享 .glyph-lift 提供 */
  &:hover .panel-glyph {
    color: $primary-dark;
  }
}

/* 卡片级固定汇总头 */
.undrawn-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px 14px;
  color: $primary-dark;
  background: linear-gradient(135deg, var(--home-primary-soft), var(--home-primary-softer));
  border: 1px solid var(--home-border);
  border-radius: var(--home-radius-sm);
  font-size: 12px;

  b {
    margin-right: 2px;
    color: $ink;
    font-size: 16px;
    font-weight: 600;
  }
}

.undrawn-summary-sep {
  width: 4px;
  height: 4px;
  background: var(--home-primary-soft);
  border-radius: 50%;
}

.panel-head {
  i {
    cursor: pointer;
  }
}
</style>
