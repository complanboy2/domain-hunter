import { fetchAllSources } from './dataSources.js';

const AFFIXES = ['ai', 'labs', 'cloud', 'tech'];

/**
 * Normalize company name to domain-safe format
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 25);
}

/**
 * Check if name is valid for domain generation
 */
function isValidName(name) {
  return name.length >= 3 && name.length <= 25;
}

/**
 * Generate domain variations from a base name
 */
function generateVariations(baseName) {
  const variations = new Set();
  const cleanName = normalizeName(baseName);
  
  if (!isValidName(cleanName)) {
    return [];
  }
  
  // Add base name
  variations.add(cleanName);
  
  // Add suffix variations
  AFFIXES.forEach(affix => {
    const withSuffix = `${cleanName}${affix}`;
    if (withSuffix.length <= 25) {
      variations.add(withSuffix);
    }
  });
  
  // Add prefix variations
  AFFIXES.forEach(affix => {
    const withPrefix = `${affix}${cleanName}`;
    if (withPrefix.length <= 25) {
      variations.add(withPrefix);
    }
  });
  
  return Array.from(variations);
}

/**
 * Process all names: deduplicate, normalize, and generate variations
 */
export async function processAllKeywords() {
  console.log('\n=== Processing Keywords ===\n');
  
  // Fetch all sources
  const allNames = await fetchAllSources();
  
  // Deduplicate raw names
  const uniqueNames = Array.from(new Set(allNames));
  console.log(`\nAfter deduplication: ${uniqueNames.length} unique names`);
  
  // Normalize and filter
  const normalizedNames = uniqueNames
    .map(name => normalizeName(name))
    .filter(name => isValidName(name));
  
  const uniqueNormalized = Array.from(new Set(normalizedNames));
  console.log(`After normalization and filtering: ${uniqueNormalized.length} valid names`);
  
  // Generate all variations
  const allVariations = new Set();
  
  for (const name of uniqueNormalized) {
    const variations = generateVariations(name);
    variations.forEach(v => allVariations.add(v));
  }
  
  const result = Array.from(allVariations).sort();
  console.log(`Total variations generated: ${result.length}`);
  
  return result;
}

/**
 * Get batch of keywords for today's run based on day of month
 */
export async function getTodaysBatch(batchSize = 200) {
  console.log('\n=== Determining Today\'s Batch ===\n');
  
  const allKeywords = await processAllKeywords();
  
  // Use day of month (1-31) to rotate through batches
  const now = new Date();
  const dayOfMonth = now.getDate(); // 1-31
  
  const totalBatches = Math.ceil(allKeywords.length / batchSize);
  const currentBatch = (dayOfMonth - 1) % totalBatches;
  
  const startIndex = currentBatch * batchSize;
  const endIndex = Math.min(startIndex + batchSize, allKeywords.length);
  
  const batch = allKeywords.slice(startIndex, endIndex);
  
  console.log(`\n=== Batch Selection ===`);
  console.log(`Total keywords available: ${allKeywords.length}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Total batches: ${totalBatches}`);
  console.log(`Day of month: ${dayOfMonth}`);
  console.log(`Current batch: ${currentBatch + 1}/${totalBatches}`);
  console.log(`Range: ${startIndex} to ${endIndex}`);
  console.log(`Keywords in this batch: ${batch.length}`);
  
  return batch;
}
