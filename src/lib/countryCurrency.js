// ISO 3166 alpha-2 country code → ISO 4217 currency code.
// Used to derive a visitor's currency from their detected country.
const COUNTRY_CURRENCY = {
  AE: 'AED', AF: 'AFN', AL: 'ALL', AM: 'AMD', AO: 'AOA', AR: 'ARS', AT: 'EUR',
  AU: 'AUD', AZ: 'AZN', BA: 'BAM', BB: 'BBD', BD: 'BDT', BE: 'EUR', BF: 'XOF',
  BG: 'BGN', BH: 'BHD', BI: 'BIF', BJ: 'XOF', BN: 'BND', BO: 'BOB', BR: 'BRL',
  BS: 'BSD', BW: 'BWP', BY: 'BYN', BZ: 'BZD', CA: 'CAD', CD: 'CDF', CF: 'XAF',
  CG: 'XAF', CH: 'CHF', CI: 'XOF', CL: 'CLP', CM: 'XAF', CN: 'CNY', CO: 'COP',
  CR: 'CRC', CU: 'CUP', CV: 'CVE', CY: 'EUR', CZ: 'CZK', DE: 'EUR', DJ: 'DJF',
  DK: 'DKK', DO: 'DOP', DZ: 'DZD', EC: 'USD', EE: 'EUR', EG: 'EGP', ER: 'ERN',
  ES: 'EUR', ET: 'ETB', FI: 'EUR', FJ: 'FJD', FR: 'EUR', GA: 'XAF', GB: 'GBP',
  GE: 'GEL', GH: 'GHS', GM: 'GMD', GN: 'GNF', GR: 'EUR', GT: 'GTQ', GY: 'GYD',
  HK: 'HKD', HN: 'HNL', HR: 'EUR', HT: 'HTG', HU: 'HUF', ID: 'IDR', IE: 'EUR',
  IL: 'ILS', IN: 'INR', IQ: 'IQD', IR: 'IRR', IS: 'ISK', IT: 'EUR', JM: 'JMD',
  JO: 'JOD', JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KR: 'KRW', KW: 'KWD',
  KZ: 'KZT', LA: 'LAK', LB: 'LBP', LK: 'LKR', LR: 'LRD', LS: 'LSL', LT: 'EUR',
  LU: 'EUR', LV: 'EUR', LY: 'LYD', MA: 'MAD', MD: 'MDL', ME: 'EUR', MG: 'MGA',
  MK: 'MKD', ML: 'XOF', MM: 'MMK', MN: 'MNT', MO: 'MOP', MR: 'MRU', MT: 'EUR',
  MU: 'MUR', MV: 'MVR', MW: 'MWK', MX: 'MXN', MY: 'MYR', MZ: 'MZN', NA: 'NAD',
  NE: 'XOF', NG: 'NGN', NI: 'NIO', NL: 'EUR', NO: 'NOK', NP: 'NPR', NZ: 'NZD',
  OM: 'OMR', PA: 'PAB', PE: 'PEN', PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN',
  PT: 'EUR', PY: 'PYG', QA: 'QAR', RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF',
  SA: 'SAR', SC: 'SCR', SD: 'SDG', SE: 'SEK', SG: 'SGD', SI: 'EUR', SK: 'EUR',
  SL: 'SLL', SN: 'XOF', SO: 'SOS', SR: 'SRD', SS: 'SSP', SV: 'USD', SY: 'SYP',
  SZ: 'SZL', TD: 'XAF', TG: 'XOF', TH: 'THB', TJ: 'TJS', TM: 'TMT', TN: 'TND',
  TR: 'TRY', TT: 'TTD', TW: 'TWD', TZ: 'TZS', UA: 'UAH', UG: 'UGX', US: 'USD',
  UY: 'UYU', UZ: 'UZS', VE: 'VES', VN: 'VND', YE: 'YER', ZA: 'ZAR', ZM: 'ZMW',
  ZW: 'ZWL',
}

export function currencyForCountry(code) {
  if (!code) return null
  return COUNTRY_CURRENCY[String(code).toUpperCase()] || null
}
