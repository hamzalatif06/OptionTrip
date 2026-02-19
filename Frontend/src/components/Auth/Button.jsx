import React from 'react';
import './Button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  icon = null,
  iconPosition = 'left'
}) => {
  const buttonClasses = [
    'auth-button',
    `auth-button-${variant}`,
    `auth-button-${size}`,
    fullWidth ? 'auth-button-full' : '',
    loading ? 'auth-button-loading' : '',
    disabled ? 'auth-button-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="auth-button-spinner"></span>
          <span className="auth-button-text">Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="auth-button-icon auth-button-icon-left">{icon}</span>
          )}
          <span className="auth-button-text">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="auth-button-icon auth-button-icon-right">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
