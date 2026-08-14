<template>
  <section class="panel origin-block reveal">
    <div class="legacy-main">
      <!-- 左：品牌信息 + 版本彩蛋 -->
      <div class="brand-block">
        <el-image class="brand-image" src="https://test.fx67ll.com/fx67ll-img-collection/fx67ll.jpg"
          :preview-src-list="['https://test.fx67ll.com/fx67ll-img-collection/fx67ll.jpg']" fit="cover" />
        <div class="brand-copy">
          <span class="eyebrow">FODCF · ORIGINAL HOME</span>
          <h2>fx67ll's 后台管理框架</h2>
          <button class="version-button" type="button" @click="toggleEasterEgg">
            <span>v{{ version }}</span>
            <i :class="isEasterEggVisible ? 'el-icon-arrow-up' : 'el-icon-magic-stick'"></i>
          </button>
          <p>fx67ll.com</p>
        </div>
      </div>

      <!-- 右：技术选型 -->
      <div class="tech-block">
        <div class="tech-title">
          <span class="eyebrow">TECHNOLOGY STACK</span>
          <h3>技术选型</h3>
        </div>
        <div class="tech-columns">
          <div class="tech-col">
            <strong><i class="el-icon-s-platform"></i> 后端技术</strong>
            <div class="tech-tags">
              <span v-for="item in backendTechnologies" :key="item" title="点击复制" @click="copyTech(item)">{{ item
                }}</span>
            </div>
          </div>
          <div class="tech-col">
            <strong><i class="el-icon-monitor"></i> 前端技术</strong>
            <div class="tech-tags">
              <span v-for="item in frontendTechnologies" :key="item" title="点击复制" @click="copyTech(item)">{{ item
                }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="easter-egg">
      <div v-if="isEasterEggVisible" class="easter-egg-panel">
        <div class="easter-copy">
          <span class="eyebrow"><i class="el-icon-present"></i> HIDDEN EASTER EGG</span>
          <h3>Code is my life ＼＼\٩('ω')و//／／</h3>
          <p>Since {{ firstJobDate }} · fx67ll 已成为码农 {{ firstJobDays }}</p>
        </div>
        <div ref="clock" class="fx67ll-clock"></div>
      </div>
    </transition>
  </section>
</template>

<script>
import { version as packageVersion } from "../../../../package.json";
import FlipClock from "flipclock";
import "flipclock/dist/flipclock.css";
import moment from "moment";

/**
 * 从旧首页迁移的品牌信息 / 技术选型 / 版本彩蛋
 */
export default {
  name: "HomeOriginBlock",
  data() {
    return {
      version: packageVersion,
      firstJobDate: "2018-05-28",
      firstJobDays: "",
      isEasterEggVisible: false,
      clockInitialized: false,
      // 后端基于若依（RuoYi）脚手架的技术栈
      backendTechnologies: [
        "Spring Boot",
        "Spring Security",
        "JWT",
        "MyBatis",
        "Druid",
        "Redis",
        "MySQL",
        "Fastjson",
        "Lombok",
        "PageHelper",
        "Swagger",
        "Maven",
      ],
      // 前端基于若依 + Vue2 Element UI 的技术栈（见 package.json）
      frontendTechnologies: [
        "Vue",
        "Vue Router",
        "Vuex",
        "Element UI",
        "Axios",
        "Sass",
        "ECharts",
        "Quill",
        "Crypto-JS",
        "JSEncrypt",
        "Fuse.js",
        "NProgress",
      ],
      chnNumChar: ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"],
      chnUnitSection: ["", "万", "亿", "万亿", "亿亿"],
      chnUnitChar: ["", "十", "百", "千"],
    };
  },
  created() {
    const days = moment(moment().format("YYYY-MM-DD")).diff(moment(this.firstJobDate).format("YYYY-MM-DD"), "day");
    this.firstJobDays = `${this.numberToChinese(days)} 天`;
  },
  beforeDestroy() {
    if (this._flipClock && typeof this._flipClock.destroy === "function") {
      this._flipClock.destroy();
    }
  },
  methods: {
    // 点击复制技术项，弹出复制成功提示
    copyTech(text) {
      const textStr = String(text || "");
      const done = () => this.$message.success(`已复制：${textStr}`);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textStr).then(done).catch(() => this.fallbackCopy(textStr));
      } else {
        this.fallbackCopy(textStr, done);
      }
    },
    // 非安全上下文（如 http）降级复制方案
    fallbackCopy(text, done) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        if (done) done();
        else this.$message.success(`已复制：${text}`);
      } catch (e) {
        this.$message.error("复制失败，请手动复制");
      }
      document.body.removeChild(textarea);
    },
    toggleEasterEgg() {
      this.isEasterEggVisible = !this.isEasterEggVisible;
      if (this.isEasterEggVisible && !this.clockInitialized) {
        this.$nextTick(this.initClock);
      }
    },
    initClock() {
      if (!this.$refs.clock || this.clockInitialized) return;
      this._flipClock = new FlipClock(this.$refs.clock, new Date(this.firstJobDate), {
        face: "DayCounter",
        showSeconds: true,
        showLabels: true,
        language: { years: "年", months: "月", days: "日", hours: "時", minutes: "分", seconds: "秒" },
        countdown: false,
      });
      this.clockInitialized = true;
    },
    numberToChinese(num) {
      let unitPos = 0;
      let chnStr = "";
      let needZero = false;
      if (num === 0) return this.chnNumChar[0];
      while (num > 0) {
        const section = num % 10000;
        if (needZero) chnStr = this.chnNumChar[0] + chnStr;
        let strIns = this.sectionToChinese(section);
        strIns += section !== 0 ? this.chnUnitSection[unitPos] : this.chnUnitSection[0];
        chnStr = strIns + chnStr;
        needZero = section < 1000 && section > 0;
        num = Math.floor(num / 10000);
        unitPos += 1;
      }
      if (chnStr.substring(0, 2) === "一十") chnStr = chnStr.substr(1);
      return chnStr;
    },
    sectionToChinese(section) {
      let chnStr = "";
      let unitPos = 0;
      let zero = true;
      while (section > 0) {
        const value = section % 10;
        if (value === 0) {
          if (!zero) {
            zero = true;
            chnStr = this.chnNumChar[value] + chnStr;
          }
        } else {
          zero = false;
          chnStr = this.chnNumChar[value] + this.chnUnitChar[unitPos] + chnStr;
        }
        unitPos += 1;
        section = Math.floor(section / 10);
      }
      return chnStr;
    },
  },
};
</script>

