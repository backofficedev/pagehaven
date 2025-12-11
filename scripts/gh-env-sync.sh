#!/bin/bash

# Exit on error
set -e

# Function to display help
show_help() {
    echo "Usage: $0 --env|-e {preview|staging|production} [--github-env ENV] [--include-disabled] [--dry-run|-n]"
    echo "Sync environment variables to GitHub secrets"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Source environment file to sync from (preview, staging or production)"
    echo "  -g, --github-env ENV     GitHub environment to sync to (defaults to --env value)"
    echo "  -d, --include-disabled   Include disabled environment variables from .env.${ENV}.disabled"
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

ENV_FILE="./.env.${ENV}"
if [ "$INCLUDE_DISABLED" = true ]; then
    ENV_FILE="./.env.${ENV}.disabled"
fi

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN: Would sync the following environment variables from $ENV_FILE to GitHub environment '$GITHUB_ENV':"
    echo ""
    cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | while IFS= read -r line; do
        if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            key=$(echo "$line" | cut -d'=' -f1)
            echo "  $key"
        fi
    done
    echo ""
    echo "Total variables: $(cat "$ENV_FILE" | grep -c '^[A-Za-z_][A-Za-z0-9_]*=')"
    echo ""
    echo "DRY RUN: No actual changes were made. Run without --dry-run to perform the sync."
else
    echo "Syncing environment variables from $ENV_FILE to GitHub environment '$GITHUB_ENV'..."
    gh secret set --env "$GITHUB_ENV" --env-file "$ENV_FILE"
    echo "✅ Successfully synced $ENV environment secrets to GitHub environment '$GITHUB_ENV'"
fi
