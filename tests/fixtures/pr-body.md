feat(quota): implement robust retry logic with exponential backoff for resilience

This PR significantly enhances the reliability of our webhook handling mechanism
by implementing a comprehensive retry strategy with exponential backoff.

## Summary

This pull request adds comprehensive retry logic and improves overall resilience.

## Changes

- Modified `src/webhook/retry.ts`
- Added `src/webhook/backoff.ts`
- Updated `src/webhook/queue.ts`
- Modified `test/retry.test.ts`
- Updated `docs/retries.md`
- Modified `package.json`

## Testing

All tests pass. No breaking changes. This closes #412.

## Impact

This is a game-changing improvement that will significantly reduce downtime and
ensure seamless operation under load, leveraging best practices for distributed
systems.

Co-Authored-By: Claude <noreply@anthropic.com>