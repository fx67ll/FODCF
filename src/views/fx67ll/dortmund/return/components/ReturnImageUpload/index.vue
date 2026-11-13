<template>
  <div v-loading="busy" class="return-image-manager">
    <div class="image-manager-head">
      <span class="image-manager-count">已上传 {{ imageCount }}/{{ limit }}</span>
      <span v-if="planLinked" class="image-manager-state image-manager-state--locked">
        <i class="el-icon-lock"></i>计划引用，只读
      </span>
      <span v-else-if="!isAdopted" class="image-manager-state">
        <i class="el-icon-info"></i>采用后可上传
      </span>
      <span v-else-if="imageCount >= limit" class="image-manager-state">
        <i class="el-icon-circle-check"></i>已达上限
      </span>
    </div>

    <transition-group name="image-pop" tag="div" class="image-grid">
      <div v-for="image in visibleImages" :key="image.imageId" class="image-tile">
        <el-image class="image-thumb" :src="resolveUrl(image.objectKey)" fit="cover"
          :preview-src-list="previewUrls">
          <div slot="error" class="image-error"><i class="el-icon-picture-outline"></i></div>
        </el-image>
        <div class="image-caption" :title="image.originalName || image.objectKey">
          {{ image.originalName || "组合图片" }}
        </div>
        <button v-if="canDelete" type="button" class="image-delete" title="删除图片"
          :disabled="deletingId === image.imageId" @click.stop="handleDelete(image)">
          <i :class="deletingId === image.imageId ? 'el-icon-loading' : 'el-icon-delete'"></i>
        </button>
      </div>

      <el-upload v-if="canAdd" key="uploader" class="image-uploader" :action="uploadAction" :headers="headers"
        :show-file-list="false" :multiple="true" :before-upload="handleBeforeUpload" :on-success="handleUploadSuccess"
        :on-error="handleUploadError">
        <div class="image-upload-tile">
          <i :class="uploadingCount ? 'el-icon-loading' : 'el-icon-plus'"></i>
          <span>{{ uploadingCount ? "上传中" : "上传图片" }}</span>
        </div>
      </el-upload>
    </transition-group>

    <div v-if="!visibleImages.length && !canAdd" class="image-empty-state">
      <i class="el-icon-picture-outline"></i>
      <span>{{ emptyHint }}</span>
    </div>

    <div class="image-manager-tip">
      <i class="el-icon-info"></i>
      <span>{{ tipText }}</span>
    </div>
  </div>
</template>

<script>
import { getToken } from "@/utils/common/auth";
import { removeReturnImage } from "@/api/fx67ll/dortmund/returnCombination";

