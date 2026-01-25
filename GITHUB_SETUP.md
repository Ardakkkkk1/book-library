# GitHub Setup Guide for Book Library

## Quick Start

### 1. Create GitHub Repository

**Option A: Via GitHub Website**
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `book-library`
3. Description: "Full-stack Book Library app with Node.js, Express, and MongoDB"
4. Choose: **Public** (for deployment and demonstration)
5. ✅ Do NOT initialize with README (we have one)
6. Click "Create repository"

**Option B: Via GitHub CLI**
```bash
gh repo create book-library --public --source=. --remote=origin --push
```

---

### 2. Initialize Git in Your Project

```bash
cd c:\Users\ардак\Desktop\book-library

# Initialize git if not already done
git init

# Configure git (one time)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check status
git status
```

---

### 3. Add All Files and Create First Commit

```bash
# Add all files (except .env and node_modules - they're in .gitignore)
git add .

# Verify what will be committed
git status

# Create first commit
git commit -m "Initial commit: Full-stack Book Library app with CRUD operations"

# Rename branch to main (GitHub standard)
git branch -M main
```

---

### 4. Connect to GitHub and Push

```bash
# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/book-library.git

# Push to GitHub
git push -u origin main
```

---

### 5. Verify on GitHub

1. Go to `https://github.com/YOUR_USERNAME/book-library`
2. You should see all your files
3. You should see the commit message

---

## 📋 What Gets Pushed to GitHub

✅ **Will be pushed:**
- All source code files (.js, .html, .css)
- package.json and package-lock.json
- README.md
- .gitignore
- .env.example (template only!)

❌ **Will NOT be pushed (due to .gitignore):**
- `node_modules/` folder
- `.env` file (with secrets)
- `.vscode/` settings
- System files

---

## 🔄 Regular Development Workflow

### After making changes:

```bash
# See what changed
git status

# Add changes
git add .

# Commit with meaningful message
git commit -m "Add edit book functionality" 

# Push to GitHub
git push origin main
```

---

## 📝 Good Commit Messages

**Avoid:**
- ❌ "update"
- ❌ "fix bug"
- ❌ "asdf"

**Use:**
- ✅ "Add book validation on frontend"
- ✅ "Fix MongoDB connection error"
- ✅ "Deploy to Render with environment variables"
- ✅ "Add responsive CSS styling"

---

## 🌐 Set Up for Deployment

### For Render.com:
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Go to Dashboard → "New" → "Web Service"
4. Select your GitHub repository
5. Configure and deploy (see README.md for details)

### For Railway.app:
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Configure environment variables
5. Deploy

### For Heroku:
1. Install Heroku CLI
2. `heroku login`
3. `heroku create book-library-YOUR-NAME`
4. `git push heroku main`

---

## 🔒 Security Checklist

Before pushing to GitHub:

- ✅ Check `.gitignore` includes `.env`
- ✅ `.env` file is NOT in git (run `git ls-files | grep .env`)
- ✅ No hardcoded passwords or API keys in code
- ✅ `.env.example` exists (for reference)
- ✅ `package-lock.json` is committed (for reproducibility)
- ✅ `node_modules/` is in `.gitignore`

**Verify:**
```bash
# Make sure .env is ignored
git check-ignore .env
# Should output: .env

# Make sure node_modules is ignored
git check-ignore node_modules/
# Should output: node_modules/
```

---

## 📊 View Repository Statistics

After pushing to GitHub, you can see:
- **Commits** - Each change you made
- **Code** - Files in the repository
- **Issues** - Track bugs and features
- **Pull Requests** - Collaboration
- **Insights** - Code frequency, contributors

---

## 🚀 GitHub Pages (Optional)

To create a project website:

1. Go to Repository Settings
2. Scroll to "GitHub Pages"
3. Select main branch as source
4. Your site is at: `https://YOUR_USERNAME.github.io/book-library`

---

## 🔗 Share Your Project

After deploying to Render/Railway/Heroku, share these links:

**For defense/demonstration:**
- Public URL: `https://book-library-xxx.onrender.com`
- GitHub Repository: `https://github.com/YOUR_USERNAME/book-library`

---

## ❓ Troubleshooting

### I pushed .env by mistake

```bash
# Remove .env from git (but keep it locally)
git rm --cached .env

# Update commit
git commit -m "Remove .env file from git (secrets)"

# Push
git push origin main

# ⚠️ Change your secrets - they're exposed!
```

### Large node_modules appeared in git

```bash
# Remove node_modules
git rm -r --cached node_modules/

# Make sure .gitignore has it
echo "node_modules/" >> .gitignore

# Commit
git commit -m "Remove node_modules from git"

# Push
git push origin main
```

### Want to undo last commit

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Or undo and discard changes
git reset --hard HEAD~1
```

---

## 📚 Resources

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://git-scm.com/download/win)
- [GitHub Desktop](https://desktop.github.com) (GUI alternative)

---

**Ready to push? Run this:**

```bash
cd c:\Users\ардак\Desktop\book-library
git status
git add .
git commit -m "Initial commit: Full-stack Book Library app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/book-library.git
git push -u origin main
```

Then go to GitHub and verify! 🚀
