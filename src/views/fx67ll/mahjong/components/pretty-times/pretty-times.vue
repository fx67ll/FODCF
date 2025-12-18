<template>
  <div class="content">
    <div class="container">
      <!-- 日期列表 -->
      <div class="scroll-view_H b-t b-b" ref="dateScrollContainer">
        <div class="date-scroll-wrapper">
          <div
            v-for="(item, index) in dateArr"
            :key="index"
            class="flex-box"
            @click="selectDateEvent(index, item)"
            :class="{ borderb: index == dateActive }"
          >
            <div
              class="date-box"
              :style="{
                color: index == dateActive ? selectedTabColor : '#333',
              }"
            >
              <span class="fontw">{{ item.week }}</span>
              <span>{{ item.date }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间选项 -->
      <div class="time-box" v-if="!isSection || isQuantum">
        <div v-for="(item, _index) in timeArr" :key="_index" class="item">
          <div
            class="item-box"
            :class="{
              disable: item.disable && !item.isMyAppoint,
              'my-appoint': item.isMyAppoint,
              active: isMultiple ? item.isActive : _index == timeActive,
            }"
            :style="{
              color: item.isMyAppoint
                ? '#2ecc71'
                : isMultiple
                ? item.isActive
                  ? selectedItemColor
                  : '#333'
                : _index == timeActive
                ? selectedItemColor
                : '#333',
            }"
            @click="selectTimeEvent(_index, item)"
          >
            <span v-if="isQuantum">{{ item.begin }}~{{ item.end }}</span>
            <span v-else>{{ item.timeRange }}</span>
            <span class="all">
              {{
                item.isMyAppoint
                  ? "我已约"
                  : item.isExpired
                  ? "已过期"
                  : item.disable
                  ? disableText
                  : undisableText
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- 预约时间段 -->
      <div class="time-box" v-else>
        <div v-for="(item, _index) in timeArr" :key="_index" class="item">
          <!-- <div
            class="item-box"
            :class="{
              disable: item.disable && !item.isMyAppoint,
              'my-appoint': item.isMyAppoint,
              active:
                item.time == timeQuanBegin ||
                item.time == timeQuanEnd ||
                item.isInclude,
            }"
            :style="{
              color: item.isMyAppoint
                ? '#2ecc71'
                : item.time == timeQuanBegin ||
                  item.time == timeQuanEnd ||
                  item.isInclude
                ? selectedItemColor
                : '#333',
            }"
            @click="handleSection(_index, item)"
          > -->
          <div
            class="item-box"
            :class="{
              disable: item.disable && !item.isMyAppoint,
              'my-appoint': item.isMyAppoint,
              active:
                item.time == timeQuanBegin ||
                item.time == timeQuanEnd ||
                item.isInclude,
            }"
            :style="{
              color: item.isMyAppoint
                ? '#2ecc71'
                : item.time == timeQuanBegin ||
                  item.time == timeQuanEnd ||
                  item.isInclude
                ? selectedItemColor
                : '#333',
            }"
          >
            <span>{{ item.timeRange }}</span>
            <span class="all">
              {{
                item.isMyAppoint
                  ? "我已约"
                  : item.isExpired
                  ? "已过期"
                  : item.disable
                  ? disableText
                  : undisableText
              }}
            </span>
          </div>
        </div>

        <!-- 包夜选项 -->
        <div class="item overnight-item-wrapper" v-if="showOvernight">
          <!-- <div
            class="item-box overnight-box"
            :class="{
              active: isOvernightActive,
              disable: isOvernightDisabled,
            }"
            @click="selectOvernightEvent"
          > -->
          <div
            class="item-box overnight-box"
            :class="{
              active: isOvernightActive,
              disable: isOvernightDisabled,
            }"
          >
            <div class="overnight-content">
              <span class="overnight-title">包夜</span>
              <span class="overnight-time">23:00 ~ 次日09:59</span>
              <span class="overnight-status">
                {{ getOvernightStatusText() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="show-time" v-if="!isMultiple && !isSection && !isQuantum">
        预约时间：{{ orderDateTime }}
      </div>
      <button @click="handleSubmit" class="submit-btn">确认预约</button>
    </div>
  </div>
</template>

<script>
import { initData, initTime, timeStamp, currentTime } from "./date.js";

export default {
  name: "prettyTimes",
  props: {
    showPop: {
      type: Boolean,
      default: false,
    },
    isQuantum: {
      type: Boolean,
      default: false,
    },
    isMultiple: {
      //是否多选
      type: Boolean,
      default: false,
    },
    isSection: {
      //预约时间段
      type: Boolean,
      default: false,
    },
    showOvernight: {
      type: Boolean,
      default: false,
    },
    disableText: {
      //禁用显示的文本（约满时）
      type: String,
      default: "已约满",
    },
    undisableText: {
      //未禁用显示的文本
      type: String,
      // default: "可预约",
      default: "未预约",
    },
    timeInterval: {
      // 时间间隔，小时为单位
      type: Number,
      default: 1,
    },
    selectedTabColor: {
      // 日期栏选中的颜色
      type: String,
      default: "#2ecc71",
    },
    selectedItemColor: {
      // 时间选中的颜色
      type: String,
      default: "#2ecc71",
    },
    beginTime: {
      type: String,
      default: "09:00:00",
    },
    endTime: {
      type: String,
      default: "19:00:00",
    },
    appointTime: {
      // 预约的时间
      type: Array,
      default() {
        return [];
      },
    },
    disableTimeSlot: {
      // 预约开始和结束时间，来禁用时间段
      type: Array,
      default() {
        return [];
      },
    },
    myAppointTimeSlot: {
      type: Array,
      default() {
        return [];
      },
    },
    formParams: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      orderDateTime: "暂无选择", // 选中时间
      orderTimeArr: {}, //多选的时间
      dateArr: [], //日期数据
      timeArr: [], //时间数据
      nowDate: "", // 当前日期
      dateActive: 0, //选中的日期索引
      timeActive: 0, //选中的时间索引
      timeQuanBeginIndex: 0, //时间段开始的下标
      selectDate: "", //选择的日期
      timeQuanBegin: "", //时间段开始时间
      timeQuanEnd: "", //时间段结束时间,
      isOvernightActive: false,
      isOvernightDisabled: false,
      isOvernightExpired: false,
      isOvernightMyAppoint: false,
      isWheelEventAdded: false, // 添加滚轮事件监听标志
    };
  },
  watch: {
    appointTime: {
      handler(val) {
        this.initOnload();
      },
    },
    disableTimeSlot: {
      handler(val) {
        this.initOnload();
      },
      deep: true,
    },
    myAppointTimeSlot: {
      handler(val) {
        this.initOnload();
      },
      deep: true,
    },
    formParams: {
      handler(val) {
        this.checkOvernightEcho();
        this.checkTimeSectionEcho();
      },
      deep: true,
    },
    showPop: {
      handler(val) {
        this.$emit("change", val);
      },
    },
  },
  created() {
    this.selectDate = this.nowDate = currentTime().date;
    this.initOnload();
  },
  mounted() {
    this.$emit("ready");
    // 添加鼠标滚轮事件监听
    this.addWheelEventListener();
  },
  beforeDestroy() {
    // 组件销毁前移除事件监听
    this.removeWheelEventListener();
  },
  methods: {
    // 添加鼠标滚轮事件监听
    addWheelEventListener() {
      if (this.isWheelEventAdded) return;

      const scrollContainer = this.$refs.dateScrollContainer;
      if (!scrollContainer) return;

      // 使用 passive: false 以便可以调用 preventDefault
      scrollContainer.addEventListener("wheel", this.handleWheelScroll, {
        passive: false,
      });
      this.isWheelEventAdded = true;
    },

    // 移除鼠标滚轮事件监听
    removeWheelEventListener() {
      if (!this.isWheelEventAdded) return;

      const scrollContainer = this.$refs.dateScrollContainer;
      if (!scrollContainer) return;

      scrollContainer.removeEventListener("wheel", this.handleWheelScroll);
      this.isWheelEventAdded = false;
    },

    // 处理鼠标滚轮滚动事件
    handleWheelScroll(event) {
      event.preventDefault();

      const scrollContainer = this.$refs.dateScrollContainer;
      if (!scrollContainer) return;

      // 计算滚动距离，可以根据需要调整滚动速度
      const scrollAmount = event.deltaY * 4;

      // 水平滚动
      scrollContainer.scrollLeft += scrollAmount;
    },

    initOnload() {
      this.dateArr = initData();
      this.timeArr = initTime(
        this.beginTime,
        this.endTime,
        this.timeInterval,
        this.isQuantum
      );
      this.timeQuanBegin = this.timeQuanEnd = "";
      let isFullTime = true;

      // 计算"当前时间+1小时"
      const nowTimeStr = currentTime().time;
      const nowTimeStamp = new Date(`2000-01-01 ${nowTimeStr}`).getTime();
      const nextHourTimeStamp = nowTimeStamp + 3600000;
      const nextHourTime = new Date(nextHourTimeStamp)
        .toTimeString()
        .slice(0, 8);

      // 为时间段模式的时间项添加时间范围显示
      if (this.isSection && !this.isQuantum) {
        this.timeArr.forEach((item, index) => {
          const currentTime = item.time;
          const currentTimeWithoutSeconds = currentTime.slice(0, 5);
          const currentHour = currentTime.slice(0, 2);
          const endTime = `${currentHour}:59`;
          item.timeRange = `${currentTimeWithoutSeconds}~${endTime}`;
        });
      } else if (!this.isQuantum) {
        this.timeArr.forEach((item, index) => {
          const currentTime = item.time;
          const currentTimeWithoutSeconds = currentTime.slice(0, 5);
          const currentHour = currentTime.slice(0, 2);
          const endTime = `${currentHour}:59`;
          item.timeRange = `${currentTimeWithoutSeconds}~${endTime}`;
        });
      }

      this.checkOvernightStatus();
      this.checkTimeSectionEcho();

      this.timeArr.forEach((item, index) => {
        item.isMyAppoint = false;
        item.isExpired = false;

        if (this.isQuantum) {
          const cur_be_time = `${this.selectDate} ${item.begin}:00`;
          const cur_end_time = `${this.selectDate} ${item.end}:00`;

          for (let time of this.myAppointTimeSlot) {
            const [my_begin = "", my_end = ""] = time;
            if (
              my_begin &&
              my_end &&
              my_begin <= cur_be_time &&
              cur_end_time <= my_end
            ) {
              item.isMyAppoint = true;
              item.disable = false;
            }
          }

          if (!item.isMyAppoint) {
            if (this.disableTimeSlot && this.disableTimeSlot.length > 0) {
              for (let time of this.disableTimeSlot) {
                const [begin_time = "", end_time = ""] = time;
                if (
                  !begin_time ||
                  !end_time ||
                  isNaN(new Date(begin_time).getTime()) ||
                  isNaN(new Date(end_time).getTime())
                ) {
                  continue;
                }
                if (begin_time <= cur_be_time && cur_end_time <= end_time) {
                  item.disable = true;
                }
              }
            }
            if (
              this.selectDate == this.nowDate &&
              nextHourTime > `${item.begin}:00`
            ) {
              item.disable = true;
              item.isExpired = true;
            }
          }

          if (this.orderTimeArr[this.selectDate]) {
            for (let items of this.orderTimeArr[this.selectDate]) {
              if (
                items[0].split(" ")[1] === `${item.begin}:00` &&
                items[1].split(" ")[1] === `${item.end}:00`
              ) {
                item.isActive = true;
              }
            }
          }
        } else {
          if (!item.time || item.time.length < 8) {
            item.disable = true;
            return;
          }
          const cur_time = `${this.selectDate} ${item.time}`;
          if (isNaN(new Date(cur_time).getTime())) {
            item.disable = true;
            return;
          }

          for (let time of this.myAppointTimeSlot) {
            const [my_begin = "", my_end = ""] = time;
            if (
              my_begin &&
              my_end &&
              my_begin <= cur_time &&
              cur_time <= my_end
            ) {
              item.isMyAppoint = true;
              item.disable = false;
            }
          }

          if (!item.isMyAppoint) {
            if (this.disableTimeSlot && this.disableTimeSlot.length > 0) {
              for (let time of this.disableTimeSlot) {
                const [begin_time = "", end_time = ""] = time;
                if (
                  !begin_time ||
                  !end_time ||
                  isNaN(new Date(begin_time).getTime()) ||
                  isNaN(new Date(end_time).getTime())
                ) {
                  continue;
                }
                if (begin_time <= cur_time && cur_time <= end_time) {
                  item.disable = true;
                  break;
                }
              }
            }

            if (!item.disable) {
              this.appointTime.forEach((t) => {
                let [date, time] = t.split(" ");
                if (!date || !time || date !== this.selectDate) {
                  return;
                }
                if (item.time === time) {
                  item.disable = true;
                }
              });
            }

            if (
              !item.disable &&
              this.selectDate == this.nowDate &&
              nextHourTime > item.time
            ) {
              item.disable = true;
              item.isExpired = true;
            }
          }

          if (!item.disable && !item.isMyAppoint) {
            isFullTime = false;
          }
          if (this.isSection) {
            if (
              !this.formParams.reservationStartTime ||
              !this.formParams.reservationEndTime
            ) {
              item.isInclude = false;
            }
          }
          if (
            this.isMultiple &&
            (this.orderTimeArr[this.selectDate] || []).includes(item.time)
          ) {
            item.isActive = true;
          }
        }
      });

      isFullTime = true;
      this.timeArr.forEach((item) => {
        if (!item.disable && !item.isMyAppoint) {
          isFullTime = false;
        }
      });

      this.orderDateTime = isFullTime ? "暂无选择" : this.selectDate;
      this.timeActive = -1;
      for (let i = 0, len = this.timeArr.length; i < len; i++) {
        if (!this.timeArr[i].disable && !this.timeArr[i].isMyAppoint) {
          const currentHour = this.timeArr[i].time.slice(0, 2);
          const timeWithoutSeconds = this.timeArr[i].time.slice(0, 5);
          this.orderDateTime = `${this.selectDate} ${timeWithoutSeconds}~${currentHour}:59`;
          this.timeActive = i;
          break;
        }
      }
    },
    checkTimeSectionEcho() {
      if (
        !this.isSection ||
        !this.formParams.reservationStartTime ||
        !this.formParams.reservationEndTime
      ) {
        return;
      }

      const startTime = this.formParams.reservationStartTime;
      const endTime = this.formParams.reservationEndTime;

      const startDate = startTime.split(" ")[0];
      if (startDate !== this.selectDate) {
        return;
      }

      const startHour = startTime.split(" ")[1].slice(0, 2);
      const startHourMin = startTime.split(" ")[1].slice(0, 5);
      const displayEndTime = `${startHour}:59`;

      let startIndex = -1;
      let endIndex = -1;

      this.timeArr.forEach((item, index) => {
        const itemTime = item.time.slice(0, 5);
        if (itemTime === startHourMin) {
          startIndex = index;
        }
        if (item.time.slice(0, 5) === endTime.split(" ")[1].slice(0, 5)) {
          endIndex = index;
        }
      });

      if (startIndex !== -1 && endIndex !== -1) {
        this.timeQuanBeginIndex = startIndex;
        this.timeQuanBegin = this.timeArr[startIndex].time;
        this.timeQuanEnd = this.timeArr[endIndex].time;

        for (let i = startIndex + 1; i < endIndex; i++) {
          this.timeArr[i].isInclude = true;
        }

        this.orderDateTime = `${this.selectDate} ${startHourMin} ~ ${displayEndTime}`;
      }
    },
    getOvernightStatusText() {
      if (this.isOvernightExpired) {
        return "已过期";
      } else if (this.isOvernightMyAppoint) {
        return "我已约";
      } else if (this.isOvernightDisabled) {
        return "已约满";
      } else {
        // return "可预约";
        return "未预约";
      }
    },
    checkOvernightStatus() {
      this.isOvernightActive = false;
      this.isOvernightDisabled = false;
      this.isOvernightExpired = false;
      this.isOvernightMyAppoint = false;

      if (!this.showOvernight) return;

      const overnightStart = `${this.selectDate} 23:00:00`;
      const nextDate = this.getNextDate(this.selectDate);
      const overnightEnd = `${nextDate} 09:00:00`;

      if (this.selectDate === this.nowDate) {
        const currentDateTime = new Date();
        const overnightStartTime = new Date(`${this.selectDate} 23:00:00`);
        if (currentDateTime >= overnightStartTime) {
          this.isOvernightExpired = true;
          this.isOvernightDisabled = true;
        }
      }

      for (let time of this.myAppointTimeSlot) {
        const [my_begin = "", my_end = ""] = time;
        if (
          my_begin &&
          my_end &&
          my_begin === overnightStart &&
          my_end === overnightEnd
        ) {
          this.isOvernightMyAppoint = true;
          this.isOvernightDisabled = true;
          break;
        }
      }

      if (!this.isOvernightMyAppoint && !this.isOvernightExpired) {
        if (this.disableTimeSlot && this.disableTimeSlot.length > 0) {
          for (let time of this.disableTimeSlot) {
            const [begin_time = "", end_time = ""] = time;
            if (begin_time && end_time) {
              if (
                (begin_time <= overnightStart && overnightStart < end_time) ||
                (begin_time < overnightEnd && overnightEnd <= end_time) ||
                (overnightStart <= begin_time && end_time <= overnightEnd)
              ) {
                this.isOvernightDisabled = true;
                break;
              }
            }
          }
        }
      }

      this.checkOvernightEcho();
    },
    checkOvernightEcho() {
      if (!this.showOvernight) return;

      const overnightStart = `${this.selectDate} 23:00:00`;
      const nextDate = this.getNextDate(this.selectDate);
      const overnightEnd = `${nextDate} 10:00:00`;

      if (
        this.formParams &&
        this.formParams.reservationStartTime &&
        this.formParams.reservationEndTime
      ) {
        const startTime = this.formParams.reservationStartTime;
        const endTime = this.formParams.reservationEndTime;

        if (startTime === overnightStart && endTime === overnightEnd) {
          this.isOvernightActive = true;
          this.orderDateTime = `${this.selectDate} 23:00 ~ ${nextDate} 10:00`;
        } else {
          this.isOvernightActive = false;
        }
      }
    },
    getNextDate(date) {
      const currentDate = new Date(date);
      currentDate.setDate(currentDate.getDate() + 1);
      return currentDate.toISOString().split("T")[0];
    },
    selectOvernightEvent() {
      if (this.isOvernightDisabled) return;

      this.isOvernightActive = !this.isOvernightActive;

      if (this.isOvernightActive) {
        this.clearTimeSelection();

        const overnightStart = `${this.selectDate} 23:00:00`;
        const nextDate = this.getNextDate(this.selectDate);
        const overnightEnd = `${nextDate} 10:00:00`;

        this.$emit("overnight-change", {
          start: overnightStart,
          end: overnightEnd,
          date: this.selectDate,
        });

        this.orderDateTime = `${this.selectDate} 23:00 ~ ${nextDate} 10:00`;
      } else {
        this.$emit("overnight-change", null);
        this.orderDateTime = "暂无选择";
      }
    },
    clearTimeSelection() {
      this.timeActive = -1;
      this.timeQuanBegin = "";
      this.timeQuanEnd = "";
      this.orderDateTime = "暂无选择";
      this.orderTimeArr = {};

      this.timeArr.forEach((item) => {
        item.isActive = false;
        item.isInclude = false;
      });
    },
    selectDateEvent(index, item) {
      this.dateActive = index;
      this.selectDate = item.date;
      this.initOnload();

      this.$emit("date-change", {
        selectedDate: item.date,
        selectedWeek: item.week,
        activeIndex: index,
      });
    },
    selectTimeEvent(index, item) {
      if (this.isOvernightActive) {
        this.isOvernightActive = false;
        this.$emit("overnight-change", null);
      }

      if (this.isQuantum) {
        return this.handleSelectQuantum(index, item);
      }
      if (item.isMyAppoint || item.disable) return;

      if (this.isMultiple) {
        item.isActive = !item.isActive;
        this.timeArr = this.timeArr.slice();
        this.orderTimeArr[this.selectDate] = this.timeArr.reduce(
          (prev, cur) => {
            cur.isActive && prev.push(cur.time);
            return prev;
          },
          []
        );
        let time = [];
        for (let date in this.orderTimeArr) {
          this.orderTimeArr[date].forEach((item) => {
            time.push(`${date} ${item}`);
          });
        }
        this.$emit("change", time);
      } else {
        this.timeActive = index;
        const currentHour = item.time.slice(0, 2);
        const timeWithoutSeconds = item.time.slice(0, 5);
        this.orderDateTime = `${this.selectDate} ${timeWithoutSeconds}~${currentHour}:59`;
        this.$emit("change", this.orderDateTime);
      }
    },
    handleSection(index, item) {
      if (this.isOvernightActive) {
        this.isOvernightActive = false;
        this.$emit("overnight-change", null);
      }

      if (item.isMyAppoint || item.disable) return;

      const clearTime = () => {
        this.timeQuanBeginIndex = index;
        this.timeQuanBegin = item.time;
        this.timeQuanEnd = "";
        this.$emit("change", {
          beginTime: `${this.selectDate} ${this.timeQuanBegin}`,
          endTime: this.timeQuanEnd
            ? `${this.selectDate} ${this.timeQuanEnd}`
            : null,
        });
      };

      if (!this.timeQuanBegin) {
        clearTime();
        return;
      }

      if (!this.timeQuanEnd && this.timeQuanBegin) {
        let isDisble = false;
        let start = this.timeQuanBeginIndex;
        let end = index;
        start > end && ([start, end] = [end, start]);

        for (let i = start + 1; i < end; i++) {
          if (this.timeArr[i].disable || this.timeArr[i].isMyAppoint) {
            isDisble = true;
            clearTime();
            return;
          }
        }

        if (!isDisble) {
          for (let i = start + 1; i < end; i++) {
            this.timeArr[i].isInclude = true;
          }
        }
        this.timeQuanEnd = item.time;

        const startTime = `${this.selectDate} ${this.timeQuanBegin}`;
        const endTime = `${this.selectDate} ${this.timeQuanEnd}`;
        const startHour = this.timeQuanBegin.slice(0, 2);
        const startHourMin = this.timeQuanBegin.slice(0, 5);
        const displayEndTime = `${startHour}:59`;

        this.orderDateTime = `${this.selectDate} ${startHourMin} ~ ${displayEndTime}`;

        this.$emit("change", {
          beginTime: startTime,
          endTime: endTime,
        });
        return;
      }

      if (this.timeQuanBegin && this.timeQuanEnd) {
        this.timeArr.forEach((t) => {
          t.isInclude = false;
        });
        clearTime();
      }
    },
    handleSelectQuantum(index, item) {
      if (this.isOvernightActive) {
        this.isOvernightActive = false;
        this.$emit("overnight-change", null);
      }

      if (item.isMyAppoint || item.disable) return;

      if (this.isMultiple) {
        item.isActive = !item.isActive;
        this.timeArr = this.timeArr.slice();
        this.orderTimeArr[this.selectDate] = this.timeArr.reduce(
          (prev, cur) => {
            const cur_be_time = `${this.selectDate} ${cur.begin}:00`;
            const cur_end_time = `${this.selectDate} ${cur.end}:00`;
            cur.isActive && prev.push([cur_be_time, cur_end_time]);
            return prev;
          },
          []
        );
        this.$emit("change", this.orderTimeArr);
      } else {
        this.timeActive = index;
        const displayEndTime = `${item.begin.slice(0, 2)}:59`;
        this.orderDateTime = {
          begin: `${this.selectDate} ${item.begin}:00`,
          end: `${this.selectDate} ${item.end}:00`,
          displayText: `${item.begin}:00~${displayEndTime}`,
        };
        this.$emit("change", this.orderDateTime);
      }
    },
    handleChange() {
      this.timeQuanBegin > this.timeQuanEnd &&
        ([this.timeQuanBegin, this.timeQuanEnd] = [
          this.timeQuanEnd,
          this.timeQuanBegin,
        ]);
    },
    handleSubmit() {
      if (this.isOvernightActive) {
        const overnightStart = `${this.selectDate} 23:00:00`;
        const nextDate = this.getNextDate(this.selectDate);
        const overnightEnd = `${nextDate} 10:00:00`;

        this.$emit("overnight-submit", {
          start: overnightStart,
          end: overnightEnd,
          date: this.selectDate,
        });
        return;
      }

      if (this.isSection) {
        this.handleChange();
        const startTime = `${this.selectDate} ${this.timeQuanBegin}`;
        const endTime = this.timeQuanEnd
          ? `${this.selectDate} ${this.timeQuanEnd}`
          : null;

        this.$emit("change", {
          beginTime: startTime,
          endTime: endTime,
        });
        return;
      }
      if (this.isMultiple) {
        if (this.isQuantum) {
          this.$emit("change", this.orderTimeArr);
          return;
        }
        let time = [];
        for (let date in this.orderTimeArr) {
          this.orderTimeArr[date].forEach((item) => {
            time.push(`${date} ${item}`);
          });
        }
        this.$emit("change", time);
      } else {
        this.$emit("change", this.orderDateTime);
      }
    },
    clearSelected() {
      this.timeActive = -1;
      this.timeQuanBegin = "";
      this.timeQuanEnd = "";
      this.timeQuanBeginIndex = 0;
      this.orderDateTime = "暂无选择";
      this.orderTimeArr = {};

      this.timeArr.forEach((item) => {
        item.isActive = false;
        item.isInclude = false;
      });

      this.isOvernightActive = false;
      this.$emit("overnight-change", null);

      this.initOnload();

      this.$emit("clear", true);
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.content {
  text-align: center;
  width: 100%;
  /* height: 100vh; */
  overflow: hidden;
  cursor: pointer;
}

.bottom {
  /* display: flex; */
  display: none;
  flex-direction: row;
  width: 100%;
  padding: 0 16px;
}

.show-time {
  width: 70%;
  height: 47px;
  color: #505050;
  font-size: 15px;
  line-height: 47px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  margin-right: 10px;
}

.submit-btn {
  width: 50%;
  height: 47px;
  margin: 0 auto;
  color: white;
  background-color: #2ecc71;
  font-size: 15px;
  line-height: 47px;
  text-align: center;
  border: none;
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
}

.fontw {
  font-weight: bold;
}

.borderb {
  border-bottom: 2px solid #2ecc71;
}

/* .container {
  padding: 16px;
} */

.scroll-view_H {
  /* width: 100%; */
  width: calc(100% - 12px);
  height: 75px;
  background-color: #fff;
  position: relative;
  /* padding-top: 10px; */
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  /* margin-bottom: 16px; */

  /* 添加滚轮滚动平滑效果 */
  scroll-behavior: smooth;
  /* 隐藏滚动条但仍可滚动 */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* Chrome, Safari and Opera */
.scroll-view_H::-webkit-scrollbar {
  display: none;
}

.scroll-view_H::after {
  background: #e5e5e5;
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  position: absolute;
  bottom: 0;
  left: 0;
  transform: scaleY(0.5);
}

.date-scroll-wrapper {
  display: flex;
  height: 100%;
}

.flex-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
  min-width: 80px;
  margin: 0 10px;
  box-sizing: border-box;
}

.flex-box.active .date-box {
  border: none;
}

.flex-box.active .date-box .days,
.flex-box.active .date-box .date {
  font-weight: bold;
  color: #818181;
}

.date-box {
  border: none;
  display: flex;
  height: 50px;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  font-size: 15px;
  color: rgba(129, 129, 129, 1);
}

.date-box .date {
  font-weight: bold;
  color: #818181;
  font-size: 15px;
}

.time-box {
  /* padding: 14px 6px 13px; */
  padding-top: 10px;
  display: flex;
  flex-wrap: wrap;
  background-color: #fff;
  cursor: not-allowed;
}

.item {
  width: 25%;
  padding: 0 9px;
  margin: 10px 0;
}

.item-box {
  width: 100%;
  height: 77px;
  padding: 0 22px;
  background: #fff;
  color: #333;
  border: 1px solid #eeeeee;
  font-size: 14px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.item-box.disable {
  background: #f1f3f6 !important;
  color: #999 !important;
}

.item-box.my-appoint {
  background: rgba(46, 204, 113, 0.1) !important;
  color: #2ecc71 !important;
}

.item-box.active {
  border: 1px solid #2ecc71;
  font-weight: bold;
}

.item-box .all {
  font-size: 11px;
  padding-top: 5px;
}

.overnight-item-wrapper {
  flex: 0 0 75%;
  margin: 10px auto;
}

.overnight-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* padding: 15px 10px; */
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
  height: 100%;
  justify-content: center;
}

.overnight-box.active {
  border-color: #2ecc71;
  background-color: #e8f5e8;
  color: #2ecc71;
}

.overnight-box.disable {
  background-color: #f5f5f5;
  color: #999;
  border-color: #ddd;
}

.overnight-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.overnight-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.overnight-time {
  font-size: 14px;
  margin-bottom: 5px;
}

.overnight-status {
  font-size: 12px;
  color: #666;
}

.overnight-box.active .overnight-status {
  color: #2ecc71;
}

.overnight-box.disable .overnight-status {
  color: #999;
}
</style>
