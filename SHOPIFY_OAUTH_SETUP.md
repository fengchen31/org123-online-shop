# Shopify Customer Account API OAuth 配置指南

本指南將協助您配置 Shopify Customer Account API，讓用戶能夠登入並訪問他們的帳戶資訊、訂單歷史和 wishlist。

## 📋 前置需求

- Shopify Plus 或具有 Customer Account API 權限的商店
- Vercel 或其他 Node.js 主機環境
- 已設置好的 Shopify Storefront API

## 🔧 步驟 1: 在 Shopify Admin 中創建 Customer Account API 應用

### 1.1 創建自訂應用

1. 登入你的 **Shopify Admin**
2. 前往 **Settings** → **Apps and sales channels**
3. 點擊 **Develop apps**
4. 點擊 **Create an app**
5. 輸入應用名稱，例如：`org123.xyz Customer Auth`
6. 點擊 **Create app**

### 1.2 配置 API 權限

1. 在應用頁面，點擊 **Configure**
2. 在 **Customer Account API** 區域，點擊 **Configure**
3. 選擇以下權限：
   - ✅ `read_customer_account` - 讀取客戶資訊
   - ✅ `write_customer_account` - 更新客戶資訊（用於 wishlist metafields）
   - ✅ `read_orders` - 讀取訂單資訊
4. 點擊 **Save**

### 1.3 設置 OAuth Redirect URLs

1. 在同一頁面，找到 **Allowed redirection URL(s)**
2. 添加以下 URLs（根據你的環境調整）：
   ```
   http://localhost:3000/api/auth/callback
   https://your-production-domain.com/api/auth/callback
   ```
3. 點擊 **Save**

### 1.4 安裝應用並獲取憑證

1. 點擊 **Install app** 按鈕
2. 確認安裝
3. 在 **API credentials** 頁面，你會看到：
   - **Client ID** - 複製這個值
   - **Client secret** - 點擊 **Reveal** 並複製

## 🔐 步驟 2: 配置環境變數

在你的專案根目錄創建或更新 `.env` 檔案：

```bash
# Shopify Storefront API (已有的配置)
SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-storefront-token"
SHOPIFY_REVALIDATION_SECRET="your-revalidation-secret"

# Shopify Customer Account API (新增)
SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID="shp_xxxxxxxxxxxxx"
SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET="shpcs_xxxxxxxxxxxxx"
SHOPIFY_CUSTOMER_ACCOUNT_API_URL="https://shopify.com/YOUR_SHOP_ID/account/customer/api/2024-10/graphql"

# NextAuth (用於 session 管理)
NEXTAUTH_SECRET="your-random-secret-string-generate-one"
NEXTAUTH_URL="http://localhost:3000"  # 生產環境改為你的域名
```

### 如何獲取 Shop ID

你的 `SHOPIFY_CUSTOMER_ACCOUNT_API_URL` 格式：
```
https://shopify.com/YOUR_SHOP_ID/account/customer/api/2024-10/graphql
```

**找到 Shop ID 的方法：**

1. 方法一：從 Shopify Admin URL
   - 你的 Admin URL 通常是：`https://admin.shopify.com/store/YOUR_SHOP_ID`
   - 從 URL 中複製 `YOUR_SHOP_ID` 部分

2. 方法二：從 API 響應
   - 在你的 Shopify Admin → Settings → Notifications 中
   - 查看任何 webhook URL，通常會包含 shop ID

### 生成 NEXTAUTH_SECRET

在終端機執行：
```bash
openssl rand -base64 32
```
複製生成的字串到 `NEXTAUTH_SECRET`

## 🏗️ 步驟 3: 實現 OAuth 認證流程

### 3.1 創建登入 API Route

創建檔案：`app/api/auth/shopify-login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID!;
const shopDomain = process.env.SHOPIFY_STORE_DOMAIN!;
const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/';

  // 構建 Shopify OAuth URL
  const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', 'read_customer_account,write_customer_account,read_orders');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', returnTo);

  return NextResponse.redirect(authUrl.toString());
}
```

### 3.2 創建 Callback API Route

創建檔案：`app/api/auth/callback/route.ts`

