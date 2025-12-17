# WordPress.org Plugin Submission Guide

This guide explains how to submit your Shopify Sidecart plugin to the official WordPress Plugin Directory.

## Why Submit to WordPress.org?

- **Automatic updates**: Users get updates directly in WordPress admin
- **Increased visibility**: Millions of WordPress users can discover your plugin
- **Trust factor**: Official directory adds credibility
- **Analytics**: Get download stats and user feedback
- **Free hosting**: WordPress.org hosts your plugin files

## Prerequisites

1. **WordPress.org account**: Create at [wordpress.org](https://wordpress.org)
2. **Plugin meets requirements**: Review [Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/)
3. **SVN client**: Install Subversion (SVN) on your computer
4. **Your plugin files**: Prepared with proper headers and readme.txt

## Step 1: Prepare Your Plugin

Your plugin should already have:

- ✅ Proper plugin header in `shopify-sidecart.php`
- ✅ `readme.txt` file in WordPress.org format
- ✅ GPL-compatible license (GPLv2 or later)
- ✅ No encoded/obfuscated code
- ✅ No premium/paid features requiring payment

**Checklist:**
- [ ] Plugin name is unique and descriptive
- [ ] Version number follows semantic versioning
- [ ] Requires/Tested up to fields are accurate
- [ ] No external dependencies that require payment
- [ ] All code is GPL-compatible
- [ ] No trademark violations

## Step 2: Apply for Plugin Review

1. Go to [WordPress Plugin Directory](https://wordpress.org/plugins/developers/add/)
2. Log in with your WordPress.org account
3. Fill out the submission form:
   - **Plugin Name**: Shopify Sidecart
   - **Plugin URL**: Link to your GitHub repository or website
   - **Description**: Brief description (2-3 sentences)
   - **Why you wrote the plugin**: Explain the purpose
   - **License**: GPLv2 or later
   - **Tags**: shopify, cart, ecommerce, sidecart
4. Submit the form

**Note**: Review process can take 2-10 days. You'll receive email notifications.

## Step 3: Set Up SVN Repository

Once approved, you'll get:

- SVN repository URL: `https://plugins.svn.wordpress.org/shopify-sidecart/`
- WordPress.org plugin page: `https://wordpress.org/plugins/shopify-sidecart/`

### Initial SVN Checkout

```bash
# Checkout the empty repository
svn checkout https://plugins.svn.wordpress.org/shopify-sidecart shopify-sidecart-svn

# Navigate to the directory
cd shopify-sidecart-svn

# Create standard directory structure
mkdir trunk
mkdir tags
mkdir branches

# Copy your plugin files to trunk
cp -r /path/to/your/plugin/* trunk/

# Add files to SVN
svn add trunk/*

# Commit initial version
svn commit -m "Initial commit of Shopify Sidecart v2.1.0"
```

## Step 4: Understand SVN Structure

```
shopify-sidecart-svn/
├── trunk/           # Development version
│   ├── shopify-sidecart.php
│   ├── readme.txt
│   ├── css/
│   ├── js/
│   └── includes/
├── tags/            # Released versions
│   └── 2.1.0/      # Copy of trunk for each release
└── branches/        # For major version branches (rarely used)
```

## Step 5: Make Your First Release

When ready to release version 2.1.0:

```bash
# Ensure trunk has the latest code
cd shopify-sidecart-svn

# Copy trunk to tags/2.1.0
svn copy trunk tags/2.1.0

# Commit the tag
svn commit -m "Tagging version 2.1.0"
```

**Important**: The `tags/2.1.0` directory should contain the exact files users will download.

## Step 6: Update Process

### For Minor Updates (bug fixes):
1. Make changes in `trunk/`
2. Update version in `trunk/shopify-sidecart.php` and `trunk/readme.txt`
3. Copy trunk to new tag (e.g., `tags/2.1.1`)
4. Commit changes

### For Major Updates (new features):
1. Create a branch if needed: `svn copy trunk branches/2.2`
2. Make changes in branch or trunk
3. When ready, copy to new tag (e.g., `tags/2.2.0`)
4. Merge changes back to trunk if needed

## Step 7: Plugin Page Management

After submission, you can:

1. **Edit plugin page**: Visit [https://wordpress.org/plugins/shopify-sidecart/](your plugin page) → "Admin" tab (when logged in)
2. **Add screenshots**: Upload to `/assets` directory in SVN
3. **Update banner/icon**: Add to `/assets` directory
4. **Respond to support forums**: Monitor your plugin's support forum

## Step 8: Best Practices

### Version Control
- Always update version numbers before tagging
- Use semantic versioning: MAJOR.MINOR.PATCH
- Keep `trunk` as development version
- Only tag stable, tested versions

### Readme.txt
- Keep it updated with each release
- Add screenshots in `/assets` directory
- Include comprehensive FAQ section
- Update changelog for every release

### Code Quality
- Follow [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- Use proper escaping and sanitization
- Include nonces for security
- Test with different WordPress versions

## Common Issues & Solutions

### 1. Plugin Rejected
- **Reason**: Code quality issues
- **Solution**: Review [Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/) and fix issues

### 2. SVN Conflicts
- **Solution**: Use `svn resolve` and communicate with other contributors

### 3. Update Not Showing
- **Check**: Version number in readme.txt "Stable tag" must match tag directory
- **Wait**: WordPress.org caches updates for 12-24 hours

### 4. Support Requests
- **Best practice**: Respond within 1-2 days
- **Be helpful**: Provide clear, polite responses
- **Document**: Add common solutions to FAQ

## Automation Options

### Using GitHub Actions
Create `.github/workflows/wordpress.org.yml`:

```yaml
name: Deploy to WordPress.org
on:
  release:
    types: [published]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: WordPress Plugin Deploy
      uses: 10up/action-wordpress-plugin-deploy@stable
      with:
        generate-zip: true
      env:
        SVN_PASSWORD: ${{ secrets.SVN_PASSWORD }}
        SVN_USERNAME: ${{ secrets.SVN_USERNAME }}
        SLUG: shopify-sidecart
```

### Using Deploy Script
Create a bash script to automate SVN operations.

## Resources

- [WordPress Plugin Developer Handbook](https://developer.wordpress.org/plugins/)
- [Plugin Submission FAQ](https://developer.wordpress.org/plugins/wordpress-org/plugin-submission-faq/)
- [SVN Quick Start Guide](https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/)
- [Support Forum Guidelines](https://developer.wordpress.org/plugins/wordpress-org/plugin-support-guidelines/)

## Timeline

1. **Submission**: 1-2 days for initial review
2. **Approval**: 2-10 days for plugin review
3. **First release**: Immediate after SVN setup
4. **Updates**: Appear in WordPress admin within 24 hours

## Final Notes

- **Be patient**: The review process ensures quality for all WordPress users
- **Stay engaged**: Monitor support forums and update regularly
- **Keep improving**: Regular updates show users you're actively maintaining the plugin
- **Backward compatibility**: Try to maintain compatibility with older WordPress versions

Once submitted and approved, your plugin will be available to millions of WordPress users with automatic update notifications!