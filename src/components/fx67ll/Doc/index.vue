<template>
  <div>
    <svg-icon icon-class="phone" @click="goto" />
  </div>
</template>

<script>
export default {
  name: "fx67llDoc",
  data() {
    return {
      url: "https://fx67ll.vip/",
    };
  },
  methods: {
    goto() {
      window.open(this.url);
    },
  },
};
</script>
