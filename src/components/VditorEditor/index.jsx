'use client';

import { useEffect, useRef } from 'react';
import 'vditor/dist/index.css';

/**
 * VditorEditor —— 所见即所得（WYSIWYG）Markdown 编辑器
 *
 * - 内容以 Markdown 存储：onChange 回传的是 markdown 字符串，getValue() 亦然，
 *   与文章详情页的 react-markdown 渲染完全兼容，无需数据迁移。
 * - vditor 依赖 document/window，故在 useEffect 内懒加载，避免 SSR 报错。
 * - 图片上传复用后端 /api/upload（返回 { data: { url } }），通过 upload.format 适配。
 * - 暗色模式：跟随 <html data-theme>，通过 MutationObserver 实时切换。
 */
export default function VditorEditor({ value = '', onChange, placeholder }) {
  const elRef = useRef(null);
  const vditorRef = useRef(null);
  const readyRef = useRef(false);
  // 用 ref 持有最新的 value / onChange，避免 useEffect 闭包过期
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    let destroyed = false;
    let observer = null;

    const editorTheme = () =>
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'classic';
    const contentTheme = () =>
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

    import('vditor').then(({ default: Vditor }) => {
      if (destroyed || !elRef.current) return;

      let token = '';
      try { token = sessionStorage.getItem('blog_token') || ''; } catch { token = ''; }

      const vditor = new Vditor(elRef.current, {
        mode: 'wysiwyg',
        height: 520,
        minHeight: 420,
        placeholder: placeholder || '开始创作你的文章，所见即所得，支持 Markdown 语法与快捷键…',
        theme: editorTheme(),
        cache: { enable: false },
        preview: {
          theme: { current: contentTheme() },
          hljs: { lineNumber: true, style: contentTheme() === 'dark' ? 'native' : 'github' },
        },
        toolbar: [
          'headings', 'bold', 'italic', 'strike', '|',
          'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
          'quote', 'line', 'code', 'inline-code', '|',
          'link', 'table', 'upload', '|',
          'undo', 'redo', '|',
          'fullscreen',
        ],
        toolbarConfig: { pin: true },
        upload: {
          url: '/api/upload',
          fieldName: 'image',
          multiple: false,
          accept: 'image/*',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          format(files, responseText) {
            try {
              const res = JSON.parse(responseText);
              const url = (res && res.data && res.data.url) || '';
              const name = (files && files[0] && files[0].name) || 'image';
              return JSON.stringify({ msg: '', code: 0, data: { errFiles: [], succMap: { [name]: url } } });
            } catch {
              return JSON.stringify({ msg: '上传失败', code: 1, data: { errFiles: [], succMap: {} } });
            }
          },
        },
        input(val) {
          if (onChangeRef.current) onChangeRef.current(val);
        },
        after() {
          if (destroyed) { vditor.destroy(); return; }
          readyRef.current = true;
          vditorRef.current = vditor;
          const incoming = valueRef.current || '';
          if (incoming) vditor.setValue(incoming);
          vditor.setTheme(editorTheme(), contentTheme());
        },
      });

      // 跟随站点主题切换
      observer = new MutationObserver(() => {
        if (vditorRef.current) vditorRef.current.setTheme(editorTheme(), contentTheme());
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    });

    return () => {
      destroyed = true;
      if (observer) observer.disconnect();
      if (vditorRef.current) {
        try { vditorRef.current.destroy(); } catch { /* ignore */ }
        vditorRef.current = null;
      }
      readyRef.current = false;
    };
  }, []);

  // 外部 value 变化（如编辑态异步加载草稿）时同步进编辑器；
  // 通过与当前 getValue() 比较，避免把用户正在输入的内容重置、光标跳动。
  useEffect(() => {
    const v = vditorRef.current;
    if (!v || !readyRef.current) return;
    const current = v.getValue();
    if ((value || '').trimEnd() !== (current || '').trimEnd()) {
      v.setValue(value || '');
    }
  }, [value]);

  return <div ref={elRef} />;
}
