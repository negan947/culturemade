export type CountryCode = string;

// Comprehensive ISO 3166-1 alpha-2 codes, plus XK (Kosovo)
export const ALL_COUNTRY_CODES: CountryCode[] = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU','VE','VN','VG','VI','WF','EH','YE','ZM','ZW','XK'
];

// Popular/commonly used; tweak as needed
export const POPULAR_COUNTRY_CODES: CountryCode[] = [
  'US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','IE','RO','JP','SG'
];

export function buildCountryNameMaps(locale?: string) {
  // Fallback to English if locale not available
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en');
  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([userLocale, 'en'], { type: 'region' });
  } catch {
    try {
      displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      displayNames = null;
    }
  }

  const codeToName: Record<string, string> = {};
  const nameToCode: Record<string, string> = {};

  for (const code of ALL_COUNTRY_CODES) {
    const name = displayNames?.of(code) || code;
    codeToName[code] = name;
    nameToCode[name.toUpperCase()] = code;
  }

  // Additional aliases
  nameToCode['UNITED STATES OF AMERICA'] = 'US';
  nameToCode['UK'] = 'GB';
  nameToCode['UNITED KINGDOM'] = 'GB';
  nameToCode['RUSSIA'] = 'RU';
  nameToCode['SOUTH KOREA'] = 'KR';
  nameToCode['NORTH KOREA'] = 'KP';
  nameToCode['COTE D’IVOIRE'] = 'CI';
  nameToCode["COTE D'IVOIRE"] = 'CI';
  nameToCode['CÔTE D’IVOIRE'] = 'CI';
  nameToCode['CÔTE DIVOIRE'] = 'CI';
  nameToCode['MOLDOVA'] = 'MD';
  nameToCode['BOSNIA AND HERZEGOVINA'] = 'BA';
  nameToCode['KOSOVO'] = 'XK';

  return { codeToName, nameToCode };
}


