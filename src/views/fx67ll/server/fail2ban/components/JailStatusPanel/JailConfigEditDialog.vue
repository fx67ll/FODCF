<template>
    <!-- ==================== 监狱配置修改弹窗 ==================== -->
    <el-dialog :title="`修改监狱运行配置${jailName ? ' - ' + jailName : ''}`" :visible.sync="innerVisible" width="620px"
        :close-on-click-modal="false" @close="handleDialogClose" custom-class="jail-config-dialog"
        :style="`top: ${getDialogVerticalOffset(834)}`" append-to-body>
        <div v-loading="loading" element-loading-text="加载配置中...">
            <!-- 生效范围提示 -->
            <el-alert title="本次修改为运行时临时生效，重启 Fail2ban 服务后将自动恢复为配置文件默认值" type="warning" :closable="false" show-icon
                style="margin-bottom: 20px;" />

            <!-- 基础防护参数区块 -->
            <div class="config-block">
                <div class="block-title">基础防护参数</div>
                <el-form :model="formData" :rules="formRules" ref="paramForm" label-width="120px" size="small">
                    <el-form-item label="封禁时长" prop="bantime">
                        <el-input-number v-model="formData.bantime" :min="-1" :max="31536000" :step="60"
                            style="width: 100%;" />
                        <span class="input-tip">单位：秒，取值范围 永久（-1秒）~ 31536000（1年）</span>
                    </el-form-item>

                    <el-form-item label="检测窗口" prop="findtime">
                        <el-input-number v-model="formData.findtime" :min="60" :max="31536000" :step="60"
                            style="width: 100%;" />
                        <span class="input-tip">单位：秒，取值范围 60（1分钟）~ 86400（1天）</span>
                    </el-form-item>

                    <el-form-item label="最大重试次数" prop="maxretry">
                        <el-input-number v-model="formData.maxretry" :min="1" :max="1000" style="width: 100%;" />
                        <span class="input-tip">单位：次，取值范围 1 ~ 1000，达到该次数将触发封禁</span>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="handleSaveParams" :loading="paramSubmitting" size="small">
                            保存参数修改
                        </el-button>
                        <span class="form-tip">修改后即时生效，无需重启服务</span>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 分割线 -->
            <el-divider style="margin: 20px 0;"></el-divider>

            <!-- 白名单IP管理区块 -->
            <div class="config-block">
                <div class="block-title">白名单IP管理</div>
                <el-form :model="ipForm" :rules="ipFormRules" ref="ipForm" label-width="120px" size="small">
                    <el-form-item label="操作类型" prop="action">
                        <el-radio-group v-model="ipForm.action">
                            <el-radio label="add">添加IP</el-radio>
                            <el-radio label="delete">删除IP</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <el-form-item label="IP地址" prop="ip">
                        <el-input v-model="ipForm.ip" placeholder="请输入合法的IPv4地址，例如 192.168.1.100" clearable />
                        <span class="input-tip">仅支持单个IPv4地址；添加后仅对后续新攻击生效，已封禁IP需手动解封</span>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="warning" @click="handleIpOperate" :loading="ipSubmitting" size="small">
                            执行操作
                        </el-button>
                        <span class="form-tip">执行完成后可继续操作其他IP，无需关闭弹窗</span>
                    </el-form-item>
                </el-form>

                <!-- 当前白名单列表展示 -->
                <div class="current-ip-list">
                    <div class="ip-list-title">当前监狱白名单IP（共 {{ currentIgnoreIps.length }} 个）</div>
                    <div class="ip-tags">
                        <el-tag v-for="ip in currentIgnoreIps" :key="ip" size="mini" closable
                            :disabled="systemWhiteList.includes(ip)" @close="handleQuickDeleteIp(ip)"
                            style="margin: 3px;">
                            {{ ip }}
                        </el-tag>
                        <span v-if="!currentIgnoreIps.length" class="empty-tip">暂无白名单IP</span>
                    </div>
                    <div class="ip-list-tip" v-if="systemWhiteList.length">
                        灰色标签为系统级白名单，禁止在此处删除
                    </div>
                </div>
            </div>
        </div>

        <span slot="footer" class="dialog-footer">
            <el-button @click="handleDialogClose">关闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { getJailDetail, updateJailConfig } from "@/api/fx67ll/server/fail2ban";
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

