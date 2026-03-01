import re
from datetime import datetime
from data_sources import fetch_all_sources

AFFIXES = ['ai', 'labs', 'cloud', 'tech']

def normalize_name(name):
    """Normalize company name to domain-safe format"""
    return re.sub(r'[^a-z0-9]', '', name.lower())[:25]

def is_valid_name(name):
    """Check if name is valid for domain generation"""
    return 3 <= len(name) <= 25

def generate_variations(base_name):
    """Generate domain variations from a base name"""
    variations = set()
    clean_name = normalize_name(base_name)
    
    if not is_valid_name(clean_name):
        return []
    
    # Add base name
    variations.add(clean_name)
    
    # Add suffix variations
    for affix in AFFIXES:
        with_suffix = f"{clean_name}{affix}"
        if len(with_suffix) <= 25:
            variations.add(with_suffix)
    
    # Add prefix variations
    for affix in AFFIXES:
        with_prefix = f"{affix}{clean_name}"
        if len(with_prefix) <= 25:
            variations.add(with_prefix)
    
    return list(variations)

def process_all_keywords():
    """Process all names: deduplicate, normalize, and generate variations"""
    print('\n=== Processing Keywords ===\n')
    
    # Fetch all sources
    all_names = fetch_all_sources()
    
    # Deduplicate raw names
    unique_names = list(set(all_names))
    print(f'\nAfter deduplication: {len(unique_names)} unique names')
    
    # Normalize and filter
    normalized_names = [normalize_name(name) for name in unique_names]
    normalized_names = [name for name in normalized_names if is_valid_name(name)]
    
    unique_normalized = list(set(normalized_names))
    print(f'After normalization and filtering: {len(unique_normalized)} valid names')
    
    # Generate all variations
    all_variations = set()
    
    for name in unique_normalized:
        variations = generate_variations(name)
        all_variations.update(variations)
    
    result = sorted(list(all_variations))
    print(f'Total variations generated: {len(result)}')
    
    return result

def get_todays_batch(batch_size=5):
    """Get batch of keywords for today's run based on day of month"""
    print('\n=== Determining Today\'s Batch ===\n')
    
    all_keywords = process_all_keywords()
    
    # Use day of month (1-31) to rotate through batches
    now = datetime.now()
    day_of_month = now.day  # 1-31
    
    total_batches = (len(all_keywords) + batch_size - 1) // batch_size
    current_batch = (day_of_month - 1) % total_batches
    
    start_index = current_batch * batch_size
    end_index = min(start_index + batch_size, len(all_keywords))
    
    batch = all_keywords[start_index:end_index]
    
    print(f'\n=== Batch Selection ===')
    print(f'Total keywords available: {len(all_keywords)}')
    print(f'Batch size: {batch_size}')
    print(f'Total batches: {total_batches}')
    print(f'Day of month: {day_of_month}')
    print(f'Current batch: {current_batch + 1}/{total_batches}')
    print(f'Range: {start_index} to {end_index}')
    print(f'Keywords in this batch: {len(batch)}')
    
    return batch
