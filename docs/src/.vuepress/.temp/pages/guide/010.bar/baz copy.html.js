export const data = JSON.parse("{\"key\":\"v-72a055d5\",\"path\":\"/guide/010.bar/baz%20copy.html\",\"title\":\"Baz\",\"lang\":\"en-US\",\"frontmatter\":{\"icon\":\"info\",\"description\":\"Feature details here.\"},\"headers\":[],\"readingTime\":{\"minutes\":0.02,\"words\":6},\"filePathRelative\":\"guide/010.bar/baz copy.md\",\"autoDesc\":true}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}