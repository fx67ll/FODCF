<template>
  <!--
    近期号码期号弹窗组件
    功能：列出五个彩种（大乐透/双色球/排列三/排列五/七星彩）"今日或今日之后最早一期"的期号与开奖日期，
          供管理端新增号码记录时参考期号，支持逐行复制期号。
    期号计算逻辑：复用 FODCA 的期号计算工具函数（@/utils/fx67ll/utils.js），通过后端
                 getLatestLogWithDateCodeForAdmin 接口拿全局最近一条"有期号"记录作为基准，
                 再按今日或之后最早一个开奖日推算本期期号。
    交互：打开自动查询，逐行复制期号到剪贴板，复制成功有动效反馈。
  -->
  <el-dialog title="常用彩票近期号码期号" :visible.sync="dialogVisible" :close-on-click-modal="false" width="720px"
    :style="`top: ${getDialogVerticalOffset(620)}`" append-to-body class="recent-issue-code-dialog" @open="handleOpen">
    <!-- 顶部说明条 -->
    <!-- <div class="ric-tip-bar">
      <i class="el-icon-info ric-tip-icon"></i>
      <span>以下为<strong>今日或之后最早一期</strong>的期号，供新增号码记录时参考。点击右侧按钮可复制期号。</span>
    </div> -->

    <!-- 期号列表 -->
    <div class="ric-list" v-loading="loading" element-loading-text="正在计算期号...">
      <div v-for="item in lotteryList" :key="item.type" class="ric-item"
        :class="{ 'ric-item-disabled': !item.dateCode }">
        <!-- 左侧彩种色标 + 名称 -->
        <div class="ric-item-left">
          <span class="ric-color-tag" :style="{ background: item.color }"></span>
          <div class="ric-item-name">
            <span class="ric-name-text">{{ item.name }}</span>
            <span class="ric-name-sub">{{ item.drawDaysText }}</span>
          </div>
        </div>

        <!-- 中部期号 + 开奖日期 -->
        <div class="ric-item-center">
          <div class="ric-code-row">
            <span class="ric-code-label">期号</span>
            <span class="ric-code-value" v-if="item.dateCode">{{ item.dateCode }}</span>
            <span class="ric-code-empty" v-else>-</span>
          </div>
          <div class="ric-date-row">
            <span class="ric-date-label">开奖日</span>
            <span class="ric-date-value" v-if="item.drawDate">{{ item.drawDateText }}</span>
            <span class="ric-code-empty" v-else>-</span>
          </div>
        </div>

        <!-- 右侧复制按钮 -->
        <div class="ric-item-right">
          <el-button type="primary" plain icon="el-icon-document-copy" size="mini" :disabled="!item.dateCode"
            @click="handleCopy(item)">
            {{ item.copied ? '已复制' : '复制' }}
          </el-button>
        </div>
      </div>

      <!-- 空状态（全部算不出时） -->
      <div v-if="!loading && lotteryList.every((i) => !i.dateCode)" class="ric-empty">
        <i class="el-icon-warning-outline"></i>
        <span>暂无有效期号，请先在历史记录中补全至少一条有期号的记录</span>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import moment from "moment";
import { getLatestLogWithDateCodeForAdmin } from "@/api/fx67ll/lottery/log";
import {
  getDialogVerticalOffset,
  calculateCurrentDateCode,
  buildFirstIssueCodeOfThisYear,
  getFirstDrawDayOfYear,
  calcIssueCodeByOffset,
  getNextDrawDayFrom,
} from "@/utils/fx67ll/utils";

