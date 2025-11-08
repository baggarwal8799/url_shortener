import pool from '../config/database';

export interface AnalyticsResponse {
  shortCode: string;
  totalClicks: number;
  clicksByDay: { date: string; count: number }[];
  topReferers: { referer: string; count: number }[];
}

/**
 * Get analytics for a specific short code
 */
export const getAnalytics = async (shortCode: string): Promise<AnalyticsResponse | null> => {
  // Check if URL exists
  const urlResult = await pool.query(
    'SELECT id, short_code, click_count FROM urls WHERE short_code = $1 OR custom_alias = $1',
    [shortCode]
  );

  if (urlResult.rows.length === 0) {
    return null;
  }

  const url = urlResult.rows[0];
  const urlId = url.id;

  // Get total clicks (from cached count)
  const totalClicks = url.click_count || 0;

  // Get clicks by day (last 30 days)
  const clicksByDayResult = await pool.query(
    `SELECT DATE(clicked_at) as date, COUNT(*) as count
     FROM clicks
     WHERE url_id = $1 AND clicked_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(clicked_at)
     ORDER BY DATE(clicked_at) DESC`,
    [urlId]
  );

  const clicksByDay = clicksByDayResult.rows.map(row => ({
    date: row.date.toISOString().split('T')[0],
    count: parseInt(row.count)
  }));

  // Get top referers
  const topReferersResult = await pool.query(
    `SELECT referer, COUNT(*) as count
     FROM clicks
     WHERE url_id = $1 AND referer != ''
     GROUP BY referer
     ORDER BY count DESC
     LIMIT 10`,
    [urlId]
  );

  const topReferers = topReferersResult.rows.map(row => ({
    referer: row.referer || 'Direct',
    count: parseInt(row.count)
  }));

  return {
    shortCode: url.short_code,
    totalClicks,
    clicksByDay,
    topReferers
  };
};
