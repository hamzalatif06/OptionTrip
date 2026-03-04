import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./DiscountAction.css";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INTRO_VIDEO_ID = 'N_be9PXr5Qc';

const DiscountAction = () => {
  const [showModal, setShowModal] = useState(false);
  const [latestVideoId, setLatestVideoId] = useState(null);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`${API_BASE}/api/youtube/latest`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.videoId) setLatestVideoId(data.videoId); })
      .catch(() => {});
  }, []);

  const currentVideoId = hasPlayedOnce ? (latestVideoId || INTRO_VIDEO_ID) : INTRO_VIDEO_ID;

  const handleVideoClick = () => {
    setShowModal(true);
    setHasPlayedOnce(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <section
        className="discount-action pt-6"
        style={{
          backgroundImage: `url(/images/section-bg1.png)`,
          backgroundPosition: "center",
        }}
      >
        <div
          className="section-shape section-shape1 top-inherit bottom-0"
          style={{
            backgroundImage: `url(/images/shape8.png)`,
          }}
        ></div>

        <div className="container">
          <div className="call-banner rounded pt-10 pb-14">
            <div className="call-banner-inner w-75 mx-auto text-center px-5">
              <div className="trend-content-main">
                <div className="trend-content mb-5 pb-2 px-5">
                  <h5 className="mb-1 theme">{t('discountAction.loveGoing')}</h5>

                  <h2>
                    <Link to="/tours">
                      {t('discountAction.exploreLife')}
                      <span className="theme1"> {t('discountAction.travelWant')}</span>
                    </Link>
                  </h2>

                  <p>
                    {t('discountAction.description')}
                  </p>
                </div>

                {/* Play Button */}
                <div className="video-button text-center position-relative">
                  <div className="call-button text-center">
                    <button
                      type="button"
                      className="play-btn js-video-button"
                      onClick={handleVideoClick}
                    >
                      <i className="fa fa-play bg-blue"></i>
                    </button>
                  </div>
                  <div className="video-figure"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="white-overlay"></div>
      </section>

      {/* ======================
         🎬 YouTube MODAL
      ====================== */}
      {showModal && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div
            className="video-modal"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <button className="close-btn" onClick={closeModal}>
              ×
            </button>

            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
              title="YouTube video"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default DiscountAction;
