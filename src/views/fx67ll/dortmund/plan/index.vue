<template>
  <div class="app-container">
    <!-- 场景切换：总览列表 / 编写 / 回顾 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
          label-width="84px">
          <el-form-item label="方案计划正文" prop="planContent">
            <el-input v-model="queryParams.planContent" placeholder="请输入方案计划正文关键字" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="关联比赛" prop="matchId">
            <common-enhanced-select ref="matchSelect" v-model="queryParams.matchId" valueKey="matchId"
              labelKey="matchName" :api-func="listMatch" :query-params="{ matchStatus: '0' }" placeholder="请选择关联比赛"
              :enter-callback="handleQuery" />
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
              type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable></el-date-picker>
          </el-form-item>
          <el-form-item label="更新时间" v-if="isMoreQuery">
            <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd"
              type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            <el-button type="info" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
              @click="handleMoreQuery">
              {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
            </el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
              v-hasPermi="['dortmund:plan:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:plan:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
              v-hasPermi="['dortmund:plan:remove']">删除</el-button>
          </el-col>
          <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:plan:export']">导出</el-button>
          </el-col> -->
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="planList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="方案计划正文" align="center" prop="planContent" min-width="260" fixed="left"
            :show-overflow-tooltip="true" />
          <el-table-column label="录入倍率" align="center" prop="planRate" width="90">
            <template slot-scope="scope">
              <span>{{ scope.row.planRate || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="录入金额" align="center" prop="planAmount" width="100">
            <template slot-scope="scope">
              <span>{{ scope.row.planAmount || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="关联比赛" align="center" prop="matchSummary" min-width="260"
            :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <span>{{ formatMatchSummary(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="图片张数" align="center" prop="planImageObjectKeys" width="80"
            v-if="hasImageQueryPermission">
            <template slot-scope="scope">
              <span>{{ (scope.row.planImageObjectKeys || []).length }}</span>
            </template>
          </el-table-column>
          <el-table-column label="其他说明" align="center" prop="planRemark" width="180" :show-overflow-tooltip="true" />
          <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
          <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="180">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-view" @click="handleReview(scope.row)"
                v-hasPermi="['dortmund:plan:query']">回顾</el-button>
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
                v-hasPermi="['dortmund:plan:edit']">修改</el-button>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
                v-hasPermi="['dortmund:plan:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />
      </div>

      <!-- 编写场景：创建/修改共用整页 -->
      <div key="edit" v-else-if="pageScene === 'edit'" class="plan-edit-scene">
        <div class="plan-edit-header">
          <div class="plan-edit-header-left">
            <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
            <span class="plan-edit-title">{{ editMode === "add" ? "编写方案计划" : "修改方案计划" }}</span>
          </div>
        </div>

        <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="90px" class="plan-edit-form"
          v-loading="editLoading">
          <!-- 上方：类型、正文、倍率、金额和说明 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="方案计划正文" prop="planContent">
                <el-input v-model="editForm.planContent" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                  placeholder="请输入方案计划正文" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="录入倍率" prop="planRate">
                <el-input v-model="editForm.planRate" placeholder="请输入录入倍率（可空，有值时必须大于0）" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="录入金额" prop="planAmount">
                <el-input v-model="editForm.planAmount" placeholder="请输入录入金额（可空，有值时必须大于等于0）" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="其他说明" prop="planRemark">
                <el-input v-model="editForm.planRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                  placeholder="请输入其他说明" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 中间：已有比赛多选 + 旁边滑出「当场新建比赛」 -->
          <div class="plan-edit-section">
            <div class="plan-edit-section-header">
              <span class="plan-edit-section-title">关联比赛（至少一场）</span>
              <el-button type="text" icon="el-icon-circle-plus-outline" v-if="hasPlanAddPermission"
                @click="toggleNewMatchPanel">
                {{ newMatchVisible ? "收起当场新建" : "当场新建比赛" }}
              </el-button>
            </div>

            <el-form-item label="已有比赛" prop="matchIds" label-width="90px">
              <common-enhanced-select ref="editMatchSelect" v-model="editForm.matchIds" valueKey="matchId"
                labelKey="matchName" :api-func="listMatch" :query-params="{ matchStatus: '0' }" multiple
                placeholder="请选择已有正常比赛（可多选）" @change="handleMatchIdsChange" />
            </el-form-item>
            <div class="plan-edit-tip">
              已关联、后来被关闭的比赛保持只读展示，不能再新选已关闭比赛
            </div>
            <!-- 已关联但后来被关闭的比赛：只读展示 -->
            <div class="plan-closed-match-list" v-if="closedMatchList.length > 0">
              <el-tag v-for="match in closedMatchList" :key="match.matchId" size="small" type="info"
                style="margin-right: 4px; margin-bottom: 4px;">
                {{ formatMatchLabel(match) }}（已关闭）
              </el-tag>
            </div>

            <!-- 当场新建比赛滑出面板（同页面板，只能选已有赛季和球队，与方案计划同一事务） -->
            <transition name="slide-panel">
              <div class="plan-new-match-panel" v-if="newMatchVisible">
                <div class="plan-new-match-panel-title">
                  <i class="el-icon-collection-tag"></i>
                  <span>当场新建比赛（只能选择已有赛季和球队，资料状态必须为正常，与方案计划同一事务保存）</span>
                </div>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="所属赛季" prop="newMatch.seasonId" label-width="90px">
                      <common-enhanced-select ref="newMatchSeasonSelect" v-model="editForm.newMatch.seasonId"
                        valueKey="seasonId" labelKey="seasonName" :api-func="listSeason" placeholder="请选择已有赛季" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="主队名称" prop="newMatch.homeTeamId" label-width="90px">
                      <common-enhanced-select ref="newMatchHomeTeamSelect" v-model="editForm.newMatch.homeTeamId"
                        valueKey="teamId" labelKey="teamName" :api-func="listTeam" placeholder="请选择已有主队" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="客队名称" prop="newMatch.awayTeamId" label-width="90px">
                      <common-enhanced-select ref="newMatchAwayTeamSelect" v-model="editForm.newMatch.awayTeamId"
                        valueKey="teamId" labelKey="teamName" :api-func="listTeam" placeholder="请选择已有客队" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="比赛时间" prop="newMatch.matchTime" label-width="90px">
                      <el-date-picker clearable v-model="editForm.newMatch.matchTime" type="datetime"
                        value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择比赛时间">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="比赛场地" label-width="90px">
                      <el-select v-model="editForm.newMatch.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地"
                        clearable filterable allow-create default-first-option>
                        <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label"
                          :value="item.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="比赛备注" label-width="90px">
                      <el-input v-model="editForm.newMatch.matchRemark" placeholder="请输入比赛备注内容" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="plan-edit-tip">
                  没有可选的赛季或球队时，请前往赛季页或球队页先创建；赛果仍只能在比赛页补填
                </div>
                <div class="plan-new-match-actions">
                  <el-button type="success" plain icon="el-icon-plus" size="mini" :disabled="!isNewMatchFilled"
                    @click="handleAddNewMatch">加入本场</el-button>
                </div>
                <!-- 已加入的当场新建比赛 -->
                <div class="plan-closed-match-list" v-if="newMatchList.length > 0">
                  <el-tag v-for="(match, index) in newMatchList" :key="'new' + index" size="small" type="success"
                    closable style="margin-right: 4px; margin-bottom: 4px;" @close="handleRemoveNewMatch(index)">
                    {{ formatNewMatchLabel(match) }}
                  </el-tag>
                </div>
              </div>
            </transition>
          </div>

          <!-- 下方：图片区（仅指定用户渲染） -->
          <div class="plan-edit-section" v-if="hasImageUploadPermission">
            <div class="plan-edit-section-header">
              <span class="plan-edit-section-title">方案计划图片（可选，最多两张）</span>
            </div>
            <plan-image-upload v-model="editForm.planImageObjectKeys" />
          </div>
        </el-form>

        <div class="plan-edit-footer">
          <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
          <el-button @click="handleBackToList">返回总览</el-button>
        </div>
      </div>

      <!-- 回顾场景：整页只读 -->
      <div key="review" v-else class="plan-review-scene">
        <div class="plan-edit-header">
          <div class="plan-edit-header-left">
            <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
            <span class="plan-edit-title">方案计划回顾</span>
          </div>
        </div>

        <div class="plan-review-body" v-loading="reviewLoading">
          <!-- 完整正文与摘要信息 -->
          <div class="plan-review-card">
            <div class="plan-review-info-row">
              <div class="plan-review-info-item">
                <span class="plan-review-info-label">录入倍率</span>
                <span class="plan-review-info-value">{{ detailModel.planRate || '空' }}</span>
              </div>
              <div class="plan-review-info-item">
                <span class="plan-review-info-label">录入金额</span>
                <span class="plan-review-info-value">{{ detailModel.planAmount || '空' }}</span>
              </div>
              <div class="plan-review-info-item">
                <span class="plan-review-info-label">更新时间</span>
                <span class="plan-review-info-value">{{ parseTime(detailModel.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
                  }}</span>
              </div>
            </div>
            <div class="plan-review-content">{{ detailModel.planContent }}</div>
            <div class="plan-review-remark" v-if="detailModel.planRemark">其他说明：{{ detailModel.planRemark }}</div>
          </div>

          <!-- 全部比赛（每场当前赛果只读） -->
          <div class="plan-review-card">
            <div class="plan-review-card-title">关联比赛（共 {{ (detailModel.matches || []).length }} 场）</div>
            <el-table :data="detailModel.matches || []" empty-text="暂无关联比赛">
              <el-table-column label="所属赛季" align="center" prop="seasonName" width="120" />
              <el-table-column label="主队" align="center" prop="homeTeamName" min-width="140" />
              <el-table-column label="客队" align="center" prop="awayTeamName" min-width="140" />
              <el-table-column label="比赛时间" align="center" prop="matchTime" width="160">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
                </template>
              </el-table-column>
              <el-table-column label="比赛状态" align="center" prop="matchStatus" width="90">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
                </template>
              </el-table-column>
              <el-table-column label="比赛结果" align="center" prop="matchResult" width="90">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_match_result" :value="scope.row.matchResult" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 图片（有权限时，最多两张，只读） -->
          <div class="plan-review-card" v-if="hasImageQueryPermission">
            <div class="plan-review-card-title">方案计划图片（{{ (detailModel.planImageObjectKeys || []).length }} / 2）</div>
            <div class="plan-review-image-list">
              <el-image v-for="(objectKey, index) in detailModel.planImageObjectKeys || []" :key="index"
                :src="baseUrl + objectKey" fit="cover"
                style="width: 120px; height: 120px; border-radius: 6px; margin-right: 10px;"
                :preview-src-list="imagePreviewList" />
              <span class="plan-review-image-empty" v-if="!(detailModel.planImageObjectKeys || []).length">暂无图片</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { listPlan, getPlan, addPlan, updatePlan, delPlan } from "@/api/fx67ll/dortmund/plan";
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";
import { listMatch } from "@/api/fx67ll/dortmund/match";

import { teamVenueOptions } from "@/utils/constant/football";

import { checkPermi } from "@/utils/common/permission";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import PlanImageUpload from "./components/PlanImageUpload/index";

export default {
  name: "Plan",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  components: { CommonEnhancedSelect, PlanImageUpload },
  data() {
    // 倍率有值时必须大于0，十进制字符串校验
    const checkPlanRate = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("录入倍率只能为非负十进制数字"));
        return;
      }
      if (parseFloat(value) <= 0) {
        callback(new Error("录入倍率有值时必须大于0"));
        return;
      }
      callback();
    };
    // 金额有值时必须大于等于0，十进制字符串校验
    const checkPlanAmount = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("录入金额只能为非负十进制数字"));
        return;
      }
      callback();
    };
    return {
      // 页面场景（list总览列表 edit编写 review回顾）
      pageScene: "list",
      // 编写场景模式（add新增 update修改）
      editMode: "add",
      // 遮罩层
      loading: true,
      // 编写场景表单遮罩层
      editLoading: false,
      // 编写场景提交中状态
      submitting: false,
      // 回顾场景加载状态
      reviewLoading: false,
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
      // 方案计划表格数据
      planList: [],
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
        planContent: null,
        matchId: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 完整只读详情（回顾场景展示）
      detailModel: {},
      // 编写场景表单参数（创建与修改共用，修改时另带 planId）
      editForm: {},
      // 编写场景表单校验
      editRules: {
        planContent: [
          { required: true, message: "方案计划正文不能为空", trigger: "blur" }
        ],
        planRate: [
          { validator: checkPlanRate, trigger: "blur" }
        ],
        planAmount: [
          { validator: checkPlanAmount, trigger: "blur" }
        ],
        "newMatch.seasonId": [
          { required: true, message: "新比赛所属赛季不能为空", trigger: "change" }
        ],
        "newMatch.homeTeamId": [
          { required: true, message: "新比赛主队不能为空", trigger: "change" }
        ],
        "newMatch.awayTeamId": [
          { required: true, message: "新比赛客队不能为空", trigger: "change" }
        ],
        "newMatch.matchTime": [
          { required: true, message: "新比赛比赛时间不能为空", trigger: "blur" }
        ],
      },
      // 当场新建比赛面板开关
      newMatchVisible: false,
      // 已加入的当场新建比赛列表（提交进 newMatches）
      newMatchList: [],
      // 修改时已关联、后来被关闭的比赛（只读展示，后端保持原关联不动）
      closedMatchList: [],
      // 球场预设选项数组
      teamVenueOptions,
      // 图片预览基础地址
      baseUrl: process.env.VUE_APP_BASE_API,
    };
  },
  computed: {
    // 是否拥有图片上传权限（仅指定用户）
    hasImageUploadPermission() {
      return checkPermi(["dortmund:plan:image:upload"]);
    },
    // 是否拥有图片查询权限（决定列表图片张数列与回顾图片区是否渲染）
    hasImageQueryPermission() {
      return checkPermi(["dortmund:plan:image:query"]);
    },
    // 是否拥有方案计划新增权限（决定当场新建比赛入口是否显示）
    hasPlanAddPermission() {
      return checkPermi(["dortmund:plan:add"]);
    },
    // 当场新建比赛必填项是否填写完整
    isNewMatchFilled() {
      const newMatch = this.editForm?.newMatch || {};
      return newMatch.seasonId != null && newMatch.homeTeamId != null && newMatch.awayTeamId != null
        && newMatch.matchTime != null && newMatch.matchTime !== "";
    },
    // 回顾场景图片预览集合（完整地址）
    imagePreviewList() {
      return (this.detailModel.planImageObjectKeys || []).map((objectKey) => this.baseUrl + objectKey);
    },
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    this.listTeam = listTeam;
    // 比赛下拉包装接口：为每个选项拼装 matchName 展示文案（后台比赛数据无 matchName 冗余字段）
    this.listMatch = (query) => {
      return listMatch(query).then((response) => {
        const rows = (response.rows || []).map((match) => ({
          ...match,
          matchName: this.formatMatchLabel(match),
        }));
        return { ...response, rows };
      });
    };

    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询方案计划列表 */
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
      listPlan(this.queryParams).then(response => {
        this.planList = this.formatObjectArrayNullProperty(response.rows || []);
        this.total = response.total;
      }).finally(() => {
        this.loading = false;
      });
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
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.planId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作：进入编写场景 */
    handleAdd() {
      this.editMode = "add";
      this.resetEditScene();
      this.pageScene = "edit";
    },
    /** 修改按钮操作：拉取详情后进入编写场景 */
    handleUpdate(row) {
      this.editMode = "update";
      this.resetEditScene();
      const planId = row.planId || this.ids
      this.editLoading = true;
      getPlan(planId).then(response => {
        const detail = response.data || {};
        // 已关联比赛中后来被关闭的保持只读展示并维持关联，正常比赛进多选框
        const matches = detail.matches || [];
        this.closedMatchList = matches.filter(item => item.matchStatus !== "0");
        const openMatchIds = matches.filter(item => item.matchStatus === "0").map(item => item.matchId);
        // 从详情中挑选允许修改的字段构建更新表单，后台字段不进入可编辑控件
        this.editForm = {
          planId: detail.planId,
          planContent: detail.planContent,
          planRate: detail.planRate,
          planAmount: detail.planAmount,
          planRemark: detail.planRemark,
          matchIds: openMatchIds,
          newMatches: [],
          planImageObjectKeys: detail.planImageObjectKeys || [],
          // 当场新建比赛面板表单同步初始化，避免修改时展开面板取值报错
          newMatch: this.buildEmptyNewMatch(),
        };
        this.pageScene = "edit";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    /** 回顾按钮操作：进入只读回顾场景 */
    handleReview(row) {
      this.reviewLoading = true;
      this.detailModel = {};
      this.pageScene = "review";
      getPlan(row.planId).then(response => {
        this.detailModel = response.data || {};
      }).finally(() => {
        this.reviewLoading = false;
      });
    },
    // 构建当场新建比赛的空表单对象
    buildEmptyNewMatch() {
      return {
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchRemark: null,
      };
    },
    // 重置编写场景表单与当场新建面板
    resetEditScene() {
      this.editForm = {
        planId: null,
        planContent: null,
        planRate: null,
        planAmount: null,
        planRemark: null,
        matchIds: [],
        newMatches: [],
        planImageObjectKeys: [],
        newMatch: this.buildEmptyNewMatch(),
      };
      this.newMatchVisible = false;
      this.newMatchList = [];
      this.closedMatchList = [];
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
      });
    },
    // 展开/收起当场新建比赛面板
    toggleNewMatchPanel() {
      this.newMatchVisible = !this.newMatchVisible;
      if (!this.newMatchVisible) {
        this.editForm.newMatch = this.buildEmptyNewMatch();
      }
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
      });
    },
    // 比赛多选变化：暂存到 editForm.matchIds
    handleMatchIdsChange(val) {
      this.editForm.matchIds = val;
    },
    // 当场新建比赛加入已建列表
    handleAddNewMatch() {
      this.$refs["editForm"].validateField(["newMatch.seasonId", "newMatch.homeTeamId", "newMatch.awayTeamId", "newMatch.matchTime"], (errMsg) => {
        if (errMsg) {
          return;
        }
        const newMatch = this.editForm.newMatch;
        if (newMatch.homeTeamId === newMatch.awayTeamId) {
          this.$modal.msgError("新比赛主队和客队不能相同！");
          return;
        }
        this.newMatchList.push({ ...newMatch });
        // 加入后清空面板内容，可继续新建下一场
        this.editForm.newMatch = this.buildEmptyNewMatch();
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
        });
      });
    },
    // 移除一条已加入的当场新建比赛
    handleRemoveNewMatch(index) {
      this.newMatchList.splice(index, 1);
    },
    // 返回总览并刷新列表
    handleBackToList() {
      this.pageScene = "list";
      this.getList();
    },
    // 比赛下拉展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchLabel(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 当场新建比赛展示文案
    formatNewMatchLabel(match) {
      return `新比赛：${this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}")}`;
    },
    // 列表关联比赛摘要：场次 + 对阵
    formatMatchSummary(row) {
      const matches = row.matches || [];
      if (!matches.length) {
        return "";
      }
      const vsText = matches.map(item => `${item.homeTeamName || ""}vs${item.awayTeamName || ""}`).join("、");
      return `共${matches.length}场：${vsText}`;
    },
    /** 提交按钮：构建请求体后提交，失败时保留已填文字、选择与图片 */
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        // 至少一场比赛（已有比赛 + 当场新建，修改时后端另保留已关联的关闭比赛）
        const totalMatchCount = (this.editForm.matchIds || []).length + this.newMatchList.length;
        if (this.editMode === "add" && totalMatchCount === 0) {
          this.$modal.msgError("方案计划至少要关联一场比赛！");
          return;
        }
        if (this.editMode === "update" && totalMatchCount === 0 && this.closedMatchList.length === 0) {
          this.$modal.msgError("方案计划保存后至少要关联一场比赛！");
          return;
        }
        this.doSubmitEditForm();
      });
    },
    // 实际提交
    doSubmitEditForm() {
      const isAdd = this.editMode === "add";
      const data = {
        planContent: this.editForm.planContent,
        planRate: this.editForm.planRate,
        planAmount: this.editForm.planAmount,
        planRemark: this.editForm.planRemark,
        matchIds: this.editForm.matchIds || [],
        newMatches: this.newMatchList.map(match => ({
          seasonId: match.seasonId,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          matchTime: match.matchTime,
          matchVenue: match.matchVenue,
          // 新建比赛资料状态必须为正常，赛果可空
          matchStatus: "0",
          matchRemark: match.matchRemark,
        })),
      };
      if (!isAdd) {
        data.planId = this.editForm.planId;
      }
      // 图片对象键只在拥有上传权限且操作过图片区时提交（全部移除时为空数组）
      if (this.hasImageUploadPermission) {
        data.planImageObjectKeys = this.editForm.planImageObjectKeys || [];
      }
      this.submitting = true;
      const request = isAdd ? addPlan(data) : updatePlan(data);
      request.then(response => {
        this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
        this.handleBackToList();
      }).catch(() => {
        // 保存失败时保留已填文字、选择与图片，可直接重试
      }).finally(() => {
        this.submitting = false;
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const planIds = row.planId || this.ids;
      this.$modal.confirm('是否确认删除方案计划编号为"' + planIds + '"的数据项？').then(function () {
        return delPlan(planIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('dortmund/plan/export', {
        ...this.queryParams
      }, `plan_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
/* 场景切换过渡动画 */
.scene-switch-enter-active,
.scene-switch-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.scene-switch-enter,
.scene-switch-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* 编写/回顾场景头部 */
.plan-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.plan-edit-header-left {
  display: flex;
  align-items: center;
}

.plan-edit-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plan-edit-form {
  padding: 20px 20px 4px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 编写场景分区 */
.plan-edit-section {
  margin-bottom: 18px;
  padding: 16px 16px 16px 0;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.plan-edit-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-left: 16px;
}

.plan-edit-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.plan-edit-tip {
  margin: 4px 0 8px;
  padding-left: 106px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

/* 已关联但后来被关闭的比赛只读标签 */
.plan-closed-match-list {
  padding-left: 106px;
}

/* 当场新建比赛滑出面板 */
.plan-new-match-panel {
  padding: 14px 14px 14px 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #2ecc71;
  border-radius: 8px;
}

.plan-new-match-panel-title {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding-left: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.plan-new-match-panel-title i {
  margin-right: 6px;
  color: #2ecc71;
}

.plan-new-match-actions {
  padding-left: 104px;
}

/* 面板滑出过渡动画 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-panel-enter,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 编写场景底部按钮 */
.plan-edit-footer {
  margin-top: 16px;
  padding: 14px 20px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 回顾场景 */
.plan-review-body {
  min-height: 200px;
}

.plan-review-card {
  margin-bottom: 16px;
  padding: 18px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.plan-review-card-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.plan-review-info-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.plan-review-info-item {
  min-width: 140px;
  margin-right: 32px;
}

.plan-review-info-label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
}

.plan-review-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.plan-review-content {
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
  white-space: pre-wrap;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.plan-review-remark {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #909399;
}

.plan-review-image-list {
  display: flex;
  align-items: center;
}

.plan-review-image-empty {
  font-size: 13px;
  color: #909399;
}
</style>
