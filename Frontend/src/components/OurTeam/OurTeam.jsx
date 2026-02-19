import React from 'react';
import './OurTeam.css';

const OurTeam = () => {
  const teamMembers = [
    { name: 'Salmon Thuir', role: 'Senior Agent', image: '/images/team/img1.jpg' },
    { name: 'Horke Pels', role: 'Head Officer', image: '/images/team/img2.jpg' },
    { name: 'Solden kalos', role: 'Supervisor', image: '/images/team/img4.jpg' },
    { name: 'Nelson Bam', role: 'Quality Assurance', image: '/images/team/img3.jpg' },
    { name: 'Cacics Coold', role: 'Asst. Manager', image: '/images/team/img4.jpg' }
  ];

  return (
    <section className="our-team pb-6">
      <div className="container">
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">Tour Guides</h4>
          <h2 className="mb-1">Meet Our <span className="theme">Excellent Guides</span></h2>
          <p>Our expert team of travel specialists and AI engineers work together to ensure every trip is perfectly tailored to your unique preferences and dreams.</p>
        </div>
        <div className="team-main">
          <div className="row shop-slider">
            {teamMembers.map((member, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-sm-12 mb-4">
                <div className="team-list rounded">
                  <div className="team-image">
                    <img src={member.image} alt={member.name} />
                  </div>
                  <div className="team-content text-center p-3 bg-theme">
                    <h4 className="mb-0 white">{member.name}</h4>
                    <p className="mb-0 white">{member.role}</p>
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

export default OurTeam;


