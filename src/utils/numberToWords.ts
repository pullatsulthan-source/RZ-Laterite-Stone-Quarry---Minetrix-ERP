/**
 * Converts a number to Indian Currency words (Rupees and Paise)
 * e.g. 16250 -> "Rupees Sixteen Thousand Two Hundred Fifty Only"
 */

const a = [
  '',
  'One ',
  'Two ',
  'Three ',
  'Four ',
  'Five ',
  'Six ',
  'Seven ',
  'Eight ',
  'Nine ',
  'Ten ',
  'Eleven ',
  'Twelve ',
  'Thirteen ',
  'Fourteen ',
  'Fifteen ',
  'Sixteen ',
  'Seventeen ',
  'Eighteen ',
  'Nineteen ',
];

const b = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function inWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + inWords(Math.abs(num));

  let str = '';
  const numStr = ('000000000' + num).slice(-9);

  const crore = parseInt(numStr.substring(0, 2), 10);
  const lakh = parseInt(numStr.substring(2, 4), 10);
  const thousand = parseInt(numStr.substring(4, 6), 10);
  const hundred = parseInt(numStr.substring(6, 7), 10);
  const tens = parseInt(numStr.substring(7, 9), 10);

  if (crore > 0) {
    str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + (crore % 10 !== 0 ? ' ' + a[crore % 10] : ' ')) + 'Crore ';
  }
  if (lakh > 0) {
    str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + (lakh % 10 !== 0 ? ' ' + a[lakh % 10] : ' ')) + 'Lakh ';
  }
  if (thousand > 0) {
    str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + (thousand % 10 !== 0 ? ' ' + a[thousand % 10] : ' ')) + 'Thousand ';
  }
  if (hundred > 0) {
    str += a[hundred] + 'Hundred ';
  }
  if (tens > 0) {
    if (hundred > 0 || thousand > 0 || lakh > 0 || crore > 0) {
      str += 'and ';
    }
    str += (tens < 20 ? a[tens] : b[Math.floor(tens / 10)] + (tens % 10 !== 0 ? ' ' + a[tens % 10] : ' '));
  }

  return str.trim();
}

export function amountToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const parts = Math.abs(amount).toFixed(2).split('.');
  const wholePart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let result = 'Rupees ' + inWords(wholePart);

  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + 'Paise';
  }

  result += ' Only';
  return result;
}

export const numberToWords = amountToWords;
