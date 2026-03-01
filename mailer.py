import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def send_email(base_count, available_count, possible_count, interesting_groups):
    """Send email notification with available domains"""
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')
    
    if not email_user or not email_pass:
        raise Exception('EMAIL_USER and EMAIL_PASS environment variables must be set')
    
    # Format domain groups for email
    groups_array = list(interesting_groups.items())[:30]  # Limit to first 30 groups
    more_count = len(interesting_groups) - 30 if len(interesting_groups) > 30 else 0
    
    # Build text version
    text_content = f"Domain Hunter has found {base_count} interesting base name{'s' if base_count != 1 else ''} with available or possibly available domains!\n\n"
    text_content += "Summary:\n"
    text_content += f"  • Available: {available_count}\n"
    text_content += f"  • Possible Available: {possible_count}\n"
    text_content += f"  • Interesting base names: {base_count}\n\n"
    text_content += "Domains:\n\n"
    
    for base, results in groups_array:
        text_content += f"{base}:\n"
        for r in results:
            text_content += f"  {r['domain']}: {r['status']}\n"
        text_content += "\n"
    
    if more_count > 0:
        text_content += f"\n... and {more_count} more base names (see results.csv)\n"
    
    text_content += f"\nRun Time: {datetime.now().isoformat()}\n\n"
    text_content += "---\nThis is an automated message from Domain Hunter.\n"
    text_content += "Check the GitHub Actions run for full details and results.csv file.\n"
    
    # Build HTML version
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }}
    .header h1 {{ margin: 0; font-size: 28px; }}
    .header p {{ margin: 10px 0 0 0; font-size: 16px; }}
    .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
    .stat {{ text-align: center; padding: 15px; background: #f0f0f0; border-radius: 8px; flex: 1; margin: 0 5px; }}
    .stat-number {{ font-size: 32px; font-weight: bold; color: #667eea; }}
    .stat-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
    .content {{ background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; }}
    .domain-group {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }}
    .domain-group h3 {{ margin: 0 0 10px 0; color: #333; font-size: 18px; }}
    .domain-item {{ padding: 8px; margin: 5px 0; background: #f7f7f7; border-radius: 4px; display: flex; justify-content: space-between; }}
    .domain-name {{ font-family: monospace; font-weight: bold; }}
    .status {{ padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }}
    .status-available {{ background: #4caf50; color: white; }}
    .status-possible {{ background: #ff9800; color: white; }}
    .status-registered {{ background: #9e9e9e; color: white; }}
    .footer {{ color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }}
    .badge {{ background: #667eea; color: white; padding: 6px 14px; border-radius: 16px; font-weight: bold; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Domain Hunter Alert</h1>
      <p>Found <span class="badge">{base_count}</span> interesting base name{'s' if base_count != 1 else ''}!</p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-number">{available_count}</div>
        <div class="stat-label">Available</div>
      </div>
      <div class="stat">
        <div class="stat-number">{possible_count}</div>
        <div class="stat-label">Possible</div>
      </div>
      <div class="stat">
        <div class="stat-number">{base_count}</div>
        <div class="stat-label">Base Names</div>
      </div>
    </div>
    
    <div class="content">
      <h2>Interesting Domains:</h2>
"""
    
    for base, results in groups_array:
        html_content += f"""
      <div class="domain-group">
        <h3>{base}</h3>
"""
        for r in results:
            status_class = ('status-available' if r['status'] == 'AVAILABLE' else
                          'status-possible' if r['status'] == 'POSSIBLE_AVAILABLE' else
                          'status-registered')
            html_content += f"""
        <div class="domain-item">
          <span class="domain-name">{r['domain']}</span>
          <span class="status {status_class}">{r['status']}</span>
        </div>
"""
        html_content += """
      </div>
"""
    
    if more_count > 0:
        html_content += f"""
      <p style="margin-top: 20px; color: #666; text-align: center;">
        <em>... and {more_count} more base names (see results.csv)</em>
      </p>
"""
    
    html_content += f"""
      <p style="margin-top: 20px;"><strong>Run Time:</strong> {datetime.now().isoformat()}</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Domain Hunter.</p>
      <p>Check the GitHub Actions run for full details and the results.csv file.</p>
    </div>
  </div>
</body>
</html>
"""
    
    # Email subject
    subject = f"🎯 Domain Hunter: {base_count} Interesting Domain{'s' if base_count != 1 else ''} Found ({available_count} Available)"
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'"Domain Hunter" <{email_user}>'
    msg['To'] = email_user
    
    # Attach parts
    part1 = MIMEText(text_content, 'plain')
    part2 = MIMEText(html_content, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Send email via Gmail SMTP
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(email_user, email_pass)
        server.send_message(msg)
    
    print('Email sent successfully')
