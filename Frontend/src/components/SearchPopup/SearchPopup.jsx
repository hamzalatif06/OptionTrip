import React, { useState, useEffect } from 'react';
import './SearchPopup.css';

const SearchPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest('a[href="#search1"]')) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.target.closest('#search1 button.close') || (e.target.id === 'search1' && e.target === e.currentTarget)) {
        setIsOpen(false);
      }
    };

    const handleKeyUp = (e) => {
      if (e.keyCode === 27 && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
    setIsOpen(false);
  };

  return (
    <div id="search1" className={isOpen ? 'open' : ''}>
      <button type="button" className="close">×</button>
      <form onSubmit={handleSubmit}>
        <input 
          type="search" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="type keyword(s) here" 
          autoFocus
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
    </div>
  );
};

export default SearchPopup;


