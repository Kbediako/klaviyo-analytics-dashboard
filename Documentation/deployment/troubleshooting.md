# Deployment Troubleshooting Guide

## Common Issues and Solutions

### Backend Service Won't Start

**Symptoms:**
- Service fails to start
- PM2 shows error status
- Application logs show startup errors

**Troubleshooting Steps:**

1. Check the logs for errors:
```bash
pm2 logs klaviyo-api
```

2. Verify environment variables are correctly set:
```bash
cat .env
```

3. Common causes:
   - Missing environment variables
   - Invalid API key
   - Port already in use
   - Database connection issues

### Frontend Service Won't Start

**Symptoms:**
- Next.js build fails
- Service won't start after deployment
- Blank page in browser

**Troubleshooting Steps:**

1. Check the logs for errors:
```bash
pm2 logs klaviyo-frontend
```

2. Verify the API URL is correctly set:
```bash
grep -r "NEXT_PUBLIC_API_URL" .
```

3. Common causes:
   - Build errors
   - Invalid API URL
   - Missing environment variables
   - Static file serving issues

### API Returning 500 Errors

**Symptoms:**
- API endpoints return 500 status
- Error logs show Klaviyo API issues
- High error rate in monitoring

**Troubleshooting Steps:**

1. Check the Klaviyo API key:
```bash
curl -I https://a.klaviyo.com/api/v1/metrics \
  -H "Authorization: Klaviyo-API-Key YOUR_API_KEY"
```

2. Verify the cache is functioning:
```bash
redis-cli ping
```

3. Common causes:
   - Invalid or expired API key
   - Rate limiting issues
   - Cache connection problems
   - Database connectivity issues

### Performance Issues

**Symptoms:**
- Slow response times
- High CPU/memory usage
- Cache miss rate increases

**Troubleshooting Steps:**

1. Check system resources:
```bash
top
free -m
df -h
```

2. Monitor application metrics:
   - Review New Relic dashboard
   - Check CloudWatch metrics
   - Analyze Sentry performance data

3. Common causes:
   - Resource constraints
   - Memory leaks
   - Cache inefficiency
   - Database query issues

## Monitoring Tools

### Log Access

1. **Application Logs**
```bash
# Backend logs
pm2 logs klaviyo-api

# Frontend logs
pm2 logs klaviyo-frontend

# System logs
journalctl -u klaviyo-api
```

2. **CloudWatch Logs**
- Access through AWS Console
- Use AWS CLI for direct access
- Filter by log group/stream

### Performance Monitoring

1. **New Relic**
- Access dashboard
- Review transaction traces
- Check error rates
- Monitor Apdex score

2. **Server Metrics**
```bash
# CPU and memory
htop

# Disk usage
ncdu

# Network stats
netstat -tulpn
```

## Recovery Procedures

### Service Recovery

1. **Restart Services**
```bash
pm2 restart klaviyo-api
pm2 restart klaviyo-frontend
```

2. **Clear Cache**
```bash
redis-cli flushall
```

3. **Verify Recovery**
```bash
pm2 status
curl http://localhost:3000/health
```

### Data Recovery

1. **Database Backup**
```bash
mongodump --uri="mongodb://..."
```

2. **Database Restore**
```bash
mongorestore --uri="mongodb://..."
```

### Emergency Contacts

- **DevOps Team**: devops@example.com
- **Backend Team**: backend@example.com
- **Frontend Team**: frontend@example.com
- **Klaviyo Support**: support@klaviyo.com

## Prevention

### Best Practices

1. **Regular Maintenance**
   - Monitor disk space
   - Review log files
   - Update dependencies
   - Test backups

2. **Monitoring**
   - Set up alerts
   - Monitor trends
   - Regular health checks
   - Performance baselines

3. **Documentation**
   - Keep runbooks updated
   - Document incidents
   - Update procedures
   - Share knowledge
