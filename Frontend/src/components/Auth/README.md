# Authentication Components Documentation

This directory contains reusable authentication UI components for the OptionTrip application.

## 📦 Components Overview

### 1. **Input Component**
A fully-featured input field with validation, icons, and password visibility toggle.

#### Features:
- ✅ Built-in validation and error display
- ✅ Password visibility toggle
- ✅ Custom icons (left side)
- ✅ Focus states with animations
- ✅ Disabled state support
- ✅ Accessible (ARIA labels)
- ✅ Fully responsive

#### Usage Example:
```jsx
import Input from './components/Auth/Input';

<Input
  label="Email Address"
  type="email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  placeholder="Enter your email"
  required
  error={errors.email}
  autoComplete="email"
  icon={<EmailIcon />}
/>

// With password toggle
<Input
  label="Password"
  type="password"
  name="password"
  value={formData.password}
  onChange={handleChange}
  showPasswordToggle
  icon={<LockIcon />}
/>
```

#### Props:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Input label text |
| `type` | string | 'text' | Input type (text, email, password, tel, etc.) |
| `name` | string | - | Input name attribute |
| `value` | string | - | Input value |
| `onChange` | function | - | Change handler |
| `placeholder` | string | - | Placeholder text |
| `required` | boolean | false | Whether field is required |
| `error` | string | '' | Error message to display |
| `disabled` | boolean | false | Disable the input |
| `autoComplete` | string | - | Autocomplete attribute |
| `showPasswordToggle` | boolean | false | Show password visibility toggle |
| `icon` | ReactNode | null | Icon to display on the left |

---

### 2. **Button Component**
A versatile button component with multiple variants, sizes, and loading states.

#### Features:
- ✅ Multiple variants (primary, secondary, outline)
- ✅ Multiple sizes (small, medium, large)
- ✅ Loading state with spinner
- ✅ Disabled state
- ✅ Full width option
- ✅ Icon support (left/right)
- ✅ Smooth hover animations

#### Usage Example:
```jsx
import Button from './components/Auth/Button';

// Primary button
<Button
  type="submit"
  variant="primary"
  size="large"
  fullWidth
  loading={loading}
>
  Sign In
</Button>

// Secondary button with icon
<Button
  variant="secondary"
  icon={<GoogleIcon />}
  onClick={handleClick}
>
  Continue with Google
</Button>

// Outline button
<Button variant="outline" size="small">
  Cancel
</Button>
```

#### Props:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Button content |
| `type` | string | 'button' | Button type (button, submit) |
| `variant` | string | 'primary' | Button style (primary, secondary, outline) |
| `size` | string | 'medium' | Button size (small, medium, large) |
| `disabled` | boolean | false | Disable the button |
| `loading` | boolean | false | Show loading spinner |
| `fullWidth` | boolean | false | Make button full width |
| `onClick` | function | - | Click handler |
| `className` | string | '' | Additional CSS classes |
| `icon` | ReactNode | null | Icon element |
| `iconPosition` | string | 'left' | Icon position (left, right) |

---

### 3. **SocialButton Component**
Specialized buttons for OAuth social login providers (Google, Facebook, Twitter).

#### Features:
- ✅ Pre-styled for Google, Facebook, Twitter
- ✅ Provider-specific branding (colors, icons)
- ✅ Loading state
- ✅ Disabled state
- ✅ Hover animations
- ✅ Accessible

#### Usage Example:
```jsx
import SocialButton from './components/Auth/SocialButton';

<SocialButton
  provider="google"
  onClick={() => handleSocialLogin('google')}
/>

<SocialButton
  provider="facebook"
  onClick={() => handleSocialLogin('facebook')}
  loading={facebookLoading}
/>

<SocialButton
  provider="twitter"
  onClick={() => handleSocialLogin('twitter')}
  disabled={!isAvailable}
/>
```

#### Props:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `provider` | string | - | Provider name (google, facebook, twitter) |
| `onClick` | function | - | Click handler for OAuth flow |
| `disabled` | boolean | false | Disable the button |
| `loading` | boolean | false | Show loading spinner |

---

### 4. **Toast Component**
Notification component for displaying success, error, warning, and info messages.

#### Features:
- ✅ Multiple types (success, error, warning, info)
- ✅ Auto-dismiss with configurable duration
- ✅ Manual close button
- ✅ Smooth slide-in animation
- ✅ Icon based on type
- ✅ Responsive design

#### Usage Example:
```jsx
import Toast from './components/Auth/Toast';
import { useState } from 'react';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      {showToast && (
        <Toast
          message="Login successful!"
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

// Toast Container for multiple toasts
<div className="toast-container">
  <Toast type="success" message="Account created!" onClose={...} />
  <Toast type="error" message="Invalid credentials" onClose={...} />
</div>
```

