/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyCode } from '../types.ts';

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
];

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return UNITS[n];

  const tens = Math.floor(n / 10);
  const remainder = n % 10;

  if (tens === 7) {
    if (remainder === 1) return 'soixante-et-onze';
    return `soixante-${UNITS[10 + remainder]}`;
  }

  if (tens === 8) {
    if (remainder === 0) return 'quatre-vingts';
    return `quatre-vingt-${UNITS[remainder]}`;
  }

  if (tens === 9) {
    return `quatre-vingt-${UNITS[10 + remainder]}`;
  }

  if (remainder === 0) return TENS[tens];
  if (remainder === 1 && tens < 8) return `${TENS[tens]}-et-un`;
  return `${TENS[tens]}-${UNITS[remainder]}`;
}

function convertGroup(n: number): string {
  if (n === 0) return '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  let result = '';
  if (hundreds > 0) {
    if (hundreds === 1) {
      result = 'cent';
    } else {
      result = `${UNITS[hundreds]} cent${remainder === 0 ? 's' : ''}`;
    }
  }

  if (remainder > 0) {
    const remStr = convertLessThanThousand(remainder);
    result = result ? `${result} ${remStr}` : remStr;
  }

  return result;
}

export function numberToWordsFrench(amount: number, currency: CurrencyCode = 'XOF'): string {
  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(Math.abs(rounded));
  const decimalPart = Math.round((Math.abs(rounded) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return currency === 'XOF' ? 'Zéro Franc CFA' : currency === 'EUR' ? 'Zéro Euro' : 'Zéro Dollar';
  }

  const billions = Math.floor(integerPart / 1_000_000_000);
  const millions = Math.floor((integerPart % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((integerPart % 1_000_000) / 1_000);
  const remainder = integerPart % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    const bStr = convertGroup(billions);
    parts.push(`${bStr} milliard${billions > 1 ? 's' : ''}`);
  }

  if (millions > 0) {
    const mStr = convertGroup(millions);
    parts.push(`${mStr} million${millions > 1 ? 's' : ''}`);
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mille');
    } else {
      parts.push(`${convertGroup(thousands)} mille`);
    }
  }

  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  let words = parts.join(' ').trim();
  if (!words) words = 'zéro';

  // Capitalize first letter
  words = words.charAt(0).toUpperCase() + words.slice(1);

  // Currency suffix
  let currencyLabel = '';
  let centsLabel = '';
  if (currency === 'XOF') {
    currencyLabel = 'Francs CFA';
  } else if (currency === 'EUR') {
    currencyLabel = integerPart > 1 ? 'Euros' : 'Euro';
    centsLabel = 'Centime';
  } else {
    currencyLabel = integerPart > 1 ? 'Dollars US' : 'Dollar US';
    centsLabel = 'Cent';
  }

  let output = `${words} ${currencyLabel}`;

  if (decimalPart > 0 && currency !== 'XOF') {
    const decWords = convertLessThanThousand(decimalPart);
    output += ` et ${decWords} ${centsLabel}${decimalPart > 1 ? 's' : ''}`;
  }

  return output;
}
