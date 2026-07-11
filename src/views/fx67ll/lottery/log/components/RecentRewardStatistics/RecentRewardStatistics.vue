<template>
  <!--
    历史号码中奖金额统计弹窗（从父页面 index.vue 抽离）
    :visible.sync 双向绑定控制显示/隐藏
    width="900px" 宽度 900 像素
    :close-on-click-modal="false" 禁止点击遮罩层关闭
    append-to-body 将对话框插入到 body 元素下，避免层级/定位问题
    打开时自动查询统计数据
  -->
  <el-dialog title="历史号码中奖金额统计" :visible.sync="dialogVisible" :close-on-click-modal="false" width="900px"
    :style="`top: ${getDialogVerticalOffset(470)}; left: 20px;`" append-to-body @open="handleOpen">
    <div id="logTotalContainer">
      <el-table v-loading="logTotalLoading" :data="logTotalList">
        <el-table-column label="统计类型" align="center" prop="lotteryType" />
        <el-table-column label="总购买期数" align="center" prop="totalTickets" />
        <el-table-column label="总购买注数" align="center" prop="totalNumbers">
          <template slot-scope="scope">
            <span style="color: #e6a23c">{{ scope.row.totalNumbers }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总花费金额" align="center" prop="totalNumbers">
          <template slot-scope="scope">
            <span style="color: #409eff">{{
              `￥${scope.row.totalNumbers * 2}`
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="中奖期数" align="center" prop="winningTickets">
          <template slot-scope="scope">
            <span style="color: #2ecc71">{{ scope.row.winningTickets }}</span>
          </template>
        </el-table-column>
        <el-table-column label="中奖金额" align="center" prop="totalWinningAmount">
          <template slot-scope="scope">
            <span style="color: #ff5a5f">{{
              `￥${scope.row.totalWinningAmount}`
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="回血比例" align="center" prop="totalWinningAmount">
          <template slot-scope="scope">
            <span>{{
              `${(
                (scope.row.totalWinningAmount /
                  (scope.row.totalNumbers * 2)) *
                100
              ).toFixed(2)}%`
            }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listTotalReward } from "@/api/fx67ll/lottery/log";
import { formatObjectArrayNullProperty, getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "RecentRewardStatistics",
  props: {
    // 控制弹窗显示/隐藏，与父组件 .sync 双向绑定
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 统计数据列表
      logTotalList: [],
      // 加载状态
      logTotalLoading: false,
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
    formatObjectArrayNullProperty,
    // 弹窗打开时触发查询
    handleOpen() {
      this.getTotalReward();
    },
    // 查询历史号码中奖金额统计
    getTotalReward() {
      this.logTotalLoading = true;
      listTotalReward().then((response) => {
        this.logTotalList = this.formatObjectArrayNullProperty(
          response.rows,
          true
        );
        this.logTotalLoading = false;
      });
    },
    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>
