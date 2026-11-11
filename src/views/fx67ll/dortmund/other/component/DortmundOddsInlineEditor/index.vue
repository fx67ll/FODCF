<template>
  <div class="odds-inline-editor">
    <div class="odds-inline-header">
      <div class="odds-inline-title">
        <i class="el-icon-odometer"></i>当前有效 odds
        <el-tag :type="activeOdds ? 'success' : 'info'" size="small">
          {{ activeOdds ? activeOdds.oddsCode : "未维护" }}
        </el-tag>
      </div>
      <div>
        <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-edit" :disabled="!activeOdds"
          @click="openEditor(activeOdds)" v-hasPermi="['dortmund:odds:add']">编辑为新版本</el-button>
        <el-button size="mini" type="success" plain icon="el-icon-plus" @click="openEditor()"
          v-hasPermi="['dortmund:odds:add']">新增版本</el-button>
        <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-delete"
          :disabled="!activeOdds || deleting" @click="handleRemove" v-hasPermi="['dortmund:odds:remove']">删除</el-button>
      </div>
    </div>

    <el-descriptions v-if="activeOdds" :column="3" size="small" border class="odds-inline-detail">
      <el-descriptions-item label="来源时间">{{ parseTime(activeOdds.sourceTime, "{y}-{m}-{d} {h}:{i}") || "-"
      }}</el-descriptions-item>
      <el-descriptions-item label="让分值">{{ activeOdds.handicapValue || "-" }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ parseTime(activeOdds.createTime, "{y}-{m}-{d} {h}:{i}") || "-"
      }}</el-descriptions-item>
      <el-descriptions-item label="主胜赔率">{{ activeOdds.homeWinOdds || "-" }}</el-descriptions-item>
      <el-descriptions-item label="平局赔率">{{ activeOdds.drawOdds || "-" }}</el-descriptions-item>
      <el-descriptions-item label="客胜赔率">{{ activeOdds.awayWinOdds || "-" }}</el-descriptions-item>
      <el-descriptions-item label="让分主胜">{{ activeOdds.handicapHomeWinOdds || "-" }}</el-descriptions-item>
      <el-descriptions-item label="让分平局">{{ activeOdds.handicapDrawOdds || "-" }}</el-descriptions-item>
      <el-descriptions-item label="让分客胜">{{ activeOdds.handicapAwayWinOdds || "-" }}</el-descriptions-item>
    </el-descriptions>

    <el-empty v-else-if="!loading" :image-size="64" description="暂无有效 odds" />

    <el-dialog :visible.sync="editorVisible" title="维护有效 odds" width="860px" append-to-body
      custom-class="odds-inline-dialog" :close-on-click-modal="false">
      <el-form ref="oddsForm" :model="form" :rules="rules" label-width="104px" v-loading="submitting">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="记录编码" prop="oddsCode">
              <el-input v-model="form.oddsCode" maxlength="23" show-word-limit placeholder="请输入记录编码" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="来源时间" prop="sourceTime">
              <el-date-picker v-model="form.sourceTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%" placeholder="请选择来源时间" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分值" prop="handicapValue">
              <el-input v-model="form.handicapValue" placeholder="请输入让分值" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="主胜赔率" prop="homeWinOdds">
              <el-input v-model="form.homeWinOdds" placeholder="请输入主胜赔率" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平局赔率" prop="drawOdds">
              <el-input v-model="form.drawOdds" placeholder="请输入平局赔率" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客胜赔率" prop="awayWinOdds">
              <el-input v-model="form.awayWinOdds" placeholder="请输入客胜赔率" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分主胜" prop="handicapHomeWinOdds">
              <el-input v-model="form.handicapHomeWinOdds" placeholder="请输入让分主胜赔率" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分平局" prop="handicapDrawOdds">
              <el-input v-model="form.handicapDrawOdds" placeholder="请输入让分平局赔率" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分客胜" prop="handicapAwayWinOdds">
              <el-input v-model="form.handicapAwayWinOdds" placeholder="请输入让分客胜赔率" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="主胜权重" prop="homeWinWeight">
              <el-input v-model="form.homeWinWeight" placeholder="默认 100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平局权重" prop="drawWeight">
              <el-input v-model="form.drawWeight" placeholder="默认 100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客胜权重" prop="awayWinWeight">
              <el-input v-model="form.awayWinWeight" placeholder="默认 100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分主胜权重" prop="handicapHomeWinWeight">
              <el-input v-model="form.handicapHomeWinWeight" placeholder="默认 100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分平局权重" prop="handicapDrawWeight">
              <el-input v-model="form.handicapDrawWeight" placeholder="默认 100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="让分客胜权重" prop="handicapAwayWinWeight">
              <el-input v-model="form.handicapAwayWinWeight" placeholder="默认 100" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="记录说明" prop="oddsRemark">
              <el-input v-model="form.oddsRemark" type="textarea" :rows="2" maxlength="1023" show-word-limit
                placeholder="请输入记录说明（可空）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="success" class="dortmund-theme-confirm" :loading="submitting" @click="handleSubmit">保
          存</el-button>
        <el-button class="dortmund-theme-cancel" @click="editorVisible = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getActiveOdds, addOdds, delOdds } from "@/api/fx67ll/dortmund/odds";

