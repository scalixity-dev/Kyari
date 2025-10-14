import { AuthService } from '../modules/auth/auth.service'
import { logger } from '../utils/logger'

export class SchedulerService {
  private static instance: SchedulerService
  private cleanupInterval: NodeJS.Timeout | null = null
  private authService: AuthService
  private isCleanupRunning: boolean = false

  private constructor() {
    this.authService = new AuthService()
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService()
    }
    return SchedulerService.instance
  }

  /**
   * Start the token cleanup scheduler
   * Runs every 4 hours to clean up expired tokens
   */
  startTokenCleanup(): void {
    if (this.cleanupInterval) {
      logger.warn('Token cleanup scheduler is already running')
      return
    }

    // Run cleanup every 4 hours (4 * 60 * 60 * 1000 ms)
    const cleanupIntervalMs = 4 * 60 * 60 * 1000

    this.cleanupInterval = setInterval(async () => {
      // Guard against overlapping cleanup operations
      if (this.isCleanupRunning) {
        logger.info('Token cleanup already in progress, skipping this interval')
        return
      }

      this.isCleanupRunning = true
      try {
        logger.info('Starting scheduled token cleanup...')
        const result = await this.authService.cleanupExpiredTokens()
        logger.info(`Token cleanup completed. Deleted ${result.deletedCount} expired tokens`)
      } catch (error) {
        logger.error('Error during scheduled token cleanup:', error)
      } finally {
        this.isCleanupRunning = false
      }
    }, cleanupIntervalMs)

    logger.info('Token cleanup scheduler started (runs every 4 hours)')

    // Run initial cleanup immediately
    this.runInitialCleanup()
  }

  /**
   * Run an initial cleanup when the scheduler starts
   */
  private async runInitialCleanup(): Promise<void> {
    // Guard against overlapping with scheduled cleanup
    if (this.isCleanupRunning) {
      logger.info('Token cleanup already in progress, skipping initial cleanup')
      return
    }

    this.isCleanupRunning = true
    try {
      logger.info('Running initial token cleanup...')
      const result = await this.authService.cleanupExpiredTokens()
      logger.info(`Initial token cleanup completed. Deleted ${result.deletedCount} expired tokens`)
    } catch (error) {
      logger.error('Error during initial token cleanup:', error)
    } finally {
      this.isCleanupRunning = false
    }
  }

  /**
   * Stop the token cleanup scheduler
   */
  stopTokenCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      logger.info('Token cleanup scheduler stopped')
    }
  }

  /**
   * Force run token cleanup immediately
   */
  async runTokenCleanup(): Promise<number> {
    // Guard against overlapping with scheduled cleanup
    if (this.isCleanupRunning) {
      logger.warn('Token cleanup already in progress, cannot run manual cleanup')
      throw new Error('Token cleanup already in progress')
    }

    this.isCleanupRunning = true
    try {
      logger.info('Running manual token cleanup...')
      const result = await this.authService.cleanupExpiredTokens()
      logger.info(`Manual token cleanup completed. Deleted ${result.deletedCount} expired tokens`)
      return result.deletedCount
    } catch (error) {
      logger.error('Error during manual token cleanup:', error)
      throw error
    } finally {
      this.isCleanupRunning = false
    }
  }

  /**
   * Get the status of the scheduler
   */
  getStatus(): { isRunning: boolean; nextRunIn?: number } {
    return {
      isRunning: this.cleanupInterval !== null,
      nextRunIn: this.cleanupInterval ? 4 * 60 * 60 * 1000 : undefined // 4 hours in ms
    }
  }
}