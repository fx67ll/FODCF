<template>
  <!-- 信息点详情抽屉（只读，数据由父页面拉取后传入，开关由父页面 .sync 维护） -->
  <dortmund-detail-drawer :visible.sync="dialogVisible" title="信息点详情"
    :subtitle="detailModel.pointTitle || '查看信息点内容、归属与来源链路'" icon="el-icon-document" tone="green" size="720px"
    :loading="detailLoading" feature="info">
    <dortmund-detail-card title="信息点概览" icon="el-icon-collection-tag" tone="green">
      <div class="info-overview-grid">
        <div v-for="item in infoOverviewItems" :key="item.key" class="info-overview-item">
          <span class="info-overview-icon"><i :class="item.icon"></i></span>
          <div class="info-overview-copy">
            <span class="info-overview-label">{{ item.label }}</span>
            <dict-tag v-if="hasDisplayValue(item.value)" :options="item.options" :value="item.value" />
            <span v-else class="info-overview-empty">{{ item.emptyText }}</span>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>

      <div class="info-affiliation" :data-state="businessScopeState">
        <span class="info-affiliation-mark"><i class="el-icon-connection"></i></span>
        <div class="info-affiliation-main">
          <span class="info-affiliation-label">业务归属</span>
          <strong>{{ businessScopeText() }}</strong>
          <span class="info-affiliation-hint">{{ businessScopeHint() || '未关联业务主体' }}</span>
        </div>
        <div v-if="businessScopeFacts.length" class="info-affiliation-facts">
          <div v-for="fact in businessScopeFacts" :key="fact.label" class="info-affiliation-fact">
            <span>{{ fact.label }}</span>
            <strong>{{ displayValue(fact.value, fact.emptyText || '-') }}</strong>
          </div>
        </div>
      </div>
    </dortmund-detail-card>

    <dortmund-detail-card title="信息点内容" icon="el-icon-tickets" tone="green">
      <div class="dortmund-detail-field">
        <span class="dortmund-detail-field-label">信息点标题</span>
        <strong class="dortmund-detail-field-value">{{ displayValue(detailModel.pointTitle, '未填写标题') }}</strong>
      </div>
      <div class="dortmund-detail-subheading">正文</div>
      <div class="info-detail-article">{{ displayValue(detailModel.pointContent, '暂无正文内容') }}</div>
      <template v-if="detailModel.infoPointType === 'T'">
        <div class="dortmund-detail-subheading">关联球队（含历史停用关系）</div>
        <template v-if="Array.isArray(detailModel.teamRels)">
          <div v-if="detailModel.teamRels.length" class="info-detail-team-list">
            <div v-for="rel in detailModel.teamRels" :key="rel.relationId || rel.teamId" class="info-detail-team-rel">
              <div class="info-detail-team-main">
                <strong>{{ formatTeamRelationName(rel) }}</strong>
                <span>{{ formatTeamRelationMeta(rel) }}</span>
                <span class="info-detail-team-audit">{{ formatTeamRelationAudit(rel) }}</span>
              </div>
              <dict-tag :options="dict.type.sys_normal_disable" :value="rel.relationStatus" />
            </div>
          </div>
          <div v-else class="dortmund-detail-text-block">暂无关联球队</div>
        </template>
        <div v-else class="dortmund-detail-text-block">关联球队信息未加载</div>
      </template>
    </dortmund-detail-card>

    <dortmund-detail-card title="来源与有效期" icon="el-icon-link" tone="green">
      <div class="info-detail-source-grid">
        <div class="info-detail-source-item">
          <span>来源名称</span>
          <strong>{{ displayValue(detailModel.sourceName, '未填写') }}</strong>
        </div>
        <div class="info-detail-source-item">
          <span>来源地址</span>
          <el-link v-if="sourceUrlValid" class="info-detail-source-link" :href="detailModel.sourceUrl" target="_blank"
            rel="noopener noreferrer" type="success" :underline="false" icon="el-icon-link">
            {{ detailModel.sourceUrl }}
          </el-link>
          <strong v-else>{{ displayValue(detailModel.sourceUrl, '未填写') }}</strong>
        </div>
      </div>
      <div class="dortmund-detail-subheading">来源时间线</div>
      <dortmund-detail-block variant='evidence' tone='green' :items='infoSourceTimeline' />
    </dortmund-detail-card>

    <dortmund-detail-card title="信息点备注" icon="el-icon-document" tone="green">
      <div class="dortmund-detail-text-block">{{ displayValue(detailModel.pointRemark, '暂无备注') }}</div>
    </dortmund-detail-card>

    <dortmund-detail-card title="记录轨迹" subtitle="归属、创建与最近更新" icon="el-icon-time" tone="green">
      <dortmund-record-trail :items="infoRecordTrail" empty-text="暂无信息点记录轨迹" />
    </dortmund-detail-card>
    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="dialogVisible = false">关闭</el-button>
    </template>
  </dortmund-detail-drawer>
