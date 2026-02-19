import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    // Add form submission logic here
  };

  return (
    <>
      <div className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
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
            <div className="col-lg-8 mb-4">
              <div className="box-shadow bg-white p-4 rounded">
                <h3 className="mb-4">Send us a Message</h3>
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
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <button type="submit" className="nir-btn">Send Message</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="box-shadow bg-white p-4 rounded">
                <h3 className="mb-4">Contact Information</h3>
                <ul>
                  <li className="mb-3">
                    <i className="icon-location-pin theme me-2"></i>
                    <strong>Address:</strong><br />
                    Collins Street, Sydney, Australia
                  </li>
                  <li className="mb-3">
                    <i className="icon-phone theme me-2"></i>
                    <strong>Phone:</strong><br />
                    +47-252-254-2542
                  </li>
                  <li className="mb-3">
                    <i className="icon-envelope theme me-2"></i>
                    <strong>Email:</strong><br />
                    info@optiontrip.com
                  </li>
                  <li className="mb-3">
                    <i className="icon-clock theme me-2"></i>
                    <strong>Hours:</strong><br />
                    Mon-Fri: 10 AM – 5 PM
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;

