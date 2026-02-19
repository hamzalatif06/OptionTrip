# OptionTrip - Travel Tour Booking React Application

This is a React.js conversion of the OptionTrip Travel Tour Booking HTML template. The application maintains the original design and functionality while using modern React components and structure.

## Project Structure

```
OptionTrip/
├── public/
│   ├── index.html
│   └── images/          # Copy all images from htmldesigntemplates.com/html/travelin/images/
│   └── fonts/           # Copy fonts from htmldesigntemplates.com/html/travelin/fonts/
├── src/
│   ├── components/
│   │   ├── Header/
│   │   ├── Banner/
│   │   ├── AboutUs/
│   │   ├── TopDestinations/
│   │   ├── AboutSection/
│   │   ├── BestTours/
│   │   ├── LastMinuteDeals/
│   │   ├── DiscountAction/
│   │   ├── OfferPackages/
│   │   ├── OurTeam/
│   │   ├── Testimonials/
│   │   ├── Partners/
│   │   ├── RecentArticles/
│   │   ├── Footer/
│   │   ├── Preloader/
│   │   ├── SearchPopup/
│   │   ├── LoginModal/
│   │   └── BackToTop/
│   ├── styles/
│   │   ├── main.css
│   │   ├── bootstrap.min.css      # Copy from original template
│   │   ├── plugin.css             # Copy from original template
│   │   └── fontawesome.min.css    # Copy from original template
│   ├── fonts/
│   │   └── line-icons.css         # Copy from original template
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Copy Assets

You need to copy the following assets from the original template:

#### Images
Copy all images from `htmldesigntemplates.com/html/travelin/images/` to `public/images/`

```bash
# Windows PowerShell
Copy-Item -Path "htmldesigntemplates.com\html\travelin\images\*" -Destination "public\images\" -Recurse

# Linux/Mac
cp -r htmldesigntemplates.com/html/travelin/images/* public/images/
```

#### CSS Files
Copy CSS files from `htmldesigntemplates.com/html/travelin/css/` to `src/styles/`:

- `bootstrap.min.css`
- `plugin.css`
- `fontawesome.min.css`

```bash
# Windows PowerShell
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\bootstrap.min.css" -Destination "src\styles\"
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\plugin.css" -Destination "src\styles\"
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\fontawesome.min.css" -Destination "src\styles\"

# Linux/Mac
cp htmldesigntemplates.com/html/travelin/css/bootstrap.min.css src/styles/
cp htmldesigntemplates.com/html/travelin/css/plugin.css src/styles/
cp htmldesigntemplates.com/html/travelin/css/fontawesome.min.css src/styles/
```

#### Fonts
Copy fonts from `htmldesigntemplates.com/html/travelin/fonts/` to `src/fonts/`:

```bash
# Windows PowerShell
Copy-Item -Path "htmldesigntemplates.com\html\travelin\fonts\*" -Destination "src\fonts\" -Recurse

# Linux/Mac
cp -r htmldesigntemplates.com/html/travelin/fonts/* src/fonts/
```

### 3. Update CSS Imports

After copying the CSS files, update `src/styles/main.css` to ensure all imports are correct. The file should reference:

- `./bootstrap.min.css`
- `./plugin.css`
- `./fontawesome.min.css`
- `../fonts/line-icons.css`

### 4. Run the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Features

- ✅ Responsive design maintained from original template
- ✅ All sections converted to React components
- ✅ Search functionality
- ✅ Login/Register modal
- ✅ Back to top button
- ✅ Preloader
- ✅ Form handling with React state
- ✅ Component-based architecture

## Components

### Main Components

1. **Header** - Navigation bar with menu and social links
2. **Banner** - Hero section with search form and categories
3. **AboutUs** - 3-step process section
4. **TopDestinations** - Featured destinations grid
5. **AboutSection** - About us with statistics
6. **BestTours** - Featured tour packages
7. **LastMinuteDeals** - Special deals section
8. **DiscountAction** - Call-to-action with video button
9. **OfferPackages** - Special offers with discounts
10. **OurTeam** - Team members showcase
11. **Testimonials** - Customer reviews
12. **Partners** - Partner logos
13. **RecentArticles** - Blog posts
14. **Footer** - Footer with links and newsletter

### Utility Components

- **Preloader** - Loading screen
- **SearchPopup** - Search overlay
- **LoginModal** - Login/Register modal
- **BackToTop** - Scroll to top button

## Customization

### Updating Content

Each component has its data defined within the component file. You can modify:

- Tour packages in `BestTours.js`
- Destinations in `TopDestinations.js`
- Team members in `OurTeam.js`
- Testimonials in `Testimonials.js`
- Articles in `RecentArticles.js`

### Styling

The main styles are in `src/styles/main.css`. For complete styling, ensure all CSS files from the original template are copied to `src/styles/`.

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Notes

- The original template uses jQuery and Bootstrap JavaScript. Some interactive features may need additional JavaScript libraries or React equivalents.
- For sliders and carousels, you may want to add libraries like `react-slick` or `swiper` for React.
- The modal functionality uses Bootstrap classes but can be enhanced with React state management.
- All image paths are relative to the `public` folder (e.g., `/images/logo.png`).

## Dependencies

- React 18.2.0
- React DOM 18.2.0
- React Router DOM 6.20.0 (for future routing if needed)
- React Scripts 5.0.1

## License

This is a converted version of the OptionTrip template. Please refer to the original template's license for usage rights.

