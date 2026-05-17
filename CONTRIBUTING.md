# Contributing to StellarSplit

## Branch Naming Convention

- `main` - Production branch
- `feat/*` - New features (e.g., `feat/add-notifications`)
- `fix/*` - Bug fixes (e.g., `fix/expense-calculation`)
- `docs/*` - Documentation updates

## Development Workflow

1. Create a new branch from `main`
2. Make your changes
3. Test locally
4. Submit a PR

## Test Requirements

- Smart contract: Run `cargo test` in `contracts/split/`
- Frontend: Run `npm run build` in `frontend/`

## PR Process

1. Ensure all tests pass
2. Update documentation if needed
3. Describe changes in PR description
4. Request review from maintainers