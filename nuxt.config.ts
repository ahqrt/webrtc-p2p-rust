// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/devtools',
    '@varlet/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  devtools: {
    enabled: true,
  }
})
