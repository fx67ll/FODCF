<template>
  <div class="app-container home">
    <!-- 顶部公告条：新增 transition 实现入场/离场动画 -->
    <transition name="notice-slide">
      <div class="notice-card" :class="{ 'notice-shake': isShaking }" v-if="latestNotice && !isNoticeClosed" @click="handleViewLatest">
        <div class="notice-card-icon">
          <!-- 新增铃铛摇晃动画类 -->
          <i class="el-icon-bell bell-shake"></i>
        </div>
        <div class="notice-card-body">
          <span class="notice-type-tag" :class="'type-' + latestNotice.noticeType">
            {{ typeText(latestNotice.noticeType) }}
          </span>
          <span class="notice-card-title">{{ latestNotice.noticeTitle }}</span>
          <span class="notice-card-time">{{ parseTime(latestNotice.createTime, "{y}-{m}-{d}") }}</span>
        </div>
        <div class="notice-card-more" @click.stop="goNoticeList">
          更多<i class="el-icon-arrow-right"></i>
        </div>
        <div class="notice-card-close" @click.stop="handleCloseNotice">
          <i class="el-icon-close"></i>
        </div>
      </div>
    </transition>

    <el-row :gutter="20">
      <!-- 左侧：品牌与Logo -->
      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <h2>fx67ll's 后台管理框架 <span class="fx67ll-version" @click="showFirstJobDate()">v{{ version }}</span></h2>
        <el-image src="https://test.fx67ll.com/fx67ll-img-collection/fx67ll.jpg"
          :preview-src-list="['https://test.fx67ll.com/fx67ll-img-collection/fx67ll.jpg']"
          style="margin-top: 12px; display: block; border-radius: 4px; width: 123px; height:123px;"
          fit="cover"></el-image>
      </el-col>
      <!-- 右侧：技术选型 -->
      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <el-row>
          <el-col :span="12">
            <h2>技术选型</h2>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6">
            <h4>后端技术</h4>
            <ul>
              <li>SpringBoot</li>
              <li>Spring Security</li>
              <li>JWT</li>
              <li>MyBatis</li>
              <li>Druid</li>
              <li>Fastjson</li>
              <li>...</li>
            </ul>
          </el-col>
          <el-col :span="6">
            <h4>前端技术</h4>
            <ul>
              <li>Vue</li>
              <li>Vuex</li>
              <li>Element-ui</li>
              <li>Axios</li>
              <li>Sass</li>
              <li>Quill</li>
              <li>...</li>
            </ul>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <el-divider />

    <el-row :gutter="24" v-show="isShowFirstJobDate">
      <div class="fx67ll-clock"></div>
      <div class="fx67ll-clock-desc">Code is my life ＼＼\٩('ω')و//／／ Since {{ firstJobDate }}</div>
    </el-row>

    <!-- 公告详情弹窗 -->
    <notice-detail-dialog :visible.sync="noticeOpen" :notice="latestNoticeDetail" />
  </div>
</template>

