import { Page, CDPSession } from '@playwright/test'

export const NETWORK_PRESETS = {
  'slow-3g': {
    offline: false,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
    latency: 2000,
  },
  '3g': {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 300,
  },
  '4g': {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 50,
  },
  offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  },
}

export class NetworkConditions {
  private cdpSession?: CDPSession

  constructor(private page: Page) {}

  async initialize() {
    this.cdpSession = await this.page.context().newCDPSession(this.page)
  }

  async setPreset(preset: keyof typeof NETWORK_PRESETS) {
    if (!this.cdpSession) {
      throw new Error('NetworkConditions not initialized. Call initialize() first.')
    }

    await this.cdpSession.send('Network.emulateNetworkConditions', NETWORK_PRESETS[preset])
  }

  async goOffline() {
    await this.setPreset('offline')
  }

  async goOnline() {
    if (!this.cdpSession) {
      throw new Error('NetworkConditions not initialized. Call initialize() first.')
    }

    await this.cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    })
  }

  async simulateDisconnect(durationMs: number) {
    await this.goOffline()
    await this.page.waitForTimeout(durationMs)
    await this.goOnline()
  }

  async cleanup() {
    if (this.cdpSession) {
      await this.goOnline()
      await this.cdpSession.detach()
    }
  }
}
