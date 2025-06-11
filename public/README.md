# Maraikka Website

This is the official website for Maraikka, a secure file encryption application with hardware authentication support.

## Features Showcased

- **Enterprise-grade file encryption** with AES-256 encryption
- **Hardware authentication** support (YubiKey, Touch ID, Windows Hello)
- **Secure file preview** with in-memory decryption
- **Bulk operations** for directory-level encryption/decryption
- **Cross-platform support** (macOS, Windows, Linux)
- **Zero-trust architecture** with no unencrypted file storage

## Technology Stack

- **HTML5** - Semantic markup
- **Tailwind CSS v4** - Utility-first CSS framework
- **Alpine.js** - Lightweight JavaScript framework for interactivity
- **Responsive Design** - Mobile-first approach

## File Structure

```
public/
├── index.html          # Main homepage
├── style.css          # Tailwind CSS styles
├── images/            # Image assets
├── js/                # JavaScript files
│   └── vendors/       # Third-party libraries
│       └── alpinejs.min.js
└── css/               # Additional stylesheets
```

## Features

### Interactive Elements
- Tabbed feature showcase with smooth transitions
- Responsive navigation
- Hover effects and animations
- Mobile-optimized design

### Design Highlights
- Modern gradient backgrounds
- Professional color scheme (violet/purple primary)
- Clean typography with Inter font family
- Glassmorphism effects
- Smooth animations and transitions

## Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

To view the website locally:

1. Open `index.html` in a modern web browser
2. Or serve with a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

## License

This website is part of the Maraikka project. See the main project repository for license information. 