import { getMenu } from 'lib/shopify';
import { FacebookHeaderClient } from './facebook-header-client';

export async function FacebookHeader() {
  const menu = await getMenu('next-js-frontend-header-menu');

  return <FacebookHeaderClient menu={menu} />;
}
