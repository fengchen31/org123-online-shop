import { NextRequest, NextResponse } from 'next/server';

// 各國家的知名 Twitter 帳號 (粉絲數最多)
const COUNTRY_CELEBRITIES: Record<string, string[]> = {
  US: ['elonmusk', 'BarackObama', 'taylorswift13', 'rihanna', 'Cristiano', 'ladygaga'],
  TW: ['realDonaldTrump', 'katyperry', 'justinbieber', 'KimKardashian', 'selenagomez', 'shakira'],
  CN: ['elonmusk', 'BarackObama', 'taylorswift13', 'rihanna', 'Cristiano', 'ladygaga'],
  JP: ['BillGates', 'narendramodi', 'Cristiano', 'nytimes', 'CNN', 'NASA'],
  KR: ['BTS_twt', 'BLACKPINK', 'BillGates', 'NASA', 'CNN', 'nytimes'],
  GB: ['elonmusk', 'BarackObama', 'Cristiano', 'BillGates', 'NASA', 'CNN'],
  FR: ['elonmusk', 'BarackObama', 'Cristiano', 'NASA', 'CNN', 'nytimes'],
  DE: ['elonmusk', 'BarackObama', 'Cristiano', 'NASA', 'CNN', 'BillGates'],
  IN: ['narendramodi', 'BillGates', 'elonmusk', 'Cristiano', 'NASA', 'CNN'],
  BR: ['neymarjr', 'Cristiano', 'elonmusk', 'BarackObama', 'NASA', 'CNN'],
  CA: ['JustinTrudeau', 'elonmusk', 'BarackObama', 'Cristiano', 'NASA', 'CNN'],
  AU: ['elonmusk', 'BarackObama', 'Cristiano', 'NASA', 'BillGates', 'CNN'],
  // 預設
  DEFAULT: ['elonmusk', 'BarackObama', 'taylorswift13', 'Cristiano', 'NASA', 'BillGates']
};

// 各國家人口數 (2024年估計)
const COUNTRY_POPULATION: Record<string, number> = {
  US: 335000000,      // 美國
  TW: 23900000,       // 台灣
  CN: 1425000000,     // 中國
  JP: 125000000,      // 日本
  KR: 52000000,       // 韓國
  GB: 67000000,       // 英國
  FR: 68000000,       // 法國
  DE: 84000000,       // 德國
  IN: 1428000000,     // 印度
  BR: 216000000,      // 巴西
  CA: 39000000,       // 加拿大
  AU: 26000000,       // 澳洲
  IT: 59000000,       // 義大利
  ES: 48000000,       // 西班牙
  MX: 128000000,      // 墨西哥
  ID: 277000000,      // 印尼
  NL: 18000000,       // 荷蘭
  SA: 36000000,       // 沙烏地阿拉伯
  TR: 85000000,       // 土耳其
  PL: 38000000,       // 波蘭
  // 預設 (全球)
  DEFAULT: 8000000000
};

// 國家名稱
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  TW: 'Taiwan',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  IN: 'India',
  BR: 'Brazil',
  CA: 'Canada',
  AU: 'Australia',
  IT: 'Italy',
  ES: 'Spain',
  MX: 'Mexico',
  ID: 'Indonesia',
  NL: 'Netherlands',
  SA: 'Saudi Arabia',
  TR: 'Turkey',
  PL: 'Poland',
  DEFAULT: 'World'
};

export async function GET(request: NextRequest) {
  try {
    // 從 headers 取得 IP (Vercel 會提供)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';

    // 獲取國家代碼 (從 Vercel 的 geo header)
    const country = request.headers.get('x-vercel-ip-country') || 'US';

    // 獲取該國家的名人帳號
    const celebrities = COUNTRY_CELEBRITIES[country] || COUNTRY_CELEBRITIES.DEFAULT;

    // 生成 Twitter avatar URLs
    const avatars = celebrities.map((username) => ({
      username,
      avatarUrl: `https://unavatar.io/twitter/${username}`,
      profileUrl: `https://twitter.com/${username}`
    }));

    // 獲取該國家的人口數
    const population = COUNTRY_POPULATION[country] || COUNTRY_POPULATION.DEFAULT;
    const countryName = COUNTRY_NAMES[country] || COUNTRY_NAMES.DEFAULT;

    return NextResponse.json({
      country,
      countryName,
      ip,
      population,
      avatars
    });
  } catch (error) {
    console.error('Error fetching country fans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country fans' },
      { status: 500 }
    );
  }
}
