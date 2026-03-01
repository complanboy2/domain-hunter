import requests
from bs4 import BeautifulSoup
import sys

def fetch_fortune_global_500():
    """Fetch Fortune Global 500 companies from Wikipedia"""
    print('Fetching Fortune Global 500...')
    try:
        response = requests.get('https://en.wikipedia.org/wiki/Fortune_Global_500', timeout=30)
        soup = BeautifulSoup(response.text, 'lxml')
        
        companies = set()
        for table in soup.find_all('table', class_='wikitable'):
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if len(cells) > 1:
                    company_name = cells[1].get_text().strip()
                    if company_name:
                        companies.add(company_name)
        
        result = list(companies)[:500]
        print(f'  Found {len(result)} Fortune Global 500 companies')
        return result
    except Exception as e:
        print(f'  Error fetching Fortune Global 500: {e}', file=sys.stderr)
        return []

def fetch_fortune_us_500():
    """Fetch Fortune US 500 companies from Wikipedia"""
    print('Fetching Fortune US 500...')
    try:
        response = requests.get('https://en.wikipedia.org/wiki/Fortune_500', timeout=30)
        soup = BeautifulSoup(response.text, 'lxml')
        
        companies = set()
        for table in soup.find_all('table', class_='wikitable'):
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if len(cells) > 1:
                    company_name = cells[1].get_text().strip()
                    if company_name:
                        companies.add(company_name)
        
        result = list(companies)[:500]
        print(f'  Found {len(result)} Fortune US 500 companies')
        return result
    except Exception as e:
        print(f'  Error fetching Fortune US 500: {e}', file=sys.stderr)
        return []

def fetch_sp500():
    """Fetch S&P 500 companies from Wikipedia"""
    print('Fetching S&P 500...')
    try:
        response = requests.get('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', timeout=30)
        soup = BeautifulSoup(response.text, 'lxml')
        
        companies = set()
        table = soup.find('table', id='constituents')
        if table:
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if len(cells) > 1:
                    company_name = cells[1].get_text().strip()
                    if company_name:
                        companies.add(company_name)
        
        result = list(companies)
        print(f'  Found {len(result)} S&P 500 companies')
        return result
    except Exception as e:
        print(f'  Error fetching S&P 500: {e}', file=sys.stderr)
        return []

def fetch_unicorns():
    """Fetch Unicorn startups from Wikipedia"""
    print('Fetching Unicorn startups...')
    try:
        response = requests.get('https://en.wikipedia.org/wiki/List_of_unicorn_startup_companies', timeout=30)
        soup = BeautifulSoup(response.text, 'lxml')
        
        companies = set()
        for table in soup.find_all('table', class_='wikitable'):
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if len(cells) > 0:
                    company_name = cells[0].get_text().strip()
                    if company_name and len(company_name) < 50:
                        companies.add(company_name)
        
        result = list(companies)
        print(f'  Found {len(result)} Unicorn startups')
        return result
    except Exception as e:
        print(f'  Error fetching Unicorns: {e}', file=sys.stderr)
        return []

def fetch_yc_companies():
    """Fetch Y Combinator companies"""
    print('Fetching Y Combinator companies...')
    try:
        companies = set()
        
        # Try main YC directory
        response = requests.get('https://www.ycombinator.com/companies', timeout=30)
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Try multiple selectors
        for link in soup.find_all('a', href=True):
            if '/companies/' in link['href']:
                name = link.get_text().strip()
                if name and 2 < len(name) < 50 and 'http' not in name:
                    companies.add(name)
        
        for div in soup.find_all('div', class_=lambda x: x and 'company' in x.lower()):
            for tag in ['h3', 'h4']:
                elem = div.find(tag)
                if elem:
                    name = elem.get_text().strip()
                    if name and 2 < len(name) < 50:
                        companies.add(name)
        
        # Try top companies
        try:
            top_response = requests.get('https://www.ycombinator.com/topcompanies', timeout=30)
            top_soup = BeautifulSoup(top_response.text, 'lxml')
            for link in top_soup.find_all('a', href=True):
                if '/companies/' in link['href']:
                    name = link.get_text().strip()
                    if name and 2 < len(name) < 50 and 'http' not in name:
                        companies.add(name)
        except:
            pass
        
        result = list(companies)
        print(f'  Found {len(result)} YC companies')
        return result
    except Exception as e:
        print(f'  Error fetching YC companies: {e}', file=sys.stderr)
        return []

def fetch_github_trending():
    """Fetch GitHub Trending repositories"""
    print('Fetching GitHub Trending...')
    try:
        response = requests.get('https://github.com/trending', timeout=30)
        soup = BeautifulSoup(response.text, 'lxml')
        
        companies = set()
        for link in soup.select('h2.h3 a'):
            href = link.get('href', '')
            if href:
                parts = href.split('/')
                if len(parts) >= 3:
                    repo_name = parts[2].strip()
                    if repo_name and 2 < len(repo_name) < 50:
                        companies.add(repo_name)
        
        result = list(companies)
        print(f'  Found {len(result)} GitHub Trending repos')
        return result
    except Exception as e:
        print(f'  Error fetching GitHub Trending: {e}', file=sys.stderr)
        return []

def get_custom_buzzwords():
    """Get custom AI buzzwords"""
    return [
        'Optimus',
        'FSD',
        'Grok',
        'Sora',
        'Claude',
        'Neuralink',
        'xAI',
        'Starlink'
    ]

def fetch_all_sources():
    """Fetch all data sources"""
    print('\n=== Fetching All Data Sources ===\n')
    
    fortune_global = fetch_fortune_global_500()
    fortune_us = fetch_fortune_us_500()
    sp500 = fetch_sp500()
    unicorns = fetch_unicorns()
    yc_companies = fetch_yc_companies()
    github_trending = fetch_github_trending()
    buzzwords = get_custom_buzzwords()
    
    all_names = (
        fortune_global +
        fortune_us +
        sp500 +
        unicorns +
        yc_companies +
        github_trending +
        buzzwords
    )
    
    print(f'\n=== Data Collection Summary ===')
    print(f'Fortune Global 500: {len(fortune_global)}')
    print(f'Fortune US 500: {len(fortune_us)}')
    print(f'S&P 500: {len(sp500)}')
    print(f'Unicorns: {len(unicorns)}')
    print(f'YC Companies: {len(yc_companies)}')
    print(f'GitHub Trending: {len(github_trending)}')
    print(f'Custom Buzzwords: {len(buzzwords)}')
    print(f'Total (before deduplication): {len(all_names)}')
    
    return all_names
