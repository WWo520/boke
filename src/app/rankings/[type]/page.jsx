'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rankingApi } from '../../../api/client';
import FollowButton from '../../../components/FollowButton/FollowButton';
import styles from '../../../css_pages/Rankings.module.css';

export default function Rankings() {
  const { type } = useParams();
  const router = useRouter();
  const [activeType, setActiveType] = useState(type || 'hot');
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeType, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeType) {
        case 'hot':
          const hotRes = await rankingApi.posts({ period, limit: 30 });
          setData(hotRes.data);
          break;
        case 'views':
          const viewsRes = await rankingApi.views({ period, limit: 30 });
          setData(viewsRes.data);
          break;
        case 'comments':
          const commentsRes = await rankingApi.comments({ period, limit: 30 });
          setData(commentsRes.data);
          break;
        case 'authors':
          const authorsRes = await rankingApi.authors(30);
          setData(authorsRes.data);
          break;
        case 'tags':
          const tagsRes = await rankingApi.tags(30);
          setData(tagsRes.data);
          break;
        default:
          const defaultRes = await rankingApi.posts({ period, limit: 30 });
          setData(defaultRes.data);
      }
    } catch (err) {
      console.error('Ranking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const typeTabs = [
    { key: 'hot', label: '热榜', icon: '🔥' },
    { key: 'views', label: '阅读榜', icon: '👁️' },
    { key: 'comments', label: '评论榜', icon: '💬' },
    { key: 'authors', label: '作者榜', icon: '👤' },
    { key: 'tags', label: '标签榜', icon: '🏷️' },
  ];

  const periods = ['day', 'week', 'month', 'year'];
  const periodLabels = { day: '今日', week: '本周', month: '本月', year: '本年' };

  const getRankStyle = (index) => {
    if (index === 0) return styles.rank1;
    if (index === 1) return styles.rank2;
    if (index === 2) return styles.rank3;
    return styles.rank;
  };

  return (
    <div className={styles.rankingsPage}>
      <div className={styles.header}>
        <h1>排行榜</h1>
        <p>发现最热门的内容和创作者</p>
      </div>

      <div className={styles.tabs}>
        {typeTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveType(tab.key);
              router.push(`/rankings/${tab.key}`);
            }}
            className={`${styles.tab} ${activeType === tab.key ? styles.active : ''}`}
          >
            <span className={styles.icon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {(activeType === 'hot' || activeType === 'views' || activeType === 'comments') && (
        <div className={styles.periodTabs}>
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`${styles.periodTab} ${period === p ? styles.active : ''}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : data.length === 0 ? (
          <div className={styles.empty}>暂无数据</div>
        ) : activeType === 'authors' ? (
          data.map((author, index) => (
            <div key={author.id} className={styles.item} onClick={() => router.push(`/u/${author.name}`)}>
              <span className={getRankStyle(index)}>{index + 1}</span>
              <img src={author.avatar} alt={author.name} className={styles.authorAvatar} />
              <div className={styles.authorInfo}>
                <div className={styles.authorName}>
                  {author.name}
                  <span className={styles.level}>Lv.{author.level}</span>
                </div>
                <p className={styles.authorBio}>{author.bio || '暂无简介'}</p>
                <div className={styles.authorStats}>
                  <span>{author.postCount || 0} 文章</span>
                  <span>{author.followersCount || 0} 粉丝</span>
                  <span>{author.totalViews || 0} 阅读</span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <FollowButton
                  userId={author.id}
                  isFollowed={false}
                  onFollowChange={(following) => {
                    const newData = [...data];
                    newData[index] = {
                      ...newData[index],
                      followersCount: following
                        ? (newData[index].followersCount || 0) + 1
                        : Math.max(0, (newData[index].followersCount || 0) - 1)
                    };
                    setData(newData);
                  }}
                />
              </div>
            </div>
          ))
        ) : activeType === 'tags' ? (
          data.map((tag, index) => (
            <div key={tag.tag} className={styles.tagItem}>
              <span className={getRankStyle(index)}>{index + 1}</span>
              <span className={styles.tagName}>{tag.tag}</span>
              <span className={styles.tagCount}>{tag.postCount || 0} 文章</span>
              <span className={styles.tagViews}>{tag.totalViews || 0} 阅读</span>
            </div>
          ))
        ) : (
          data.map((post, index) => (
            <div key={post.id} className={styles.item} onClick={() => router.push(`/post/${post.slug}`)}>
              <span className={getRankStyle(index)}>{index + 1}</span>
              <div className={styles.postInfo}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <div className={styles.postMeta}>
                  <span className={styles.author}>{post.author?.name || '未知'}</span>
                  {post.category && <span className={styles.category}>{post.category.name}</span>}
                </div>
                <div className={styles.postStats}>
                  <span className={styles.stat}>{post.views} 阅读</span>
                  {post.commentCount && <span className={styles.stat}>{post.commentCount} 评论</span>}
                  {post.likeCount && <span className={styles.stat}>{post.likeCount} 点赞</span>}
                </div>
              </div>
              {post.coverImage && (
                <img src={post.coverImage} alt={post.title} className={styles.postCover} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