</template>

<script>
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundDetailBlock from "@/views/fx67ll/dortmund/other/component/DortmundDetailBlock/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";

import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";
export default {
  name: "InfoDetailDialog",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_info_point_type", "fx67ll_dortmund_allow_public"],
  components: { DortmundDetailDrawer, DortmundDetailCard, DortmundDetailBlock, DortmundRecordTrail },
  computed: {
    // 概览的三项状态拆成独立单元，避免标签堆叠后无法快速扫读
    infoOverviewItems() {
      return [
        {
          key: 'type',
          label: '信息点类型',
          value: this.detailModel.infoPointType,
          options: this.dict.type.fx67ll_dortmund_info_point_type,
          icon: 'el-icon-collection-tag',
          emptyText: '未设置',
          description: this.infoPointType === 'T'
            ? '赛季球队长期信息点'
            : this.infoPointType === 'M' ? '比赛临时信息点' : '信息点类型未识别',
        },
        {
          key: 'status',
          label: '信息点状态',
          value: this.detailModel.pointStatus,
          options: this.dict.type.sys_normal_disable,
          icon: 'el-icon-data-analysis',
          emptyText: '未设置',
          description: this.pointStatusDescription,
        },
        {
          key: 'public',
          label: '公开范围',
          value: this.detailModel.allowPublic,
          options: this.dict.type.fx67ll_dortmund_allow_public,
          icon: 'el-icon-lock',
          emptyText: '未设置',
          description: this.allowPublicDescription,
        },
      ];
    },
    infoPointType() {
      return this.detailModel.infoPointType || '';
    },
    pointStatusDescription() {
      const status = this.detailModel.pointStatus;
      if (status === '0') {
        return '当前启用，可参与业务使用';
      }
      if (status === '1') {
        return '已停用，不参与后续分析';
      }
      return '状态尚未设置';
    },
    allowPublicDescription() {
      const allowPublic = this.detailModel.allowPublic;
      if (allowPublic === '1') {
        return '可对外公开引用';
      }
      if (allowPublic === '0') {
        return '仅限系统内部使用';
      }
      return '公开范围尚未设置';
    },
    // 业务归属直接使用详情接口的赛季/比赛关联字段，不再复用通用指标块
    businessScopeFacts() {
      if (this.infoPointType === 'T') {
        return [
          { label: '所属赛季', value: this.detailModel.seasonName, emptyText: '未关联' },
          {
            label: '关联球队',
            value: Array.isArray(this.detailModel.teamRels) ? `${this.detailModel.teamRels.length} 支` : null,
            emptyText: '未加载',
          },
        ];
      }
      if (this.infoPointType === 'M') {
        return [
          { label: '主队', value: this.detailModel.homeTeamName, emptyText: '待定' },
          { label: '客队', value: this.detailModel.awayTeamName, emptyText: '待定' },
          {
            label: '比赛时间',
            value: this.formatTime(this.detailModel.matchTime, '未记录'),
            emptyText: '未记录',
          },
        ];
      }
      return [];
    },
    businessScopeState() {
      if (this.infoPointType === 'T' && this.hasDisplayValue(this.detailModel.seasonId)) {
        return 'season';
      }
      if (this.infoPointType === 'M' && this.hasDisplayValue(this.detailModel.matchId)) {
        return 'match';
      }
      return 'empty';
    },
    infoSourceTimeline() {
      return [
        { label: '来源发布时间', value: this.formatTime(this.detailModel.sourcePublishTime, '未填写'), icon: 'el-icon-postcard' },
        { label: '采集/录入时间', value: this.formatTime(this.detailModel.collectTime, '未记录'), icon: 'el-icon-download' },
        { label: '生效时间', value: this.formatTime(this.detailModel.effectiveStartTime, '不限制'), icon: 'el-icon-open' },
        { label: '失效时间', value: this.formatTime(this.detailModel.effectiveEndTime, '不限制'), icon: 'el-icon-open' },
      ];
    },
    infoRecordTrail() {
      const createTime = this.formatTime(this.detailModel.createTime, '');
      const updateTime = this.formatTime(this.detailModel.updateTime, '');
      return [
        { key: 'create', label: '创建记录', value: formatAuditActor(this.detailModel.createBy), hint: createTime ? `创建时间 · ${createTime}` : '', icon: 'el-icon-edit-outline', state: 'success' },
        { key: 'update', label: '最近更新', value: formatAuditActor(this.detailModel.updateBy), hint: updateTime ? `更新时间 · ${updateTime}` : '', icon: 'el-icon-refresh', state: 'warning' },
      ];
    },
    sourceUrlValid() {
      const url = String(this.detailModel.sourceUrl || '').trim();
      return /^https?:\/\//i.test(url);
    },
    // 抽屉开关双向绑定：透传父页面维护
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  props: {
    // 抽屉开关（父页面 .sync 维护，保留原组件契约）
    visible: {
      type: Boolean,
      default: false,
    },
    // 完整只读详情（父页面拉取，拉取前为空对象兜底）
    detailModel: {
      type: Object,
      default: () => ({}),
    },
    // 详情加载状态
    detailLoading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    // 统一空值处理：仅 null、undefined 和空白字符串视为缺失，保留数字 0
    displayValue(value, fallback = '-') {
      if (value === null || value === undefined) {
        return fallback;
      }
      const normalized = String(value).trim();
      return normalized === '' ? fallback : normalized;
    },
    // 数字 0 属于有效业务值，仅 null、undefined 和空白字符串视为缺失
    hasDisplayValue(value) {
      if (value === null || value === undefined) {
        return false;
      }
      return String(value).trim() !== '';
    },
    // 字典值转标签，字典尚未加载或值缺失时使用明确兜底文案
    displayDict(options, value, fallback = '-') {
      if (value === null || value === undefined || value === '') {
        return fallback;
      }
      const label = this.selectDictLabel(options || [], value);
      return label || String(value);
    },
    // 日期统一格式化，空值按字段语义使用不同兜底文案
    formatTime(value, fallback = '-') {
      const text = this.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}');
      return text || fallback;
    },
    // 业务归属：T 类型取赛季，M 类型取比赛对阵
    businessScopeText() {
      if (this.detailModel.infoPointType === 'T') {
        if (this.hasDisplayValue(this.detailModel.seasonName)) {
          return this.detailModel.seasonName;
        }
        return '未关联赛季';
      }
      if (this.detailModel.infoPointType === 'M') {
        return this.formatMatchColumnText(this.detailModel)
          || '未关联比赛';
      }
      return '未识别归属';
    },
    // 业务归属辅助说明：只表达归属来源，不展示底层主键。
    businessScopeHint() {
      if (this.detailModel.infoPointType === 'T') {
        return '按赛季资料归属';
      }
      if (this.detailModel.infoPointType === 'M') {
        return '按比赛资料归属';
      }
      return '';
    },
    // 球队关系名称兜底，不暴露球队主键。
    formatTeamRelationName(rel) {
      if (rel && rel.teamName) {
        return rel.teamName;
      }
      return '球队信息缺失';
    },
    // 球队关系仅展示关系状态，不再展示关系和球队主键。
    formatTeamRelationMeta(rel) {
      if (!rel) {
        return '关系信息缺失';
      }
      const relationStatus = this.selectDictLabel(this.dict.type.sys_normal_disable, rel.relationStatus);
      return relationStatus ? `关系状态 · ${relationStatus}` : '球队关联信息';
    },
    // 球队关系审计时间：建立与最近更新均来自关系表，不使用信息点主记录时间冒充
    formatTeamRelationAudit(rel) {
      if (!rel) {
        return '暂无关系审计时间';
      }
      const createTime = this.formatTime(rel.createTime, '');
      const updateTime = this.formatTime(rel.updateTime, '');
      const createActor = formatAuditActor(rel.createBy);
      const updateActor = formatAuditActor(rel.updateBy);
      const parts = [];
      if (createActor || createTime) {
        parts.push(`建立${createActor ? ` · ${createActor}` : ''}${createTime ? ` · ${createTime}` : ''}`);
      }
      if (updateActor || updateTime) {
        parts.push(`更新${updateActor ? ` · ${updateActor}` : ''}${updateTime ? ` · ${updateTime}` : ''}`);
      }
      return parts.length ? parts.join(' · ') : '暂无关系审计时间';
    },
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}:{s}");
      const homeName = this.displayValue(match.homeTeamName, '主队待定');
      const awayName = this.displayValue(match.awayTeamName, '客队待定');
      const vsText = `${homeName} vs ${awayName}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 比赛列展示文案：仅 M 类型且存在比赛 ID 时展示对阵
    formatMatchColumnText(row) {
      if (row.infoPointType !== "M" || !row.matchId) {
        return "";
      }
      return this.formatMatchVsTimeText(row);
    },
  },
};
</script>

<style lang="scss" scoped>
.info-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 2px 0 18px;
  border-bottom: 1px solid #edf1ef;
}

.info-overview-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
  padding: 2px 18px;
  border-left: 1px solid #edf1ef;

  &:first-child {
    padding-left: 0;
    border-left: 0;
  }

  &:last-child {
    padding-right: 0;
  }
}

.info-overview-icon {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #2e9b68;
  font-size: 13px;
  background: #eef8f2;
  border-radius: 8px;
}

.info-overview-copy {
  min-width: 0;

  p {
    margin: 6px 0 0;
    font-size: 11px;
    line-height: 1.5;
    color: #87948d;
    overflow-wrap: anywhere;
  }
}

.info-overview-label {
  display: block;
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #7c8b84;
  letter-spacing: .06em;
}

.info-overview-empty {
  display: inline-block;
  padding: 1px 8px;
  font-size: 11px;
  color: #8a9790;
  background: #f4f7f5;
  border-radius: 999px;
}

.info-affiliation {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
  align-items: flex-start;
  padding: 14px 16px;
  margin-top: 18px;
  background: #f6fbf8;
  border-left: 3px solid #3f8f77;
  border-radius: 0 8px 8px 0;

  &[data-state='empty'] {
    background: #f8faf9;
    border-left-color: #c8d5cd;
  }
}

.info-affiliation-mark {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #2e9b68;
  font-size: 15px;
  background: #e9f7ef;
  border-radius: 9px;

  .info-affiliation[data-state='empty'] & {
    color: #82918a;
    background: #eef3f0;
  }
}

.info-affiliation-main {
  flex: 1 1 240px;
  min-width: 0;

  strong {
    display: block;
    font-size: 15px;
    font-weight: 750;
    line-height: 1.5;
    color: #22342b;
    overflow-wrap: anywhere;
  }
}

.info-affiliation-label {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #6f8278;
  letter-spacing: .06em;
}

.info-affiliation-hint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: #7e8d85;
  overflow-wrap: anywhere;
}

.info-affiliation-facts {
  display: grid;
  flex: 1 1 100%;
  grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
  gap: 10px 18px;
  padding-top: 12px;
  border-top: 1px solid #e4f0e8;
}

.info-affiliation-fact {
  min-width: 0;

  span {
    display: block;
    margin-bottom: 3px;
    font-size: 10px;
    font-weight: 700;
    color: #819087;
    letter-spacing: .04em;
  }

  strong {
    display: block;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.45;
    color: #35473e;
    overflow-wrap: anywhere;
  }
}

.info-detail-article {
  min-height: 110px;
  padding: 2px 0 2px 16px;
  font-size: 14.5px;
  line-height: 1.9;
  color: #33453d;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: transparent;
  border: 0;
  border-left: 2px solid #3f8f77;
  border-radius: 0;
}

.info-detail-source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  padding: 2px 0 16px;
  border-bottom: 1px solid #edf1ef;
}

.info-detail-source-item {
  min-width: 0;

  span {
    display: block;
    margin-bottom: 5px;
    font-size: 10px;
    font-weight: 700;
    color: #7c8b84;
    letter-spacing: .05em;
  }

  strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.55;
    color: #26362e;
    overflow-wrap: anywhere;
  }
}

.info-detail-source-link {
  max-width: 100%;
  font-size: 13px;
  line-height: 1.55;
  word-break: break-all;
}

.info-detail-team-list {
  display: grid;
  gap: 0;
}

.info-detail-team-rel {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  font-size: 13px;
  color: #2d3d35;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf1ef;
  border-radius: 0;
}

.info-detail-team-rel:last-child {
  border-bottom: 0;
}

.info-detail-team-main {
  display: grid;
  min-width: 0;
  gap: 3px;

  strong {
    font-size: 13px;
    font-weight: 700;
    color: #26362e;
    overflow-wrap: anywhere;
  }

  span {
    font-size: 11px;
    line-height: 1.45;
    color: #87948d;
    overflow-wrap: anywhere;
  }

  .info-detail-team-audit {
    color: #6f7f77;
  }
}

@media (max-width: 520px) {
  .info-detail-source-grid {
    grid-template-columns: 1fr;
  }

  .info-affiliation-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .info-overview-grid {
    grid-template-columns: 1fr;
  }

  .info-overview-item {
    padding: 13px 0;
    border-top: 1px solid #edf1ef;
    border-left: 0;

    &:first-child {
      padding-top: 0;
      border-top: 0;
    }

    &:last-child {
      padding-bottom: 0;
    }
  }
}
</style>
