'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { postsApi } from '../../api/client';
import styles from './Carousel.module.css';

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    postsApi.popular(5).then((res) => {
      setSlides(res.data);
    }).catch(() => {});
  }, []);

  const goTo = useCallback((index) => {
    setCurrent((index + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => goTo(current + 1), [goTo, current]);
  const goPrev = useCallback(() => goTo(current - 1), [goTo, current]);

  // Auto-play
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    timerRef.current = setInterval(goNext, 4000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, goNext, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section
      className={styles.carousel}
      aria-label="推荐文章轮播"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.track}>
        <Link href={`/post/${slide.slug}`} className={styles.slide}>
          <img
            src={slide.coverImage}
            alt={slide.title}
            className={styles.image}
            loading="eager"
          />
          <div className={styles.overlay}>
            <span className={styles.category} style={{ backgroundColor: getCategoryColor(slide.category?.slug) }}>
              {slide.category?.name}
            </span>
            <h2 className={styles.title}>{slide.title}</h2>
            <p className={styles.summary}>{slide.summary}</p>
          </div>
        </Link>
      </div>

      {/* Arrows */}
      <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={goPrev} aria-label="上一张">
        <ChevronLeft size={24} />
      </button>
      <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={goNext} aria-label="下一张">
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className={styles.dots} role="tablist" aria-label="轮播指示器">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            role="tab"
            aria-selected={i === current}
            aria-label={`第 ${i + 1} 张`}
          />
        ))}
      </div>
    </section>
  );
}

function getCategoryColor(slug) {
  const colors = {
    tech: '#2563eb',
    design: '#7c3aed',
    life: '#10b981',
    frontend: '#f59e0b',
    thoughts: '#ef4444',
  };
  return colors[slug] || '#2563eb';
}
