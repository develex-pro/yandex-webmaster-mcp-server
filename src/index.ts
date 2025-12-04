import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { YandexWebmasterClient } from './webmaster-client.js';
import { withErrorHandling } from './lib/index.js';

const token = process.env.YANDEX_API_KEY;

if (!token) {
  console.error('Error: YANDEX_API_KEY environment variable is required');
  process.exit(1);
}

const client = new YandexWebmasterClient(token);

const server = new McpServer({
  name: 'yandex-webmaster-mcp-server',
  version: '1.0.0',
});

// ==================== User ====================

server.registerTool(
  'get_user_id',
  {
    title: 'Get User ID',
    description: 'Get the authenticated user ID from Yandex Webmaster',
    inputSchema: {},
  },
  withErrorHandling(async () => {
    const result = await client.getUserId();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Hosts ====================

server.registerTool(
  'get_hosts',
  {
    title: 'Get Hosts',
    description: 'Get the list of all sites (hosts) added to Yandex Webmaster',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
    },
  },
  withErrorHandling(async ({ user_id }) => {
    const result = await client.getHosts(user_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_host_info',
  {
    title: 'Get Host Info',
    description: 'Get detailed information about a specific site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getHostInfo(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'add_host',
  {
    title: 'Add Host',
    description: 'Add a new site to Yandex Webmaster',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_url: z.string().describe('URL of the site to add (e.g., https://example.com)'),
    },
  },
  withErrorHandling(async ({ user_id, host_url }) => {
    const result = await client.addHost(user_id, host_url);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'delete_host',
  {
    title: 'Delete Host',
    description: 'Remove a site from Yandex Webmaster',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site to delete'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.deleteHost(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Verification ====================

server.registerTool(
  'verify_host',
  {
    title: 'Verify Host',
    description: 'Start the site verification process',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      verification_type: z
        .string()
        .describe('Verification method: DNS, HTML_FILE, META_TAG, WHOIS, TXT_FILE'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, verification_type }) => {
    const result = await client.verifyHost(user_id, host_id, verification_type);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_verification_status',
  {
    title: 'Get Verification Status',
    description: 'Get the current verification status of a site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getVerificationStatus(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_host_owners',
  {
    title: 'Get Host Owners',
    description: 'Get the list of users who have verified rights to the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getHostOwners(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Search Queries ====================

server.registerTool(
  'get_popular_queries',
  {
    title: 'Get Popular Queries',
    description: 'Get popular search queries for the site with statistics',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      date_from: z.string().describe('Start date in YYYY-MM-DD format'),
      date_to: z.string().describe('End date in YYYY-MM-DD format'),
      order_by: z
        .string()
        .describe(
          'Sort by (required): TOTAL_SHOWS, TOTAL_CLICKS, AVG_SHOW_POSITION, AVG_CLICK_POSITION'
        ),
      query_indicator: z
        .string()
        .optional()
        .describe('Metric: TOTAL_SHOWS, TOTAL_CLICKS, AVG_SHOW_POSITION, AVG_CLICK_POSITION'),
      limit: z.number().optional().describe('Maximum number of results'),
      offset: z.number().optional().describe('Offset for pagination'),
    },
  },
  withErrorHandling(
    async ({ user_id, host_id, date_from, date_to, query_indicator, order_by, limit, offset }) => {
      const result = await client.getPopularQueries(user_id, host_id, {
        dateFrom: date_from,
        dateTo: date_to,
        queryIndicator: query_indicator as
          | 'TOTAL_SHOWS'
          | 'TOTAL_CLICKS'
          | 'AVG_SHOW_POSITION'
          | 'AVG_CLICK_POSITION',
        orderBy: order_by as
          | 'TOTAL_SHOWS'
          | 'TOTAL_CLICKS'
          | 'AVG_SHOW_POSITION'
          | 'AVG_CLICK_POSITION',
        limit,
        offset,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  )
);

server.registerTool(
  'get_query_history',
  {
    title: 'Get Query History',
    description: 'Get aggregated search query statistics for all queries',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      date_from: z.string().describe('Start date in YYYY-MM-DD format'),
      date_to: z.string().describe('End date in YYYY-MM-DD format'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, date_from, date_to }) => {
    const result = await client.getQueryHistory(user_id, host_id, {
      dateFrom: date_from,
      dateTo: date_to,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_single_query_history',
  {
    title: 'Get Single Query History',
    description: 'Get statistics history for a specific search query',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      query_text: z.string().describe('The search query text to get statistics for'),
      date_from: z.string().describe('Start date in YYYY-MM-DD format'),
      date_to: z.string().describe('End date in YYYY-MM-DD format'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, query_text, date_from, date_to }) => {
    const result = await client.getSingleQueryHistory(user_id, host_id, query_text, {
      dateFrom: date_from,
      dateTo: date_to,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Indexing ====================

server.registerTool(
  'get_indexing_summary',
  {
    title: 'Get Indexing Summary',
    description: 'Get summary of site indexing statistics',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getIndexingSummary(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_indexing_history',
  {
    title: 'Get Indexing History',
    description: 'Get historical indexing data for the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      date_from: z.string().describe('Start date in YYYY-MM-DD format'),
      date_to: z.string().describe('End date in YYYY-MM-DD format'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, date_from, date_to }) => {
    const result = await client.getIndexingHistory(user_id, host_id, {
      dateFrom: date_from,
      dateTo: date_to,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_indexing_samples',
  {
    title: 'Get Indexing Samples',
    description: 'Get examples of indexed pages',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      limit: z.number().optional().describe('Maximum number of results'),
      offset: z.number().optional().describe('Offset for pagination'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, limit, offset }) => {
    const result = await client.getIndexingSamples(user_id, host_id, limit, offset);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Recrawl ====================

server.registerTool(
  'request_recrawl',
  {
    title: 'Request Recrawl',
    description: 'Request Yandex to recrawl/reindex a specific page',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      url: z.string().describe('Full URL of the page to recrawl'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, url }) => {
    const result = await client.requestRecrawl(user_id, host_id, url);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_recrawl_tasks',
  {
    title: 'Get Recrawl Tasks',
    description: 'Get the list of recrawl tasks',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      limit: z.number().optional().describe('Maximum number of results'),
      offset: z.number().optional().describe('Offset for pagination'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, limit, offset }) => {
    const result = await client.getRecrawlTasks(user_id, host_id, limit, offset);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_recrawl_task_status',
  {
    title: 'Get Recrawl Task Status',
    description: 'Get the status of a specific recrawl task',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      task_id: z.string().describe('Recrawl task ID'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, task_id }) => {
    const result = await client.getRecrawlTaskStatus(user_id, host_id, task_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_recrawl_quota',
  {
    title: 'Get Recrawl Quota',
    description: 'Get the recrawl quota information (daily limit)',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getRecrawlQuota(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Sitemaps ====================

server.registerTool(
  'get_sitemaps',
  {
    title: 'Get Sitemaps',
    description: 'Get the list of sitemaps for the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getSitemaps(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_sitemap_info',
  {
    title: 'Get Sitemap Info',
    description: 'Get detailed information about a specific sitemap',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      sitemap_id: z.string().describe('Sitemap ID'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, sitemap_id }) => {
    const result = await client.getSitemapInfo(user_id, host_id, sitemap_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'add_sitemap',
  {
    title: 'Add Sitemap',
    description: 'Add a new sitemap to the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      sitemap_url: z.string().describe('Full URL to the sitemap file'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, sitemap_url }) => {
    const result = await client.addSitemap(user_id, host_id, sitemap_url);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'delete_sitemap',
  {
    title: 'Delete Sitemap',
    description: 'Remove a user-added sitemap from the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      sitemap_id: z.string().describe('Sitemap ID to delete'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, sitemap_id }) => {
    const result = await client.deleteSitemap(user_id, host_id, sitemap_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== Links ====================

server.registerTool(
  'get_internal_links',
  {
    title: 'Get Internal Links',
    description: 'Get samples of internal links on the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      limit: z.number().optional().describe('Maximum number of results'),
      offset: z.number().optional().describe('Offset for pagination'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, limit, offset }) => {
    const result = await client.getInternalLinks(user_id, host_id, limit, offset);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_external_links',
  {
    title: 'Get External Links',
    description: 'Get samples of external links pointing to the site (backlinks)',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      limit: z.number().optional().describe('Maximum number of results'),
      offset: z.number().optional().describe('Offset for pagination'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, limit, offset }) => {
    const result = await client.getExternalLinks(user_id, host_id, limit, offset);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== SQI (Site Quality Index) ====================

server.registerTool(
  'get_sqi_history',
  {
    title: 'Get SQI History',
    description: 'Get the Site Quality Index (SQI) history - Yandex metric for site quality',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      date_from: z.string().describe('Start date in YYYY-MM-DD format'),
      date_to: z.string().describe('End date in YYYY-MM-DD format'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, date_from, date_to }) => {
    const result = await client.getSqiHistory(user_id, host_id, {
      dateFrom: date_from,
      dateTo: date_to,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

// ==================== RSS Feeds ====================

server.registerTool(
  'get_rss_feeds',
  {
    title: 'Get RSS Feeds',
    description: 'Get the list of RSS feeds added to the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getRssFeeds(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'add_rss_feed',
  {
    title: 'Add RSS Feed',
    description: 'Add a new RSS feed to the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      feed_url: z.string().describe('Full URL to the RSS feed'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, feed_url }) => {
    const result = await client.addRssFeed(user_id, host_id, feed_url);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_rss_feed_info',
  {
    title: 'Get RSS Feed Info',
    description: 'Get detailed information about a specific RSS feed',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      feed_id: z.string().describe('RSS feed ID'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, feed_id }) => {
    const result = await client.getRssFeedInfo(user_id, host_id, feed_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'delete_rss_feed',
  {
    title: 'Delete RSS Feed',
    description: 'Remove an RSS feed from the site',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
      feed_id: z.string().describe('RSS feed ID to delete'),
    },
  },
  withErrorHandling(async ({ user_id, host_id, feed_id }) => {
    const result = await client.deleteRssFeed(user_id, host_id, feed_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

server.registerTool(
  'get_site_diagnostics',
  {
    title: 'Get Site Diagnostics',
    description: 'Get information about site problems and diagnostics',
    inputSchema: {
      user_id: z.string().describe('Yandex Webmaster user ID'),
      host_id: z.string().describe('Host ID of the site'),
    },
  },
  withErrorHandling(async ({ user_id, host_id }) => {
    const result = await client.getSiteDiagnostics(user_id, host_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Yandex Webmaster MCP Server started on stdin/stdout');
}

main().catch((error) => {
  console.error('Fatal error: ', error);
  process.exit(1);
});
