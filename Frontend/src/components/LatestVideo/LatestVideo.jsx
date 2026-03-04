import React, { useState, useEffect } from 'react';
import './LatestVideo.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LatestVideo = () => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/youtube/latest`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (data.videoId) setVideo(data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) return null;

  return (
    <section className="latest-video section-padding">
      <div className="container">
        <div className="latest-video__top">
          <div className="latest-video__heading">
            <h4 className="theme">Our Channel</h4>
            <h2>Latest from YouTube</h2>
          </div>
          <a
            href="https://www.youtube.com/@optiontrip"
            target="_blank"
            rel="noopener noreferrer"
            className="nir-btn"
          >
            View Channel
          </a>
        </div>

        <div className="latest-video__wrapper">
          {loading ? (
            <div className="latest-video__skeleton">
              <div className="latest-video__skeleton-player"></div>
            </div>
          ) : video ? (
            <>
              <div className="latest-video__player">
                <iframe
                  src={`https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              {video.title && (
                <p className="latest-video__title">{video.title}</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default LatestVideo;
