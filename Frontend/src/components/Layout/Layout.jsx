import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Preloader from '../Preloader/Preloader';
import SearchPopup from '../SearchPopup/SearchPopup';
import LoginModal from '../LoginModal/LoginModal';
import ViAssistant from '../ViAssistant/ViAssistant';

const Layout = ({ children }) => {
  return (
    <>
      <Preloader />
      <Header />
      <main>
        {children}
      </main>
      <Footer />
      <SearchPopup />
      <LoginModal />
      <ViAssistant />
    </>
  );
};

export default Layout;

