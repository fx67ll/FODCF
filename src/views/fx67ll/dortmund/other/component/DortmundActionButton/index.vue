<template>
  <button type='button' class='dortmund-action-btn' :data-action='action' :disabled='disabled || loading'
    :aria-label='label' @click.stop="$emit('click', $event)">
    <i v-if='loading' class='el-icon-loading'></i>
    <i v-else :class='semanticIcon'></i>
  </button>
</template>

<script>
const actionIcons = {
  detail: 'el-icon-document',
  edit: 'el-icon-edit-outline',
  delete: 'el-icon-delete',
  adopt: 'el-icon-check',
  confirm: 'el-icon-check',
  reject: 'el-icon-close',
  cancel: 'el-icon-close',
  enable: 'el-icon-video-play',
  disable: 'el-icon-turn-off',
  warning: 'el-icon-warning-outline',
  relation: 'el-icon-link',
  info: 'el-icon-notebook-2',
  copy: 'el-icon-document-copy',
  upload: 'el-icon-upload2',
  download: 'el-icon-download',
  verify: 'el-icon-circle-check',
};

export default {
  name: 'DortmundActionButton',
  props: {
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      default: 'info',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    semanticIcon() {
      return this.icon || actionIcons[this.action] || 'el-icon-more-outline';
    },
  },
};
</script>

<style lang='scss' scoped>
.dortmund-action-btn {
  --action-accent: #5d6f68;
  --action-soft: #f4f7f5;
  --action-border: #e4ebe7;

  position: relative;
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  color: #5d6f68;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--action-border);
  border-radius: 8px;
  outline: none;
  transition: color .18s ease, background-color .18s ease, border-color .18s ease,
    box-shadow .18s ease, transform .18s ease;

  i {
    position: relative;
    z-index: 1;
    font-size: 14px;
    line-height: 1;
    transition: transform .24s cubic-bezier(.34, 1.4, .64, 1);
  }

  &::after {
    position: absolute;
    inset: 4px;
    pointer-events: none;
    content: '';
    background: var(--action-soft);
    border-radius: 6px;
    opacity: 0;
    transform: scale(.55);
    transition: opacity .18s ease, transform .24s ease;
  }

  &:active:not(:disabled) {
    transform: scale(.94);
  }

  &:disabled {
    color: #a9b3ae;
    cursor: not-allowed;
    background: #f6f8f7;
    border-color: #eef1f0;
  }

  &:focus-visible {
    outline: 2px solid rgba(72, 127, 115, .42);
    outline-offset: 2px;
  }
}

.dortmund-action-btn[data-action='detail'] {
  --action-accent: #347f62;
  --action-soft: #eaf7ef;

  &:hover:not(:disabled) {
    color: #2f7459;
    background: #edf9f2;
    border-color: #bfe2cd;
  }

  &:hover:not(:disabled) i {
    transform: scale(1.18);
  }

  &:hover:not(:disabled)::after {
    opacity: .8;
    transform: scale(1);
  }
}

.dortmund-action-btn[data-action='edit'] {
  --action-accent: #3f805d;
  --action-soft: #eaf6ee;

  &:hover:not(:disabled) {
    color: #367151;
    background: #eef8f1;
    border-color: #c4e2d0;
  }

  &:hover:not(:disabled) i {
    transform: rotate(-12deg) scale(1.12);
  }
}

.dortmund-action-btn[data-action='delete'] {
  --action-accent: #ae505a;
  --action-soft: #fbecee;

  &:hover:not(:disabled) {
    color: #a5444f;
    background: #fdf0f1;
    border-color: #edc4c9;
  }

  &:hover:not(:disabled) i {
    animation: dortmundDeleteNudge .38s ease both;
  }
}

.dortmund-action-btn[data-action='adopt'],
.dortmund-action-btn[data-action='confirm'] {
  --action-accent: #2f8460;
  --action-soft: #e9f7ef;

  &:hover:not(:disabled) {
    color: #287a57;
    background: #ecf9f2;
    border-color: #b9e1c9;
    box-shadow: 0 3px 0 rgba(47, 132, 96, .12);
  }

  &:hover:not(:disabled) i {
    transform: scale(1.18);
  }
}

.dortmund-action-btn[data-action='verify'] {
  --action-accent: #2f78a8;
  --action-soft: #eaf4fb;

  &:hover:not(:disabled) {
    color: #286a96;
    background: #edf6fc;
    border-color: #bdd9ec;
    box-shadow: 0 3px 0 rgba(47, 120, 168, .12);
  }

  &:hover:not(:disabled) i {
    transform: scale(1.18);
  }
}

