import nodemailer from 'nodemailer';

/**
 * Send email notification with available domains
 */
export async function sendEmail(baseCount, availableCount, possibleCount, interestingGroups) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables must be set');
  }
  
  // Create transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
  
  // Format domain groups for email
  const groupsArray = Object.entries(interestingGroups).slice(0, 30); // Limit to first 30 groups
  const moreCount = Object.keys(interestingGroups).length > 30 ? Object.keys(interestingGroups).length - 30 : 0;
  
  // Build text version
  let textContent = `Domain Hunter has found ${baseCount} interesting base name${baseCount !== 1 ? 's' : ''} with available or possibly available domains!\n\n`;
  textContent += `Summary:\n`;
  textContent += `  • Available: ${availableCount}\n`;
  textContent += `  • Possible Available: ${possibleCount}\n`;
  textContent += `  • Interesting base names: ${baseCount}\n\n`;
  textContent += `Domains:\n\n`;
  
  groupsArray.forEach(([base, results]) => {
    textContent += `${base}:\n`;
    results.forEach(r => {
      textContent += `  ${r.domain}: ${r.status}\n`;
    });
    textContent += '\n';
  });
  
  if (moreCount > 0) {
    textContent += `\n... and ${moreCount} more base names (see results.csv)\n`;
  }
  
  textContent += `\nRun Time: ${new Date().toISOString()}\n\n`;
  textContent += `---\nThis is an automated message from Domain Hunter.\n`;
  textContent += `Check the GitHub Actions run for full details and results.csv file.\n`;
  
  // Build HTML version
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; font-size: 16px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 15px; background: #f0f0f0; border-radius: 8px; flex: 1; margin: 0 5px; }
    .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .domain-group { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
    .domain-group h3 { margin: 0 0 10px 0; color: #333; font-size: 18px; }
    .domain-item { padding: 8px; margin: 5px 0; background: #f7f7f7; border-radius: 4px; display: flex; justify-content: space-between; }
    .domain-name { font-family: monospace; font-weight: bold; }
    .status { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .status-available { background: #4caf50; color: white; }
    .status-possible { background: #ff9800; color: white; }
    .status-registered { background: #9e9e9e; color: white; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .badge { background: #667eea; color: white; padding: 6px 14px; border-radius: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Domain Hunter Alert</h1>
      <p>Found <span class="badge">${baseCount}</span> interesting base name${baseCount !== 1 ? 's' : ''}!</p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-number">${availableCount}</div>
        <div class="stat-label">Available</div>
      </div>
      <div class="stat">
        <div class="stat-number">${possibleCount}</div>
        <div class="stat-label">Possible</div>
      </div>
      <div class="stat">
        <div class="stat-number">${baseCount}</div>
        <div class="stat-label">Base Names</div>
      </div>
    </div>
    
    <div class="content">
      <h2>Interesting Domains:</h2>
`;
  
  groupsArray.forEach(([base, results]) => {
    htmlContent += `
      <div class="domain-group">
        <h3>${base}</h3>
`;
    results.forEach(r => {
      const statusClass = r.status === 'AVAILABLE' ? 'status-available' : 
                         r.status === 'POSSIBLE_AVAILABLE' ? 'status-possible' : 
                         'status-registered';
      htmlContent += `
        <div class="domain-item">
          <span class="domain-name">${r.domain}</span>
          <span class="status ${statusClass}">${r.status}</span>
        </div>
`;
    });
    htmlContent += `
      </div>
`;
  });
  
  if (moreCount > 0) {
    htmlContent += `
      <p style="margin-top: 20px; color: #666; text-align: center;">
        <em>... and ${moreCount} more base names (see results.csv)</em>
      </p>
`;
  }
  
  htmlContent += `
      <p style="margin-top: 20px;"><strong>Run Time:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Domain Hunter.</p>
      <p>Check the GitHub Actions run for full details and the results.csv file.</p>
    </div>
  </div>
</body>
</html>
`;
  
  // Email subject
  const subject = `🎯 Domain Hunter: ${baseCount} Interesting Domain${baseCount !== 1 ? 's' : ''} Found (${availableCount} Available)`;
  
  // Send email
  const info = await transporter.sendMail({
    from: `"Domain Hunter" <${emailUser}>`,
    to: emailUser,
    subject: subject,
    text: textContent,
    html: htmlContent
  });
  
  console.log('Email sent:', info.messageId);
  return info;
}
