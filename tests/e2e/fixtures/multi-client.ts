import { Browser, BrowserContext, Page } from '@playwright/test'
import { test as base } from './auth'

type ClientContext = {
  context: BrowserContext
  page: Page
}

type MultiClientFixture = {
  hostClient: ClientContext
  playerClients: ClientContext[]
  tvClient: ClientContext
  createPlayerClient: () => Promise<ClientContext>
}

export const test = base.extend<MultiClientFixture>({
  hostClient: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await use({ context, page })
    await context.close()
  },

  playerClients: async ({ browser }, use) => {
    const clients: ClientContext[] = []

    // Create 2 default player clients with mobile viewport
    for (let i = 0; i < 2; i++) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE
      })
      const page = await context.newPage()
      clients.push({ context, page })
    }

    await use(clients)

    // Cleanup
    for (const client of clients) {
      await client.context.close()
    }
  },

  tvClient: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Full HD TV
    })
    const page = await context.newPage()
    await use({ context, page })
    await context.close()
  },

  createPlayerClient: async ({ browser }, use) => {
    const createdClients: ClientContext[] = []

    const factory = async () => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE
      })
      const page = await context.newPage()
      const client = { context, page }
      createdClients.push(client)
      return client
    }

    await use(factory)

    // Cleanup dynamically created clients
    for (const client of createdClients) {
      await client.context.close()
    }
  },
})

export { expect } from '@playwright/test'
