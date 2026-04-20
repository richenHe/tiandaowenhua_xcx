<template>
  <scroll-view
    class="t-capsule-tabs-scroll"
    scroll-x
    :show-scrollbar="false"
    enhanced
    :bounces="false"
  >
    <view class="t-capsule-tabs" :class="{ 't-capsule-tabs--block': block }">
      <view
        v-for="(item, index) in options"
        :key="`${index}-${item.label}`"
        class="t-capsule-tabs__item"
        :class="{ 't-capsule-tabs__item--active': isActive(item, index) }"
        @click="handleChange(item, index)"
      >
        {{ item.label }}
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
/**
 * 横向胶囊标签栏
 * 视觉参考 shadcn/ui `@shadcn/tabs` 的 **default** 变体（muted 槽 + 选中浮层），样式见 `capsule-tabs.scss`
 */
export interface TabOption {
  label: string
  /** 未传时按选项在数组中的下标作为值；可显式传 null（如「全部」筛选项） */
  value?: string | number | null
}

interface Props {
  modelValue: string | number | null
  options: TabOption[]
  /** 为 true 时各 tab 均分一行宽度 */
  block?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'change', value: string | number | null): void
}

const props = withDefaults(defineProps<Props>(), {
  block: false,
})

const emit = defineEmits<Emits>()

/** 与选项对应的实际取值（区分「未定义」与「显式 null」） */
function tabValue(item: TabOption, index: number): string | number | null {
  return item.value !== undefined ? item.value : index
}

function isActive(item: TabOption, index: number): boolean {
  return props.modelValue === tabValue(item, index)
}

function handleChange(item: TabOption, index: number) {
  const v = tabValue(item, index)
  emit('update:modelValue', v)
  emit('change', v)
}
</script>
