import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TripPlannerForm from '../TripPlannerForm/TripPlannerForm';
import './Banner.css';

const Banner = () => {
  const { t } = useTranslation();

  const categories = [
    { name: t('banner.camping'), icon: '/images/icons/004-camping-tent.png', link: '/tours' },
    { name: t('banner.hiking'), icon: '/images/icons/003-hiking.png', link: '/tours' },
    { name: t('banner.beachTours'), icon: '/images/icons/005-sunbed.png', link: '/tours' },
    { name: t('banner.surfing'), icon: '/images/icons/006-surf.png', link: '/tours' },
    { name: t('banner.safari'), icon: '/images/icons/002-safari.png', link: '/tours' },
    { name: t('banner.cycling'), icon: '/images/icons/008-cycling.png', link: '/tours' },
    { name: t('banner.trekings'), icon: '/images/icons/007-hiking-1.png', link: '/tours' }
  ];

  return (
    <section className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
      <div className="container">
        <div className="banner-in">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4">
              <div className="banner-content text-lg-start text-center">
                <h4 className="theme mb-0">{t('banner.exploreWorld')}</h4>
                <h1>{t('banner.planDreamTrip')}</h1>
                <p className="mb-4">{t('banner.bannerDescription')}</p>
                <div className="book-form">
                  <TripPlannerForm />
                </div>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="banner-image">
                <img src="/images/travel.png" alt="Travel" />
              </div>
            </div>
          </div>
          <div className="category-main-inner border-t pt-1">
            <div className="row side-slider">
              {categories.map((category, index) => (
                <div key={index} className="col-lg-3 col-md-6 my-4">
                  <div className="category-item box-shadow p-3 py-4 text-center bg-white rounded overflow-hidden">
                    <div className="trending-topic-content">
                      <img src={category.icon} className="mb-1 d-inline-block" alt={category.name} />
                      <h4 className="mb-0"><Link to={category.link}>{category.name}</Link></h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;

