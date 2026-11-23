<template>
  <dortmund-detail-drawer :visible.sync="drawerVisible" title="球队详情" :subtitle="detail.teamName || '查看球队资料、归属标签与审计信息'"
    icon="el-icon-s-custom" tone="green" size="680px" feature="team" :loading="loading" :level="level">
    <section class="team-detail-hero">
      <div class="team-detail-crest">
        <el-image v-if="detail.teamLogoUrl" :src="detail.teamLogoUrl" fit="cover"
          :preview-src-list="[detail.teamLogoUrl]" error-icon="el-icon-picture-outline" />
        <i v-else class="el-icon-postcard"></i>
      </div>
      <div class="team-detail-headline">
        <span class="team-detail-kicker">球队档案</span>
        <div class="team-detail-title-row">
          <h3>{{ displayValue(detail.teamName, '未填写球队全称') }}</h3>
          <dict-tag v-if="hasDisplayValue(detail.teamStatus)" :options="dict.type.sys_normal_disable"
            :value="detail.teamStatus" />
          <span v-else class="team-detail-status-empty">状态未设置</span>
        </div>
        <p>{{ displayValue(detail.teamNameShort, '未填写昵称') }}<template v-if="displayValue(detail.teamNameEn, '')"> · {{
          detail.teamNameEn }}</template></p>
        <span class="team-detail-code"><i class="el-icon-collection-tag"></i>{{
          displayValue(detail.teamCode, '未填写编码') }}</span>
      </div>
    </section>

    <div class="team-detail-summary">
      <article v-for="item in summaryMetrics" :key="item.label" class="team-detail-summary-item">
        <span class="team-detail-summary-icon"><i :class="item.icon"></i></span>
        <div class="team-detail-summary-copy">
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        </div>
      </article>
    </div>

    <dortmund-detail-card title="身份与编码" icon="el-icon-postcard" tone="green">
      <div class="team-detail-field-grid">
        <div v-for="item in identityFields" :key="item.label" class="team-detail-field">
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        </div>
      </div>
    </dortmund-detail-card>

    <dortmund-detail-card title="主场与归属" icon="el-icon-office-building" tone="green">
      <div class="team-detail-field-grid">
        <div v-for="item in ownershipFields" :key="item.label" class="team-detail-field">
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        </div>
      </div>
    </dortmund-detail-card>

    <dortmund-detail-card title="球队标签" icon="el-icon-price-tag" tone="green">
      <div v-if="tagList.length" class="team-detail-tag-wall">
        <el-tag v-for="tag in tagList" :key="tag" size="small" effect="plain" :type="getTagType(tag)">
          <i class="el-icon-collection-tag"></i>{{ tag }}
        </el-tag>
      </div>
      <div v-else class="team-detail-empty"><i class="el-icon-price-tag"></i><span>暂无球队标签</span></div>
    </dortmund-detail-card>

    <dortmund-detail-card title="球队备注" icon="el-icon-document" tone="green">
      <div class="dortmund-detail-text-block">{{ displayValue(detail.teamRemark, '暂无备注') }}</div>
    </dortmund-detail-card>

    <dortmund-detail-card title="记录轨迹" subtitle="归属、创建与最近更新" icon="el-icon-time" tone="green">
      <dortmund-record-trail :items="recordTrail" empty-text="暂无球队记录轨迹" />
    </dortmund-detail-card>
    <template slot="footer">
      <el-button class="dortmund-theme-cancel" icon="el-icon-close" @click="drawerVisible = false">关闭</el-button>
    </template>
  </dortmund-detail-drawer>
</template>

<script>
import { getTeam } from "@/api/fx67ll/dortmund/team";
import {
  DORTMUND_TAG_SPLIT_PATTERN,
  TEAM_TAG_FALLBACK_OPTIONS,
} from "@/views/fx67ll/dortmund/other/config/moduleConfig";
import DortmundDetailDrawer from "@/views/fx67ll/dortmund/other/component/DortmundDetailDrawer/index";
import DortmundDetailCard from "@/views/fx67ll/dortmund/other/component/DortmundDetailCard/index";
import DortmundRecordTrail from "@/views/fx67ll/dortmund/other/component/DortmundRecordTrail/index";