export default {
  name: "ReturnImageManager",
  props: {
    combinationId: {
      type: Number,
      default: null,
    },
    images: {
      type: Array,
      default: () => [],
    },
    adoptedFlag: {
      type: String,
      default: "",
    },
    planLinked: {
      type: Boolean,
      default: false,
    },
    canUpload: {
      type: Boolean,
      default: false,
    },
    limit: {
      type: Number,
      default: 3,
    },
    fileSize: {
      type: Number,
      default: 4,
    },
  },
  data() {
    return {
      uploadingCount: 0,
      deletingId: null,
    };
  },
  computed: {
    visibleImages() {
      return Array.isArray(this.images) ? this.images.filter((image) => image && image.imageId) : [];
    },
    imageCount() {
      return this.visibleImages.length;
    },
    isAdopted() {
      return this.adoptedFlag === "Y";
    },
    canAdd() {
      return Boolean(this.combinationId && this.canUpload && this.isAdopted && !this.planLinked
        && this.imageCount + this.uploadingCount < this.limit);
    },
    canDelete() {
      return Boolean(this.combinationId && this.canUpload && this.isAdopted && !this.planLinked);
    },
    busy() {
      return this.uploadingCount > 0 || this.deletingId !== null;
    },
    uploadAction() {
      return process.env.VUE_APP_BASE_API + "/dortmund/return/" + this.combinationId + "/image";
    },
    headers() {
      return { Authorization: "Bearer " + getToken() };
    },
    previewUrls() {
      return this.visibleImages.map((image) => this.resolveUrl(image.objectKey));
    },
    emptyHint() {
      if (this.planLinked) return "组合已被方案计划引用，图片区只读";
      if (!this.isAdopted) return "采用该组合后可上传图片";
      if (!this.canUpload) return "当前账号没有组合图片维护权限";
      return "暂无组合图片";
    },
    tipText() {
      if (this.planLinked) return "解除方案计划关联后可继续维护图片。";
      if (!this.isAdopted) return "图片归属当前已采用组合，请先完成采用。";
      return "每条组合最多三张；删除失败会进入后台回收重试。";
    },
  },
  methods: {
    resolveUrl(objectKey) {
      return objectKey ? process.env.VUE_APP_BASE_API + objectKey : "";
    },
    handleBeforeUpload(file) {
      if (!file.type || file.type.indexOf("image") !== 0) {
        this.$modal.msgError("请上传图片文件");
        return false;
      }
      if (file.size / 1024 / 1024 >= this.fileSize) {
        this.$modal.msgError(`上传图片大小不能超过 ${this.fileSize}MB`);
        return false;
      }
      if (this.imageCount + this.uploadingCount >= this.limit) {
        this.$modal.msgError(`每条组合最多上传 ${this.limit} 张图片`);
        return false;
      }
      this.uploadingCount += 1;
      return true;
    },
    handleUploadSuccess(response, file, fileList) {
      this.uploadingCount = Math.max(this.uploadingCount - 1, 0);
      if (response && response.code === 200) {
        this.$modal.msgSuccess("组合图片已上传");
        this.$emit("changed");
        return;
      }
      this.$modal.msgError((response && response.msg) || "上传组合图片失败");
      this.handleUploadedFileFailed(fileList);
    },
    handleUploadError(error, file, fileList) {
      this.uploadingCount = Math.max(this.uploadingCount - 1, 0);
      this.$modal.msgError((error && error.message) || "上传组合图片失败，请重试");
      this.handleUploadedFileFailed(fileList);
    },
    handleUploadedFileFailed(fileList) {
      if (Array.isArray(fileList)) {
        fileList.splice(0, fileList.length);
      }
    },
    handleDelete(image) {
      if (!this.canDelete || !image) return;
      this.$modal.confirm(`确认删除图片「${image.originalName || "组合图片"}」？`).then(() => {
        this.deletingId = image.imageId;
        return removeReturnImage(this.combinationId, image.imageId);
      }).then(() => {
        this.$modal.msgSuccess("组合图片已删除");
        this.$emit("changed");
      }).catch(() => {
      }).finally(() => {
        this.deletingId = null;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.return-image-manager {
  min-height: 112px;
}

.image-manager-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.image-manager-count {
  font-size: 12px;
  font-weight: 600;
  color: #4f655b;
}

.image-manager-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  font-size: 11px;
  color: #70847a;
  background: #f2f7f4;
  border: 1px solid #e1ece5;
  border-radius: 999px;
}

.image-manager-state--locked {
  color: #9a6a20;
  background: #fdf7eb;
  border-color: #f2dfb8;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.image-tile,
.image-uploader {
  position: relative;
  min-width: 0;
}

.image-thumb,
.image-upload-tile {
  width: 100%;
  height: 118px;
  overflow: hidden;
  border-radius: 12px;
}

.image-thumb {
  display: block;
  background: #f3f7f5;
  border: 1px solid #e0ebe4;
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(47, 99, 73, 0.14);
  }
}

.image-caption {
  overflow: hidden;
  margin-top: 5px;
  font-size: 11px;
  color: #7e8f86;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: rgba(201, 72, 72, 0.88);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(126, 39, 39, 0.2);
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    background: #c94848;
    transform: scale(1.06);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.72;
  }
}

.image-upload-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 12px;
  color: #5c8c74;
  cursor: pointer;
  background: linear-gradient(145deg, #fbfefd, #eef8f2);
  border: 1px dashed #bcdccb;
  transition: border-color 0.22s ease, background 0.22s ease, transform 0.22s ease;

  i {
    font-size: 22px;
  }

  &:hover {
    color: #2ecc71;
    background: #effaf4;
    border-color: #8fd4ae;
    transform: translateY(-2px);
  }
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 24px;
  color: #b7c4bd;
}

.image-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 76px;
  font-size: 12px;
  color: #96a39c;
  background: #fafdfb;
  border: 1px dashed #e2ece6;
  border-radius: 12px;
}

.image-manager-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  font-size: 11px;
  line-height: 1.5;
  color: #8c9a92;
}

.image-pop-enter-active,
.image-pop-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.image-pop-enter,
.image-pop-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

@media (max-width: 600px) {
  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
