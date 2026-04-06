/**
 * Vue 3 指令：contenteditable 与字符串模型双向-ish 同步
 * - 避免 v-html + contenteditable 在重渲染或中文输入法合成时覆盖 DOM 导致「输入顺序错乱」
 * - 正在该元素内输入（焦点在其上）时，不在 updated 里写 innerHTML
 */
(function (global) {
  'use strict';

  global.VueEditableHtmlDirective = {
    mounted(el, binding) {
      el.innerHTML = binding.value == null ? '' : String(binding.value);
    },
    updated(el, binding) {
      if (document.activeElement === el) return;
      const next = binding.value == null ? '' : String(binding.value);
      if (el.innerHTML !== next) el.innerHTML = next;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
