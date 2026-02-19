import React from 'react';
import RecentArticles from '../components/RecentArticles/RecentArticles';

const Blog = () => {
  return (
    <>
      <div className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Our Blog</h4>
                  <h1>Latest Travel Articles & Posts</h1>
                  <p className="mb-4">Read our latest travel tips, guides, and stories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RecentArticles />
    </>
  );
};

export default Blog;


