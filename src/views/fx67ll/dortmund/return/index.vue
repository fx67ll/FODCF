<template>
  <div class="app-container return-page dl-page">
    <div class="return-hero">
      <div class="return-hero-left">
        <div class="return-hero-icon"><i class="el-icon-magic-stick"></i></div>
        <div>
          <h2>回报组合工作区</h2>
          <p>默认展示全部历史组合；按比赛、状态和批次条件筛选，或进入独立页面发起异步分析</p>
        </div>
      </div>
      <div class="return-hero-actions">
        <el-button type="primary" plain icon="el-icon-magic-stick" size="mini" @click="openAnalysisPage"
          v-hasPermi="['dortmund:return:generate']">创建分析批次</el-button>
        <el-button type="success" plain icon="el-icon-time" size="mini" @click="openHistoryDrawer">
          查看历史记录
        </el-button>
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:return:export']">导出组合记录</el-button>
        <el-button type="danger" plain icon="el-icon-delete" size="mini" @click="openOrphanImageDrawer"
          v-hasPermi="['dortmund:return:image:query']">孤儿图片清理</el-button>
      </div>
    </div>

    <transition name="dl-filter">
      <el-form ref="combinationQueryForm" :model="combinationQuery" class="dl-filter" size="small" :inline="true"
        label-width="68px">
        <el-form-item label="搜索组合" prop="keyword">
          <el-input v-model="combinationQuery.keyword" placeholder="请输入组合编码或标题" clearable style="width: 210px"
            @keyup.enter.native="handleCombinationQuery" />
        </el-form-item>
        <el-form-item label="关联比赛" prop="matchId">
          <el-input :value="combinationMatchLabel" readonly clearable placeholder="请选择关联比赛"
            prefix-icon="el-icon-football" style="width: 240px" @click.native="openCombinationMatchQuery"
            @clear="clearCombinationMatch" />
        </el-form-item>
        <el-form-item label="采用状态" prop="adoptedFlag">
          <el-select v-model="combinationQuery.adoptedFlag" placeholder="请选择采用状态" clearable style="width: 140px">
            <el-option label="未采用" value="N" />
            <el-option label="已采用" value="Y" />
          </el-select>
        </el-form-item>
        <el-form-item label="生成模式" prop="generationMode" v-if="isMoreCombinationQuery">
          <el-select v-model="combinationQuery.generationMode" placeholder="请选择生成模式" clearable style="width: 160px">
            <el-option label="主观模式" value="S" />
            <el-option label="AI 模式" value="A" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次状态" prop="generationStatus" v-if="isMoreCombinationQuery">
          <el-select v-model="combinationQuery.generationStatus" placeholder="请选择批次状态" clearable style="width: 140px">
            <el-option v-for="item in dict.type.fx67ll_ai_analysis_status || []" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" v-if="isMoreCombinationQuery">
          <el-date-picker v-model="combinationDateRange" type="daterange" value-format="yyyy-MM-dd" range-separator="-"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="handleCombinationQuery">搜索</el-button>
          <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetCombinationQuery">重置</el-button>
          <el-button type="success" class="dl-more-btn"
            :icon="isMoreCombinationQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
            @click="handleMoreCombinationQuery">
            {{ isMoreCombinationQuery ? "关闭高级搜索" : "使用高级搜索" }}
          </el-button>
        </el-form-item>
      </el-form>
    </transition>

    <div ref="combinationCard" class="return-card combination-card">
      <div class="combination-head">
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
            <el-select v-model="combinationQuery.sortField" size="mini" style="width: 122px">
              <el-option label="创建时间" value="createTime" />
              <el-option label="预计回报" value="estimatedReturn" />
              <el-option label="偏差金额" value="deviationAmount" />
              <el-option label="组合倍率" value="combinedOdds" />
              <el-option label="场次" value="matchCount" />
              <el-option label="审核时间" value="reviewTime" />
            </el-select>
            <el-select v-model="combinationQuery.sortOrder" size="mini" style="width: 82px">
              <el-option label="降序" value="desc" />
              <el-option label="升序" value="asc" />
            </el-select>
          </div>
          <el-button type="success" plain size="mini" icon="el-icon-check" :loading="batchAdoptLoading"
            :disabled="!selectedCombinationIds.length" @click="handleBatchAdopt"
            v-hasPermi="['dortmund:return:review']">
            批量采用
          </el-button>
        </div>
      </div>
      <div class="history-table-wrap">
        <el-table ref="combinationTable" v-loading="combinationListLoading" :data="combinationList"
          row-key="combinationId" size="small" class="history-table combination-table"
          @selection-change="handleCombinationSelectionChange">
          <el-table-column type="selection" width="46" fixed="left" :selectable="isCombinationSelectable" />
          <el-table-column label="组合编码" prop="combinationCode" min-width="160" show-overflow-tooltip fixed="left" />
          <el-table-column label="组合标题" prop="combinationTitle" min-width="190" show-overflow-tooltip />
          <el-table-column label="模式" align="center" width="118">
            <template slot-scope="scope">{{ formatGenerationMode(scope.row.generationMode) }}</template>
          </el-table-column>
          <el-table-column label="批次状态" align="center" width="92">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_ai_analysis_status || []" :value="scope.row.generationStatus" />
            </template>
          </el-table-column>
          <el-table-column label="组合倍率" align="center" prop="combinedOdds" width="100" />
          <el-table-column label="预计回报" align="center" width="110">
            <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.estimatedReturn) }}</template>
          </el-table-column>
          <el-table-column label="偏差金额" align="center" width="110">
            <template slot-scope="scope">{{ formatMoneyDisplay(scope.row.deviationAmount) }}</template>
          </el-table-column>
          <el-table-column label="场次" align="center" prop="matchCount" width="70" />
          <el-table-column label="采用状态" align="center" width="90">
            <template slot-scope="scope">
              <el-tag :type="scope.row.adoptedFlag === 'Y' ? 'success' : 'info'" size="mini">
                {{ scope.row.adoptedFlag === "Y" ? "已采用" : "未采用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="审核时间" align="center" width="150">
            <template slot-scope="scope">{{ parseTime(scope.row.reviewTime, "{y}-{m}-{d} {h}:{i}") || "-" }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="150" fixed="right">
            <template slot-scope="scope">
              <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
                @click="handleCombinationDetail(scope.row)" v-hasPermi="['dortmund:return:query']">详情</el-button>
              <el-button v-if="scope.row.adoptedFlag !== 'Y'" size="mini" type="text" class="dortmund-theme-text"
                icon="el-icon-check" :loading="reviewingId === scope.row.combinationId"
                @click="handleReview(scope.row, 'Y')" v-hasPermi="['dortmund:return:review']">采用</el-button>
              <el-button v-else size="mini" type="text" class="dortmund-theme-text" icon="el-icon-close"
                :loading="reviewingId === scope.row.combinationId" @click="handleReview(scope.row, 'N')"
                v-hasPermi="['dortmund:return:review']">不采用</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <pagination v-show="combinationTotal > 0" :total="combinationTotal" :page.sync="combinationQuery.pageNum"
        :limit.sync="combinationQuery.pageSize" @pagination="getCombinationList" />
      <div v-if="!combinationListLoading && !combinationList.length" class="history-empty combination-empty">
        <i class="el-icon-collection"></i>
        <span>暂无符合筛选条件的回报组合</span>
        <el-button type="text" class="dortmund-theme-text" @click="resetCombinationQuery">清除筛选</el-button>
      </div>
    </div>

    <el-drawer :visible.sync="generationVisible" title="生成批次详情" size="760px" append-to-body destroy-on-close
      custom-class="return-drawer">
      <div v-loading="generationLoading" class="return-drawer-body">
        <div class="return-detail-card">
          <div class="return-detail-title">{{ generationDetail.generationCode || "-" }}</div>
          <div class="return-detail-grid">
            <span><label>模式</label>{{ formatGenerationMode(generationDetail.generationMode) }}</span>
            <span><label>状态</label>{{ formatGenerationStatus(generationDetail.generationStatus) }}</span>
            <span><label>基础金额</label>{{ generationDetail.inputAmount || "-" }}</span>
            <span><label>目标金额</label>{{ generationDetail.targetAmount || "-" }}</span>
            <span><label>组合数</label>{{ generationDetail.generatedCount || 0 }}</span>
            <span><label>完成时间</label>{{ parseTime(generationDetail.finishedTime, "{y}-{m}-{d} {h}:{i}") || "-" }}</span>
          </div>
          <div class="return-detail-alert" v-if="generationDetail.generationStatus === '2'">
            <i class="el-icon-warning-outline"></i>
            <span>{{ generationDetail.generationRemark || "生成失败，没有产生可用的半截数据。" }}</span>
          </div>
        </div>
        <div class="return-detail-card" v-if="generationInputSummary">
          <div class="return-detail-title">业务输入摘要</div>
          <pre class="return-input-summary">{{ generationInputSummary }}</pre>
        </div>
        <div class="return-detail-card">
          <div class="return-detail-title">批次组合</div>
          <el-table :data="generationDetail.combinations || []" size="small" empty-text="暂无组合">
            <el-table-column label="组合编码" prop="combinationCode" min-width="160" show-overflow-tooltip />
            <el-table-column label="预计回报" align="center" prop="estimatedReturn" width="100" />
            <el-table-column label="偏差" align="center" prop="deviationAmount" width="90" />
            <el-table-column label="采用" align="center" prop="adoptedFlag" width="80">
              <template slot-scope="scope">{{ scope.row.adoptedFlag === "Y" ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="80">
              <template slot-scope="scope">
                <el-button size="mini" type="text" class="dortmund-theme-text"
                  @click="handleCombinationDetail(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <el-drawer :visible.sync="historyVisible" title="回报组合历史批次" size="900px" append-to-body destroy-on-close
      custom-class="return-drawer return-history-drawer" @opened="handleBatchQuery">
      <div class="return-drawer-body dl-page">
        <div class="history-drawer-hero">
          <div class="history-drawer-hero-icon"><i class="el-icon-time"></i></div>
          <div class="history-drawer-hero-copy">
            <strong>历史批次</strong>
            <span>查看生成记录、处理状态与组合数量</span>
          </div>
          <div class="history-drawer-tools">
            <span class="history-drawer-count">共 {{ batchTotal }} 批</span>
            <el-button type="warning" plain size="mini" icon="el-icon-download" :loading="batchExporting"
              @click="handleBatchExport" v-hasPermi="['dortmund:return:export']">导出批次</el-button>
          </div>
        </div>
        <el-form ref="batchQueryForm" :model="batchQuery" class="dl-filter" size="small" :inline="true"
          label-width="82px">
          <el-form-item label="批次状态" prop="generationStatus">
            <el-select v-model="batchQuery.generationStatus" placeholder="请选择批次状态" clearable style="width: 140px">
              <el-option v-for="item in dict.type.fx67ll_ai_analysis_status || []" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="生成模式" prop="generationMode">
            <el-select v-model="batchQuery.generationMode" placeholder="请选择生成模式" clearable style="width: 160px">
              <el-option label="主观模式" value="S" />
              <el-option label="AI 模式" value="A" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker v-model="batchDateRange" type="daterange" value-format="yyyy-MM-dd" range-separator="-"
              start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleBatchQuery">搜索</el-button>
            <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetBatchQuery">重置</el-button>
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
              <el-table-column label="模式" align="center" width="96">
                <template slot-scope="scope">{{ formatGenerationMode(scope.row.generationMode) }}</template>
              </el-table-column>
              <el-table-column label="状态" align="center" prop="generationStatus" width="84">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.fx67ll_ai_analysis_status" :value="scope.row.generationStatus" />
                </template>
              </el-table-column>
              <el-table-column label="基础金额" align="center" prop="inputAmount" width="100" />
              <el-table-column label="目标金额" align="center" prop="targetAmount" width="100" />
              <el-table-column label="组合数" align="center" prop="generatedCount" width="76" />
              <el-table-column label="完成时间" align="center" width="150">
                <template slot-scope="scope">{{ parseTime(scope.row.finishedTime, "{y}-{m}-{d} {h}:{i}") || "-"
                }}</template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="90" fixed="right">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
                    v-hasPermi="['dortmund:return:query']" @click="handleGenerationDetail(scope.row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <pagination v-show="batchTotal > 0" :total="batchTotal" :page.sync="batchQuery.pageNum"
            :limit.sync="batchQuery.pageSize" @pagination="getBatchList" />
          <div v-if="!batchLoading && !batchList.length" class="history-empty">
            <i class="el-icon-time"></i>
            <span>暂无符合条件的历史批次</span>
            <el-button type="text" class="dortmund-theme-text" @click="resetBatchQuery">清除筛选</el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer :visible.sync="orphanImageVisible" title="孤儿图片清理" size="980px" append-to-body destroy-on-close
      custom-class="return-drawer return-orphan-drawer" @opened="initializeOrphanQuery">
      <div class="return-drawer-body">
        <div class="orphan-hero">
          <div class="orphan-hero-copy">
            <div class="history-drawer-hero-icon"><i class="el-icon-delete"></i></div>
            <div>
              <strong>未有效关联图片回收</strong>
              <span>处理过期临时、关联失效、待删除和隔离图片；有效已采用组合的图片不会被删除</span>
            </div>
          </div>
          <div class="orphan-hero-stats">
            <span><b>{{ orphanImageList.length }}</b> 张匹配</span>
            <span><b>{{ selectedOrphanIds.length }}</b> 张已选</span>
          </div>
        </div>
        <div class="orphan-legend">
          <el-tag size="mini" type="info">T 临时未提交</el-tag>
          <el-tag size="mini" type="warning">B 关联失效</el-tag>
          <el-tag size="mini" type="danger">D 待删除</el-tag>
          <el-tag size="mini" type="warning">Q 已隔离</el-tag>
          <span><i class="el-icon-info"></i> 查询跨度最多 366 天，单次最多删除 100 张</span>
        </div>
        <div class="orphan-filter-card">
          <el-date-picker v-model="orphanDateRange" size="small" type="daterange" value-format="yyyy-MM-dd"
            range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" clearable />
          <el-button type="primary" size="mini" icon="el-icon-search" :loading="orphanSearchLoading"
            @click="handleOrphanImageSearch">搜索孤儿图片</el-button>
          <el-button type="danger" plain size="mini" icon="el-icon-delete" :loading="orphanDeleteLoading"
            :disabled="!selectedOrphanIds.length" @click="handleDeleteSelectedOrphans"
            v-hasPermi="['dortmund:return:image:remove']">删除选中图片</el-button>
        </div>
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
            <el-table-column label="预览" align="center" width="72">
              <template slot-scope="scope">
                <el-image class="orphan-thumb" :src="baseUrl + scope.row.objectKey" fit="cover"
                  :preview-src-list="orphanImagePreviewList" />
              </template>
            </el-table-column>
            <el-table-column label="原文件名" prop="originalName" min-width="150" show-overflow-tooltip />
            <el-table-column label="状态" align="center" width="104">
              <template slot-scope="scope">
                <el-tag :type="orphanStateTagType(scope.row.imageState)" size="mini">
                  {{ formatOrphanImageState(scope.row.imageState) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="对象键" prop="objectKey" min-width="210" show-overflow-tooltip />
            <el-table-column label="大小" align="center" width="86">
              <template slot-scope="scope">{{ formatFileSize(scope.row.fileSize) }}</template>
            </el-table-column>
            <el-table-column label="上传时间" align="center" width="150">
              <template slot-scope="scope">{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}") || "-"
              }}</template>
            </el-table-column>
            <el-table-column label="过期/重试" align="center" width="150">
              <template slot-scope="scope">
                {{ parseTime(scope.row.nextRetryTime || scope.row.expireTime, "{y}-{m}-{d} {h}:{i}") || "-" }}
              </template>
            </el-table-column>
            <el-table-column label="删除尝试" align="center" prop="deleteAttempts" width="84" />
            <el-table-column label="最近错误" prop="lastError" min-width="160" show-overflow-tooltip />
          </el-table>
          <div v-if="!orphanSearchLoading && !orphanImageList.length" class="history-empty orphan-empty">
            <i class="el-icon-picture-outline"></i>
            <span>所选日期范围内没有可回收的孤儿图片</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer :visible.sync="combinationVisible" title="组合详情" size="720px" append-to-body destroy-on-close
      custom-class="return-drawer">
      <div v-loading="combinationLoading" class="return-drawer-body">
        <div class="return-detail-card">
          <div class="return-detail-title">{{ combinationDetail.combinationTitle || combinationDetail.combinationCode ||
            "-"
          }}</div>
          <div class="return-detail-grid">
            <span><label>组合倍率</label>{{ combinationDetail.combinedOdds || "-" }}</span>
            <span><label>预计回报</label>{{ formatMoneyDisplay(combinationDetail.estimatedReturn) }}</span>
            <span><label>偏差金额</label>{{ formatMoneyDisplay(combinationDetail.deviationAmount) }}</span>
            <span><label>审核状态</label>{{ combinationDetail.adoptedFlag === "Y" ? "已采用" : "未采用" }}</span>
          </div>
          <div class="combination-reason" v-if="combinationDetail.combinationReason">{{
            combinationDetail.combinationReason
          }}</div>
        </div>
        <div class="return-detail-card" v-if="hasImageQueryPermission">
          <div class="return-detail-title">组合图片</div>
          <return-image-upload :combination-id="combinationDetail.combinationId || null"
            :images="combinationDetail.images || []" :adopted-flag="combinationDetail.adoptedFlag || ''"
            :plan-linked="Boolean(combinationDetail.planLinked)" :can-upload="hasImageUploadPermission"
            @changed="refreshCombinationDetail(false)" />
        </div>
        <div class="return-detail-card">
          <div class="return-detail-title">逐场明细</div>
          <el-table :data="combinationDetail.matches || []" size="small" empty-text="暂无明细">
            <el-table-column label="比赛" prop="matchSummary" min-width="180" show-overflow-tooltip />
            <el-table-column label="类型" align="center" width="92">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.fx67ll_dortmund_odds_type || []" :value="scope.row.selectionType" />
              </template>
            </el-table-column>
            <el-table-column label="倍率快照" align="center" prop="oddsValueSnapshot" width="96" />
            <el-table-column label="AI评估权重" align="center" width="108">
              <!-- appliedWeight仅为AI评估权重，不参与金额计算。 -->
              <template slot-scope="scope">{{ formatAppliedWeight(scope.row.appliedWeight) }}</template>
            </el-table-column>
            <el-table-column v-if="hasRemarkQueryPermission" label="选择理由" prop="selectionReason" min-width="170"
              show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-drawer>

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
  deleteOrphanReturnImages,
  getCombination,
  getGeneration,
  listCombination,
  listGeneration,
  listOrphanReturnImages,
  rejectCombination,
} from "@/api/fx67ll/dortmund/returnCombination";
import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import ReturnImageUpload from "./components/ReturnImageUpload/index";

export default {
  name: "DortmundReturnCombination",
  dicts: ["fx67ll_dortmund_odds_type", "fx67ll_ai_analysis_status"],
  components: { DortmundMatchSelectorModal, ReturnImageUpload },
  data() {
    return {
      batchList: [],
      batchTotal: 0,
      batchLoading: false,
      batchExporting: false,
      historyVisible: false,
      batchDateRange: [],
      batchQuery: {
        pageNum: 1,
        pageSize: 10,
        generationStatus: null,
        generationMode: null,
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
      isMoreCombinationQuery: false,
      combinationMatch: null,
      combinationMatchSelectorVisible: false,
      combinationQuery: {
        pageNum: 1,
        pageSize: 10,
        keyword: null,
        generationMode: null,
        adoptedFlag: null,
        generationStatus: null,
        matchId: null,
        sortField: "createTime",
        sortOrder: "desc",
        beginCreateTime: null,
        endCreateTime: null,
      },
      selectedCombinationIds: [],
      batchAdoptLoading: false,
      reviewingId: null,
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
    hasImageUploadPermission() {
      return checkPermi(["dortmund:return:image:upload"]);
    },
    hasRemarkQueryPermission() {
      return checkPermi(["dortmund:return:remark:query"]);
    },
    generationInputSummary() {
      const snapshot = this.generationDetail.requestSnapshot;
      if (!snapshot) {
        return "";
      }
      try {
        const value = JSON.parse(snapshot);
        return `模式：${this.formatGenerationMode(value.generationMode)}\n基础金额：${value.inputAmount}\n目标金额：${value.targetAmount}\n比赛：${(value.matchIds || []).join("、")}`;
      } catch (error) {
        return snapshot;
      }
    },
    combinationMatchLabel() {
      if (!this.combinationMatch) {
        return this.combinationQuery.matchId ? `比赛 #${this.combinationQuery.matchId}` : "";
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
  methods: {
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    formatAppliedWeight(value) {
      // appliedWeight是AI评估权重，仅供解释与复核，不参与任何金额计算。
      return value == null ? "100" : value;
    },
    formatMatchLabel(match) {
      if (!match) {
        return "";
      }
      if (!match.homeTeamName && !match.awayTeamName) {
        return `比赛 #${match.matchId || "-"}`;
      }
      const time = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
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
      const statusMap = { 0: "处理中", 1: "成功", 2: "失败" };
      return statusMap[value] || "-";
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
    resetBatchQuery() {
      this.batchQuery.generationStatus = null;
      this.batchQuery.generationMode = null;
      this.batchDateRange = [];
      this.handleBatchQuery();
    },
    handleBatchExport() {
      const params = { ...this.batchQuery };
      delete params.pageNum;
      delete params.pageSize;
      params.beginCreateTime = null;
      params.endCreateTime = null;
      if (this.batchDateRange && this.batchDateRange.length === 2) {
        params.beginCreateTime = this.batchDateRange[0];
        params.endCreateTime = this.batchDateRange[1];
      }
      this.batchExporting = true;
      this.download("/dortmund/return/generation/export", params,
        `return_generation_${new Date().getTime()}.xlsx`).finally(() => {
          this.batchExporting = false;
        });
    },
    handleCombinationSelectionChange(selection) {
      this.selectedCombinationIds = (selection || []).map((item) => item.combinationId);
    },
    isCombinationSelectable(row) {
      return row.adoptedFlag !== "Y";
    },
    handleBatchAdopt() {
      if (!this.selectedCombinationIds.length) {
        return;
      }
      const count = this.selectedCombinationIds.length;
      this.$modal.confirm(`确认批量采用当前选中的 ${count} 条回报组合？`).then(() => {
        this.batchAdoptLoading = true;
        return batchAdoptCombinations(this.selectedCombinationIds);
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
      if (this.combinationDateRange && this.combinationDateRange.length === 2) {
        this.combinationQuery.beginCreateTime = this.combinationDateRange[0];
        this.combinationQuery.endCreateTime = this.combinationDateRange[1];
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
    resetCombinationQuery() {
      this.combinationQuery.keyword = null;
      this.combinationQuery.generationMode = null;
      this.combinationQuery.adoptedFlag = null;
      this.combinationQuery.generationStatus = null;
      this.combinationQuery.matchId = null;
      this.combinationQuery.sortField = "createTime";
      this.combinationQuery.sortOrder = "desc";
      this.combinationDateRange = [];
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
        return `${(bytes / 1024).toFixed(1)} KB`;
      }
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
    handleGenerationDetail(row) {
      this.historyVisible = false;
      this.combinationVisible = false;
      this.generationVisible = true;
      this.generationLoading = true;
      this.generationDetail = {};
      getGeneration(row.generationId).then((response) => {
        this.generationDetail = (response && response.data) || {};
      }).catch(() => {
        this.generationVisible = false;
      }).finally(() => {
        this.generationLoading = false;
      });
    },
    handleCombinationDetail(row) {
      this.historyVisible = false;
      this.generationVisible = false;
      this.combinationVisible = true;
      this.combinationDetail = {};
      this.refreshCombinationDetail(true, row.combinationId);
    },
    refreshCombinationDetail(showLoading = true, combinationId = null) {
      const targetId = combinationId || this.combinationDetail.combinationId;
      if (!targetId) return Promise.resolve();
      if (showLoading) this.combinationLoading = true;
      return getCombination(targetId).then((response) => {
        this.combinationDetail = (response && response.data) || {};
      }).catch(() => {
        if (showLoading) this.combinationVisible = false;
      }).finally(() => {
        if (showLoading) this.combinationLoading = false;
      });
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
    handleExport() {
      const params = {
        keyword: this.combinationQuery.keyword,
        generationMode: this.combinationQuery.generationMode,
        adoptedFlag: this.combinationQuery.adoptedFlag,
        generationStatus: this.combinationQuery.generationStatus,
        matchId: this.combinationQuery.matchId,
        beginCreateTime: null,
        endCreateTime: null,
      };
      if (this.combinationDateRange && this.combinationDateRange.length === 2) {
        params.beginCreateTime = this.combinationDateRange[0];
        params.endCreateTime = this.combinationDateRange[1];
      }
      this.download("/dortmund/return/export", {
        ...params,
        sortField: this.combinationQuery.sortField,
        sortOrder: this.combinationQuery.sortOrder,
      }, `return_combination_${new Date().getTime()}.xlsx`);
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

.combination-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;

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

.combination-empty {
  min-height: 160px;
  margin-top: 10px;
}

.history-drawer-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f2fbf6 0%, #ffffff 100%);
  border: 1px solid #dcebe3;
  border-radius: 14px;
  animation: returnRise 0.28s ease both;
}

.history-drawer-hero-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  color: #fff;
  background: var(--current-color, #2ecc71);
  border-radius: 11px;
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.22);
}

.history-drawer-hero-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    font-size: 14px;
    color: #2b3a36;
  }

  span {
    overflow: hidden;
    font-size: 12px;
    color: #7c8b84;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.history-drawer-count {
  flex-shrink: 0;
  padding: 4px 9px;
  margin-left: auto;
  font-size: 12px;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 999px;
}

.history-drawer-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;

  .history-drawer-count {
    margin-left: 0;
  }
}

@at-root {
  .orphan-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #f2fbf6 0%, #ffffff 62%, #fff9f0 100%);
    border: 1px solid #dcebe3;
    border-radius: 14px;
    animation: returnRise 0.28s ease both;
  }

  .orphan-hero-copy {
    display: flex;
    align-items: center;
    gap: 12px;

    >div:last-child {
      display: grid;
      gap: 4px;
    }

    strong {
      font-size: 14px;
      color: #2b3a36;
    }

    span {
      font-size: 12px;
      color: #7c8b84;
    }
  }

  .orphan-hero-stats {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    span {
      padding: 6px 10px;
      font-size: 12px;
      color: #5f746b;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid #e2eee7;
      border-radius: 10px;
    }

    b {
      color: #27ad60;
    }
  }

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
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 14px 16px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #e3eee8;
    border-radius: 14px;
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

.return-input-summary {
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

  .history-drawer-hero,
  .history-table-card {
    padding: 12px;
  }

  .history-drawer-hero {
    align-items: flex-start;
  }

  .history-drawer-count {
    display: none;
  }

}
</style>
