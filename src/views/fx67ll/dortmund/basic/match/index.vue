<template>
  <div class="app-container">
    <!-- 场景切换：总览列表 / 比赛编排 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
          label-width="68px">
          <el-form-item label="比赛编号" prop="matchId" v-if="isMoreQuery">
            <el-input v-model="queryParams.matchId" type="number" min="1" step="1" placeholder="请输入比赛编号" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="所属赛季" prop="seasonId" v-if="isMoreQuery">
            <common-enhanced-select ref="seasonSelect" v-model="queryParams.seasonId" valueKey="seasonId"
              labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" :enter-callback="handleQuery" />
          </el-form-item>
          <el-form-item label="主队名称" prop="homeTeamId">
            <common-enhanced-select ref="homeTeamSelect" v-model="queryParams.homeTeamId" valueKey="teamId"
              labelKey="teamName" :api-func="listTeam" placeholder="请选择主队名称" :enter-callback="handleQuery" />
          </el-form-item>
          <el-form-item label="客队名称" prop="awayTeamId">
            <common-enhanced-select ref="awayTeamSelect" v-model="queryParams.awayTeamId" valueKey="teamId"
              labelKey="teamName" :api-func="listTeam" placeholder="请选择客队名称" :enter-callback="handleQuery" />
          </el-form-item>
          <el-form-item label="比赛时间" prop="matchTime">
            <el-date-picker v-model="daterangeMatchTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
              range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
          </el-form-item>
          <el-form-item label="比赛场地" prop="matchVenue" v-if="isMoreQuery">
            <el-select v-model="queryParams.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable
              filterable allow-create default-first-option>
              <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="比赛状态" prop="matchStatus" v-if="isMoreQuery">
            <el-select v-model="queryParams.matchStatus" style="width: 100%" placeholder="请选择比赛状态" clearable
              @keyup.enter.native="handleQuery">
              <el-option v-for="dict in dict.type.sys_notice_status" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="比赛结果" prop="matchResult" v-if="isMoreQuery">
            <el-select v-model="queryParams.matchResult" style="width: 100%" placeholder="请选择比赛结果" clearable
              @keyup.enter.native="handleQuery">
              <el-option v-for="dict in dict.type.fx67ll_match_result" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" v-if="isMoreQuery">
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
              v-hasPermi="['dortmund:match:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:match:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
              v-hasPermi="['dortmund:match:remove']">删除</el-button>
          </el-col>
          <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:match:export']">导出</el-button>
          </el-col> -->
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="matchList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="比赛编号" align="center" prop="matchId" width="80" fixed="left" />
          <el-table-column label="所属赛季" align="center" prop="seasonName" width="80" fixed="left" />
          <el-table-column label="主队名称" align="center" prop="homeTeamName" width="190" fixed="left" />
          <el-table-column label="客队名称" align="center" prop="awayTeamName" width="190" fixed="left" />
          <el-table-column label="比赛时间" align="center" prop="matchTime" width="150">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.matchTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="比赛场地" align="center" prop="matchVenue" width="180" />
          <el-table-column label="比赛状态" align="center" prop="matchStatus" width="80">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
            </template>
          </el-table-column>
          <!-- 分析次数为后台统计字段，本页只读展示，不接受录入 -->
          <el-table-column label="分析次数" align="center" prop="analysisCount" />
          <el-table-column label="比赛结果" align="center" prop="matchResult" width="80">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_match_result" :value="scope.row.matchResult" />
            </template>
          </el-table-column>
          <el-table-column label="比赛备注" align="center" prop="matchRemark" width="230" :show-overflow-tooltip="true" />
          <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
          <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
            </template>
          </el-table-column>
          <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
          <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
                v-hasPermi="['dortmund:match:edit']">修改</el-button>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
                v-hasPermi="['dortmund:match:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />
      </div>

      <!-- 比赛编排场景：新增/修改共用整页，按填写顺序铺开 -->
      <div key="edit" v-else class="match-edit-scene">
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
                <el-date-picker clearable v-model="editForm.matchTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择比赛时间">
                </el-date-picker>
              </el-form-item>
            </el-col>

            <!-- 当场新增赛季滑出面板（同页面板，不是子弹窗；与比赛同一事务提交） -->
            <el-col :span="24" v-if="newSeasonVisible">
              <transition name="slide-panel">
                <div class="match-new-panel">
                  <div class="match-new-panel-title">
                    <i class="el-icon-collection-tag"></i>
                    <span>当场新增赛季（与比赛保存在同一事务，任一步失败全部回滚）</span>
                  </div>
                  <el-form ref="newSeasonForm" :model="newSeasonForm" :rules="newSeasonRules" label-width="85px">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="赛季编码" prop="seasonCode">
                          <el-input v-model="newSeasonForm.seasonCode" placeholder="请输入赛季编码" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="赛季名称" prop="seasonName">
                          <el-input v-model="newSeasonForm.seasonName" placeholder="请输入赛季名称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="开始日期" prop="seasonStartDate">
                          <el-date-picker clearable v-model="newSeasonForm.seasonStartDate" type="date"
                            value-format="yyyy-MM-dd" style="width: 100%" placeholder="请选择赛季开始日期">
                          </el-date-picker>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="结束日期" prop="seasonEndDate">
                          <el-date-picker clearable v-model="newSeasonForm.seasonEndDate" type="date"
                            value-format="yyyy-MM-dd" style="width: 100%" placeholder="请选择赛季结束日期">
                          </el-date-picker>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="赛季状态" prop="seasonStatus">
                          <el-select v-model="newSeasonForm.seasonStatus" style="width: 100%" placeholder="请选择赛季状态">
                            <el-option v-for="dict in dict.type.fx67ll_dortmund_status" :key="dict.value"
                              :label="dict.label" :value="dict.value"></el-option>
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                </div>
              </transition>
            </el-col>

            <!-- 主队 -->
            <el-col :span="12">
              <el-form-item label="主队名称" prop="homeTeamId">
                <div class="match-edit-item">
                  <common-enhanced-select ref="editHomeTeamSelect" v-model="editForm.homeTeamId" valueKey="teamId"
                    labelKey="teamName" :api-func="listTeam" placeholder="请选择主队名称"
                    :disabled="newHomeTeamVisible || editMode !== 'add'" @change="handleEditHomeTeamChange" />
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
                  <common-enhanced-select ref="editAwayTeamSelect" v-model="editForm.awayTeamId" valueKey="teamId"
                    labelKey="teamName" :api-func="listTeam" placeholder="请选择客队名称"
                    :disabled="newAwayTeamVisible || editMode !== 'add'" @change="handleEditAwayTeamChange" />
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
                <div class="match-new-panel">
                  <div class="match-new-panel-title">
                    <i class="el-icon-collection-tag"></i>
                    <span>当场新增主队（与比赛保存在同一事务，任一步失败全部回滚）</span>
                  </div>
                  <el-form ref="newHomeTeamForm" :model="newHomeTeamForm" :rules="newTeamRules" label-width="85px">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="球队编码" prop="teamCode">
                          <el-input v-model="newHomeTeamForm.teamCode" placeholder="请输入球队编码" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队全称" prop="teamName">
                          <el-input v-model="newHomeTeamForm.teamName" placeholder="请输入球队中文全称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队昵称" prop="teamNameShort">
                          <el-input v-model="newHomeTeamForm.teamNameShort" placeholder="请输入球队昵称/简称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队英文" prop="teamNameEn">
                          <el-input v-model="newHomeTeamForm.teamNameEn" placeholder="请输入球队英文名称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队主场" prop="teamVenue">
                          <el-select v-model="newHomeTeamForm.teamVenue" style="width: 100%" placeholder="请选择或输入球队主场"
                            clearable filterable allow-create default-first-option>
                            <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label"
                              :value="item.value" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="地区/联赛" prop="teamCountry">
                          <el-select v-model="newHomeTeamForm.teamCountry" style="width: 100%" placeholder="请选择或输入地区/联赛"
                            clearable filterable allow-create default-first-option>
                            <el-option v-for="item in teamCountryOptions" :key="item.value" :label="item.label"
                              :value="item.value" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="24">
                        <el-form-item label="球队Logo" prop="teamLogoUrl">
                          <el-input v-model="newHomeTeamForm.teamLogoUrl" placeholder="请输入球队Logo图片的链接地址" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="24">
                        <el-form-item label="球队标签" prop="teamTag">
                          <el-select v-model="newHomeTeamForm.teamTag" style="width: 100%" placeholder="请选择或输入球队标签"
                            clearable filterable multiple allow-create default-first-option>
                            <el-option v-for="item in teamTagOptions" :key="item.value" :label="item.label"
                              :value="item.value" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队状态" prop="teamStatus">
                          <el-switch v-model="newHomeTeamForm.teamStatus" active-value="0" inactive-value="1" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                </div>
              </transition>
            </el-col>

            <!-- 当场新增客队面板 -->
            <el-col :span="24" v-if="newAwayTeamVisible">
              <transition name="slide-panel">
                <div class="match-new-panel">
                  <div class="match-new-panel-title">
                    <i class="el-icon-collection-tag"></i>
                    <span>当场新增客队（与比赛保存在同一事务，任一步失败全部回滚）</span>
                  </div>
                  <el-form ref="newAwayTeamForm" :model="newAwayTeamForm" :rules="newTeamRules" label-width="85px">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="球队编码" prop="teamCode">
                          <el-input v-model="newAwayTeamForm.teamCode" placeholder="请输入球队编码" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队全称" prop="teamName">
                          <el-input v-model="newAwayTeamForm.teamName" placeholder="请输入球队中文全称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队昵称" prop="teamNameShort">
                          <el-input v-model="newAwayTeamForm.teamNameShort" placeholder="请输入球队昵称/简称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队英文" prop="teamNameEn">
                          <el-input v-model="newAwayTeamForm.teamNameEn" placeholder="请输入球队英文名称" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队主场" prop="teamVenue">
                          <el-select v-model="newAwayTeamForm.teamVenue" style="width: 100%" placeholder="请选择或输入球队主场"
                            clearable filterable allow-create default-first-option>
                            <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label"
                              :value="item.value" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="地区/联赛" prop="teamCountry">
                          <el-select v-model="newAwayTeamForm.teamCountry" style="width: 100%" placeholder="请选择或输入地区/联赛"
                            clearable filterable allow-create default-first-option>
                            <el-option v-for="item in teamCountryOptions" :key="item.value" :label="item.label"
                              :value="item.value" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="24">
                        <el-form-item label="球队Logo" prop="teamLogoUrl">
                          <el-input v-model="newAwayTeamForm.teamLogoUrl" placeholder="请输入球队Logo图片的链接地址" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="24">
                        <el-form-item label="球队标签" prop="teamTag">
                          <el-select v-model="newAwayTeamForm.teamTag" style="width: 100%" placeholder="请选择或输入球队标签"
                            clearable filterable multiple allow-create default-first-option>
                            <el-option v-for="item in teamTagOptions" :key="item.value" :label="item.label"
                              :value="item.value" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="球队状态" prop="teamStatus">
                          <el-switch v-model="newAwayTeamForm.teamStatus" active-value="0" inactive-value="1" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                </div>
              </transition>
            </el-col>

            <el-col :span="12">
              <el-form-item label="比赛场地" prop="matchVenue">
                <el-select v-model="editForm.matchVenue" style="width: 100%" placeholder="请选择或输入比赛场地" clearable
                  filterable allow-create default-first-option>
                  <el-option v-for="item in teamVenueOptions" :key="item.value" :label="item.label"
                    :value="item.value" />
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
          </el-row>
        </el-form>

        <div class="match-edit-footer">
          <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
          <el-button @click="handleBackToList">返回总览</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/fx67ll/dortmund/match";
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";

