/**
 * 管理后台内联富文本工具（与 level-config 等页一致：contenteditable + document.execCommand）
 * 供课程图文块等多处复用，避免各页复制 execCommand 逻辑。
 */
(function (global) {
  'use strict';

  /**
   * 聚焦指定元素后执行 execCommand（工具栏按钮须 @mousedown.prevent 以免失焦）
   * @param {string} elementId
   * @param {string} command
   * @param {string|null|undefined} [value]
   */
  function focusExec(elementId, command, value) {
    const el = document.getElementById(elementId);
    if (el) el.focus();
    try {
      document.execCommand(command, false, value != null ? value : null);
    } catch (e) {
      console.warn('[AdminRichTextInline] execCommand failed:', command, e);
    }
  }

  /**
   * HTML → 纯文本（云函数侧有同名逻辑用于 description 摘要；此处供前台预览或校验）
   * @param {string|null|undefined} html
   * @returns {string}
   */
  function stripHtmlToPlain(html) {
    if (html == null || html === '') return '';
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  global.AdminRichTextInline = {
    focusExec,
    stripHtmlToPlain,
  };
})(typeof window !== 'undefined' ? window : globalThis);
