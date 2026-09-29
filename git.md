# 🔀 Git Collaboration Manual

> **Repository:** [MarineVisionAI](https://github.com/ANAND-JATOTHU/MarineVisionAI.git)  
> **Default Branch:** `main` (protected — PR-only)  
> **Lead's Branch:** `anand` (staging/integration)  
> **Last Updated:** 2026-09-29

---

## 1. Repository Setup (First-Time Only)

### 1.1 Clone the Repository

```bash
git clone https://github.com/ANAND-JATOTHU/MarineVisionAI.git
cd MarineVisionAI
```

### 1.2 Configure Your Identity

```bash
git config user.name "Your Full Name"
git config user.email "your.email@example.com"
```

### 1.3 Verify Remote

```bash
git remote -v
# Expected output:
# origin  https://github.com/ANAND-JATOTHU/MarineVisionAI.git (fetch)
# origin  https://github.com/ANAND-JATOTHU/MarineVisionAI.git (push)
```

---

## 2. Branch Protection Rules (Active on GitHub)

The `main` branch has the following **active ruleset** (ID: 23988093) enforced by GitHub:

| Rule | What It Means |
|---|---|
| 🔒 **No Direct Push** | You CANNOT `git push origin main`. All changes require a Pull Request. |
| 🔒 **No Force Push** | `git push --force origin main` is blocked. History cannot be rewritten. |
| 🔒 **No Branch Deletion** | The `main` branch cannot be deleted. |
| ✅ **Pull Request Required** | Every change to `main` must go through a GitHub Pull Request, even for the Team Lead. |

> ⚠️ **If you try to push directly to `main`, Git will reject your push with a remote error.** This is expected behavior — follow the PR workflow below.

---

## 3. Branch Naming Convention

### Strict Naming Rule

```
feature/<member-name>-<task-description>
```

### Examples by Team Member

| Member | Branch Name Example |
|---|---|
| **Lead (Anand)** | `feature/anand-yolo-training` |
| **Member 1 (DSP)** | `feature/dsp-xtf-parser` |
| **Member 1 (DSP)** | `feature/dsp-clahe-normalization` |
| **Member 2 (Backend)** | `feature/backend-sqlite-schema` |
| **Member 2 (Backend)** | `feature/backend-rest-endpoints` |
| **Member 3 (Frontend)** | `feature/frontend-leaflet-map` |
| **Member 3 (Frontend)** | `feature/frontend-detection-cards` |
| **Member 4 (Edge)** | `feature/edge-dockerfile` |
| **Member 4 (Edge)** | `feature/edge-fps-benchmark` |
| **Member 5 (Support)** | `feature/support-readme-update` |

### ❌ Forbidden Branch Names

```
main              ← Protected, never work on this directly
master            ← Not used in this repo
dev               ← Ambiguous ownership
hotfix/emergency  ← Only Lead may create hotfix branches
```

---

## 4. Daily Workflow — Step by Step

### Step 1: Sync with Latest `main`

**Always start your day by pulling the latest `main`:**

```bash
# Switch to main and pull latest changes
git checkout main
git pull origin main
```

### Step 2: Create or Switch to Your Feature Branch

**Creating a new branch:**

```bash
git checkout -b feature/your-name-task-description
```

**Switching to an existing branch:**

```bash
git checkout feature/your-name-task-description
```

**Rebasing your existing branch onto latest main (recommended):**

```bash
git checkout feature/your-name-task-description
git rebase main
```

### Step 3: Make Your Changes

Edit files **only** within your assigned directory:

| Member | Allowed Directory |
|---|---|
| Lead | `marine_vision/model_training/` |
| Member 1 | `marine_vision/backend/core/dsp/` |
| Member 2 | `marine_vision/backend/db/` + `marine_vision/backend/api/` |
| Member 3 | `marine_vision/frontend/` |
| Member 4 | `marine_vision/edge_tests/` |

### Step 4: Stage Your Changes

```bash
# Check what files you've changed
git status

# Stage specific files (RECOMMENDED — be precise)
git add marine_vision/backend/core/dsp/parser.py
git add marine_vision/backend/core/dsp/preprocessor.py

# Or stage all changes in your directory only
git add marine_vision/backend/core/dsp/
```

> ⚠️ **NEVER run `git add .` from the repository root** unless you're absolutely sure no files outside your directory were modified.

### Step 5: Commit with a Descriptive Message

```bash
git commit -m "feat(dsp): implement pyxtf parser with telemetry extraction"
```

**Commit message format:**

```
<type>(<scope>): <short description>

Types: feat, fix, docs, test, refactor, style, chore
Scope: dsp, backend, frontend, edge, model, docs
```

**Good examples:**

```bash
git commit -m "feat(dsp): add Lee filter despeckling with 5x5 kernel"
git commit -m "fix(api): correct bounding box coordinate order [xmin,ymin,xmax,ymax]"
git commit -m "feat(frontend): implement dark oceanic command center theme"
git commit -m "test(edge): add offline network audit verifying zero external calls"
git commit -m "docs(readme): add Jetson Orin Nano deployment instructions"
```

**Bad examples:**

```bash
git commit -m "update"           # ❌ No context
git commit -m "fixed stuff"      # ❌ Vague
git commit -m "WIP"              # ❌ Incomplete work shouldn't be committed
```

### Step 6: Push Your Branch to GitHub

```bash
git push origin feature/your-name-task-description
```

**First push of a new branch:**

```bash
git push -u origin feature/your-name-task-description
```

### Step 7: Create a Pull Request on GitHub

1. Go to: **https://github.com/ANAND-JATOTHU/MarineVisionAI/pulls**
2. Click **"New Pull Request"**
3. Set:
   - **Base:** `main`
   - **Compare:** `feature/your-name-task-description`
4. Write a clear PR description:

```markdown
## Summary
Implemented pyxtf sonar log parser with INS telemetry extraction.

## Changes
- Added `parser.py` with `.xtf` parsing using pyxtf library
- Extracts waterfall matrix (2D NumPy array) from sonar channel data
- Parses navigation headers for GPS, pitch, roll, heave
- Flags motion dropout pings based on attitude spike thresholds

## Testing
- [x] Unit tests pass (`pytest marine_vision/backend/core/dsp/tests/`)
- [x] Tested with sample .xtf file from `sample_data/`

## Files Changed
- `marine_vision/backend/core/dsp/parser.py` (new)
- `marine_vision/backend/core/dsp/tests/test_parser.py` (new)
```

5. Click **"Create Pull Request"**
6. **Tag the Team Lead** for review

### Step 8: Wait for Review & Merge

- The **Team Lead** will review your PR.
- If changes are requested, make them on your branch and push again:

```bash
# Make requested changes
git add marine_vision/backend/core/dsp/parser.py
git commit -m "fix(dsp): address PR feedback — handle empty ping arrays"
git push origin feature/your-name-task-description
```

- The PR will automatically update with your new commits.
- Once approved, the **Team Lead will merge** via the GitHub interface.

### Step 9: Clean Up After Merge

```bash
# Switch back to main and pull the merged changes
git checkout main
git pull origin main

# Delete your local feature branch (optional, keeps things tidy)
git branch -d feature/your-name-task-description

# Delete remote feature branch (optional)
git push origin --delete feature/your-name-task-description
```

---

## 5. Resolving Merge Conflicts

### When Do Conflicts Happen?

Conflicts occur when two people modify the **same lines** in the **same file**. With our directory-isolation strategy, this should be rare — but it can still happen in shared files like `shared_contracts.json` or `requirements.txt`.

### Step-by-Step Conflict Resolution

#### Step 1: Pull Latest Main Into Your Branch

```bash
git checkout feature/your-name-task-description
git pull origin main
```

If there are conflicts, Git will output:

```
Auto-merging shared_contracts.json
CONFLICT (content): Merge conflict in shared_contracts.json
Automatic merge failed; fix conflicts and then commit the result.
```

#### Step 2: Open the Conflicted File

The conflicted file will contain **conflict markers**:

```json
{
    "DetectionObject": {
<<<<<<< HEAD
        "confidence": "float (0.0-1.0)",
        "class_name": "string"
=======
        "confidence": "number (0.0-1.0)",
        "class_name": "string",
        "detection_type": "string"
>>>>>>> origin/main
    }
}
```

**Understanding the markers:**

| Marker | Meaning |
|---|---|
| `<<<<<<< HEAD` | Start of YOUR changes (your branch) |
| `=======` | Separator between the two versions |
| `>>>>>>> origin/main` | Start of the INCOMING changes (from main) |

#### Step 3: Resolve the Conflict

Edit the file to keep the correct version. **Remove ALL conflict markers:**

```json
{
    "DetectionObject": {
        "confidence": "number (0.0-1.0)",
        "class_name": "string",
        "detection_type": "string"
    }
}
```

#### Step 4: Mark as Resolved and Commit

```bash
# Stage the resolved file
git add shared_contracts.json

# Commit the merge resolution
git commit -m "fix: resolve merge conflict in shared_contracts.json"

# Push
git push origin feature/your-name-task-description
```

### ⚠️ Golden Rules for Conflict Resolution

1. **NEVER delete someone else's code** during conflict resolution without discussing it first.
2. **NEVER force-push** to resolve conflicts (`git push --force` is forbidden on `main` and discouraged on feature branches).
3. **When in doubt, ask the Lead** — conflicts in shared files should be resolved together.
4. **Test after resolving** — always run your tests to make sure the resolution didn't break anything.

---

## 6. Advanced Git Operations

### 6.1 Viewing History

```bash
# View last 10 commits with graph
git log --oneline --graph -10

# View commits by a specific author
git log --author="Member Name" --oneline

# View changes in a specific file
git log --oneline -- marine_vision/backend/core/dsp/parser.py
```

### 6.2 Undoing Changes

```bash
# Discard unstaged changes to a specific file
git checkout -- marine_vision/backend/core/dsp/parser.py

# Unstage a file (keep changes in working directory)
git reset HEAD marine_vision/backend/core/dsp/parser.py

# Undo the last commit (keep changes staged)
git reset --soft HEAD~1

# Undo the last commit (discard changes — DESTRUCTIVE)
git reset --hard HEAD~1
```

### 6.3 Stashing Work-in-Progress

```bash
# Save current changes temporarily
git stash push -m "WIP: parser refactoring"

# List stashes
git stash list

# Restore the latest stash
git stash pop

# Restore a specific stash
git stash apply stash@{1}
```

### 6.4 Checking for Accidental Files

Before pushing, verify you're not committing binary or sensitive files:

```bash
# Check staged files
git diff --cached --name-only

# Verify no large binaries
git diff --cached --stat
```

---

## 7. `.gitignore` (Must Be Present in Root)

Create or verify this file exists at the repository root:

```gitignore
# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/
venv/
.venv/
dist/
build/
*.egg

# Node.js
node_modules/
.npm/
package-lock.json

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Binary Assets (DO NOT COMMIT)
*.onnx
*.pt
*.pth
*.xtf
*.jsf
*.db
*.sqlite
*.sqlite3

# Large Media
*.png
*.jpg
*.jpeg
*.gif
*.bmp
*.tif
*.tiff
*.mp4
*.avi

# Logs
*.log
logs/

# Environment
.env
.env.local

# Build outputs
marine_vision/frontend/dist/
```

---

## 8. Common Errors & Fixes

### Error: "remote: error: GH006: Protected branch update failed"

**Cause:** You tried to push directly to `main`.  
**Fix:** Create a feature branch and use a Pull Request:

```bash
# If you accidentally committed to main locally:
git branch feature/your-name-task    # Create branch from current state
git checkout main                     # Switch to main
git reset --hard origin/main          # Reset local main to match remote
git checkout feature/your-name-task   # Switch to your feature branch
git push origin feature/your-name-task  # Push and create PR
```

### Error: "fatal: not a git repository"

**Cause:** You're in the wrong directory.  
**Fix:** Navigate to the repository root:

```bash
cd "c:\Users\JATOTHU ANAND\Desktop\sih 2026\MarineVisionAI"
```

### Error: "error: failed to push some refs"

**Cause:** Remote has commits you don't have locally.  
**Fix:** Pull first, then push:

```bash
git pull origin feature/your-name-task
# Resolve conflicts if any
git push origin feature/your-name-task
```

### Error: "Permission denied (publickey)"

**Cause:** SSH key not configured (if using SSH) or credentials expired.  
**Fix:** Use HTTPS and re-authenticate:

```bash
git remote set-url origin https://github.com/ANAND-JATOTHU/MarineVisionAI.git
git push origin feature/your-name-task
# Enter GitHub username and Personal Access Token when prompted
```

---

## 9. Quick Reference Card

```
┌──────────────────── DAILY GIT WORKFLOW ────────────────────┐
│                                                             │
│  1. git checkout main                                       │
│  2. git pull origin main                                    │
│  3. git checkout -b feature/your-name-task                  │
│  4. (make changes in YOUR directory only)                   │
│  5. git add marine_vision/your-directory/                   │
│  6. git commit -m "feat(scope): description"                │
│  7. git push origin feature/your-name-task                  │
│  8. Create Pull Request on GitHub                           │
│  9. Wait for Lead's review & merge                          │
│ 10. git checkout main && git pull origin main               │
│                                                             │
│  ⚠️  NEVER push to main directly                           │
│  ⚠️  NEVER force-push                                      │
│  ⚠️  NEVER modify files outside your assigned directory     │
└─────────────────────────────────────────────────────────────┘
```

---

> **Questions about Git?** Ask the Team Lead (Anand). Don't guess — a wrong `git reset --hard` can destroy your work.