import { formatAuditActor } from "@/views/fx67ll/dortmund/other/utils/audit";
export default {
  name: "DortmundTeamDetailDrawer",
  dicts: ["sys_normal_disable"],
  components: { DortmundDetailDrawer, DortmundDetailCard, DortmundRecordTrail },
  props: {
    visible: { type: Boolean, default: false },
    teamId: { type: [Number, String], default: null },
    snapshot: { type: Object, default: () => ({}) },
    // 从球队列表直接打开时为 1，从球队选择器继续下钻时为 2。
    level: { type: [Number, String], default: 1 },
  },
  data() {
    return {
      loading: false,
      detail: {},
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    tagList() {
      if (Array.isArray(this.detail.teamTag)) {
        return this.detail.teamTag.map((item) => String(item || "").trim()).filter(Boolean);
      }
      return String(this.detail.teamTag || "").split(DORTMUND_TAG_SPLIT_PATTERN)
        .map((item) => item.trim()).filter(Boolean);
    },
    summaryMetrics() {
      return [
        { label: "球队标签", value: this.tagList.length ? `${this.tagList.length} 个` : "暂无标签", icon: "el-icon-price-tag" },
        { label: "展示排序", value: this.detail.teamSort == null ? null : this.detail.teamSort, emptyText: "未设置", icon: "el-icon-sort" },
        { label: "地区/联赛", value: this.detail.teamCountry, icon: "el-icon-location-outline" },
        { label: "主场", value: this.detail.teamVenue, icon: "el-icon-office-building" },
      ];
    },
    identityFields() {
      return [
        { label: "球队ID", value: this.detail.teamId },
        { label: "球队编码", value: this.detail.teamCode },
        { label: "球队全称", value: this.detail.teamName },
        { label: "球队昵称", value: this.detail.teamNameShort },
        { label: "球队英文", value: this.detail.teamNameEn },
      ];
    },
    ownershipFields() {
      return [
        { label: "主场", value: this.detail.teamVenue },
        { label: "地区/联赛", value: this.detail.teamCountry },
        { label: "球队状态", value: this.displayDict(this.dict.type.sys_normal_disable, this.detail.teamStatus, "未设置") },
        { label: "展示排序", value: this.detail.teamSort == null ? null : this.detail.teamSort, emptyText: "未设置" },
        { label: "归属用户ID", value: this.detail.userId },
      ];
    },
    recordTrail() {
      const createTime = this.parseTime(this.detail.createTime, "{y}-{m}-{d} {h}:{i}:{s}");
      const updateTime = this.parseTime(this.detail.updateTime, "{y}-{m}-{d} {h}:{i}:{s}");
      return [
        { key: "owner", label: "归属用户ID", value: this.detail.userId, icon: "el-icon-user" },
        {
          key: "create", label: "创建记录", value: formatAuditActor(this.detail.createBy),
          hint: createTime ? `创建时间 · ${createTime}` : "", icon: "el-icon-edit-outline", state: "success"
        },
        {
          key: "update", label: "最近更新", value: formatAuditActor(this.detail.updateBy),
          hint: updateTime ? `更新时间 · ${updateTime}` : "", icon: "el-icon-refresh", state: "warning"
        },
      ];
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.loadDetail();
      }
    },
    teamId(value) {
      if (this.visible && value) {
        this.loadDetail();
      }
    },
  },
  methods: {
    loadDetail() {
      if (this.teamId === null || this.teamId === undefined || this.teamId === "") {
        this.detail = { ...(this.snapshot || {}) };
        return;
      }
      const snapshot = { ...(this.snapshot || {}) };
      this.detail = snapshot;
      this.loading = true;
      getTeam(this.teamId).then((response) => {
        const value = response && response.data;
        if (!value || value.teamId == null) {
          this.$modal.msgWarning("球队不存在或已删除，请刷新后重试");
          return;
        }
        this.detail = { ...snapshot, ...value };
      }).catch(() => {
        // 接口失败时保留列表快照。
      }).finally(() => {
        this.loading = false;
      });
    },
    hasDisplayValue(value) {
      return value !== null && value !== undefined && String(value).trim() !== "";
    },
    displayValue(value, fallback = "-") {
      return this.hasDisplayValue(value) ? String(value).trim() : fallback;
    },
    displayDict(options, value, fallback = "-") {
      if (!this.hasDisplayValue(value)) {
        return fallback;
      }
      return this.selectDictLabel(options || [], value) || String(value);
    },
    getTagType(tagValue) {
      const matchTag = TEAM_TAG_FALLBACK_OPTIONS.find((item) => item.value === tagValue);
      return matchTag ? matchTag.type : "info";
    },
  },
};
</script>

<style lang="scss" scoped>
.team-detail-hero {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px 0 18px;
  border-bottom: 1px solid #edf1ef;
}

.team-detail-crest {
  display: grid;
  flex: 0 0 76px;
  place-items: center;
  width: 76px;
  height: 76px;
  overflow: hidden;
  color: #3b8666;
  background: #f4faf6;
  border: 1px solid #dcebe3;
  border-radius: 12px;

  i {
    font-size: 30px;
  }

  ::v-deep .el-image {
    width: 100%;
    height: 100%;
  }
}

.team-detail-headline {
  min-width: 0;
}

.team-detail-kicker {
  font-size: 12px;
  color: #8a9791;
}

.team-detail-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  h3 {
    margin: 4px 0;
    font-size: 20px;
    color: #28372f;
  }
}

.team-detail-status-empty,
.team-detail-headline p,
.team-detail-code {
  font-size: 12px;
  color: #7c8b84;
}

.team-detail-headline p {
  margin: 2px 0 6px;
}

.team-detail-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}

.team-detail-summary-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 11px 13px;
  background: #f7fbf8;
  border: 1px solid #e4efe8;
  border-radius: 10px;
}

.team-detail-summary-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #27ad60;
  background: #e7f8ee;
  border-radius: 8px;
}

.team-detail-summary-copy span,
.team-detail-summary-copy strong {
  display: block;
}

.team-detail-summary-copy span {
  font-size: 12px;
  color: #87958e;
}

.team-detail-summary-copy strong {
  margin-top: 2px;
  color: #33463c;
}

.team-detail-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.team-detail-field {
  padding: 10px 12px;
  background: #f7fbf8;
  border: 1px solid #e4efe8;
  border-radius: 9px;

  span,
  strong {
    display: block;
  }

  span {
    margin-bottom: 4px;
    font-size: 12px;
    color: #87958e;
  }

  strong {
    color: #33463c;
    word-break: break-all;
  }
}

.team-detail-tag-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.team-detail-empty {
  padding: 20px;
  color: #9aa8a1;
  text-align: center;
  background: #f8fbf9;
  border: 1px dashed #dce9e2;
  border-radius: 10px;

  i {
    margin-right: 5px;
  }
}

@media screen and (max-width: 640px) {

  .team-detail-summary,
  .team-detail-field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
