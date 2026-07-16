'use client';
import { memo, useState, useEffect, useCallback } from 'react';
import { Twitter, Facebook, Linkedin, Share2, Link as LinkIcon } from 'lucide-react';
import styles from './ShareButtons.module.css';

const SHARE_PLATFORMS = [
  {
    name: 'Twitter',
    icon: Twitter,
    getUrl: (encodedTitle, encodedUrl) =>
      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  },
  {
    name: 'Facebook',
    icon: Facebook,
    getUrl: (_encodedTitle, encodedUrl) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    getUrl: (_encodedTitle, encodedUrl) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  },
  {
    name: 'WhatsApp',
    icon: Share2,
    getUrl: (encodedTitle, encodedUrl) =>
      `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  },
];

function ShareButtons({ title, slug, className }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/post/${slug}`);
  }, [slug]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [url]);

  return (
    <div className={`${styles.shareButtons}${className ? ` ${className}` : ''}`}>
      <span className={styles.label}>
        <Share2 size={16} />
        分享这篇文章
      </span>

      <div className={styles.buttons}>
        {SHARE_PLATFORMS.map(({ name, icon: Icon, getUrl }) => (
          <a
            key={name}
            href={getUrl(encodedTitle, encodedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles[name.toLowerCase()]}`}
            aria-label={`分享到 ${name}`}
          >
            <Icon size={20} />
            <span className={styles.buttonLabel}>{name}</span>
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopyLink}
          className={`${styles.button} ${styles.copy}${copied ? ` ${styles.copyCopied}` : ''}`}
          aria-label="复制链接"
        >
          <LinkIcon size={20} />
          <span className={styles.buttonLabel}>{copied ? '已复制!' : '复制链接'}</span>
        </button>
      </div>
    </div>
  );
}

export default memo(ShareButtons);
