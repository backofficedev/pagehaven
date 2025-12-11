#!/bin/bash

# Exit on error
set -e

# Function to display help
show_help() {
    echo "Usage: $0 --env|-e {preview|staging|production} [--github-env ENV] [--include-disabled] [--dry-run|-n]"
    echo "Sync environment variables from .env.{ENV} files (root and apps/**/) to GitHub secrets"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Source environment to sync from (preview, staging or production)"
    echo "                            Searches for .env.{ENV} files in root and apps/**/."
    echo "  -g, --github-env ENV     GitHub environment to sync to (defaults to --env value)"
    echo "  -d, --include-disabled   Include disabled environment variables from .env.{ENV}.disabled"
    echo "  -n, --dry-run            Preview what would be synced without actually doing it"
    echo "  -h, --help               Show this help message and exit"
}

# Parse command line arguments
INCLUDE_DISABLED=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--env)
            ENV="$2"
            shift # past argument
            shift # past value
            ;;
        -g|--github-env)
            GITHUB_ENV="$2"
            shift # past argument
            shift # past value
            ;;
        -d|--include-disabled)
            INCLUDE_DISABLED=true
            shift # past argument
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift # past argument
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Default GitHub environment to ENV if not specified
GITHUB_ENV=${GITHUB_ENV:-$ENV}

# Validate environment
if [[ -z "$ENV" ]]; then
    echo "Error: No environment specified"
    show_help
    exit 1
fi

if [[ "$ENV" != "preview" && "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo "Error: Environment must be either 'preview', 'staging' or 'production'"
    exit 1
fi

# Find all matching env files in apps directory
if [ "$INCLUDE_DISABLED" = true ]; then
    ENV_PATTERN=".env.${ENV}.disabled"
else
    ENV_PATTERN=".env.${ENV}"
fi

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Find all matching env files in root and apps/**/
ENV_FILES=()

# Check root directory first
if [[ -f "$PROJECT_ROOT/$ENV_PATTERN" ]]; then
    ENV_FILES+=("$PROJECT_ROOT/$ENV_PATTERN")
fi

# Find in apps/**/
while IFS= read -r -d '' file; do
    ENV_FILES+=("$file")
done < <(find "$PROJECT_ROOT/apps" -name "$ENV_PATTERN" -type f -print0 2>/dev/null)

if [[ ${#ENV_FILES[@]} -eq 0 ]]; then
    echo "Error: No environment files matching $ENV_PATTERN found in root or apps/"
    exit 1
fi

echo "Found ${#ENV_FILES[@]} environment file(s):"
for f in "${ENV_FILES[@]}"; do
    echo "  - ${f#$PROJECT_ROOT/}"
done
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN: Would sync the following environment variables to GitHub environment '$GITHUB_ENV':"
    echo ""
    TOTAL_VARS=0
    for ENV_FILE in "${ENV_FILES[@]}"; do
        echo "From ${ENV_FILE#$PROJECT_ROOT/}:"
        while IFS= read -r line; do
            if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                key=$(echo "$line" | cut -d'=' -f1)
                echo "  $key"
                ((TOTAL_VARS++)) || true
            fi
        done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
        echo ""
    done
    echo "Total variables: $TOTAL_VARS"
    echo ""
    echo "DRY RUN: No actual changes were made. Run without --dry-run to perform the sync."
else
    echo "Syncing environment variables to GitHub environment '$GITHUB_ENV'..."
    for ENV_FILE in "${ENV_FILES[@]}"; do
        echo "  Syncing ${ENV_FILE#$PROJECT_ROOT/}..."
        gh secret set --env "$GITHUB_ENV" --env-file "$ENV_FILE"
    done
    echo "✅ Successfully synced $ENV environment secrets to GitHub environment '$GITHUB_ENV'"
fi
