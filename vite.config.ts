import { defineConfig } from 'vitest/config'

function resolveBasePath() {
  if (!process.env.GITHUB_ACTIONS) {
    return '/'
  }

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  return repo ? `/${repo}/` : '/'
}

export default defineConfig({
  base: resolveBasePath(),
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
