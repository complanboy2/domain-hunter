# Domain Hunter 🎯

Production-ready automated domain intelligence system that checks 2000-4000+ company names daily across multiple TLDs. Runs via GitHub Actions with zero API costs.

## Overview

Domain Hunter automatically:
- Fetches **Fortune Global 500**, **Fortune US 500**, **S&P 500**, **Unicorn startups**, **Y Combinator companies**, **GitHub Trending repos**, and **AI buzzwords**
- Generates smart domain variations with prefixes/suffixes (`ai`, `labs`, `cloud`, `tech`)
- Checks availability across `.com`, `.app`, `.ai`, `.so` using RDAP + DNS fallback
- Processes **200 domains per day** with intelligent rotation (full cycle every ~10 days)
- Sends email alerts only when interesting domains are found
- Outputs structured CSV with availability status

## Features

✅ **Multi-Source Intelligence**
- Fortune Global 500 (Wikipedia)
- Fortune US 500 (Wikipedia)
- S&P 500 (Wikipedia)
- Unicorn Startups (Wikipedia)
- Y Combinator Companies
- GitHub Trending Repositories
- Custom AI Buzzwords: Optimus, FSD, Grok, Sora, Claude, Neuralink, xAI, Starlink

✅ **Smart Processing**
- Automatic deduplication across all sources
- Name normalization (3-25 characters, domain-safe)
- Intelligent variation generation (prefix + suffix combinations)
- Handles 2000-4000+ unique names

✅ **Reliable Checking**
- Primary: RDAP lookup via https://rdap.org/
- Fallback: DNS NS record lookup
- Status tracking: `AVAILABLE`, `REGISTERED`, `POSSIBLE_AVAILABLE`
- Rate-limited: 2 concurrent requests, 1200ms delay

✅ **Daily Rotation**
- Batch size: 200 keywords → ~800 domain checks
- Rotates based on day of month (1-31)
- Complete coverage every ~10 days
- No domains missed

✅ **Smart Output**
- Only creates CSV when interesting domains found
- Groups by base name
- Excludes fully-registered base names
- Includes domains with at least one available/possible TLD

✅ **Email Notifications**
- Beautiful HTML emails via Gmail SMTP
- Summary statistics
- Top 30 interesting base names
- Sent only when results found

## Architecture

```
domain-hunter/
├── dataSources.js      # Fetches from 7 different sources
├── keywords.js         # Deduplication, normalization, batching
├── index.js           # Main logic: RDAP + DNS checking
├── mailer.js          # Gmail SMTP notifications
├── package.json       # Dependencies
├── .github/
│   └── workflows/
│       └── cron.yml   # GitHub Actions daily schedule
└── README.md
```

## Setup Instructions

### 1. Fork or Clone Repository

```bash
git clone https://github.com/complanboy2/domain-hunter.git
cd domain-hunter
```

### 2. Install Dependencies (Local Testing Only)

```bash
npm install
```

### 3. Set Up Gmail App Password

**CRITICAL:** Use an App Password, NOT your regular Gmail password.

1. Go to https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if needed)
3. Scroll to **App passwords** at bottom
4. Click **Select app** → Choose **Mail**
5. Click **Select device** → Choose **Other** → Enter "Domain Hunter"
6. Click **Generate**
7. Copy the 16-character password (ignore spaces)

### 4. Add GitHub Secrets

1. Go to your repository: `https://github.com/complanboy2/domain-hunter`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add two secrets:

**Secret 1:**
- Name: `EMAIL_USER`
- Value: Your Gmail address (e.g., `yourname@gmail.com`)

**Secret 2:**
- Name: `EMAIL_PASS`
- Value: The 16-character App Password from step 3

### 5. Enable GitHub Actions

1. Go to **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. Workflow will run automatically daily at 2:00 AM UTC

## Manual Trigger

To run immediately:

1. Go to **Actions** tab
2. Click **Domain Hunter Daily Check**
3. Click **Run workflow** dropdown
4. Select `main` branch
5. Click **Run workflow** button

## Expected Runtime

- **Data Collection:** ~30-60 seconds (fetches all sources)
- **Processing:** ~10-20 seconds (deduplication, normalization)
- **Domain Checking:** ~15-30 minutes (200 keywords × 4 TLDs = 800 domains)
- **Total:** ~20-35 minutes per run
- **Well within GitHub Actions 3-hour limit**

## Output Format

### results.csv

Only created when interesting domains are found.

```csv
base,domain,status
openai,openai.com,REGISTERED
openai,openai.app,AVAILABLE
openai,openai.ai,REGISTERED
openai,openai.so,POSSIBLE_AVAILABLE
openaiai,openaiai.com,AVAILABLE
openaiai,openaiai.app,AVAILABLE
```

**Filtering Logic:**
- Only includes base names where at least one TLD is NOT `REGISTERED`
- Excludes fully-registered base names
- Helps focus on actionable opportunities

### Email Notification

Sent only when results found:
- Summary statistics (Available, Possible, Total)
- Top 30 interesting base names with all TLDs
- Beautiful HTML formatting
- Link to GitHub Actions run for full CSV

## Data Sources Details

### Fortune Global 500
Wikipedia list of world's largest companies by revenue.

