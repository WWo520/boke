import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Calendar, BookOpen, Heart, Eye, PenLine, Github, Twitter } from 'lucide-react';
import { authorApi, postsApi, categoriesApi } from '../api/client';
import { formatDate, formatViews } from '../utils/helpers';
import styles from './About.module.css';

export default function About() {
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authorApi.get().then((res) => setAuthor(res.data)),
      postsApi.list({ pageSize: 6 }).then((res) => setRecentPosts(res.data)),
      categoriesApi.list().then((res) => setCategories(res.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!author) return null;

  const totalViews = recentPosts.reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="返回">
            <ArrowLeft size={18} />
            <span>返回</span>
          </button>
          <div className={styles.heroInner}>
            <div className={styles.avatarRing}>
              <img src={author.avatar} alt={author.name} className={styles.avatar} />
            </div>
            <h1 className={styles.name}>{author.name}</h1>
            <p className={styles.bio}>{author.bio}</p>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <BookOpen size={18} />
                <span className={styles.heroStatNum}>{author.stats.posts}</span>
                <span className={styles.heroStatLabel}>篇文章</span>
              </div>
              <div className={styles.heroStat}>
                <Eye size={18} />
                <span className={styles.heroStatNum}>{formatViews(totalViews)}</span>
                <span className={styles.heroStatLabel}>总阅读</span>
              </div>
              <div className={styles.heroStat}>
                <Heart size={18} />
                <span className={styles.heroStatNum}>{author.stats.followers}</span>
                <span className={styles.heroStatLabel}>关注者</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.main}>
          {/* Introduction */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <PenLine size={22} />
              <span>关于我</span>
            </h2>
            <div className={styles.introCard}>
              <p>你好，我是 <strong>{author.name}</strong>，一名热爱技术与写作的创作者。</p>
              <p>
                这个博客是我记录思考、分享知识的一方小天地。在这里，我会写下关于前端开发、产品设计、以及生活中的点滴感悟。
              </p>
              <p>
                我相信 <em>「字里行间，看见世界」</em>——每一行代码、每一段文字，都是与世界的对话。
              </p>
              <p>感谢你的到来，希望这里的内容能给你带来一些启发或温暖。</p>
            </div>
          </section>

          {/* Skills / Interests */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <BookOpen size={22} />
              <span>写作领域</span>
            </h2>
            <div className={styles.tagGrid}>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className={styles.tagCard}
                  style={{ borderLeftColor: cat.color || '#2563eb' }}
                >
                  <span className={styles.tagCardName}>{cat.name}</span>
                  <span className={styles.tagCardCount}>{cat.count} 篇</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Posts */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={22} />
              <span>最近文章</span>
            </h2>
            <div className={styles.postList}>
              {recentPosts.map((post) => (
                <Link key={post.slug} to={`/post/${post.slug}`} className={styles.postItem}>
                  <div className={styles.postCover}>
                    <img src={post.coverImage} alt={post.title} loading="lazy" />
                  </div>
                  <div className={styles.postInfo}>
                    <h3 className={styles.postTitle}>{post.title}</h3>
                    <p className={styles.postSummary}>{post.summary}</p>
                    <div className={styles.postMeta}>
                      <span className={styles.postDate}>{formatDate(post.publishedAt)}</span>
                      <span className={styles.postViews}>
                        <Eye size={13} /> {formatViews(post.views)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Contact */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>联系方式</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <Mail size={16} />
                <span>admin@moke.com</span>
              </div>
              <div className={styles.contactItem}>
                <MapPin size={16} />
                <span>中国 · 互联网</span>
              </div>
              <div className={styles.contactItem}>
                <Github size={16} />
                <span>github.com/moke-blog</span>
              </div>
              <div className={styles.contactItem}>
                <Twitter size={16} />
                <span>@moke_blog</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>博客统计</h3>
            <div className={styles.statList}>
              <div className={styles.statItem}>
                <BookOpen size={16} />
                <div>
                  <div className={styles.statNum}>{author.stats.posts}</div>
                  <div className={styles.statLabel}>文章总数</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <Eye size={16} />
                <div>
                  <div className={styles.statNum}>{formatViews(totalViews)}</div>
                  <div className={styles.statLabel}>总阅读量</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <Calendar size={16} />
                <div>
                  <div className={styles.statNum}>{author.stats.readingTime}</div>
                  <div className={styles.statLabel}>阅读时长</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