```typescript
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID!;
const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET!;
const shopDomain = process.env.SHOPIFY_STORE_DOMAIN!;
const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url));
  }

  try {
    // 交換 code 獲取 access token
    const tokenResponse = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // 設置 cookie
    const cookieStore = await cookies();
    cookieStore.set('customerAccessToken', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    // 重定向到原始頁面
    return NextResponse.redirect(new URL(state, req.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }
}
```

### 3.3 更新登入頁面

修改 `app/login/page.tsx`，將 demo login 改為真實的 OAuth 流程：

```typescript
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const error = searchParams.get('error');

  const handleLogin = () => {
    // 重定向到 Shopify OAuth
    window.location.href = `/api/auth/shopify-login?returnTo=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f2f5]">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-[#3b5998]">org123.xyz</h1>
            <p className="text-lg text-gray-600">Sign in to your account</p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Welcome Back</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  {error === 'no_code' && 'Authorization code missing'}
                  {error === 'auth_failed' && 'Authentication failed. Please try again.'}
                </p>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86]"
            >
              Sign in with Shopify
            </button>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-[#3b5998] hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

## 🧪 步驟 4: 測試 OAuth 流程

1. 重啟開發伺服器：
   ```bash
   npm run dev
   ```

2. 訪問 http://localhost:3000/login

3. 點擊 "Sign in with Shopify"

4. 你會被重定向到 Shopify 登入頁面

5. 使用你的 Shopify 客戶帳號登入

6. 授權應用後，會被重定向回你的網站

7. 現在應該可以看到用戶資訊、訂單歷史和 wishlist

## 🚀 步驟 5: 部署到生產環境

### Vercel 部署

1. 在 Vercel Dashboard 中設置環境變數：
   ```bash
   vercel env add SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID
   vercel env add SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET
   vercel env add SHOPIFY_CUSTOMER_ACCOUNT_API_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

2. 更新 `NEXTAUTH_URL` 為你的生產域名：
   ```
   NEXTAUTH_URL=https://your-domain.com
   ```

3. 在 Shopify Admin 的應用設置中，添加生產環境的 redirect URL：
   ```
   https://your-domain.com/api/auth/callback
   ```

4. 部署：
   ```bash
   vercel --prod
   ```

## 🔒 安全注意事項

1. **永遠不要提交 `.env` 到 Git**
   - `.env` 已在 `.gitignore` 中

2. **使用 HTTPS**
   - 生產環境必須使用 HTTPS
   - Vercel 自動提供 SSL

3. **定期更新 NEXTAUTH_SECRET**
   - 如果懷疑洩露，立即更新

4. **驗證 Redirect URLs**
   - 只允許你控制的域名

## 🐛 故障排除

### 問題: "Invalid client_id"
- 檢查 `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID` 是否正確
- 確認應用已在 Shopify Admin 中安裝

### 問題: "Redirect URI mismatch"
- 確認 `NEXTAUTH_URL` 正確
- 在 Shopify 應用設置中添加完整的 callback URL

### 問題: 登入後無法獲取用戶資訊
- 檢查 API 權限是否正確設置
- 確認 `SHOPIFY_CUSTOMER_ACCOUNT_API_URL` 格式正確

### 問題: Cookie 無法設置
- 本地開發：確認使用 `http://localhost:3000`（不是 127.0.0.1）
- 生產環境：確認使用 HTTPS

## 📚 參考資源

- [Shopify Customer Account API 文檔](https://shopify.dev/docs/api/customer)
- [OAuth 2.0 規範](https://oauth.net/2/)
- [NextAuth.js 文檔](https://next-auth.js.org/)

## ✅ 完成確認清單

- [ ] 在 Shopify Admin 創建自訂應用
- [ ] 配置 Customer Account API 權限
- [ ] 設置 OAuth redirect URLs
- [ ] 獲取 Client ID 和 Client Secret
- [ ] 配置所有環境變數
- [ ] 創建登入和 callback API routes
- [ ] 測試本地登入流程
- [ ] 部署到生產環境
- [ ] 測試生產環境登入

---

如有問題，請參考 Shopify Developer 社群或聯繫技術支援。
