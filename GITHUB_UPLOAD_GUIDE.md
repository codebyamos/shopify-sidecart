# GitHub Upload Guide for Shopify Sidecart Plugin

This guide will walk you through uploading your Shopify Sidecart plugin to GitHub and setting it up for automatic updates.

## Prerequisites

1. **GitHub Account**: Create one at [github.com](https://github.com)
2. **Git installed** on your computer
3. **Your plugin files** (the current directory)

## Step 1: Create a New Repository on GitHub

1. Log in to GitHub
2. Click the "+" icon in the top right and select "New repository"
3. Fill in the repository details:
   - **Repository name**: `shopify-sidecart` (or your preferred name)
   - **Description**: "Shopify Sidecart WordPress Plugin"
   - **Visibility**: Public (recommended for open source) or Private
   - **Initialize with README**: Uncheck (we already have one)
   - **Add .gitignore**: Select "WordPress"
   - **License**: Select "GNU General Public License v3.0" or similar
4. Click "Create repository"

## Step 2: Prepare Your Local Files

Make sure your plugin directory contains all necessary files:

```
shopify-sidecart/
├── shopify-sidecart.php      # Main plugin file
├── README.md                 # GitHub README
├── readme.txt               # WordPress.org README
├── LICENSE                  # GPL License
├── GITHUB_UPLOAD_GUIDE.md   # This file
├── css/
│   └── sidecart.css        # Styles
├── js/
│   ├── sidecart.js         # Main JavaScript
│   ├── product-buy-box.js  # Buy box rendering
│   └── init-buy-boxes.js   # Initialization
└── includes/
    └── updater.php         # GitHub update checker
```

## Step 3: Initialize Git Repository

Open terminal/command prompt in your plugin directory:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: Shopify Sidecart v2.1.0"

# Add GitHub as remote repository
git remote add origin https://github.com/YOUR_USERNAME/shopify-sidecart.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Configure GitHub Updater

Edit the `includes/updater.php` file to match your GitHub repository:

1. Open `includes/updater.php`
2. Update lines 18-19 with your GitHub username and repository:
   ```php
   private $owner = 'YOUR_GITHUB_USERNAME';
   private $repo = 'shopify-sidecart';
   ```
3. Also update the Plugin URI in `shopify-sidecart.php`:
   ```php
   Plugin URI: https://github.com/YOUR_USERNAME/shopify-sidecart
   ```

## Step 5: Create Your First Release

Releases on GitHub trigger update notifications in WordPress.

### Via GitHub Website:
1. Go to your repository on GitHub
2. Click "Releases" in the right sidebar
3. Click "Create a new release"
4. Fill in:
   - **Tag version**: `v2.1.0` (follow semantic versioning)
   - **Release title**: "Shopify Sidecart v2.1.0"
   - **Description**: Copy from changelog in readme.txt
   - **Attach binaries**: Drag and drop your plugin ZIP file
5. Click "Publish release"

### Creating a ZIP File:
You can create a ZIP of your plugin:
```bash
# On macOS/Linux
zip -r shopify-sidecart-v2.1.0.zip . -x "*.git*" "*.DS_Store"

# On Windows, use compression tool or PowerShell:
Compress-Archive -Path * -DestinationPath shopify-sidecart-v2.1.0.zip -Exclude "*.git*"
```

## Step 6: Test the Update Mechanism

1. Install the plugin on a test WordPress site
2. Wait a few minutes for the update check
3. Go to WordPress Admin → Dashboard → Updates
4. You should see an update available if you created a newer release

## Step 7: Set Up GitHub Actions (Optional)

Create a `.github/workflows/release.yml` file to automate releases:

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Create ZIP
      run: |
        zip -r shopify-sidecart-${{ github.ref_name }}.zip . -x "*.git*" "*.github*"
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: shopify-sidecart-${{ github.ref_name }}.zip
        generate_release_notes: true
```

## Step 8: Update Workflow

When you make changes to the plugin:

1. **Update version numbers** in:
   - `shopify-sidecart.php` (Version: x.x.x)
   - `readme.txt` (Stable tag: x.x.x)
   
2. **Update changelog** in `readme.txt`

3. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Brief description of changes"
   git push origin main
   ```

4. **Create a new release** with updated version tag

## Troubleshooting

### Updates Not Showing
- Check that the GitHub repository is public
- Verify version numbers match (GitHub tag vs plugin version)
- Check WordPress debug.log for update errors
- Clear transients: `wp transient delete --all` (if using WP-CLI)

### ZIP File Issues
- Ensure ZIP contains plugin folder, not loose files
- Test ZIP manually installs in WordPress

### GitHub API Rate Limits
- GitHub has API rate limits (60 requests/hour for unauthenticated)
- Consider adding a personal access token for higher limits

## Next Steps

1. **Add contributors**: Invite team members to collaborate
2. **Set up issues template**: Help users report bugs
3. **Add CI/CD**: Automate testing and deployment
4. **Create wiki**: Detailed documentation

## Resources

- [GitHub Documentation](https://docs.github.com)
- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [Semantic Versioning](https://semver.org)

---

**Note**: Remember to replace `YOUR_USERNAME` and `YOUR_GITHUB_USERNAME` with your actual GitHub username throughout the files.