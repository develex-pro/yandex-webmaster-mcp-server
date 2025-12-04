/**
 * Integration tests for Yandex Webmaster API client.
 *
 * These tests require real API credentials and make actual API calls.
 * Run locally only with a .env file containing:
 *   YANDEX_API_KEY=your_token
 *   TEST_USER_ID=your_user_id
 *   TEST_HOST_ID=your_host_id
 *
 * Run: npm run test:integration
 */

import { expect } from 'chai';
import { YandexWebmasterClient } from '../src/webmaster-client.js';

const token = process.env.YANDEX_API_KEY;
const userId = process.env.TEST_USER_ID;
const hostId = process.env.TEST_HOST_ID;

const canRunIntegrationTests = token && userId && hostId;

(canRunIntegrationTests ? describe : describe.skip)('YandexWebmasterClient Integration', function () {
  this.timeout(30000);

  let client: YandexWebmasterClient;

  before(() => {
    client = new YandexWebmasterClient(token!);
  });

  describe('User', () => {
    it('getUserId returns user data', async () => {
      const result = (await client.getUserId()) as { user_id: number };
      expect(result).to.have.property('user_id');
      expect(result.user_id).to.be.a('number');
    });
  });

  describe('Hosts', () => {
    it('getHosts returns list of hosts', async () => {
      const result = (await client.getHosts(userId!)) as { hosts: unknown[] };
      expect(result).to.have.property('hosts');
      expect(result.hosts).to.be.an('array');
    });

    it('getHostInfo returns host details', async () => {
      const result = (await client.getHostInfo(userId!, hostId!)) as { host_id: string };
      expect(result).to.have.property('host_id');
      expect(result.host_id).to.equal(hostId);
    });
  });

  describe('Verification', () => {
    it('getVerificationStatus returns verification info', async () => {
      const result = (await client.getVerificationStatus(userId!, hostId!)) as {
        verification_state: string;
      };
      expect(result).to.have.property('verification_state');
    });

    it('getHostOwners returns owners list', async () => {
      const result = (await client.getHostOwners(userId!, hostId!)) as { users: unknown[] };
      expect(result).to.have.property('users');
      expect(result.users).to.be.an('array');
    });
  });

  describe('Search Queries', () => {
    const dateFrom = getDateDaysAgo(30);
    const dateTo = getDateDaysAgo(1);

    it('getPopularQueries returns queries with stats', async () => {
      const result = (await client.getPopularQueries(userId!, hostId!, {
        dateFrom,
        dateTo,
        orderBy: 'TOTAL_CLICKS',
      })) as { queries: unknown[] };
      expect(result).to.have.property('queries');
      expect(result.queries).to.be.an('array');
    });

    it('getQueryHistory returns data or handles missing resource', async () => {
      try {
        const result = (await client.getQueryHistory(userId!, hostId!, {
          dateFrom,
          dateTo,
        })) as { indicators: unknown[] };
        expect(result).to.have.property('indicators');
      } catch (error) {
        // Some hosts may not have this data available
        expect((error as Error).message).to.include('404');
      }
    });

    it('getSingleQueryHistory returns data for specific query or handles missing', async () => {
      try {
        const result = (await client.getSingleQueryHistory(userId!, hostId!, 'test', {
          dateFrom,
          dateTo,
        })) as { indicators: unknown[] };
        expect(result).to.have.property('indicators');
      } catch (error) {
        // Query may not exist or endpoint unavailable
        expect((error as Error).message).to.match(/404|400/);
      }
    });
  });

  describe('Indexing', () => {
    it('getIndexingSummary returns indexing stats', async () => {
      const result = (await client.getIndexingSummary(userId!, hostId!)) as Record<string, unknown>;
      expect(result).to.be.an('object');
    });

    it('getIndexingHistory returns historical data', async () => {
      const dateFrom = getDateDaysAgo(30);
      const dateTo = getDateDaysAgo(1);

      const result = (await client.getIndexingHistory(userId!, hostId!, {
        dateFrom,
        dateTo,
      })) as { indicators: unknown[] };
      expect(result).to.have.property('indicators');
    });

    it('getIndexingSamples returns sample URLs', async () => {
      const result = (await client.getIndexingSamples(userId!, hostId!, 10)) as {
        samples: unknown[];
      };
      expect(result).to.have.property('samples');
      expect(result.samples).to.be.an('array');
    });
  });

  describe('Sitemaps', () => {
    it('getSitemaps returns sitemap list', async () => {
      const result = (await client.getSitemaps(userId!, hostId!)) as { sitemaps: unknown[] };
      expect(result).to.have.property('sitemaps');
      expect(result.sitemaps).to.be.an('array');
    });

    it('getSitemapInfo returns sitemap details if sitemap exists', async () => {
      const sitemaps = (await client.getSitemaps(userId!, hostId!)) as {
        sitemaps: Array<{ sitemap_id: string }>;
      };
      if (sitemaps.sitemaps.length > 0) {
        const sitemapId = sitemaps.sitemaps[0].sitemap_id;
        const result = (await client.getSitemapInfo(userId!, hostId!, sitemapId)) as {
          sitemap_id: string;
        };
        expect(result).to.have.property('sitemap_id');
      }
    });
  });

  describe('Recrawl', () => {
    it('getRecrawlQuota returns quota info', async () => {
      const result = (await client.getRecrawlQuota(userId!, hostId!)) as {
        daily_quota: number;
        quota_remainder: number;
      };
      expect(result).to.have.property('daily_quota');
      expect(result).to.have.property('quota_remainder');
    });

    it('getRecrawlTasks returns task list or handles missing resource', async () => {
      try {
        const result = (await client.getRecrawlTasks(userId!, hostId!)) as { tasks: unknown[] };
        expect(result).to.have.property('tasks');
        expect(result.tasks).to.be.an('array');
      } catch (error) {
        // Endpoint may not be available for all hosts
        expect((error as Error).message).to.include('404');
      }
    });

    it('getRecrawlTaskStatus returns status if task exists', async () => {
      try {
        const tasks = (await client.getRecrawlTasks(userId!, hostId!)) as {
          tasks: Array<{ task_id: string }>;
        };
        if (tasks.tasks.length > 0) {
          const taskId = tasks.tasks[0].task_id;
          const result = (await client.getRecrawlTaskStatus(userId!, hostId!, taskId)) as {
            task_id: string;
          };
          expect(result).to.have.property('task_id');
        }
      } catch (error) {
        // Endpoint may not be available
        expect((error as Error).message).to.include('404');
      }
    });
  });

  describe('Links', () => {
    it('getExternalLinks returns backlinks', async () => {
      const result = (await client.getExternalLinks(userId!, hostId!, 10)) as {
        links: unknown[];
      };
      expect(result).to.have.property('links');
      expect(result.links).to.be.an('array');
    });

    it('getInternalLinks returns internal links or handles missing resource', async () => {
      try {
        const result = (await client.getInternalLinks(userId!, hostId!, 10)) as {
          links: unknown[];
        };
        expect(result).to.have.property('links');
        expect(result.links).to.be.an('array');
      } catch (error) {
        // Internal links may not be available for all hosts
        expect((error as Error).message).to.include('404');
      }
    });
  });

  describe('SQI', () => {
    it('getSqiHistory returns SQI data or handles missing resource', async () => {
      const dateFrom = getDateDaysAgo(90);
      const dateTo = getDateDaysAgo(1);

      try {
        const result = (await client.getSqiHistory(userId!, hostId!, {
          dateFrom,
          dateTo,
        })) as { points: unknown[] };
        expect(result).to.have.property('points');
        expect(result.points).to.be.an('array');
      } catch (error) {
        // SQI history may not be available for all hosts
        expect((error as Error).message).to.include('404');
      }
    });
  });

  describe('Diagnostics', () => {
    it('getSiteDiagnostics returns diagnostics info', async () => {
      const result = (await client.getSiteDiagnostics(userId!, hostId!)) as Record<string, unknown>;
      expect(result).to.be.an('object');
    });
  });

  describe('RSS Feeds', () => {
    it('getRssFeeds returns feeds list or handles missing resource', async () => {
      try {
        const result = (await client.getRssFeeds(userId!, hostId!)) as { feeds: unknown[] };
        expect(result).to.have.property('feeds');
        expect(result.feeds).to.be.an('array');
      } catch (error) {
        // RSS feeds endpoint may not be available for all hosts
        expect((error as Error).message).to.include('404');
      }
    });

    it('getRssFeedInfo returns feed details if feed exists', async () => {
      try {
        const feeds = (await client.getRssFeeds(userId!, hostId!)) as {
          feeds: Array<{ feed_id: string }>;
        };
        if (feeds.feeds.length > 0) {
          const feedId = feeds.feeds[0].feed_id;
          const result = (await client.getRssFeedInfo(userId!, hostId!, feedId)) as {
            feed_id: string;
          };
          expect(result).to.have.property('feed_id');
        }
      } catch (error) {
        // Endpoint may not be available
        expect((error as Error).message).to.include('404');
      }
    });
  });

  // Note: The following methods are NOT tested because they are destructive:
  // - addHost / deleteHost (creates/removes sites)
  // - verifyHost (initiates verification process)
  // - requestRecrawl (consumes daily quota)
  // - addSitemap / deleteSitemap (modifies sitemap list)
  // - addRssFeed / deleteRssFeed (modifies RSS feed list)
});

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
