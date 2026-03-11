<template>
  <div class="app-container home">
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
  </div>
</template>

<script>
import { version as packageVersion } from '../../package.json';
import FlipClock from 'flipclock';
import 'flipclock/dist/flipclock.css';
import moment from 'moment';
export default {
  name: "Index",
  data() {
    return {
      version: packageVersion,
      isShowFirstJobDate: false,
      firstJobDate: '2018-05-28',
      firstJobDays: 0,
      chnNumChar: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
      chnUnitSection: ['', '万', '亿', '万亿', '亿亿'],
      chnUnitChar: ['', '十', '百', '千'],
    };
  },
  mounted() {
    this.initStuDays();
    this.initClock();
  },
  methods: {
    goTarget(href) {
      window.open(href, "_blank");
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