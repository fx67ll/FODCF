<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="有无期号" prop="hasDateCode">
        <el-select v-model="queryParams.hasDateCode" placeholder="是否记录过彩票期号" clearable>
          <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="有无记录" prop="hasWinningNumber">
        <el-select v-model="queryParams.hasWinningNumber" placeholder="是否记录过中奖号码" clearable>
          <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="彩票类型" prop="numberType">
        <el-select v-model="queryParams.numberType" placeholder="请选择查询的彩票类型" clearable>
          <el-option v-for="dict in dict.type.fx67ll_lottery_type" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="彩票周期" prop="weekType" v-if="isMoreQuery">
        <el-select v-model="queryParams.weekType" placeholder="请选择查询的星期几" clearable>
          <el-option v-for="dict in dict.type.sys_week_type" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建用户" prop="createBy" v-if="isMoreQuery">
        <el-input v-model="queryParams.createBy" placeholder="请输入查询的记录创建者" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新用户" prop="updateBy" v-if="isMoreQuery">
        <el-input v-model="queryParams.updateBy" placeholder="请输入查询的记录更新者" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="更新时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="彩票期号" prop="dateCode" v-if="isMoreQuery">
        <el-input v-model="queryParams.dateCode" placeholder="请输入查询的彩票期号" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="购买号码" prop="recordNumber" v-if="isMoreQuery">
        <el-input v-model="queryParams.recordNumber" placeholder="请输入查询的购买号码" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="固定追号" prop="chaseNumber" v-if="isMoreQuery">
        <el-input v-model="queryParams.chaseNumber" placeholder="请输入查询的固定追号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="中奖号码" prop="winningNumber" v-if="isMoreQuery">
        <el-input v-model="queryParams.winningNumber" placeholder="请输入查询的中奖号码" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="中奖金额" prop="winningPrice" v-if="isMoreQuery">
        <el-input v-model="queryParams.winningPrice" placeholder="请输入查询的中奖金额" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="是否中奖" prop="isWin" v-if="isMoreQuery">
        <el-select v-model="queryParams.isWin" placeholder="请选择是否中奖" clearable>
          <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否追加" prop="hasMorePurchases" v-if="isMoreQuery">
        <el-select v-model="queryParams.hasMorePurchases" placeholder="请选择是否有追加购买" clearable>
          <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="删除标志" prop="delFlag" v-if="isMoreQuery">
        <el-select v-model="queryParams.delFlag" placeholder="请选择删除标志" clearable>
          <el-option
            v-for="dict in dict.type.sys_yes_no"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item> -->
      <!-- <el-form-item label="用户ID" prop="userId" v-if="isMoreQuery">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item> -->
      <el-form-item>
        <el-button type="warning" icon="el-icon-scissors" size="mini" @click="handleQueryNoRewardInfo">
          只查未开奖
        </el-button>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">
          重置
        </el-button>
        <el-button type="info" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
          @click="handleMoreQuery">
          {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['lottery:log:add']">
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['lottery:log:edit']">
          修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['lottery:log:remove']">
          删除
        </el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['lottery:log:export']"
        >
          导出
        </el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button type="info" plain icon="el-icon-data-line" size="mini" @click="handleLogTotalOpen"
          v-hasPermi="['punch:log:total']">
          查看历史号码中奖金额统计
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-dropdown>
          <el-button type="info" plain icon="el-icon-bell" size="mini">
            官方开奖信息查询
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>
              <el-link href="https://m.lottery.gov.cn/mkjdlt/" target="_blank" type="primary">
                大乐透
              </el-link>
            </el-dropdown-item>
            <el-dropdown-item><el-link href="https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/" target="_blank" type="danger">
                双色球
              </el-link>
            </el-dropdown-item>
            <el-dropdown-item>
              <el-link href="https://m.lottery.gov.cn/mkjpls/" target="_blank" type="warning">
                排列三
              </el-link>
            </el-dropdown-item>
            <el-dropdown-item>
              <el-link href="https://m.lottery.gov.cn/mkjplw/" target="_blank" type="success">
                排列五
              </el-link>
            </el-dropdown-item>
            <el-dropdown-item>
              <el-link href="https://m.lottery.gov.cn/mkjqxc/" target="_blank" type="info">
                七星彩
              </el-link>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="号码日志主键" align="center" prop="lotteryId" width="120" /> -->
      <el-table-column label="彩票期号" align="center" prop="dateCode" fixed="left" width="100" />
      <el-table-column label="当日购买号码" align="center" prop="recordNumber" fixed="left" width="160">
        <template slot-scope="scope">
          <span v-if="scope.row.recordNumber === '-'">{{
            scope.row.recordNumber
          }}</span>
          <div v-if="scope.row.recordNumberList.length > 0">
            <div v-for="(num, index) in scope.row.recordNumberList" :key="index">
              <div>{{ num }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="当日固定追号" align="center" prop="chaseNumber" width="160">
        <template slot-scope="scope">
          <span v-if="scope.row.chaseNumber === '-'">{{
            scope.row.chaseNumber
          }}</span>
          <div v-if="scope.row.chaseNumberList.length > 0">
            <div v-for="(num, index) in scope.row.chaseNumberList" :key="index">
              <div>{{ num }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="当日中奖号码" align="center" prop="winningNumber" width="160" />
      <el-table-column label="是否中奖" align="center" prop="isWin" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_yes_no" :value="scope.row.isWin" v-if="scope.row.winningNumber !== '-'" />
          <div v-if="scope.row.winningNumber === '-'"><el-tag type="warning">未开奖</el-tag></div>
        </template>
      </el-table-column>
      <el-table-column label="中奖金额" align="center" prop="winningPrice" width="150">
        <template slot-scope="scope">
          {{ scope.row.winningPrice === "-" ? "" : "￥"
          }}{{ scope.row.winningPrice }}
        </template>
      </el-table-column>
      <el-table-column label="彩票类型" align="center" prop="numberType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fx67ll_lottery_type" :value="scope.row.numberType" />
        </template>
      </el-table-column>
      <el-table-column label="彩票周期" align="center" prop="weekType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_week_type" :value="scope.row.weekType" />
        </template>
      </el-table-column>
      <el-table-column align="center" prop="hasMorePurchases" width="180">
        <!-- eslint-disable-next-line -->
        <template slot="header" slot-scope="scope">
          是否有追加购买行为
          <el-tooltip class="item" :content="hasAppendBuyingTip" placement="top">
            <i class="el-icon-question"></i>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_yes_no" :value="scope.row.hasMorePurchases" />
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="100" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录创建者" align="center" prop="createBy" fixed="right" width="100" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" fixed="right" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="220">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-coordinate" :loading="qryRewardLoading"
            @click="handleQueryRewardDubounce(scope.row)" v-hasPermi="['lottery:log:queryReward']">查询中奖信息</el-button>
          <el-button size="mini" type="text" icon="el-icon-edit" :disabled="qryRewardLoading"
            @click="handleUpdate(scope.row)" v-hasPermi="['lottery:log:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" :disabled="qryRewardLoading"
            @click="handleDelete(scope.row)" v-hasPermi="['lottery:log:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      :page-sizes="[5, 10, 23, 50, 100]" @pagination="getList" />

    <!-- 添加或修改每日号码记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" style="top: 40px"
      append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="彩票期号" prop="dateCode">
          <el-input v-model="form.dateCode" placeholder="请输入当日购买号码" clearable />
        </el-form-item>
        <el-form-item label="购买号码" prop="recordNumber">
          <el-input v-model="form.recordNumber" placeholder="请输入当日购买号码" clearable />
        </el-form-item>
        <el-form-item label="固定追号" prop="chaseNumber">
          <el-input v-model="form.chaseNumber" placeholder="请输入当日固定追号" clearable />
        </el-form-item>
        <el-form-item label="中奖号码" prop="winningNumber">
          <el-input v-model="form.winningNumber" placeholder="请输入当日中奖号码" clearable />
        </el-form-item>
        <el-form-item label="是否中奖" prop="isWin">
          <el-select v-model="form.isWin" style="width: 100%" placeholder="请选择是否中奖" clearable>
            <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="中奖金额" prop="winningPrice" clearable v-if="form.isWin === 'Y'">
          <el-input v-model="form.winningPrice" placeholder="请输入中奖金额" />
        </el-form-item>
        <el-form-item label="彩票类型" prop="numberType">
          <el-select v-model="form.numberType" style="width: 100%" placeholder="请选择当日购买的彩票类型"
            @change="handleNumberTypeChange">
            <el-option v-for="dict in dict.type.fx67ll_lottery_type" :key="dict.value" :label="dict.label"
              :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="彩票周期" prop="weekType" v-if="form.numberType">
          <el-select v-model="form.weekType" style="width: 100%" placeholder="请选择星期几">
            <el-option v-for="dict in dynamicWeekList" :key="dict.value" :label="dict.label"
              :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="是否有追加" prop="hasMorePurchases">
          <el-select v-model="form.hasMorePurchases" style="width: calc(100% - 22px); margin-right: 8px"
            placeholder="请选择是否有追加购买">
            <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
          <el-tooltip class="item" :content="hasAppendBuyingTip" placement="top-end">
            <i class="el-icon-question"></i>
          </el-tooltip>
        </el-form-item>
        <!-- <el-form-item label="删除标志" prop="delFlag">
          <el-select
            v-model="form.delFlag"
            style="width: 100%"
            placeholder="请选择删除标志"
          >
            <el-option
              v-for="dict in dict.type.sys_yes_no"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 查看历史号码中奖金额统计的弹窗 -->
    <el-dialog title="历史号码中奖金额统计" :visible.sync="logTotalOpen" :close-on-click-modal="false" width="800px"
      style="top: 130px" append-to-body>
      <div id="logTotalContainer">
        <el-table v-loading="logTotalLoading" :data="logTotalList">
          <el-table-column label="统计类型" align="center" prop="lotteryType" />
          <!-- <el-table-column
            label="总购买期数 / 注数"
            width="150"
            align="center"
            prop="totalTickets"
          >
            <template slot-scope="scope">
              <span>{{ `${scope.row.totalTickets} / ${scope.row.totalNumbers}` }}</span>
            </template>
          </el-table-column> -->
          <!-- <el-table-column label="总购买期数" align="center" prop="totalTickets">
            <template slot-scope="scope">
              <span style="color: #909399">{{ scope.row.totalTickets }}</span>
            </template>
          </el-table-column> -->
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
        <el-button @click="handleLogTotalClose">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listLog,
  getLog,
  delLog,
  addLog,
  updateLog,
  listTotalReward,
} from "@/api/fx67ll/lottery/log";

// 中奖查询相关工具
import { getSecretConfig } from "@/api/fx67ll/secret/key";
import {
  decryptString,
  checkLotteryResult,
  validateLotteryString,
} from "@/utils/fx67ll/utils";
import { getCryptoSaltKey } from "@@/neverUploadToGithub";

import axios from "axios";
import _ from "underscore";

export default {
  name: "Log",
  dicts: ["fx67ll_lottery_type", "sys_yes_no", "sys_week_type"],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 每日号码记录表格数据
      logList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        hasDateCode: null,
        hasWinningNumber: null,
        numberType: null,
        weekType: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        dateCode: null,
        recordNumber: null,
        chaseNumber: null,
        winningNumber: null,
        winningPrice: null,
        isWin: null,
        hasMorePurchases: null,
        delFlag: null,
        userId: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        recordNumber: [
          { required: true, message: "当日购买号码不能为空", trigger: "blur" },
        ],
        numberType: [
          {
            required: true,
            message: "当日购买的彩票类型不能为空",
            trigger: "change",
          },
        ],
        weekType: [
          { required: true, message: "星期几不能为空", trigger: "change" },
        ],
        hasMorePurchases: [
          {
            required: true,
            message: "是否有追加购买不能为空",
            trigger: "change",
          },
        ],
      },
      // 是否有追加购买的提示
      hasAppendBuyingTip:
        "当日第一次购买之后是否有追加购买的行为，包括同一个号码的追加，或者另外购买其他的号码",
      // 顶部表格查询的周期下拉
      dynamicWeekList: [],
      // 历史号码中奖金额统计相关参数
      logTotalOpen: false,
      logTotalList: [],
      logTotalLoading: false,
      // 中奖信息查询加载
      qryRewardLoading: false,
      // 彩票类型枚举（后期改为后台枚举接口获取）
      lotteryTypeMap: {
        1: {
          text: "大乐透",
          type: 1,
          winImg: "https://test.fx67ll.com/fx67ll-img-collection/luffy.jpg",
          ggImg: "https://test.fx67ll.com/fx67ll-img-collection/kuzan.jpg",
        },
        2: {
          text: "双色球",
          type: 2,
          winImg: "https://test.fx67ll.com/fx67ll-img-collection/luffy.jpg",
          ggImg: "https://test.fx67ll.com/fx67ll-img-collection/kuzan.jpg",
        },
        3: {
          text: "排列三",
          type: 3,
          winImg: "https://test.fx67ll.com/fx67ll-img-collection/luffy.jpg",
          ggImg: "https://test.fx67ll.com/fx67ll-img-collection/kuzan.jpg",
        },
        4: {
          text: "排列五",
          type: 4,
          winImg: "https://test.fx67ll.com/fx67ll-img-collection/luffy.jpg",
          ggImg: "https://test.fx67ll.com/fx67ll-img-collection/kuzan.jpg",
        },
        5: {
          text: "七星彩",
          type: 5,
          winImg: "https://test.fx67ll.com/fx67ll-img-collection/luffy.jpg",
          ggImg: "https://test.fx67ll.com/fx67ll-img-collection/kuzan.jpg",
        },
      },
      lotteryTypeList: [1, 2, 3, 4, 5, "1", "2", "3", "4", "5"],
    };
  },
  created() {
    // this.getList();
    this.handleQueryNoRewardInfo();
  },
  methods: {
    // 查询历史号码中奖金额统计
    getTotalReward() {
      const self = this;
      self.logTotalLoading = true;
      listTotalReward().then((response) => {
        self.logTotalList = self.formatObjectArrayNullProperty(
          response.rows,
          true
        );
        self.logTotalLoading = false;
      });
    },
    // 打开历史号码中奖金额统计弹窗
    handleLogTotalOpen() {
      this.getTotalReward();
      this.logTotalOpen = true;
    },
    // 关闭历史号码中奖金额统计弹窗
    handleLogTotalClose() {
      this.logTotalOpen = false;
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询每日号码记录列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listLog(this.queryParams).then((response) => {
        const logRows = response.rows.map((item) => {
          item.recordNumberList = item?.recordNumber
            ? item.recordNumber?.split("/")
            : [];
          item.chaseNumberList = item?.chaseNumber
            ? item.chaseNumber?.split("/")
            : [];
          return item;
        });
        this.logList = this.formatObjectArrayNullProperty(logRows);
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        lotteryId: null,
        dateCode: null,
        recordNumber: null,
        chaseNumber: null,
        winningNumber: null,
        isWin: null,
        winningPrice: null,
        numberType: null,
        weekType: null,
        hasMorePurchases: null,
        delFlag: null,
        userId: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      };
      this.resetForm("form");
    },
    /** 只查未开奖按钮操作 */
    handleQueryNoRewardInfo() {
      const self = this;
      this.reset();
      setTimeout(() => {
        self.queryParams = {
          hasDateCode: 'Y',
          hasWinningNumber: 'N',
          pageNum: self.queryParams.pageNum,
          pageSize: self.queryParams.pageSize,
        }
        self.getList();
      }, 1);
    },
    /** 高级搜索按钮操作 */
    handleMoreQuery() {
      this.isMoreQuery = !this.isMoreQuery;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.lotteryId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    // 根据彩票类型动态修改可配置的追号周期
    handleNumberTypeChange(type) {
      const enumWeekList = [...this.dict.type.sys_week_type];
      if (type?.toString() === "1") {
        this.dynamicWeekList = enumWeekList.filter((item) => {
          const val = item?.value?.toString();
          return val !== "2" && val !== "4" && val !== "7";
        });
      }
      if (type?.toString() === "2") {
        this.dynamicWeekList = enumWeekList.filter((item) => {
          const val = item?.value?.toString();
          return val !== "1" && val !== "3" && val !== "6";
        });
      }
      if (["3", "4"].includes(type?.toString())) {
        this.dynamicWeekList = enumWeekList;
      }
      if (type?.toString() === "5") {
        this.dynamicWeekList = enumWeekList.filter((item) => {
          const val = item?.value?.toString();
          return val !== "1" && val !== "3" && val !== "4" && val !== "6";
        });
      }
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加每日号码记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const lotteryId = row.lotteryId || this.ids;
      getLog(lotteryId).then((response) => {
        this.handleNumberTypeChange(response?.data?.numberType);
        this.form = response.data;
        this.open = true;
        this.title = "修改每日号码记录";
      });
    },
    /** 校验不同类型号码的字符串格式 */
    checkFormNumber(checkNumType, checkNumStr) {
      const referenceFormat = {
        1: {
          numType: "大乐透",
          numStr: "4,7,8,10,23-4,9",
        },
        2: {
          numType: "双色球",
          numStr: "1,4,5,8,10,23-5",
        },
        3: {
          numType: "排列三",
          numStr: "1,2,3",
        },
        4: {
          numType: "排列五",
          numStr: "1,2,3,4,5",
        },
        5: {
          numType: "七星彩",
          numStr: "1,2,3,4,5,6,7",
        },
      };
      if (checkNumStr) {
        const checkRecord = validateLotteryString(checkNumType, checkNumStr);
        if (!checkRecord) {
          this.$modal.msgError(
            `${referenceFormat?.[checkNumType]?.numType}号码格式错误！参考格式：${referenceFormat?.[checkNumType]?.numStr}`
          );
          return false;
        }
        return true;
      }
      return true;
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          this.form.winningPrice =
            this.form.isWin === "Y" ? this.form.winningPrice : 0;

          const nType = this.form.numberType;
          if (
            !(
              this.checkFormNumber(nType, this.form.recordNumber) &&
              this.checkFormNumber(nType, this.form.chaseNumber) &&
              this.checkFormNumber(nType, this.form.winningNumber)
            )
          ) {
            return;
          }

          if (this.form.lotteryId != null) {
            updateLog(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addLog(this.form).then((response) => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const lotteryIds = row.lotteryId || this.ids;
      this.$modal
        .confirm("删除后数据无法恢复，请确认是否删除该数据项？")
        .then(function () {
          return delLog(lotteryIds);
        })
        .then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download(
        "lottery/log/export",
        {
          ...this.queryParams,
        },
        `log_${new Date().getTime()}.xlsx`
      );
    },
    /** 查询中奖信息 */
    handleQueryRewardDubounce: _.debounce(function (row) {
      this.checkRecordData(row);
    }, 233),
    // 查询中奖信息前确认是否有彩票期号
    checkRecordData(record) {
      const self = this;
      if (!self.lotteryTypeList.includes(record?.numberType)) {
        this.$modal.msgError("数据异常，请联系管理员！");
        return;
      }
      if (record?.winningNumber && record?.winningNumber !== "-") {
        self
          .$confirm("您已查询过开奖信息，是否需要再次查询", "提示", {
            confirmButtonText: "确认",
            cancelButtonText: "取消",
            type: "warning",
          })
          .then(() => {
            self.qryRewardQueryConfig(
              record?.dateCode,
              record?.numberType,
              record?.lotteryId
            );
          })
          .catch(() => { });
      } else if (record?.dateCode) {
        this.qryRewardQueryConfig(
          record?.dateCode,
          record?.numberType,
          record?.lotteryId
        );
      } else {
        this.$modal.msgWarning("查询失败！请补充完整期号！");
      }
    },
    // 查询外部网站所需要的配置
    qryRewardQueryConfig(logDateCode, logNumType, logNumId) {
      const self = this;
      if (logDateCode && logNumType && logNumId) {
        this.qryRewardLoading = true;
        getSecretConfig({ secretKey: "qryLotteryRewardAppId" })
          .then((res) => {
            if (res && res?.rows && res?.rows.length > 0 && res?.code === 200) {
              const qryLotteryRewardAppId = decryptString(
                res.rows[0].secretValue,
                getCryptoSaltKey()
              );
              getSecretConfig({ secretKey: "qryLotteryRewardAppSecret" })
                .then((res) => {
                  if (
                    res &&
                    res?.rows &&
                    res?.rows.length > 0 &&
                    res?.code === 200
                  ) {
                    const qryLotteryRewardAppSecret = decryptString(
                      res.rows[0].secretValue,
                      getCryptoSaltKey()
                    );
                    self.queryLotteryRewardInfo(
                      qryLotteryRewardAppId,
                      qryLotteryRewardAppSecret,
                      logDateCode,
                      logNumType,
                      logNumId
                    );
                  } else {
                    self.$modal.msgWarning(
                      "查询中奖信息查询接口配置项AppSecret失败！"
                    );
                  }
                })
                .catch((error) => {
                  console.error(
                    "查询中奖信息查询接口配置项AppSecret异常：" + error
                  );
                  self.qryRewardLoading = false;
                });
            } else {
              self.$modal.msgWarning("查询中奖信息查询接口配置项AppId失败！");
            }
          })
          .catch((error) => {
            console.error("查询中奖信息查询接口配置项AppId异常：" + error);
            self.qryRewardLoading = false;
          });
      } else {
        self.$modal.msgWarning("缺少必要查询条件，请联系管理员！");
      }
    },
    // 通过第三方站点查询开奖号码
    queryLotteryRewardInfo(appId, appSecret, dCode, nType, lid) {
      const self = this;
      const lotteryTypeMap = {
        1: "cjdlt",
        2: "ssq",
        3: "pl3",
        4: "pl5",
        5: "qxc",
      };
      axios
        .get("https://www.mxnzp.com/api/lottery/common/aim_lottery", {
          params: {
            app_id: appId,
            app_secret: appSecret,
            expect: dCode,
            code: lotteryTypeMap[nType],
          },
        })
        .then((res) => {
          // 外部接口返回示例
          // const egObj = {
          //   openCode: "05,26,33,35,15+09+01",
          //   code: "cjdlt",
          //   expect: "2024032",
          //   name: "超级大乐透",
          //   time: "2024-03-23 21:26:16",
          // };
          if (res && res?.data?.code === 1) {
            const resData = res?.data?.data || {};
            if (
              resData?.openCode &&
              [lotteryTypeMap[1], lotteryTypeMap[2]].includes(resData?.code)
            ) {
              self.formatWinningNumber(resData.openCode, nType, lid);
            } else if (
              resData?.openCode &&
              [
                lotteryTypeMap[3],
                lotteryTypeMap[4],
                lotteryTypeMap[5],
              ].includes(resData?.code)
            ) {
              self.saveWinningNumber(resData?.openCode, nType, lid);
            } else {
              self.$modal.msgWarning("外部接口异常，请联系管理员！");
              self.qryRewardLoading = false;
            }
          } else if (res?.data?.code === 10027) {
            self.$modal.msgWarning("暂未开奖，请晚些时候再查询！");
            self.qryRewardLoading = false;
          } else {
            self.$modal.msgWarning(
              `第三方站点开奖号码查询失败！报错信息：${res?.data?.msg}`
            );
            self.qryRewardLoading = false;
          }
        })
        .catch((error) => {
          self.qryRewardLoading = false;
          self.$modal.msgWarning(
            `开奖号码查询出现异常，请联系管理员！报错信息：${error}`
          );
        });
    },
    // 格式化中奖号码，原格式为逗号+加号拼接，转换成我的逗号+横杠来拼接
    formatWinningNumber(winNum, nType, lid) {
      // 将第一个匹配的加号替换为减号，第二个匹配的加号替换为逗号
      const originalString = winNum.replace(/\+/, "-").replace(/\+/, ",");
      // 以 - 分割字符串为两部分
      const splitByDash = originalString.split("-");
      // 以逗号分割第一个数组并从小到大排序
      const firstArray = splitByDash[0]
        .split(",")
        .map(Number)
        .sort((a, b) => a - b);
      // 以逗号分割第二个数组并从小到大排序
      const secondArray = splitByDash[1]
        .split(",")
        .map(Number)
        .sort((a, b) => a - b);
      // 将两个数组分别通过逗号组合成新的字符串
      const firstString = firstArray.join(",");
      const secondString = secondArray.join(",");
      // 将两个字符串通过-连接
      const resultString = firstString + "-" + secondString;
      // 保存结果字符串
      this.saveWinningNumber(resultString, nType, lid);
    },
    // 保存中奖号码
    saveWinningNumber(winNum, nType, lid) {
      const self = this;
      const saveParams = {
        lotteryId: lid,
        winningNumber: winNum,
      };
      updateLog(saveParams)
        .then((res) => {
          if (res?.code === 200) {
            self.checkIsGetReward(winNum, nType, lid);
          } else {
            self.$modal.msgWarning("开奖号码保存失败！");
          }
        })
        .finally(() => {
          self.qryRewardLoading = false;
        });
    },
    // 查询号码详情并检查是否中奖
    checkIsGetReward(winNum, numTp, logId) {
      const self = this;
      getLog(logId)
        .then((res) => {
          if (res?.code === 200) {
            if (res?.data) {
              const recordNumStrList =
                res?.data?.recordNumber?.split("/") || [];
              const chaseNumStrList = res?.data?.chaseNumber?.split("/") || [];
              let totalRewardCount = 0;
              let totalRewardPrize = 0;
              recordNumStrList.forEach((item) => {
                const resultTmp = checkLotteryResult(numTp, item, winNum);
                if (resultTmp?.prizeLevel > 0) {
                  totalRewardCount = totalRewardCount + 1;
                  totalRewardPrize = totalRewardPrize + resultTmp?.prizeAmount;
                }
              });
              chaseNumStrList.forEach((item) => {
                const resultTmp = checkLotteryResult(numTp, item, winNum);
                if (resultTmp?.prizeLevel > 0) {
                  totalRewardCount = totalRewardCount + 1;
                  totalRewardPrize = totalRewardPrize + resultTmp?.prizeAmount;
                }
              });
              if (totalRewardCount > 0) {
                const numTypeText = self.lotteryTypeMap[numTp].text || "";
                self
                  .$confirm("", "恭喜您中奖了！", {
                    confirmButtonText: "保存",
                    cancelButtonText: "取消",
                    // type: "success",
                    dangerouslyUseHTMLString: true, // 允许使用 HTML 字符串
                    message: `
                                <p>本期所购 <strong>${numTypeText}</strong> 中共计 <strong>${totalRewardCount}</strong> 注号码中奖</p>
                                <p>初步预计奖金 <strong>￥${totalRewardPrize}</strong></p>
                                <p>是否需要为您记录中奖信息？</p>
                              `,
                  })
                  .then(() => {
                    self.saveRewardInfo(logId, "Y", totalRewardPrize);
                  })
                  .catch(() => {
                    self.getList();
                  });
              } else {
                self.$modal.alertSuccess("开奖号码保存成功！本期未中奖！");
                self.getList();
              }
            } else {
              self.$modal.msgError(
                "开奖号码保存成功，但是未查询到本期购买记录！请联系管理员！"
              );
              self.getList();
            }
          } else {
            self.$modal.msgError(
              "开奖号码保存成功，但是未查询到本期购买记录！请联系管理员！"
            );
            self.getList();
          }
        })
        .catch((error) => {
          console.error("查询历史号码详情接口异常：" + error);
          self.getList();
        });
    },
    // 保存中奖信息
    saveRewardInfo(lotteryId, isWin, winningPrice) {
      const self = this;
      const saveParams = {
        lotteryId,
        isWin,
        winningPrice,
      };
      updateLog(saveParams).then((res) => {
        if (res?.code === 200) {
          self.$modal.msgSuccess("中奖信息保存成功！");
          self.getList();
        } else {
          self.$modal.msgWarning("中奖信息保存失败！");
        }
      });
    },
  },
};
</script>