.dortmund-action-btn[data-action='reject'],
.dortmund-action-btn[data-action='warning'] {
  --action-accent: #a45856;
  --action-soft: #fbefed;

  &:hover:not(:disabled) {
    color: #9b4b49;
    background: #fcf1ef;
    border-color: #eccbc7;
  }

  &:hover:not(:disabled) i {
    transform: rotate(90deg) scale(1.12);
  }
}

.dortmund-action-btn[data-action='enable'] {
  --action-accent: #2e8a5f;
  --action-soft: #e9f8ef;

  &:hover:not(:disabled) {
    color: #267c55;
    background: #ebf9f1;
    border-color: #b6dfc6;
  }

  &:hover:not(:disabled) i {
    transform: scale(1.2);
  }

  &:hover:not(:disabled)::after {
    animation: dortmundEnablePulse .55s ease-out both;
  }
}

.dortmund-action-btn[data-action='disable'] {
  --action-accent: #9a6b3c;
  --action-soft: #faf3e9;

  &:hover:not(:disabled) {
    color: #8e6033;
    background: #fbf5ec;
    border-color: #e8d5bf;
  }

  &:hover:not(:disabled) i {
    transform: rotate(-90deg) scale(1.12);
  }
}

.dortmund-action-btn[data-action='relation'] {
  --action-accent: #2f8a70;
  --action-soft: #eaf7f1;

  &:hover:not(:disabled) {
    color: #287e65;
    background: #edf9f4;
    border-color: #bfe2d3;
  }

  &:hover:not(:disabled) i {
    transform: rotate(-12deg) scale(1.14);
  }

  &:hover:not(:disabled)::after {
    opacity: .7;
    transform: scale(1);
  }
}

.dortmund-action-btn[data-action='info'] {
  --action-accent: #4f8a65;
  --action-soft: #eef7f0;

  &:hover:not(:disabled) {
    color: #457d59;
    background: #f0f8f2;
    border-color: #c9e2d1;
    box-shadow: 0 4px 9px rgba(79, 138, 101, .12);
  }

  &:hover:not(:disabled) i {
    transform: scale(1.16);
  }
}

.dortmund-action-btn[data-action='copy'] {
  --action-accent: #6f8f56;
  --action-soft: #f2f7ec;

  &:hover:not(:disabled) {
    color: #64834d;
    background: #f3f8ee;
    border-color: #d7e5ca;
  }

  &:hover:not(:disabled) i {
    transform: rotate(-6deg) scale(1.14);
  }
}

.dortmund-action-btn[data-action='upload'],
.dortmund-action-btn[data-action='download'] {
  --action-accent: #2f8578;
  --action-soft: #eaf6f3;

  &:hover:not(:disabled) {
    color: #28786d;
    background: #edf8f5;
    border-color: #bfe1da;
  }
}

.dortmund-action-btn[data-action='upload']:hover:not(:disabled) i {
  transform: scale(1.18);
}

.dortmund-action-btn[data-action='download']:hover:not(:disabled) i {
  transform: scale(1.18);
}

.dortmund-action-btn[data-action='cancel'] {
  --action-accent: #6f7974;
  --action-soft: #f1f3f2;

  &:hover:not(:disabled) {
    color: #5f6964;
    background: #f3f5f4;
    border-color: #dce2df;
  }

  &:hover:not(:disabled) i {
    transform: rotate(90deg) scale(1.1);
  }
}

@keyframes dortmundDeleteNudge {

  0%,
  100% {
    transform: rotate(0) scale(1);
  }

  35% {
    transform: rotate(-12deg) scale(1.14);
  }

  70% {
    transform: rotate(9deg) scale(1.14);
  }
}

@keyframes dortmundEnablePulse {
  0% {
    opacity: .9;
    transform: scale(.55);
    box-shadow: 0 0 0 0 rgba(46, 138, 95, .22);
  }

  100% {
    opacity: 0;
    transform: scale(1.15);
    box-shadow: 0 0 0 6px rgba(46, 138, 95, 0);
  }
}

@media (prefers-reduced-motion: reduce) {

  .dortmund-action-btn,
  .dortmund-action-btn i,
  .dortmund-action-btn::after {
    transition: none;
    animation: none !important;
  }

  .dortmund-action-btn:hover:not(:disabled),
  .dortmund-action-btn:hover:not(:disabled) i,
  .dortmund-action-btn:hover:not(:disabled)::after {
    transform: none;
    box-shadow: none;
  }
}
</style>
