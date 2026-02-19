import fs from 'fs';

/**
 * Helper function to save AI test reports to JSON files
 * @param filename - Name of the report file (e.g., 'ai-score-report.json')
 * @param data - Report data to save
 */
export function saveReport(filename: string, data: any) {
  const aiReportDir = `reports/${process.env.ENV || 'r9int'}/ai`;
  fs.mkdirSync(aiReportDir, { recursive: true });
  fs.writeFileSync(`${aiReportDir}/${filename}`, JSON.stringify(data, null, 2));
}
