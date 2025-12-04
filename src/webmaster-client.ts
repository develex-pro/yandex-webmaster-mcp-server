const API_BASE = 'https://api.webmaster.yandex.net/v4';

interface ClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: object;
}

interface DateRangeParams {
  dateFrom: string;
  dateTo: string;
}

interface SearchQueriesParams extends DateRangeParams {
  queryIndicator?: 'TOTAL_SHOWS' | 'TOTAL_CLICKS' | 'AVG_SHOW_POSITION' | 'AVG_CLICK_POSITION';
  orderBy: 'TOTAL_SHOWS' | 'TOTAL_CLICKS' | 'AVG_SHOW_POSITION' | 'AVG_CLICK_POSITION';
  limit?: number;
  offset?: number;
}

export class YandexWebmasterClient {
  private token: string;
  private config: Required<ClientConfig>;

  constructor(token: string, config: ClientConfig = {}) {
    this.token = token;
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {},
    attempt: number = 1
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: {
          Authorization: `OAuth ${this.token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Yandex Webmaster error ${response.status}: ${errorText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error) {
      if (attempt < this.config.retries && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay * attempt);
        return this.makeRequest<T>(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === 'AbortError' ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503')
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private validateRequired(params: Record<string, unknown>, fields: string[]): void {
    for (const field of fields) {
      if (!params[field] || (typeof params[field] === 'string' && !params[field].trim())) {
        throw new Error(`${field} is required and must be non-empty`);
      }
    }
  }

  private hostUrl(userId: string, hostId: string, path: string = ''): string {
    return `${API_BASE}/user/${userId}/hosts/${hostId}${path}`;
  }

  // ==================== User ====================

  async getUserId(): Promise<unknown> {
    const url = `${API_BASE}/user`;
    return this.makeRequest(url);
  }

  // ==================== Hosts ====================

  async getHosts(userId: string): Promise<unknown> {
    this.validateRequired({ userId }, ['userId']);
    const url = `${API_BASE}/user/${userId}/hosts`;
    return this.makeRequest(url);
  }

  async getHostInfo(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId);
    return this.makeRequest(url);
  }

  async addHost(userId: string, hostUrl: string): Promise<unknown> {
    this.validateRequired({ userId, hostUrl }, ['userId', 'hostUrl']);
    const url = `${API_BASE}/user/${userId}/hosts`;
    return this.makeRequest(url, { method: 'POST', body: { host_url: hostUrl } });
  }

  async deleteHost(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId);
    return this.makeRequest(url, { method: 'DELETE' });
  }

  // ==================== Verification ====================

  async verifyHost(userId: string, hostId: string, verificationType: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, verificationType }, [
      'userId',
      'hostId',
      'verificationType',
    ]);
    const url = this.hostUrl(userId, hostId, '/verification');
    return this.makeRequest(url, { method: 'POST', body: { verification_type: verificationType } });
  }

  async getVerificationStatus(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/verification');
    return this.makeRequest(url);
  }

  async getHostOwners(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/owners');
    return this.makeRequest(url);
  }

  // ==================== Search Queries ====================

  async getPopularQueries(
    userId: string,
    hostId: string,
    params: SearchQueriesParams
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId, ...params }, [
      'userId',
      'hostId',
      'dateFrom',
      'dateTo',
      'orderBy',
    ]);
    const queryParams = new URLSearchParams({
      date_from: params.dateFrom,
      date_to: params.dateTo,
      order_by: params.orderBy,
    });
    if (params.queryIndicator) queryParams.set('query_indicator', params.queryIndicator);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset) queryParams.set('offset', params.offset.toString());

    const url = this.hostUrl(userId, hostId, `/search-queries/popular?${queryParams}`);
    return this.makeRequest(url);
  }

  async getQueryHistory(userId: string, hostId: string, params: DateRangeParams): Promise<unknown> {
    this.validateRequired({ userId, hostId, ...params }, [
      'userId',
      'hostId',
      'dateFrom',
      'dateTo',
    ]);
    const queryParams = new URLSearchParams({
      date_from: params.dateFrom,
      date_to: params.dateTo,
    });
    const url = this.hostUrl(userId, hostId, `/search-queries/history/all?${queryParams}`);
    return this.makeRequest(url);
  }

  async getSingleQueryHistory(
    userId: string,
    hostId: string,
    queryText: string,
    params: DateRangeParams
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId, queryText, ...params }, [
      'userId',
      'hostId',
      'queryText',
      'dateFrom',
      'dateTo',
    ]);
    const queryParams = new URLSearchParams({
      query_text: queryText,
      date_from: params.dateFrom,
      date_to: params.dateTo,
    });
    const url = this.hostUrl(userId, hostId, `/search-queries/history?${queryParams}`);
    return this.makeRequest(url);
  }

  // ==================== Indexing ====================

  async getIndexingSummary(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/summary');
    return this.makeRequest(url);
  }

  async getIndexingHistory(
    userId: string,
    hostId: string,
    params: DateRangeParams
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId, ...params }, [
      'userId',
      'hostId',
      'dateFrom',
      'dateTo',
    ]);
    const queryParams = new URLSearchParams({
      date_from: params.dateFrom,
      date_to: params.dateTo,
    });
    const url = this.hostUrl(userId, hostId, `/indexing/history?${queryParams}`);
    return this.makeRequest(url);
  }

  async getIndexingSamples(
    userId: string,
    hostId: string,
    limit?: number,
    offset?: number
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', limit.toString());
    if (offset) queryParams.set('offset', offset.toString());
    const queryString = queryParams.toString();
    const url = this.hostUrl(
      userId,
      hostId,
      `/indexing/samples${queryString ? '?' + queryString : ''}`
    );
    return this.makeRequest(url);
  }

  // ==================== Recrawl ====================

  async requestRecrawl(userId: string, hostId: string, pageUrl: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, pageUrl }, ['userId', 'hostId', 'pageUrl']);
    const url = this.hostUrl(userId, hostId, '/recrawl');
    return this.makeRequest(url, { method: 'POST', body: { url: pageUrl } });
  }

  async getRecrawlTasks(
    userId: string,
    hostId: string,
    limit?: number,
    offset?: number
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', limit.toString());
    if (offset) queryParams.set('offset', offset.toString());
    const queryString = queryParams.toString();
    const url = this.hostUrl(
      userId,
      hostId,
      `/recrawl/tasks${queryString ? '?' + queryString : ''}`
    );
    return this.makeRequest(url);
  }

  async getRecrawlTaskStatus(userId: string, hostId: string, taskId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, taskId }, ['userId', 'hostId', 'taskId']);
    const url = this.hostUrl(userId, hostId, `/recrawl/tasks/${taskId}`);
    return this.makeRequest(url);
  }

  async getRecrawlQuota(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/recrawl/quota');
    return this.makeRequest(url);
  }

  // ==================== Sitemaps ====================

  async getSitemaps(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/sitemaps');
    return this.makeRequest(url);
  }

  async getSitemapInfo(userId: string, hostId: string, sitemapId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, sitemapId }, ['userId', 'hostId', 'sitemapId']);
    const url = this.hostUrl(userId, hostId, `/sitemaps/${sitemapId}`);
    return this.makeRequest(url);
  }

  async addSitemap(userId: string, hostId: string, sitemapUrl: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, sitemapUrl }, ['userId', 'hostId', 'sitemapUrl']);
    const url = this.hostUrl(userId, hostId, '/user-added-sitemaps');
    return this.makeRequest(url, { method: 'POST', body: { url: sitemapUrl } });
  }

  async deleteSitemap(userId: string, hostId: string, sitemapId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, sitemapId }, ['userId', 'hostId', 'sitemapId']);
    const url = this.hostUrl(userId, hostId, `/user-added-sitemaps/${sitemapId}`);
    return this.makeRequest(url, { method: 'DELETE' });
  }

  // ==================== Links ====================

  async getInternalLinks(
    userId: string,
    hostId: string,
    limit?: number,
    offset?: number
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', limit.toString());
    if (offset) queryParams.set('offset', offset.toString());
    const queryString = queryParams.toString();
    const url = this.hostUrl(
      userId,
      hostId,
      `/links/internal/samples${queryString ? '?' + queryString : ''}`
    );
    return this.makeRequest(url);
  }

  async getExternalLinks(
    userId: string,
    hostId: string,
    limit?: number,
    offset?: number
  ): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', limit.toString());
    if (offset) queryParams.set('offset', offset.toString());
    const queryString = queryParams.toString();
    const url = this.hostUrl(
      userId,
      hostId,
      `/links/external/samples${queryString ? '?' + queryString : ''}`
    );
    return this.makeRequest(url);
  }

  // ==================== SQI (Site Quality Index) ====================

  async getSqiHistory(userId: string, hostId: string, params: DateRangeParams): Promise<unknown> {
    this.validateRequired({ userId, hostId, ...params }, [
      'userId',
      'hostId',
      'dateFrom',
      'dateTo',
    ]);
    const queryParams = new URLSearchParams({
      date_from: params.dateFrom,
      date_to: params.dateTo,
    });
    const url = this.hostUrl(userId, hostId, `/sqi/history?${queryParams}`);
    return this.makeRequest(url);
  }

  // ==================== RSS Feeds ====================

  async getRssFeeds(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/rss-feeds');
    return this.makeRequest(url);
  }

  async addRssFeed(userId: string, hostId: string, feedUrl: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, feedUrl }, ['userId', 'hostId', 'feedUrl']);
    const url = this.hostUrl(userId, hostId, '/rss-feeds');
    return this.makeRequest(url, { method: 'POST', body: { url: feedUrl } });
  }

  async getRssFeedInfo(userId: string, hostId: string, feedId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, feedId }, ['userId', 'hostId', 'feedId']);
    const url = this.hostUrl(userId, hostId, `/rss-feeds/${feedId}`);
    return this.makeRequest(url);
  }

  async deleteRssFeed(userId: string, hostId: string, feedId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId, feedId }, ['userId', 'hostId', 'feedId']);
    const url = this.hostUrl(userId, hostId, `/rss-feeds/${feedId}`);
    return this.makeRequest(url, { method: 'DELETE' });
  }

  async getSiteDiagnostics(userId: string, hostId: string): Promise<unknown> {
    this.validateRequired({ userId, hostId }, ['userId', 'hostId']);
    const url = this.hostUrl(userId, hostId, '/diagnostics');
    return this.makeRequest(url);
  }
}
