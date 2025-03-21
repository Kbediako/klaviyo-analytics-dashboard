#!/bin/bash

# This script helps you create a new GitHub repository and push your code to it

echo "=== Push to GitHub Script ==="
echo "This script will help you create a new GitHub repository and push your code to it."
echo ""

# Step 1: Create a new GitHub repository
echo "Step 1: Create a new GitHub repository"
echo "1. Open your web browser and go to: https://github.com/new"
echo "2. Sign in to your GitHub account if prompted"
echo "3. Enter 'klaviyo-analytics-dashboard' as the Repository name"
echo "4. Add a description (optional): 'Analytics dashboard for Klaviyo marketing metrics'"
echo "5. Choose 'Private' if you want to keep your code private, or 'Public' if you want it to be publicly accessible"
echo "6. Do NOT initialize the repository with a README, .gitignore, or license"
echo "7. Click 'Create repository'"
echo ""
echo "After creating the repository, GitHub will show you instructions for pushing an existing repository."
echo "You can ignore those instructions and continue with this script."
echo ""
read -p "Press Enter once you've created the repository on GitHub..."

# Step 2: Get the repository URL
echo ""
echo "Step 2: Enter your GitHub repository URL"
echo "Copy the URL from your browser's address bar or from the 'Quick setup' section on GitHub."
echo "It should look like: https://github.com/yourusername/klaviyo-analytics-dashboard.git"
echo ""
read -p "Enter the repository URL: " repo_url

# Validate the URL format
if [[ ! $repo_url =~ ^https://github.com/.+/.+\.git$ ]]; then
    echo "The URL format doesn't look right. It should end with .git"
    echo "If GitHub didn't show the .git extension, please add it manually."
    read -p "Enter the repository URL (with .git at the end): " repo_url
fi

# Step 3: Add the remote and push
echo ""
echo "Step 3: Adding the remote repository and pushing your code"
git remote add origin $repo_url
if [ $? -ne 0 ]; then
    echo "Error adding remote. The remote might already exist or the URL might be incorrect."
    echo "If the remote already exists, you can update it with:"
    echo "git remote set-url origin $repo_url"
    read -p "Would you like to update the existing remote? (y/n): " update_remote
    if [[ $update_remote == "y" || $update_remote == "Y" ]]; then
        git remote set-url origin $repo_url
    else
        echo "Exiting without updating the remote."
        exit 1
    fi
fi

# Step 4: Push to GitHub
echo ""
echo "Step 4: Pushing your code to GitHub"
echo "This will push your current branch (feature/analytics-engine) to GitHub."
read -p "Press Enter to continue or Ctrl+C to cancel..."

git push -u origin feature/analytics-engine
push_status=$?

if [ $push_status -eq 0 ]; then
    echo ""
    echo "Success! Your code has been pushed to GitHub."
    echo "You can now access your repository at: ${repo_url%.git}"
    echo ""
    echo "To utilize your debug workflow:"
    echo "1. Go to your repository on GitHub"
    echo "2. Click on the 'Actions' tab"
    echo "3. Select 'Debug Workflow' from the list of workflows"
    echo "4. Click 'Run workflow' button"
    echo "5. Configure the options and click 'Run workflow' to start"
else
    echo ""
    echo "There was an error pushing to GitHub. Please check the error message above."
    echo "Common issues include:"
    echo "- Authentication problems (GitHub requires a personal access token for HTTPS)"
    echo "- Network connectivity issues"
    echo "- Repository permissions"
    echo ""
    echo "If you're having authentication issues, you might want to set up SSH authentication:"
    echo "https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
fi
