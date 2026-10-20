<template>
  <!--
    中奖查询动效公共组件（号码台账页与首页「未开奖号码」卡片共用）
    状态流：querying 查询中（号码球滚动，覆盖落库与详情核对的等待） → matching 匹配中（开奖号码逐个揭晓 + 逐注核对）
           → nowin 未中奖（号码球缓缓落下、温柔安慰动效与随机安慰文案，仅支持手动关闭）
           → win 中奖（关闭本组件，沿用原中奖信息确认弹窗）
    查询/落库/核对逻辑仍在 rewardQueryHelper.js，本组件只负责进度与结果的动效展示。
    第三方开奖结果由 helper 先静默校验，未开奖/查询失败时不展示本组件。
    查询中/匹配中提供「跳过动画」按钮：跳过后号码直接揭晓，结果到达后立即展示，无需等待动效播完。
  -->
  <el-dialog :visible.sync="dialogVisible" :show-close="true" :close-on-click-modal="status === 'nowin'"
    :close-on-press-escape="true" width="460px" :style="`top: ${getDialogVerticalOffset(500)}`" append-to-body
    custom-class="reward-query-overlay" @closed="handleClosed">
    <div class="rq-stage" :class="'rq-stage--' + status">
      <!-- 上下文：期号 + 彩种 -->
      <div class="rq-context">第 {{ ctx.dateCode || "—" }} 期 · {{ ctx.typeText }}</div>

      <!-- 号码球：查询中滚动 / 匹配中逐个揭晓 / 未中奖缓缓落下 -->
      <div class="rq-balls">
        <template v-for="(ball, idx) in balls">
          <span v-if="isZoneSep(idx)" :key="'sep' + idx" class="rq-ball-sep"></span>
          <span :key="`ball${idx}`" class="rq-ball" :class="[
            'rq-ball--' + ball.zone,
            {
              'rq-ball--shuffling': ball.state === 'shuffling',
              'rq-ball--hidden': ball.state === 'hidden',
              'rq-ball--pop': ball.state === 'revealed',
              'rq-ball--dim': status === 'nowin',
              'rq-ball--booped': ball.booped,
            },
          ]" :style="ballStyle(idx)" @click="boopBall(idx)">{{ ball.display }}</span>
        </template>
      </div>

      <!-- 阶段文案：随状态切换淡入淡出 -->
      <transition name="rq-fade" mode="out-in">
        <div class="rq-text" :key="status">
          <p class="rq-text-main">{{ phaseText.main }}</p>
          <p class="rq-text-sub">{{ phaseText.sub }}</p>
          <!-- 名言安慰文案的作者署名 -->
          <p v-if="status === 'nowin' && nowinComfort && nowinComfort.by" class="rq-text-by">—— {{ nowinComfort.by }}
          </p>
        </div>
      </transition>

      <!-- 购买/追号逐注列表：匹配中带流光核对，未中奖时变暗 -->
      <div v-if="(status === 'matching' || status === 'nowin') && displayBets.length" class="rq-bets">
        <div v-for="(bet, i) in displayBets" :key="i" class="rq-bet" :class="{ 'rq-bet--dim': status === 'nowin' }">
          <span class="rq-bet-tag" :class="{ 'rq-bet-tag--chase': bet.source === '追号' }">{{ bet.source }}</span>
          <span class="rq-bet-num">{{ bet.num }}</span>
        </div>
        <div v-if="extraBetCount > 0" class="rq-bet rq-bet--more">… 共 {{ totalBetCount }} 注</div>
      </div>

      <!-- 跳过动画：查询中冻结滚动等待结果，匹配中号码立即揭晓、结果直接展示 -->
      <div v-if="(status === 'querying' || status === 'matching') && !skipRequested" class="rq-skip">
        <button class="rq-skip-btn" @click="handleSkipAnimation"><i class="el-icon-d-arrow-right"></i>跳过动画</button>
      </div>

      <!-- 未中奖操作（仅手动关闭，无自动关闭） -->
      <template v-if="status === 'nowin'">
        <div class="rq-action">
          <button class="rq-btn" @click="closeManually">知道了</button>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import { LOTTERY_TYPE_TEXT, formatNumDisplay } from "@/views/fx67ll/lottery/log/rewardQueryHelper";