<style lang="scss" scoped>
.origin-block {
  overflow: hidden;
}

.legacy-main {
  display: grid;
  grid-template-columns: minmax(300px, 0.95fr) minmax(380px, 1.05fr);
  gap: 22px;
}

.brand-block {
  display: flex;
  min-width: 0;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--home-primary-softer), #fff);
  border: 1px solid var(--home-border);
  border-radius: var(--home-radius-sm);
}

.brand-image {
  flex: 0 0 110px;
  width: 110px;
  height: 110px;
  margin-right: 18px;
  overflow: hidden;
  border: 4px solid #fff;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.2);
}

.brand-copy {
  min-width: 0;

  h2 {
    margin: 6px 0 8px;
    color: var(--home-ink);
    font-size: 22px;
    font-weight: 600;
  }

  p {
    margin: 10px 0 0;
    color: var(--home-muted);
    font-size: 12px;
    line-height: 1.7;
  }
}

.version-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--home-primary), var(--home-primary-dark));
  border: 0;
  border-radius: 999px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.25);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(46, 204, 113, 0.32);
  }
}

.tech-title {
  margin-bottom: 14px;

  h3 {
    margin: 5px 0 0;
    color: var(--home-ink);
    font-size: 19px;
  }
}

.tech-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.tech-col {
  padding: 14px;
  background: var(--home-primary-softer);
  border-radius: var(--home-radius-sm);

  strong {
    display: block;
    margin-bottom: 8px;
    color: var(--home-ink-soft);
    font-size: 13px;

    i {
      margin-right: 5px;
      color: var(--home-primary);
    }
  }
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;

  span {
    padding: 4px 10px;
    color: var(--home-ink-soft);
    background: #fff;
    border: 1px solid var(--home-border);
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      color: #fff;
      background: linear-gradient(135deg, var(--home-primary), var(--home-primary-dark));
      border-color: var(--home-primary);
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(46, 204, 113, 0.22);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.easter-egg-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px;
  margin-top: 18px;
  overflow-x: auto;
  background: linear-gradient(120deg, var(--home-primary-softer), #fff);
  border: 1px dashed var(--home-primary);
  border-radius: var(--home-radius-sm);
}

.easter-copy {
  flex: 0 0 auto;

  h3 {
    margin: 9px 0;
    color: var(--home-ink);
    font-size: 17px;
  }

  p {
    margin: 0;
    color: var(--home-muted);
    font-size: 12px;
  }
}

.fx67ll-clock {
  min-width: 510px;
  transform: scale(0.84);
  transform-origin: right center;
  margin-top: 20px;
}

.easter-egg-enter-active,
.easter-egg-leave-active {
  transition: all 0.3s ease;
}

.easter-egg-enter,
.easter-egg-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1050px) {
  .legacy-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .brand-block {
    align-items: flex-start;
    padding: 16px;
  }

  .brand-image {
    flex-basis: 78px;
    width: 78px;
    height: 78px;
    margin-right: 13px;
  }

  .tech-columns {
    grid-template-columns: 1fr;
  }

  .easter-egg-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .fx67ll-clock {
    transform: scale(0.72);
    transform-origin: left center;
  }
}
</style>
