#!/usr/bin/env python3
import time
import csv
import sys
import asyncio
import dns.resolver
from datetime import datetime
from keywords import get_todays_batch
from mailer import send_email
import requests

TLDS = ['.com', '.app', '.ai', '.so']
CONCURRENCY = 2
DELAY_MS = 1200

# Status constants
STATUS_AVAILABLE = 'AVAILABLE'
STATUS_REGISTERED = 'REGISTERED'
STATUS_POSSIBLE_AVAILABLE = 'POSSIBLE_AVAILABLE'

def check_rdap(domain):
    """Check domain availability via RDAP"""
    try:
        response = requests.get(
            f'https://rdap.org/domain/{domain}',
            headers={'Accept': 'application/rdap+json'},
            timeout=10
        )
        
        # 404 = domain not found = available
        if response.status_code == 404:
            return STATUS_AVAILABLE
        
        # 200 = domain found = registered
        if response.status_code == 200:
            data = response.json()
            
            # Check if domain has status indicating it's registered
            if 'status' in data and isinstance(data['status'], list):
                has_active = any(
                    'active' in s.lower() or 'ok' in s.lower()
                    for s in data['status']
                )
                if has_active:
                    return STATUS_REGISTERED
            
            # If we have entities or nameservers, it's registered
            if 'entities' in data or 'nameservers' in data:
                return STATUS_REGISTERED
            
            # Otherwise unclear
            return None
        
        # Other status codes are unclear
        return None
    except Exception:
        # Network errors or timeouts
        return None

def check_dns(domain):
    """Check domain availability via DNS NS lookup (fallback)"""
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 5
        nameservers = resolver.resolve(domain, 'NS')
        # If we get nameservers, domain is registered
        return STATUS_REGISTERED if nameservers else STATUS_AVAILABLE
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        # Domain doesn't exist or no NS records = available
        return STATUS_AVAILABLE
    except Exception:
        # Other errors are unclear
        return None

def check_domain(domain):
    """Check domain availability with RDAP + DNS fallback"""
    print(f'Checking: {domain}')
    
    # Try RDAP first
    status = check_rdap(domain)
    
    # If RDAP is unclear, try DNS
    if status is None:
        print(f'  RDAP unclear, trying DNS for {domain}')
        status = check_dns(domain)
    
    # If still unclear, mark as POSSIBLE_AVAILABLE
    if status is None:
        status = STATUS_POSSIBLE_AVAILABLE
    
    print(f'  {domain}: {status}')
    
    # Add delay to respect rate limits
    time.sleep(DELAY_MS / 1000.0)
    
    return {
        'domain': domain,
        'status': status
    }

def generate_domains(keywords):
    """Generate all domain combinations"""
    domains = []
    
    for keyword in keywords:
        for tld in TLDS:
            domains.append({
                'base': keyword,
                'domain': f'{keyword}{tld}',
                'tld': tld
            })
    
    return domains

def group_by_base(results):
    """Group results by base name"""
    grouped = {}
    
    for result in results:
        base = result['base']
        if base not in grouped:
            grouped[base] = []
        grouped[base].append(result)
    
    return grouped

def filter_interesting_groups(grouped):
    """Filter groups to include only those with at least one non-REGISTERED domain"""
    interesting = {}
    
    for base, results in grouped.items():
        has_non_registered = any(r['status'] != STATUS_REGISTERED for r in results)
        if has_non_registered:
            interesting[base] = results
    
    return interesting

def process_domains_sequential(domain_list):
    """Process domains sequentially with rate limiting"""
    results = []
    
    for item in domain_list:
        result = check_domain(item['domain'])
        result['base'] = item['base']
        results.append(result)
    
    return results

def main():
    print('=== Domain Hunter Started ===')
    print(f'Time: {datetime.now().isoformat()}')
    print(f'Concurrency: {CONCURRENCY}')
    print(f'Delay: {DELAY_MS}ms')
    print('')
    
    # Get today's batch of keywords
    keywords = get_todays_batch(200)
    
    if len(keywords) == 0:
        print('No keywords to process')
        return
    
    # Generate all domain combinations
    domain_list = generate_domains(keywords)
    print(f'\nTotal domains to check: {len(domain_list)}')
    print('')
    
    # Check all domains (sequential for simplicity and rate limiting)
    start_time = time.time()
    results = process_domains_sequential(domain_list)
    
    end_time = time.time()
    duration = (end_time - start_time) / 60
    
    # Group by base name
    grouped = group_by_base(results)
    
    # Filter to only interesting groups (at least one non-REGISTERED)
    interesting = filter_interesting_groups(grouped)
    
    # Count statistics
    total_available = sum(1 for r in results if r['status'] == STATUS_AVAILABLE)
    total_possible = sum(1 for r in results if r['status'] == STATUS_POSSIBLE_AVAILABLE)
    total_registered = sum(1 for r in results if r['status'] == STATUS_REGISTERED)
    
    print('')
    print('=== Results Summary ===')
    print(f'Total domains checked: {len(results)}')
    print(f'Available: {total_available}')
    print(f'Possible Available: {total_possible}')
    print(f'Registered: {total_registered}')
    print(f'Interesting base names: {len(interesting)}')
    print(f'Duration: {duration:.2f} minutes')
    print('')
    
    # Only write CSV if we found interesting results
    if len(interesting) > 0:
        print('=== Interesting Domains ===\n')
        
        # Build CSV
        csv_rows = []
        
        for base, domain_results in interesting.items():
            print(f'{base}:')
            for result in domain_results:
                print(f'  {result["domain"]}: {result["status"]}')
                csv_rows.append([base, result['domain'], result['status']])
        
        # Write CSV
        filename = 'results.csv'
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['base', 'domain', 'status'])
            writer.writerows(csv_rows)
        print(f'\nResults written to {filename}')
        
        # Send email notification
        try:
            send_email(
                len(interesting),
                total_available,
                total_possible,
                interesting
            )
            print('Email notification sent')
        except Exception as e:
            print(f'Failed to send email: {e}', file=sys.stderr)
    else:
        print('No interesting domains found - skipping CSV output')
    
    print('\n=== Domain Hunter Completed ===')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'Fatal error: {e}', file=sys.stderr)
        sys.exit(1)
