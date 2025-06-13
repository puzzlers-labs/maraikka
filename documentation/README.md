# Maraikka Documentation

This directory contains the complete documentation for Maraikka, built with [Nextra](https://nextra.site/) - a modern documentation framework based on Next.js.

## 📚 Documentation Structure

### Core Documentation
- **[Introduction](pages/index.mdx)** - Overview and key features
- **[Installation](pages/installation.mdx)** - Platform-specific installation guides
- **[Getting Started](pages/getting-started.mdx)** - Quick start guide for new users
- **[User Guide](pages/user-guide/)** - Comprehensive user documentation
- **[Features](pages/features/)** - Detailed feature explanations
- **[Security](pages/security.mdx)** - Security best practices and technical details
- **[Troubleshooting](pages/troubleshooting.mdx)** - Common issues and solutions
- **[Development](pages/development.mdx)** - Developer contribution guide
- **[API Reference](pages/api.mdx)** - Internal API documentation

### User Guide Sections
- **Interface Guide** - Master the Maraikka interface
- **File Encryption** - Secure individual files and directories
- **File Decryption** - Safely restore encrypted data
- **File Preview** - Preview files without permanent decryption
- **Text Editor** - Edit text files with encryption support
- **Image Editor** - Annotate and edit images
- **Settings & Preferences** - Customize Maraikka
- **Keyboard Shortcuts** - Work faster with shortcuts

### Features Documentation
- **AES Encryption** - Military-grade security details
- **File Explorer** - Intuitive file management
- **File Preview** - Multi-format preview system
- **Text Editor** - Built-in text editing capabilities
- **Image Editor** - Image annotation and editing
- **Hardware Authentication** - FIDO2/WebAuthn support (Premium)
- **Multi-language Support** - Internationalization features
- **Cross-Platform** - Platform-specific optimizations
- **Auto Updates** - Seamless update system

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16 or higher
- **npm** or **yarn**

### Setup
```bash
# Navigate to documentation directory
cd documentation

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development Server
The development server will start at `http://localhost:3000` with:
- **Hot reload** for instant updates
- **Search functionality** built-in
- **Dark/light theme** support
- **Mobile responsive** design

## 🎨 Customization

### Theme Configuration
The documentation theme is configured in `theme.config.js`:

```javascript
export default {
  github: "https://github.com/maraikka-labs/maraikka-app",
  docsRepositoryBase: "https://github.com/maraikka-labs/maraikka-app/blob/main/documentation",
  titleSuffix: " – Maraikka",
  logo: (
    <>
      <span className="mr-2 font-extrabold hidden md:inline">🔒 Maraikka</span>
      <span className="text-gray-600 font-normal hidden md:inline">
        Secure File Encryption
      </span>
    </>
  ),
  primaryHue: 262, // Violet color for Maraikka branding
  primarySaturation: 83,
}
```

### Navigation Structure
Navigation is controlled by `meta.json` files in each directory:

```json
{
  "index": "Introduction",
  "installation": "Installation", 
  "getting-started": "Getting Started",
  "user-guide": "User Guide",
  "features": "Features",
  "security": "Security",
  "troubleshooting": "Troubleshooting",
  "development": "Development",
  "api": "API Reference"
}
```

## 📝 Content Guidelines

### Writing Style
- **Clear and concise** - Use simple, understandable English
- **Step-by-step instructions** - Break down complex processes
- **Visual aids** - Include screenshots and GIFs where helpful
- **Code examples** - Provide practical examples for developers
- **Cross-references** - Link to related sections

### Markdown Features
The documentation supports enhanced Markdown with:

#### Callouts
```markdown
> [!NOTE]
> This is a note callout

> [!TIP] 
> This is a tip callout

> [!WARNING]
> This is a warning callout
```

#### Code Blocks with Syntax Highlighting
```javascript
// JavaScript example
const encryptFile = async (filePath, password) => {
  // Implementation here
};
```

#### Tables
```markdown
| Feature | Free | Premium |
|---------|------|---------|
| AES Encryption | ✅ | ✅ |
| Hardware Auth | ❌ | ✅ |
```

#### Images
```markdown
![Alt text](/images/screenshot.png)
```

## 🖼️ Images and Media

### Image Directory
All images are stored in `public/images/` with the following structure:

```
public/images/
├── main-interface.png      # Main app interface
├── password-modal.png      # Password entry modal
├── encryption-progress.png # Progress indicators
├── encrypt-file.gif        # Encryption workflow
└── README.md              # Image guidelines
```

### Image Guidelines
- **Format**: PNG for screenshots, GIF for animations
- **Size**: Max 1200px width, under 500KB
- **Naming**: Use kebab-case (e.g., `main-interface.png`)
- **Optimization**: Compress images for web delivery

### Missing Images
Currently, image references are placeholders. To complete the documentation:

1. **Take screenshots** of Maraikka in action
2. **Create animated GIFs** of key workflows  
3. **Optimize images** for web delivery
4. **Replace placeholder references** with actual files

## 🌍 Internationalization

### Current Status
The documentation is currently in **English only**. The Maraikka app supports multiple languages:
- **English** (en) - Primary language
- **Spanish** (es) - Full translation
- **Hindi** (hi) - Devanagari script
- **Japanese** (ja) - Complete localization

### Future Internationalization
To add multi-language support to the documentation:

1. **Install i18n plugin** for Nextra
2. **Create language directories** (e.g., `pages/es/`, `pages/hi/`)
3. **Translate content** maintaining structure
4. **Update navigation** for language switching

## 🔧 Development

### File Structure
```
documentation/
├── pages/                  # Documentation pages
│   ├── index.mdx          # Homepage
│   ├── installation.mdx   # Installation guide
│   ├── user-guide/        # User guide section
│   ├── features/          # Features section
│   └── meta.json          # Navigation config
├── public/                # Static assets
│   └── images/            # Documentation images
├── theme.config.js        # Theme configuration
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

### Adding New Pages
1. **Create MDX file** in appropriate directory
2. **Update meta.json** to include in navigation
3. **Add cross-references** from related pages
4. **Include images** if needed
5. **Test locally** before committing

### Content Updates
When updating Maraikka features:
1. **Update relevant documentation** sections
2. **Add new screenshots** if UI changed
3. **Update API reference** if APIs changed
4. **Check all cross-references** are still valid

## 📦 Deployment

### Build Process
```bash
# Build static site
npm run build

# Output will be in .next/ directory
# Deploy to any static hosting service
```

### Hosting Options
- **Vercel** (recommended) - Automatic deployments from Git
- **Netlify** - Static site hosting with forms
- **GitHub Pages** - Free hosting for open source
- **Custom server** - Deploy anywhere that serves static files

### Automatic Deployment
Set up automatic deployment by:
1. **Connect repository** to hosting service
2. **Configure build command**: `npm run build`
3. **Set output directory**: `.next`
4. **Enable automatic deployments** on push to main branch

## 🤝 Contributing

### Documentation Contributions
We welcome contributions to improve the documentation:

1. **Fork the repository**
2. **Create a feature branch** for your changes
3. **Make your improvements**:
   - Fix typos or unclear explanations
   - Add missing information
   - Improve examples and code snippets
   - Add screenshots or diagrams
4. **Test locally** to ensure everything works
5. **Submit a pull request** with clear description

### Content Guidelines for Contributors
- **Follow existing style** and structure
- **Use clear, simple language** 
- **Include practical examples**
- **Add screenshots** for UI-related content
- **Update navigation** if adding new sections
- **Test all links** and references

### Review Process
All documentation changes go through review:
1. **Automated checks** for broken links and formatting
2. **Content review** for accuracy and clarity
3. **Technical review** for code examples and APIs
4. **Final approval** and merge

## 📞 Support

### Documentation Issues
If you find issues with the documentation:
- **[Open an issue](https://github.com/maraikka-labs/maraikka-app/issues)** on GitHub
- **Use the "documentation" label** for easy categorization
- **Provide specific details** about the problem
- **Suggest improvements** if you have ideas

### Questions and Feedback
- **[GitHub Discussions](https://github.com/maraikka-labs/maraikka-app/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/maraikka-labs/maraikka-app/issues)** - Report problems
- **Email**: documentation@maraikka.com

---

**Ready to explore?** Start with the [Introduction](pages/index.mdx) or jump to any section that interests you! 🚀