### Fortune US 500
Wikipedia list of largest US companies.

### S&P 500
Wikipedia list of S&P 500 index constituents.

### Unicorn Startups
Wikipedia list of private companies valued at $1B+.

### Y Combinator Companies
Scraped from YC company directory.

### GitHub Trending
Current trending repositories on GitHub.

### Custom Buzzwords
Manually curated AI/tech keywords:
- Optimus, FSD, Grok, Sora, Claude, Neuralink, xAI, Starlink

## Variation Generation

For each base name (e.g., `openai`):

**Base:** `openai`

**Suffixes:**
- `openaiai`
- `openailabs`
- `openaicloud`
- `openaitech`

**Prefixes:**
- `aiopenai`
- `labsopenai`
- `cloudopenai`
- `techopenai`

Total: 9 variations per base name × 4 TLDs = 36 domain checks per base

## Status Definitions

### AVAILABLE
- RDAP returned 404 (not found), OR
- DNS lookup returned ENOTFOUND/ENODATA
- **High confidence the domain is available**

### REGISTERED
- RDAP returned 200 with active status, OR
- DNS lookup found nameservers
- **High confidence the domain is registered**

### POSSIBLE_AVAILABLE
- RDAP returned unclear status, AND
- DNS lookup also unclear
- **Manual verification recommended**

## Rate Limiting & Ethics

### Current Settings
- **Concurrency:** 2 parallel requests
- **Delay:** 1200ms between requests
- **Batch Size:** 200 keywords/day (~800 domains)
- **Total Requests:** ~800 per day

### RDAP Server
Using https://rdap.org/ which aggregates multiple RDAP servers.

**DO NOT:**
- Increase concurrency above 2
- Reduce delay below 1000ms
- Increase batch size above 300
- Run multiple instances simultaneously

Violating rate limits may result in IP blocks.

## Customization

### Change Batch Size

Edit `keywords.js`, line with `getTodaysBatch(200)`:

```javascript
export async function getTodaysBatch(batchSize = 200) {
```

**Recommended:** 150-250 for safety.

### Add More TLDs

Edit `index.js`, `TLDS` array:

```javascript
const TLDS = ['.com', '.app', '.ai', '.so', '.io', '.dev'];
```

**Note:** Ensure RDAP supports the TLD.

### Add Custom Keywords

Edit `dataSources.js`, `getCustomBuzzwords()`:

```javascript
export function getCustomBuzzwords() {
  return [
    'Optimus',
    'YourKeyword',
    // ... more
  ];
}
```

### Change Schedule

Edit `.github/workflows/cron.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Use [crontab.guru](https://crontab.guru/) for cron expressions.

## Troubleshooting

### Email Not Sending

1. Verify `EMAIL_USER` and `EMAIL_PASS` secrets are correct
2. Ensure using App Password, not regular password
3. Check 2-Step Verification is enabled
4. Review GitHub Actions logs for error details

### No Results Found

This is **normal**! Most domains are registered. The system:
- Rotates through different batches daily
- May go several days without finding available domains
- Only sends email when interesting domains ARE found

### Workflow Not Running

1. Check Actions tab is enabled
2. Verify cron schedule (2 AM UTC)
3. Manually trigger to test
4. Check GitHub Actions quota (free tier: 2000 min/month)

### Data Collection Fails

If Wikipedia/YC scraping fails:
- Selectors may have changed (update `dataSources.js`)
- Network issues (temporary, will retry next day)
- System continues with other sources

## Local Testing

```bash
# Set environment variables
export EMAIL_USER="your@gmail.com"
export EMAIL_PASS="your-app-password"

# Run
node index.js
```

**Note:** Local runs use same batching logic based on current day.

## Performance Metrics

### Expected Scale
- **Total unique names:** 2000-4000
- **Total variations:** 8000-16000
- **Daily batch:** 200 keywords
- **Daily domains checked:** ~800
- **Full cycle:** ~10 days

### Resource Usage
- **Memory:** <500MB
- **CPU:** Minimal (mostly I/O wait)
- **Network:** ~800 RDAP + DNS requests/day
- **GitHub Actions:** ~30 min/day (~15 hours/month)

## Legal & Compliance

### Data Sources
- All data from public sources (Wikipedia, GitHub, YC directory)
- Fair use for research/educational purposes
- No scraping of private/protected data

### RDAP Usage
- Public protocol (RFC 7480)
- Respectful rate limiting
- No authentication required
- Free to use

### Domain Checking
- Checking availability is legal
- Not purchasing or squatting
- Educational/research purposes

## Contributing

Contributions welcome!

1. Fork repository
2. Create feature branch
3. Test locally
4. Submit pull request

## License

MIT License - Free to use and modify.

## Disclaimer

This tool is for **educational and research purposes only**.

- Always verify domain availability through official registrars
- Respect rate limits and terms of service
- Use responsibly and ethically
- No warranty or guarantee of accuracy

## Support

- **Issues:** https://github.com/complanboy2/domain-hunter/issues
- **Discussions:** https://github.com/complanboy2/domain-hunter/discussions

---

**Built with ❤️ for domain hunters**

*Last updated: 2026*
