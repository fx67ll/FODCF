<template>
  <!-- 查看外快盈亏历史数据走势图的弹窗 -->
  <el-dialog title="外快盈亏历史数据走势图" :visible.sync="dialogVisible" :close-on-click-modal="false"
    :show-close="true" :fullscreen="true" :destroy-on-close="true" v-loading="historyDataChartLoading" append-to-body
    @open="handleDialogOpen">
    <div id="historyDataAnalysisContainer"></div>
  </el-dialog>
</template>

<script>
import { listExtra } from "@/api/fx67ll/dortmund/extra";

import * as echarts from "echarts";

export default {
  name: "ExtraHistoryChartDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 走势图加载状态
      historyDataChartLoading: false,
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
    // 弹窗打开后等DOM渲染完成再组装图表
    handleDialogOpen() {
      const self = this;
      this.historyDataChartLoading = true;
      setTimeout(() => {
        self.setChartDomHeight();
        self.formatHistoiryListData();
      }, 518);
      setTimeout(() => {
        self.historyDataChartLoading = false;
      }, 5918);
    },
    // 动态赋值图表高度
    setChartDomHeight() {
      const domHeight = window.innerHeight - 114;
      document.getElementById("historyDataAnalysisContainer").style.height =
        domHeight + "px";
    },
    // 组装历史数据
    formatHistoiryListData() {
      const self = this;
      listExtra({
        pageNum: 1,
        pageSize: 999999999,
      }).then((response) => {
        const hisListData = response?.rows;
        const chartListData = [];
        hisListData.forEach((item) => {
          const lastMoney = parseFloat(
            (
              parseFloat(item?.extraMoney || 0) -
              parseFloat(item?.seedMoney || 0) -
              parseFloat(item?.winMoney || 0)
            ).toFixed(2)
          );
          const nowMoney = parseFloat(
            (
              parseFloat(item?.extraMoney || 0) -
              parseFloat(item?.seedMoney || 0)
            ).toFixed(2)
          );
          const highMoney = lastMoney > nowMoney ? lastMoney : nowMoney;
          const lowMoney = lastMoney < nowMoney ? lastMoney : nowMoney;
          chartListData.push([
            item?.createTime,
            lastMoney,
            nowMoney,
            lowMoney,
            highMoney,
          ]);
        });
        self.initDataAnalysisChart(chartListData);
        self.historyDataChartLoading = false;
      });
    },
    // 初始化外快盈亏历史数据走势图
    initDataAnalysisChart(kChartData) {
      var chartDom = document.getElementById("historyDataAnalysisContainer");
      var myChart = echarts.init(chartDom);
      var option;

      const upColor = "#ec0000";
      const upBorderColor = "#8A0000";
      const downColor = "#00da3c";
      const downBorderColor = "#008F28";

      // Each item: open，close，lowest，highest
      const data0 = splitData(kChartData);

      function splitData(rawData) {
        const categoryData = [];
        const values = [];
        for (var i = 0; i < rawData.length; i++) {
          categoryData.push(rawData[i].splice(0, 1)[0]);
          values.push(rawData[i]);
        }
        return {
          categoryData: categoryData,
          values: values,
        };
      }

      function calculateMA(dayCount) {
        var result = [];
        for (var i = 0, len = data0.values.length; i < len; i++) {
          if (i < dayCount) {
            result.push("-");
            continue;
          }
          var sum = 0;
          for (var j = 0; j < dayCount; j++) {
            sum += +data0.values[i - j][1];
          }
          result.push(parseFloat((sum / dayCount).toFixed(2)));
        }
        return result;
      }

      option = {
        // title: {
        //   text: "上证指数",
        //   left: 0,
        // },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
        },
        legend: {
          // data: ["日K", "MA5", "MA10", "MA20", "MA30"],
          data: ["外快盈亏", "MA5", "MA10", "MA20", "MA30"],
        },
        grid: {
          left: "10%",
          right: "10%",
          bottom: "15%",
        },
        xAxis: {
          type: "category",
          data: data0.categoryData,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: "dataMin",
          max: "dataMax",
        },
        yAxis: {
          scale: true,
          splitArea: {
            show: true,
          },
        },
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
          },
          {
            show: true,
            type: "slider",
            top: "90%",
            start: 0,
            end: 100,
          },
        ],
        series: [
          {
            name: "外快盈亏",
            type: "candlestick",
            data: data0.values,
            itemStyle: {
              color: upColor,
              color0: downColor,
              borderColor: upBorderColor,
              borderColor0: downBorderColor,
            },
            markPoint: {
              label: {
                formatter: function (param) {
                  return param != null ? Math.round(param.value) + "" : "";
                },
              },
              data: [
                // // 自定义标记点
                // {
                //   name: "Mark",
                //   coord: ["2023-09-18 02:02:58", 3649.9],
                //   value: 3649.9,
                //   itemStyle: {
                //     color: "rgb(41,60,85)",
                //   },
                // },
                // 最高标记点
                {
                  name: "highest value",
                  type: "max",
                  valueDim: "highest",
                },
                // 最低标记点
                {
                  name: "lowest value",
                  type: "min",
                  valueDim: "lowest",
                },
                // // 平均标记点
                // {
                //   name: "average value on close",
                //   type: "average",
                //   valueDim: "close",
                // },
              ],
              tooltip: {
                formatter: function (param) {
                  return param.name + "<br>" + (param.data.coord || "");
                },
              },
            },
            markLine: {
              symbol: ["none", "none"],
              data: [
                [
                  {
                    name: "from lowest to highest",
                    type: "min",
                    valueDim: "lowest",
                    symbol: "circle",
                    symbolSize: 10,
                    label: {
                      show: false,
                    },
                    emphasis: {
                      label: {
                        show: false,
                      },
                    },
                  },
                  {
                    type: "max",
                    valueDim: "highest",
                    symbol: "circle",
                    symbolSize: 10,
                    label: {
                      show: false,
                    },
                    emphasis: {
                      label: {
                        show: false,
                      },
                    },
                  },
                ],
                {
                  name: "min line on close",
                  type: "min",
                  valueDim: "close",
                },
                {
                  name: "max line on close",
                  type: "max",
                  valueDim: "close",
                },
              ],
            },
          },
          {
            name: "MA5",
            type: "line",
            data: calculateMA(5),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
            },
          },
          {
            name: "MA10",
            type: "line",
            data: calculateMA(10),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
            },
          },
          {
            name: "MA20",
            type: "line",
            data: calculateMA(20),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
            },
          },
          {
            name: "MA30",
            type: "line",
            data: calculateMA(30),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
            },
          },
        ],
      };

      option && myChart.setOption(option);
    },
  },
};
</script>