<script>
import { version as packageVersion } from '../../package.json';
import FlipClock from 'flipclock';
import 'flipclock/dist/flipclock.css';
import moment from 'moment';
import { latestPublicNotice, getPublicNotice } from "@/api/system/notice";
import NoticeDetailDialog from "@/views/system/notice/component/NoticeDetailDialog.vue";
import { NOTICE_PUBLIC_PATH } from "@/views/system/notice/constants";
export default {
  name: "Index",
  components: { NoticeDetailDialog },
  dicts: ["sys_notice_type"],
  data() {
    return {
      version: packageVersion,
      isShowFirstJobDate: false,
      firstJobDate: '2018-05-28',
      firstJobDays: 0,
      chnNumChar: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
      chnUnitSection: ['', '万', '亿', '万亿', '亿亿'],
      chnUnitChar: ['', '十', '百', '千'],
      // 最新公告
      latestNotice: null,
      noticeOpen: false,
      latestNoticeDetail: {},
      // 被用户关闭的公告ID（关闭的是具体公告，新公告会再显示）
      closedNoticeId: sessionStorage.getItem("closedNoticeId") || "",
      // 已查看过详情的公告ID（未查看详情不允许关闭公告条）
      readNoticeId: sessionStorage.getItem("readNoticeId") || "",
      // 公告条横向抖动动效（提示用户无法关闭未读公告）
      isShaking: false,
    };
  },
  computed: {
    // 当前最新公告是否已被用户关闭
    isNoticeClosed() {
      if (!this.latestNotice || !this.latestNotice.noticeId) return false;
      return String(this.closedNoticeId) === String(this.latestNotice.noticeId);
    },
  },
  mounted() {
    this.initStuDays();
    this.initClock();
    this.loadLatestNotice();
  },
  methods: {
    goTarget(href) {
      window.open(href, "_blank");
    },
    /** 加载最新一条已上架公告（fx67ll 超级管理员不展示首页公告条） */
    loadLatestNotice() {
      const userName = this.$store.state.user.name;
      if (userName && userName === "fx67ll") {
        this.latestNotice = null;
        return;
      }
      latestPublicNotice().then((response) => {
        const notice = response.data || null;
        this.latestNotice = notice;
        // 默认不弹出详情，由用户点击公告条自行查看
      });
    },
    /** 类型文本 */
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((d) => d.value === noticeType);
      return dict ? dict.label : "公告";
    },
    /** 点击公告条查看最新公告详情，并标记为已读 */
    handleViewLatest() {
      if (!this.latestNotice) return;
      getPublicNotice(this.latestNotice.noticeId).then((response) => {
        this.latestNoticeDetail = response.data || {};
        this.noticeOpen = true;
        // 记录已查看详情的公告ID，允许后续关闭该公告条
        this.readNoticeId = String(this.latestNotice.noticeId);
        sessionStorage.setItem("readNoticeId", this.readNoticeId);
      });
    },
    /** 跳转公告列表页 */
    goNoticeList() {
      this.$router.push(NOTICE_PUBLIC_PATH).catch(() => { });
    },
    /** 关闭首页公告条（需先查看详情；关闭当前公告，新公告到达时会再次显示） */
    handleCloseNotice() {
      if (!this.latestNotice || !this.latestNotice.noticeId) return;
      const isRead =
        String(this.readNoticeId) === String(this.latestNotice.noticeId);
      if (!isRead) {
        // 未查看详情，提示阅读并触发横向抖动动效
        this.$message.warning("您还未阅读最新公告，请先查阅新公告详情，点击公告标题即可~");
        this.triggerShake();
        return;
      }
      this.closedNoticeId = String(this.latestNotice.noticeId);
      sessionStorage.setItem("closedNoticeId", this.closedNoticeId);
    },
    /** 公告条横向抖动动效 */
    triggerShake() {
      if (this.isShaking) return;
      this.isShaking = true;
      // 动效结束后重置，便于再次触发
      setTimeout(() => {
        this.isShaking = false;
      }, 500);
    },
    showFirstJobDate() {
      this.isShowFirstJobDate = !this.isShowFirstJobDate;
    },
    // 天数计算
    initStuDays() {
      let firstJobDays = moment(moment().format('YYYY-MM-DD')).diff(moment(this.firstJobDate).format('YYYY-MM-DD'), 'day');
      this.firstJobDays = this.NumberToChinese(firstJobDays);
    },
    // 时钟初始化
    initClock() {
      const el = document.querySelector('.fx67ll-clock');
      const clock = new FlipClock(el, new Date(this.firstJobDate), {
        face: 'DayCounter', // 类型
        showSeconds: true, // 显示秒数
        showLabels: true, // 显示文字标识
        language: {
          years: '年',
          months: '月',
          days: '日',
          hours: '時',
          minutes: '分',
          seconds: '秒'
        },
        countdown: false // true为倒计时
      });
    },
    // 阿拉伯数字转换汉字数字
    NumberToChinese(num) {
      var unitPos = 0;
      var strIns = '',
        chnStr = '';
      var needZero = false;

      if (num === 0) {
        return this.chnNumChar[0];
      }

      while (num > 0) {
        var section = num % 10000;
        if (needZero) {
          chnStr = this.chnNumChar[0] + chnStr;
        }
        strIns = this.SectionToChinese(section);
        strIns += section !== 0 ? this.chnUnitSection[unitPos] : this.chnUnitSection[0];
        chnStr = strIns + chnStr;
        needZero = section < 1000 && section > 0;
        num = Math.floor(num / 10000);
        unitPos++;
      }

      if (chnStr.substring(0, 1) === '一' && chnStr.substring(1, 2) === '十') {
        chnStr = chnStr.substr(1, chnStr.length);
      }

      return chnStr;
    },
    // 节内转换算法
    SectionToChinese(section) {
      var strIns = '',
        chnStr = '';
      var unitPos = 0;
      var zero = true;
      while (section > 0) {
        var v = section % 10;
        if (v === 0) {
          if (!zero) {
            zero = true;
            chnStr = this.chnNumChar[v] + chnStr;
          }
        } else {
          zero = false;
          strIns = this.chnNumChar[v];
          strIns += this.chnUnitChar[unitPos];
          chnStr = strIns + chnStr;
        }
        unitPos++;
        section = Math.floor(section / 10);
      }
      return chnStr;
    },
  }
};
</script>

