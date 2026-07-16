'use client';
import { useState, useEffect } from 'react';

export default function MarkdownContent({ content, styles }) {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    Promise.all([
      import('react-markdown'),
      import('remark-gfm'),
      import('rehype-highlight'),
      import('highlight.js/styles/github.css'),
    ]).then(([md, gfm, highlight]) => {
      const ReactMarkdown = md.default;
      const remarkGfm = gfm.default;
      const rehypeHighlight = highlight.default;

      setComponent(() => (props) => (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h2: ({ children }) => <h2 className={props.styles.contentH2}>{children}</h2>,
            h3: ({ children }) => <h3 className={props.styles.contentH3}>{children}</h3>,
            p: ({ children }) => <p className={props.styles.contentP}>{children}</p>,
            ul: ({ children }) => <ul className={props.styles.contentList}>{children}</ul>,
            ol: ({ children }) => <ol className={props.styles.contentList}>{children}</ol>,
            li: ({ children }) => <li className={props.styles.contentLi}>{children}</li>,
            blockquote: ({ children }) => <blockquote className={props.styles.contentQuote}>{children}</blockquote>,
            code: ({ className, children }) => (
              <code className={`${props.styles.contentCode} ${className || ''}`}>{children}</code>
            ),
            pre: ({ children }) => <pre className={props.styles.contentPre}>{children}</pre>,
            table: ({ children }) => <table className={props.styles.contentTable}>{children}</table>,
            th: ({ children }) => <th className={props.styles.contentTh}>{children}</th>,
            td: ({ children }) => <td className={props.styles.contentTd}>{children}</td>,
            a: ({ href, children }) => (
              <a href={href} className={props.styles.contentLink} target="_blank" rel="noopener noreferrer">{children}</a>
            ),
            strong: ({ children }) => <strong className={props.styles.contentStrong}>{children}</strong>,
            em: ({ children }) => <em className={props.styles.contentEm}>{children}</em>,
            hr: () => <hr className={props.styles.contentHr} />,
          }}
        >
          {props.content}
        </ReactMarkdown>
      ));
    });
  }, []);

  if (!Component) {
    return <div style={{ padding: '20px', color: 'var(--color-text-muted)' }}>加载文章内容...</div>;
  }

  return <Component content={content} styles={styles} />;
}
