<template>
  <div class="app-container">
    <!-- 场景切换：总览列表 / T录入 / M录入 / 有效性 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
          label-width="90px">
          <el-form-item label="信息点类型" prop="infoPointType">
            <el-select v-model="queryParams.infoPointType" placeholder="请选择信息点类型" clearable
              @change="handleQueryTypeChange">
              <el-option v-for="dict in dict.type.fx67ll_dortmund_info_point_type" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="所属赛季" prop="seasonId" v-if="queryParams.infoPointType !== 'M'">
            <common-enhanced-select ref="seasonSelect" v-model="queryParams.seasonId" valueKey="seasonId"
              labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" :enter-callback="handleQuery" />
          </el-form-item>
          <el-form-item label="所属比赛" prop="matchId" v-if="queryParams.infoPointType === 'M'">
            <common-enhanced-select ref="matchSelect" v-model="queryParams.matchId" valueKey="matchId"
              labelKey="matchName" :api-func="listMatch" placeholder="请选择所属比赛" :enter-callback="handleQuery" />
          </el-form-item>
          <el-form-item label="信息点标题" prop="pointTitle">
            <el-input v-model="queryParams.pointTitle" placeholder="请输入信息点标题关键字" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="信息点状态" prop="pointStatus">
            <el-select v-model="queryParams.pointStatus" placeholder="请选择信息点状态" clearable>
              <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="是否可公开" prop="allowPublic" v-if="isMoreQuery">
            <el-select v-model="queryParams.allowPublic" placeholder="请选择是否可公开" clearable>
              <el-option v-for="dict in dict.type.fx67ll_dortmund_allow_public" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" v-if="isMoreQuery">
            <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
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
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAddT"
              v-hasPermi="['dortmund:info:point:add']">新增赛季球队信息点</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="success" plain icon="el-icon-plus" size="mini" @click="handleAddM"
              v-hasPermi="['dortmund:info:point:add']">新增比赛临时信息点</el-button>
          </el-col>
          <el-col :span="1.5" style="margin-bottom: 10px;">
            <el-button type="warning" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:info:point:edit']">修改</el-button>
          </el-col>
          <!-- 信息点没有删除动作，不渲染删除按钮 -->
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="infoPointList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="信息点类型" align="center" prop="infoPointType" width="100" fixed="left">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="scope.row.infoPointType" />
            </template>
          </el-table-column>
          <el-table-column label="所属赛季" align="center" prop="seasonName" width="110" fixed="left" />
          <el-table-column label="所属比赛" align="center" prop="matchId" width="200" :show-overflow-tooltip="true"
            fixed="left">
            <template slot-scope="scope">
              <span>{{ formatMatchColumnText(scope.row) || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="关联球队" align="center" prop="teamRels" min-width="180" :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <span>{{ formatTeamRelsText(scope.row) || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="信息点标题" align="center" prop="pointTitle" min-width="160"
            :show-overflow-tooltip="true" />
          <el-table-column label="信息点内容" align="center" prop="pointContent" min-width="200"
            :show-overflow-tooltip="true" />
          <el-table-column label="信息来源" align="center" prop="sourceName" width="120" :show-overflow-tooltip="true" />
          <el-table-column label="来源发布时间" align="center" prop="sourcePublishTime" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.sourcePublishTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
            </template>
          </el-table-column>
          <el-table-column label="信息点状态" align="center" prop="pointStatus" width="90">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.pointStatus" />
            </template>
          </el-table-column>
          <el-table-column label="是否可公开" align="center" prop="allowPublic" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="scope.row.allowPublic" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="180">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-view" @click="handleViewDetail(scope.row)"
                v-hasPermi="['dortmund:info:point:query']">详情</el-button>
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
                v-hasPermi="['dortmund:info:point:edit']">修改</el-button>
              <el-button size="mini" type="text"
                :icon="scope.row.pointStatus === '0' ? 'el-icon-close' : 'el-icon-open'"
                @click="handleChangeStatus(scope.row)" v-hasPermi="['dortmund:info:point:changeStatus']">{{
                  scope.row.pointStatus === '0' ? '停用' : '启用'
                }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />

        <!-- 信息点详情对话框（只读） -->
        <el-dialog title="信息点详情" :visible.sync="detailOpen" :close-on-click-modal="false" width="760px"
          :style="`top: ${getDialogVerticalOffset(520)}`" append-to-body>
          <div class="info-detail-body" v-loading="detailLoading">
            <div class="info-detail-info-row">
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">信息点类型</span>
                <span class="info-detail-info-value">
                  <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="detailModel.infoPointType" />
                </span>
              </div>
              <div class="info-detail-info-item" v-if="detailModel.infoPointType === 'T'">
                <span class="info-detail-info-label">所属赛季</span>
                <span class="info-detail-info-value">{{ detailModel.seasonName || '空' }}</span>
              </div>
              <div class="info-detail-info-item" v-if="detailModel.infoPointType === 'M'">
                <span class="info-detail-info-label">所属比赛</span>
                <span class="info-detail-info-value">{{ formatMatchColumnText(detailModel) }}</span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">信息点状态</span>
                <span class="info-detail-info-value">
                  <dict-tag :options="dict.type.sys_normal_disable" :value="detailModel.pointStatus" />
                </span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">是否可公开</span>
                <span class="info-detail-info-value">
                  <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="detailModel.allowPublic" />
                </span>
              </div>
            </div>
            <div class="info-detail-field">
              <div class="info-detail-field-label">信息点标题</div>
              <div class="info-detail-field-value">{{ detailModel.pointTitle || '空' }}</div>
            </div>
            <div class="info-detail-field">
              <div class="info-detail-field-label">信息点内容</div>
              <div class="info-detail-field-value">{{ detailModel.pointContent || '空' }}</div>
            </div>
            <div class="info-detail-field" v-if="detailModel.infoPointType === 'T'">
              <div class="info-detail-field-label">关联球队（含历史停用关系）</div>
              <div class="info-detail-field-value">
                <template v-if="(detailModel.teamRels || []).length">
                  <div v-for="rel in detailModel.teamRels" :key="rel.relationId" class="info-detail-team-rel">
                    <span>{{ rel.teamName || ('球队' + rel.teamId) }}</span>
                    <dict-tag :options="dict.type.fx67ll_dortmund_relation_status" :value="rel.relationStatus" />
                  </div>
                </template>
                <span v-else>空</span>
              </div>
            </div>
            <div class="info-detail-info-row">
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">信息来源</span>
                <span class="info-detail-info-value">{{ detailModel.sourceName || '空' }}</span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">来源发布时间</span>
                <span class="info-detail-info-value">{{ parseTime(detailModel.sourcePublishTime,
                  "{y}-{m}-{d}{h}:{i}:{s}") || '空' }}</span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">采集或录入时间</span>
                <span class="info-detail-info-value">{{ parseTime(detailModel.collectTime, "{y}-{m}-{d} {h}:{i}:{s}")
                  || '空' }}</span>
              </div>
            </div>
            <div class="info-detail-info-row">
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">生效时间</span>
                <span class="info-detail-info-value">{{ parseTime(detailModel.effectiveStartTime,
                  "{y}-{m}-{d}{h}:{i}:{s}") || '不限制' }}</span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">失效时间</span>
                <span class="info-detail-info-value">{{ parseTime(detailModel.effectiveEndTime,
                  "{y}-{m}-{d}{h}:{i}:{s}") || '不限制' }}</span>
              </div>
            </div>
            <div class="info-detail-field" v-if="detailModel.pointRemark">
              <div class="info-detail-field-label">备注</div>
              <div class="info-detail-field-value">{{ detailModel.pointRemark }}</div>
            </div>
            <div class="info-detail-info-row">
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">记录创建者</span>
                <span class="info-detail-info-value">{{ detailModel.createBy || '空' }}</span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">记录创建时间</span>
                <span class="info-detail-info-value">{{ parseTime(detailModel.createTime, "{y}-{m}-{d} {h}:{i}:{s}")
                  || '空' }}</span>
              </div>
              <div class="info-detail-info-item">
                <span class="info-detail-info-label">记录更新时间</span>
                <span class="info-detail-info-value">{{ parseTime(detailModel.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
                  || '空' }}</span>
              </div>
            </div>
          </div>
          <div slot="footer" class="dialog-footer">
            <el-button @click="detailOpen = false">关 闭</el-button>
          </div>
        </el-dialog>
      </div>

      <!-- T类型录入场景：赛季 → 球队 → 内容 → 来源和时间窗 -->
      <div key="editT" v-else-if="pageScene === 'editT'" class="info-edit-scene">
        <div class="info-edit-header">
          <div class="info-edit-header-left">
            <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
            <span class="info-edit-title">{{ editMode === "add" ? "新增赛季球队信息点" : "修改赛季球队信息点" }}</span>
          </div>
        </div>

        <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="110px" class="info-edit-form"
          v-loading="editLoading">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属赛季" prop="seasonId">
                <!-- 新增时下拉选择；修改时归属只读展示（已关联赛季可能已被停用，不在正常赛季选项内） -->
                <common-enhanced-select v-if="editMode === 'add'" ref="seasonSelect" v-model="editForm.seasonId"
                  valueKey="seasonId" labelKey="seasonName" :api-func="listSeason" placeholder="请选择所属赛季" />
                <el-input v-else :value="editForm.seasonName || ('赛季' + editForm.seasonId)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="关联球队" prop="teamIds">
                <!-- 可选球队只限启用且在数据范围内的球队，不按赛季过滤；修改时保持已有关系不变可不改 -->
                <el-select v-model="editForm.teamIds" style="width: 100%" multiple filterable placeholder="请选择关联球队（可多选）"
                  :disabled="editMode !== 'add'">
                  <el-option v-for="team in teamOptions" :key="team.teamId" :label="team.teamName"
                    :value="team.teamId" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="信息点标题" prop="pointTitle">
                <el-input v-model="editForm.pointTitle" :maxlength="1023" placeholder="请输入信息点标题" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="信息点内容" prop="pointContent">
                <el-input v-model="editForm.pointContent" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                  placeholder="请输入客观信息内容" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="信息来源名称" prop="sourceName">
                <el-input v-model="editForm.sourceName" :maxlength="1023" placeholder="请输入信息来源名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源地址" prop="sourceUrl">
                <el-input v-model="editForm.sourceUrl" :maxlength="1023" placeholder="请输入来源地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源发布时间" prop="sourcePublishTime">
                <el-date-picker clearable v-model="editForm.sourcePublishTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择来源发布时间">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采集或录入时间" prop="collectTime">
                <el-date-picker clearable v-model="editForm.collectTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择采集或录入时间">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生效时间" prop="effectiveStartTime">
                <el-date-picker clearable v-model="editForm.effectiveStartTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择生效时间（空表示不限制）">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="失效时间" prop="effectiveEndTime">
                <el-date-picker clearable v-model="editForm.effectiveEndTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择失效时间（空表示不限制）">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否可公开" prop="allowPublic">
                <el-radio-group v-model="editForm.allowPublic">
                  <el-radio v-for="dict in dict.type.fx67ll_dortmund_allow_public" :key="dict.value"
                    :label="dict.value">{{
                      dict.label }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注" prop="pointRemark">
                <el-input v-model="editForm.pointRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                  placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 状态只通过启停动作修改，录入与修改表单不出现状态控件 -->
        </el-form>

        <div class="info-edit-footer">
          <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
          <el-button @click="handleBackToList">返回总览</el-button>
        </div>
      </div>

      <!-- M类型录入场景：先定比赛，再写内容和来源 -->
      <div key="editM" v-else-if="pageScene === 'editM'" class="info-edit-scene">
        <div class="info-edit-header">
          <div class="info-edit-header-left">
            <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
            <span class="info-edit-title">{{ editMode === "add" ? "新增比赛临时信息点" : "修改比赛临时信息点" }}</span>
          </div>
        </div>

        <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="110px" class="info-edit-form"
          v-loading="editLoading">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属比赛" prop="matchId">
                <!-- 新增时下拉选择；修改时归属只读展示（已关联比赛可能已被关闭，不在正常比赛选项内） -->
                <common-enhanced-select v-if="editMode === 'add'" ref="matchSelect" v-model="editForm.matchId"
                  valueKey="matchId" labelKey="matchName" :api-func="listMatch" placeholder="请选择所属比赛" />
                <el-input v-else :value="formatMatchColumnText(editForm)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="信息点标题" prop="pointTitle">
                <el-input v-model="editForm.pointTitle" :maxlength="1023" placeholder="请输入信息点标题" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="信息点内容" prop="pointContent">
                <el-input v-model="editForm.pointContent" type="textarea" :rows="4" :maxlength="1023" show-word-limit
                  placeholder="请输入客观信息内容" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="信息来源名称" prop="sourceName">
                <el-input v-model="editForm.sourceName" :maxlength="1023" placeholder="请输入信息来源名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源地址" prop="sourceUrl">
                <el-input v-model="editForm.sourceUrl" :maxlength="1023" placeholder="请输入来源地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源发布时间" prop="sourcePublishTime">
                <el-date-picker clearable v-model="editForm.sourcePublishTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择来源发布时间">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采集或录入时间" prop="collectTime">
                <el-date-picker clearable v-model="editForm.collectTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择采集或录入时间">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生效时间" prop="effectiveStartTime">
                <el-date-picker clearable v-model="editForm.effectiveStartTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择生效时间（空表示不限制）">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="失效时间" prop="effectiveEndTime">
                <el-date-picker clearable v-model="editForm.effectiveEndTime" type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" placeholder="请选择失效时间（空表示不限制）">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否可公开" prop="allowPublic">
                <el-radio-group v-model="editForm.allowPublic">
                  <el-radio v-for="dict in dict.type.fx67ll_dortmund_allow_public" :key="dict.value"
                    :label="dict.value">{{
                      dict.label }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注" prop="pointRemark">
                <el-input v-model="editForm.pointRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                  placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="info-edit-footer">
          <el-button type="primary" :loading="submitting" @click="submitEditForm">保 存</el-button>
          <el-button @click="handleBackToList">返回总览</el-button>
        </div>
      </div>

      <!-- 有效性场景：按一场比赛只读分出「将进入分析」和「被排除」 -->
      <div key="valid" v-else class="info-valid-scene">
        <div class="info-edit-header">
          <div class="info-edit-header-left">
            <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
            <span class="info-edit-title">信息点有效性</span>
          </div>
        </div>

        <div class="info-valid-search">
          <common-enhanced-select ref="validMatchSelect" v-model="validMatchId" valueKey="matchId" labelKey="matchName"
            :api-func="listMatch" placeholder="请选择要查询有效性的比赛" @change="handleValidMatchChange" />
        </div>

        <div v-loading="validLoading">
          <!-- 将进入分析 -->
          <div class="info-valid-group">
            <div class="info-valid-group-header">
              <span class="info-valid-group-title success"><i class="el-icon-circle-check"></i> 将进入分析（{{
                validList.length }} 条）</span>
            </div>
            <el-table :data="validList" empty-text="暂无将进入分析的信息点">
              <el-table-column label="信息点类型" align="center" prop="infoPointType" width="100">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="scope.row.infoPointType" />
                </template>
              </el-table-column>
              <el-table-column label="信息点标题" align="center" prop="pointTitle" min-width="160"
                :show-overflow-tooltip="true" />
              <el-table-column label="信息点内容" align="center" prop="pointContent" min-width="200"
                :show-overflow-tooltip="true" />
              <el-table-column label="信息来源" align="center" prop="sourceName" width="120"
                :show-overflow-tooltip="true" />
              <el-table-column label="是否可公开" align="center" prop="allowPublic" width="100">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="scope.row.allowPublic" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 被排除 -->
          <div class="info-valid-group">
            <div class="info-valid-group-header">
              <span class="info-valid-group-title danger"><i class="el-icon-circle-close"></i> 被排除（{{
                excludedList.length }} 条）</span>
            </div>
            <el-table :data="excludedList" empty-text="暂无被排除的信息点">
              <el-table-column label="信息点类型" align="center" prop="infoPointType" width="100">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="scope.row.infoPointType" />
                </template>
              </el-table-column>
              <el-table-column label="信息点标题" align="center" prop="pointTitle" min-width="160"
                :show-overflow-tooltip="true" />
              <el-table-column label="信息点内容" align="center" prop="pointContent" min-width="200"
                :show-overflow-tooltip="true" />
              <el-table-column label="信息来源" align="center" prop="sourceName" width="120"
                :show-overflow-tooltip="true" />
              <el-table-column label="排除原因" align="center" prop="excludeReason" width="240"
                :show-overflow-tooltip="true" />
              <el-table-column label="是否可公开" align="center" prop="allowPublic" width="100">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="scope.row.allowPublic" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { listInfoPoint, getInfoPoint, addInfoPoint, updateInfoPoint, changeInfoPointStatus, listValidInfoPoint } from "@/api/fx67ll/dortmund/infoPoint";
import { listSeason } from "@/api/fx67ll/dortmund/season";
import { listTeam } from "@/api/fx67ll/dortmund/team";
import { listMatch } from "@/api/fx67ll/dortmund/match";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Info",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_info_point_type", "fx67ll_dortmund_allow_public", "fx67ll_dortmund_relation_status"],
  components: { CommonEnhancedSelect },
  data() {
    // 生效时间窗两端都有值时，开始不得晚于结束
    const checkEffectiveTimeWindow = (rule, value, callback) => {
      if (this.editForm.effectiveStartTime && this.editForm.effectiveEndTime
        && this.editForm.effectiveStartTime > this.editForm.effectiveEndTime) {
        callback(new Error("生效时间不得晚于失效时间"));
        return;
      }
      callback();
    };
    return {
      // 页面场景（list总览列表 editT赛季球队录入 editM比赛临时录入 valid有效性查询）
      pageScene: "list",
      // 录入场景模式（add新增 update修改）
      editMode: "add",
      // 遮罩层
      loading: true,
      // 录入场景表单遮罩层
      editLoading: false,
      // 录入场景提交中状态
      submitting: false,
      // 详情对话框开关
      detailOpen: false,
      // 详情加载状态
      detailLoading: false,
      // 有效性场景加载状态
      validLoading: false,
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
      // 信息点表格数据
      infoPointList: [],
      // 创建时间范围
      daterangeCreateTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        infoPointType: null,
        seasonId: null,
        matchId: null,
        pointTitle: null,
        pointStatus: null,
        allowPublic: null,
        beginCreateTime: null,
        endCreateTime: null,
      },
      // 完整只读详情（详情对话框展示）
      detailModel: {},
      // 录入场景表单参数
      editForm: {},
      // 录入场景表单校验
      editRules: {
        seasonId: [
          { required: true, message: "所属赛季不能为空", trigger: "change" }
        ],
        teamIds: [
          { required: true, type: "array", min: 1, message: "至少要关联一支球队", trigger: "change" }
        ],
        matchId: [
          { required: true, message: "所属比赛不能为空", trigger: "change" }
        ],
        pointTitle: [
          { required: true, message: "信息点标题不能为空", trigger: "blur" }
        ],
        pointContent: [
          { required: true, message: "信息点内容不能为空", trigger: "blur" }
        ],
        sourceName: [
          { required: true, message: "信息来源名称不能为空", trigger: "blur" }
        ],
        collectTime: [
          { required: true, message: "采集或录入时间不能为空", trigger: "blur" }
        ],
        effectiveStartTime: [
          { validator: checkEffectiveTimeWindow, trigger: "blur" }
        ],
        effectiveEndTime: [
          { validator: checkEffectiveTimeWindow, trigger: "blur" }
        ],
      },
      // T类型可选球队选项（只含启用且在数据范围内的球队，不按赛季过滤）
      teamOptions: [],
      // 有效性场景所选比赛
      validMatchId: null,
      // 有效性查询结果
      validResultList: [],
    };
  },
  computed: {
    // 有效性场景：将进入分析的信息点
    validList() {
      return this.validResultList.filter(item => item.valid);
    },
    // 有效性场景：被排除的信息点
    excludedList() {
      return this.validResultList.filter(item => !item.valid);
    },
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listSeason = listSeason;
    // 比赛下拉包装接口：为每个选项拼装 matchName 展示文案（后台比赛数据无 matchName 冗余字段）
    this.listMatch = (query) => {
      return listMatch(query).then((response) => {
        const rows = (response.rows || []).map((match) => ({
          ...match,
          matchName: this.formatMatchVsTimeText(match),
        }));
        return { ...response, rows };
      });
    };

    this.getList();
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
    },
    /** 查询信息点列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      // 类型切换时清理不适用字段，隐藏字段不被提交
      if (this.queryParams.infoPointType === "T") {
        this.queryParams.matchId = null;
      } else if (this.queryParams.infoPointType === "M") {
        this.queryParams.seasonId = null;
      }
      listInfoPoint(this.queryParams).then(response => {
        this.infoPointList = this.formatObjectArrayNullProperty(response.rows || []);
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
    // 类型筛选变化时重新查询
    handleQueryTypeChange() {
      this.handleQuery();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.infoPointId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 比赛列展示文案：主队 vs 客队 + 开赛时间
    formatMatchColumnText(row) {
      if (row.infoPointType !== "M" || !row.matchId) {
        return "";
      }
      return this.formatMatchVsTimeText(row);
    },
    // 关联球队摘要：当前有效关系在前，停用历史在后
    formatTeamRelsText(row) {
      if (row.infoPointType !== "T" || !(row.teamRels || []).length) {
        return "";
      }
      return row.teamRels.map(rel => rel.teamName || ("球队" + rel.teamId)).join("、");
    },
    // 加载T类型可选球队选项（只取启用球队，与CommonEnhancedSelect数据口径一致）
    loadTeamOptions() {
      listTeam({ pageNum: 1, pageSize: 1023, teamStatus: "0", isNeedSort: "Y" }).then(response => {
        this.teamOptions = response.rows || [];
      });
    },
    /** 新增T类型信息点：进入赛季球队录入场景 */
    handleAddT() {
      this.editMode = "add";
      this.pageScene = "editT";
      this.resetEditScene("T");
      this.loadTeamOptions();
    },
    /** 新增M类型信息点：进入比赛临时录入场景 */
    handleAddM() {
      this.editMode = "add";
      this.pageScene = "editM";
      this.resetEditScene("M");
    },
    /** 修改按钮操作：拉取详情后按类型进入对应录入场景 */
    handleUpdate(row) {
      const infoPointId = row.infoPointId || this.ids;
      this.editLoading = true;
      getInfoPoint(infoPointId).then(response => {
        const detail = response.data || {};
        this.editMode = "update";
        this.pageScene = detail.infoPointType === "T" ? "editT" : "editM";
        // 从详情中挑选允许修改的字段构建更新表单；类型、归属和状态只读，状态只走启停动作
        this.editForm = {
          infoPointId: detail.infoPointId,
          infoPointType: detail.infoPointType,
          seasonId: detail.seasonId,
          // 归属只读展示用的冗余字段（不进入提交数据）
          seasonName: detail.seasonName,
          teamIds: (detail.teamRels || []).filter(rel => rel.relationStatus === "0").map(rel => rel.teamId),
          matchId: detail.matchId,
          matchTime: detail.matchTime,
          homeTeamName: detail.homeTeamName,
          awayTeamName: detail.awayTeamName,
          pointTitle: detail.pointTitle,
          pointContent: detail.pointContent,
          sourceName: detail.sourceName,
          sourceUrl: detail.sourceUrl,
          sourcePublishTime: detail.sourcePublishTime,
          collectTime: detail.collectTime,
          effectiveStartTime: detail.effectiveStartTime,
          effectiveEndTime: detail.effectiveEndTime,
          allowPublic: detail.allowPublic || "0",
          pointRemark: detail.pointRemark,
        };
        if (this.pageScene === "editT") {
          this.loadTeamOptions();
        }
        this.$nextTick(() => {
          this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
        });
      }).finally(() => {
        this.editLoading = false;
      });
    },
    // 重置录入场景表单
    resetEditScene(infoPointType) {
      this.editForm = {
        infoPointId: null,
        infoPointType: infoPointType,
        seasonId: null,
        teamIds: [],
        matchId: null,
        pointTitle: null,
        pointContent: null,
        sourceName: null,
        sourceUrl: null,
        sourcePublishTime: null,
        collectTime: null,
        effectiveStartTime: null,
        effectiveEndTime: null,
        allowPublic: "0",
        pointRemark: null,
      };
      this.$nextTick(() => {
        this.$refs["editForm"] && this.$refs["editForm"].clearValidate();
      });
    },
    // 返回总览并刷新列表
    handleBackToList() {
      this.pageScene = "list";
      this.getList();
    },
    // 类型字段按场景清理：T不提交matchId，M不提交seasonId和teamIds
    buildSubmitData() {
      const data = {
        pointTitle: this.editForm.pointTitle,
        pointContent: this.editForm.pointContent,
        sourceName: this.editForm.sourceName,
        sourceUrl: this.editForm.sourceUrl,
        sourcePublishTime: this.editForm.sourcePublishTime,
        collectTime: this.editForm.collectTime,
        effectiveStartTime: this.editForm.effectiveStartTime,
        effectiveEndTime: this.editForm.effectiveEndTime,
        allowPublic: this.editForm.allowPublic,
        pointRemark: this.editForm.pointRemark,
      };
      if (this.editMode === "add") {
        data.infoPointType = this.editForm.infoPointType;
        if (this.editForm.infoPointType === "T") {
          data.seasonId = this.editForm.seasonId;
          data.teamIds = this.editForm.teamIds || [];
        } else {
          data.matchId = this.editForm.matchId;
        }
      } else {
        data.infoPointId = this.editForm.infoPointId;
        // 修改时类型与归属只读，球队集合为空表示保持现有关系不变
        if (this.editForm.infoPointType === "T") {
          data.teamIds = this.editForm.teamIds || [];
        }
      }
      return data;
    },
    /** 提交按钮 */
    submitEditForm() {
      this.$refs["editForm"].validate(valid => {
        if (!valid) {
          return;
        }
        const isAdd = this.editMode === "add";
        const data = this.buildSubmitData();
        this.submitting = true;
        const request = isAdd ? addInfoPoint(data) : updateInfoPoint(data);
        request.then(response => {
          this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
          this.handleBackToList();
        }).catch(() => {
          // 保存失败时留在录入场景并保留已填内容，可直接重试
        }).finally(() => {
          this.submitting = false;
        });
      });
    },
    /** 启停按钮操作：状态动作成功后重新拉取列表 */
    handleChangeStatus(row) {
      const targetStatus = row.pointStatus === "0" ? "1" : "0";
      const actionText = targetStatus === "0" ? "启用" : "停用";
      this.$modal.confirm(`是否确认${actionText}信息点编号为"${row.infoPointId}"的数据项？`).then(() => {
        return changeInfoPointStatus({ infoPointId: row.infoPointId, pointStatus: targetStatus });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess(`${actionText}成功`);
      }).catch(() => { });
    },
    /** 详情按钮操作：只读展示完整详情 */
    handleViewDetail(row) {
      this.detailLoading = true;
      this.detailModel = {};
      this.detailOpen = true;
      getInfoPoint(row.infoPointId).then(response => {
        this.detailModel = response.data || {};
      }).finally(() => {
        this.detailLoading = false;
      });
    },
    // 有效性场景：所选比赛变化后查询
    handleValidMatchChange(val) {
      if (val == null || val === "") {
        this.validResultList = [];
        return;
      }
      this.getValidList(val);
    },
    // 查询比赛的有效信息点（只读，不录入、不执行分析）
    getValidList(matchId) {
      this.validLoading = true;
      listValidInfoPoint(matchId).then(response => {
        this.validResultList = response.data || [];
      }).finally(() => {
        this.validLoading = false;
      });
    },
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

/* 录入场景头部 */
.info-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.info-edit-header-left {
  display: flex;
  align-items: center;
}

.info-edit-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-edit-form {
  padding: 20px 20px 4px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 录入场景底部按钮 */
.info-edit-footer {
  margin-top: 16px;
  padding: 14px 20px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 详情对话框 */
.info-detail-body {
  min-height: 120px;
}

.info-detail-info-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.info-detail-info-item {
  min-width: 180px;
  margin-right: 32px;
  margin-bottom: 8px;
}

.info-detail-info-label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
}

.info-detail-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.info-detail-field {
  margin-bottom: 12px;
}

.info-detail-field-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #909399;
}

.info-detail-field-value {
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.info-detail-team-rel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #303133;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

/* 有效性场景 */
.info-valid-search {
  margin-bottom: 16px;
}

.info-valid-search .el-select {
  width: 360px;
}

.info-valid-group {
  margin-bottom: 16px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-valid-group-header {
  margin-bottom: 12px;
}

.info-valid-group-title {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.info-valid-group-title i {
  margin-right: 6px;
}

.info-valid-group-title.success {
  color: #2ecc71;
}

.info-valid-group-title.danger {
  color: #ff5a5f;
}
</style>