<style scoped lang="scss">
.home {
  cursor: pointer;

  // ========== 公告条核心样式 - 小清新风格 ==========
  // 入场/离场滑入动画
  .notice-slide-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .notice-slide-leave-active {
    transition: all 0.3s ease-in-out;
  }

  .notice-slide-enter,
  .notice-slide-leave-to {
    opacity: 0;
    transform: translateY(-16px);
    height: 0;
    margin-bottom: 0;
  }

  .notice-card {
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 8px 0 0;
    margin-bottom: 20px;
    // 薄荷奶绿渐变背景
    background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 70%);
    border: 1px solid #dcfce7;
    border-left: 4px solid #4ade80;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(74, 222, 128, 0.08);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(74, 222, 128, 0.18);
      border-left-color: #22c55e;
      background: linear-gradient(90deg, #ecfdf3 0%, #ffffff 70%);

      .notice-card-title {
        color: #16a34a;
      }
    }

    // 点击按压效果
    &:active {
      transform: translateY(0) scale(0.995);
    }
  }

  // 未读公告被关闭时，公告条横向抖动提示
  .notice-card.notice-shake {
    animation: noticeShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    border-left-color: #f97316;

    &:hover {
      transform: none;
    }
  }

  @keyframes noticeShake {

    10%,
    90% {
      transform: translateX(-2px);
    }

    20%,
    80% {
      transform: translateX(4px);
    }

    30%,
    50%,
    70% {
      transform: translateX(-8px);
    }

    40%,
    60% {
      transform: translateX(8px);
    }
  }

  // 铃铛图标容器 - 圆形背景
  .notice-card-icon {
    flex-shrink: 0;
    width: 60px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #22c55e;
    font-size: 20px;

    // 铃铛摇晃动画
    .bell-shake {
      animation: bellRing 2.5s ease-in-out infinite;
      transform-origin: top center;
    }

    @keyframes bellRing {

      0%,
      100% {
        transform: rotate(0deg);
      }

      10% {
        transform: rotate(12deg);
      }

      20% {
        transform: rotate(-10deg);
      }

      30% {
        transform: rotate(8deg);
      }

      40% {
        transform: rotate(-6deg);
      }

      50% {
        transform: rotate(4deg);
      }

      60% {
        transform: rotate(-2deg);
      }

      70% {
        transform: rotate(1deg);
      }
    }
  }

  .notice-card-body {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
    padding-right: 16px;
    gap: 12px;
  }

  .notice-type-tag {
    flex-shrink: 0;
    display: inline-block;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    transition: all 0.2s ease;

    &.type-1 {
      background: linear-gradient(135deg, #fdba74 0%, #f97316 100%);
      box-shadow: 0 2px 6px rgba(249, 115, 22, 0.2);
    }

    &.type-2 {
      background: linear-gradient(135deg, #86efac 0%, #22c55e 100%);
      box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
    }
  }

  .notice-card-title {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: #374151;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
    transition: color 0.3s ease;
  }

  .notice-card-time {
    flex-shrink: 0;
    font-size: 12px;
    color: #9ca3af;
  }

  // 更多按钮 - 胶囊样式
  .notice-card-more {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #22c55e;
    padding: 6px 16px;
    margin-right: 8px;
    height: auto;
    border-radius: 20px;
    background: rgba(34, 197, 94, 0.06);
    transition: all 0.25s ease;

    &:hover {
      background: rgba(34, 197, 94, 0.12);
      color: #16a34a;
    }

    i {
      margin-left: 4px;
      font-size: 12px;
      transition: transform 0.25s ease;
    }

    &:hover i {
      transform: translateX(3px);
    }
  }

  // 关闭按钮 - 圆形hover
  .notice-card-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #9ca3af;
    font-size: 16px;
    margin-right: 4px;
    transition: all 0.25s ease;

    &:hover {
      color: #6b7280;
      background: rgba(0, 0, 0, 0.06);
      transform: rotate(90deg);
    }
  }

  // ========== 原有其他样式保持，仅做轻微风格统一 ==========
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #dcfce7;
    background: #f0fdf4;
    border-radius: 0 8px 8px 0;
  }

  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #f3f4f6;
  }

  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans",
  "Helvetica Neue",
  Helvetica,
  Arial,
  sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
    line-height: 1.8;
  }

  h4 {
    margin-top: 0px;
    color: #374151;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 300;
    color: #1f2937;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 600;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0px;
      margin-inline-end: 0px;
      padding-inline-start: 40px;
    }
  }
}

.fx67ll-version {
  font-size: 16px;
  cursor: pointer;
  transition: color 0.25s ease;

  &:hover {
    color: #22c55e;
  }
}

.fx67ll-clock {
  margin-left: 20px;
  margin-top: 30px;
}

.fx67ll-clock-desc {
  font-size: 18px;
  margin-left: 20px;
  margin-top: 30px;
  color: #4b5563;
}
</style>
