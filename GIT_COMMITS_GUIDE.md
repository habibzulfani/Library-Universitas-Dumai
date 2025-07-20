# 📝 Git Commits Guide for E-Repository

This guide will help you remember the basic steps for making, updating, and pushing commits to your GitHub repository.

---

## 1. 🔄 Check Status
See which files have changed:
```bash
git status
```

---

## 2. ➕ Add Files to Commit
Add all changed files:
```bash
git add .
```
Or add specific files:
```bash
git add path/to/yourfile
```

---

## 3. 📝 Make a Commit
Write a clear commit message:
```bash
git commit -m "Your message here"
```
**Examples:**
- `git commit -m "Fix login bug on frontend"`
- `git commit -m "Add new book seeding script"`
- `git commit -m "Update README and deployment guide"`

---

## 4. ⬆️ Push to GitHub
Send your commits to the remote repository:
```bash
git push origin main
```

---

## 5. 🔄 Pull Latest Changes (Before You Start!)
Always pull the latest code before you start working:
```bash
git pull origin main
```

---

## 6. 🛠️ Common Workflow
1. `git pull origin main`  # Get latest code
2. Make your changes
3. `git status`            # See what changed
4. `git add .`             # Stage changes
5. `git commit -m "..."`  # Commit
6. `git push origin main`  # Push to GitHub

---

## 7. 💡 Tips
- Commit often, with clear messages.
- Pull before you start and before you push.
- If you get a conflict, resolve it, then add/commit/push again.
- Use `git log --oneline` to see commit history.

---

**For more advanced usage, see the official Git documentation: https://git-scm.com/doc** 