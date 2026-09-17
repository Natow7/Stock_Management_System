#!/bin/bash

# Script to commit each unstaged file individually with original file timestamps
# Usage: bash commit-files-individually.sh

cd "$(dirname "$0")"

echo "🔍 Getting list of uncommitted files..."

# Counter
count=0
total=$(git status --porcelain | wc -l)

echo "📊 Total files to commit: $total"
echo ""

# Get list of all modified/new files (use null terminator for safety)
git status --porcelain -z | while IFS= read -r -d '' line; do
    # Extract status and filename
    status="${line:0:2}"
    file="${line:3}"
    
    # Skip if empty
    if [ -z "$file" ]; then
        continue
    fi
    
    count=$((count + 1))
    
    echo "[$count/$total] Processing: $file"
    
    # Get file modification date (if file exists)
    if [ -f "$file" ]; then
        # Get file modification time in ISO 8601 format
        file_date=$(stat -c %y "$file" 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S %z" "$file" 2>/dev/null)
        echo "  📅 File date: $file_date"
    else
        # File deleted or doesn't exist, use current date
        file_date=$(date "+%Y-%m-%d %H:%M:%S %z")
        echo "  📅 Using current date (file not found)"
    fi
    
    # Determine commit message based on status and file type
    case "$status" in
        "M "*)
            msg="Update: $file"
            ;;
        " M"*)
            msg="Modify: $file"
            ;;
        "MM"*)
            msg="Update: $file"
            ;;
        "A "*)
            msg="Add: $file"
            ;;
        " A"*)
            msg="Add: $file"
            ;;
        "??"*)
            msg="Add: $file"
            ;;
        "D "*)
            msg="Delete: $file"
            ;;
        " D"*)
            msg="Remove: $file"
            ;;
        "R "*)
            msg="Rename: $file"
            ;;
        *)
            msg="Update: $file"
            ;;
    esac
    
    # Add the file
    if git add -- "$file" 2>/dev/null; then
        # Commit with original file date
        if GIT_AUTHOR_DATE="$file_date" GIT_COMMITTER_DATE="$file_date" git commit -m "$msg" --no-verify 2>/dev/null; then
            echo "  ✅ Committed with original timestamp"
        else
            echo "  ⚠️  Commit failed (might be empty or already staged)"
        fi
    else
        echo "  ❌ Could not add file"
    fi
    
    echo ""
done

echo ""
echo "🎉 All files processed!"
echo ""
echo "📊 Summary (last 20 commits with dates):"
git log --oneline --date=short --pretty=format:"%h %ad %s" -20

echo ""
echo ""
echo "💡 To push all commits: git push"