export default {
  name: "DortmundOddsInlineEditor",
  props: {
    matchId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      submitting: false,
      deleting: false,
      activeOdds: null,
      editorVisible: false,
      form: this.buildEmptyForm(),
    };
  },
  computed: {
    rules() {
      const positive = (message) => ({
        validator: (rule, value, callback) => {
          if (value == null || value === "" || Number(value) <= 0 || !Number.isFinite(Number(value))) {
            callback(new Error(message));
            return;
          }
          callback();
        },
        trigger: "blur",
      });
      return {
        oddsCode: [{ required: true, message: "记录编码不能为空", trigger: "blur" }],
        sourceTime: [{ required: true, message: "来源时间不能为空", trigger: "change" }],
        handicapValue: [{ required: true, message: "让分值不能为空", trigger: "blur" }],
        homeWinOdds: [positive("主胜赔率必须大于0")],
        drawOdds: [positive("平局赔率必须大于0")],
        awayWinOdds: [positive("客胜赔率必须大于0")],
        handicapHomeWinOdds: [positive("让分主胜赔率必须大于0")],
        handicapDrawOdds: [positive("让分平局赔率必须大于0")],
        handicapAwayWinOdds: [positive("让分客胜赔率必须大于0")],
      };
    },
  },
  watch: {
    matchId: {
      immediate: true,
      handler() {
        this.load();
      },
    },
  },
  methods: {
    load() {
      if (!this.matchId) {
        this.activeOdds = null;
        return;
      }
      this.loading = true;
      getActiveOdds(this.matchId).then((response) => {
        this.activeOdds = (response && response.data) || null;
      }).catch(() => {
        this.activeOdds = null;
      }).finally(() => {
        this.loading = false;
      });
    },
    buildEmptyForm() {
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
        oddsRemark: null,
      };
    },
    openEditor(source) {
      this.form = source ? { ...source, oddsId: null, matchId: this.matchId, activeFlag: "Y" } : {
        ...this.buildEmptyForm(),
        matchId: this.matchId,
        activeFlag: "Y",
      };
      this.editorVisible = true;
      this.$nextTick(() => {
        this.$refs.oddsForm && this.$refs.oddsForm.clearValidate();
      });
    },
    handleSubmit() {
      this.$refs.oddsForm.validate((valid) => {
        if (!valid) {
          return;
        }
        this.submitting = true;
        addOdds({ ...this.form, matchId: this.matchId, activeFlag: "Y" }).then(() => {
          this.$modal.msgSuccess("保存成功");
          this.editorVisible = false;
          this.load();
          this.$emit("refresh");
        }).catch(() => {
        }).finally(() => {
          this.submitting = false;
        });
      });
    },
    handleRemove() {
      if (!this.activeOdds) {
        return;
      }
      this.$modal.confirm(`是否删除当前有效 odds「${this.activeOdds.oddsCode}」？`).then(() => {
        this.deleting = true;
        return delOdds(this.activeOdds.oddsId);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.load();
        this.$emit("refresh");
      }).catch(() => {
      }).finally(() => {
        this.deleting = false;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.odds-inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.odds-inline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2b3a36;
  font-size: 14px;
  font-weight: 700;

  i {
    color: #27ad60;
  }
}

.odds-inline-detail {
  margin-bottom: 4px;
}
</style>
