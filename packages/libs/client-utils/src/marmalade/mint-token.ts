import type { IPactModules, PactReturnType } from '@kadena/client';
import { Pact, readKeyset } from '@kadena/client';
import {
  addKeyset,
  addSigner,
  composePactCommand,
  execution,
  setMeta,
} from '@kadena/client/fp';
import type { ChainId, IPactDecimal } from '@kadena/types';
import { submitClient } from '../core';
import type { IClientConfig } from '../core/utils/helpers';

interface IMintTokenInput {
  tokenId: string;
  creatorAccount: string;
  chainId: ChainId;
  guard: {
    account: string;
    keyset: {
      keys: string[];
      pred: 'keys-all' | 'keys-2' | 'keys-any';
    };
  };
  amount: IPactDecimal;
}

const mintTokenCommand = ({
  tokenId,
  creatorAccount,
  chainId,
  guard,
  amount,
}: IMintTokenInput) =>
  composePactCommand(
    execution(
      Pact.modules['marmalade-v2.ledger'].mint(
        tokenId,
        creatorAccount,
        readKeyset('guard'),
        amount,
      ),
    ),
    addKeyset('guard', guard.keyset.pred, ...guard.keyset.keys),
    addSigner(guard.keyset.keys, (signFor) => [
      signFor('coin.GAS'),
      signFor('marmalade-v2.ledger.MINT', tokenId, creatorAccount, amount),
    ]),
    setMeta({ senderAccount: guard.account, chainId }),
  );

export const mintToken = (inputs: IMintTokenInput, config: IClientConfig) =>
  submitClient<PactReturnType<IPactModules['marmalade-v2.ledger']['mint']>>(
    config,
  )(mintTokenCommand(inputs));