const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis connection:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, expiration = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, expiration, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async incr(key, expiration = 3600) {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const result = await this.client.incr(key);
      if (result === 1) {
        // Set expiration only for new keys
        await this.client.expire(key, expiration);
      }
      return result;
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  }

  async hset(hash, field, value) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.hSet(hash, field, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async hget(hash, field) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.hGet(hash, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async hgetall(hash) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.hGetAll(hash);
      const parsed = {};
      for (const [key, value] of Object.entries(data)) {
        try {
          parsed[key] = JSON.parse(value);
        } catch {
          parsed[key] = value;
        }
      }
      return parsed;
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return null;
    }
  }

  async zadd(key, score, member, expiration = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.zAdd(key, { score, value: JSON.stringify(member) });
      await this.client.expire(key, expiration);
      return true;
    } catch (error) {
      console.error('Redis ZADD error:', error);
      return false;
    }
  }

  async zrange(key, start = 0, stop = -1, withScores = false) {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      const options = withScores ? { WITHSCORES: true } : {};
      const result = await this.client.zRange(key, start, stop, options);
      
      if (withScores) {
        const parsed = [];
        for (let i = 0; i < result.length; i += 2) {
          try {
            parsed.push({
              value: JSON.parse(result[i]),
              score: parseFloat(result[i + 1])
            });
          } catch {
            parsed.push({
              value: result[i],
              score: parseFloat(result[i + 1])
            });
          }
        }
        return parsed;
      } else {
        return result.map(item => {
          try {
            return JSON.parse(item);
          } catch {
            return item;
          }
        });
      }
    } catch (error) {
      console.error('Redis ZRANGE error:', error);
      return [];
    }
  }

  async lpush(key, ...values) {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      const result = await this.client.lPush(key, serializedValues);
      return result;
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  async lrange(key, start = 0, stop = -1) {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      const result = await this.client.lRange(key, start, stop);
      return result.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (error) {
      console.error('Redis LRANGE error:', error);
      return [];
    }
  }

  async ltrim(key, start, stop) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.lTrim(key, start, stop);
      return true;
    } catch (error) {
      console.error('Redis LTRIM error:', error);
      return false;
    }
  }

  // Analytics-specific methods
  async cacheAnalyticsData(key, data, expiration = 300) {
    return await this.set(`analytics:${key}`, data, expiration);
  }

  async getCachedAnalyticsData(key) {
    return await this.get(`analytics:${key}`);
  }

  async recordScanEvent(qrBundleId, eventData) {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Record daily scan count
    await this.incr(`scans:daily:${today}`, 86400);
    
    // Record hourly scan count
    await this.incr(`scans:hourly:${today}:${hour}`, 86400);
    
    // Record bundle-specific scan count
    await this.incr(`scans:bundle:${qrBundleId}:${today}`, 86400);
    
    // Add to recent events list
    await this.lpush(`events:recent`, {
      type: 'scan',
      bundleId: qrBundleId,
      timestamp: new Date().toISOString(),
      ...eventData
    });
    
    // Keep only last 100 events
    await this.ltrim(`events:recent`, 0, 99);
  }

  async getRecentEvents(limit = 50) {
    return await this.lrange(`events:recent`, 0, limit - 1);
  }

  async getScanTrends(days = 7) {
    const trends = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = await this.get(`scans:daily:${dateStr}`) || 0;
      trends.unshift({
        date: dateStr,
        scans: count
      });
    }
    return trends;
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

// Create and export a singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
