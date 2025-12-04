'use client';

import clsx from 'clsx';
import { useCurrency } from './currency-context';

const Price = ({
  amount,
  className,
  currencyCode = 'USD',
  currencyCodeClassName
}: {
  amount: string;
  className?: string;
  currencyCode: string;
  currencyCodeClassName?: string;
} & React.ComponentProps<'p'>) => {
  const { convertPrice, currency } = useCurrency();

  // 轉換價格到當前選擇的貨幣
  const converted = convertPrice(amount, currencyCode);

  return (
    <p suppressHydrationWarning={true} className={className}>
      {`${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: converted.currency,
        currencyDisplay: 'narrowSymbol'
      }).format(parseFloat(converted.amount))}`}
      <span className={clsx('ml-1 inline', currencyCodeClassName)}>{`${converted.currency}`}</span>
    </p>
  );
};

export default Price;