// 各彩种号码球布局：前区 + 后区球数
const BALL_LAYOUT = {
  1: { front: 5, back: 2 }, // 大乐透
  2: { front: 6, back: 1 }, // 双色球
  3: { front: 3, back: 0 }, // 排列三
  4: { front: 5, back: 0 }, // 排列五
  5: { front: 6, back: 1 }, // 七星彩（前六位 + 尾号）
};

// 查询中滚动随机号范围：[前区最大值, 后区最大值]
const SHUFFLE_RANGE = {
  1: { front: 35, back: 12 },
  2: { front: 33, back: 16 },
  3: { front: 9, back: 0 },
  4: { front: 9, back: 0 },
  5: { front: 9, back: 14 },
};

// 未中奖安慰文案池：名人名言为主、原创暖心句为辅，进入未中奖状态时随机展示一条
const NOWIN_COMFORT_POOL = [
  // 名人名言（附作者署名展示）
  { text: "天生我材必有用，千金散尽还复来。", by: "李白" },
  { text: "山重水复疑无路，柳暗花明又一村。", by: "陆游" },
  { text: "人有悲欢离合，月有阴晴圆缺，此事古难全。", by: "苏轼" },
  { text: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", by: "苏轼" },
  { text: "祸兮福之所倚，福兮祸之所伏。", by: "老子" },
  { text: "命里有时终须有，命里无时莫强求。", by: "《增广贤文》" },
  { text: "但行好事，莫问前程。", by: "《增广贤文》" },
  { text: "假如生活欺骗了你，不要悲伤，不要心急！", by: "普希金" },
  { text: "如果你因失去了太阳而流泪，那么你也将失去群星了。", by: "泰戈尔" },
  { text: "天空没有留下鸟的痕迹，但我已飞过。", by: "泰戈尔" },
  { text: "世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。", by: "罗曼·罗兰" },
  { text: "成功就是从失败到失败，也依然不改热情。", by: "丘吉尔" },
  { text: "生活就像骑自行车，要想保持平衡就要不断前进。", by: "爱因斯坦" },
  { text: "在隆冬，我终于知道，我身上有一个不可战胜的夏天。", by: "加缪" },
  { text: "当你真心渴望某样东西时，整个宇宙都会联合起来帮助你完成。", by: "保罗·科埃略" },
  { text: "我宁愿做到分毫不差，这样当运气来临时，你便已准备好了。", by: "海明威" },
  { text: "梦想还是要有的，万一实现了呢？", by: "马云" },
  { text: "生活就像一盒巧克力，你永远不知道下一颗是什么味道。", by: "《阿甘正传》" },
  { text: "其实地上本没有路，走的人多了，也便成了路。", by: "鲁迅" },
  { text: "冬天越是寒冷，樱花越开得烂漫。", by: "稻盛和夫" },
  { text: "既然选择了远方，便只顾风雨兼程。", by: "汪国真" },
  { text: "人生的光荣，不在于永不言败，而在于能够屡扑屡起。", by: "拿破仑" },
  // 原创暖心句
  { text: "差一点点，好运正在来的路上" },
  { text: "这次没中，说明好运还在攒一个大的" },
  { text: "两块钱买了一个晚上的期待，也很值得" },
  { text: "没中奖的日子，都是在为大奖蓄力" },
  { text: "开奖号码已核对并保存，下期继续加油" },
  { text: "期待本身，就是生活给的小确幸" },
];

export default {
  name: "RewardQueryOverlay",
  data() {
    return {
      // 弹窗显隐
      dialogVisible: false,
      // idle | querying | matching | nowin
      status: "idle",
      // 号码球数组：{ zone, display, state, booped }
      balls: [],
      // 购买/追号逐注列表：{ source, num }
      bets: [],
      // 未中奖随机安慰文案：{ text, by? }，by 存在时以名言样式附作者署名
      nowinComfort: null,
      // 上下文信息
      ctx: { dateCode: "", typeText: "" },
      // 是否已请求跳过动画：跳过后号码直接揭晓、结果立即展示
      skipRequested: false,
      // 匹配中号码球是否已全部揭晓完成
      revealComplete: false,
      // 揭晓完成前到达的结果（nowin/win）暂存，揭晓完成后回放
      pendingResult: null,
      // win 关闭后需触发的 resolve（供 helper 在关闭后再弹中奖确认框）
      _closeResolve: null,
      // 滚动随机号定时器
      shuffleTimer: null,
      // 揭晓等一次性定时器集合
      timers: [],
    };
  },
  computed: {
    displayBets() {
      return this.bets.slice(0, 5);
    },
    extraBetCount() {
      return Math.max(0, this.bets.length - 5);
    },
    totalBetCount() {
      return this.bets.length;
    },
    phaseText() {
      if (this.status === "querying") {
        return { main: "正在查询开奖信息", sub: "正在连接开奖数据源，请稍候…" };
      }
      if (this.status === "matching") {
        return { main: "开奖号码已揭晓", sub: "正在逐注核对您的号码…" };
      }
      if (this.status === "nowin") {
        return {
          main: "本期未中奖",
          sub: (this.nowinComfort && this.nowinComfort.text) || "",
        };
      }
      return { main: "", sub: "" };
    },
  },
  beforeDestroy() {
    this.clearTimers();
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },

    // ===== 对外方法：由 rewardQueryHelper 在查询各阶段调用 =====

    // 查询开始：展示滚动号码球
    showQuerying(record) {
      this.clearTimers();
      this._closeResolve = null;
      this.revealComplete = false;
      this.pendingResult = null;
      this.nowinComfort = null;
      this.skipRequested = false;
      const numType = Number(record.numberType);
      this.ctx = {
        dateCode: record.dateCode,
        typeText: LOTTERY_TYPE_TEXT[numType] || "",
      };
      this.bets = this.parseBets(record);
      this.status = "querying";
      this.dialogVisible = true;
      this.startShuffle(numType);
    },

    // 进入匹配阶段：开奖号码逐个揭晓
    showMatching(payload) {
      if (!this.dialogVisible) return;
      this.stopShuffle();
      this.status = "matching";
      this.revealComplete = false;
      this.revealBalls(payload.winNum, Number(payload.numType));
    },

    // 未中奖：揭晓未完成则暂存，完成后回放为温柔安慰动效
    showNoWin() {
      if (!this.dialogVisible) return;
      if (this.status === "matching" && !this.revealComplete) {
        this.pendingResult = { type: "nowin" };
      } else {
        this.enterNoWin();
      }
    },

    // 关闭本组件（中奖时由 helper 调用，返回 Promise 以便关闭后再弹中奖确认框）
    close() {
      return new Promise((resolve) => {
        if (!this.dialogVisible) {
          resolve();
          return;
        }
        this._closeResolve = resolve;
        if (!this.skipRequested && this.status === "matching" && !this.revealComplete) {
          // 揭晓未完成：等揭晓完成后再关闭
          this.pendingResult = { type: "win" };
        } else {
          this.dialogVisible = false;
        }
      });
    },

    // ===== 内部流转 =====

    startShuffle(numType) {
      const layout = BALL_LAYOUT[numType] || { front: 5, back: 0 };
      const range = SHUFFLE_RANGE[numType] || { front: 35, back: 12 };
      const balls = [];
      for (let i = 0; i < layout.front; i++) {
        balls.push({ zone: "front", display: this.randNum(range.front), state: "shuffling", booped: false });
      }
      for (let i = 0; i < layout.back; i++) {
        balls.push({ zone: "back", display: this.randNum(range.back), state: "shuffling", booped: false });
      }
      this.balls = balls;
      this.shuffleTimer = setInterval(() => {
        this.balls.forEach((b) => {
          const max = b.zone === "front" ? range.front : range.back;
          b.display = this.randNum(max);
        });
      }, 90);
    },

    stopShuffle() {
      if (this.shuffleTimer) {
        clearInterval(this.shuffleTimer);
        this.shuffleTimer = null;
      }
    },

    revealBalls(winNum, numType) {
      const parsed = this.parseWinNum(winNum, numType);
      this.balls = parsed.map((p) => ({
        zone: p.zone,
        display: this.padNum(p.num),
        state: "hidden",
        booped: false,
      }));
      // 已请求跳过动画：全部号码直接揭晓，立即进入结果阶段
      if (this.skipRequested) {
        this.balls.forEach((b) => {
          b.state = "revealed";
        });
        this.revealComplete = true;
        this.flushPending();
        return;
      }
      parsed.forEach((ball, idx) => {
        const t = setTimeout(() => {
          if (this.balls[idx]) {
            this.balls[idx].state = "revealed";
          }
        }, 260 * idx + 200);
        this.timers.push(t);
      });
      // 全部揭晓 + 短暂停顿后，回放暂存的结果
      const revealDone = 260 * parsed.length + 200 + 500;
      const t = setTimeout(() => {
        this.revealComplete = true;
        this.flushPending();
      }, revealDone);
      this.timers.push(t);
    },

    flushPending() {
      if (!this.revealComplete || !this.pendingResult) return;
      const pending = this.pendingResult;
      this.pendingResult = null;
      if (pending.type === "nowin") {
        this.enterNoWin();
      } else if (pending.type === "win") {
        // 揭晓完成后关闭，触发 handleClosed 中的 resolve
        this.dialogVisible = false;
      }
    },

    // 跳过动画：查询中冻结滚动等待结果到达，匹配中则全部号码立即揭晓并直接展示结果
    handleSkipAnimation() {
      if (this.skipRequested) return;
      if (this.status !== "querying" && this.status !== "matching") return;
      this.skipRequested = true;
      this.stopShuffle();
      if (this.status === "matching" && !this.revealComplete) {
        // 匹配中跳过：清掉逐个揭晓的定时器，全部号码立即揭晓
        this.clearTimers();
        this.balls.forEach((b) => {
          if (b.state !== "revealed") {
            b.state = "revealed";
          }
        });
        this.revealComplete = true;
        this.flushPending();
      }
    },

    // 进入未中奖状态：随机挑选安慰文案
    enterNoWin() {
      this.stopShuffle();
      this.nowinComfort = this.pickComfort();
      this.status = "nowin";
    },

    closeManually() {
      this.dialogVisible = false;
    },

    handleClosed() {
      // 中奖路径：先 resolve，让 helper 在本组件关闭后再弹出中奖确认框
      if (this._closeResolve) {
        const resolve = this._closeResolve;
        this._closeResolve = null;
        resolve();
      }
      this.resetState();
    },

    resetState() {
      this.clearTimers();
      this.status = "idle";
      this.balls = [];
      this.bets = [];
      this.nowinComfort = null;
      this.ctx = { dateCode: "", typeText: "" };
      this.skipRequested = false;
      this.revealComplete = false;
      this.pendingResult = null;
    },

    clearTimers() {
      this.stopShuffle();
      (this.timers || []).forEach((t) => clearTimeout(t));
      this.timers = [];
    },

    // 未中奖时点击号码球：轻轻摆动一下，温柔交互
    boopBall(idx) {
      if (this.status !== "nowin" || !this.balls[idx]) return;
      this.balls[idx].booped = true;
      const t = setTimeout(() => {
        if (this.balls[idx]) this.balls[idx].booped = false;
      }, 420);
      this.timers.push(t);
    },

    // 从安慰文案池中随机挑选一条
    pickComfort() {
      return NOWIN_COMFORT_POOL[
        Math.floor(Math.random() * NOWIN_COMFORT_POOL.length)
      ];
    },

    // ===== 解析工具 =====

    // 解析开奖号码字符串为号码球数组：{ num, zone }
    parseWinNum(winNum, numType) {
      const parts = String(winNum).split("-");
      if (parts.length === 2) {
        // 大乐透/双色球：前区,后区
        const front = parts[0].split(",").map((s) => s.trim()).filter(Boolean);
        const back = parts[1].split(",").map((s) => s.trim()).filter(Boolean);
        return [
          ...front.map((n) => ({ num: n, zone: "front" })),
          ...back.map((n) => ({ num: n, zone: "back" })),
        ];
      }
      // 排列三/排列五/七星彩：纯逗号拼接
      const nums = parts[0].split(",").map((s) => s.trim()).filter(Boolean);
      if (numType === 5 && nums.length > 1) {
        // 七星彩：前六位 + 尾号（最后一个作为后区蓝色球展示）
        const front = nums.slice(0, nums.length - 1);
        const back = nums.slice(-1);
        return [
          ...front.map((n) => ({ num: n, zone: "front" })),
          ...back.map((n) => ({ num: n, zone: "back" })),
        ];
      }
      return nums.map((n) => ({ num: n, zone: "front" }));
    },

    // 解析购买号码/固定追号为逐注展示列表
    parseBets(record) {
      const bets = [];
      const pushList = (str, source) => {
        if (!str || str === "-") return;
        String(str)
          .split("/")
          .filter(Boolean)
          .forEach((num) => bets.push({ source, num: formatNumDisplay(num) }));
      };
      pushList(record.recordNumber, "购买");
      pushList(record.chaseNumber, "追号");
      return bets;
    },

    // 前区与后区之间的小分隔点
    isZoneSep(idx) {
      const ball = this.balls[idx];
      const prev = this.balls[idx - 1];
      return !!ball && !!prev && ball.zone === "back" && prev.zone === "front";
    },

    ballStyle(idx) {
      const ball = this.balls[idx];
      if (ball && ball.state === "shuffling") {
        return { animationDelay: idx * 0.12 + "s" };
      }
      return {};
    },

    randNum(max) {
      if (!max) return "?";
      return this.padNum(String(Math.floor(Math.random() * max) + 1));
    },

    padNum(n) {
      return /^\d+$/.test(n) ? String(n).padStart(2, "0") : n;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 弹窗容器：清新浅色渐变卡片（薄荷→晴空），叠加两处柔光点缀，圆角与投影更柔和 */
::v-deep .el-dialog {
  margin-top: 12vh !important;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 4%, rgba(122, 205, 165, 0.16), transparent 32%),
    radial-gradient(circle at 6% 98%, rgba(140, 180, 240, 0.15), transparent 34%),
    linear-gradient(180deg, #f3fbf6 0%, #edf5fd 100%);
  box-shadow: 0 16px 44px rgba(84, 128, 110, 0.2);
}

::v-deep .el-dialog__header {
  padding: 12px 18px 0;
}

::v-deep .el-dialog__headerbtn {
  top: 14px;
  right: 16px;
}

::v-deep .el-dialog__body {
  padding: 18px 24px 26px;
}

.rq-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rq-context {
  margin-bottom: 18px;
  padding: 4px 14px;
  color: #3aa76d;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid #d9f0e3;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.02em;
}

.rq-balls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  margin-bottom: 18px;
}

.rq-ball-sep {
  width: 6px;
  height: 6px;
  margin: 0 6px;
  background: #d7e2dc;
  border-radius: 50%;
}

.rq-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin: 0 4px;
  border-radius: 50%;
  /* 糖果感白色描边，清新浅色球面更轻盈 */
  border: 2px solid rgba(255, 255, 255, 0.62);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
  box-shadow: 0 3px 9px rgba(84, 128, 110, 0.14);
  /* 浅色球面上加轻微文字阴影，保证号码可读 */
  text-shadow: 0 1px 2px rgba(43, 58, 54, 0.14);
  user-select: none;
  transition: filter 0.4s ease, opacity 0.4s ease;

  /* 未中奖时点击号码球的交互提示 */
  &--booped {
    animation: rq-wiggle 0.42s ease;
  }
}

/* 前区：清新蜜桃珊瑚渐变（双色球/大乐透前区） */
.rq-ball--front {
  background: linear-gradient(145deg, #ffc9b3, #fb9a82);
  box-shadow: 0 3px 9px rgba(251, 154, 130, 0.26);
}

/* 后区：清新晴空蓝渐变（双色球/大乐透后区） */
.rq-ball--back {
  background: linear-gradient(145deg, #bed9ff, #8db3f1);
  box-shadow: 0 3px 9px rgba(141, 179, 241, 0.26);
}

.rq-ball--shuffling {
  animation: rq-bob 0.9s ease-in-out infinite;
}

.rq-ball--hidden {
  transform: scale(0);
  opacity: 0;
}

.rq-ball--pop {
  animation: rq-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rq-ball--dim {
  filter: grayscale(0.45);
  opacity: 0.6;
}

/* 未中奖阶段号码球可悬停轻抬，温柔交互 */
.rq-stage--nowin .rq-ball {
  cursor: pointer;
  transition: filter 0.4s ease, opacity 0.4s ease, transform 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    opacity: 0.85;
  }
}

.rq-text {
  margin-bottom: 4px;
}

.rq-text-main {
  margin: 0 0 4px;
  color: #3c554b;
  font-size: 16px;
  font-weight: 600;
}

.rq-text-sub {
  margin: 0;
  color: #82998c;
  font-size: 13px;
  line-height: 1.6;
}

/* 未中奖文案卡片化：半透明白色卡片衬托安慰语与名言署名 */
.rq-stage--nowin .rq-text {
  max-width: 340px;
  margin: 0 auto 4px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #e3f0e9;
  border-radius: 14px;
}

.rq-text-by {
  margin: 6px 0 0;
  color: #9fb2a9;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.rq-bets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-height: 124px;
  margin-top: 18px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d3e7dc;
    border-radius: 99px;
  }
}

.rq-bet {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e9f3ed;
  border-radius: 8px;
  font-size: 13px;
  overflow: hidden;
}

.rq-bet-tag {
  flex: 0 0 auto;
  padding: 1px 6px;
  border-radius: 4px;
  background: #e7f8ee;
  color: #2f9e63;
  font-size: 11px;
}

.rq-bet-tag--chase {
  background: #fff6e5;
  color: #b9770e;
}

.rq-bet-num {
  color: #3c554b;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
  letter-spacing: 0.02em;
}

.rq-bet--dim {
  opacity: 0.5;
}

.rq-bet--more {
  justify-content: center;
  color: #82998c;
  font-size: 12px;
  background: transparent;
  border-color: transparent;
}

/* 匹配中：逐注行流光扫过，示意正在核对 */
.rq-stage--matching .rq-bet::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(102, 205, 160, 0.18), transparent);
  animation: rq-shimmer 1.4s infinite;
}

