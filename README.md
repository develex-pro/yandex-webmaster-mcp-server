# Yandex Webmaster MCP Server

MCP server for integrating [Yandex Webmaster API](https://yandex.ru/dev/webmaster/) with AI assistants (Claude, etc.).

Manage your Yandex Webmaster data using natural language: analyze search queries, monitor indexing, request page recrawls, and more.

## Features

- **Site Management** — list sites, get info, verify ownership
- **Search Queries** — top queries, clicks/impressions/position stats, history
- **Indexing** — indexed page count, trends, sample URLs
- **Sitemaps** — list, add, delete, check processing status
- **Recrawl** — submit URLs for reindexing, check quota and task status
- **Links** — external backlinks, internal linking
- **SQI** — Site Quality Index history
- **Diagnostics** — site problems and recommendations

## Installation

### Requirements

- Node.js 18+
- Yandex Webmaster API OAuth token

### Getting an OAuth Token

1. Go to [oauth.yandex.ru](https://oauth.yandex.ru/)
2. Create a new application
3. Add permissions in **Yandex Webmaster API** section:
   - `webmaster:verify` — full access to Webmaster data
4. Get OAuth token via: `https://oauth.yandex.ru/authorize?response_type=token&client_id=<your_app_id>`

### Server Setup

```bash
git clone https://github.com/your-username/yandex-webmaster-mcp-server.git
cd yandex-webmaster-mcp-server
npm install
npm run build
```

### Connecting to Claude Desktop

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "yandex-webmaster": {
      "command": "node",
      "args": ["/full/path/to/yandex-webmaster-mcp-server/build/index.js"],
      "env": {
        "YANDEX_API_KEY": "your_oauth_token"
      }
    }
  }
}
```

Restart Claude Desktop.

## Usage Examples

After connecting, you can use natural language queries:

| Task | Example Query |
|------|---------------|
| Top queries | "Show top 10 queries by clicks for November" |
| Check indexing | "How many pages of example.com are indexed?" |
| Compare periods | "Compare impressions for October vs November" |
| Request recrawl | "Submit example.com/new-page for recrawl" |
| Indexing issues | "Which pages dropped from index this week?" |
| Sitemap status | "Show all sitemaps and when they were updated" |
| Query history | "How did position for 'buy sofa' change over 3 months?" |

## Available Tools

| Tool | Description |
|------|-------------|
| `get_user_id` | Get authenticated user ID |
| `get_hosts` | List all sites |
| `get_host_info` | Get site details |
| `add_host` | Add a site |
| `delete_host` | Remove a site |
| `verify_host` | Verify site ownership |
| `get_verification_status` | Check verification status |
| `get_host_owners` | List verified site owners |
| `get_popular_queries` | Popular search queries with stats |
| `get_query_history` | Aggregated query history |
| `get_single_query_history` | History for specific query |
| `get_indexing_summary` | Indexing statistics summary |
| `get_indexing_history` | Historical indexing data |
| `get_indexing_samples` | Sample indexed pages |
| `request_recrawl` | Submit URL for recrawl |
| `get_recrawl_quota` | Check daily recrawl quota |
| `get_recrawl_tasks` | List recrawl tasks |
| `get_recrawl_task_status` | Check recrawl task status |
| `get_sitemaps` | List sitemaps |
| `get_sitemap_info` | Get sitemap details |
| `add_sitemap` | Add a sitemap |
| `delete_sitemap` | Remove a sitemap |
| `get_external_links` | External backlinks |
| `get_internal_links` | Internal links |
| `get_sqi_history` | Site Quality Index history |
| `get_site_diagnostics` | Site problems and recommendations |
| `get_rss_feeds` | List RSS feeds |
| `add_rss_feed` | Add RSS feed |
| `delete_rss_feed` | Remove RSS feed |

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format code
npm run format

# Debug with MCP Inspector
npm run inspector
```

## License

MIT

## Links

- [Technical Architecture](https://develex.ru/blog/mcp-yandex-webmaster) — how the server works under the hood
- [MCP Documentation](https://modelcontextprotocol.io)
- [Yandex Webmaster API](https://yandex.ru/dev/webmaster/)

---

Developed by [develex.ru](https://develex.ru)