// IPv4严格格式校验正则，与后端保持一致
const IPV4_STRICT_REG = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export default {
    name: "JailConfigEditDialog",
    props: {
        /** 弹窗显示状态 */
        visible: {
            type: Boolean,
            default: false
        },
        /** 当前操作的监狱名称 */
        jailName: {
            type: String,
            default: ""
        },
        /** 系统级白名单列表，禁止删除 */
        systemWhiteList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        // IP格式自定义校验器
        const validateIp = (rule, value, callback) => {
            if (!value) {
                callback(new Error("请输入IP地址"));
            } else if (!IPV4_STRICT_REG.test(value.trim())) {
                callback(new Error("请输入合法的IPv4地址格式"));
            } else {
                callback();
            }
        };

        return {
            loading: false,
            paramSubmitting: false,
            ipSubmitting: false,

            // 原始配置值，用于对比是否发生修改
            originalConfig: {
                bantime: 0,
                findtime: 0,
                maxretry: 0
            },

            // 基础参数表单数据
            formData: {
                bantime: 600,
                findtime: 600,
                maxretry: 5
            },
            // 基础参数校验规则，与后端取值范围完全对齐
            formRules: {
                bantime: [
                    { required: true, message: "请输入封禁时长", trigger: "blur" },
                    { type: "number", min: -1, max: 31536000, message: "取值范围 -1 ~ 31536000 秒", trigger: "blur" }
                ],
                findtime: [
                    { required: true, message: "请输入检测窗口", trigger: "blur" },
                    { type: "number", min: 60, max: 31536000, message: "取值范围 60 ~ 31536000 秒", trigger: "blur" }
                ],
                maxretry: [
                    { required: true, message: "请输入最大重试次数", trigger: "blur" },
                    { type: "number", min: 1, max: 1000, message: "取值范围 1 ~ 1000 次", trigger: "blur" }
                ]
            },

            // 白名单IP表单数据
            ipForm: {
                action: "add",
                ip: ""
            },
            ipFormRules: {
                action: [
                    { required: true, message: "请选择操作类型", trigger: "change" }
                ],
                ip: [
                    { validator: validateIp, trigger: "blur" }
                ]
            },

            // 当前监狱白名单IP列表
            currentIgnoreIps: []
        };
    },
    computed: {
        /**
         * 双向绑定 visible 属性，支持 .sync 修饰符
         */
        innerVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit('update:visible', val);
            }
        }
    },
    watch: {
        /**
         * 监听弹窗打开，自动加载当前配置
         */
        visible(val) {
            if (val && this.jailName) {
                this.loadCurrentConfig();
            }
        }
    },
    methods: {
        // 代理工具函数
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

        /**
         * 加载当前监狱配置，填充表单默认值
         */
        async loadCurrentConfig() {
            this.loading = true;
            try {
                const res = await getJailDetail(this.jailName);
                const config = res.data.config || {};

                // 填充原始值与表单值
                this.originalConfig = {
                    bantime: config.bantimeSeconds || 0,
                    findtime: config.findtimeSeconds || 0,
                    maxretry: config.maxretry || 5
                };
                this.formData = { ...this.originalConfig };

                // 填充白名单列表
                this.currentIgnoreIps = [...(config.ignoreIpList || [])];
            } catch (err) {
                if (!err._isHandled) {
                    this.$message.error("加载监狱配置失败：" + (err.msg || err.message));
                }
                this.handleDialogClose();
            } finally {
                this.loading = false;
            }
        },

        /**
         * 保存基础防护参数修改
         * 自动对比变更项，逐个提交，无修改则直接返回
         */
        async handleSaveParams() {
            this.$refs.paramForm.validate(async (valid) => {
                if (!valid) return;

                // 筛选出发生变更的配置项
                const changedKeys = [];
                ["bantime", "findtime", "maxretry"].forEach(key => {
                    if (this.formData[key] !== this.originalConfig[key]) {
                        changedKeys.push(key);
                    }
                });

                if (changedKeys.length === 0) {
                    this.$message.info("参数未发生变化，无需保存");
                    return;
                }

                this.paramSubmitting = true;
                try {
                    // 逐个提交修改请求
                    for (const key of changedKeys) {
                        await updateJailConfig(this.jailName, {
                            configKey: key,
                            value: this.formData[key]
                        });
                    }

                    this.$message.success(`成功修改 ${changedKeys.length} 项配置参数`);
                    // 更新原始值基准
                    this.originalConfig = { ...this.formData };
                    // 通知父组件刷新数据
                    this.$emit('config-updated');
                } catch (err) {
                    if (!err._isHandled) {
                        this.$message.error("保存失败：" + (err.msg || err.message));
                    }
                } finally {
                    this.paramSubmitting = false;
                }
            });
        },

        /**
         * 执行白名单IP增删操作
         */
        async handleIpOperate() {
            this.$refs.ipForm.validate(async (valid) => {
                if (!valid) return;

                const ip = this.ipForm.ip.trim();
                const action = this.ipForm.action;

                // 前端拦截：禁止删除系统级白名单
                if (action === "delete" && this.systemWhiteList.includes(ip)) {
                    this.$message.error("该IP为系统级白名单，禁止在此处删除");
                    return;
                }

                this.ipSubmitting = true;
                try {
                    await updateJailConfig(this.jailName, {
                        configKey: "ignoreip",
                        action: action,
                        value: ip
                    });

                    const actionText = action === "add" ? "添加" : "删除";
                    this.$message.success(`成功${actionText}白名单IP：${ip}`);

                    // 本地同步更新列表，无需重新请求
                    if (action === "add") {
                        if (!this.currentIgnoreIps.includes(ip)) {
                            this.currentIgnoreIps.push(ip);
                        }
                    } else {
                        this.currentIgnoreIps = this.currentIgnoreIps.filter(item => item !== ip);
                    }

                    // 清空输入框，支持连续操作
                    this.ipForm.ip = "";
                    this.$refs.ipForm.clearValidate();

                    // 通知父组件刷新
                    this.$emit('config-updated');
                } catch (err) {
                    if (!err._isHandled) {
                        this.$message.error("操作失败：" + (err.msg || err.message));
                    }
                } finally {
                    this.ipSubmitting = false;
                }
            });
        },

        /**
         * 点击标签关闭按钮快速删除IP
         * @param {String} ip 目标IP
         */
        handleQuickDeleteIp(ip) {
            if (this.systemWhiteList.includes(ip)) return;
            this.ipForm.action = "delete";
            this.ipForm.ip = ip;
            this.handleIpOperate();
        },

        /**
         * 弹窗关闭事件处理，重置表单状态
         */
        handleDialogClose() {
            this.$emit('update:visible', false);
            // 重置所有表单状态
            this.formData = { bantime: 600, findtime: 600, maxretry: 5 };
            this.ipForm = { action: "add", ip: "" };
            this.currentIgnoreIps = [];
            if (this.$refs.paramForm) this.$refs.paramForm.clearValidate();
            if (this.$refs.ipForm) this.$refs.ipForm.clearValidate();
        }
    }
};
</script>

<style scoped>
/* ==================== 配置区块通用样式 ==================== */
.config-block {
    padding: 0 10px;
}

.block-title {
    font-size: 15px;
    color: #1f2d3d;
    margin-bottom: 15px;
    padding-left: 8px;
    border-left: 3px solid #f5c242;
    font-weight: 500;
}

.input-tip {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-left: 10px;
}

/* ==================== 白名单列表样式 ==================== */
.current-ip-list {
    margin-top: 20px;
    padding: 12px;
    background-color: #fafafa;
    border-radius: 6px;
}

.ip-list-title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
}

.ip-tags {
    min-height: 30px;
}

.empty-tip {
    font-size: 12px;
    color: #c0c4cc;
}

.ip-list-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}

/* ==================== 弹窗样式统一适配 ==================== */
::v-deep .jail-config-dialog .el-dialog__body {
    padding: 20px 24px !important;
}

::v-deep .jail-config-dialog .dialog-footer {
    display: flex;
    justify-content: flex-end;
}

/* 数字输入框占满宽度 */
::v-deep .el-input-number {
    width: 100%;
}

::v-deep .el-input-number .el-input__inner {
    text-align: left;
}
</style>
