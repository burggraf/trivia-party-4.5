import { Page, expect } from '@playwright/test'

export interface SyncValidationResult {
  maxLatencyMs: number
  avgLatencyMs: number
  minLatencyMs: number
  allSynced: boolean
}

export class RealTimeSyncValidator {
  constructor(private maxLatencyMs: number = 300) {}

  /**
   * Validates that all target pages receive a state update within the max latency
   * after the source page triggers an action
   */
  async validateSync(
    sourcePage: Page,
    sourceAction: () => Promise<void>,
    targetPages: Page[],
    targetSelector: string,
    expectedValue?: string
  ): Promise<SyncValidationResult> {
    const startTime = Date.now()

    // Execute the action on source
    await sourceAction()

    // Wait for all targets to update
    const latencies: number[] = []

    for (const targetPage of targetPages) {
      const targetStartTime = Date.now()

      if (expectedValue) {
        await expect(targetPage.locator(targetSelector)).toHaveText(expectedValue, {
          timeout: this.maxLatencyMs + 1000,
        })
      } else {
        await expect(targetPage.locator(targetSelector)).toBeVisible({
          timeout: this.maxLatencyMs + 1000,
        })
      }

      const targetLatency = Date.now() - targetStartTime
      latencies.push(targetLatency)
    }

    const maxLatency = Math.max(...latencies)
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const minLatency = Math.min(...latencies)

    // Assert max latency is within threshold
    expect(maxLatency).toBeLessThanOrEqual(this.maxLatencyMs)

    return {
      maxLatencyMs: maxLatency,
      avgLatencyMs: avgLatency,
      minLatencyMs: minLatency,
      allSynced: true,
    }
  }

  /**
   * Validates that all pages show the same state (consistency check)
   */
  async validateStateConsistency(
    pages: Page[],
    selector: string
  ): Promise<void> {
    const states = await Promise.all(
      pages.map(async (page) => {
        const text = await page.locator(selector).textContent()
        return text
      })
    )

    const uniqueStates = new Set(states)

    if (uniqueStates.size > 1) {
      throw new Error(
        `State inconsistency detected. Found ${uniqueStates.size} different states: ${Array.from(uniqueStates).join(', ')}`
      )
    }
  }

  /**
   * Measures the latency between a source event and target receiving the update
   */
  async measureLatency(
    sourcePage: Page,
    sourceAction: () => Promise<void>,
    targetPage: Page,
    targetSelector: string
  ): Promise<number> {
    const startTime = Date.now()
    await sourceAction()
    await targetPage.locator(targetSelector).waitFor({ timeout: 5000 })
    return Date.now() - startTime
  }
}
