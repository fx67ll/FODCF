<template>
  <div>
    <i class="el-icon-mobile-phone" @click="goto" />
  </div>
</template>

<script>
export default {
  name: "fx67llDoc",
  data() {
    return {
      url: "https://life.fx67ll.com/",
    };
  },
  methods: {
    goto() {
      window.open(this.url);
    },
  },
};
</script>
