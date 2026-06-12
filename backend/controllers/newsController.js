const axios = require('axios');
const News = require('../models/News');

// @desc    Get latest IT news
// @route   GET /api/news/latest
exports.getLatestNews = async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    // Attempt to fetch real news if key is present and not default
    if (apiKey && apiKey !== 'your_news_api_key_here') {
      try {
        const response = await axios.get(`https://newsapi.org/v2/everything?q=IT+Hiring+OR+Software+Development+OR+Tech+Trends&sortBy=publishedAt&language=en&apiKey=${apiKey}`);
        const rawArticles = response.data?.articles;
        
        if (Array.isArray(rawArticles) && rawArticles.length > 0) {
          const articles = rawArticles.slice(0, 10).map(art => ({
            title: art.title,
            source: art.source?.name || 'Tech News',
            url: art.url,
            publishedAt: art.publishedAt,
            description: art.description,
            urlToImage: art.urlToImage
          }));
          return res.json(articles);
        }
      } catch (apiErr) {
        console.warn('NewsAPI fetch failed, falling back to mocks:', apiErr.message);
      }
    }

    // No NewsAPI key — fetch live tech news from Hacker News (free, no key required)
    try {
      const hnRes = await axios.get('https://hn.algolia.com/api/v1/search', {
        params: { tags: 'front_page', hitsPerPage: 10 },
        timeout: 8000
      });

      const articles = (hnRes.data?.hits || []).map(hit => ({
        title: hit.title,
        source: 'Hacker News',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        publishedAt: hit.created_at,
        description: `${hit.points || 0} points · ${hit.num_comments || 0} comments · by ${hit.author}`
      }));

      if (articles.length > 0) return res.json(articles);
    } catch (hnErr) {
      console.warn('Hacker News fetch failed:', hnErr.message);
    }

    // Nothing reachable — return empty list honestly rather than fake articles
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
