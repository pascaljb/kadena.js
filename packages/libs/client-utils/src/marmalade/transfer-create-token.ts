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
import { submitClient } from '../core/client-helpers';
import type { IClientConfig } from '../core/utils/helpers';

interface ITransferCreateTokenInput {
  tokenId: string;
  chainId: ChainId;
  sender: {
    account: string;
    keyset: {
      keys: string[];
      pred: 'keys-all' | 'keys-2' | 'keys-any';
    };
  };
  receiver: {
    account: string;
    keyset: {
      keys: string[];
      pred: 'keys-all' | 'keys-2' | 'keys-any';
    };
  };
  amount: IPactDecimal;
}

const createTransferTokenCommand = ({
  tokenId,
  chainId,
  sender,
  receiver,
  amount,
}: ITransferCreateTokenInput) =>
  composePactCommand(
    execution(
      Pact.modules['marmalade-v2.ledger']['transfer-create'](
        tokenId,
        sender.account,
        receiver.account,
        readKeyset('receiver-guard'),
        amount,
      ),
    ),
    addKeyset('receiver-guard', receiver.keyset.pred, ...receiver.keyset.keys),
    addSigner(sender.keyset.keys, (signFor) => [
      signFor('coin.GAS'),
      signFor(
        'marmalade-v2.ledger.TRANSFER',
        tokenId,
        sender.account,
        receiver.account,
        amount,
      ),
    ]),
    setMeta({ senderAccount: sender.account, chainId }),
  );

export const transferCreateToken = (
  inputs: ITransferCreateTokenInput,
  config: IClientConfig,
) =>
  submitClient<
    PactReturnType<IPactModules['marmalade-v2.ledger']['transfer-create']>
  >(config)(createTransferTokenCommand(inputs));