export default {
  name: "RecentDateCode",
  props: {
    // 控制弹窗显示/隐藏，与父组件 .sync 双向绑定
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 加载状态
      loading: false,
      // 五个彩种的展示配置与计算结果
      // color：色标颜色（小清新配色，符合系统主题）
      // drawDaysText：开奖日说明文字
      // dateCode/drawDate：计算结果（填充后展示）
      lotteryList: [
        { type: 1, name: "大乐透", color: "#409eff", drawDaysText: "周一/三/六", dateCode: null, drawDate: null, drawDateText: "", copied: false },
        { type: 2, name: "双色球", color: "#ff5a5f", drawDaysText: "周二/四/日", dateCode: null, drawDate: null, drawDateText: "", copied: false },
        { type: 3, name: "排列三", color: "#2ecc71", drawDaysText: "每天", dateCode: null, drawDate: null, drawDateText: "", copied: false },
        { type: 4, name: "排列五", color: "#e6a23c", drawDaysText: "每天", dateCode: null, drawDate: null, drawDateText: "", copied: false },
        { type: 5, name: "七星彩", color: "#9b59b6", drawDaysText: "周二/五/日", dateCode: null, drawDate: null, drawDateText: "", copied: false },
      ],
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
    getDialogVerticalOffset,

    // 弹窗打开时触发查询
    handleOpen() {
      this.loadAllIssueCode();
    },

    // 并行查询五个彩种的基准记录并计算期号
    loadAllIssueCode() {
      this.loading = true;
      // 重置上一次的结果与复制状态
      this.lotteryList.forEach((item) => {
        item.dateCode = null;
        item.drawDate = null;
        item.drawDateText = "";
        item.copied = false;
      });
      // 五个彩种并行请求
      const tasks = this.lotteryList.map((item) =>
        this.calcOneIssueCode(item).catch(() => item)
      );
      Promise.all(tasks).finally(() => {
        this.loading = false;
      });
    },

    // 计算单个彩种的"今日或之后最早一期"期号
    // 流程：拿全局最近有期号记录 → 算下一个开奖日 → 用基准记录推算该开奖日的期号
    async calcOneIssueCode(item) {
      try {
        const res = await getLatestLogWithDateCodeForAdmin({ numberType: item.type });
        if (res?.code !== 200 || !res?.data) {
          // 无基准记录，保持 dateCode 为 null（展示为 -）
          return item;
        }
        const baseRecord = res.data;
        const baseDateCode = baseRecord.dateCode || "";
        const baseCreateTime = baseRecord.createTime || "";
        if (!baseDateCode || !baseCreateTime) {
          return item;
        }
        // 今日或之后最早一个开奖日（今日是开奖日则取今日）
        const today = moment().startOf("day");
        const todayStr = today.format("YYYY-MM-DD");
        const nextDrawDay = getNextDrawDayFrom(item.type, todayStr);
        if (!nextDrawDay) {
          return item;
        }
        const nextDrawDayStr = nextDrawDay.format("YYYY-MM-DD");
        // 用基准记录 + nextDrawDay 推算期号（复用 FODCA 同年/跨年逻辑）
        const dateCode = this.calcIssueCodeByBase(item.type, baseDateCode, baseCreateTime, nextDrawDayStr, today);
        if (dateCode) {
          item.dateCode = dateCode;
          item.drawDate = nextDrawDayStr;
          item.drawDateText = this.formatDrawDate(nextDrawDay, today);
        }
      } catch (e) {
        console.error(`${item.name}期号计算出错:`, e);
      }
      return item;
    },

    // 根据基准记录推算指定目标日期（targetDateStr）的期号
    // 复用 FODCA 的跨年/同年判定逻辑：
    //   - 基准 createTime 年份 ≠ 目标年份 → 跨年，以目标年份第一期 (D1, C1) 为锚点
    //   - 否则同年，用 calculateCurrentDateCode 按开奖日统计间隔期数
    // 七星彩 type=5，calculateCurrentDateCode 内部用 type=3（开奖日 [2,5,0] 同七星彩）
    // 注意：baseDate 必须用 startOf('day') 标准化，避免时分秒导致 moment.diff('days') 按毫秒向下取整出错
    calcIssueCodeByBase(type, baseDateCode, baseCreateTime, targetDateStr, today) {
      const baseDate = moment(baseCreateTime).startOf("day");
      const targetDate = moment(targetDateStr).startOf("day");
      const calcType = type === 5 ? 3 : type; // 七星彩复用 type=3 的开奖日数组
      const baseYear = baseDate.year();
      const targetYear = targetDate.year();

      // 跨年：基准记录年份与目标年份不一致
      if (baseYear !== targetYear) {
        const firstIssueCode = buildFirstIssueCodeOfThisYear(baseDateCode, type, targetYear);
        if (!firstIssueCode) {
          return null;
        }
        const firstDrawDay = getFirstDrawDayOfYear(type, targetYear);
        const firstDrawDayStr = firstDrawDay ? firstDrawDay.format("YYYY-MM-DD") : "";
        if (!firstDrawDayStr) {
          return null;
        }
        // 用 calculateCurrentDateCode 传 lastNumber=0 仅算间隔期数，再拼回带前缀的 C1
        const offset = calculateCurrentDateCode(calcType, targetDateStr, firstDrawDayStr, 0);
        if (offset == null) {
          return null;
        }
        return calcIssueCodeByOffset(firstIssueCode, offset, type);
      }

      // 同年：按开奖日统计基准记录到目标日期的间隔期数
      // 排列三/五每天一期，直接用天数差（与 FODCA getLatestCodeNumberPl35 同年分支一致）
      // baseDate 已 startOf('day')，daysDiff 为日历日差
      if (type === 3 || type === 4) {
        const daysDiff = targetDate.diff(baseDate, "days");
        const baseSeq = parseInt(baseDateCode, 10);
        if (isNaN(baseSeq)) {
          return null;
        }
        return String(baseSeq + daysDiff);
      }
      // 大乐透/双色球/七星彩：calculateCurrentDateCode 按开奖日统计
      const baseDateCodeNum = parseInt(baseDateCode, 10);
      if (isNaN(baseDateCodeNum)) {
        return null;
      }
      const result = calculateCurrentDateCode(calcType, targetDateStr, baseDate.format("YYYY-MM-DD"), baseDateCodeNum);
      return result != null ? String(result) : null;
    },

    // 格式化开奖日期展示：今天/明天/N天后 (YYYY-MM-DD 星期X)
    formatDrawDate(drawDay, today) {
      const diff = drawDay.diff(today, "days");
      let prefix = "";
      if (diff === 0) {
        prefix = "今天";
      } else if (diff === 1) {
        prefix = "明天";
      } else {
        prefix = `${diff}天后`;
      }
      const weekMap = ["日", "一", "二", "三", "四", "五", "六"];
      return `${prefix} · ${drawDay.format("YYYY-MM-DD")} 周${weekMap[drawDay.day()]}`;
    },

    // 复制单行期号到剪贴板
    handleCopy(item) {
      if (!item.dateCode) {
        return;
      }
      const text = item.dateCode;
      // 优先用 navigator.clipboard（HTTPS/localhost 下可用），降级用 execCommand
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => this.showCopied(item)).catch(() => this.fallbackCopy(text, item));
      } else {
        this.fallbackCopy(text, item);
      }
    },

    // 降级复制方案（非 HTTPS 环境）
    fallbackCopy(text, item) {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        this.showCopied(item);
      } catch (e) {
        this.$message.error("复制失败，请手动复制");
      }
      document.body.removeChild(input);
    },

    // 复制成功反馈：按钮文案切换为"已复制"，1.2s 后恢复
    showCopied(item) {
      item.copied = true;
      this.$message({ message: `${item.name}期号已复制`, type: "success", duration: 1200 });
      setTimeout(() => {
        item.copied = false;
      }, 1200);
    },

    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 近期号码期号弹窗 —— 小清新配色，贴合 Element 主题 */
