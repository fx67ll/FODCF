<template>
  <!-- 比赛编排场景：新增/修改共用整页，按填写顺序铺开（进入场景时从父页面初始表单复制出可编辑副本） -->
  <div class="match-edit-scene">
    <div class="match-edit-header">
      <div class="match-edit-header-left">
        <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
        <span class="match-edit-title">{{ editMode === "add" ? "新增比赛" : "修改比赛" }}</span>
      </div>
    </div>

    <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="85px" class="match-edit-form"
      v-loading="editLoading">
      <el-row :gutter="20">
        <!-- 所属赛季：可选已有，也可当场新增（仅新增比赛时，修改时不支持当场新建） -->
        <el-col :span="12">
          <el-form-item label="所属赛季" prop="seasonId">
            <div class="match-edit-item">
              <common-enhanced-select ref="editSeasonSelect" v-model="editForm.seasonId" valueKey="seasonId"
                labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季"
                :disabled="newSeasonVisible || editMode !== 'add'" @change="handleEditSeasonChange" />
              <el-button type="text" icon="el-icon-circle-plus-outline" class="match-edit-inline-btn"
                v-if="editMode === 'add'" @click="toggleNewSeasonPanel">
                {{ newSeasonVisible ? "收起当场新增" : "当场新增赛季" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>
        <!-- 比赛时间：带时分秒，与后台 datetime 列和唯一索引一致 -->
        <el-col :span="12">
          <el-form-item label="比赛时间" prop="matchTime">
            <el-date-picker clearable v-model="editForm.matchTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%" placeholder="请选择比赛时间">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <!-- 当场新增赛季滑出面板（面板组件v-if重新挂载自带表单重置） -->
        <el-col :span="24" v-if="newSeasonVisible">
          <transition name="slide-panel">
            <match-new-season-panel ref="newSeasonPanel" />
          </transition>
        </el-col>

        <!-- 主队 -->
        <el-col :span="12">
          <el-form-item label="主队名称" prop="homeTeamId">
            <div class="match-edit-item">
              <el-input :value="selectedHomeTeam ? selectedHomeTeam.teamName : ''" readonly placeholder="请选择主队名称"
                :disabled="newHomeTeamVisible || editMode !== 'add'" @focus="openTeamSelector('home')" />
              <el-button type="text" icon="el-icon-circle-plus-outline" class="match-edit-inline-btn"
                v-if="editMode === 'add'" @click="toggleNewTeamPanel('home')">
                {{ newHomeTeamVisible ? "收起当场新增" : "当场新增主队" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>
        <!-- 客队 -->
        <el-col :span="12">
          <el-form-item label="客队名称" prop="awayTeamId">
            <div class="match-edit-item">
              <el-input :value="selectedAwayTeam ? selectedAwayTeam.teamName : ''" readonly placeholder="请选择客队名称"
                :disabled="newAwayTeamVisible || editMode !== 'add'" @focus="openTeamSelector('away')" />
              <el-button type="text" icon="el-icon-circle-plus-outline" class="match-edit-inline-btn"
                v-if="editMode === 'add'" @click="toggleNewTeamPanel('away')">
                {{ newAwayTeamVisible ? "收起当场新增" : "当场新增客队" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>

        <!-- 当场新增主队面板 -->
        <el-col :span="24" v-if="newHomeTeamVisible">
          <transition name="slide-panel">
            <match-new-team-panel ref="newHomeTeamPanel" side="home" />
          </transition>
        </el-col>

        <!-- 当场新增客队面板 -->
        <el-col :span="24" v-if="newAwayTeamVisible">
          <transition name="slide-panel">
            <match-new-team-panel ref="newAwayTeamPanel" side="away" />
          </transition>
        </el-col>

        <el-col :span="12">
          <el-form-item label="比赛编码" prop="matchCode">
            <el-input v-model="editForm.matchCode" maxlength="23" show-word-limit placeholder="必填，不超过23个字符"
              :disabled="editMode !== 'add'" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="比赛场地" prop="matchVenue">
            <el-select v-model="editForm.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable filterable
              allow-create default-first-option>
              <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="比赛状态" prop="matchStatus">
            <el-select v-model="editForm.matchStatus" style="width: 100%" placeholder="请选择比赛状态">
              <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="比赛结果" prop="matchResult">
            <el-select v-model="editForm.matchResult" style="width: 100%" placeholder="请选择比赛结果（可空）" clearable>
              <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="比赛备注" prop="matchRemark">
            <el-input v-model="editForm.matchRemark" type="textarea" placeholder="请输入比赛备注内容" />
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="editMode === 'update' && editForm.matchId">
          <div class="match-linked-panel">
            <dortmund-info-point-inline-editor anchor-type="match" :match-id="editForm.matchId"
              @refresh="$emit('saved')" />
            <dortmund-odds-inline-editor :match-id="editForm.matchId" @refresh="$emit('saved')" />
          </div>
        </el-col>

        <el-col :span="24" v-if="editMode === 'add'">
          <el-form-item label="同步 odds">
            <div class="match-odds-toggle">
              <el-tag :type="newOddsVisible ? 'success' : 'info'" size="small">
                {{ newOddsVisible ? "保存时同步创建有效 odds" : "关闭时不提交 odds" }}
              </el-tag>
              <el-button type="text" icon="el-icon-circle-plus-outline" @click="toggleNewOdds">
                {{ newOddsVisible ? "收起 odds 表单" : "同时创建 odds" }}
              </el-button>
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="editMode === 'add' && newOddsVisible">
          <div class="match-odds-panel">
            <div class="match-odds-panel-title">
              <i class="el-icon-odometer"></i>
              <span>首条有效 odds</span>
            </div>
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="记录编码" prop="newOdds.oddsCode" label-width="80px">
                  <el-input v-model="editForm.newOdds.oddsCode" maxlength="23" show-word-limit placeholder="必填" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="来源时间" prop="newOdds.sourceTime" label-width="80px">
                  <el-date-picker v-model="editForm.newOdds.sourceTime" type="datetime"
                    value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="必选" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="让分值" prop="newOdds.handicapValue" label-width="80px">
                  <el-input v-model="editForm.newOdds.handicapValue" placeholder="必填" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12" v-for="row in oddsRows" :key="row.key">
              <el-col :span="4">
                <div class="match-odds-type">
                  <dict-tag :options="dict.type.fx67ll_dortmund_odds_type || []" :value="row.type" />
                </div>
              </el-col>
              <el-col :span="10">
                <el-form-item label="赔率" :prop="'newOdds.' + row.oddsField" label-width="58px">
                  <el-input v-model="editForm.newOdds[row.oddsField]" placeholder="大于 0" />
                </el-form-item>
              </el-col>
              <el-col :span="10">
                <el-form-item label="权重" :prop="'newOdds.' + row.weightField" label-width="58px">
                  <el-input v-model="editForm.newOdds[row.weightField]" placeholder="空默认 100" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-col>

        <el-col :span="24" v-if="editMode === 'add'">
          <div class="match-linked-panel">
            <div class="match-draft-info-header">
              <span><i class="el-icon-notebook-2"></i>关联信息点（{{ newInfoPoints.length }} 条）</span>
              <el-button type="primary" plain size="mini" icon="el-icon-plus" @click="openDraftInfo">新增</el-button>
            </div>
            <el-table :data="newInfoPoints" size="small" empty-text="暂无关联信息点">
              <el-table-column label="标题" prop="pointTitle" min-width="170" show-overflow-tooltip />
              <el-table-column label="内容" prop="pointContent" min-width="200" show-overflow-tooltip />
              <el-table-column label="来源" prop="sourceName" min-width="130" show-overflow-tooltip />
              <el-table-column label="操作" align="center" width="110">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" icon="el-icon-edit"
                    @click="openDraftInfo(scope.row)">编辑</el-button>
                  <el-button size="mini" type="text" icon="el-icon-delete"
                    @click="removeDraftInfo(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-form>

    <div class="match-edit-footer">
      <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
      <el-button @click="handleBackToList">返回总览</el-button>
    </div>
    <dortmund-team-selector-modal :visible.sync="teamSelectorVisible"
      :selected-items="teamSelectorSide === 'home' ? [selectedHomeTeam] : [selectedAwayTeam]"
      @confirm="handleTeamSelectorConfirm" />

    <el-dialog :visible.sync="draftInfoVisible" :title="draftInfoIndex >= 0 ? '编辑关联信息点' : '新增关联信息点'" width="760px"
      append-to-body :close-on-click-modal="false">
      <el-form ref="draftInfoForm" :model="draftInfoForm" :rules="draftInfoRules" label-width="104px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="信息标题" prop="pointTitle">
              <el-input v-model="draftInfoForm.pointTitle" maxlength="255" show-word-limit placeholder="请输入信息标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集时间" prop="collectTime">
              <el-date-picker v-model="draftInfoForm.collectTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="请选择采集时间" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="信息内容" prop="pointContent">
              <el-input v-model="draftInfoForm.pointContent" type="textarea" :rows="4" maxlength="1023" show-word-limit
                placeholder="请输入客观信息内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源名称" prop="sourceName">
              <el-input v-model="draftInfoForm.sourceName" maxlength="255" placeholder="请输入来源名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源地址" prop="sourceUrl">
              <el-input v-model="draftInfoForm.sourceUrl" maxlength="512" placeholder="请输入来源地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button @click="draftInfoVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveDraftInfo">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSeason } from "@/api/fx67ll/dortmund/season";
import DortmundTeamSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundTeamSelectorModal/index";

import { teamVenueOptions } from "@/utils/constant/football";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import MatchNewSeasonPanel from "../MatchNewSeasonPanel/index";
import MatchNewTeamPanel from "../MatchNewTeamPanel/index";
import DortmundInfoPointInlineEditor from "@/views/fx67ll/dortmund/other/component/DortmundInfoPointInlineEditor/index.vue";
import DortmundOddsInlineEditor from "@/views/fx67ll/dortmund/other/component/DortmundOddsInlineEditor/index.vue";

export default {
  name: "MatchEditScene",
  dicts: ["sys_notice_status", "fx67ll_match_result", "fx67ll_dortmund_odds_type"],
  components: {
    CommonEnhancedSelect, MatchNewSeasonPanel, MatchNewTeamPanel, DortmundTeamSelectorModal,
    DortmundInfoPointInlineEditor, DortmundOddsInlineEditor
  },
  props: {
    // 编排场景模式（add新增 update修改）
    editMode: {
      type: String,
      default: "add",
    },
    // 进入场景时的初始表单（父页面构建，本场景复制出可编辑副本）
    initialForm: {
      type: Object,
      default: () => ({}),
    },
    // 编排场景表单遮罩层
    editLoading: {
      type: Boolean,
      default: false,
    },
    // 编排场景提交中状态
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    draftInfoRules() {
      return {
        pointTitle: [{ required: true, message: "信息标题不能为空", trigger: "blur" }],
        pointContent: [{ required: true, message: "信息内容不能为空", trigger: "blur" }],
        sourceName: [{ required: true, message: "来源名称不能为空", trigger: "blur" }],
        collectTime: [{ required: true, message: "采集时间不能为空", trigger: "change" }],
      };
    },
  },
  data() {
    // 归属字段的校验：已选已有记录或已展开当场新增面板均视为已填写
    const checkSeasonFilled = (rule, value, callback) => {
      if ((value != null && value !== "") || this.newSeasonVisible) {
        callback();
      } else {
        callback(new Error("所属赛季不能为空"));
      }
    };
    const checkHomeTeamFilled = (rule, value, callback) => {
      if ((value != null && value !== "") || this.newHomeTeamVisible) {
        callback();
      } else {
        callback(new Error("主队名称不能为空"));
      }
    };
    const checkAwayTeamFilled = (rule, value, callback) => {
      if ((value != null && value !== "") || this.newAwayTeamVisible) {
        callback();
      } else {
        callback(new Error("客队名称不能为空"));
      }
    };
    return {
      // 编排场景表单参数（创建与修改共用，从父页面初始表单复制）
      editForm: this.buildEditForm(),
      // 编排场景表单校验
      editRules: {
        seasonId: [
          { required: true, validator: checkSeasonFilled, trigger: "change" }
        ],
        homeTeamId: [
          { required: true, validator: checkHomeTeamFilled, trigger: "change" }
        ],
        awayTeamId: [
          { required: true, validator: checkAwayTeamFilled, trigger: "change" }
        ],
        matchTime: [
          { required: true, message: "比赛时间不能为空", trigger: "blur" }
        ],
        matchStatus: [
          { required: true, message: "比赛状态不能为空", trigger: "blur" }
        ],
        matchCode: [
          { required: true, message: "比赛编码不能为空", trigger: "blur" }
        ],
        "newOdds.oddsCode": [
          { required: true, message: "记录编码不能为空", trigger: "blur" }
        ],
        "newOdds.sourceTime": [
          { required: true, message: "来源时间不能为空", trigger: "change" }
        ],
        "newOdds.handicapValue": [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (value == null || value === "") {
                callback(new Error("让分值不能为空"));
                return;
              }
              if (!/^[+-]?\d+(\.\d+)?$/.test(String(value))) {
                callback(new Error("让分值必须为数字"));
                return;
              }
              callback();
            },
            trigger: "blur",
          }
        ],
        "newOdds.homeWinOdds": [{ validator: this.checkNewOddsPositive, trigger: "blur" }],
        "newOdds.drawOdds": [{ validator: this.checkNewOddsPositive, trigger: "blur" }],
        "newOdds.awayWinOdds": [{ validator: this.checkNewOddsPositive, trigger: "blur" }],
        "newOdds.handicapHomeWinOdds": [{ validator: this.checkNewOddsPositive, trigger: "blur" }],
        "newOdds.handicapDrawOdds": [{ validator: this.checkNewOddsPositive, trigger: "blur" }],
        "newOdds.handicapAwayWinOdds": [{ validator: this.checkNewOddsPositive, trigger: "blur" }],
        "newOdds.homeWinWeight": [{ validator: this.checkNewOddsWeight, trigger: "blur" }],
        "newOdds.drawWeight": [{ validator: this.checkNewOddsWeight, trigger: "blur" }],
        "newOdds.awayWinWeight": [{ validator: this.checkNewOddsWeight, trigger: "blur" }],
        "newOdds.handicapHomeWinWeight": [{ validator: this.checkNewOddsWeight, trigger: "blur" }],
        "newOdds.handicapDrawWeight": [{ validator: this.checkNewOddsWeight, trigger: "blur" }],
        "newOdds.handicapAwayWinWeight": [{ validator: this.checkNewOddsWeight, trigger: "blur" }],
      },
      // 当场新增赛季面板开关
      newSeasonVisible: false,
      // 当场新增主队面板开关
      newHomeTeamVisible: false,
      // 当场新增客队面板开关
      newAwayTeamVisible: false,
      // 当场新增首条有效 odds 面板开关
      newOddsVisible: false,
      selectedHomeTeam: this.buildSelectedTeam(this.initialForm, "home"),
      selectedAwayTeam: this.buildSelectedTeam(this.initialForm, "away"),
      teamSelectorVisible: false,
      teamSelectorSide: "home",
      // 六类 odds 输入行
      oddsRows: [
        { key: "homeWin", type: "HW", oddsField: "homeWinOdds", weightField: "homeWinWeight" },
        { key: "draw", type: "DR", oddsField: "drawOdds", weightField: "drawWeight" },
        { key: "awayWin", type: "AW", oddsField: "awayWinOdds", weightField: "awayWinWeight" },
        { key: "handicapHomeWin", type: "HH", oddsField: "handicapHomeWinOdds", weightField: "handicapHomeWinWeight" },
        { key: "handicapDraw", type: "HD", oddsField: "handicapDrawOdds", weightField: "handicapDrawWeight" },
        { key: "handicapAwayWin", type: "HA", oddsField: "handicapAwayWinOdds", weightField: "handicapAwayWinWeight" },
      ],
      // 随比赛一起创建的关联信息点
      newInfoPoints: [],
      draftInfoVisible: false,
      draftInfoIndex: -1,
      draftInfoForm: this.buildEmptyInfoPoint(),
      // 球场预设选项数组（比赛场地可选项）
      teamVenueOptions,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
  },
  methods: {
    // 从父页面传入的初始表单复制出本场景可编辑副本（避免直接改动父页面数据）
    buildEditForm() {
      const initial = this.initialForm || {};
      return {
        matchId: initial.matchId || null,
        matchCode: initial.matchCode || null,
        seasonId: initial.seasonId || null,
        homeTeamId: initial.homeTeamId || null,
        awayTeamId: initial.awayTeamId || null,
        matchTime: initial.matchTime || null,
        matchVenue: initial.matchVenue || null,
        matchStatus: initial.matchStatus || null,
        matchResult: initial.matchResult || null,
        matchRemark: initial.matchRemark || null,
        newOdds: this.buildEmptyOdds(),
      };
    },
    // 构建首条同步 odds 的空表单
    buildEmptyOdds() {
      return {
        oddsCode: null,
        sourceTime: null,
        handicapValue: null,
        homeWinOdds: null,
        drawOdds: null,
        awayWinOdds: null,
        handicapHomeWinOdds: null,
        handicapDrawOdds: null,
        handicapAwayWinOdds: null,
        homeWinWeight: null,
        drawWeight: null,
        awayWinWeight: null,
        handicapHomeWinWeight: null,
        handicapDrawWeight: null,
        handicapAwayWinWeight: null,
      };
    },
    buildEmptyInfoPoint() {
      return {
        pointTitle: null,
        pointContent: null,
        sourceName: null,
        sourceUrl: null,
        collectTime: null,
      };
    },
    openDraftInfo(row) {
      if (row && row.pointTitle !== undefined) {
        this.draftInfoIndex = this.newInfoPoints.indexOf(row);
        this.draftInfoForm = { ...row };
      } else {
        this.draftInfoIndex = -1;
        this.draftInfoForm = this.buildEmptyInfoPoint();
      }
      this.draftInfoVisible = true;
      this.$nextTick(() => {
        this.$refs.draftInfoForm && this.$refs.draftInfoForm.clearValidate();
      });
    },
    saveDraftInfo() {
      this.$refs.draftInfoForm.validate((valid) => {
        if (!valid) {
          return;
        }
        const data = { ...this.draftInfoForm, infoPointType: "M" };
        if (this.draftInfoIndex >= 0) {
          this.newInfoPoints.splice(this.draftInfoIndex, 1, data);
        } else {
          this.newInfoPoints.push(data);
        }
        this.draftInfoVisible = false;
      });
    },
    removeDraftInfo(index) {
      this.newInfoPoints.splice(index, 1);
    },
    // 展开/收起同步 odds 表单；收起时清空草稿，保证关闭后请求不带 newOdds
    toggleNewOdds() {
      this.newOddsVisible = !this.newOddsVisible;
      if (!this.newOddsVisible) {
        this.editForm.newOdds = this.buildEmptyOdds();
      }
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },
    // 校验首条 odds 的赔率值
    checkNewOddsPositive(rule, value, callback) {
      if (value == null || value === "") {
        callback(new Error("赔率不能为空"));
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value)) || parseFloat(value) <= 0) {
        callback(new Error("赔率必须为大于 0 的数字"));
        return;
      }
      callback();
    },
    // 校验首条 odds 的手工权重
    checkNewOddsWeight(rule, value, callback) {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value)) || parseFloat(value) < 0 || parseFloat(value) > 100) {
        callback(new Error("权重必须在 0 到 100 之间"));
        return;
      }
      callback();
    },
    // 展开/收起当场新增赛季面板（展开时清空已选赛季，收起时还原可选；面板v-if重新挂载自带表单重置）
    toggleNewSeasonPanel() {
      this.newSeasonVisible = !this.newSeasonVisible;
      if (this.newSeasonVisible) {
        this.editForm.seasonId = null;
      }
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate("seasonId");
      });
    },
    // 展开/收起当场新增主队/客队面板（面板v-if重新挂载自带表单重置）
    toggleNewTeamPanel(side) {
      if (side === "home") {
        this.newHomeTeamVisible = !this.newHomeTeamVisible;
        if (this.newHomeTeamVisible) {
          this.editForm.homeTeamId = null;
        }
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate("homeTeamId");
        });
      } else {
        this.newAwayTeamVisible = !this.newAwayTeamVisible;
        if (this.newAwayTeamVisible) {
          this.editForm.awayTeamId = null;
        }
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate("awayTeamId");
        });
      }
    },
    // 已选已有赛季时收起当场新增面板
    handleEditSeasonChange(val) {
      if (val != null && val !== "") {
        this.newSeasonVisible = false;
      }
    },
    buildSelectedTeam(initial, side) {
      const source = initial || {};
      if (side === "home" && source.homeTeamId != null) {
        return { teamId: source.homeTeamId, teamName: source.homeTeamName };
      }
      if (side === "away" && source.awayTeamId != null) {
        return { teamId: source.awayTeamId, teamName: source.awayTeamName };
      }
      return null;
    },
    openTeamSelector(side) {
      this.teamSelectorSide = side;
      this.teamSelectorVisible = true;
    },
    handleTeamSelectorConfirm(team) {
      if (this.teamSelectorSide === "home") {
        this.selectedHomeTeam = team || null;
        this.editForm.homeTeamId = team ? team.teamId : null;
        if (team) {
          this.newHomeTeamVisible = false;
        }
      } else {
        this.selectedAwayTeam = team || null;
        this.editForm.awayTeamId = team ? team.teamId : null;
        if (team) {
          this.newAwayTeamVisible = false;
        }
      }
    },
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
    // 保存失败后由父页面回调：重新拉取下拉选项，便于直接重试
    refreshSelectOptions() {
      this.$refs["editSeasonSelect"] && this.$refs["editSeasonSelect"].refresh();
    },
    // 构建提交体：新增带可选 newSeason/newHomeTeam/newAwayTeam，修改不带当场新建字段
    buildSubmitData() {
      const isAdd = this.editMode === "add";
      const data = {
        matchCode: this.editForm.matchCode,
        matchTime: this.editForm.matchTime,
        matchVenue: this.editForm.matchVenue,
        matchStatus: this.editForm.matchStatus,
        matchResult: this.editForm.matchResult,
        matchRemark: this.editForm.matchRemark,
      };
      if (isAdd) {
        // 当场新增面板展开时提交新建体，否则提交已选记录ID
        if (this.newSeasonVisible) {
          data.newSeason = this.$refs["newSeasonPanel"].getSubmitData();
        } else {
          data.seasonId = this.editForm.seasonId;
        }
        if (this.newHomeTeamVisible) {
          data.newHomeTeam = this.$refs["newHomeTeamPanel"].getSubmitData();
        } else {
          data.homeTeamId = this.editForm.homeTeamId;
        }
        if (this.newAwayTeamVisible) {
          data.newAwayTeam = this.$refs["newAwayTeamPanel"].getSubmitData();
        } else {
          data.awayTeamId = this.editForm.awayTeamId;
        }
        if (this.newOddsVisible) {
          data.newOdds = { ...this.editForm.newOdds };
        }
        data.newInfoPoints = this.newInfoPoints.map((item) => ({
          ...item,
          allowPublic: "0",
        }));
      } else {
        data.matchId = this.editForm.matchId;
        data.seasonId = this.editForm.seasonId;
        data.homeTeamId = this.editForm.homeTeamId;
        data.awayTeamId = this.editForm.awayTeamId;
      }
      return data;
    },
    // 逐个校验编排表单与已展开的当场新增面板，全部通过后构建提交体交由父页面提交
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        // 面板组件自带Promise化的validate，未展开的面板直接视为通过
        const validatePanel = (refName) => {
          const panel = this.$refs[refName];
          if (!panel) {
            return Promise.resolve(true);
          }
          return panel.validate();
        };
        Promise.all([
          validatePanel("newSeasonPanel"),
          validatePanel("newHomeTeamPanel"),
          validatePanel("newAwayTeamPanel"),
        ]).then(results => {
          if (results.some(item => !item)) {
            return;
          }
          // 主客队不能相同（当场新建的主客队由后台在创建后校验）
          if (this.editForm.homeTeamId != null && this.editForm.awayTeamId != null
            && this.editForm.homeTeamId === this.editForm.awayTeamId) {
            this.$modal.msgError("比赛主队和客队不能相同！");
            return;
          }
          this.$emit("save", this.buildSubmitData());
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* 编排场景头部 */
.match-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.match-edit-header-left {
  display: flex;
  align-items: center;
}

.match-edit-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.match-edit-form {
  padding: 20px 20px 4px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 选择器与当场新增入口同行排布 */
.match-edit-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.match-edit-item .el-select {
  flex: 1;
}

.match-edit-inline-btn {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0 4px;
}

.match-odds-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.match-odds-panel {
  padding: 14px;
  margin: 4px 0 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f2fbf6 100%);
  border: 1px solid #dcebe3;
  border-left: 4px solid #2ecc71;
  border-radius: 12px;
  animation: oddsPanelRise 0.32s ease both;
}

.match-odds-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a36;

  i {
    color: #2ecc71;
  }
}

.match-odds-type {
  height: 32px;
  padding-top: 5px;
  font-size: 12px;
}

.match-linked-panel {
  padding: 14px;
  margin: 4px 0 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f2fbf6 100%);
  border: 1px solid #dcebe3;
  border-left: 4px solid #2ecc71;
  border-radius: 12px;
}

.match-linked-panel>*+* {
  margin-top: 16px;
}

.match-draft-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #2b3a36;
  font-size: 14px;
  font-weight: 700;

  i {
    margin-right: 5px;
    color: #27ad60;
  }
}

@keyframes oddsPanelRise {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* 编排场景底部按钮 */
.match-edit-footer {
  margin-top: 16px;
  padding: 14px 20px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
