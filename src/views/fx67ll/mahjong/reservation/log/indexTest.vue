<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="预约用户" prop="createBy">
        <el-input v-model="queryParams.createBy" placeholder="请输入预约用户名" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="麻将室" prop="mahjongRoomId">
        <el-input v-model="queryParams.mahjongRoomName" placeholder="请输入预约的麻将室名称" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="联系方式" prop="reservationContact" style="margin-left: 12px">
        <el-input v-model="queryParams.reservationContact" placeholder="请输入预约用户联系方式" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="订单备注" prop="reservationRemark" style="margin-left: 12px">
        <el-input v-model="queryParams.reservationRemark" placeholder="请输入订单备注" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="订单状态" prop="reservationStatus">
        <el-select v-model="queryParams.reservationStatus" placeholder="请选择订单状态" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="dict in dict.type.fx67ll_order_status" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <!-- 订单开始时间范围搜索 -->
      <el-form-item label="订单开始时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeStartTime" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable
          @keyup.enter.native="handleQuery"></el-date-picker>
      </el-form-item>
      <!-- 订单结束时间范围搜索 -->
      <el-form-item label="订单结束时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeEndTime" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable
          @keyup.enter.native="handleQuery"></el-date-picker>
      </el-form-item>
      <!-- <el-form-item label="创建时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item> -->
      <!-- <el-form-item label="更新时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item> -->
      <el-form-item style="margin-left: 12px">
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['mahjong:reservation:log:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['mahjong:reservation:log:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['mahjong:reservation:log:remove']">删除</el-button>
      </el-col>
      <!-- 新增时间轴视图按钮 -->
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-time" size="mini" @click="handleTimelineView"
          v-hasPermi="['mahjong:reservation:log:viewChart']">时间轴视图</el-button>
      </el-col>
      <!-- 导出按钮，无法使用，也不开放商用，后期再说吧 -->
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['mahjong:reservation:log:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="订单编号" align="center" prop="orderId" width="130" /> -->
      <el-table-column label="预约用户" align="center" prop="createBy" />
      <el-table-column label="预约用户备注" align="center" prop="userRemark" />
      <!-- <el-table-column label="麻将室" align="center" prop="mahjongRoomName" width="80" /> -->
      <el-table-column label="预约开始时间" align="center" prop="reservationStartTime" width="160" sortable
        :sort-method="sortStartTime">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.reservationStartTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预约结束时间" align="center" prop="reservationEndTime" width="160" sortable
        :sort-method="sortEndTime">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.reservationEndTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="联系方式" align="center" prop="reservationContact" />
      <el-table-column label="订单状态" align="center" prop="reservationStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fx67ll_order_status" :value="scope.row.reservationStatus" />
        </template>
      </el-table-column>
      <el-table-column label="订单备注" align="center" prop="reservationRemark" />
      <!-- <el-table-column label="订单创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column> -->
      <!-- <el-table-column label="订单更新用户" align="center" prop="updateBy" width="100" /> -->
      <!-- <el-table-column label="订单更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column> -->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['mahjong:reservation:log:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['mahjong:reservation:log:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改麻将室预约记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" append-to-body
      style="top: 130px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID" prop="userId" v-if="nowUserName === 'fx67ll'">
              <el-input v-model="form.userId" placeholder="请输入预约用户ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="麻将室ID" prop="mahjongRoomId" v-if="nowUserName === 'fx67ll'">
              <el-input v-model="form.mahjongRoomId" placeholder="请输入预约的麻将室ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="reservationStartTime">
              <el-date-picker clearable v-model="form.reservationStartTime" type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss" placeholder="请选择预约开始时间" style="width: 270px">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="reservationEndTime">
              <el-date-picker clearable v-model="form.reservationEndTime" type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss" placeholder="请选择预约结束时间" style="width: 270px">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单状态" prop="reservationStatus">
              <el-select v-model="form.reservationStatus" placeholder="请选择订单状态" clearable style="width: 270px">
                <el-option v-for="dict in dict.type.fx67ll_order_status" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" prop="reservationContact">
              <el-input v-model="form.reservationContact" placeholder="请输入预约用户联系方式" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="reservationRemark">
              <el-input v-model="form.reservationRemark" type="textarea" placeholder="请输入预约备注内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 时间轴可视化弹窗 -->
    <el-dialog title="预约时间轴视图" :visible.sync="timelineOpen" :close-on-click-modal="false" width="90%"
      :fullscreen="isFullscreen" append-to-body @closed="handleTimelineClose">
      <div class="timeline-container">
        <!-- 日期选择和时间段筛选 -->
        <div class="timeline-header">
          <div class="date-picker-section">
            <span class="label">选择日期：</span>
            <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" format="yyyy年MM月dd日"
              value-format="yyyy-MM-dd" @change="loadTimelineData" style="width: 200px">
            </el-date-picker>
            <el-select v-model="selectedTimeRange" placeholder="选择时间段" @change="filterTimelineData"
              style="width: 180px; margin-left: 10px">
              <el-option label="全部时间段" value="all"></el-option>
              <el-option label="上午 (10:00-13:00)" value="morning"></el-option>
              <el-option label="下午 (13:00-18:00)" value="afternoon"></el-option>
              <el-option label="晚上 (18:00-23:00)" value="evening"></el-option>
            </el-select>
            <el-button type="primary" icon="el-icon-refresh" size="mini" @click="loadTimelineData"
              style="margin-left: 10px">
              刷新
            </el-button>
            <el-button :icon="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'" size="mini"
              @click="toggleFullscreen" style="margin-left: 10px">
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </el-button>
          </div>
        </div>

        <!-- 时间轴主体 -->
        <div class="timeline-body" v-loading="timelineLoading">
          <!-- 时间刻度 (10:00-23:00) -->
          <div class="time-scale">
            <div class="time-scale-item" v-for="hour in timeScaleHours" :key="hour">
              <div class="hour-label">{{ hour.toString().padStart(2, '0') }}:00</div>
              <div class="hour-line"></div>
            </div>
          </div>

          <!-- 时间轴内容 -->
          <div class="timeline-content" ref="timelineContent">
            <!-- 预约条 -->
            <div v-for="(item, index) in filteredTimelineData" :key="item.mahjongReservationLogId" class="timeline-item"
              :style="getTimelineItemStyle(item, index)" :title="getTimelineItemTooltip(item)"
              @click="highlightItem(item)">
              <div class="timeline-item-content">
                <div class="item-info">
                  <!-- <span class="user-name">{{ item.createBy }}</span> -->
                  <span class="time-range">{{ formatTime(item.reservationStartTime) }} - {{
                    formatTime(item.reservationEndTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息面板 -->
        <div class="detail-panel" v-if="selectedItem">
          <div class="detail-header">
            <h4><i class="el-icon-document"></i> 预约详情</h4>
            <div class="status-indicator" :style="{ backgroundColor: getItemColor(selectedItem) }">
              预约中
            </div>
          </div>
          <div class="detail-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label"><i class="el-icon-user"></i> 预约用户：</span>
                  <span class="detail-value">{{ selectedItem.createBy || '匿名用户' }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label"><i class="el-icon-message"></i> 用户备注：</span>
                  <span class="detail-value">{{ selectedItem.userRemark || '无' }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label"><i class="el-icon-video-play"></i> 开始时间：</span>
                  <span class="detail-value">{{ parseTime(selectedItem.reservationStartTime, '{y}-{m}-{d} {h}:{i}:{s}')
                    }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label"><i class="el-icon-video-pause"></i> 结束时间：</span>
                  <span class="detail-value">{{ parseTime(selectedItem.reservationEndTime, '{y}-{m}-{d} {h}:{i}:{s}')
                    }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label"><i class="el-icon-phone"></i> 联系方式：</span>
                  <span class="detail-value">{{ selectedItem.reservationContact || '未提供' }}</span>
                </div>
              </el-col>
              <el-col :span="24">
                <div class="detail-item">
                  <span class="detail-label"><i class="el-icon-edit-outline"></i> 订单备注：</span>
                  <span class="detail-value">{{ selectedItem.reservationRemark || '无' }}</span>
                </div>
              </el-col>
            </el-row>
            <div class="duration-info">
              <div class="duration-item">
                <span class="duration-label">预约时长：</span>
                <span class="duration-value">{{ calculateDuration(selectedItem) }} 小时</span>
              </div>
            </div>
          </div>
          <div class="detail-footer">
            <el-button type="primary" size="small" icon="el-icon-edit"
              @click="handleTimelineUpdate(selectedItem)">编辑预约</el-button>
            <el-button type="danger" size="small" icon="el-icon-delete"
              @click="handleTimelineDelete(selectedItem)">删除预约</el-button>
            <el-button size="small" icon="el-icon-close" @click="clearHighlight">关闭详情</el-button>
          </div>
        </div>

        <!-- 统计数据 -->
        <div class="statistics-panel" v-if="timelineData.length > 0">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #409EFF;">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">有效预约数</div>
              <div class="stat-value">{{ timelineData.length }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">已预约时间</div>
              <div class="stat-value">{{ calculateTotalHours() }} 小时</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-sunny"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">空闲时间</div>
              <div class="stat-value">{{ calculateFreeHours() }} 小时</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #909399;">
              <i class="el-icon-data-line"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">使用率</div>
              <div class="stat-value">{{ calculateUsageRate() }}%</div>
            </div>
          </div>
        </div>
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
} from "@/api/fx67ll/mahjong/log";
import moment from "moment";

export default {
  name: "mahjongReservationLog",
  dicts: ["fx67ll_order_status"],
  data() {
    return {
      // 时间轴相关数据
      timelineOpen: false,
      timelineLoading: false,
      timelineData: [],
      filteredTimelineData: [],
      selectedDate: moment().format('YYYY-MM-DD'),
      selectedTimeRange: 'all',
      selectedItem: null,
      isFullscreen: false,

      // 时间刻度小时范围 (10:00-23:00)
      timeScaleHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],

      // 颜色数组 - 不同的预约记录用不同颜色，使用鲜艳的颜色
      colorPalette: [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
        '#EF476F', '#FF9A76', '#7BC950', '#6A0572', '#FF9F1C',
        '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653',
        '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4', '#FF99C8',
        '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'
      ],

      // 当前登录用户ID
      nowUserId: this.$store.state.user.nowUserId,
      // 当前登录用户名
      nowUserName: this.$store.state.user.name,
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
      // 麻将室预约记录表格数据
      logList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 订单开始时间范围（数组：[开始时间, 结束时间]）
      daterangeStartTime: [],
      // 订单结束时间范围（数组：[开始时间, 结束时间]）
      daterangeEndTime: [],
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        createBy: null,
        mahjongRoomName: null,
        reservationContact: null,
        reservationStatus: null,
        reservationRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
        beginReservationStartTime: null, // 订单开始时间-起始
        endReservationStartTime: null,   // 订单开始时间-结束
        beginReservationEndTime: null,   // 订单结束时间-起始
        endReservationEndTime: null      // 订单结束时间-结束
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        reservationStartTime: [
          { required: true, message: "预约开始时间不能为空", trigger: "blur" },
        ],
        reservationEndTime: [
          { required: true, message: "预约结束时间不能为空", trigger: "blur" },
        ],
        reservationStatus: [
          { required: true, message: "预约状态不能为空", trigger: "change" },
        ],
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 时间轴相关方法

    /** 打开时间轴视图 */
    handleTimelineView() {
      this.timelineOpen = true;
      this.loadTimelineData();
    },

    /** 加载时间轴数据 */
    async loadTimelineData() {
      this.clearHighlight();
      if (!this.selectedDate) {
        this.$message.warning('请先选择日期');
        return;
      }

      this.timelineLoading = true;
      try {
        // 构建查询参数，查询选定日期的所有预约记录
        const queryParams = {
          pageNum: 1,
          pageSize: 1000, // 获取足够多的数据
          beginReservationStartTime: this.selectedDate + ' 00:00:00',
          endReservationStartTime: this.selectedDate + ' 23:59:59',
          // 或者根据结束时间也在当天
          beginReservationEndTime: this.selectedDate + ' 00:00:00',
          endReservationEndTime: this.selectedDate + ' 23:59:59'
        };

        const response = await listLog(queryParams);
        // 过滤数据：只显示没有取消(状态不等于4)和没有删除的记录
        // 假设delFlag为1表示已删除，这里根据实际情况调整
        this.timelineData = (response.rows || []).filter(item => {
          // 过滤掉已取消的预约(状态为4)
          // 这里假设状态4是已取消，请根据实际字典值调整
          const isNotCancelled = item.reservationStatus != '4';
          // 过滤掉已删除的记录(delFlag不等于1)
          const isNotDeleted = item.delFlag != '1';
          return isNotCancelled && isNotDeleted;
        });
        this.filterTimelineData();
      } catch (error) {
        console.error('加载时间轴数据失败:', error);
        this.$message.error('加载数据失败');
      } finally {
        this.timelineLoading = false;
      }
    },

    /** 过滤时间轴数据 */
    filterTimelineData() {
      if (this.selectedTimeRange === 'all') {
        this.filteredTimelineData = [...this.timelineData];
        return;
      }

      const timeRanges = {
        morning: { start: '10:00', end: '13:00' },
        afternoon: { start: '13:00', end: '18:00' },
        evening: { start: '18:00', end: '23:00' }
      };

      const range = timeRanges[this.selectedTimeRange];
      if (!range) return;

      this.filteredTimelineData = this.timelineData.filter(item => {
        const startTime = moment(item.reservationStartTime).format('HH:mm');
        const endTime = moment(item.reservationEndTime).format('HH:mm');

        // 检查预约是否与选定时间段有重叠
        return this.timeOverlaps(startTime, endTime, range.start, range.end);
      });
    },

    /** 检查时间段是否重叠 */
    timeOverlaps(start1, end1, start2, end2) {
      const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const s1 = timeToMinutes(start1);
      const e1 = timeToMinutes(end1);
      const s2 = timeToMinutes(start2);
      const e2 = timeToMinutes(end2);

      return s1 < e2 && s2 < e1;
    },

    /** 获取时间轴条目的样式 */
    getTimelineItemStyle(item, index) {
      const startTime = moment(item.reservationStartTime);
      const endTime = moment(item.reservationEndTime);

      // 计算开始时间相对于10:00的分钟数
      const startHour = startTime.hours();
      const startMinutes = startTime.hours() * 60 + startTime.minutes();
      const endMinutes = endTime.hours() * 60 + endTime.minutes();

      // 计算时长（分钟）
      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes <= 0) return { display: 'none' };

      // 过滤不在10:00-23:00范围内的时间
      if (startHour < 10 || startHour >= 23) {
        return { display: 'none' };
      }

      // 计算位置和宽度 (时间轴宽度代表13个小时，从10:00到23:00，共780分钟)
      const timelineStartMinutes = 10 * 60; // 10:00
      const timelineTotalMinutes = 13 * 60; // 13小时

      const left = ((startMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100;
      const width = (durationMinutes / timelineTotalMinutes) * 100;

      // 确保位置在可视范围内
      if (left < 0 || left + width > 100) return { display: 'none' };

      // 获取颜色 - 基于索引从调色板中选择颜色
      const backgroundColor = this.getItemColor(item, index);

      return {
        left: `${Math.max(0, left)}%`,
        width: `${Math.min(width, 100 - left)}%`,
        backgroundColor: backgroundColor,
        borderColor: this.darkenColor(backgroundColor, 20),
        zIndex: item === this.selectedItem ? 100 : 10 + index,
        opacity: item === this.selectedItem ? 1 : 0.9
      };
    },

    /** 获取条目的颜色 */
    getItemColor(item, index = 0) {
      // 从调色板中根据索引选择颜色
      const colorIndex = index % this.colorPalette.length;
      return this.colorPalette[colorIndex];
    },

    /** 加深颜色 */
    darkenColor(color, percent) {
      const num = parseInt(color.slice(1), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = (num >> 8 & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;
      return "#" + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
      ).toString(16).slice(1);
    },

    /** 获取时间轴条目的提示文本 */
    getTimelineItemTooltip(item) {
      const startTime = moment(item.reservationStartTime).format('HH:mm');
      const endTime = moment(item.reservationEndTime).format('HH:mm');
      const duration = this.calculateDuration(item);

      return `${item.createBy || '匿名用户'}\n${startTime} - ${endTime} (${duration}小时)\n备注：${item.reservationRemark || '无'}`;
    },

    /** 计算预约时长 */
    calculateDuration(item) {
      const start = moment(item.reservationStartTime);
      const end = moment(item.reservationEndTime);
      const duration = moment.duration(end.diff(start));
      return (duration.asHours()).toFixed(1);
    },

    /** 格式化时间显示 */
    formatTime(time) {
      return moment(time).format('HH:mm');
    },

    /** 高亮选中的条目 */
    highlightItem(item) {
      this.selectedItem = item;
    },

    /** 清除高亮 */
    clearHighlight() {
      this.selectedItem = null;
    },

    /** 切换全屏 */
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },

    /** 计算总预约小时数 (10:00-23:00范围内) */
    calculateTotalHours() {
      let totalMinutes = 0;
      this.timelineData.forEach(item => {
        const start = moment(item.reservationStartTime);
        const end = moment(item.reservationEndTime);

        // 只计算10:00-23:00范围内的重叠时间
        const dayStart = moment(this.selectedDate).set({ hour: 10, minute: 0, second: 0 });
        const dayEnd = moment(this.selectedDate).set({ hour: 23, minute: 0, second: 0 });

        const overlapStart = moment.max(start, dayStart);
        const overlapEnd = moment.min(end, dayEnd);

        if (overlapStart.isBefore(overlapEnd)) {
          totalMinutes += overlapEnd.diff(overlapStart, 'minutes');
        }
      });
      return (totalMinutes / 60).toFixed(1);
    },

    /** 计算空闲小时数 (10:00-23:00范围内) */
    calculateFreeHours() {
      const totalMinutes = 13 * 60; // 10:00-23:00共13小时
      let bookedMinutes = 0;

      // 简化计算：假设所有预约都在同一天且不重叠
      this.timelineData.forEach(item => {
        const start = moment(item.reservationStartTime);
        const end = moment(item.reservationEndTime);

        // 只计算10:00-23:00范围内的重叠时间
        const dayStart = moment(this.selectedDate).set({ hour: 10, minute: 0, second: 0 });
        const dayEnd = moment(this.selectedDate).set({ hour: 23, minute: 0, second: 0 });

        const overlapStart = moment.max(start, dayStart);
        const overlapEnd = moment.min(end, dayEnd);

        if (overlapStart.isBefore(overlapEnd)) {
          bookedMinutes += overlapEnd.diff(overlapStart, 'minutes');
        }
      });

      const freeMinutes = Math.max(0, totalMinutes - bookedMinutes);
      return (freeMinutes / 60).toFixed(1);
    },

    /** 计算使用率 */
    calculateUsageRate() {
      const totalMinutes = 13 * 60; // 10:00-23:00共13小时
      let bookedMinutes = 0;

      this.timelineData.forEach(item => {
        const start = moment(item.reservationStartTime);
        const end = moment(item.reservationEndTime);

        // 只计算10:00-23:00范围内的重叠时间
        const dayStart = moment(this.selectedDate).set({ hour: 10, minute: 0, second: 0 });
        const dayEnd = moment(this.selectedDate).set({ hour: 23, minute: 0, second: 0 });

        const overlapStart = moment.max(start, dayStart);
        const overlapEnd = moment.min(end, dayEnd);

        if (overlapStart.isBefore(overlapEnd)) {
          bookedMinutes += overlapEnd.diff(overlapStart, 'minutes');
        }
      });

      return ((bookedMinutes / totalMinutes) * 100).toFixed(1);
    },

    /** 时间轴弹窗关闭时的处理 */
    handleTimelineClose() {
      this.selectedItem = null;
      this.selectedTimeRange = 'all';
      this.isFullscreen = false;
    },

    /** 从时间轴编辑预约 */
    handleTimelineUpdate(row) {
      this.timelineOpen = false;
      this.handleUpdate(row);
    },

    /** 从时间轴删除预约 */
    handleTimelineDelete(row) {
      this.$modal
        .confirm(
          '是否确认删除预约记录？'
        )
        .then(() => {
          return delLog(row.mahjongReservationLogId);
        })
        .then(() => {
          this.loadTimelineData();
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
    },

    // 预约开始时间排序方法
    sortStartTime(a, b) {
      const timeA = new Date(a.reservationStartTime).getTime();
      const timeB = new Date(b.reservationStartTime).getTime();
      return timeA - timeB;
    },
    // 预约结束时间排序方法
    sortEndTime(a, b) {
      const timeA = new Date(a.reservationEndTime).getTime();
      const timeB = new Date(b.reservationEndTime).getTime();
      return timeA - timeB;
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginReservationStartTime = null;
      this.queryParams.endReservationStartTime = null;
      this.queryParams.beginReservationEndTime = null;
      this.queryParams.endReservationEndTime = null;

      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询麻将室预约记录列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      // 处理订单开始时间范围（若选择了时间，则赋值给查询参数）
      if (this.daterangeStartTime && this.daterangeStartTime.length > 0) {
        this.queryParams.beginReservationStartTime = this.daterangeStartTime[0];
        this.queryParams.endReservationStartTime = this.daterangeStartTime[1];
      }
      // 处理订单结束时间范围（若选择了时间，则赋值给查询参数）
      if (this.daterangeEndTime && this.daterangeEndTime.length > 0) {
        this.queryParams.beginReservationEndTime = this.daterangeEndTime[0];
        this.queryParams.endReservationEndTime = this.daterangeEndTime[1];
      }
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listLog(this.queryParams).then((response) => {
        const rowsTmpList = this.formatObjectArrayNullProperty(response.rows);
        this.logList = rowsTmpList.map(item => {
          const timeStamp = new Date(item.createTime).getTime();
          const rowObjTmp = {
            ...item,
            orderId: timeStamp + (item?.mahjongReservationLogId || 0)
          };
          return rowObjTmp;
        })
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
        mahjongReservationLogId: null,
        userId: null,
        createBy: null,
        mahjongRoomId: null,
        mahjongRoomName: null,
        reservationStartTime: null,
        reservationEndTime: null,
        reservationStatus: null,
        // 预留：费用金额（未来存储实际费用）
        // reservationAmount: null,
        reservationContact: null,
        reservationRemark: null,
        delFlag: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.daterangeStartTime = [];
      this.daterangeEndTime = [];
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.mahjongReservationLogId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加麻将室预约记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const mahjongReservationLogId = row.mahjongReservationLogId || this.ids;
      getLog(mahjongReservationLogId).then((response) => {
        this.form = response.data;
        this.open = true;
        this.title = "修改麻将室预约记录";
      });
    },
    /** 提交按钮 */
    submitForm() {
      const self = this;
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (self.nowUserName !== 'fx67ll') {
            this.form.nowUserId = self.nowUserId;
          }
          if (self.nowUserName !== 'fx67ll') {
            this.form.mahjongRoomId = 1;
          }
          if (this.form.mahjongReservationLogId != null) {
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
      const mahjongReservationLogIds = row.mahjongReservationLogId || this.ids;
      this.$modal
        .confirm(
          '是否确认删除麻将室预约记录编号为"' +
          mahjongReservationLogIds +
          '"的数据项？'
        )
        .then(function () {
          return delLog(mahjongReservationLogIds);
        })
        .then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
    },
    /** 导出按钮操作，无法使用，也不开放商用，后期再说吧 */
    // handleExport() {
    //   this.download(
    //     "mahjong/reservation/log/export",
    //     {
    //       ...this.queryParams,
    //     },
    //     `log_${new Date().getTime()}.xlsx`
    //   );
    // },
  },
};
</script>

<style scoped>
/* 时间轴相关样式 */
.timeline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.timeline-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.date-picker-section {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.date-picker-section .label {
  font-weight: bold;
  margin-right: 10px;
  color: #303133;
}

.timeline-body {
  flex: 1;
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
  min-height: 150px;
}

.time-scale {
  display: flex;
  height: 40px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.time-scale-item {
  flex: 1;
  position: relative;
  text-align: center;
  min-width: 0;
}

.hour-label {
  font-size: 12px;
  color: #909399;
  padding: 5px 0;
  font-weight: 500;
}

.hour-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: #e4e7ed;
}

.timeline-content {
  position: relative;
  height: 120px;
  padding: 10px 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.timeline-item {
  position: absolute;
  height: 50px;
  border-radius: 6px;
  margin: 5px 0;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border-left: 3px solid;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.timeline-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 50;
}

.timeline-item-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  color: white;
  font-size: 12px;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.user-name {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.time-range {
  font-size: 11px;
  opacity: 0.95;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
}

/* 详细信息面板 */
.detail-panel {
  margin-top: 25px;
  padding: 0;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, #409EFF, #66b1ff);
  color: white;
}

.detail-header h4 {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-content {
  padding: 20px;
}

.detail-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #ebeef5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #606266;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}

.detail-value {
  color: #303133;
  font-weight: 500;
}

.duration-info {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9eb;
  border-radius: 6px;
  border: 1px solid #e1f3d8;
}

.duration-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duration-label {
  font-weight: 600;
  color: #67C23A;
}

.duration-value {
  font-size: 18px;
  font-weight: bold;
  color: #67C23A;
}

.detail-footer {
  padding: 16px 20px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 统计面板 */
.statistics-panel {
  margin-top: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
}

.stat-card {
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .stat-card {
    min-width: calc(50% - 20px);
  }
}

@media screen and (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .date-picker-section {
    flex-wrap: wrap;
    gap: 10px;
  }

  .date-picker-section .label {
    width: 100%;
    margin-bottom: 5px;
  }

  .statistics-panel {
    flex-direction: column;
    gap: 15px;
  }

  .stat-card {
    min-width: 100%;
  }

  .timeline-item-content {
    font-size: 10px;
  }

  .timeline-content {
    height: 100px;
  }

  .timeline-item {
    height: 40px;
  }
}

@media screen and (max-width: 480px) {
  .timeline-body {
    min-height: 120px;
  }

  .timeline-content {
    height: 80px;
  }

  .timeline-item {
    height: 35px;
    padding: 4px;
  }

  .user-name {
    font-size: 10px;
  }

  .time-range {
    font-size: 9px;
  }
}

/* 滚动条样式 */
.timeline-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.timeline-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.timeline-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.timeline-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>