#### Props:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | - | Toast message content |
| `type` | string | 'info' | Toast type (success, error, warning, info) |
| `duration` | number | 3000 | Auto-dismiss duration in ms (0 = no auto-dismiss) |
| `onClose` | function | - | Close handler |

---

## 🎨 Design System

### Colors
- **Primary (Pink)**: `#F30F89` - CTAs, primary actions
- **Secondary (Blue)**: `#0A539D` - Links, secondary actions
- **Dark**: `#122D46` - Headings, labels
- **Text**: `#596C7E` - Body text
- **Muted**: `#9FAAB6` - Placeholders, disabled text
- **Border**: `#C2CAD2` - Input borders, dividers
- **Error**: `#F30F89` - Error messages, validation
- **Success**: `#10B981` - Success messages

### Typography
- **Font Family**: Plus Jakarta Sans (from `--font-primary`)
- **Font Weights**:
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

### Border Radius
- Inputs/Buttons: `12px`
- Large Buttons: `14px`
- Small Buttons: `10px`
- Container: `24px`

### Spacing
- Small gap: `8px`
- Medium gap: `12px`
- Large gap: `16px`
- Section spacing: `24px-32px`

---

## 📱 Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 991px) { ... }

/* Mobile */
@media (max-width: 767px) { ... }

/* Small Mobile */
@media (max-width: 480px) { ... }
```

---

## ♿ Accessibility

All components include:
- Proper semantic HTML
- ARIA labels and attributes
- Keyboard navigation support
- Focus states
- Screen reader support
- Color contrast compliance (WCAG AA)

---

## 🔐 Form Validation Examples

### Email Validation
```javascript
if (!/\S+@\S+\.\S+/.test(email)) {
  errors.email = 'Please enter a valid email address';
}
```

### Password Validation
```javascript
// Minimum 8 characters with uppercase, lowercase, and number
if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
  errors.password = 'Password must contain uppercase, lowercase, and number';
}
```

### Phone Validation
```javascript
if (!/^\+?[\d\s-()]+$/.test(phone)) {
  errors.phone = 'Please enter a valid phone number';
}
```

---

## 🚀 Integration with Backend

### Ready for OAuth Integration

All social buttons are ready to integrate with OAuth providers:

```javascript
const handleSocialLogin = async (provider) => {
  try {
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/${provider}`;

    // Or use popup window
    const popup = window.open(
      `/api/auth/${provider}`,
      'oauth',
      'width=500,height=600'
    );
  } catch (error) {
    console.error('OAuth error:', error);
  }
};
```

### API Integration Example

```javascript
const handleLogin = async (formData) => {
  setLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      // Store token
      localStorage.setItem('token', data.token);
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      setErrors({ general: data.message });
    }
  } catch (error) {
    setErrors({ general: 'Network error. Please try again.' });
  } finally {
    setLoading(false);
  }
};
```

---

## 📂 File Structure

```
Frontend/src/components/Auth/
├── Input.jsx              # Input component
├── Input.css              # Input styles
├── Button.jsx             # Button component
├── Button.css             # Button styles
├── SocialButton.jsx       # Social login buttons
├── SocialButton.css       # Social button styles
├── Toast.jsx              # Toast notifications
├── Toast.css              # Toast styles
└── README.md              # This file

Frontend/src/pages/
├── Login/
│   ├── Login.jsx          # Login page
│   └── Login.css          # Login page styles
└── Signup/
    ├── Signup.jsx         # Signup page
    └── Signup.css         # Signup page styles
```

---

## 🎯 Next Steps

1. **Backend Integration**: Connect forms to your authentication API
2. **OAuth Setup**: Configure OAuth providers (Google, Facebook, Twitter)
3. **Email Verification**: Add email verification flow
4. **Forgot Password**: Create forgot password page
5. **Protected Routes**: Implement route guards for authenticated pages
6. **Session Management**: Add token refresh logic
7. **User Profile**: Create user profile/settings page

---

## 🐛 Troubleshooting

### Issue: Icons not showing
**Solution**: Ensure Font Awesome or your icon library is properly imported in `index.html` or main CSS file.

### Issue: Styles not applying
**Solution**: Check that CSS files are imported in the correct order and that CSS custom properties are defined in your root stylesheet.

### Issue: Forms not submitting
**Solution**: Verify that the `onSubmit` handler includes `e.preventDefault()` and all validation passes before submission.

---

## 📝 License

Part of the OptionTrip project. All rights reserved.
