// This file helps resolve image paths in CSS
// In React, CSS files can't directly reference /images/ from public folder
// Images should be referenced using inline styles in components or moved to src/assets

export const getImagePath = (imageName) => {
  return '/images/' + imageName;
};


