import { prismaClient } from '@db/prismaClient';
import { getChainFungibleAccount } from '@services/account-service';
import {
  COMPLEXITY,
  getDefaultConnectionComplexity,
} from '@services/complexity';
import { chainIds } from '@utils/chains';
import { dotenv } from '@utils/dotenv';
import { normalizeError } from '@utils/errors';
import { builder } from '../builder';
import { accountDetailsLoader } from '../data-loaders/account-details';
import type {
  ChainFungibleAccount,
  FungibleAccount,
} from '../types/graphql-types';
import {
  ChainFungibleAccountName,
  FungibleAccountName,
} from '../types/graphql-types';

export default builder.node(
  builder.objectRef<FungibleAccount>(FungibleAccountName),
  {
    description: 'A fungible-specific account.',
    id: {
      resolve(parent) {
        return `${FungibleAccountName}/${parent.fungibleName}/${parent.accountName}`;
      },
      // Do not use parse here since there is a bug in the pothos relay plugin which can cause incorrect results. Parse the ID directly in the loadOne function.
    },
    isTypeOf(source) {
      return (source as any).__typename === FungibleAccountName;
    },
    async loadOne(id) {
      try {
        const fungibleName = id.split('/')[1];
        const accountName = id.split('/')[2];

        return {
          __typename: FungibleAccountName,
          accountName,
          fungibleName,
          chainAccounts: [],
          totalBalance: 0,
          transactions: [],
          transfers: [],
        };
      } catch (error) {
        throw normalizeError(error);
      }
    },
    fields: (t) => ({
      accountName: t.exposeString('accountName'),
      fungibleName: t.exposeString('fungibleName'),
      chainAccounts: t.field({
        type: [ChainFungibleAccountName],
        complexity: COMPLEXITY.FIELD.CHAINWEB_NODE * dotenv.CHAIN_COUNT,
        async resolve(parent) {
          try {
            return (
              await Promise.all(
                chainIds.map(async (chainId) => {
                  return await getChainFungibleAccount({
                    chainId: chainId,
                    fungibleName: parent.fungibleName,
                    accountName: parent.accountName,
                  });
                }),
              )
            ).filter(
              (chainAccount) => chainAccount !== null,
            ) as ChainFungibleAccount[];
          } catch (error) {
            throw normalizeError(error);
          }
        },
      }),
      totalBalance: t.field({
        type: 'Decimal',
        complexity: COMPLEXITY.FIELD.CHAINWEB_NODE * dotenv.CHAIN_COUNT,
        async resolve(parent) {
          try {
            return (
              await Promise.all(
                chainIds.map(async (chainId) => {
                  return accountDetailsLoader.load({
                    fungibleName: parent.fungibleName,
                    accountName: parent.accountName,
                    chainId: chainId,
                  });
                }),
              )
            ).reduce((acc, accountDetails) => {
              if (accountDetails !== null) {
                return acc + accountDetails.balance;
              }
              return acc;
            }, 0);
          } catch (error) {
            throw normalizeError(error);
          }
        },
      }),
      transactions: t.prismaConnection({
        type: 'Transaction',
        cursor: 'blockHash_requestKey',
        edgesNullable: false,
        complexity: (args) => ({
          field: getDefaultConnectionComplexity({
            withRelations: true,
            first: args.first,
            last: args.last,
          }),
        }),
        async totalCount(parent) {
          try {
            return await prismaClient.transaction.count({
              where: {
                senderAccount: parent.accountName,
                events: {
                  some: {
                    moduleName: parent.fungibleName,
                  },
                },
              },
            });
          } catch (error) {
            throw normalizeError(error);
          }
        },
        async resolve(query, parent) {
          try {
            return await prismaClient.transaction.findMany({
              ...query,
              where: {
                senderAccount: parent.accountName,
                events: {
                  some: {
                    moduleName: parent.fungibleName,
                  },
                },
              },
              orderBy: {
                height: 'desc',
              },
            });
          } catch (error) {
            throw normalizeError(error);
          }
        },
      }),
      transfers: t.prismaConnection({
        type: 'Transfer',
        cursor: 'blockHash_chainId_orderIndex_moduleHash_requestKey',
        edgesNullable: false,
        complexity: (args) => ({
          field: getDefaultConnectionComplexity({
            first: args.first,
            last: args.last,
          }),
        }),
        async totalCount(parent) {
          try {
            return await prismaClient.transfer.count({
              where: {
                OR: [
                  {
                    senderAccount: parent.accountName,
                  },
                  {
                    receiverAccount: parent.accountName,
                  },
                ],
              },
            });
          } catch (error) {
            throw normalizeError(error);
          }
        },
        async resolve(query, parent) {
          try {
            return await prismaClient.transfer.findMany({
              ...query,
              where: {
                OR: [
                  {
                    senderAccount: parent.accountName,
                  },
                  {
                    receiverAccount: parent.accountName,
                  },
                ],
              },
              orderBy: {
                height: 'desc',
              },
            });
          } catch (error) {
            throw normalizeError(error);
          }
        },
      }),
    }),
  },
);