import { teamCountryOptions, teamTagOptions, teamVenueOptions } from "@/utils/constant/football";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Match",
  dicts: ["sys_notice_status", "fx67ll_match_result", "fx67ll_dortmund_status"],
  components: { CommonEnhancedSelect },
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
      // 页面场景（list总览列表 edit比赛编排）
      pageScene: "list",
      // 编排场景模式（add新增 update修改）
      editMode: "add",
      // 遮罩层
      loading: true,
      // 编排场景表单遮罩层
      editLoading: false,
      // 编排场景提交中状态
      submitting: false,
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
      // 比赛记录表格数据
      matchList: [],
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 比赛时间范围
      daterangeMatchTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        matchId: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        beginMatchTime: null,
        endMatchTime: null,
        matchVenue: null,
        matchStatus: null,
        matchResult: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 编排场景表单参数（修改时从详情接口取最新数据后挑选允许修改的字段）
      editForm: {},
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
      },
      // 当场新增赛季面板开关
      newSeasonVisible: false,
      // 当场新增赛季表单参数（提交进 newSeason，与比赛同一事务）
      newSeasonForm: {},
      // 当场新增赛季表单校验（沿用赛季页必填项）
      newSeasonRules: {
        seasonCode: [
          { required: true, message: "赛季编码不能为空", trigger: "blur" }
        ],
        seasonName: [
          { required: true, message: "赛季名称不能为空", trigger: "blur" }
        ],
        seasonStartDate: [
          { required: true, message: "赛季开始日期不能为空", trigger: "blur" }
        ],
        seasonEndDate: [
          { required: true, message: "赛季结束日期不能为空", trigger: "blur" }
        ],
        seasonStatus: [
          { required: true, message: "赛季状态不能为空", trigger: "blur" }
        ],
      },
      // 当场新增主队面板开关
      newHomeTeamVisible: false,
      // 当场新增主队表单参数（提交进 newHomeTeam，与比赛同一事务）
      newHomeTeamForm: {},
      // 当场新增客队面板开关
      newAwayTeamVisible: false,
      // 当场新增客队表单参数（提交进 newAwayTeam，与比赛同一事务）
      newAwayTeamForm: {},
      // 当场新增球队表单校验（沿用球队页必填项）
      newTeamRules: {
        teamCode: [
          { required: true, message: "球队编码不能为空", trigger: "blur" }
        ],
        teamName: [
          { required: true, message: "球队全称不能为空", trigger: "blur" }
        ],
        teamNameShort: [
          { required: true, message: "球队昵称不能为空", trigger: "blur" }
        ],
        teamNameEn: [
          { required: true, message: "球队英文不能为空", trigger: "blur" }
        ],
        teamLogoUrl: [
          { required: true, message: "球队Logo不能为空", trigger: "blur" }
        ],
        teamCountry: [
          { required: true, message: "地区/联赛不能为空", trigger: "blur" }
        ],
        teamTag: [
          { required: true, message: "球队标签不能为空", trigger: "blur" }
        ],
        teamStatus: [
          { required: true, message: "球队状态不能为空", trigger: "blur" }
        ],
      },
      // 球队地区预选选项数组
      teamCountryOptions,
      // 球队标签预设选项数组
      teamTagOptions,
      // 球场预设选项数组
      teamVenueOptions,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    this.listTeam = listTeam;

    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
      this.queryParams.beginMatchTime = null;
      this.queryParams.endMatchTime = null;
    },
    /** 查询比赛记录列表 */
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
      if (null != this.daterangeMatchTime && "" != this.daterangeMatchTime) {
        this.queryParams.beginMatchTime = this.daterangeMatchTime[0];
        this.queryParams.endMatchTime = this.daterangeMatchTime[1];
      }
      listMatch(this.queryParams).then(response => {
        this.matchList = this.formatObjectArrayNullProperty(response.rows);
        this.total = response.total;
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
      this.ids = selection.map(item => item.matchId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作：进入编排场景 */
    handleAdd() {
      this.editMode = "add";
      this.resetEditScene();
      this.pageScene = "edit";
    },
    /** 修改按钮操作：拉取详情后进入编排场景 */
    handleUpdate(row) {
      this.editMode = "update";
      this.resetEditScene();
      const matchId = row.matchId || this.ids
      this.editLoading = true;
      getMatch(matchId).then(response => {
        const detail = response.data || {};
        // 从详情中挑选允许修改的字段构建更新表单，后台字段不进入可编辑控件
        this.editForm = {
          matchId: detail.matchId,
          seasonId: detail.seasonId,
          homeTeamId: detail.homeTeamId,
          awayTeamId: detail.awayTeamId,
          matchTime: detail.matchTime,
          matchVenue: detail.matchVenue,
          matchStatus: detail.matchStatus,
          matchResult: detail.matchResult,
          matchRemark: detail.matchRemark,
        };
        this.pageScene = "edit";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    // 重置编排场景表单与当场新增面板
    resetEditScene() {
      this.editForm = {
        matchId: null,
        seasonId: null,
        homeTeamId: null,
        awayTeamId: null,
        matchTime: null,
        matchVenue: null,
        matchStatus: null,
        matchResult: null,
        matchRemark: null,
      };
      this.newSeasonVisible = false;
      this.newHomeTeamVisible = false;
      this.newAwayTeamVisible = false;
      this.resetNewSeasonForm();
      this.resetNewTeamForm("home");
      this.resetNewTeamForm("away");
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
      });
    },
    // 重置当场新增赛季表单
    resetNewSeasonForm() {
      this.newSeasonForm = {
        seasonCode: null,
        seasonName: null,
        seasonStartDate: null,
        seasonEndDate: null,
        seasonStatus: "0",
      };
    },
    // 重置当场新增球队表单
    resetNewTeamForm(side) {
      const emptyTeamForm = {
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamLogoUrl: null,
        teamVenue: null,
        teamCountry: null,
        teamTag: [],
        teamStatus: "0",
      };
      if (side === "home") {
        this.newHomeTeamForm = { ...emptyTeamForm };
      } else {
        this.newAwayTeamForm = { ...emptyTeamForm };
      }
    },
    // 展开/收起当场新增赛季面板（展开时清空已选赛季，收起时还原可选）
    toggleNewSeasonPanel() {
      this.newSeasonVisible = !this.newSeasonVisible;
      if (this.newSeasonVisible) {
        this.editForm.seasonId = null;
        this.resetNewSeasonForm();
      }
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate("seasonId");
      });
    },
    // 展开/收起当场新增主队/客队面板
    toggleNewTeamPanel(side) {
      if (side === "home") {
        this.newHomeTeamVisible = !this.newHomeTeamVisible;
        if (this.newHomeTeamVisible) {
          this.editForm.homeTeamId = null;
        }
        this.resetNewTeamForm("home");
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate("homeTeamId");
        });
      } else {
        this.newAwayTeamVisible = !this.newAwayTeamVisible;
        if (this.newAwayTeamVisible) {
          this.editForm.awayTeamId = null;
        }
        this.resetNewTeamForm("away");
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
    // 已选已有主队时收起当场新增面板
    handleEditHomeTeamChange(val) {
      if (val != null && val !== "") {
        this.newHomeTeamVisible = false;
      }
    },
    // 已选已有客队时收起当场新增面板
    handleEditAwayTeamChange(val) {
      if (val != null && val !== "") {
        this.newAwayTeamVisible = false;
      }
    },
    // 返回总览并刷新列表
    handleBackToList() {
      this.pageScene = "list";
      this.getList();
    },
    // 构建当场新增球队的提交体（标签数组拼接为逗号分隔串）
    buildNewTeamBody(teamForm) {
      return {
        teamCode: teamForm.teamCode,
        teamName: teamForm.teamName,
        teamNameShort: teamForm.teamNameShort,
        teamNameEn: teamForm.teamNameEn,
        teamLogoUrl: teamForm.teamLogoUrl,
        teamVenue: teamForm.teamVenue,
        teamCountry: teamForm.teamCountry,
        teamTag: teamForm?.teamTag?.length ? teamForm.teamTag.join(",") : "",
        teamStatus: teamForm.teamStatus,
      };
    },
    // 逐个校验编排表单与已展开的当场新增面板，全部通过后执行提交
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        const validatePanel = (refName) => {
          return new Promise(resolve => {
            if (!this.$refs[refName]) {
              resolve(true);
              return;
            }
            this.$refs[refName].validate(panelValid => {
              resolve(panelValid);
            });
          });
        };
        Promise.all([
          validatePanel("newSeasonForm"),
          validatePanel("newHomeTeamForm"),
          validatePanel("newAwayTeamForm"),
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
          this.doSubmitEditForm();
        });
      });
    },
    // 实际提交：新增带可选 newSeason/newHomeTeam/newAwayTeam，修改不带当场新建字段
    doSubmitEditForm() {
      const isAdd = this.editMode === "add";
      const data = {
        matchTime: this.editForm.matchTime,
        matchVenue: this.editForm.matchVenue,
        matchStatus: this.editForm.matchStatus,
        matchResult: this.editForm.matchResult,
        matchRemark: this.editForm.matchRemark,
      };
      if (isAdd) {
        // 当场新增面板展开时提交新建体，否则提交已选记录ID
        if (this.newSeasonVisible) {
          data.newSeason = { ...this.newSeasonForm };
        } else {
          data.seasonId = this.editForm.seasonId;
        }
        if (this.newHomeTeamVisible) {
          data.newHomeTeam = this.buildNewTeamBody(this.newHomeTeamForm);
        } else {
          data.homeTeamId = this.editForm.homeTeamId;
        }
        if (this.newAwayTeamVisible) {
          data.newAwayTeam = this.buildNewTeamBody(this.newAwayTeamForm);
        } else {
          data.awayTeamId = this.editForm.awayTeamId;
        }
      } else {
        data.matchId = this.editForm.matchId;
        data.seasonId = this.editForm.seasonId;
        data.homeTeamId = this.editForm.homeTeamId;
        data.awayTeamId = this.editForm.awayTeamId;
      }
      this.submitting = true;
      const request = isAdd ? addMatch(data) : updateMatch(data);
      request.then(response => {
        this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
        this.handleBackToList();
      }).catch(() => {
        // 保存失败时留在编排场景并保留已填内容，重新拉取选项后可直接重试
        this.$refs["editSeasonSelect"] && this.$refs["editSeasonSelect"].refresh();
        this.$refs["editHomeTeamSelect"] && this.$refs["editHomeTeamSelect"].refresh();
        this.$refs["editAwayTeamSelect"] && this.$refs["editAwayTeamSelect"].refresh();
      }).finally(() => {
        this.submitting = false;
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const matchIds = row.matchId || this.ids;
      this.$modal.confirm('是否确认删除比赛记录编号为"' + matchIds + '"的数据项？').then(function () {
        return delMatch(matchIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('dortmund/match/export', {
        ...this.queryParams
      }, `match_${new Date().getTime()}.xlsx`)
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

/* 当场新增滑出面板 */
.match-new-panel {
  margin-bottom: 18px;
  padding: 16px 16px 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #2ecc71;
  border-radius: 8px;
}

.match-new-panel-title {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.match-new-panel-title i {
  margin-right: 6px;
  color: #2ecc71;
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
