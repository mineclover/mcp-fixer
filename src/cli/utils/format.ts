import chalk from 'chalk';
import { table } from 'table';

export function formatOutput(data: any, format: string = 'table') {
  if (!data) return;

  switch (format) {
    case 'json':
      console.log(JSON.stringify(data, null, 2));
      break;

    case 'csv':
      formatCsv(data);
      break;

    case 'table':
    default:
      formatTable(data);
      break;
  }
}

function formatTable(data: any) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log(chalk.yellow('No data to display'));
      return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(h => String(item[h] ?? '')));
    
    const tableData = [headers, ...rows];
    console.log(table(tableData));
  } else if (typeof data === 'object') {
    const tableData = Object.entries(data).map(([key, value]) => [
      chalk.cyan(key),
      String(value ?? '')
    ]);
    
    console.log(table(tableData));
  } else {
    console.log(data);
  }
}

function formatCsv(data: any) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return;
    }

    const headers = Object.keys(data[0]);
    console.log(headers.join(','));
    
    data.forEach(item => {
      const values = headers.map(h => {
        const value = item[h];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value ?? '');
      });
      console.log(values.join(','));
    });
  } else if (typeof data === 'object') {
    console.log('key,value');
    Object.entries(data).forEach(([key, value]) => {
      const valueStr = String(value ?? '');
      if (valueStr.includes(',') || valueStr.includes('"')) {
        console.log(`${key},"${valueStr.replace(/"/g, '""')}"`);
      } else {
        console.log(`${key},${valueStr}`);
      }
    });
  } else {
    console.log(data);
  }
}