/* 跳过动画按钮：查询中/匹配中显示，低调的半透明浅色药丸按钮 */
.rq-skip {
  margin-top: 18px;
}

.rq-skip-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 18px;
  color: #6f8f81;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid #dcebe2;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  i {
    margin-right: 4px;
    font-size: 12px;
  }

  &:hover {
    color: #3aa76d;
    background: #fff;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(84, 128, 110, 0.12);
  }

  &:active {
    transform: translateY(0);
  }
}

.rq-action {
  margin-top: 16px;
}

.rq-btn {
  padding: 8px 30px;
  color: #fff;
  background: linear-gradient(135deg, #5ed49a, #35b57c);
  border: 0;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(62, 184, 128, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(62, 184, 128, 0.34);
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes rq-bob {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

@keyframes rq-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  60% {
    transform: scale(1.18);
    opacity: 1;
  }

  100% {
    transform: scale(1);
  }
}

@keyframes rq-wiggle {

  0%,
  100% {
    transform: rotate(0) scale(1);
  }

  25% {
    transform: rotate(-8deg) scale(1.1);
  }

  75% {
    transform: rotate(8deg) scale(1.1);
  }
}

@keyframes rq-shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.rq-fade-enter-active,
.rq-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.rq-fade-enter {
  opacity: 0;
  transform: translateY(6px);
}

.rq-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
