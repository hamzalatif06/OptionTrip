# Setup Guide - Copy Assets

## Quick Setup Script

### For Windows (PowerShell)

Run these commands in PowerShell from the project root:

```powershell
# Create directories
New-Item -ItemType Directory -Force -Path "public\images"
New-Item -ItemType Directory -Force -Path "src\styles"
New-Item -ItemType Directory -Force -Path "src\fonts"

# Copy images
Copy-Item -Path "htmldesigntemplates.com\html\travelin\images\*" -Destination "public\images\" -Recurse -Force

# Copy CSS files
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\bootstrap.min.css" -Destination "src\styles\" -Force
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\plugin.css" -Destination "src\styles\" -Force
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\fontawesome.min.css" -Destination "src\styles\" -Force
Copy-Item -Path "htmldesigntemplates.com\html\travelin\css\style.css" -Destination "src\styles\" -Force

# Copy fonts
Copy-Item -Path "htmldesigntemplates.com\html\travelin\fonts\*" -Destination "src\fonts\" -Recurse -Force
```

### For Linux/Mac (Bash)

Run these commands in terminal from the project root:

```bash
# Create directories
mkdir -p public/images
mkdir -p src/styles
mkdir -p src/fonts

# Copy images
cp -r htmldesigntemplates.com/html/travelin/images/* public/images/

# Copy CSS files
cp htmldesigntemplates.com/html/travelin/css/bootstrap.min.css src/styles/
cp htmldesigntemplates.com/html/travelin/css/plugin.css src/styles/
cp htmldesigntemplates.com/html/travelin/css/fontawesome.min.css src/styles/
cp htmldesigntemplates.com/html/travelin/css/style.css src/styles/

# Copy fonts
cp -r htmldesigntemplates.com/html/travelin/fonts/* src/fonts/
```

## After Copying Assets

1. Update `src/styles/main.css` to import the full `style.css`:

```css
@import url('./style.css');
```

Or replace the simplified version with the full CSS file.

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

## Important Notes

- Make sure all image paths in components use `/images/` (relative to public folder)
- The full `style.css` file is large (~7000+ lines) - you may want to use it instead of the simplified version
- Font files should be in `src/fonts/` and referenced correctly in `line-icons.css`
- Some JavaScript functionality (sliders, modals) may need additional React libraries


