import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus]     = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    }
  };

  return (
    <>
      <div className="banner pt-10 pb-0 overflow-hidden" style={{ backgroundImage: `url(/images/testimonial.png)` }}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Contact Us</h4>
                  <h1>Get In Touch</h1>
                  <p className="mb-4">We'd love to hear from you</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="trending pb-6 pt-6">
        <div className="container">
          <div className="row">

            {/* ── Form ── */}
            <div className="col-lg-8 mb-4">
              <div className="box-shadow bg-white p-4 rounded">
                <h3 className="mb-4">Send us a Message</h3>

                {status === 'success' ? (
                  <div style={{
                    background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                    border: '1px solid #86efac',
                    borderRadius: 12,
                    padding: '40px 28px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                    <h4 style={{ color: '#166534', marginBottom: 8 }}>Message Sent!</h4>
                    <p style={{ color: '#15803d', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                      Thanks for reaching out! We've also sent a confirmation to your email and will reply as soon as possible.
                    </p>
                    <button
                      className="nir-btn"
                      onClick={() => setStatus('idle')}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-6 mb-3">
                        <div className="form-group">
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={status === 'loading'}
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 mb-3">
                        <div className="form-group">
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={status === 'loading'}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12 mb-3">
                        <div className="form-group">
                          <input
                            type="text"
                            name="subject"
                            className="form-control"
                            placeholder="Subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            disabled={status === 'loading'}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12 mb-3">
                        <div className="form-group">
                          <textarea
                            name="message"
                            className="form-control"
                            rows="5"
                            placeholder="Your Message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            disabled={status === 'loading'}
                          />
                        </div>
                      </div>

                      {status === 'error' && (
                        <div className="col-lg-12 mb-3">
                          <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            borderRadius: 8,
                            padding: '12px 16px',
                            color: '#dc2626',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                            <i className="fas fa-circle-exclamation" />
                            {errorMsg}
                          </div>
                        </div>
                      )}

                      <div className="col-lg-12">
                        <button
                          type="submit"
                          className="nir-btn"
                          disabled={status === 'loading'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            opacity: status === 'loading' ? 0.75 : 1,
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {status === 'loading' ? (
                            <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ animation: 'ct-spin 0.9s linear infinite' }}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane" />
                              Send Message
                            </>
                          )}
                        </button>
                        <style>{`@keyframes ct-spin { to { transform: rotate(360deg); } }`}</style>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ── Contact Info ── */}
            <div className="col-lg-4">
              <div className="box-shadow bg-white p-4 rounded">
                <h3 className="mb-4">Contact Information</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li className="mb-4" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <i className="icon-envelope theme" style={{ marginTop: 3, fontSize: 18 }} />
                    <div>
                      <strong>Email</strong><br />
                      <a href="mailto:optiontripcom@gmail.com" style={{ color: '#0A539D', fontSize: 14 }}>
                        optiontripcom@gmail.com
                      </a>
                    </div>
                  </li>
                  <li className="mb-4" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <i className="fas fa-clock theme" style={{ marginTop: 3, fontSize: 18 }} />
                    <div>
                      <strong>Response Time</strong><br />
                      <span style={{ color: '#64748b', fontSize: 14 }}>Usually within 24 hours</span>
                    </div>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <i className="fas fa-globe theme" style={{ marginTop: 3, fontSize: 18 }} />
                    <div>
                      <strong>Support</strong><br />
                      <span style={{ color: '#64748b', fontSize: 14 }}>Worldwide · Online only</span>
                    </div>
                  </li>
                </ul>

                <div style={{
                  marginTop: 24,
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg,rgba(10,83,157,0.05),rgba(2,158,157,0.05))',
                  borderRadius: 10,
                  border: '1px solid rgba(10,83,157,0.1)',
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    <i className="fas fa-shield-halved theme me-1" />
                    Your information is kept private and will only be used to respond to your inquiry.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
