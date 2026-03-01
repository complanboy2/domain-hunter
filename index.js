import { promises as dns } from 'dns';
import { writeFileSync } from 'fs';
import pLimit from 'p-limit';
import { getTodaysBatch } from './keywords.js';
import { sendEmail } from './mailer.js';

const TLDS = ['.com', '.app', '.ai', '.so'];
const CONCURRENCY = 2;
const DELAY_MS = 1200;

// Status constants
const STATUS = {
  AVAILABLE: 'AVAILABLE',
  REGISTERED: 'REGISTERED',
  POSSIBLE_AVAILABLE: 'POSSIBLE_AVAILABLE'
};

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check domain availability via RDAP
 */
async function checkRDAP(domain) {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: {
        'Accept': 'application/rdap+json'
      },
      timeout: 10000
    });
    
    // 404 = domain not found = available
    if (response.status === 404) {
      return STATUS.AVAILABLE;
    }
    
    // 200 = domain found = registered
    if (response.status === 200) {
      const data = await response.json();
      
      // Check if domain has status indicating it's registered
      if (data.status && Array.isArray(data.status)) {
        const hasActive = data.status.some(s => 
          s.toLowerCase().includes('active') || 
          s.toLowerCase().includes('ok')
        );
        if (hasActive) {
          return STATUS.REGISTERED;
        }
      }
      
      // If we have entities or nameservers, it's registered
      if (data.entities || data.nameservers) {
        return STATUS.REGISTERED;
      }
      
      // Otherwise unclear
      return null;
    }
    
    // Other status codes are unclear
    return null;
  } catch (error) {
    // Network errors or timeouts
    return null;
  }
}

/**
 * Check domain availability via DNS NS lookup (fallback)
 */
async function checkDNS(domain) {
  try {
    const nameservers = await dns.resolveNs(domain);
    // If we get nameservers, domain is registered
    return nameservers && nameservers.length > 0 ? STATUS.REGISTERED : STATUS.AVAILABLE;
  } catch (error) {
    // ENOTFOUND or ENODATA means domain likely available
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return STATUS.AVAILABLE;
    }
    // Other errors are unclear
    return null;
  }
}

/**
 * Check domain availability with RDAP + DNS fallback
 */
async function checkDomain(domain) {
  console.log(`Checking: ${domain}`);
  
  // Try RDAP first
  let status = await checkRDAP(domain);
  
  // If RDAP is unclear, try DNS
  if (status === null) {
    console.log(`  RDAP unclear, trying DNS for ${domain}`);
    status = await checkDNS(domain);
  }
  
  // If still unclear, mark as POSSIBLE_AVAILABLE
  if (status === null) {
    status = STATUS.POSSIBLE_AVAILABLE;
  }
  
  console.log(`  ${domain}: ${status}`);
  
  // Add delay to respect rate limits
  await sleep(DELAY_MS);
  
  return {
    domain,
    status
  };
}

/**
 * Generate all domain combinations
 */
function generateDomains(keywords) {
  const domains = [];
  
  for (const keyword of keywords) {
    for (const tld of TLDS) {
      domains.push({
        base: keyword,
        domain: `${keyword}${tld}`,
        tld
      });
    }
  }
  
  return domains;
}

/**
 * Group results by base name
 */
function groupByBase(results) {
  const grouped = {};
  
  for (const result of results) {
    if (!grouped[result.base]) {
      grouped[result.base] = [];
    }
    grouped[result.base].push(result);
  }
  
  return grouped;
}

/**
 * Filter groups to include only those with at least one non-REGISTERED domain
 */
function filterInterestingGroups(grouped) {
  const interesting = {};
  
  for (const [base, results] of Object.entries(grouped)) {
    const hasNonRegistered = results.some(r => r.status !== STATUS.REGISTERED);
    if (hasNonRegistered) {
      interesting[base] = results;
    }
  }
  
  return interesting;
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Domain Hunter Started ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Delay: ${DELAY_MS}ms`);
  console.log('');
  
  // Get today's batch of keywords
  const keywords = await getTodaysBatch(200);
  
  if (keywords.length === 0) {
    console.log('No keywords to process');
    return;
  }
  
  // Generate all domain combinations
  const domainList = generateDomains(keywords);
  console.log(`\nTotal domains to check: ${domainList.length}`);
  console.log('');
  
  // Set up concurrency limiter
  const limit = pLimit(CONCURRENCY);
  
  // Check all domains
  const startTime = Date.now();
  const results = await Promise.all(
    domainList.map(({ base, domain }) => 
      limit(async () => {
        const result = await checkDomain(domain);
        return { ...result, base };
      })
    )
  );
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
  
  // Group by base name
  const grouped = groupByBase(results);
  
  // Filter to only interesting groups (at least one non-REGISTERED)
  const interesting = filterInterestingGroups(grouped);
  
  // Count statistics
  const totalAvailable = results.filter(r => r.status === STATUS.AVAILABLE).length;
  const totalPossible = results.filter(r => r.status === STATUS.POSSIBLE_AVAILABLE).length;
  const totalRegistered = results.filter(r => r.status === STATUS.REGISTERED).length;
  
  console.log('');
  console.log('=== Results Summary ===');
  console.log(`Total domains checked: ${results.length}`);
  console.log(`Available: ${totalAvailable}`);
  console.log(`Possible Available: ${totalPossible}`);
  console.log(`Registered: ${totalRegistered}`);
  console.log(`Interesting base names: ${Object.keys(interesting).length}`);
  console.log(`Duration: ${duration} minutes`);
  console.log('');
  
  // Only write CSV if we found interesting results
  if (Object.keys(interesting).length > 0) {
    console.log('=== Interesting Domains ===\n');
    
    // Build CSV
    const csvRows = ['base,domain,status'];
    
    for (const [base, domainResults] of Object.entries(interesting)) {
      console.log(`${base}:`);
      for (const result of domainResults) {
        console.log(`  ${result.domain}: ${result.status}`);
        csvRows.push(`${base},${result.domain},${result.status}`);
      }
    }
    
    // Write CSV
    const filename = 'results.csv';
    writeFileSync(filename, csvRows.join('\n'));
    console.log(`\nResults written to ${filename}`);
    
    // Send email notification
    try {
      await sendEmail(
        Object.keys(interesting).length,
        totalAvailable,
        totalPossible,
        interesting
      );
      console.log('Email notification sent');
    } catch (error) {
      console.error('Failed to send email:', error.message);
    }
  } else {
    console.log('No interesting domains found - skipping CSV output');
  }
  
  console.log('\n=== Domain Hunter Completed ===');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
