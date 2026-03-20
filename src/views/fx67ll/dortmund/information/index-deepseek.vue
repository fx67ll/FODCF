<template>
    <div class="app-container">
        <!-- 头部：赛季选择器 -->
        <el-row :gutter="10" class="mb8">
            <el-col :span="4">
                <el-select v-model="seasonId" placeholder="请选择赛季" clearable @change="handleSeasonChange">
                    <el-option v-for="item in seasonOptions" :key="item.seasonId" :label="item.seasonName"
                        :value="item.seasonId" />
                </el-select>
            </el-col>
            <el-col :span="20" class="text-right">
                <el-button type="primary" icon="el-icon-plus" @click="handleAddMatch">新增比赛</el-button>
            </el-col>
        </el-row>

        <!-- 主体：左右分栏 -->
        <el-row :gutter="10">
            <!-- 左侧：比赛列表 -->
            <el-col :span="10">
                <el-card shadow="never" class="match-list-card">
                    <div slot="header">
                        <span>比赛列表</span>
                    </div>
                    <el-table :data="matchList" stripe style="width: 100%" @row-click="handleRowClick"
                        highlight-current-row>
                        <el-table-column prop="matchTime" label="比赛时间" width="100">
                            <template slot-scope="scope">
                                {{ parseTime(scope.row.matchTime, '{y}-{m}-{d}') }}
                            </template>
                        </el-table-column>
                        <el-table-column label="对阵" min-width="120">
                            <template slot-scope="scope">
                                <span>{{ scope.row.homeTeamName }} vs {{ scope.row.awayTeamName }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="analysisCount" label="分析次数" width="80" align="center" />
                        <el-table-column label="操作" width="120" fixed="right">
                            <template slot-scope="scope">
                                <el-button size="mini" type="text" icon="el-icon-video-play"
                                    @click="handleAIAnalysis(scope.row)">AI分析</el-button>
                                <el-button size="mini" type="text" icon="el-icon-view"
                                    @click="handleViewScore(scope.row)">查看评分</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>

            <!-- 右侧：分析记录 + 评分详情 -->
            <el-col :span="14">
                <el-card shadow="never">
                    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
                        <!-- 分析记录标签页 -->
                        <el-tab-pane label="分析记录" name="analysis">
                            <el-table :data="analysisList" stripe style="width: 100%">
                                <el-table-column prop="createTime" label="分析时间" width="150">
                                    <template slot-scope="scope">
                                        {{ parseTime(scope.row.createTime) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="promptName" label="使用模板" min-width="120" />
                                <el-table-column prop="modelName" label="AI模型" width="100" />
                                <el-table-column label="操作" width="100">
                                    <template slot-scope="scope">
                                        <el-button size="mini" type="text" :disabled="!scope.row.hasScore"
                                            @click="viewScoreDetail(scope.row)">查看评分</el-button>
                                        <el-button v-if="!scope.row.hasScore" size="mini" type="text"
                                            @click="generateScore(scope.row)">生成评分</el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-tab-pane>

                        <!-- 评分详情标签页 -->
                        <el-tab-pane label="评分详情" name="score">
                            <div v-if="scoreDetail.matchId">
                                <el-descriptions :column="2" border>
                                    <el-descriptions-item label="主队进攻评分">{{ scoreDetail.homeAttackScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="客队进攻评分">{{ scoreDetail.awayAttackScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="主队防守评分">{{ scoreDetail.homeDefenseScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="客队防守评分">{{ scoreDetail.awayDefenseScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="主队健康评分">{{ scoreDetail.homeInjuryScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="客队健康评分">{{ scoreDetail.awayInjuryScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="主队历史评分">{{ scoreDetail.homeHistoryScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="客队历史评分">{{ scoreDetail.awayHistoryScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="主队综合评分">{{ scoreDetail.homeTotalScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="客队综合评分">{{ scoreDetail.awayTotalScore
                                        }}</el-descriptions-item>
                                    <el-descriptions-item label="预测结果">
                                        <el-tag :type="scoreDetail.predictedResult | resultTagFilter">
                                            {{ scoreDetail.predictedResult | resultTextFilter }}
                                        </el-tag>
                                    </el-descriptions-item>
                                    <el-descriptions-item label="置信度">{{ scoreDetail.predictedConfidence
                                        }}%</el-descriptions-item>
                                </el-descriptions>
                            </div>
                            <div v-else class="text-center" style="color: #999; padding: 20px;">
                                请先选择一场比赛并查看评分
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </el-card>
            </el-col>
        </el-row>

        <!-- 新增比赛对话框 -->
        <el-dialog title="新增比赛" :visible.sync="matchDialog.visible" width="500px">
            <el-form ref="matchForm" :model="matchDialog.form" :rules="matchDialog.rules" label-width="100px">
                <el-form-item label="所属赛季" prop="seasonId">
                    <el-select v-model="matchDialog.form.seasonId" placeholder="请选择赛季" disabled>
                        <el-option :label="seasonName" :value="seasonId" />
                    </el-select>
                </el-form-item>
                <el-form-item label="主队" prop="homeTeamId">
                    <el-select v-model="matchDialog.form.homeTeamId" placeholder="请选择主队" filterable>
                        <el-option v-for="item in teamOptions" :key="item.teamId" :label="item.teamName"
                            :value="item.teamId" />
                    </el-select>
                </el-form-item>
                <el-form-item label="客队" prop="awayTeamId">
                    <el-select v-model="matchDialog.form.awayTeamId" placeholder="请选择客队" filterable>
                        <el-option v-for="item in teamOptions" :key="item.teamId" :label="item.teamName"
                            :value="item.teamId" />
                    </el-select>
                </el-form-item>
                <el-form-item label="比赛时间" prop="matchTime">
                    <el-date-picker v-model="matchDialog.form.matchTime" type="datetime" placeholder="选择比赛时间"
                        format="yyyy-MM-dd HH:mm" value-format="yyyy-MM-dd HH:mm:ss" />
                </el-form-item>
            </el-form>
            <span slot="footer">
                <el-button @click="matchDialog.visible = false">取 消</el-button>
                <el-button type="primary" @click="submitMatch">确 定</el-button>
            </span>
        </el-dialog>

        <!-- AI分析对话框 -->
        <el-dialog title="AI分析" :visible.sync="analysisDialog.visible" width="500px">
            <el-form ref="analysisForm" :model="analysisDialog.form" :rules="analysisDialog.rules" label-width="100px">
                <el-form-item label="分析类型" prop="analysisType">
                    <el-radio-group v-model="analysisDialog.form.analysisType">
                        <el-radio label="0">模板分析</el-radio>
                        <el-radio label="1">自定义分析</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="analysisDialog.form.analysisType === '0'" label="选择模板" prop="promptId">
                    <el-select v-model="analysisDialog.form.promptId" placeholder="请选择Prompt模板" filterable>
                        <el-option v-for="item in promptOptions" :key="item.promptId" :label="item.promptName"
                            :value="item.promptId" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="analysisDialog.form.analysisType === '1'" label="分析内容" prop="customPrompt">
                    <el-input type="textarea" :rows="4" v-model="analysisDialog.form.customPrompt"
                        placeholder="请输入分析要求或自定义Prompt" />
                </el-form-item>
            </el-form>
            <span slot="footer">
                <el-button @click="analysisDialog.visible = false">取 消</el-button>
                <el-button type="primary" @click="submitAnalysis">开始分析</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { listSeason } from '@/api/fx67ll/dortmund/season'
import { listMatch, addMatch } from '@/api/fx67ll/dortmund/match'
import { listTeam } from '@/api/fx67ll/dortmund/team'
import { listTemplate } from '@/api/fx67ll/ai/template'
import { listAnalysis, addAnalysis } from '@/api/fx67ll/dortmund/analysis'
import { listScore, addScore } from '@/api/fx67ll/dortmund/score'

export default {
    name: 'MatchAnalysisWorkbench',
    data() {
        return {
            // 赛季相关
            seasonId: null,
            seasonName: '',
            seasonOptions: [],
            // 比赛列表
            matchList: [],
            currentMatchId: null,         // 当前选中的比赛ID
            // 右侧标签页
            activeTab: 'analysis',
            // 分析记录列表
            analysisList: [],
            // 评分详情
            scoreDetail: {},
            // 下拉选项数据
            teamOptions: [],
            promptOptions: [],
            // 新增比赛对话框
            matchDialog: {
                visible: false,
                form: {
                    seasonId: null,
                    homeTeamId: null,
                    awayTeamId: null,
                    matchTime: ''
                },
                rules: {
                    homeTeamId: [{ required: true, message: '请选择主队', trigger: 'change' }],
                    awayTeamId: [{ required: true, message: '请选择客队', trigger: 'change' }],
                    matchTime: [{ required: true, message: '请选择比赛时间', trigger: 'change' }]
                }
            },
            // AI分析对话框
            analysisDialog: {
                visible: false,
                form: {
                    matchId: null,
                    analysisType: '0',
                    promptId: null,
                    customPrompt: ''
                },
                rules: {
                    analysisType: [{ required: true, message: '请选择分析类型', trigger: 'change' }],
                    promptId: [{ required: true, message: '请选择模板', trigger: 'change' }],
                    customPrompt: [{ required: true, message: '请输入分析内容', trigger: 'blur' }]
                }
            }
        }
    },
    filters: {
        // 预测结果标签样式
        resultTagFilter(val) {
            const map = { '0': 'success', '1': 'info', '2': 'danger' }
            return map[val] || ''
        },
        resultTextFilter(val) {
            const map = { '0': '主队胜', '1': '平局', '2': '客队胜' }
            return map[val] || '未知'
        }
    },
    created() {
        this.loadSeasons()
        this.loadTeams()        // 预加载球队数据
        this.loadPrompts()      // 预加载模板数据
    },
    methods: {
        loadSeasons() {
            listSeason({ seasonStatus: '0' }).then(res => {
                this.seasonOptions = res.data || []
                if (this.seasonOptions.length > 0) {
                    this.seasonId = this.seasonOptions[0].seasonId
                    this.seasonName = this.seasonOptions[0].seasonName
                    this.loadMatches()
                }
            })
        },
        handleSeasonChange(val) {
            if (val) {
                const season = this.seasonOptions.find(s => s.seasonId === val)
                this.seasonName = season ? season.seasonName : ''
                this.loadMatches()
            } else {
                this.matchList = []
            }
        },
        loadMatches() {
            if (!this.seasonId) return
            listMatch({ seasonId: this.seasonId }).then(res => {
                this.matchList = res.data || []
                if (this.matchList.length > 0) {
                    this.handleRowClick(this.matchList[0])
                }
            })
        },
        loadTeams() {
            listTeam({ teamStatus: '0' }).then(res => {
                this.teamOptions = res.data || []
            })
        },
        loadPrompts() {
            listTemplate({ promptStatus: '0' }).then(res => {
                this.promptOptions = res.data || []
            })
        },
        handleRowClick(row) {
            this.currentMatchId = row.matchId
            this.loadAnalysisList()
            if (this.activeTab === 'score') {
                this.loadScoreDetail()
            }
        },
        loadAnalysisList() {
            if (!this.currentMatchId) return
            listAnalysis({ matchId: this.currentMatchId }).then(res => {
                this.analysisList = res.data || []
            })
        },
        loadScoreDetail() {
            if (!this.currentMatchId) return
            listScore({ matchId: this.currentMatchId }).then(res => {
                this.scoreDetail = res.data && res.data.length > 0 ? res.data[0] : {}
            })
        },
        handleAddMatch() {
            if (!this.seasonId) {
                this.$message.warning('请先选择赛季')
                return
            }
            this.matchDialog.form.seasonId = this.seasonId
            this.matchDialog.form.homeTeamId = null
            this.matchDialog.form.awayTeamId = null
            this.matchDialog.form.matchTime = ''
            this.matchDialog.visible = true
            this.$nextTick(() => {
                this.$refs.matchForm?.clearValidate()
            })
        },
        submitMatch() {
            this.$refs.matchForm.validate(valid => {
                if (valid) {
                    addMatch(this.matchDialog.form).then(res => {
                        this.$modal.msgSuccess('新增成功')
                        this.matchDialog.visible = false
                        this.loadMatches()
                    })
                }
            })
        },
        handleAIAnalysis(row) {
            this.analysisDialog.form.matchId = row.matchId
            this.analysisDialog.form.analysisType = '0'
            this.analysisDialog.form.promptId = null
            this.analysisDialog.form.customPrompt = ''
            this.analysisDialog.visible = true
            this.$nextTick(() => {
                this.$refs.analysisForm?.clearValidate()
            })
        },
        submitAnalysis() {
            this.$refs.analysisForm.validate(valid => {
                if (valid) {
                    const params = { ...this.analysisDialog.form }
                    addAnalysis(params).then(res => {
                        this.$modal.msgSuccess('分析请求已提交')
                        this.analysisDialog.visible = false
                        this.loadAnalysisList()
                    })
                }
            })
        },
        handleViewScore(row) {
            this.currentMatchId = row.matchId
            this.activeTab = 'score'
            this.loadScoreDetail()
        },
        handleTabClick(tab) {
            if (tab.name === 'score' && this.currentMatchId) {
                this.loadScoreDetail()
            }
        },
        viewScoreDetail(analysis) {
            this.activeTab = 'score'
            listScore({ analysisId: analysis.analysisId }).then(res => {
                this.scoreDetail = res.data && res.data.length > 0 ? res.data[0] : {}
            })
        },
        generateScore(analysis) {
            addScore({ analysisId: analysis.analysisId }).then(res => {
                this.$modal.msgSuccess('评分生成中，请稍后刷新')
                setTimeout(() => {
                    this.loadAnalysisList()
                    if (this.activeTab === 'score') this.loadScoreDetail()
                }, 2000)
            })
        }
    }
}
</script>

<style scoped>
.match-list-card .el-table {
    cursor: pointer;
}

.text-right {
    text-align: right;
}

.mb8 {
    margin-bottom: 8px;
}
</style>