.recent-issue-code-dialog {
  ::v-deep .el-dialog__body {
    padding: 10px 20px 16px;
  }
}

/* 顶部说明条 */
.ric-tip-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #ecf5ff;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  color: #5e6d82;
  font-size: 12px;
  line-height: 1.6;

  .ric-tip-icon {
    color: #409eff;
    margin-right: 6px;
    font-size: 14px;
  }

  strong {
    color: #409eff;
  }
}

/* 期号列表容器 */
.ric-list {
  min-height: 180px;
}

/* 单行彩种卡片 */
.ric-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fafcff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.25s ease;

  &:hover {
    background: #fff;
    border-color: #c6e2ff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

/* 无期号记录时整行置灰 */
.ric-item-disabled {
  opacity: 0.6;
}

/* 左侧色标 + 彩种名 */
.ric-item-left {
  display: flex;
  align-items: center;
  width: 140px;
  flex-shrink: 0;

  .ric-color-tag {
    width: 6px;
    height: 28px;
    border-radius: 3px;
    margin-right: 10px;
  }

  .ric-item-name {
    display: flex;
    flex-direction: column;

    .ric-name-text {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .ric-name-sub {
      font-size: 11px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

/* 中部期号 + 开奖日 */
.ric-item-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 12px;

  .ric-code-row,
  .ric-date-row {
    display: flex;
    align-items: center;
    font-size: 13px;
    line-height: 1.8;
  }

  .ric-code-label,
  .ric-date-label {
    color: #909399;
    width: 48px;
    flex-shrink: 0;
  }

  .ric-code-value {
    color: #409eff;
    font-weight: 600;
    font-size: 15px;
    font-family: "Courier New", monospace;
    letter-spacing: 0.5px;
  }

  .ric-date-value {
    color: #67c23a;
    font-size: 12px;
  }

  .ric-code-empty {
    color: #c0c4cc;
  }
}

/* 右侧复制按钮 */
.ric-item-right {
  flex-shrink: 0;
}

/* 空状态 */
.ric-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
  font-size: 13px;

  i {
    font-size: 32px;
    margin-bottom: 8px;
    color: #c0c4cc;
  }
}
</style>
