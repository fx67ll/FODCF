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
            :value="parseInt(dict.value)" />
        </el-select>
      </el-form-item>
      <el-form-item label="彩票周期" prop="weekType" v-if="isMoreQuery">
        <el-select v-model="queryParams.weekType" placeholder="请选择查询的星期几" clearable>
          <el-option v-for="dict in dict.type.sys_week_type" :key="dict.value" :label="dict.label"
            :value="parseInt(dict.value)" />
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
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery(false)">
          重置
        </el-button>
        <el-button type="warning" icon="el-icon-scissors" size="mini" @click="handleQueryNoRewardInfo"
          v-if="isResetStatus">
          查未开奖
        </el-button>
        <el-button type="info" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
          @click="handleMoreQuery">
          {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['lottery:log:add']">
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['lottery:log:edit']">
          修改
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-magic-stick" size="mini" :disabled="selectedRows.length < 2"
          @click="handleMerge" v-hasPermi="['lottery:log:merge']">
          合并
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['lottery:log:remove']">
          删除
        </el-button>
      </el-col>
      <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['lottery:log:export']">
          导出
        </el-button>
      </el-col> -->
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="primary" plain icon="el-icon-collection-tag" size="mini" @click="handleRecentIssueCodeOpen"
          v-hasPermi="['lottery:log:recentCode']">
          近期号码期号
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="success" plain icon="el-icon-data-line" size="mini" @click="handleLogTotalOpen"
          v-hasPermi="['lottery:log:total']">
          中奖金额统计
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-date" size="mini" @click="handleHistoryStatisticsOpen()"
          v-hasPermi="['lottery:log:statistics']">
          历史号码出现频率统计
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="danger" plain icon="el-icon-trophy" size="mini" @click="handleGenerateNumbersOpen()"
          v-hasPermi="['lottery:log:statistics']">
          历史开奖号码频率组合
        </el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
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
            <el-dropdown-item>
              <el-link href="https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/" target="_blank" type="danger">
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
      <el-table-column label="当日购买号码" align="center" prop="recordNumber" fixed="left" width="170">
        <template slot-scope="scope">
          <span v-if="scope.row.recordNumber === '-'">{{
            scope.row.recordNumber
          }}</span>
          <div v-if="scope.row.recordNumberList.length > 0">
            <div v-for="(num, index) in scope.row.recordNumberList" :key="index" style="line-height: 1.8">
              <template v-if="scope.row.recordNumberHighlightList && scope.row.recordNumberHighlightList[index]">
                <span v-if="scope.row.recordNumberHighlightList[index].type === 'zone'">
                  <span v-for="(n, ni) in scope.row.recordNumberHighlightList[index].front" :key="'rf' + ni"
                    style="margin-right: 3px">
                    <span :style="n.matched ? { color: '#2ecc71', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                      n.value }}</span>
                  </span>
                  <span style="margin-right: 3px">-</span>
                  <span v-for="(n, ni) in scope.row.recordNumberHighlightList[index].back" :key="'rb' + ni"
                    style="margin-right: 3px">
                    <span :style="n.matched ? { color: '#2ecc71', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                      n.value }}</span>
                  </span>
                </span>
                <span v-else>
                  <span v-for="(n, ni) in scope.row.recordNumberHighlightList[index].nums" :key="'rn' + ni"
                    style="margin-right: 3px">
                    <span :style="n.matched ? { color: '#2ecc71', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                      n.value }}</span>
                  </span>
                </span>
              </template>
              <template v-else>
                <span>{{ formatNumDisplay(num) }}</span>
              </template>
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
            <div v-for="(num, index) in scope.row.chaseNumberList" :key="index" style="line-height: 1.8">
              <template v-if="scope.row.chaseNumberHighlightList && scope.row.chaseNumberHighlightList[index]">
                <span v-if="scope.row.chaseNumberHighlightList[index].type === 'zone'">
                  <span v-for="(n, ni) in scope.row.chaseNumberHighlightList[index].front" :key="'cf' + ni"
                    style="margin-right: 3px">
                    <span :style="n.matched ? { color: '#2ecc71', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                      n.value }}</span>
                  </span>
                  <span style="margin-right: 3px">-</span>
                  <span v-for="(n, ni) in scope.row.chaseNumberHighlightList[index].back" :key="'cb' + ni"
                    style="margin-right: 3px">
                    <span :style="n.matched ? { color: '#2ecc71', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                      n.value }}</span>
                  </span>
                </span>
                <span v-else>
                  <span v-for="(n, ni) in scope.row.chaseNumberHighlightList[index].nums" :key="'cn' + ni"
                    style="margin-right: 3px">
                    <span :style="n.matched ? { color: '#2ecc71', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                      n.value }}</span>
                  </span>
                </span>
              </template>
              <template v-else>
                <span>{{ formatNumDisplay(num) }}</span>
              </template>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="当日中奖号码" align="center" prop="winningNumber" width="170">
        <template slot-scope="scope">
          <template
            v-if="scope.row.winningNumberHighlightInfo && scope.row.winningNumber && scope.row.winningNumber !== '-'">
            <span v-if="scope.row.winningNumberHighlightInfo.type === 'zone'">
              <span v-for="(n, ni) in scope.row.winningNumberHighlightInfo.front" :key="'wf' + ni"
                style="margin-right: 3px">
                <span :style="n.matched ? { color: '#ff5a5f', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                  n.value }}</span>
              </span>
              <span style="margin-right: 3px">-</span>
              <span v-for="(n, ni) in scope.row.winningNumberHighlightInfo.back" :key="'wb' + ni"
                style="margin-right: 3px">
                <span :style="n.matched ? { color: '#ff5a5f', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                  n.value }}</span>
              </span>
            </span>
            <span v-else>
              <span v-for="(n, ni) in scope.row.winningNumberHighlightInfo.nums" :key="'wn' + ni"
                style="margin-right: 3px">
                <span :style="n.matched ? { color: '#ff5a5f', fontWeight: 'bold', fontSize: '1.15em' } : {}">{{
                  n.value }}</span>
              </span>
            </span>
          </template>
          <template v-else>
            <span>{{ formatNumDisplay(scope.row.winningNumber) }}</span>
          </template>
        </template>
      </el-table-column>
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
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录创建者" align="center" prop="createBy" fixed="right" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" fixed="right" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
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
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px"
      :style="`top: ${getDialogVerticalOffset(508)}`" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="彩票期号" prop="dateCode">
              <el-input v-model="form.dateCode" placeholder="请输入当日购买号码" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中奖号码" prop="winningNumber">
              <el-input v-model="form.winningNumber" placeholder="请输入当日中奖号码" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="15">
          <el-col :span="24">
            <el-form-item label="购买号码" prop="recordNumber">
              <el-input v-model="form.recordNumber" type="textarea" :rows="3" placeholder="请输入当日购买号码" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="15">
          <el-col :span="12">
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="固定追号" prop="chaseNumber">
              <el-input v-model="form.chaseNumber" placeholder="请输入当日固定追号" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="是否中奖" prop="isWin">
              <el-select v-model="form.isWin" style="width: 100%" placeholder="请选择是否中奖" clearable>
                <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中奖金额" prop="winningPrice" clearable>
              <el-input v-model="form.winningPrice" placeholder="请输入中奖金额" :disabled="form.isWin !== 'Y'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="彩票类型" prop="numberType">
              <el-select v-model="form.numberType" style="width: 100%" placeholder="请选择当日购买的彩票类型"
                @change="handleNumberTypeChange">
                <el-option v-for="dict in dict.type.fx67ll_lottery_type" :key="dict.value" :label="dict.label"
                  :value="parseInt(dict.value)"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="彩票周期" prop="weekType">
              <el-select v-model="form.weekType" style="width: 100%" placeholder="请选择星期几" :disabled="!form.numberType">
                <el-option v-for="dict in dynamicWeekList" :key="dict.value" :label="dict.label"
                  :value="parseInt(dict.value)"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 查看历史号码中奖金额统计的弹窗 -->
    <RecentRewardStatistics :visible.sync="logTotalOpen" />

    <!-- 近期号码期号弹窗 -->
    <RecentDateCode :visible.sync="recentIssueCodeOpen" />

    <!-- 查看历史号码出现频率统计弹窗 -->
    <LotteryHistoryStatistics :visible.sync="historyStatisticsOpen" />

    <!-- 查看历史号码组合弹窗 -->
    <GenerateNumbers :visible.sync="generateNumbersOpen" />
  </div>
</template>

<script>
import {
  listLog,
  getLog,
  delLog,
  addLog,
  updateLog,
  mergeLog,
} from "@/api/fx67ll/lottery/log";

// 中奖查询相关工具
import { queryRewardForApp } from "@/api/fx67ll/lottery/log";
import { checkLotteryResult, validateLotteryString, validateMultiLotteryString, getDialogVerticalOffset } from "@/utils/fx67ll/utils";

import axios from "axios";
import _ from "underscore";

import LotteryHistoryStatistics from "./components/LotteryHistoryStatistics/LotteryHistoryStatistics.vue";
import GenerateNumbers from "./components/GenerateNumbers/GenerateNumbers.vue";
import RecentRewardStatistics from "./components/RecentRewardStatistics/RecentRewardStatistics.vue";
import RecentDateCode from "./components/RecentDateCode/RecentDateCode.vue";

export default {
  name: "LotteryLog",
  components: { LotteryHistoryStatistics, GenerateNumbers, RecentRewardStatistics, RecentDateCode },
  dicts: ["fx67ll_lottery_type", "sys_yes_no", "sys_week_type"],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 选中行的完整对象数组（合并功能需要 dateCode/numberType 做同期号同类型校验）
      selectedRows: [],
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
      // 近期号码期号弹窗显示控制
      recentIssueCodeOpen: false,
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
      // 彩票类型包含的数据
      lotteryTypeList: [1, 2, 3, 4, 5, "1", "2", "3", "4", "5"],
      // 是否是重置后所有搜索条件的状态
      isResetStatus: false,
      // 控制频率统计弹窗显示
      historyStatisticsOpen: false,
      // 控制号码组合弹窗显示
      generateNumbersOpen: false,
    };
  },
  created() {
    // this.getList();
    this.handleQueryNoRewardInfo();
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    /** 格式化号码字符串展示，逗号换空格，横杠前后加空格 */
    formatNumDisplay(numStr) {
      if (!numStr || numStr === "-") return numStr;
      return numStr.replace(/,/g, " ").replace(/-/g, " - ");
    },
    /** 构建号码高亮信息，用于标识匹配中奖号码的数字 */
    buildHighlightInfo(numStr, winningNumber, numberType) {
      const numType = Number(numberType);
      if (numType === 1 || numType === 2) {
        const wParts = winningNumber.split("-");
        const wFront = wParts[0] ? wParts[0].split(",").map((n) => n.trim()) : [];
        const wBack = wParts[1] ? wParts[1].split(",").map((n) => n.trim()) : [];
        const nParts = numStr.split("-");
        const nFront = nParts[0] ? nParts[0].split(",").map((n) => n.trim()) : [];
        const nBack = nParts[1] ? nParts[1].split(",").map((n) => n.trim()) : [];
        return {
          type: "zone",
          front: nFront.map((n) => ({ value: n, matched: wFront.includes(n) })),
          back: nBack.map((n) => ({ value: n, matched: wBack.includes(n) })),
        };
      } else {
        const wNums = winningNumber.split(",").map((n) => n.trim());
        const nNums = numStr.split(",").map((n) => n.trim());
        return {
          type: "positional",
          nums: nNums.map((n, i) => ({ value: n, matched: wNums[i] !== undefined && wNums[i] === n })),
        };
      }
    },
    /** 构建中奖号码高亮信息，将购买号码和固定追号中出现过的数字标红 */
    buildWinningNumberHighlightInfo(winningNumber, recordNumberList, chaseNumberList, numberType) {
      const numType = Number(numberType);
      // 收集所有购买号码和追号中出现的数字（分前区/后区）
      const collectNums = (numStrList) => {
        const frontSet = new Set();
        const backSet = new Set();
        numStrList.forEach((numStr) => {
          if (!numStr || numStr === '-') return;
          if (numType === 1 || numType === 2) {
            const parts = numStr.split('-');
            const front = parts[0] ? parts[0].split(',').map((n) => n.trim()) : [];
            const back = parts[1] ? parts[1].split(',').map((n) => n.trim()) : [];
            front.forEach((n) => frontSet.add(n));
            back.forEach((n) => backSet.add(n));
          }
        });
        return { frontSet, backSet };
      };

      const allLists = [...recordNumberList, ...chaseNumberList].filter(Boolean);

      if (numType === 1 || numType === 2) {
        const { frontSet, backSet } = collectNums(allLists);
        const wParts = winningNumber.split('-');
        const wFront = wParts[0] ? wParts[0].split(',').map((n) => n.trim()) : [];
        const wBack = wParts[1] ? wParts[1].split(',').map((n) => n.trim()) : [];
        return {
          type: 'zone',
          front: wFront.map((n) => ({ value: n, matched: frontSet.has(n) })),
          back: wBack.map((n) => ({ value: n, matched: backSet.has(n) })),
        };
      } else {
        const wNums = winningNumber.split(',').map((n) => n.trim());
        // 按位置匹配：收集每个位置上购买号码和追号中出现过的数字集合
        const positionSets = wNums.map(() => new Set());
        allLists.forEach((numStr) => {
          if (!numStr || numStr === '-') return;
          const nums = numStr.split(',').map((n) => n.trim());
          nums.forEach((n, i) => {
            if (i < positionSets.length) positionSets[i].add(n);
          });
        });
        return {
          type: 'positional',
          nums: wNums.map((n, i) => ({ value: n, matched: positionSets[i].has(n) })),
        };
      }
    },
    // 打开历史号码中奖金额统计弹窗
    handleLogTotalOpen() {
      this.logTotalOpen = true;
    },
    // 打开近期号码期号弹窗
    handleRecentIssueCodeOpen() {
      this.recentIssueCodeOpen = true;
    },
    // 打开历史号码出现频率统计弹窗
    handleHistoryStatisticsOpen(type) {
      this.historyStatisticsOpen = true;
    },
    // 打开历史号码组合弹窗
    handleGenerateNumbersOpen() {
      this.generateNumbersOpen = true;
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
          const hasWinning = item.winningNumber && item.winningNumber !== "-";
          item.recordNumberHighlightList = hasWinning
            ? item.recordNumberList.map((num) =>
              this.buildHighlightInfo(num, item.winningNumber, item.numberType)
            )
            : [];
          item.chaseNumberHighlightList = hasWinning
            ? item.chaseNumberList.map((num) =>
              this.buildHighlightInfo(num, item.winningNumber, item.numberType)
            )
            : [];
          item.winningNumberHighlightInfo = hasWinning
            ? this.buildWinningNumberHighlightInfo(item.winningNumber, item.recordNumberList, item.chaseNumberList, item.numberType)
            : null;
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
      this.resetQuery(true);
      this.isResetStatus = false;
      setTimeout(() => {
        self.queryParams = {
          ...self.queryParams,
          hasDateCode: 'Y',
          hasWinningNumber: 'N',
          pageNum: self.queryParams.pageNum,
          pageSize: self.queryParams.pageSize,
        }
        setTimeout(() => {
          self.getList();
        }, 10);
      }, 23);
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
    resetQuery(noNeedQuery) {
      const self = this;
      this.isResetStatus = true;
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.queryParams = {
        ...self.queryParams,
        pageNum: 1,
        pageSize: 10,
        hasDateCode: null,
        hasWinningNumber: null,
        numberType: null,
        weekType: null,
        dateCode: null,
        recordNumber: null,
        chaseNumber: null,
        winningNumber: null,
        winningPrice: null,
        isWin: null,
        hasMorePurchases: null,
      };
      this.resetForm("queryForm");
      if (!noNeedQuery) {
        this.handleQuery();
      }
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.lotteryId);
      // 保存整行引用，合并功能需读取 dateCode/numberType 做同期号同类型校验
      this.selectedRows = selection;
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    // 根据彩票类型动态修改可配置的追号周期
    handleNumberTypeChange(type) {
      // 强制转换为Number类型，防止字符串类型导致的匹配失败
      const numType = Number(type);
      const enumWeekList = [...this.dict.type.sys_week_type];

      // 清空并重新赋值，确保Vue能检测到数组变化
      this.dynamicWeekList = [];

      if (numType === 1) {
        this.dynamicWeekList = enumWeekList.filter((item) => {
          const val = Number(item?.value);
          return val !== 2 && val !== 4 && val !== 7;
        });
      } else if (numType === 2) {
        this.dynamicWeekList = enumWeekList.filter((item) => {
          const val = Number(item?.value);
          return val !== 1 && val !== 3 && val !== 6;
        });
      } else if (numType === 3 || numType === 4) {
        this.dynamicWeekList = enumWeekList;
      } else if (numType === 5) {
        this.dynamicWeekList = enumWeekList.filter((item) => {
          const val = Number(item?.value);
          return val !== 1 && val !== 3 && val !== 4 && val !== 6;
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
        // 先处理数据，强制转换类型
        const data = response.data;
        const processedData = {
          ...data,
          numberType: data.numberType ? Number(data.numberType) : null,
          weekType: data.weekType ? Number(data.weekType) : null
        };

        // 先赋值表单
        this.form = processedData;
        // 再根据类型动态加载周次选项
        this.handleNumberTypeChange(processedData.numberType);

        this.open = true;
        this.title = "修改每日号码记录";
      });
    },
    /**
 * 校验表单中的号码字段
 * @param {number} checkNumType - 彩票类型
 * @param {string} checkNumStr - 号码字符串
 * @param {string} fieldName - 字段名 ('recordNumber' | 'chaseNumber' | 'winningNumber')
 * @returns {boolean}
 */
    checkFormNumber(checkNumType, checkNumStr, fieldName) {
      const numType = Number(checkNumType);
      const referenceFormat = {
        1: { numType: "大乐透", numStr: "4,7,8,10,23-4,9" },
        2: { numType: "双色球", numStr: "1,4,5,8,10,23-5" },
        3: { numType: "排列三", numStr: "1,2,3" },
        4: { numType: "排列五", numStr: "1,2,3,4,5" },
        5: { numType: "七星彩", numStr: "1,2,3,4,5,6,7" },
      };

      // 1. 空值处理逻辑
      const isEmpty = checkNumStr === null || checkNumStr === undefined || String(checkNumStr).trim() === "";

      // recordNumber 不允许为空
      if (fieldName === 'recordNumber' && isEmpty) {
        this.$modal.msgError("投注记录号码不能为空！");
        return false;
      }

      // chaseNumber 和 winningNumber 允许为空，为空直接通过
      if (isEmpty) {
        return true;
      }

      // 2. 非空时进行格式校验（支持多注 / 分隔）
      const isValid = validateMultiLotteryString(numType, checkNumStr);

      if (!isValid) {
        const baseMsg = `${referenceFormat?.[numType]?.numType}号码格式错误！`;
        const formatTip = `参考单注格式：${referenceFormat?.[numType]?.numStr}，多注请用 / 拼接。`;
        this.$modal.msgError(baseMsg + formatTip);
        return false;
      }

      return true;
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          this.form.winningPrice = this.form.isWin === "Y" ? this.form.winningPrice : 0;

          const nType = Number(this.form.numberType);

          // 传入字段名以区分校验策略
          if (
            !this.checkFormNumber(nType, this.form.recordNumber, 'recordNumber') ||
            !this.checkFormNumber(nType, this.form.chaseNumber, 'chaseNumber') ||
            !this.checkFormNumber(nType, this.form.winningNumber, 'winningNumber')
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
    /** 合并按钮操作：合并同期号、同类型的多条记录为一条，后台事务完成合并+删除旧数据 */
    handleMerge() {
      const rows = this.selectedRows;
      // 前置校验：至少选择两条记录
      if (!rows || rows.length < 2) {
        this.$modal.msgWarning("请至少选择两条记录进行合并！");
        return;
      }
      // 前置校验：单次合并数量上限（与后台 MERGE_MAX_INPUT_COUNT 保持一致）
      if (rows.length > 23) {
        this.$modal.msgWarning("单次最多合并23条记录！");
        return;
      }
      // 前置校验：所有选中记录必须同期号（dateCode）且同类型（numberType）
      const baseDateCode = rows[0].dateCode;
      const baseNumberType = rows[0].numberType;
      const allSame = rows.every(
        (item) =>
          (item.dateCode || "") === (baseDateCode || "") &&
          (item.numberType || "") === (baseNumberType || "")
      );
      if (!allSame) {
        this.$modal.msgWarning("非同期号同类型数据不允许操作！");
        return;
      }
      const lotteryIds = this.ids;
      this.$modal
        .confirm(
          "合并后将新建一条记录并删除合并前的原数据，且无法恢复，请确认是否合并选中的 " +
          rows.length +
          " 条记录？"
        )
        .then(() => {
          // 全屏 loading：合并期间禁用页面交互，防止用户重复点击造成并发请求
          this.$modal.loading("正在合并数据，请稍候...");
          // 后台一个事务完成：合并字段 → 新建记录 → 删除旧记录，避免前端多次异步调用产生脏数据
          return mergeLog(lotteryIds);
        })
        .then(() => {
          this.$modal.closeLoading();
          this.getList();
          this.$modal.msgSuccess("合并成功");
        })
        .catch(() => {
          this.$modal.closeLoading();
        });
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
              Number(record?.numberType),
              record?.lotteryId
            );
          })
          .catch(() => { });
      } else if (record?.dateCode) {
        this.qryRewardQueryConfig(
          record?.dateCode,
          Number(record?.numberType),
          record?.lotteryId
        );
      } else {
        this.$modal.msgWarning("查询失败！请补充完整期号！");
      }
    },
    // 查询外部网站所需要的配置
    // 查询中奖信息（后端代理 mxnzp，凭据不下发前端）
    qryRewardQueryConfig(logDateCode, logNumType, logNumId) {
      const self = this;
      const numType = Number(logNumType);
      if (logDateCode && numType && logNumId) {
        this.qryRewardLoading = true;
        queryRewardForApp(logDateCode, numType)
          .then((res) => {
            const mxnzp = res?.mxnzp;
            const lotteryTypeMap = { 1: "cjdlt", 2: "ssq", 3: "pl3", 4: "pl5", 5: "qxc" };
            if (mxnzp && mxnzp.code === 1) {
              const resData = mxnzp.data || {};
              if (resData?.openCode && [lotteryTypeMap[1], lotteryTypeMap[2]].includes(resData?.code)) {
                self.formatWinningNumber(resData.openCode, numType, logNumId);
              } else if (resData?.openCode && [lotteryTypeMap[3], lotteryTypeMap[4], lotteryTypeMap[5]].includes(resData?.code)) {
                self.saveWinningNumber(resData?.openCode, numType, logNumId);
              } else {
                self.$modal.msgWarning("外部接口异常，请联系管理员！");
                self.qryRewardLoading = false;
              }
            } else if (mxnzp?.code === 10027) {
              self.$modal.msgWarning("暂未开奖，请晚些时候再查询！");
              self.qryRewardLoading = false;
            } else {
              self.$modal.msgWarning(`第三方站点开奖号码查询失败！报错信息：${mxnzp?.msg}`);
              self.qryRewardLoading = false;
            }
          })
          .catch((error) => {
            console.error("查询中奖信息异常：" + (error?.msg || error));
            self.$modal.msgWarning("查询中奖信息查询接口配置项失败！");
            self.qryRewardLoading = false;
          });
      } else {
        self.$modal.msgWarning("缺少必要查询条件，请联系管理员！");
      }
    },
    // ===== 以下为原前端直连 mxnzp 逻辑（已注释保留，方便后期回退） =====
    // qryRewardQueryConfig_old(logDateCode, logNumType, logNumId) {
    //   const self = this;
    //   const numType = Number(logNumType);
    //   if (logDateCode && numType && logNumId) {
    //     this.qryRewardLoading = true;
    //     getCredential("lotteryReward").then((cred) => {
    //       self.queryLotteryRewardInfo(cred.appId, cred.appSecret, logDateCode, numType, logNumId);
    //     }).catch((error) => {
    //       console.error("查询中奖信息查询接口凭据异常：" + (error?.msg || error));
    //       self.$modal.msgWarning("查询中奖信息查询接口配置项失败！");
    //       self.qryRewardLoading = false;
    //     });
    //   } else { self.$modal.msgWarning("缺少必要查询条件，请联系管理员！"); }
    // },
    // // 通过第三方站点查询开奖号码
    // queryLotteryRewardInfo(appId, appSecret, dCode, nType, lid) {
    //   const self = this;
    //   const numType = Number(nType);
    //   const lotteryTypeMap = { 1: "cjdlt", 2: "ssq", 3: "pl3", 4: "pl5", 5: "qxc" };
    //   axios.get("https://www.mxnzp.com/api/lottery/common/aim_lottery", {
    //     params: { app_id: appId, app_secret: appSecret, expect: dCode, code: lotteryTypeMap[numType] },
    //   }).then((res) => {
    //     if (res && res?.data?.code === 1) {
    //       const resData = res?.data?.data || {};
    //       if (resData?.openCode && [lotteryTypeMap[1], lotteryTypeMap[2]].includes(resData?.code)) {
    //         self.formatWinningNumber(resData.openCode, numType, lid);
    //       } else if (resData?.openCode && [lotteryTypeMap[3], lotteryTypeMap[4], lotteryTypeMap[5]].includes(resData?.code)) {
    //         self.saveWinningNumber(resData?.openCode, numType, lid);
    //       } else { self.$modal.msgWarning("外部接口异常，请联系管理员！"); self.qryRewardLoading = false; }
    //     } else if (res?.data?.code === 10027) {
    //       self.$modal.msgWarning("暂未开奖，请晚些时候再查询！"); self.qryRewardLoading = false;
    //     } else {
    //       self.$modal.msgWarning(`第三方站点开奖号码查询失败！报错信息：${res?.data?.msg}`); self.qryRewardLoading = false;
    //     }
    //   }).catch((error) => {
    //     self.qryRewardLoading = false;
    //     self.$modal.msgWarning(`开奖号码查询出现异常，请联系管理员！报错信息：${error}`);
    //   });
    // },
    // 格式化中奖号码，原格式为逗号+加号拼接，转换成我的逗号+横杠来拼接
    formatWinningNumber(winNum, nType, lid) {
      // 确保类型正确
      const numType = Number(nType);

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
      this.saveWinningNumber(resultString, numType, lid);
    },
    // 保存中奖号码
    saveWinningNumber(winNum, nType, lid) {
      const self = this;
      // 确保类型正确
      const numType = Number(nType);

      const saveParams = {
        lotteryId: lid,
        winningNumber: winNum,
      };
      updateLog(saveParams)
        .then((res) => {
          if (res?.code === 200) {
            self.checkIsGetReward(winNum, numType, lid);
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
      // 确保类型正确
      const numType = Number(numTp);

      // 浮动奖金的彩种+等级，弹窗里加备注
      const dynamicPrizeLevels = {
        1: [1, 2],   // 大乐透一、二等奖
        2: [1, 2],   // 双色球一、二等奖
        5: [1, 2],   // 七星彩一、二等奖
      };
      const isDynamic = (type, level) =>
        !!(dynamicPrizeLevels[type] && dynamicPrizeLevels[type].includes(level));

      getLog(logId)
        .then((res) => {
          if (res?.code === 200) {
            if (res?.data) {
              const recordNumStrList = res?.data?.recordNumber?.split("/") || [];
              const chaseNumStrList = res?.data?.chaseNumber?.split("/") || [];

              // 收集每注中奖明细：{ source, num, prizeText, prizeAmount, isDynamic }
              const winDetails = [];

              recordNumStrList.forEach((item) => {
                const resultTmp = checkLotteryResult(numType, item, winNum);
                if (resultTmp?.prizeLevel > 0) {
                  winDetails.push({
                    source: "购买号码",
                    num: item,
                    prizeText: resultTmp.prizeText,
                    prizeAmount: resultTmp.prizeAmount,
                    dynamic: isDynamic(numType, resultTmp.prizeLevel),
                  });
                }
              });
              chaseNumStrList.forEach((item) => {
                const resultTmp = checkLotteryResult(numType, item, winNum);
                if (resultTmp?.prizeLevel > 0) {
                  winDetails.push({
                    source: "固定追号",
                    num: item,
                    prizeText: resultTmp.prizeText,
                    prizeAmount: resultTmp.prizeAmount,
                    dynamic: isDynamic(numType, resultTmp.prizeLevel),
                  });
                }
              });

              const totalRewardCount = winDetails.length;
              const totalRewardPrize = winDetails.reduce((sum, d) => sum + d.prizeAmount, 0);
              const hasDynamic = winDetails.some((d) => d.dynamic);

              if (totalRewardCount > 0) {
                const numTypeText = self.lotteryTypeMap[numType].text || "";
                const detailRows = winDetails
                  .map((d, i) => `
                    <li style="padding:4px 0;border-bottom:1px dashed #eee;">
                      <span style="color:#909399;font-size:12px;">${i + 1}.</span>
                      <span style="color:#2ecc71;font-weight:bold;margin:0 4px;">[${d.source}]</span>
                      <span style="color:#606266;">${self.formatNumDisplay(d.num)}</span>
                      <span style="margin:0 4px;">—</span>
                      <span style="color:#e6a23c;font-weight:bold;">${d.prizeText}</span>
                      <span style="margin-left:6px;color:#ff5a5f;font-weight:bold;">￥${d.prizeAmount}</span>
                      ${d.dynamic ? '<span style="color:#909399;font-size:11px;">（动态）</span>' : ""}
                    </li>`)
                  .join("");
                const dynamicTip = hasDynamic
                  ? `<p style="color:#e6a23c;font-size:12px;margin:6px 0 0;">* 动态奖金为行情参考值，实际以官方公布为准</p>`
                  : "";
                self
                  .$confirm("", "恭喜您中奖了！", {
                    confirmButtonText: "保存",
                    cancelButtonText: "取消",
                    dangerouslyUseHTMLString: true,
                    message: `
                      <div style="font-size:14px;">
                        <p style="margin:0 0 10px;">
                          本期所购
                          <strong style="color:#2ecc71;">${numTypeText}</strong>
                          共
                          <strong style="color:#ff5a5f;font-size:16px;">${totalRewardCount}</strong>
                          注号码中奖
                        </p>
                        <ul style="padding-left:12px;margin:0 0 10px;list-style:none;">${detailRows}</ul>
                        <p style="margin:8px 0 4px;">
                          合计预计奖金
                          <strong style="color:#ff5a5f;font-size:18px;margin-left:4px;">￥${totalRewardPrize}</strong>
                          ${hasDynamic ? '<span style="color:#e6a23c;font-size:12px;">（含动态奖金）</span>' : ""}
                        </p>
                        ${dynamicTip}
                        <p style="margin:10px 0 0;color:#909399;font-size:13px;">是否需要为您记录中奖信息？</p>
                      </div>
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