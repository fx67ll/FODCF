<template>
  <div class="app-container return-page dl-page">
    <div class="return-hero">
      <div class="return-hero-left">
        <div class="return-hero-icon"><i class="el-icon-magic-stick"></i></div>
        <div>
          <h2>回报组合工作区</h2>
          <p>默认展示已采用且未核验的有效组合；可查看全部筛选结果或进入独立页面发起异步分析</p>
        </div>
      </div>
      <div class="return-hero-actions">
        <el-button type="primary" plain icon="el-icon-magic-stick" size="mini" @click="openAnalysisPage"
          v-hasPermi="['dortmund:return:generate']">创建分析批次</el-button>
        <el-button type="success" plain icon="el-icon-time" size="mini" @click="openHistoryDrawer">
          查看历史记录
        </el-button>
        <dortmund-export-menu title="回报组合" endpoint="/dortmund/return/export" :params="buildCombinationExportParams"
          permission="dortmund:return:export" file-prefix="dortmund-return-combination" button-label="导出组合记录" />
        <el-button type="danger" plain icon="el-icon-delete" size="mini" @click="openOrphanImageDrawer"
          v-hasPermi="['dortmund:return:image:query']">孤儿图片清理</el-button>
      </div>
    </div>

    <transition name="dl-filter">
      <el-form ref="combinationQueryForm" :model="combinationQuery" class="dl-filter" size="small" :inline="true">
        <el-form-item label="搜索组合" prop="keyword" label-width="auto" v-if="isMoreCombinationQuery">
          <el-input v-model="combinationQuery.keyword" placeholder="请输入组合标题或编码" clearable style="width: 220px"
            @input="handleCombinationFilterInput" @keyup.enter.native="handleCombinationQuery" />
        </el-form-item>
        <el-form-item label="关联比赛" prop="matchId" label-width="auto" v-if="isMoreCombinationQuery">
          <el-input :value="combinationMatchLabel" readonly clearable placeholder="请选择关联比赛"
            prefix-icon="el-icon-football" style="width: 220px" @click.native="openCombinationMatchQuery"
            @clear="clearCombinationMatch" />
        </el-form-item>
        <el-form-item label="核验状态" prop="verificationStatus" label-width="auto">
          <el-select v-model="combinationQuery.verificationStatus" placeholder="请选择核验状态" clearable style="width: 220px"
            popper-class="dortmund-theme-popper" @change="handleCombinationQuery">
            <el-option label="已达成" value="Y" />
            <el-option label="未达成" value="N" />
            <el-option label="未核验" value="U" />
          </el-select>
        </el-form-item>
        <el-form-item label="采用状态" prop="adoptedFlag" label-width="auto">
          <el-select v-model="combinationQuery.adoptedFlag" placeholder="请选择采用状态" clearable style="width: 220px"
            popper-class="dortmund-theme-popper" @change="handleCombinationQuery">
            <el-option label="未采用" value="N" />
            <el-option label="已采用" value="Y" />
          </el-select>
        </el-form-item>
        <el-form-item label="生成模式" prop="generationMode" label-width="auto" v-if="isMoreCombinationQuery">
          <el-select v-model="combinationQuery.generationMode" placeholder="请选择生成模式" clearable style="width: 220px"
            popper-class="dortmund-theme-popper" @change="handleCombinationQuery">
            <el-option label="主观模式" value="S" />
            <el-option label="AI 模式" value="A" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次状态" prop="generationStatus" label-width="auto" v-if="isMoreCombinationQuery">
          <el-select v-model="combinationQuery.generationStatus" placeholder="请选择批次状态" clearable style="width: 220px"
            popper-class="dortmund-theme-popper" @change="handleCombinationQuery">
            <el-option v-for="item in dict.type.fx67ll_ai_analysis_status || []" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核时间" label-width="auto" v-if="isMoreCombinationQuery">
          <el-date-picker v-model="combinationAuditDateRange" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss"
            range-separator="-" popper-class="dortmund-theme-popper" start-placeholder="开始时间" end-placeholder="结束时间"
            style="width: 360px" clearable @change="handleCombinationQuery" />
        </el-form-item>
        <el-form-item label="创建时间" label-width="auto" v-if="isMoreCombinationQuery">
          <el-date-picker v-model="combinationDateRange" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss"
            range-separator="-" popper-class="dortmund-theme-popper" start-placeholder="开始时间" end-placeholder="结束时间"
            style="width: 360px" clearable @change="handleCombinationQuery" />
        </el-form-item>
        <el-form-item label="更新时间" label-width="auto" v-if="isMoreCombinationQuery">
          <el-date-picker v-model="combinationUpdateDateRange" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss"
            range-separator="-" popper-class="dortmund-theme-popper" start-placeholder="开始时间" end-placeholder="结束时间"
            style="width: 360px" clearable @change="handleCombinationQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="handleCombinationQuery">搜索</el-button>
          <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetCombinationQuery">重置</el-button>
          <el-button v-if="isResetStatus" type="warning" icon="el-icon-scissors" size="mini"
            @click="handleViewValidData">只看有效数据</el-button>
          <el-button type="success" class="dl-more-btn"
            :icon="isMoreCombinationQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
            @click="handleMoreCombinationQuery">
            {{ isMoreCombinationQuery ? "关闭高级搜索" : "使用高级搜索" }}
          </el-button>
        </el-form-item>
      </el-form>
    </transition>

    <div ref="combinationCard" class="combination-card">
      <div class="combination-head dl-toolbar">
        <div class="return-card-title">
          <i class="el-icon-collection"></i>回报组合列表
          <span class="return-card-count">{{ combinationTotal }} 条</span>
          <span class="combination-selected-count" v-if="selectedCombinationIds.length">
            已选 {{ selectedCombinationIds.length }} 条
          </span>
        </div>
        <div class="combination-head-actions">
          <div class="combination-sort-controls">
            <span class="combination-sort-label">排序</span>
            <el-select v-model="combinationQuery.sortField" size="mini" style="width: 122px"
              popper-class="dortmund-theme-popper">
              <el-option label="创建时间" value="createTime" />
              <el-option label="预计回报" value="estimatedReturn" />
              <el-option label="偏差金额" value="deviationAmount" />
              <el-option label="组合倍率" value="combinedOdds" />
              <el-option label="场次" value="matchCount" />
              <el-option label="审核时间" value="reviewTime" />
            </el-select>
            <el-select v-model="combinationQuery.sortOrder" size="mini" style="width: 82px"
              popper-class="dortmund-theme-popper">
              <el-option label="降序" value="desc" />
              <el-option label="升序" value="asc" />
            </el-select>
          </div>
          <div class="combination-batch-actions">
            <el-button type="success" plain size="mini" icon="el-icon-check" :loading="batchAdoptLoading"
              :disabled="!selectedCombinationIds.length" @click="handleBatchAdopt"
              v-hasPermi="['dortmund:return:review']">
              批量采用
            </el-button>
            <el-button type="primary" plain size="mini" icon="el-icon-circle-check" :loading="batchVerifyLoading"
              :disabled="!selectedCombinationIds.length" @click="handleBatchVerify"
              v-hasPermi="['dortmund:return:review']">
              批量核验
            </el-button>
          </div>
        </div>
      </div>
      <div class="history-table-wrap combination-table-wrap">
        <el-table ref="combinationTable" v-loading="combinationListLoading" :data="combinationList"
          row-key="combinationId" class="history-table combination-table"
          @selection-change="handleCombinationSelectionChange">
          <el-table-column type="selection" width="46" fixed="left" />
          <el-table-column label="回报组合标题" prop="combinationTitle" align="center" width="330" show-overflow-tooltip
            fixed="left" />
          <el-table-column label="场次" align="center" width="80" fixed="left">
            <template slot-scope="scope">
              <el-button v-if="scope.row.matchCount > 0" type="text" class="dortmund-theme-text combination-match-count"
                :title="`查看组合内 ${scope.row.matchCount || 0} 场比赛`" @click="handleCombinationDetail(scope.row)"
                v-hasPermi="['dortmund:return:query']">
                {{ scope.row.matchCount }}
              </el-button>
              <span v-else class="combination-match-count is-empty">0</span>
            </template>
          </el-table-column>
          <el-table-column label="组合倍率" align="center" prop="combinedOdds" width="100" />
          <el-table-column label="预计回报" align="center" width="100">
            <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.estimatedReturn) }}</template>
          </el-table-column>
          <el-table-column label="偏差金额" align="center" width="100">
            <template slot-scope="scope">
              <span :class="['deviation-amount', deviationTone(scope.row.deviationAmount)]">
                <i v-if="deviationIcon(scope.row.deviationAmount)"
                  :class="deviationIcon(scope.row.deviationAmount)"></i>
                {{ formatMoneyDisplay(scope.row.deviationAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="AI置信度" align="center" width="100">
            <template slot-scope="scope">
              <span :class="['combination-confidence', { 'is-empty': scope.row.aiConfidence == null }]">
                {{ formatConfidence(scope.row.aiConfidence) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="AI风险提示" align="center" prop="riskNotes" min-width="230" show-overflow-tooltip>
            <template slot-scope="scope">
              <span :class="['combination-risk-hint', { 'is-empty': !scope.row.riskNotes }]">
                {{ scope.row.riskNotes || "-" }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="核验状态" align="center" width="100" fixed="right">
            <template slot-scope="scope">
              <dortmund-verification-status-tag :status="scope.row.verificationStatus" />
            </template>
          </el-table-column>
          <el-table-column label="采用状态" align="center" width="100" fixed="right">
            <template slot-scope="scope">
              <el-tag :type="scope.row.adoptedFlag === 'Y' ? 'success' : 'info'" size="mini">
                {{ scope.row.adoptedFlag === "Y" ? "已采用" : "未采用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="组合编码" prop="combinationCode" align="center" width="200" show-overflow-tooltip />
          <el-table-column label="模式" align="center" width="100">
            <template slot-scope="scope">{{ formatGenerationMode(scope.row.generationMode) }}</template>
          </el-table-column>
          <el-table-column label="批次状态" align="center" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_ai_analysis_status || []" :value="scope.row.generationStatus" />
            </template>
          </el-table-column>
          <el-table-column label="审核时间" align="center" width="160" class-name="dortmund-nowrap-cell">
            <template slot-scope="scope">{{ parseTime(scope.row.reviewTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-"
            }}</template>
          </el-table-column>
          <el-table-column label="记录创建者" align="center" prop="createBy" width="100" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatAuditActor(scope.row.createBy) }}</template>
          </el-table-column>
          <el-table-column label="记录创建时间" align="center" width="150" class-name="dortmund-nowrap-cell">
            <template slot-scope="scope">{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-"
            }}</template>
          </el-table-column>
          <el-table-column label="记录更新者" align="center" prop="updateBy" width="100" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatAuditActor(scope.row.updateBy) }}</template>
          </el-table-column>
          <el-table-column label="记录更新时间" align="center" width="150" class-name="dortmund-nowrap-cell">
            <template slot-scope="scope">{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-"
            }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="122" fixed="right">
            <template slot-scope="scope">
              <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
                @click="handleCombinationDetail(scope.row)" v-hasPermi="['dortmund:return:query']" />
              <dortmund-action-button v-if="scope.row.adoptedFlag !== 'Y'" label="采用" icon="el-icon-check"
                action="adopt" :loading="reviewingId === scope.row.combinationId" @click="handleReview(scope.row, 'Y')"
                v-hasPermi="['dortmund:return:review']" />
              <dortmund-action-button v-else label="不采用" icon="el-icon-close" action="reject"
                :loading="reviewingId === scope.row.combinationId" @click="handleReview(scope.row, 'N')"
                v-hasPermi="['dortmund:return:review']" />
              <dortmund-action-button v-if="scope.row.adoptedFlag === 'Y'" label="核验倍率赛果" icon="el-icon-circle-check"
                action="verify" :loading="verifyingId === scope.row.combinationId" @click="handleVerify(scope.row)"
                v-hasPermi="['dortmund:return:review']" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <pagination v-show="combinationTotal > 0" :total="combinationTotal" popper-class="dortmund-theme-popper"
        :page.sync="combinationQuery.pageNum" :limit.sync="combinationQuery.pageSize" :page-sizes="pageSizes"
        @pagination="getCombinationList" />
      <div v-if="!combinationListLoading && !combinationList.length" class="history-empty combination-empty">
        <i class="el-icon-collection"></i>
        <span>暂无符合筛选条件的回报组合</span>
        <el-button type="text" class="dortmund-theme-text" @click="resetCombinationQuery">清除筛选</el-button>
      </div>
    </div>

    <dortmund-detail-drawer :visible.sync="generationVisible" title="生成批次详情"
      :subtitle="generationDetail.generationCode ? `批次编码 · ${generationDetail.generationCode}` : '查看批次状态、业务输入与生成组合'"
      icon="el-icon-time" tone="green" size="820px" :loading="generationLoading" feature="return">
      <dortmund-detail-card title="批次概览" icon="el-icon-data-analysis" tone="green">
        <dortmund-detail-block variant='metric' tone='green' :items='generationMetricItems' />
      </dortmund-detail-card>

      <dortmund-detail-card title="批次生命周期" icon="el-icon-time" tone="green" subtitle="独立追踪任务创建、证据流程与批次完成节点">
        <dortmund-detail-block variant='timeline' tone='green' :items='generationLifecycle' />
        <el-alert v-if="generationDetail.generationStatus === '2'" class="return-detail-alert-block" type="error"
          :closable="false" show-icon :title="generationDetail.generationRemark || '生成失败，没有产生可用的半截数据。'" />
        <el-alert v-if="generationDetail.generationStatus === '3'" class="return-detail-alert-block" type="warning"
          :closable="false" show-icon title="人工AI任务已创建。导出任务已内嵌完整处理提示词，交给第三方AI后再导入标准化结果完成批次。" />
        <el-alert v-if="generationDetail.aiEvidenceError" class="return-detail-alert-block" type="error"
          :closable="false" show-icon :title="`证据流程：${generationDetail.aiEvidenceError}`" />
      </dortmund-detail-card>

      <dortmund-detail-card v-if="showAiWorkflow" title="AI分析工作流" icon="el-icon-share" tone="green"
        subtitle="追溯规划、检索、分析、校验与落库；异常和偏置会给出诊断提示">
        <return-ai-workflow :generation="generationDetail" :can-view-raw="hasRemarkQueryPermission" />
      </dortmund-detail-card>

      <manual-ai-task-panel ref="manualAiTaskPanel" :generation-id="generationDetail.generationId || null"
        :generation-code="generationDetail.generationCode || ''"
        :generation-status="generationDetail.generationStatus || null"
        :result-source="generationDetail.resultSource || ''" :generated-count="generationDetail.generatedCount || 0"
        @imported="handleManualImported" />

      <dortmund-detail-card v-if="generationInputSummary" title="业务输入摘要" icon="el-icon-document" tone="green">
        <pre class="return-input-summary">{{ generationInputSummary }}</pre>
      </dortmund-detail-card>

      <dortmund-detail-card title="批次组合" icon="el-icon-collection-tag" tone="green"
        :subtitle="`共 ${(generationDetail.combinations || []).length} 条`">
        <el-table :data="generationDetail.combinations || []" size="small" empty-text="暂无组合">
          <el-table-column label="回报组合标题" prop="combinationTitle" header-align="center" width="260"
            show-overflow-tooltip />
          <el-table-column label="预计回报" header-align="center" align="center" prop="estimatedReturn" width="100" />
          <el-table-column label="偏差金额" header-align="center" align="center" width="100">
            <template slot-scope="scope">
              <span :class="['deviation-amount', deviationTone(scope.row.deviationAmount)]">
                <i v-if="deviationIcon(scope.row.deviationAmount)"
                  :class="deviationIcon(scope.row.deviationAmount)"></i>
                {{ formatMoneyDisplay(scope.row.deviationAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="AI置信度" header-align="center" align="center" width="100">
            <template slot-scope="scope">{{ formatConfidence(scope.row.aiConfidence) }}</template>
          </el-table-column>
          <el-table-column label="AI风险提示" header-align="center" prop="riskNotes" min-width="160"
            show-overflow-tooltip />
          <el-table-column label="采用状态" header-align="center" align="center" width="104" fixed="right">
            <template slot-scope="scope">
              <el-tag :type="scope.row.adoptedFlag === 'Y' ? 'success' : 'info'" size="mini">
                {{ scope.row.adoptedFlag === "Y" ? "已采用" : "未采用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="核验状态" header-align="center" align="center" width="110" fixed="right">
            <template slot-scope="scope">
              <dortmund-verification-status-tag :status="scope.row.verificationStatus" />
            </template>
          </el-table-column>
          <el-table-column label="操作" header-align="center" align="center" class-name="dortmund-action-column"
            width="68" fixed="right">
            <template slot-scope="scope">
              <dortmund-action-button label="查看" icon="el-icon-document" action="detail"
                @click="handleCombinationDetail(scope.row)" />
            </template>
          </el-table-column>
        </el-table>
      </dortmund-detail-card>
      <template slot="footer">
        <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="generationVisible = false">关闭</el-button>
      </template>
    </dortmund-detail-drawer>

    <el-drawer :visible.sync="historyVisible" title="回报组合历史批次" size="1044px" append-to-body destroy-on-close
      custom-class="return-drawer return-history-drawer" :wrapper-closable="false" @opened="handleBatchQuery">
      <template slot="title">
        <div class="return-drawer-heading">
          <div class="return-drawer-heading-icon"><i class="el-icon-time"></i></div>
          <div class="return-drawer-heading-copy">
            <strong>回报组合历史批次</strong>
            <span>查看生成记录、处理状态与组合数量</span>
          </div>
          <div class="return-drawer-heading-tools">
            <span class="return-drawer-chip">共 {{ batchTotal }} 批</span>
            <dortmund-export-menu title="回报组合批次" endpoint="/dortmund/return/generation/export"
              :params="buildBatchExportParams" permission="dortmund:return:export"
              file-prefix="dortmund-return-generation" button-label="导出批次" />
          </div>
        </div>
      </template>
      <div class="return-drawer-body dl-page">
        <el-form ref="batchQueryForm" :model="batchQuery" class="history-batch-filter dl-filter" size="small"
          :inline="true">
          <el-form-item label="批次状态" prop="generationStatus" label-width="auto">
            <el-select v-model="batchQuery.generationStatus" placeholder="请选择批次状态" clearable style="width: 140px"
              popper-class="dortmund-theme-popper" @change="handleBatchQuery">
              <el-option v-for="item in dict.type.fx67ll_ai_analysis_status || []" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="生成模式" prop="generationMode" label-width="auto">
            <el-select v-model="batchQuery.generationMode" placeholder="请选择生成模式" clearable style="width: 160px"
              popper-class="dortmund-theme-popper" @change="handleBatchQuery">
              <el-option label="主观模式" value="S" />
              <el-option label="AI 模式" value="A" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务来源" prop="resultSource" label-width="auto" v-if="isMoreBatchQuery">
            <el-select v-model="batchQuery.resultSource" placeholder="请选择任务来源" clearable style="width: 150px"
              popper-class="dortmund-theme-popper" @change="handleBatchQuery">
              <el-option label="自动AI批次" value="A" />
              <el-option label="人工AI批次" value="M" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" label-width="auto" v-if="isMoreBatchQuery">
            <el-date-picker v-model="batchDateRange" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss"
              range-separator="-" popper-class="dortmund-theme-popper" start-placeholder="开始时间" end-placeholder="结束时间"
              style="width: 360px" clearable @change="handleBatchQuery" />
          </el-form-item>
          <el-form-item class="history-batch-actions">
            <el-button type="primary" icon="el-icon-search" size="mini" :loading="batchLoading"
              @click="handleBatchQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" :disabled="batchLoading"
              @click="resetBatchQuery">重置</el-button>
            <el-button type="success" class="dl-more-btn"
              :icon="isMoreBatchQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
              @click="handleMoreBatchQuery">
              {{ isMoreBatchQuery ? "关闭高级搜索" : "使用高级搜索" }}
            </el-button>
          </el-form-item>
        </el-form>
        <div class="history-table-card">
          <div class="history-table-heading">
            <div>
              <strong>生成记录</strong>
              <span v-if="batchList.length">当前页 {{ batchList.length }} 条</span>
            </div>
            <i class="el-icon-sort"></i>
          </div>
          <div class="history-table-wrap">
            <el-table v-loading="batchLoading" :data="batchList" row-key="generationId" size="small"
              class="history-table">
              <el-table-column label="批次编码" prop="generationCode" min-width="170" show-overflow-tooltip fixed="left" />
              <el-table-column label="模式" align="center" width="108">
                <template slot-scope="scope">{{ formatGenerationMode(scope.row.generationMode) }}</template>
              </el-table-column>
              <el-table-column label="状态" align="center" prop="generationStatus" width="100">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_ai_analysis_status" :value="scope.row.generationStatus" />
                </template>
              </el-table-column>
              <el-table-column label="批次类型" align="center" width="150">
                <template slot-scope="scope">
                  <el-tag :type="generationTaskType(scope.row).type" size="mini">
                    {{ generationTaskType(scope.row).label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="基础金额" align="center" prop="inputAmount" width="110" />
              <el-table-column label="目标金额" align="center" prop="targetAmount" width="110" />
              <el-table-column label="组合数" align="center" prop="generatedCount" width="84" />
              <el-table-column label="完成时间" align="center" width="160" class-name="dortmund-nowrap-cell">
                <template slot-scope="scope">{{ parseTime(scope.row.finishedTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-"
                }}</template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="dortmund-action-column" width="122" fixed="right">
                <template slot-scope="scope">
                  <dortmund-action-button label="详情" icon="el-icon-document" action="detail"
                    v-hasPermi="['dortmund:return:query']" @click="handleGenerationDetail(scope.row)" />
                  <dortmund-action-button v-if="isManualTaskRow(scope.row)" label="导出任务" icon="el-icon-download"
                    action="download" v-hasPermi="['dortmund:return:generate']"
                    @click="handleManualTaskExport(scope.row)" />
                  <dortmund-action-button v-if="isManualTaskRow(scope.row)" label="导入结果" icon="el-icon-upload2"
                    action="upload" v-hasPermi="['dortmund:return:generate']"
                    @click="handleManualTaskImport(scope.row)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
          <pagination v-show="batchTotal > 0" :total="batchTotal" popper-class="dortmund-theme-popper"
            :page.sync="batchQuery.pageNum" :limit.sync="batchQuery.pageSize" :page-sizes="pageSizes"
            @pagination="getBatchList" />
          <div v-if="!batchLoading && !batchList.length" class="history-empty">
            <i class="el-icon-time"></i>
            <span>暂无符合条件的历史批次</span>
            <el-button type="text" class="dortmund-theme-text" @click="resetBatchQuery">清除筛选</el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer :visible.sync="orphanImageVisible" title="孤儿图片清理" size="980px" append-to-body destroy-on-close
      custom-class="return-drawer return-orphan-drawer" :wrapper-closable="false" @opened="initializeOrphanQuery">
      <template slot="title">
        <div class="return-drawer-heading">
          <div class="return-drawer-heading-icon is-amber"><i class="el-icon-delete"></i></div>
          <div class="return-drawer-heading-copy">
            <strong>孤儿图片清理</strong>
            <span>回收过期、失效、待删除与隔离图片，已采用组合图片不受影响</span>
          </div>
          <div class="return-drawer-heading-tools">
            <span class="return-drawer-chip"><b>{{ orphanImageList.length }}</b> 张匹配</span>
            <span class="return-drawer-chip"><b>{{ selectedOrphanIds.length }}</b> 张已选</span>
          </div>
        </div>
      </template>
      <div class="return-drawer-body dl-page">
        <div class="orphan-legend">
          <el-tag size="mini" type="info">T 临时未提交</el-tag>
          <el-tag size="mini" type="warning">B 关联失效</el-tag>
          <el-tag size="mini" type="danger">D 待删除</el-tag>
          <el-tag size="mini" type="warning">Q 已隔离</el-tag>
          <span><i class="el-icon-info"></i> 查询跨度最多 366 天，单次最多删除 100 张</span>
        </div>
        <el-form class="orphan-filter-card dl-filter" size="small" :inline="true" @submit.native.prevent>
          <el-form-item label="上传日期" label-width="auto">
            <el-date-picker v-model="orphanDateRange" size="small" type="daterange" value-format="yyyy-MM-dd"
              popper-class="dortmund-theme-popper" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable @change="handleOrphanDateChange" />
          </el-form-item>
          <el-form-item class="orphan-filter-actions">
            <el-button type="primary" size="mini" icon="el-icon-search" :loading="orphanSearchLoading"
              @click="handleOrphanImageSearch">搜索孤儿图片</el-button>
            <el-button type="danger" plain size="mini" icon="el-icon-delete" :loading="orphanDeleteLoading"
              :disabled="!selectedOrphanIds.length" @click="handleDeleteSelectedOrphans"
              v-hasPermi="['dortmund:return:image:remove']">删除选中图片</el-button>
          </el-form-item>
        </el-form>
        <div class="orphan-result" v-if="orphanCleanupResult">
          <i class="el-icon-circle-check"></i>
          <span>本次请求 {{ orphanCleanupResult.requestedCount }} 张，成功 {{ orphanCleanupResult.deletedCount }} 张，
            失败 {{ orphanCleanupResult.failedCount }} 张。</span>
          <span class="orphan-result-failed" v-if="orphanCleanupResult.failedCount">
            失败对象键：{{ (orphanCleanupResult.failedObjectKeys || []).join("、") }}
          </span>
        </div>
        <div class="history-table-wrap orphan-table-wrap">
          <el-table ref="orphanTable" v-loading="orphanSearchLoading" :data="orphanImageList" row-key="imageId"
            size="small" class="history-table orphan-table" @selection-change="handleOrphanSelectionChange">
            <el-table-column type="selection" width="46" fixed="left" />
            <el-table-column label="预览" align="center" width="80">
              <template slot-scope="scope">
                <el-image class="orphan-thumb" :src="baseUrl + scope.row.objectKey" fit="cover"
                  :preview-src-list="orphanImagePreviewList" />
              </template>
            </el-table-column>
            <el-table-column label="原文件名" prop="originalName" min-width="150" show-overflow-tooltip />
            <el-table-column label="状态" align="center" width="112">
              <template slot-scope="scope">
                <el-tag :type="orphanStateTagType(scope.row.imageState)" size="mini">
                  {{ formatOrphanImageState(scope.row.imageState) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="对象键" prop="objectKey" min-width="210" show-overflow-tooltip />
            <el-table-column label="大小" align="center" width="92">
              <template slot-scope="scope">{{ formatFileSize(scope.row.fileSize) }}</template>
            </el-table-column>
            <el-table-column label="上传时间" align="center" width="150" class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-"
              }}</template>
            </el-table-column>
            <el-table-column label="过期/重试" align="center" width="150" class-name="dortmund-nowrap-cell">
              <template slot-scope="scope">
                {{ parseTime(scope.row.nextRetryTime || scope.row.expireTime, "{y}-{m}-{d} {h}:{i}:{s}") || "-" }}
              </template>
            </el-table-column>
            <el-table-column label="删除尝试" align="center" prop="deleteAttempts" width="92" />
            <el-table-column label="最近错误" prop="lastError" min-width="160" show-overflow-tooltip />
          </el-table>
          <div v-if="!orphanSearchLoading && !orphanImageList.length" class="history-empty orphan-empty">
            <i class="el-icon-picture-outline"></i>
            <span>所选日期范围内没有可回收的孤儿图片</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <dortmund-detail-drawer :visible.sync="combinationVisible" title="回报组合详情"
      :subtitle="combinationDetail.combinationCode ? `组合编码 · ${combinationDetail.combinationCode}` : (combinationIsManual ? '查看组合指标、第三方AI分析与逐场理由' : '查看组合指标、证据链、图片与逐场明细')"
      icon="el-icon-connection" tone="green" size="780px" :loading="combinationLoading" feature="return">
      <return-manual-result v-if="combinationIsManual" :combination="combinationDetail" :batch="combinationBatchContext"
        :can-view-reason="hasRemarkQueryPermission" />
      <return-analysis-result v-else :combination="combinationDetail" :batch="combinationBatchContext"
        :can-view-reason="hasRemarkQueryPermission" />

      <dortmund-detail-card v-if="hasImageQueryPermission" title="组合图片" icon="el-icon-picture-outline" tone="amber">
        <return-image-upload :combination-id="combinationDetail.combinationId || null"
          :images="combinationDetail.images || []" :adopted-flag="combinationDetail.adoptedFlag || ''"
          :plan-linked="Boolean(combinationDetail.planLinked)" :can-upload="hasImageUploadPermission"
          @changed="refreshCombinationDetail(false)" />
      </dortmund-detail-card>

      <template slot="footer">
        <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="combinationVisible = false">关闭</el-button>
      </template>
    </dortmund-detail-drawer>

    <dortmund-match-selector-modal :visible.sync="combinationMatchSelectorVisible"
      :selected-items="combinationMatch ? [combinationMatch] : []" @confirm="handleCombinationMatchConfirm" />
  </div>
</template>

<script>
import { formatMoneyDisplay } from "@/utils/fx67ll/utils";
import { checkPermi } from "@/utils/common/permission";
import { getMatch } from "@/api/fx67ll/dortmund/match";
import {
  adoptCombination,
  batchAdoptCombinations,
  batchVerifyCombinations,
  deleteOrphanReturnImages,
  getCombination,
  getGeneration,
  getManualTask,
  listCombination,
  listGeneration,
  listOrphanReturnImages,
  rejectCombination,
  verifyCombination,
} from "@/api/fx67ll/dortmund/returnCombination";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundActionButton from "@/views/fx67ll/dortmund/other/component/DortmundActionButton/index";
import DortmundVerificationStatusTag
  from "@/views/fx67ll/dortmund/other/component/DortmundVerificationStatusTag/index";
import DortmundExportMenu from "@/views/fx67ll/dortmund/other/component/DortmundExportMenu/index";
import ReturnImageUpload from "./components/ReturnImageUpload/index";
import ManualAiTaskPanel from "./components/ManualAiTaskPanel/index";
import ReturnAiWorkflow from "./components/ReturnAiWorkflow/index";
import ReturnAnalysisResult from "./components/ReturnAnalysisResult/index";
import ReturnManualResult from "./components/ReturnManualResult/index";
import {
  DORTMUND_DISPLAY_FORMAT,
  DORTMUND_PAGINATION,
  DORTMUND_RETURN_VERIFICATION_STATUS,
  formatPreferenceDimensionSummary,
  getReturnVerificationOption,
  getPreferenceLabel,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";

import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";
export default {
  name: "DortmundReturnCombination",
  dicts: ["fx67ll_dortmund_odds_type", "fx67ll_ai_analysis_status"],
  components: {
    DortmundMatchSelectorModal, ReturnImageUpload, ManualAiTaskPanel,
    ReturnAiWorkflow, ReturnAnalysisResult, ReturnManualResult,
    DortmundDetailDrawer, DortmundDetailCard, DortmundActionButton, DortmundDetailBlock,
    DortmundVerificationStatusTag, DortmundExportMenu,
  },
  data() {
    return {
      batchList: [],
      batchTotal: 0,
      batchLoading: false,
      historyVisible: false,
      isMoreBatchQuery: false,
      batchDateRange: [],
      batchQuery: {
        pageNum: 1,
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
        generationStatus: null,
        generationMode: null,
        resultSource: null,
        beginCreateTime: null,
        endCreateTime: null,
      },
      generationVisible: false,
      generationLoading: false,
      generationDetail: {},
      combinationVisible: false,
      combinationLoading: false,
      combinationDetail: {},
      combinationList: [],
      combinationTotal: 0,
      combinationListLoading: false,
      combinationDateRange: [],
      combinationAuditDateRange: [],
      combinationUpdateDateRange: [],
      isMoreCombinationQuery: false,
      isResetStatus: false,
      combinationFilterTimer: null,
      combinationMatch: null,
      combinationMatchSelectorVisible: false,
      combinationQuery: {
        pageNum: 1,
        pageSize: DORTMUND_PAGINATION.defaultPageSize,
        keyword: null,
        generationMode: null,
        adoptedFlag: "Y",
        verificationStatus: "U",
        generationStatus: null,
        matchId: null,
        sortField: "createTime",
        sortOrder: "desc",
        beginCreateTime: null,
        endCreateTime: null,
        beginReviewTime: null,
        endReviewTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      pageSizes: DORTMUND_PAGINATION.pageSizes,
      selectedCombinationIds: [],
      batchAdoptLoading: false,
      batchVerifyLoading: false,
      reviewingId: null,
      verifyingId: null,
      orphanImageVisible: false,
      orphanDateRange: [],
      orphanImageList: [],
      selectedOrphanIds: [],
      orphanSearchLoading: false,
      orphanDeleteLoading: false,
      orphanCleanupResult: null,
    };
  },
  computed: {
    hasImageQueryPermission() {
      return checkPermi(["dortmund:return:image:query"]);
    },
    generationMetricItems() {
      return [
        { label: '生成模式', value: this.formatGenerationMode(this.generationDetail.generationMode), icon: 'el-icon-magic-stick' },
        { label: '批次状态', value: this.formatGenerationStatus(this.generationDetail.generationStatus), icon: 'el-icon-data-analysis', state: this.generationDetail.generationStatus === '1' ? 'success' : (this.generationDetail.generationStatus === '2' ? 'danger' : 'warning') },
        { label: '结果来源', value: this.formatResultSource(this.generationDetail.resultSource), icon: 'el-icon-connection' },
        { label: '基础金额', value: this.generationDetail.inputAmount || '-', icon: 'el-icon-money' },
        { label: '目标金额', value: this.generationDetail.targetAmount || '-', icon: 'el-icon-aim' },
        { label: '组合数', value: this.generationDetail.generatedCount || 0, icon: 'el-icon-collection-tag' },
        { label: '完成时间', value: this.parseTime(this.generationDetail.finishedTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-', icon: 'el-icon-time' },
      ];
    },
    generationLifecycle() {
      const items = [
        { label: '任务创建', value: this.parseTime(this.generationDetail.createTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-', icon: 'el-icon-time' },
        { label: '批次完成', value: this.parseTime(this.generationDetail.finishedTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-', icon: 'el-icon-circle-check', state: this.generationDetail.generationStatus === '1' ? 'success' : 'warning' },
      ];
      if (!this.isManualGeneration) {
        items.splice(1, 0, {
          label: '证据流程',
          value: this.generationDetail.generationMode === 'A'
            ? this.formatEvidenceStatus(this.generationDetail.aiEvidenceStatus) : '非AI模式',
          icon: 'el-icon-share',
          state: this.generationDetail.aiEvidenceError ? 'danger' : 'success',
        });
      }
      return items;
    },
    hasImageUploadPermission() {
      return checkPermi(["dortmund:return:image:upload"]);
    },
    hasRemarkQueryPermission() {
      return checkPermi(["dortmund:return:remark:query"]);
    },
    combinationBatchContext() {
      if (!this.generationDetail || !this.combinationDetail) return null;
      if (!this.generationDetail.generationId || !this.combinationDetail.generationId) return null;
      return String(this.generationDetail.generationId) === String(this.combinationDetail.generationId)
        ? this.generationDetail : null;
    },
    isManualGeneration() {
      return String(this.generationDetail.resultSource || '') === 'M';
    },
    showAiWorkflow() {
      // 待人工批次和人工来源批次都不展示自动AI工作流，避免详情页把人工任务误判为自动分析。
      if (!this.generationDetail.generationId || this.isManualGeneration) return false;
      return String(this.generationDetail.generationStatus || '') !== '3';
    },
    combinationIsManual() {
      const combinationSource = String(this.combinationDetail.resultSource || '');
      if (combinationSource) return combinationSource === 'M';
      if (this.combinationBatchContext) {
        return String(this.combinationBatchContext.resultSource || '') === 'M';
      }
      return String(this.generationDetail.generationId || '') === String(this.combinationDetail.generationId || '')
        && this.isManualGeneration;
    },
    generationInputSummary() {
      const snapshot = this.generationDetail.requestSnapshot;
      if (!snapshot) {
        return "";
      }
      try {
        const value = JSON.parse(snapshot);
        const dimensionSummary = formatPreferenceDimensionSummary(value.preferenceDimensions);
        return `模式：${this.formatGenerationMode(value.generationMode)}\n偏好：${getPreferenceLabel(value.preferenceCode)}`
          + `${dimensionSummary ? `\n组合维度：${dimensionSummary}` : ""}`
          + `\n基础金额：${value.inputAmount}\n目标金额：${value.targetAmount}\n比赛：已选 ${(value.matchIds || []).length} 场`;
      } catch (error) {
        return snapshot;
      }
    },
    combinationMatchLabel() {
      if (!this.combinationMatch) {
        return this.combinationQuery.matchId ? "已选择关联比赛" : "";
      }
      return this.formatMatchLabel(this.combinationMatch);
    },
    baseUrl() {
      return process.env.VUE_APP_BASE_API;
    },
    orphanImagePreviewList() {
      return this.orphanImageList.map((image) => this.baseUrl + image.objectKey);
    },
  },
  created() {
    this.initializeCombinationMatchFromRoute();
    this.getCombinationList();
  },
  beforeDestroy() {
    if (this.combinationFilterTimer) {
      clearTimeout(this.combinationFilterTimer);
      this.combinationFilterTimer = null;
    }
  },
  methods: {
    // 空用户名来自第三方导入或历史数据，统一标注来源，避免列表审计列为空。
    formatAuditActor(value) {
      return formatAuditActor(value);
    },
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    formatEvidenceStatus(value) {
      const labels = { N: "不适用", P: "规划/检索中", R: "检索完成", S: "证据已固化", F: "失败" };
      return labels[value] || "-";
    },
    formatMatchLabel(match) {
      if (!match) {
        return "";
      }
      if (!match.homeTeamName && !match.awayTeamName) {
        return "比赛信息待补充";
      }
      const time = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}");
      const vs = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return time ? `${vs}（${time}）` : vs;
    },
    formatGenerationMode(value) {
      if (value === "S") {
        return "主观模式";
      }
      return value === "A" ? "AI 模式" : "-";
    },
    formatGenerationStatus(value) {
      const statusMap = { 0: "处理中", 1: "成功", 2: "失败", 3: "待人工导入" };
      return statusMap[value] || "-";
    },
    formatResultSource(value) {
      if (value === "A") return "自动AI";
      if (value === "M") return "人工AI";
      return "-";
    },
    formatConfidence(value) {
      return value == null ? "-" : `${value}%`;
    },
    // 偏差金额仅表达相对目标的方向：超出目标为红色上箭头，低于目标为绿色下箭头，零值为灰色。
    deviationTone(value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue === 0) return "is-zero";
      return numericValue > 0 ? "is-positive" : "is-negative";
    },
    deviationIcon(value) {
      const tone = this.deviationTone(value);
      if (tone === "is-positive") return "el-icon-top";
      if (tone === "is-negative") return "el-icon-bottom";
      return "";
    },
    generationTaskType(row) {
      if (row && row.generationStatus === "2") {
        return { label: "自动失败可转人工", type: "danger" };
      }
      if (row && row.resultSource === "M") {
        return row.generationStatus === "1"
          ? { label: "人工AI已完成", type: "success" }
          : { label: "人工AI任务", type: "warning" };
      }
      return { label: "自动AI", type: "info" };
    },
    isManualTaskRow(row) {
      return Boolean(row) && ["2", "3"].includes(String(row.generationStatus));
    },
    openAnalysisPage() {
      this.$router.push({ path: "/dortmund/return-analysis/index" });
    },
    getBatchList() {
      this.batchLoading = true;
      this.batchQuery.beginCreateTime = null;
      this.batchQuery.endCreateTime = null;
      if (this.batchDateRange && this.batchDateRange.length === 2) {
        this.batchQuery.beginCreateTime = this.batchDateRange[0];
        this.batchQuery.endCreateTime = this.batchDateRange[1];
      }
      listGeneration(this.batchQuery).then((response) => {
        this.batchList = response.rows || [];
        this.batchTotal = response.total || 0;
      }).catch(() => {
        this.batchList = [];
        this.batchTotal = 0;
      }).finally(() => {
        this.batchLoading = false;
      });
    },
    handleBatchQuery() {
      this.batchQuery.pageNum = 1;
      this.getBatchList();
    },
    handleMoreBatchQuery() {
      this.isMoreBatchQuery = !this.isMoreBatchQuery;
    },
    resetBatchQuery() {
      this.batchQuery.generationStatus = null;
      this.batchQuery.generationMode = null;
      this.batchQuery.resultSource = null;
      this.batchDateRange = [];
      this.handleBatchQuery();
    },
    buildBatchExportParams() {
      const params = { ...this.batchQuery };
      delete params.pageNum;
      delete params.pageSize;
      params.beginCreateTime = null;
      params.endCreateTime = null;
      if (this.batchDateRange && this.batchDateRange.length === 2) {
        params.beginCreateTime = this.batchDateRange[0];
        params.endCreateTime = this.batchDateRange[1];
      }
      return params;
    },
    handleCombinationSelectionChange(selection) {
      this.selectedCombinationIds = (selection || []).map((item) => item.combinationId);
    },
    handleBatchAdopt() {
      const selectedRows = this.combinationList.filter((row) =>
        this.selectedCombinationIds.includes(row.combinationId) && row.adoptedFlag !== "Y");
      if (!selectedRows.length) {
        this.$modal.msgWarning("请选择尚未采用的回报组合；已采用组合无需重复采用");
        return;
      }
      const combinationIds = selectedRows.map((row) => row.combinationId);
      const count = combinationIds.length;
      this.$modal.confirm(`确认批量采用当前选中的 ${count} 条回报组合？`).then(() => {
        this.batchAdoptLoading = true;
        return batchAdoptCombinations(combinationIds);
      }).then((response) => {
        const updated = Number((response && response.data) || 0);
        this.$modal.msgSuccess(`批量采用完成，本次更新 ${updated} 条`);
        this.selectedCombinationIds = [];
        this.$nextTick(() => {
          if (this.$refs.combinationTable) {
            this.$refs.combinationTable.clearSelection();
          }
        });
        return this.getCombinationList();
      }).catch(() => {
      }).finally(() => {
        this.batchAdoptLoading = false;
      });
    },
    handleBatchVerify() {
      const selectedRows = this.combinationList.filter((row) =>
        this.selectedCombinationIds.includes(row.combinationId) && row.adoptedFlag === "Y");
      if (!selectedRows.length) {
        this.$modal.msgWarning("请选择已采用的回报组合进行赛果核验");
        return;
      }
      const combinationIds = selectedRows.map((row) => row.combinationId);
      const verifiedRows = selectedRows.filter((row) => this.isCombinationVerified(row));
      const unverifiedRows = selectedRows.filter((row) => !this.isCombinationVerified(row));
      let confirmMessage = `确认按人工登记的倍率赛果核验当前选中的 ${combinationIds.length} 条回报组合？`;
      if (verifiedRows.length) {
        confirmMessage = `当前选中 ${selectedRows.length} 条回报组合。`
          + `未核验（${unverifiedRows.length} 条）：${this.formatCombinationPromptLabels(unverifiedRows)}；`
          + `已核验（${verifiedRows.length} 条）：${this.formatCombinationPromptLabels(verifiedRows)}。`
          + "是否重新核验以上已核验记录，并继续核验未核验记录？";
      }
      this.$modal.confirm(confirmMessage)
        .then(() => {
          this.batchVerifyLoading = true;
          return batchVerifyCombinations(combinationIds);
        }).then((response) => {
          const data = (response && response.data) || {};
          const successCount = Number(data.successCount) || 0;
          const failedCount = Number(data.failedCount) || 0;
          const unverifiedCount = Number(data.unverifiedCount) || 0;
          const skippedCount = Number(data.skippedCount) || 0;
          const message = `批量核验完成：已达成 ${successCount} 条，未达成 ${failedCount} 条，未核验 ${unverifiedCount} 条`
            + (skippedCount ? `，跳过未采用 ${skippedCount} 条` : "");
          if (failedCount || unverifiedCount || skippedCount) {
            this.$modal.msgWarning(message);
          } else {
            this.$modal.msgSuccess(message);
          }
          this.selectedCombinationIds = [];
          this.$nextTick(() => {
            if (this.$refs.combinationTable) {
              this.$refs.combinationTable.clearSelection();
            }
          });
          return this.fetchVerificationStatuses(combinationIds).then((updates) =>
            this.refreshAfterVerification(updates));
        }).catch(() => {
        }).finally(() => {
          this.batchVerifyLoading = false;
        });
    },
    handleVerify(combination) {
      if (!combination || !this.isPositiveId(combination.combinationId)) {
        this.$modal.msgWarning("该回报组合编号无效，请刷新列表后重试");
        return;
      }
      const confirmMessage = this.isCombinationVerified(combination)
        ? "该记录已经核验过，是否重新核验？"
        : `确认按人工登记的倍率赛果核验组合「${combination.combinationTitle
        || combination.combinationCode}」？`;
      this.$modal.confirm(confirmMessage).then(() => {
        this.verifyingId = combination.combinationId;
        return verifyCombination(combination.combinationId);
      }).then((response) => {
        const status = (response && response.data && response.data.verificationStatus)
          || DORTMUND_RETURN_VERIFICATION_STATUS.unverified;
        const label = getReturnVerificationOption(status).label;
        if (status === DORTMUND_RETURN_VERIFICATION_STATUS.success) {
          this.$modal.msgSuccess(`赛果核验完成：${label}`);
        } else if (status === DORTMUND_RETURN_VERIFICATION_STATUS.failed) {
          this.$modal.msgError(`赛果核验完成：${label}`);
        } else {
          this.$modal.msgWarning(`核验暂未形成结论：组合内仍有比赛未录入倍率赛果，状态保持${label}`);
        }
        return this.refreshAfterVerification([{
          combinationId: combination.combinationId,
          verificationStatus: status,
        }]);
      }).catch(() => {
      }).finally(() => {
        this.verifyingId = null;
      });
    },
    // 仅 Y/N 属于已形成核验结论；null 或未知值均按未核验处理。
    isCombinationVerified(combination) {
      return [DORTMUND_RETURN_VERIFICATION_STATUS.success,
      DORTMUND_RETURN_VERIFICATION_STATUS.failed].includes(combination && combination.verificationStatus);
    },
    // 批量确认文案使用业务标题，不展示主键；所有选中项都会被明确列出。
    formatCombinationPromptLabels(rows) {
      if (!rows || !rows.length) {
        return "无";
      }
      return rows.map((row) => row.combinationTitle || row.combinationCode || "未命名组合").join("、");
    },
    fetchVerificationStatuses(combinationIds) {
      const requests = (combinationIds || []).map((combinationId) => getCombination(combinationId)
        .then((response) => ({
          combinationId,
          verificationStatus: ((response && response.data) || {}).verificationStatus,
        }))
        .catch(() => null));
      return Promise.all(requests).then((results) => results.filter(Boolean));
    },
    /**
     * 核验完成后只合并核验字段，不重新套用“未核验”筛选，避免记录从当前视图突然消失而被误判为取消采用。
     * 采用状态始终沿用列表原值；列表的筛选刷新仍由搜索、重置或只看有效数据按钮触发。
     */
    refreshAfterVerification(updates = []) {
      const statusMap = new Map((updates || []).map((item) => [
        item.combinationId,
        item.verificationStatus,
      ]));
      if (statusMap.size) {
        this.combinationList = this.combinationList.map((row) => statusMap.has(row.combinationId)
          ? { ...row, verificationStatus: statusMap.get(row.combinationId) }
          : row);
      }
      const refreshTasks = [];
      if (this.generationVisible && this.generationDetail.generationId) {
        refreshTasks.push(getGeneration(this.generationDetail.generationId).then((response) => {
          this.generationDetail = (response && response.data) || {};
        }).catch(() => {
        }));
      }
      if (this.combinationVisible && this.combinationDetail.combinationId
        && (!statusMap.size || statusMap.has(this.combinationDetail.combinationId))) {
        refreshTasks.push(getCombination(this.combinationDetail.combinationId).then((response) => {
          this.combinationDetail = { ...this.combinationDetail, ...((response && response.data) || {}) };
        }).catch(() => {
        }));
      }
      return Promise.all(refreshTasks);
    },
    initializeCombinationMatchFromRoute() {
      const rawMatchId = this.$route && this.$route.query ? this.$route.query.matchId : null;
      const matchIdValue = Array.isArray(rawMatchId) ? rawMatchId[0] : rawMatchId;
      const matchId = Number(matchIdValue);
      if (!matchIdValue || !Number.isFinite(matchId) || matchId <= 0) {
        return;
      }
      this.combinationQuery.matchId = matchId;
      this.combinationMatch = { matchId };
      getMatch(matchId).then((response) => {
        if (this.combinationQuery.matchId === matchId) {
          this.combinationMatch = (response && response.data) || { matchId };
        }
      }).catch(() => {
      });
    },
    getCombinationList() {
      this.combinationListLoading = true;
      this.combinationQuery.beginCreateTime = null;
      this.combinationQuery.endCreateTime = null;
      this.combinationQuery.beginReviewTime = null;
      this.combinationQuery.endReviewTime = null;
      this.combinationQuery.beginUpdateTime = null;
      this.combinationQuery.endUpdateTime = null;
      if (this.combinationDateRange && this.combinationDateRange.length === 2) {
        this.combinationQuery.beginCreateTime = this.combinationDateRange[0];
        this.combinationQuery.endCreateTime = this.combinationDateRange[1];
      }
      if (this.combinationAuditDateRange && this.combinationAuditDateRange.length === 2) {
        this.combinationQuery.beginReviewTime = this.combinationAuditDateRange[0];
        this.combinationQuery.endReviewTime = this.combinationAuditDateRange[1];
      }
      if (this.combinationUpdateDateRange && this.combinationUpdateDateRange.length === 2) {
        this.combinationQuery.beginUpdateTime = this.combinationUpdateDateRange[0];
        this.combinationQuery.endUpdateTime = this.combinationUpdateDateRange[1];
      }
      listCombination(this.combinationQuery).then((response) => {
        this.combinationList = response.rows || [];
        this.combinationTotal = response.total || 0;
        this.selectedCombinationIds = [];
        this.$nextTick(() => {
          if (this.$refs.combinationTable) {
            this.$refs.combinationTable.clearSelection();
          }
        });
      }).catch(() => {
        this.combinationList = [];
        this.combinationTotal = 0;
      }).finally(() => {
        this.combinationListLoading = false;
      });
    },
    handleCombinationQuery() {
      this.combinationQuery.pageNum = 1;
      this.getCombinationList();
    },
    handleMoreCombinationQuery() {
      this.isMoreCombinationQuery = !this.isMoreCombinationQuery;
    },
    handleCombinationFilterInput() {
      if (this.combinationFilterTimer) clearTimeout(this.combinationFilterTimer);
      this.combinationFilterTimer = setTimeout(() => {
        this.combinationFilterTimer = null;
        this.handleCombinationQuery();
      }, 320);
    },
    resetCombinationQuery() {
      this.combinationQuery.keyword = null;
      this.combinationQuery.generationMode = null;
      this.combinationQuery.adoptedFlag = null;
      this.combinationQuery.verificationStatus = null;
      this.combinationQuery.generationStatus = null;
      this.combinationQuery.matchId = null;
      this.combinationQuery.sortField = "createTime";
      this.combinationQuery.sortOrder = "desc";
      this.combinationDateRange = [];
      this.combinationAuditDateRange = [];
      this.combinationUpdateDateRange = [];
      this.combinationMatch = null;
      this.selectedCombinationIds = [];
      this.isResetStatus = true;
      this.setCombinationMatchRoute(null);
      this.handleCombinationQuery();
    },
    // 参考号码历史记录页的“查未开奖”交互：重置后显示剪刀按钮，点击恢复有效数据口径并隐藏按钮。
    handleViewValidData() {
      this.isResetStatus = false;
      this.combinationQuery.keyword = null;
      this.combinationQuery.generationMode = null;
      this.combinationQuery.adoptedFlag = "Y";
      this.combinationQuery.verificationStatus = "U";
      this.combinationQuery.generationStatus = null;
      this.combinationQuery.matchId = null;
      this.combinationQuery.sortField = "createTime";
      this.combinationQuery.sortOrder = "desc";
      this.combinationDateRange = [];
      this.combinationAuditDateRange = [];
      this.combinationUpdateDateRange = [];
      this.combinationMatch = null;
      this.selectedCombinationIds = [];
      this.setCombinationMatchRoute(null);
      this.handleCombinationQuery();
    },
    openCombinationMatchQuery() {
      this.closeReturnDrawers();
      this.$nextTick(() => {
        this.combinationMatchSelectorVisible = true;
      });
    },
    handleCombinationMatchConfirm(match) {
      if (!match || match.matchId == null) {
        return;
      }
      this.combinationMatch = match;
      this.combinationQuery.matchId = match.matchId;
      this.setCombinationMatchRoute(match.matchId);
      this.$nextTick(() => {
        this.handleCombinationQuery();
        this.focusCombinationCard();
      });
    },
    clearCombinationMatch() {
      this.combinationMatch = null;
      this.combinationQuery.matchId = null;
      this.setCombinationMatchRoute(null);
      this.handleCombinationQuery();
    },
    setCombinationMatchRoute(matchId) {
      const query = { ...this.$route.query };
      if (matchId == null || matchId === "") {
        delete query.matchId;
      } else {
        query.matchId = String(matchId);
      }
      const navigation = this.$router.replace({ path: this.$route.path, query });
      if (navigation && typeof navigation.catch === "function") {
        navigation.catch(() => {
        });
      }
    },
    focusCombinationCard() {
      if (this.$refs.combinationCard) {
        this.$refs.combinationCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    closeReturnDrawers() {
      this.historyVisible = false;
      this.generationVisible = false;
      this.combinationVisible = false;
      this.orphanImageVisible = false;
    },
    openHistoryDrawer() {
      this.generationVisible = false;
      this.combinationVisible = false;
      this.orphanImageVisible = false;
      this.historyVisible = true;
    },
    openOrphanImageDrawer() {
      this.historyVisible = false;
      this.generationVisible = false;
      this.combinationVisible = false;
      this.orphanCleanupResult = null;
      this.orphanImageVisible = true;
    },
    initializeOrphanQuery() {
      if (!this.orphanDateRange || this.orphanDateRange.length !== 2) {
        const end = new Date();
        const begin = new Date(end.getTime() - 6 * 24 * 3600 * 1000);
        this.orphanDateRange = [this.formatDateValue(begin), this.formatDateValue(end)];
      }
      this.handleOrphanImageQuery();
    },
    formatDateValue(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      // 孤儿图片查询在后端按自然日解析并补齐起止时刻，前端只提交 yyyy-MM-dd。
      return `${year}-${month}-${day}`;
    },
    handleOrphanImageQuery() {
      if (!this.orphanDateRange || this.orphanDateRange.length !== 2) {
        this.$modal.msgWarning("请选择孤儿图片查询时间范围");
        return;
      }
      this.orphanSearchLoading = true;
      listOrphanReturnImages({
        beginCreateTime: this.orphanDateRange[0],
        endCreateTime: this.orphanDateRange[1],
      }).then((response) => {
        this.orphanImageList = (response && response.data) || [];
        this.selectedOrphanIds = [];
        this.$nextTick(() => {
          if (this.$refs.orphanTable) {
            this.$refs.orphanTable.clearSelection();
          }
        });
      }).catch(() => {
        this.orphanImageList = [];
      }).finally(() => {
        this.orphanSearchLoading = false;
      });
    },
    handleOrphanImageSearch() {
      this.orphanCleanupResult = null;
      this.handleOrphanImageQuery();
    },
    // 时间范围完整时立即查询；清空范围不触发查询，保留搜索按钮用于手动重试。
    handleOrphanDateChange(value) {
      if (Array.isArray(value) && value.length === 2) {
        this.handleOrphanImageSearch();
      }
    },
    handleOrphanSelectionChange(selection) {
      this.selectedOrphanIds = (selection || []).map((item) => item.imageId);
    },
    handleDeleteSelectedOrphans() {
      if (!this.selectedOrphanIds.length) {
        return;
      }
      const count = this.selectedOrphanIds.length;
      this.$modal.confirm(`确认删除选中的 ${count} 张孤儿图片？删除失败项会保留并进入后台重试。`).then(() => {
        this.orphanDeleteLoading = true;
        return deleteOrphanReturnImages([...this.selectedOrphanIds]);
      }).then((response) => {
        this.orphanCleanupResult = (response && response.data) || {
          requestedCount: count,
          deletedCount: 0,
          failedCount: count,
          failedObjectKeys: [],
        };
        if (this.orphanCleanupResult.failedCount) {
          this.$modal.msgWarning(`删除完成：成功 ${this.orphanCleanupResult.deletedCount} 张，失败 ${this.orphanCleanupResult.failedCount} 张`);
        } else {
          this.$modal.msgSuccess(`已删除 ${this.orphanCleanupResult.deletedCount} 张孤儿图片`);
        }
        return this.handleOrphanImageQuery();
      }).catch(() => {
      }).finally(() => {
        this.orphanDeleteLoading = false;
      });
    },
    formatFileSize(value) {
      const bytes = Number(value);
      if (!Number.isFinite(bytes) || bytes < 0) {
        return "-";
      }
      if (bytes < 1024) {
        return `${bytes} B`;
      }
      if (bytes < 1024 * 1024) {
        return `${(bytes / DORTMUND_DISPLAY_FORMAT.bytesPerKilobyte)
          .toFixed(DORTMUND_DISPLAY_FORMAT.fractionDigits)} KB`;
      }
      return `${(bytes / DORTMUND_DISPLAY_FORMAT.bytesPerKilobyte
        / DORTMUND_DISPLAY_FORMAT.bytesPerKilobyte).toFixed(DORTMUND_DISPLAY_FORMAT.fractionDigits)} MB`;
    },
    formatOrphanImageState(value) {
      const stateMap = { T: "T 临时", B: "B 关联失效", D: "D 待删除", Q: "Q 已隔离" };
      return stateMap[value] || value || "-";
    },
    orphanStateTagType(value) {
      if (value === "D") return "danger";
      if (value === "Q") return "warning";
      return "info";
    },
    handleGenerationDetail(row, openImport = false) {
      const snapshot = { ...(row || {}) };
      this.generationDetail = snapshot;
      this.generationVisible = true;
      this.generationLoading = true;
      getGeneration(row.generationId).then((response) => {
        this.generationDetail = { ...snapshot, ...((response && response.data) || {}) };
        if (openImport) {
          this.$nextTick(() => {
            const panel = this.$refs.manualAiTaskPanel;
            if (panel && typeof panel.openImportDialog === "function") {
              panel.openImportDialog();
            }
          });
        }
      }).catch(() => {
        // 接口异常时保留列表快照，避免批次详情抽屉空白
      }).finally(() => {
        this.generationLoading = false;
      });
    },
    handleManualTaskExport(row) {
      if (!row || !row.generationId) return;
      getManualTask(row.generationId).then((response) => {
        const task = (response && response.data) || {};
        if (!task.taskId || !task.responseContract || !task.exportPrompt) {
          throw new Error("manual-task-invalid");
        }
        const content = JSON.stringify(task, null, 2);
        const blob = new Blob([content], { type: "application/json;charset=utf-8" });
        this.$download.saveAs(blob, `dortmund-return-manual-task-${row.generationId}.json`);
        this.$modal.msgSuccess("人工AI任务已导出，完整处理提示词已内嵌，可直接交给第三方AI");
      }).catch(() => {
        this.$modal.msgError("人工AI任务导出失败，请刷新批次后重试");
      });
    },
    handleManualTaskImport(row) {
      if (!row || !row.generationId) return;
      this.handleGenerationDetail(row, true);
    },
    handleManualImported() {
      const generationId = this.generationDetail.generationId;
      if (!generationId) return;
      getGeneration(generationId).then((response) => {
        this.generationDetail = (response && response.data) || {};
      }).catch(() => {
      });
      this.getBatchList();
      this.getCombinationList();
    },
    handleCombinationDetail(row) {
      if (!row || !this.isPositiveId(row.combinationId)) {
        this.$modal.msgWarning("该回报组合编号无效，请刷新列表后重试");
        return;
      }
      // 保留已打开的上级抽屉；仅在没有批次上下文时清理旧快照，避免组合详情误用旧来源。
      if (!this.generationVisible) {
        this.generationDetail = {};
      }
      this.combinationDetail = { ...(row || {}) };
      this.combinationVisible = true;
      this.refreshCombinationDetail(true, row.combinationId);
    },
    refreshCombinationDetail(showLoading = true, combinationId = null) {
      const targetId = combinationId || this.combinationDetail.combinationId;
      const normalizedId = this.normalizePositiveId(targetId);
      if (!normalizedId) return Promise.resolve();
      const snapshot = { ...(this.combinationDetail || {}) };
      if (showLoading) this.combinationLoading = true;
      return getCombination(normalizedId).then((response) => {
        this.combinationDetail = { ...snapshot, ...((response && response.data) || {}) };
      }).catch(() => {
        // 接口异常时保留列表快照，避免组合详情抽屉空白
      }).finally(() => {
        if (showLoading) this.combinationLoading = false;
      });
    },
    isPositiveId(value) {
      return Boolean(this.normalizePositiveId(value));
    },
    normalizePositiveId(value) {
      const id = Number(value);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    handleReview(combination, adoptedFlag) {
      const action = adoptedFlag === "Y" ? "采用" : "不采用";
      this.$modal.confirm(`确认${action}组合「${combination.combinationTitle || combination.combinationCode}」？`).then(() => {
        this.reviewingId = combination.combinationId;
        const request = adoptedFlag === "Y"
          ? adoptCombination(combination.combinationId)
          : rejectCombination(combination.combinationId);
        return request;
      }).then(() => {
        this.$modal.msgSuccess(`${action}成功`);
        const refreshTasks = [this.getCombinationList()];
        if (this.historyVisible) {
          refreshTasks.push(this.getBatchList());
        }
        if (this.generationVisible && this.generationDetail.generationId) {
          refreshTasks.push(getGeneration(this.generationDetail.generationId).then((response) => {
            this.generationDetail = (response && response.data) || {};
          }).catch(() => {
          }));
        }
        if (this.combinationVisible
          && this.combinationDetail.combinationId === combination.combinationId) {
          refreshTasks.push(getCombination(combination.combinationId).then((response) => {
            this.combinationDetail = (response && response.data) || {};
          }).catch(() => {
          }));
        }
        return Promise.all(refreshTasks);
      }).catch(() => {
      }).finally(() => {
        this.reviewingId = null;
      });
    },
    buildCombinationExportParams() {
      const params = {
        keyword: this.combinationQuery.keyword,
        generationMode: this.combinationQuery.generationMode,
        adoptedFlag: this.combinationQuery.adoptedFlag,
        verificationStatus: this.combinationQuery.verificationStatus,
        generationStatus: this.combinationQuery.generationStatus,
        matchId: this.combinationQuery.matchId,
        beginCreateTime: null,
        endCreateTime: null,
        beginReviewTime: null,
        endReviewTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      };
      if (this.combinationDateRange && this.combinationDateRange.length === 2) {
        params.beginCreateTime = this.combinationDateRange[0];
        params.endCreateTime = this.combinationDateRange[1];
      }
      if (this.combinationAuditDateRange && this.combinationAuditDateRange.length === 2) {
        params.beginReviewTime = this.combinationAuditDateRange[0];
        params.endReviewTime = this.combinationAuditDateRange[1];
      }
      if (this.combinationUpdateDateRange && this.combinationUpdateDateRange.length === 2) {
        params.beginUpdateTime = this.combinationUpdateDateRange[0];
        params.endUpdateTime = this.combinationUpdateDateRange[1];
      }
      return {
        ...params,
        sortField: this.combinationQuery.sortField,
        sortOrder: this.combinationQuery.sortOrder,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.return-page {
  max-width: 1500px;
  margin: 0 auto;
}

.return-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  margin-bottom: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, #fff 0%, #f4fbf7 100%);
  border: 1px solid #e3eee8;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(46, 204, 113, 0.08);
  animation: returnRise 0.4s ease both;
}

.return-hero-left {
  display: flex;
  align-items: center;
}

.return-hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 10px;

  .el-button+.el-button {
    margin-left: 0;
  }
}

.return-hero-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: 12px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71, #7fd8a7);
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(46, 204, 113, 0.25);
  animation: iconFloat 2.8s ease-in-out infinite;

  i {
    font-size: 21px;
  }
}

.return-hero h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #25332e;
}

.return-hero p {
  margin: 0;
  font-size: 12px;
  color: #7c8b84;
}

.return-main {
  margin-bottom: 18px;
}

.return-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.07);
  animation: returnRise 0.38s ease 0.05s both;
}

.return-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
  color: #2b3a36;

  i {
    color: #2ecc71;
  }
}

.return-card-count {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #7c8b84;
}

.mode-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  overflow: hidden;
  padding: 3px;
  margin-bottom: 14px;
  background: #eef4f0;
  border-radius: 999px;
}

.mode-item {
  position: relative;
  z-index: 1;
  height: 30px;
  font-size: 12px;
  color: #6b7c74;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  transition: color 0.25s ease;
}

.mode-item.active {
  color: #fff;
  font-weight: 600;
}

.mode-thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: var(--current-color, #2ecc71);
  border-radius: 999px;
  transition: transform 0.38s cubic-bezier(0.34, 1.35, 0.64, 1);
}

.generate-summary {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #7c8b84;
}

.generate-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  font-size: 12px;
  color: #b88230;
  background: #fdf6ec;
  border: 1px solid #f5e6c8;
  border-radius: 8px;
}

.generate-btn {
  width: 100%;
  margin-top: 16px;
  border-radius: 10px;
}

.candidate-list {
  display: grid;
  gap: 10px;
  max-height: 480px;
  overflow: auto;
  padding-right: 2px;
}

.candidate-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fbfdfc;
  border: 1px solid #e8f2ed;
  border-radius: 12px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.candidate-item:hover {
  border-color: #2ecc71;
  box-shadow: 0 10px 22px rgba(46, 204, 113, 0.14);
  transform: translateY(-2px);
}

.candidate-rank {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 700;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 50%;
}

.candidate-main {
  min-width: 0;
  flex: 1;
}

.candidate-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.candidate-title {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #7c8b84;

  b {
    color: #27ad60;
  }
}

.candidate-reason {
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: #7c8b84;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-actions {
  flex-shrink: 0;
  text-align: right;
}

.empty-block {
  display: grid;
  place-items: center;
  min-height: 220px;
  color: #9aa8a1;
  background: #fbfdfc;
  border: 1px dashed #dfece5;
  border-radius: 12px;

  i {
    font-size: 36px;
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
  }
}

.combination-card {
  margin-bottom: 18px;
  scroll-margin-top: 12px;
  animation-delay: 0.1s;
}

/* 主列表沿用模块统一列表容器规格，避免叠加大卡片与紧凑行高造成视觉拥挤。 */
.combination-card .combination-table-wrap {
  border-color: #e3eee8;
  border-radius: 14px;
}

.combination-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;

  .return-card-title {
    margin-bottom: 0;
  }
}

.combination-head-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.combination-sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.combination-sort-label {
  font-size: 12px;
  color: #7c8b84;
}

.combination-selected-count {
  margin-left: 10px;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 400;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;
  animation: returnRise 0.24s ease both;
}

.combination-match-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combination-table {
  min-width: 1120px;
}

/* 偏差金额按方向着色，两个组合表共用同一套展示口径。 */
.deviation-amount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  i {
    font-size: 12px;
  }

  &.is-positive {
    color: #ff5a5f;
  }

  &.is-negative {
    color: #2ecc71;
  }

  &.is-zero {
    font-weight: 400;
    color: #999999;
  }
}

.combination-confidence {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #53635b;

  &.is-empty {
    font-weight: 400;
    color: #a8b2ad;
  }
}

.combination-risk-hint {
  color: #67766f;

  &.is-empty {
    color: #a8b2ad;
  }
}

.combination-match-count {
  min-width: 34px;
  min-height: 28px;
  padding: 4px 10px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  border-radius: 8px;
  transition: color .18s ease, background-color .18s ease, box-shadow .18s ease, transform .18s ease;

  &:hover {
    background: #e9f9f0;
    box-shadow: 0 4px 10px rgba(46, 204, 113, .14);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(.94);
  }

  &.is-empty {
    color: #98a6a0;
    background: transparent;
    box-shadow: none;
    transform: none;
  }
}

.combination-empty {
  min-height: 160px;
  margin-top: 10px;
}

.combination-batch-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 0;

  ::v-deep .el-button+.el-button {
    margin-left: 0;
  }
}

.history-batch-filter {
  ::v-deep .el-form-item {
    margin-right: 12px;
  }

  ::v-deep .el-form-item__content {
    min-width: 0;
  }

  ::v-deep .el-select {
    width: 160px !important;
  }

  ::v-deep .el-date-editor {
    width: 300px !important;
  }

  .history-batch-actions {
    margin-right: 0;
    margin-left: auto;

    ::v-deep .el-form-item__content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    ::v-deep .el-button+.el-button {
      margin-left: 0;
    }
  }
}

@media (max-width: 767px) {
  .history-batch-filter {
    ::v-deep .el-form-item {
      width: 100%;
      margin-right: 0;
    }

    ::v-deep .el-form-item__content {
      width: calc(100% - 76px);
    }

    ::v-deep .el-select,
    ::v-deep .el-date-editor {
      width: 100% !important;
    }

    .history-batch-actions {
      width: 100%;
      margin-left: 0;

      ::v-deep .el-form-item__content {
        width: 100%;
        padding-left: 76px;
      }

      ::v-deep .el-button {
        flex: 1;
      }
    }
  }
}

@at-root {
  .orphan-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    font-size: 12px;
    color: #7c8b84;
  }

  .orphan-filter-card {
    ::v-deep .el-form-item {
      margin-right: 12px;
    }

    ::v-deep .el-form-item__content {
      min-width: 0;
    }

    ::v-deep .el-date-editor {
      width: 260px !important;
    }

    .orphan-filter-actions {
      margin-right: 0;
      margin-left: auto;

      ::v-deep .el-form-item__content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      ::v-deep .el-button+.el-button {
        margin-left: 0;
      }
    }
  }

  .orphan-result {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #23864c;
    background: #edf9f2;
    border: 1px solid #ccebd9;
    border-radius: 12px;
    animation: returnRise 0.24s ease both;
  }

  .orphan-result-failed {
    width: 100%;
    color: #b45f45;
    word-break: break-all;
  }

  .orphan-table-wrap {
    padding: 12px;
    background: #fff;
    border: 1px solid #e3eee8;
    border-radius: 14px;
  }

  .orphan-table {
    min-width: 1080px;
  }

  .orphan-thumb {
    width: 42px;
    height: 42px;
    border: 1px solid #e3eee8;
    border-radius: 8px;
  }

  .orphan-empty {
    min-height: 150px;
    margin-top: 8px;
  }
}

.history-table-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(46, 204, 113, 0.05);
  animation: returnRise 0.3s ease 0.04s both;
}

.history-table-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 11px;
  color: #2b3a36;

  >span,
  >div {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
  }

  i {
    color: var(--current-color, #2ecc71);
  }

  .el-button {
    padding: 0;
  }
}

.history-table-heading {
  margin-bottom: 10px;

  span {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: #8b9992;
  }

  >i {
    color: #9aa8a1;
  }
}

.history-table-wrap {
  overflow-x: auto;
  border: 1px solid #edf3ef;
  border-radius: 10px;
}

.history-table {
  min-width: 790px;

  ::v-deep th.el-table__cell {
    color: #53635b;
    background: #f4f8f5;
  }

  ::v-deep .el-table__row {
    transition: background-color 0.2s ease;
  }

  ::v-deep .el-table__row:hover>td.el-table__cell {
    background: #f3fbf6;
  }
}

.history-empty {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 190px;
  color: #9aa8a1;
  background: #fbfdfc;
  border: 1px dashed #dfece5;
  border-radius: 10px;

  i {
    font-size: 30px;
    color: #b9c8bf;
  }

  span {
    font-size: 13px;
  }

  .el-button {
    padding: 0;
  }
}

.return-drawer-body {
  padding: 0 6px;
}

.return-detail-alert-block {
  margin-top: 10px;
}

.return-detail-card {
  padding: 16px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e3eee8;
  border-radius: 12px;
  animation: returnRise 0.3s ease both;
}

.return-detail-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #2b3a36;
}

.return-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px 16px;
  font-size: 13px;
  color: #44604f;

  label {
    display: block;
    margin-bottom: 2px;
    font-size: 12px;
    color: #7c8b84;
  }
}

.return-detail-alert {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #c45656;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
}

.return-detail-alert.manual {
  color: #9a6a1f;
  background: #fffaf0;
  border-color: #f0dfb7;
}

.return-input-summary {
  padding: 14px 16px;
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  white-space: pre-wrap;
  font-family: inherit;
  background: #fafcfb;
  border: 1px solid #e2eee7;
  border-radius: 8px;
}

.combination-reason {
  padding: 10px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  white-space: pre-wrap;
  background: #fafcfb;
  border: 1px solid #e2eee7;
  border-radius: 8px;
}

.combination-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  ::v-deep .el-image {
    width: 100%;
    height: 104px;
    border-radius: 10px;
    overflow: hidden;
  }
}

.image-empty {
  font-size: 12px;
  color: #9aa8a1;
}

.candidate-pop-enter-active,
.candidate-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.candidate-pop-enter,
.candidate-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@keyframes returnRise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes iconFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

@media (max-width: 991px) {
  .return-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .return-hero-actions {
    justify-content: flex-end;
    width: 100%;
  }
}

@media (max-width: 767px) {

  .combination-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .combination-match-tag {
    height: auto;
    white-space: normal;
  }

  .combination-head-actions {
    justify-content: flex-start;
    width: 100%;
  }

  .combination-sort-controls {
    flex-wrap: wrap;
  }

  .history-table-card {
    padding: 12px;
  }

  .orphan-filter-card {
    ::v-deep .el-form-item {
      width: 100%;
      margin-right: 0;
    }

    ::v-deep .el-form-item__content {
      width: calc(100% - 76px);
    }

    ::v-deep .el-date-editor {
      width: 100% !important;
    }

    .orphan-filter-actions {
      margin-left: 0;

      ::v-deep .el-form-item__content {
        width: 100%;
        padding-left: 76px;
        flex-wrap: wrap;
      }

      ::v-deep .el-button {
        flex: 1;
      }
    }
  }

}
</style>

<!-- 抽屉挂载到 body，标题栏样式不能 scoped；仅作用于两个 return 抽屉 -->
<style lang="scss">
.return-history-drawer.el-drawer,
.return-orphan-drawer.el-drawer {
  background: #f6faf8;

  .el-drawer__header {
    position: relative;
    display: flex;
    flex: none;
    align-items: center;
    padding: 16px 64px 16px 20px;
    margin-bottom: 0;
    color: #2b3a36;
    background: #fff;
    border-bottom: 1px solid #e3eee8;
  }

  .el-drawer__body {
    padding: 16px 20px 24px;
    overflow: auto;
  }

  .el-drawer__close-btn {
    position: absolute;
    top: 18px;
    right: 20px;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    color: #718078;
    background: transparent;
    border-radius: 10px;
    transition: color 0.22s ease, background-color 0.22s ease,
      box-shadow 0.22s ease, transform 0.28s cubic-bezier(0.22, 0.8, 0.32, 1.2);

    &:hover,
    &:focus-visible {
      color: var(--current-color, #2ecc71);
      background: rgba(46, 204, 113, 0.1);
      box-shadow: 0 4px 12px rgba(46, 204, 113, 0.16);
      transform: rotate(90deg) scale(1.04);
    }

    &:active {
      transform: rotate(90deg) scale(0.92);
    }
  }

}

.return-drawer-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  animation: returnDrawerHeadingIn 0.3s ease both;
}

.return-drawer-heading-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, var(--current-color, #2ecc71) 0%, #27ae60 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);

  &.is-amber {
    background: linear-gradient(135deg, #f5b85c 0%, #e69a2d 100%);
    box-shadow: 0 4px 12px rgba(230, 154, 45, 0.28);
  }
}

.return-drawer-heading-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    overflow: hidden;
    font-size: 16px;
    font-weight: 600;
    color: #2b3a36;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    overflow: hidden;
    font-size: 12px;
    color: #8a9a92;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.return-drawer-heading-tools {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.return-drawer-chip {
  padding: 5px 10px;
  font-size: 12px;
  color: #5f746b;
  white-space: nowrap;
  background: #f2fbf6;
  border: 1px solid #e0eee6;
  border-radius: 999px;

  b {
    color: var(--current-color, #2ecc71);
  }
}

@keyframes returnDrawerHeadingIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {

  .return-history-drawer.el-drawer,
  .return-orphan-drawer.el-drawer {
    .el-drawer__header {
      padding-right: 56px;
    }

  }

  .return-drawer-heading-tools {
    .return-drawer-chip {
      display: none;
    }
  }
}

@media (prefers-reduced-motion: reduce) {

  .return-history-drawer.el-drawer,
  .return-orphan-drawer.el-drawer {
    .el-drawer__close-btn {
      transition: none;

      &:hover,
      &:focus-visible,
      &:active {
        transform: none;
      }
    }
  }

  .return-drawer-heading {
    animation: none;
  }
}
</style>
