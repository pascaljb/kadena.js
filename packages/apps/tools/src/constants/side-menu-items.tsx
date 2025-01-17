import { isDevEnvironment } from '@/utils/isDevEnvironment';
import {
  MonoAnimation,
  MonoQrCodeScanner,
  MonoViewInAr,
} from '@kadena/react-icons/system';
import React from 'react';
import type { ISidebarToolbarItem } from '../types/Layout';
import Routes from './routes';

const menuData: ISidebarToolbarItem[] = [
  {
    title: 'Faucet',
    icon: <MonoQrCodeScanner />,
    href: 'faucet',
    items: [
      {
        title: 'Fund New Account',
        href: Routes.FAUCET_NEW,
      },
      {
        title: 'Fund Existing Account',
        href: Routes.FAUCET_EXISTING,
      },
    ],
  },
  {
    title: 'Transactions',
    icon: <MonoAnimation />,
    href: 'transactions',
    items: [
      {
        title: 'Cross Chain Transfer Tracker',
        href: Routes.CROSS_CHAIN_TRANSFER_TRACKER,
      },
      {
        title: 'Cross Chain Transfer Finisher',
        href: Routes.CROSS_CHAIN_TRANSFER_FINISHER,
      },
      ...(isDevEnvironment
        ? [
            {
              title: 'Transfer',
              href: Routes.TRANSFER,
            },
          ]
        : []),
    ],
  },
];

if (isDevEnvironment) {
  menuData.push({
    title: 'Modules',
    icon: <MonoViewInAr />,
    href: 'modules',
    items: [{ title: 'Explorer', href: Routes.MODULE_EXPLORER }],
  });
}

export { menuData };
