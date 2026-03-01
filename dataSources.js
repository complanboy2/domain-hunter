import * as cheerio from 'cheerio';

/**
 * Fetch Fortune Global 500 companies from Wikipedia
 */
export async function fetchFortuneGlobal500() {
  console.log('Fetching Fortune Global 500...');
  try {
    const response = await fetch('https://en.wikipedia.org/wiki/Fortune_Global_500');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const companies = new Set();
    
    $('table.wikitable').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length > 1) {
          const companyName = $(cells[1]).text().trim();
          if (companyName && companyName.length > 0) {
            companies.add(companyName);
          }
        }
      });
    });
    
    const result = Array.from(companies).slice(0, 500);
    console.log(`  Found ${result.length} Fortune Global 500 companies`);
    return result;
  } catch (error) {
    console.error('  Error fetching Fortune Global 500:', error.message);
    return [];
  }
}

/**
 * Fetch Fortune US 500 companies from Wikipedia
 */
export async function fetchFortuneUS500() {
  console.log('Fetching Fortune US 500...');
  try {
    const response = await fetch('https://en.wikipedia.org/wiki/Fortune_500');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const companies = new Set();
    
    $('table.wikitable').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length > 1) {
          const companyName = $(cells[1]).text().trim();
          if (companyName && companyName.length > 0) {
            companies.add(companyName);
          }
        }
      });
    });
    
    const result = Array.from(companies).slice(0, 500);
    console.log(`  Found ${result.length} Fortune US 500 companies`);
    return result;
  } catch (error) {
    console.error('  Error fetching Fortune US 500:', error.message);
    return [];
  }
}

/**
 * Fetch S&P 500 companies from Wikipedia
 */
export async function fetchSP500() {
  console.log('Fetching S&P 500...');
  try {
    const response = await fetch('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const companies = new Set();
    
    $('#constituents').find('tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length > 1) {
        const companyName = $(cells[1]).text().trim();
        if (companyName && companyName.length > 0) {
          companies.add(companyName);
        }
      }
    });
    
    const result = Array.from(companies);
    console.log(`  Found ${result.length} S&P 500 companies`);
    return result;
  } catch (error) {
    console.error('  Error fetching S&P 500:', error.message);
    return [];
  }
}

/**
 * Fetch Unicorn startups from Wikipedia
 */
export async function fetchUnicorns() {
  console.log('Fetching Unicorn startups...');
  try {
    const response = await fetch('https://en.wikipedia.org/wiki/List_of_unicorn_startup_companies');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const companies = new Set();
    
    $('table.wikitable').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length > 0) {
          const companyName = $(cells[0]).text().trim();
          if (companyName && companyName.length > 0 && companyName.length < 50) {
            companies.add(companyName);
          }
        }
      });
    });
    
    const result = Array.from(companies);
    console.log(`  Found ${result.length} Unicorn startups`);
    return result;
  } catch (error) {
    console.error('  Error fetching Unicorns:', error.message);
    return [];
  }
}

/**
 * Fetch Y Combinator companies (multi-page scrape)
 */
export async function fetchYCCompanies() {
  console.log('Fetching Y Combinator companies...');
  try {
    const companies = new Set();
    
    // Try main YC directory
    const response = await fetch('https://www.ycombinator.com/companies');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Try multiple selectors
    $('a[href*="/companies/"]').each((i, elem) => {
      const name = $(elem).text().trim();
      if (name && name.length > 2 && name.length < 50 && !name.includes('http')) {
        companies.add(name);
      }
    });
    
    $('div[class*="company"]').each((i, elem) => {
      const name = $(elem).find('h3, h4, .company-name').first().text().trim();
      if (name && name.length > 2 && name.length < 50) {
        companies.add(name);
      }
    });
    
    // Also try YC top companies list
    try {
      const topResponse = await fetch('https://www.ycombinator.com/topcompanies');
      const topHtml = await topResponse.text();
      const $top = cheerio.load(topHtml);
      
      $top('a[href*="/companies/"]').each((i, elem) => {
        const name = $top(elem).text().trim();
        if (name && name.length > 2 && name.length < 50 && !name.includes('http')) {
          companies.add(name);
        }
      });
    } catch (e) {
      // Ignore if top companies page fails
    }
    
    const result = Array.from(companies);
    console.log(`  Found ${result.length} YC companies`);
    return result;
  } catch (error) {
    console.error('  Error fetching YC companies:', error.message);
    return [];
  }
}

/**
 * Fetch GitHub Trending repositories
 */
export async function fetchGitHubTrending() {
  console.log('Fetching GitHub Trending...');
  try {
    const companies = new Set();
    
    // Fetch trending repos
    const response = await fetch('https://github.com/trending');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('h2.h3 a').each((i, elem) => {
      const fullName = $(elem).attr('href');
      if (fullName) {
        const parts = fullName.split('/');
        if (parts.length >= 3) {
          const repoName = parts[2].trim();
          if (repoName && repoName.length > 2 && repoName.length < 50) {
            companies.add(repoName);
          }
        }
      }
    });
    
    const result = Array.from(companies);
    console.log(`  Found ${result.length} GitHub Trending repos`);
    return result;
  } catch (error) {
    console.error('  Error fetching GitHub Trending:', error.message);
    return [];
  }
}

/**
 * Get custom AI buzzwords
 */
export function getCustomBuzzwords() {
  return [
    'Optimus',
    'FSD',
    'Grok',
    'Sora',
    'Claude',
    'Neuralink',
    'xAI',
    'Starlink'
  ];
}

/**
 * Fetch all data sources in parallel
 */
export async function fetchAllSources() {
  console.log('\n=== Fetching All Data Sources ===\n');
  
  const [
    fortuneGlobal,
    fortuneUS,
    sp500,
    unicorns,
    ycCompanies,
    githubTrending,
    buzzwords
  ] = await Promise.all([
    fetchFortuneGlobal500(),
    fetchFortuneUS500(),
    fetchSP500(),
    fetchUnicorns(),
    fetchYCCompanies(),
    fetchGitHubTrending(),
    Promise.resolve(getCustomBuzzwords())
  ]);
  
  // Combine all sources
  const allNames = [
    ...fortuneGlobal,
    ...fortuneUS,
    ...sp500,
    ...unicorns,
    ...ycCompanies,
    ...githubTrending,
    ...buzzwords
  ];
  
  console.log(`\n=== Data Collection Summary ===`);
  console.log(`Fortune Global 500: ${fortuneGlobal.length}`);
  console.log(`Fortune US 500: ${fortuneUS.length}`);
  console.log(`S&P 500: ${sp500.length}`);
  console.log(`Unicorns: ${unicorns.length}`);
  console.log(`YC Companies: ${ycCompanies.length}`);
  console.log(`GitHub Trending: ${githubTrending.length}`);
  console.log(`Custom Buzzwords: ${buzzwords.length}`);
  console.log(`Total (before deduplication): ${allNames.length}`);
  
  return allNames;
}
