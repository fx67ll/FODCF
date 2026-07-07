<template>
  <div class="app-container home">
    <!-- 顶部公告条：有最新公告且未被关闭（关闭的是具体公告，新公告会再显示） -->
    <div class="notice-card" v-if="latestNotice && !isNoticeClosed" @click="handleViewLatest">
      <div class="notice-card-icon">
        <i class="el-icon-bell"></i>
      </div>
      <div class="notice-card-body">
        <span class="notice-type-tag" :class="'type-' + latestNotice.noticeType">{{ typeText(latestNotice.noticeType)
        }}</span>
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
        if (!notice || !notice.noticeId) return;
        const lastId = sessionStorage.getItem("lastNoticeId");
        // 刷新时若公告ID变化，自动弹出详情（与移动端一致）
        if (String(lastId) !== String(notice.noticeId)) {
          // 只记录已弹过的公告ID，不设 readNoticeId，保留铃铛红点
          sessionStorage.setItem("lastNoticeId", notice.noticeId);
          getPublicNotice(notice.noticeId).then((res) => {
            this.latestNoticeDetail = res.data || {};
            this.noticeOpen = true;
          });
        }
      });
    },
    /** 类型文本 */
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((d) => d.value === noticeType);
      return dict ? dict.label : "公告";
    },
    /** 点击公告条查看最新公告详情 */
    handleViewLatest() {
      if (!this.latestNotice) return;
      getPublicNotice(this.latestNotice.noticeId).then((response) => {
        this.latestNoticeDetail = response.data || {};
        this.noticeOpen = true;
      });
    },
    /** 跳转公告列表页 */
    goNoticeList() {
      this.$router.push(NOTICE_PUBLIC_PATH).catch(() => { });
    },
    /** 关闭首页公告条（关闭当前公告，新公告到达时会再次显示） */
    handleCloseNotice() {
      if (this.latestNotice && this.latestNotice.noticeId) {
        this.closedNoticeId = String(this.latestNotice.noticeId);
        sessionStorage.setItem("closedNoticeId", this.closedNoticeId);
      }
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

  // 顶部公告条
  .notice-card {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 4px 0 0;
    margin-bottom: 20px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-left: 4px solid #2ecc71;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      box-shadow: 0 6px 20px rgba(46, 204, 113, 0.15);
      border-left-color: #2ecc71;

      .notice-card-title {
        color: #2ecc71;
      }
    }
  }

  .notice-card-icon {
    flex-shrink: 0;
    width: 56px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2ecc71;
    font-size: 20px;
  }

  .notice-card-body {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
    padding-right: 12px;
  }

  .notice-card-title {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0 12px;
    transition: color 0.25s ease;
  }

  .notice-card-time {
    flex-shrink: 0;
    font-size: 12px;
    color: #c0c4cc;
  }

  .notice-type-tag {
    flex-shrink: 0;
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 12px;
    color: #fff;

    &.type-1 {
      background: #ff9900;
    }

    &.type-2 {
      background: #2ecc71;
    }
  }

  .notice-card-more {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #2ecc71;
    padding: 0 16px;
    height: 100%;

    &:hover {
      background: rgba(46, 204, 113, 0.08);
    }

    i {
      margin-left: 3px;
      font-size: 12px;
    }
  }

  .notice-card-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 100%;
    color: #c0c4cc;
    font-size: 15px;

    &:hover {
      color: #909399;
      background: rgba(0, 0, 0, 0.04);
    }
  }

  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }

  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
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
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}

.fx67ll-version {
  font-size: 16px;

  &:hover {
    color: #2ECC71;
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
}
</style>