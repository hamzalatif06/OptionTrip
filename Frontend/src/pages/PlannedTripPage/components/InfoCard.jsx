import React, { useState } from 'react';
import './InfoCard.css';

const InfoCard = ({
  title,
  subTitle,
  icon,
  data = [],
  children,
  isLoading = false,
  hasPopover = false,
  maxVisibleEntries = 3,
  minWidth = '256px',
  maxWidth = '256px',
  height = '156px',
}) => {
  const [showPopover, setShowPopover] = useState(false);

  const hasMoreData = data && data.length > maxVisibleEntries;
  const visibleData = hasMoreData ? data.slice(0, maxVisibleEntries) : data;

  const handleCardClick = () => {
    if (hasPopover && hasMoreData) {
      setShowPopover(true);
    }
  };

  const handleClosePopover = () => {
    setShowPopover(false);
  };

  if (isLoading) {
    return (
      <div
        className="info-card info-card--loading"
        style={{ minWidth, maxWidth, height }}
      >
        <div className="info-card__skeleton">
          <div className="info-card__skeleton-header"></div>
          <div className="info-card__skeleton-row"></div>
          <div className="info-card__skeleton-row"></div>
          <div className="info-card__skeleton-row"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`info-card ${hasPopover && hasMoreData ? 'info-card--clickable' : ''}`}
        style={{ minWidth, maxWidth, height }}
        onClick={handleCardClick}
      >

        <div className="info-card__header">
          {icon && (
            <span className="info-card__icon">
              {typeof icon === 'string' ? icon : icon}
            </span>
          )}
          <div className="info-card__header-text">
            <h3 className="info-card__title">{title}</h3>
            {subTitle && <p className="info-card__subtitle">{subTitle}</p>}
          </div>
        </div>


        <div className="info-card__content">
          {children ? (
            children
          ) : (
            <div className="info-card__table">
              {visibleData.map((item, index) => (
                <div key={index} className="info-card__row">
                  <span className="info-card__label">{item.label}</span>
                  <span className="info-card__value">{item.value}</span>
                </div>
              ))}
              {hasMoreData && hasPopover && (
                <div className="info-card__see-more">
                  Click to see more
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {showPopover && (
        <div className="info-card-popover" onClick={handleClosePopover}>
          <div
            className="info-card-popover__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="info-card-popover__header">
              <div className="info-card-popover__header-left">
                {icon && (
                  <span className="info-card-popover__icon">
                    {typeof icon === 'string' ? icon : icon}
                  </span>
                )}
                <h3 className="info-card-popover__title">{title}</h3>
              </div>
              <button
                className="info-card-popover__close"
                onClick={handleClosePopover}
              >
                ✕
              </button>
            </div>
            <div className="info-card-popover__body">
              <div className="info-card__table">
                {data.map((item, index) => (
                  <div key={index} className="info-card__row">
                    <span className="info-card__label">{item.label}</span>
                    <span className="info-card__value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoCard;
