import React from 'react';
import { Link } from 'react-router-dom';
import './RecentArticles.css';

const RecentArticles = () => {
  const articles = [
    {
      category: 'Technology',
      title: 'How AI is Revolutionizing Travel Planning in 2025',
      description: 'Discover how artificial intelligence is transforming the way we plan trips, from personalized recommendations to real-time itinerary adjustments.',
      author: 'Sarah Chen',
      authorImage: '/images/reviewer/2.jpg',
      image: '/images/trending/trending10.jpg'
    },
    {
      category: 'Inspiration',
      title: '10 Hidden Gems Discovered by Our AI Travel Planner',
      description: 'Explore breathtaking destinations that our AI uncovered by analyzing millions of travel patterns and off-the-beaten-path experiences.',
      author: 'Michael Rodriguez',
      authorImage: '/images/reviewer/1.jpg',
      image: '/images/trending/trending12.jpg'
    },
    {
      category: 'Tips',
      title: 'Maximize Your Travel Budget with Smart AI Recommendations',
      description: 'Learn how our AI-powered platform helps you find the best deals, optimize spending, and create unforgettable experiences within your budget.',
      author: 'Emma Thompson',
      authorImage: '/images/reviewer/3.jpg',
      image: '/images/trending/trending13.jpg'
    }
  ];

  return (
    <section className="trending recent-articles pb-6">
      <div className="container">
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">Our Blogs Offers</h4>
          <h2 className="mb-1">Recent <span className="theme">Articles & Posts</span></h2>
          <p>Stay updated with the latest travel trends, AI insights, destination guides, and expert tips to make your next trip extraordinary.</p>
        </div>
        <div className="recent-articles-inner">
          <div className="row">
            {articles.map((article, index) => (
              <div key={index} className={index === 0 ? 'col-lg-4' : 'col-lg-4 col-md-6'}>
                <div className="trend-item box-shadow bg-white mb-4 rounded overflow-hidden">
                  <div className="trend-image">
                    <img src={article.image} alt={article.title} />
                  </div>
                  <div className="trend-content-main p-4 pb-2">
                    <div className="trend-content">
                      <h5 className="theme mb-1">{article.category}</h5>
                      <h4><Link to="/blog">{article.title}</Link></h4>
                      <p className="mb-3">{article.description}</p>
                      <div className="entry-meta d-flex align-items-center justify-content-between">
                        <div className="entry-author mb-2">
                          <img src={article.authorImage} alt={article.author} className="rounded-circle me-1" />
                          <span>{article.author}</span>
                        </div>
                        <div className="entry-button d-flex align-items-center mb-2">
                          <Link to="/blog" className="nir-btn">Read More</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentArticles;

