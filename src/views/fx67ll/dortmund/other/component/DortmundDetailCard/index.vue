<template>
  <section class='dortmund-detail-card' :data-tone='tone' :data-feature='feature'>
    <div class='dortmund-detail-card-head'>
      <span class='dortmund-detail-card-icon'><i :class='icon'></i></span>
      <div class='dortmund-detail-card-copy'>
        <h3>{{ title }}</h3>
        <p v-if='subtitle'>{{ subtitle }}</p>
      </div>
      <div v-if='$slots.extra' class='dortmund-detail-card-extra'>
        <slot name='extra'></slot>
      </div>
    </div>
    <div class='dortmund-detail-card-body'>
      <slot></slot>
    </div>
  </section>
</template>

<script>
export default {
  name: 'DortmundDetailCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'el-icon-document',
    },
    tone: {
      type: String,
      default: 'green',
    },
    feature: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang='scss' scoped>
.dortmund-detail-card {
  --section-accent: #2ecc71;
  --section-accent-soft: #e9f9f0;

  padding: 22px 0 24px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf1ef;
  animation: dortmundSectionIn .34s cubic-bezier(.22, .8, .28, 1) both;

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
}

.dortmund-detail-card[data-tone='green'] {
  --section-accent: #2ecc71;
  --section-accent-soft: #e9f9f0;
}

.dortmund-detail-card[data-tone='blue'] {
  --section-accent: #2f9e85;
  --section-accent-soft: #eaf8f3;
}

.dortmund-detail-card[data-tone='amber'] {
  --section-accent: #6f9f58;
  --section-accent-soft: #f1f8ec;
}

.dortmund-detail-card[data-tone='violet'] {
  --section-accent: #4f8f76;
  --section-accent-soft: #edf8f2;
}

.dortmund-detail-card[data-tone='cyan'] {
  --section-accent: #2f9e8c;
  --section-accent-soft: #eaf8f4;
}

.dortmund-detail-card-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 15px;
}

.dortmund-detail-card-icon {
  display: grid;
  flex: 0 0 30px;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--section-accent);
  background: var(--section-accent-soft);
  border-radius: 8px;

  i {
    font-size: 14px;
  }
}

.dortmund-detail-card-copy {
  min-width: 0;
  flex: 1;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 720;
    line-height: 1.35;
    color: #1f2d28;
    overflow-wrap: anywhere;
  }

  p {
    margin: 3px 0 0;
    font-size: 11px;
    line-height: 1.45;
    color: #87948d;
    overflow-wrap: anywhere;
  }
}

.dortmund-detail-card-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.dortmund-detail-card-body {
  padding: 0;
}

@keyframes dortmundSectionIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 520px) {
  .dortmund-detail-card {
    padding: 18px 0 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dortmund-detail-card {
    animation: none;
  }
}
</style>
