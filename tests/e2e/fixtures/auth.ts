import { Page } from '@playwright/test'
import { test as base } from './supabase'

type AuthFixture = {
  loginAsHost: (page: Page, email?: string, password?: string) => Promise<void>
  loginAsPlayer: (page: Page, email?: string, password?: string) => Promise<void>
  loginAsAnonymousPlayer: (page: Page, displayName: string) => Promise<void>
  logout: (page: Page) => Promise<void>
}

export const test = base.extend<AuthFixture>({
  loginAsHost: async ({}, use) => {
    const login = async (
      page: Page,
      email = process.env.TEST_HOST_EMAIL!,
      password = process.env.TEST_HOST_PASSWORD!
    ) => {
      await page.goto('/host/login')
      await page.getByTestId('email-input').fill(email)
      await page.getByTestId('password-input').fill(password)
      await page.getByTestId('login-button').click()
      await page.waitForURL('/host/dashboard', { timeout: 10000 })
    }
    await use(login)
  },

  loginAsPlayer: async ({}, use) => {
    const login = async (
      page: Page,
      email = process.env.TEST_PLAYER_1_EMAIL!,
      password = process.env.TEST_PLAYER_1_PASSWORD!
    ) => {
      await page.goto('/player/login')
      await page.getByTestId('email-input').fill(email)
      await page.getByTestId('password-input').fill(password)
      await page.getByTestId('login-button').click()
      await page.waitForURL('/player/join', { timeout: 10000 })
    }
    await use(login)
  },

  loginAsAnonymousPlayer: async ({}, use) => {
    const login = async (page: Page, displayName: string) => {
      await page.goto('/player/login')
      await page.getByTestId('anonymous-tab').click()
      await page.getByTestId('display-name-input').fill(displayName)
      await page.getByTestId('continue-anonymous-button').click()
      await page.waitForURL('/player/join', { timeout: 10000 })
    }
    await use(login)
  },

  logout: async ({}, use) => {
    const logout = async (page: Page) => {
      await page.getByTestId('user-menu').click()
      await page.getByTestId('logout-button').click()
      await page.waitForURL('/', { timeout: 10000 })
    }
    await use(logout)
  },
})

export { expect } from '@playwright/test'
