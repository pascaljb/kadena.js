---
title: kadena client
description:
  The @kadena/client library provides a TypeScript-based API for interacting
  with smart contracts and the chainweb network. The library includes modules in
  three categories creating transactions, signing transactions, and submitting
  to the network.
menu: Reference
label: Kadena client
order: 4
layout: full
tags: ['TypeScript', 'Kadena', 'Kadena client', 'frontend']
---

# Kadena Client

The `@kadena/client` library provides a TypeScript-based API for interacting
with smart contracts and the Kadena network. The library includes modules in
three categories: creating commands, signing transactions, and interacting with
the network.

Do you only need to interact with the `coin` contract? Then check out
["@kadena/client-utils/coin"](../client-utils/README.md) for a simpler API.

In a nutshell, this library helps you create the command object with the
following structure and also send it to the network and listen for the result of
that.

```typescript
interface ICommand {
  cmd: string; // stringified command <IPactCommand> type
  hash: string; // cmd-hash
  sigs: Array<{ sig: string } | undefined>; // array of signatures
}

interface IPactCommand {
  payload:
    | {
        exec: {
          code: string;
          data: Record<string, unknown>;
        };
      }
    | {
        cont: {
          pactId: string;
          step: number;
          rollback: boolean;
          data?: Record<string, unknown>;
          proof?: string | null;
        };
      };
  meta: {
    chainId: ChainId; // "0" to  "19"
    sender: string;
    gasLimit: number;
    gasPrice: number;
    ttl: number;
    creationTime: number;
  };
  signers: Array<{
    pubKey: string;
    address?: string;
    scheme?: SignerScheme;
    clist?: ICap[];
  }>;
  verifiers?: Array<{
    name: string;
    proof: PactValue;
    clist?: ICap[];
  }>;
  networkId: string;
  nonce: string;
}
```

**Note**: If your use case is simple enough that you can create the JSON
directly, you don't have to use the library. Alternatively, you can just use
some parts of it, not everything.

Do you prefer to learn from code? Then check out
[client-examples](../client-examples/).

Checkout different sections:

- [Install](#install)
- [Pact Modules](#pact-modules)
- [Command Builder](#command-builder)
- [Signing Transactions](#signing-transactions)
- [Communicate With Network](#communicate-with-network)
- [Examples](#complete-and-runnable-examples)

## Install

You can install the library with the following command:

```bash
npm install @kadena/client
```

You can import `@kadena/client` functions into a TypeScript/JavaScript program
with the following statement:

```typescript
import { createClient, Pact } from '@kadena/client';
```

The library also exports functional programming utilities under
`@kadena/client/fp`, which offers more flexibility in the FP paradigm.

```typescript
import { composePactCommand } from '@kadena/client/fp';
```

## Pact Modules

**Goal**: creating pact code for `IPactCommand.payload.exec.code`; skip this
part if your code is just a simple **constant** string.

Interacting with Chainweb - Kadena's blockchain - mostly means calling smart
contract functions. From the client perspective, you need to write Pact code in
a string and set it in the command. Writing the string directly is error-prone
and also more vulnerable to code injection, since there isn't any code
completion and validation. Therefore, we have created `Pact.modules` that offers
three features:

- Type-safe functions
- Pact type conversion
- Avoidance of code injection

You can utilize the function with the following format:

```typescript
import { Pact } from `@kadena/client`;

Pact.modules[`${namespace}.${moduleName}`][functionName](...args);
```

| Parameter | Type        | Description       |
| --------- | ----------- | ----------------- |
| ...args   | PactValue[] | list of arguments |

```typescript
// the pseudo code of PactValue type
type PactValue =
  | string
  | number
  | boolean
  | Date
  | { int: string }
  | { decimal: string }
  | PactValue[]
  | Record<string, PactValue>;
```

### examples

Creating the code for `coin.transfer`

```typescript
import { Pact } from `@kadena/client`;

const code = Pact.modules.coin.transfer("alice", "bob", { decimal: '1.1' });
// code === '(coin.transfer "alice" "bob" 1.1)'

```

Creating the code for `free.my-module.my-function` which converts
list/objects/date to valid pact code.

```typescript
import { Pact } from `@kadena/client`;

const code = Pact.modules["free.my-module"].["my-function"](["first", { time: new Date() }]);
// code === '(free.my-module.my-function ["first" {"time" : (time "2023-07-20T14:55:11Z")} ])'

```

### Create type definition for Pact modules

You can use [@kadena/pactjs-cli](../../tools/pactjs-cli/README.md) tool to
create the type for the module you use, then the TS provides code completion for
the functions and capabilities.

Create a type definition file for `coin` contract

```bash
npx @kadena/pactjs-cli contract-generate --contract coin --api https://api.testnet.chainweb.com/chainweb/0.0/testnet04/chain/0/pact;
```

## Command builder

A command object is a JSON with three keys `cmd`, `hash`, `sig`. Though you can
create the JSON without using this library, using the lib makes the process
easier and more robust for you.

You can use `Pact.builder` to create the command object.

There are two types of commands.

- [Execution](#execution)
- [Continuation](#continuation)

### Execution

**Goal**: creating `IPactCommand.payload.exec.code`.

This includes typical Pact code and also the first step of defpact functions.

```typescript
Pact.builder.execution(...codes): IBuilder
```

| Parameter | Type     | Description   |
| --------- | -------- | ------------- |
| ...code   | string[] | list of codes |

example:

use string code

```typescript
const builder: IBuilder = Pact.builder.execution(
  `(coin.transfer "alice" "bob" 1.1)`,
);
```

using `Pact.modules` for code

```typescript
const builder: IBuilder = Pact.builder.execution(
  Pact.modules.coin.transfer('alice', 'bob', { decimal: '1.1' }),
);
```

### Continuation

**Goal**: creating `IPactCommand.payload.cont`.

This includes a command for the next steps of a defpact (multi-step) function.

```typescript
Pact.builder.continuation(contData): IBuilder
```

| Parameter | Type                                                                                                    | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| contData  | { pactId: string, rollback: boolean, step: number, data?: Record<string, any>, proof?: null \| string } | continuation data; step starts from 0; proof is SPV proof that can be generated by calling `/spv` |

#### Example:

`coin.cross-chain` is a multi-step function (defpact) that burns the token in
the source chain and mints the amount in the target chain. After doing the first
step successfully, you can call the second step by using continuation.

```TS

const builder: IBuilder = Pact.builder.continuation({
  pactId,
  rollback: false,
  step:1,
  proof: spvProof
})

```

### Add Signer

**Goal**: adding `IPactCommand.signers` list

You can use the `addSigner` method to add signer's public keys and capability
list to the command. Later, the Chainweb node can check if all signers signed
the transaction or not.

**Note**: You can call `addSigner` as many times as you want if the transaction
has more signers.

```typescript
Pact.builder.execution(...codes).addSigner(signerOrSignersList, capabilityCallback): IBuilder
```

| Parameter          | Type                                                                                                   | Description                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| signer             | string \| { pubKey: string; scheme?: 'ED25519' \| 'ETH' \| 'WebAuthn'; address?: string;} \| ISigner[] | Public key of the signer or the signer object (this can also be a list of signers if all sign for the same capabilities) |
| capabilityCallback | (signFor) => ReturnType<signFor>[]                                                                     | Allows you to scope the sign to a specific list of capabilities                                                          |

Chainweb supports three schemes of public keys `ED25519`, `WebAuthn`, `ETH`; the
default value is `ED25519`. You can pass just the public key if the scheme is
`ED25519`, otherwise, you need to pass a signer object including pubKey and
scheme.

#### Examples

Adding a signer for coin transfer

```typescript
// ED25519 key
const alicePublicKey =
  'e7f4da07b1d200f6e45aa6492afed6819297a97563859a5f0df9c54f5abd4aab';

Pact.builder
  .execution(Pact.modules.coin.transfer('alice', 'bob', { decimal: '1.1' }))
  .addSigner(alicePublicKey, (signFor) => [
    signFor('coin.TRANSFER', 'alice', 'bob', { decimal: '1.1' }),
  ]);
```

Add a signer with `WebAuthn` scheme

```typescript
Pact.builder
  .execution(Pact.modules.coin.transfer('alice', 'bob', { decimal: '1.1' }))
  .addSigner({ pubKey: webAuthnPublicKey, scheme: 'WebAuthn' }, (signFor) => [
    signFor('coin.TRANSFER', 'alice', 'bob', { decimal: '1.1' }),
  ]);
```

Add a list of signers with no capabilities

```typescript
Pact.builder
  .execution('(free.my-module.my-function)')
  .addSigner([
    'ED25519_publicKey',
    { pubKey: 'WebAuthn_publicKey', scheme: 'WebAuthn' },
  ]);
```

Add a list of signers with similar capabilities

```typescript
Pact.builder
  .execution(Pact.modules.coin.transfer('alice', 'bob', { decimal: '1.1' }))
  // e.g., Alice's account is guarded by two keys
  .addSigner(['first_publicKey', 'second_publicKey'], (signFor) => [
    signFor('coin.TRANSFER', 'alice', 'bob', { decimal: '1.1' }),
  ]);

const equivalentPactCommand = {
  payload: {
    exec: {
      code: '(coin.transfer "alice" "bob" 1.1 )',
      data: {},
    },
  },
  signers: [
    {
      pubKey: 'first_publicKey',
      scheme: 'ED25519',
      clist: [
        { name: 'coin.TRANSFER', args: ['alice', 'bob', { decimal: '1.1' }] },
      ],
    },
    {
      pubKey: 'second_publicKey',
      scheme: 'ED25519',
      clist: [
        { name: 'coin.TRANSFER', args: ['alice', 'bob', { decimal: '1.1' }] },
      ],
    },
  ],
};
```

### Add Data

**Goal**: adding `IPactCommand.payload.exec.data` or
`IPactCommand.payload.cont.data` based on the transaction type

You can use this method to add data to the command, this data is readable in the
smart contract later. you can also use this data in the code you set in the
command.

```typescript
Pact.builder
  .execution(...codes)
  .addData(key, value): IBuilder
```

| Parameter | Type      | Description                  |
| --------- | --------- | ---------------------------- |
| key       | string    | the key associated with data |
| value     | PactValue | data you want to send        |

#### Examples

transfer with parameters in data

```typescript
Pact.builder
  .execution('(coin.transfer (read-string "sender") (read-string "receiver") 1.1)')
  .addData("sender", sender)
  .addData("receiver", sender): IBuilder
```

use transfer create and send the receiver guard

```typescript
Pact.builder
  .execution(
    '(coin.transfer-create "alice" "bob" (read-keyset "bob-guard") 1.1)',
  )
  .addData('bob-guard', {
    keys: ['bob-public-key'],
    pred: 'keys-all',
  });
```

Here are the corrected sections:

### Add Keyset

Since keysets are commonly used data in commands, we provide `addKeyset` as an
alternative to `addData` specifically for adding keysets.

```typescript
Pact.builder
  .execution(...codes)
  .addKeyset(name, pred, ...keys): IBuilder
```

| Parameter | Type                                        | Description                                                                  |
| --------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| name      | string                                      | the name associated with the keyset                                          |
| pred      | "keys-all"\|"keys-2"\| "keys-any" \| string | one of the built-in predicate functions or a user-defined predicate function |
| ...keys   | ...string[]                                 | List of public keys in the keyset                                            |

#### Examples

Transfer create using `readKeyset` helper function

```typescript
Pact.builder
  .execution(
    Pact.modules.coin['transfer-create'](
      'alice',
      'bob',
      readKeyset('bob-guard'),
      { decimal: '1.1' },
    ),
  )
  .addKeyset('bob-guard', 'keys-all', 'bob-public-key');
```

Transfer create as string code

```typescript
Pact.builder
  .execution(
    '(coin.transfer-create "alice" "bob" (readKeyset "bob-guard") 1.1)',
  )
  .addKeyset('bob-guard', 'keys-all', 'bob-public-key');
```

### Set Meta

**Goal**: adding `IPactCommand.meta`

You can use `setMeta` to add metadata to a command.

```typescript
Pact.builder
  .execution(...codes)
  .setMeta(meta): IBuilder
```

| Parameter | Type                                                                                                               | Description         |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- |
| meta      | { chainId: ChainId, senderAccount: string, gasLimit: number, gasPrice: number, ttl: number, creationTime: number } | add metadata object |

#### Metadata

| Property      | Type            | Default value       | description                                                          |
| ------------- | --------------- | ------------------- | -------------------------------------------------------------------- |
| chainId       | `"0"` to `"19"` | `undefined`         | id of chain from "0" to "19"                                         |
| senderAccount | `string`        | `undefined`         | the account address that you want to pay gas from that               |
| gasLimit      | `number`        | `2500`              | maximum amount of gas you allow to be deducted during running the tx |
| gasPrice      | `number`        | `1.0e-8`            | price of each gas unit based on KDA (e.g., 0.0000001)                |
| ttl           | `number`        | `28800`             | ttl (time-to-live) of the tx in seconds; default value is 8 hours    |
| creationTime  | `number`        | `Date.now() / 1000` | transaction creation time in seconds                                 |

#### Examples

```typescript
Pact.builder
  .execution('(coin.transfer "alice" "bob" 1.1)')
  // "bob is paying gas fee"
  .setMeta({ chainId: "02", senderAccount: "bob" }): IBuilder;
```

### Set Nonce

**Goal**: set `IPactCommand.nonce` with your custom nonce; otherwise, it will be
set with `kjs:${timestamp}`

You can use this function to set the nonce for the transaction.

```typescript
Pact.builder.execution(code).setNonce(nonce): IBuilder
```

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| nonce     | string | nonce for the tx |

#### Examples

```typescript
Pact.builder
  .execution('(coin.transfer "alice" "bob" 1.1)')
  // "bob is paying gas fee"
  .setNonce("a-custom-nonce"): IBuilder;
```

### Set Network Id

**Goal**: set `IPactCommand.network`

You can use this function to set the network for the transaction.

```typescript
Pact.builder.execution(code).setNetworkId(networkId): IBuilder
```

| Parameter | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| networkId | string | network Id (e.g., "mainnet01", "testnet04") |

#### Examples

```typescript
Pact.builder
  .execution('(coin.transfer "alice" "bob" 1.1)')
  // "bob is paying gas fee"
  .setNetworkId("testnet04"): IBuilder;
```

### Create Transaction

After setting all parts of the command, you can create the transaction object by
calling `createTransaction` method. This will also add all default values to the
command, stringify `cmd`, and add the hash as well. You need to add signatures
to this object via a wallet - check out [wallet-providers](#wallet-providers) -
in order to submit it to the blockchain.

```typescript
const transaction: IUnsignedCommand = Pact.builder
  .execution(code)
  .createTransaction(); // : { cmd:"stringified-command" , hash:"command-hash" , sig: [] };
```

### Examples

```typescript
const transaction = Pact.builder
  .execution(Pact.modules.coin.transfer(senderAccount, receiverAccount, amount))
  .addSigner(senderKey, (signFor) => [
    signFor('coin.GAS'),
    signFor('coin.TRANSFER', senderAccount, receiverAccount, amount),
  ])
  .setMeta({ chainId: '0', senderAccount })
  .setNetworkId(NETWORK_ID)
  .createTransaction();

const output = {
  cmd: '{"payload":{"exec":{"code":"(coin.transfer \\"k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46\\" \\"k:2f48080efe54e6eb670487f664bcaac7684b4ebfcfc8a3330ef080c9c97f7e11\\" 1.0)","data":{}}},"nonce":"kjs:nonce:1711376792115","signers":[{"pubKey":"dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46","scheme":"ED25519","clist":[{"name":"coin.GAS","args":[]},{"name":"coin.TRANSFER","args":["k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46","k:2f48080efe54e6eb670487f664bcaac7684b4ebfcfc8a3330ef080c9c97f7e11",{"decimal":"1"}]}]}],"meta":{"gasLimit":2500,"gasPrice":1e-8,"sender":"k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46","ttl":28800,"creationTime":1711376792,"chainId":"0"},"networkId":"testnet04"}',
  hash: 'xYePm_YgO6-T9yIlCZWzOt2s4CkZcQwqWx9Iu5tVSLI',
  sigs: [undefined],
};
```

### Create Pact Command

If you prefer to have the non-stringified version of the command, you can use
`getCommand`.

```typescript
const transaction: IPactCommand = Pact.builder.execution(code).getCommand();
```

#### Examples

```typescript
const command = Pact.builder
  .execution(Pact.modules.coin.transfer(senderAccount, receiverAccount, amount))
  .addSigner(senderKey, (signFor) => [
    signFor('coin.GAS'),
    signFor('coin.TRANSFER', senderAccount, receiverAccount, amount),
  ])
  .setMeta({ chainId: '0', senderAccount })
  .setNetworkId(NETWORK_ID)
  .getCommand();

const output = {
  payload: {
    exec: {
      code: '(coin.transfer "k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46" "k:2f48080efe54e6eb670487f664bcaac7684b4ebfcfc8a3330ef080c9c97f7e11" 1.0)',
      data: {},
    },
  },
  nonce: 'kjs:nonce:1711448853909',
  signers: [
    {
      pubKey:
        'dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46',
      scheme: 'ED25519',
      clist: [
        { name: 'coin.GAS', args: [] },
        {
          name: 'coin.TRANSFER',
          args: [
            'k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46',
            'k:2f48080efe54e6eb670487f664bcaac7684b4ebfcfc8a3330ef080c9c97f7e11',
            { decimal: '1' },
          ],
        },
      ],
    },
  ],
  meta: {
    gasLimit: 2500,
    gasPrice: 1e-8,
    sender:
      'k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46',
    ttl: 28800,
    creationTime: 1711448853,
    chainId: '0',
  },
  networkId: 'testnet04',
};
```

### Initial value

If you find yourself repeating certain parts of methods for different commands,
you can create your command builder by using `createTransactionBuilder`. This
allows you to set all default values once and then reuse the builder.

| Parameter | Type                  | Description              |
| --------- | --------------------- | ------------------------ |
| initial   | Partial<IPactCommand> | the initial pact command |

```typescript
const builder: ITransactionBuilder =
  createTransactionBuilder(initialPactCommand);
```

#### Examples

Create a builder with network and chain already set.

```typescript
// Pre-configure the builder
export const txBuilder = createTransactionBuilder({ networkId: "mainnet01", meta: { chainId: "1" } });

// Then somewhere in the code

const command = txBuilder
    .execution(Pact.modules.coin.transfer(senderAccount, receiverAccount, amount))
    .addSigner(senderKey, (signFor) => [
      signFor('coin.GAS'),
      signFor('coin.TRANSFER', senderAccount, receiverAccount, amount),
    ])
    .setMeta({ senderAccount })

const output = const output = {
  payload: {
    exec: {
      code: '(coin.transfer "k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46" "k:2f48080efe54e6eb670487f664bcaac7684b4ebfcfc8a3330ef080c9c97f7e11" 1.0)',
      data: {},
    },
  },
  nonce: 'kjs:nonce:1711448853909',
  signers: [
    {
      pubKey:
        'dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46',
      scheme: 'ED25519',
      clist: [
        { name: 'coin.GAS', args: [] },
        {
          name: 'coin.TRANSFER',
          args: [
            'k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46',
            'k:2f48080efe54e6eb670487f664bcaac7684b4ebfcfc8a3330ef080c9c97f7e11',
            { decimal: '1' },
          ],
        },
      ],
    },
  ],
  meta: {
    gasLimit: 2500,
    gasPrice: 1e-8,
    sender:
      'k:dc20ab800b0420be9b1075c97e80b104b073b0405b5e2b78afd29dd74aaf5e46',
    ttl: 28800,
    creationTime: 1711448853,
    // Default value
    chainId: '1',
  },
  // Default value
  networkId: 'mainnet01',
};

```

## Signing Transactions

After creating the command, you need to sign it using the related private keys.
This process is usually managed with a wallet. Kadena has two protocols for
signing transactions, each serving different purposes:

- **Sign API**: This API allows users to send their sign requests to the wallet.
  The wallet is then responsible for creating and signing the transaction
  simultaneously. With this approach, the wallet has more freedom, making it
  more suitable for simple transactions.

- **Quicksign**: This API is designed to give dApps full control over the
  command, with the wallet only responsible for adding signatures. This is the
  recommended method if you are using the command builder from this library.

Wallets typically have their own API for communicating with dApps. While you can
directly use the wallet API, we've also developed wrapper functions for certain
wallets to provide more convenience.

### Sign function interface

We follow one interface for wallet helpers, basically, there are two overloads
of the sign functions. If you pass a single tx it returns the single signed (or
partially signed) tx and if you pass a list of txs it returns the list of signed
(or partially signed) txs.

```typescript
interface ISignFunction {
  (transaction: IUnsignedCommand): Promise<ICommand | IUnsignedCommand>;
  (
    transactionList: IUnsignedCommand[],
  ): Promise<Array<ICommand | IUnsignedCommand>>;
}
```

#### Single Transaction

| Parameter | Type             | Description     |
| --------- | ---------------- | --------------- |
| tx        | IUnsignedCommand | the transaction |

#### List of Transactions

| Parameter | Type               | Description                                |
| --------- | ------------------ | ------------------------------------------ |
| tsList    | IUnsignedCommand[] | list of the transactions need to be signed |

### Chainweaver

You can use `createSignWithChainweaver` to sign tx via Chainweaver. it's a
factory function that returns the actual sign function.

**note**: This function uses `quicksign` protocol.

```typescript
createSignWithChainweaver(options:{ host?: string }): ISignFunction
```

| Parameter | Type              | Description                                                           |
| --------- | ----------------- | --------------------------------------------------------------------- |
| option    | { host?: string } | option including host URL default `{ host: 'http://127.0.0.1:9467' }` |

#### Examples

Sign one transaction

```typescript
const signWithChainweaver = createSignWithChainweaver();

const transaction = Pact.builder
  .execution(Pact.modules.coin.transfer(senderAccount, receiverAccount, amount))
  .addSigner(senderKey, (signFor) => [
    signFor('coin.GAS'),
    signFor('coin.TRANSFER', senderAccount, receiverAccount, amount),
  ])
  .setMeta({ chainId: '0', senderAccount })
  .setNetworkId(NETWORK_ID)
  .createTransaction();

const signedTx = signWithChainweaver(transaction);
```

Sign two transactions

```typescript
const signWithChainweaver = createSignWithChainweaver();

const [txOneSigned, txTwoSigned] = signWithChainweaver([txOne, txTwo]);
```

### WalletConnect

We have developed helpers based on
[KIP-017](https://github.com/kadena-io/KIPs/blob/master/kip-0017.md) that use
the WalletConnect protocol;

**note**: You need to create wallet-connect client and session via the
WalletConnect SDK then you can use the helpers to sign transactions.

#### Wallet Connect sign method

`createWalletConnectSign` is a factory function that returns the sign function
working with `sign` protocol

**note** : the return object might be different (e.g., in meta data) from what
you pass since the `sign` protocol lets wallets create the tx.

```typescript
createWalletConnectSign(client, session, walletConnectChainId): (transaction: IUnsignedCommand): Promise<ICommand | IUnsignedCommand>
```

| Parameter | Type | Description |     | --------- |
| --------- | ---- | ----------- | --- | --------- |

| | client | Client | wallet-connect client object | | session |
SessionTypes.Struct | wallet-connect session object | | networkId | string |
networkId (e.g., "mainnet01", "testnet04") - can be prefixed with "kadena:" as
well (e.g., "kadena:mainnet01") |

##### Examples

```typescript
const signWithWalletConnect = createWalletConnectSign(
  client,
  session,
  'mainnet01',
);

const signedTx = signWithWalletConnect(tx);
```

#### Wallet Connect quicksign method

`createWalletConnectQuicksign` is a factory function that returns the sign
function working with `quicksign` protocol

```typescript
createWalletConnectQuicksign(client, session, walletConnectChainId): ISignFunction
```

| Parameter | Type                | Description                                                                                                    |
| --------- | ------------------- | -------------------------------------------------------------------------------------------------------------- |
| client    | Client              | wallet-connect client object                                                                                   |
| session   | SessionTypes.Struct | wallet-connect session object                                                                                  |
| networkId | string              | networkId (e.g., "mainnet01", "testnet04") - can be prefixed with "kadena:" as well (e.g., "kadena:mainnet01") |

##### Examples

```typescript
const quicksignWithWalletConnect = createWalletConnectQuicksign(
  client,
  session,
  'mainnet01',
);

const signedTx = quicksignWithWalletConnect(tx);
```

### EckoWallet

We developed two functions for `sign` and `quicksign` protocols with EckoWallet;
both functions return a sign function that has the following properties as well:

```typescript
const { isInstalled, isConnected, connect } = createEckoWalletSign();
const { isInstalled, isConnected, connect } = createEckoWalletQuicksign();
```

#### isInstalled

You can use this function to check if the EckoWallet extension is installed in
the browser

```typescript
isInstalled(): boolean
```

#### isConnected

You can use this function to check if the dApp is already connected to
EckoWallet

```typescript
isConnected(): Promise<boolean>
```

#### connect

You can use this function to send a connect request to EckoWallet

```typescript
connect(networkId: string): Promise<boolean>
```

#### Sign with EckoWallet

This function uses `sign` protocol to communicate with EckoWallet.

**note**: the return object might be different (e.g., in meta data) from what
you pass since the `sign` protocol lets wallets create the tx.

```typescript
createEckoWalletSign(options:{ host?: string }): (transaction: IUnsignedCommand): Promise<ICommand | IUnsignedCommand>
```

##### Examples

```typescript
const signWithEckoWallet = createEckoWalletSign();

// the wallet will create the completed one
const partialTx = Pact.builder
  .execution(Pact.modules.coin.transfer(senderAccount, receiverAccount, amount))
  .addSigner(senderKey, (signFor) => [
    signFor('coin.GAS'),
    signFor('coin.TRANSFER', senderAccount, receiverAccount, amount),
  ])
  .setMeta({ chainId: '0' })
  .setNetworkId(NETWORK_ID)
  .createTransaction();

const signedTx = signWithEckoWallet(partialTx);
```

#### quicksign with EckoWallet

This function uses `quicksign` protocol to communicate with EckoWallet.

```typescript
createEckoWalletQuicksign(options:{ host?: string }): ISignFunction
```

##### Examples

Sign one transaction

```typescript
const quicksignWithEckoWallet = createEckoWalletQuicksign();

const tx = Pact.builder
  .execution(Pact.modules.coin.transfer(senderAccount, receiverAccount, amount))
  .addSigner(senderKey, (signFor) => [
    signFor('coin.GAS'),
    signFor('coin.TRANSFER', senderAccount, receiverAccount, amount),
  ])
  .setMeta({ chainId: '0', senderAccount })
  .setNetworkId(NETWORK_ID)
  .createTransaction();

const signedTx = quicksignWithEckoWallet(partialTx);
```

Sign two transactions

```typescript
const quicksignWithEckoWallet = createEckoWalletQuicksign();

const [txOneSigned, txTwoSigned] = quicksignWithEckoWallet([txOne, txTwo]);
```

### Sign with Keypairs

if you already have a private key (e.g. in a server environment or in a safe
environment or CI test pipeline) you can sign the tx by using
`createSignWithKeypair` function. It's a factory function that returns the sign
function.

the keypair interface

```typescript
interface IKeyPair {
  publicKey: string;
  secretKey: string;
}
```

```typescript
createSignWithKeypair(keyOrKeys:IKeyPair | IKeyPair[]): ISignFunction
```

#### Examples

Sign with one key

```typescript
const signWithKeypair = createSignWithKeypair({ publicKey, secretKey });

const signedTx = signWithKeypair(tx);
```

Sign with several keys

```typescript
const signWithKeypair = createSignWithKeypair([firstKeyPair, secondKeyPair]);

const signedTx = signWithKeypair(tx);
```

### Add Signatures Manually

If you already have the signature you can add it in the right order to the tx by
using `addSignatures`

```typescript
addSignatures(transaction, ...signatures): IUnsignedCommand | ICommand
```

| Parameter     | Type                                                             | Description                                                 |
| ------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| transaction   | IUnsignedCommand                                                 | the partially signed or unsigned transaction                |
| ...signatures | Array<{ sig: string; pubKey: string }> \| Array<{ sig: string }> | list of signatures that need to be added to the transaction |

**Note** All signatures should either include a `pubKey`, or none of them
should. If signatures do not include `pubKey`, then the number of signatures
should match the number of signers; thus, signatures are matched based on their
order.

#### Examples

Add Signature with pubKey

```typescript
const signedTx = addSignatures(partiallySignedTx, {
  sig: 'signature-str',
  pubKey: 'publicKey',
});
```

Add Signature based on order

```typescript
const signedTx = addSignatures(
  twoSignersTx,
  { sigOne: 'signature-str' },
  { sigTwo: 'signature-str' },
);
```

## Communicate With Network

Kadena exposes Pact API via
[Pact REST APIs](https://api.chainweb.com/openapi/pact.html). Though you can use
any REST client, e.g., fetch, for calling the endpoints, we have also created
functions for more convenience.

### createClient

In order to use the helpers, you need to use the `createClient` function, which
returns the `IClient` interface.

```TS
createClient(
  host?: string | (options: {chainId: ChainId; networkId: string}) => string,
  options?: { confirmationDepth?: number }
): IClient

interface IClient {
  getStatus: (transactionDescriptors: ITransactionDescriptor[] | ITransactionDescriptor) => Promise<IPollResponse>;
  submit: {
    (transaction: ICommand): Promise<ITransactionDescriptor>;
    (transactionList: ICommand[]): Promise<ITransactionDescriptor[]>;
  }
  send: {
    (transaction: ICommand): Promise<ITransactionDescriptor>;
    (transactionList: ICommand[]): Promise<ITransactionDescriptor[]>;
  }
  submitOne: (transaction: ICommand) => Promise<ITransactionDescriptor>;
  listen: (transactionDescriptor: ITransactionDescriptor) => Promise<ICommandResult>;
  pollOne: (transactionDescriptor: ITransactionDescriptor) => Promise<ICommandResult>;
  pollStatus: (transactionDescriptors: ITransactionDescriptor[] | ITransactionDescriptor, options?: IPollOptions) => IPollRequestPromise<ICommandResult>;
  getPoll: (transactionDescriptors: ITransactionDescriptor[] | ITransactionDescriptor) => Promise<IPollResponse>;
  local: <T extends ILocalOptions>(transaction: LocalRequestBody, options?: T) => Promise<LocalResponse<T>>;
  dirtyRead: (transaction: IUnsignedCommand) => Promise<ICommandResult>;
  preflight: (transaction: ICommand | IUnsignedCommand) => Promise<ILocalCommandResult>;
  signatureVerification: (transaction: ICommand) => Promise<ICommandResult>;
  runPact: (code: string, data: Record<string, unknown>, option: INetworkOptions) => Promise<ICommandResult>;
  createSpv: (transactionDescriptor: ITransactionDescriptor, targetChainId: ChainId) => Promise<string>;
  pollCreateSpv: (transactionDescriptor: ITransactionDescriptor, targetChainId: ChainId, options?: IPollOptions) => Promise<string>;
}
```

**Note**: You can use object destructuring to extract specific functions.

```TS
const { submit, local, pollCreateSpv } = createClient();
```

| Parameter | Type                                                                 | Description                                                                                                                                         |
| --------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| host      | string \| (options: {chainId: ChainId; networkId: string}) => string | The Pact service URL as a string or the function that returns the URL.                                                                              |
| options   | { confirmationDepth?: number }                                       | Additional options for the client. It has only one property now: `confirmationDepth`, which can be used in the poll endpoint. Default value is `0`. |

Both `host` and `options` are optional. The default value of `host` is a
function that returns Kadena's node URL for mainnet and testnet. If you want to
use different URLs, you need to pass this option.

**Note**: `networkId` and `chainId` are read from the command object and passed
to the URL generator function.

#### Examples

Create a client for the development network chain "1", useful if you work only
with a specific chain:

```TS
const client = createClient("http://127.0.0.1:8080/chainweb/0.0/development/chain/1/pact");
```

Create a client for the devnet that covers multi-chain. As you see, we passed
the URL generator function for more flexibility:

```TS
const devNetClient = createClient(({chainId, networkId})=>
   `http://127.0.0.1:8080/chainweb/0.0/${networkId}/chain/${chainId ?? '1'}/pact`
);
```

Create a client which uses mainnet but not Kadena's nodes:

```TS
const client = createClient(({ chainId, networkId }) => {
  switch (networkId) {
    case 'mainnet01':
      return `http://my-node-url/chainweb/0.0/${networkId}/chain/{${chainId}}/pact`;
    case 'testnet04':
      return `http://my-test-node-url/chainweb/0.0/${networkId}/chain/{${chainId}}/pact`;
    default:
      throw new Error('UNKNOWN_NETWORK');
  }
});
```

Create a client with a `confirmationDepth` of 5, meaning wait for 5 new blocks
before reading the result of a transaction:

```TS
const { submit, pollStatus } = createClient(undefined, { confirmationDepth: 5 });
```

### Submit Data to Blockchain

You can use the following functions to submit data to the blockchain. They all
use the `/send` endpoint:

- `submit`
- `send`
- `submitOne`

#### Client: submit

There are two overloads of the `submit` function:

- Submit one transaction:

```TS
const { submit } = createClient();

submit(tx): Promise<ITransactionDescriptor>;

interface ITransactionDescriptor {
  networkId: string;
  chainId: ChainId;
  requestKey: string
}

```

| Parameter | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| tx        | ICommand | The command object ready to submit |

- Submit a list of transactions:

```TS
const { submit } = createClient();

submit(txList): Promise<ITransactionDescriptor[]>;
```

| Parameter | Type       | Description                         |
| --------- | ---------- | ----------------------------------- |
| txList    | ICommand[] | The command objects ready to submit |

**Note**: In many cases, you'll need to store the result of this function to
fetch the result of the request.

#### Client: send

`send` is a deprecated alias for the `submit` function with the same interface.

#### Client: submitOne

`submitOne` is an alias for the first overload of the `submit` function:

```TS
const { submitOne } = createClient();

submitOne(tx): Promise<ITransactionDescriptor>;
```

| Parameter | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| tx        | ICommand | The command object ready to submit |

### Get the Status of Transactions

After you submit a transaction, you need to query for the result of the
transaction. You can do it by calling the `/listen` or `/poll` endpoint. There
are some differences between the two endpoints. `/listen` is a blocking request
that only accepts one request key and returns the results when it's ready. This
request keeps the HTTP request open for a while. On the other hand, `/poll`
accepts a list and responds immediately with the current status of the request
key.

The library exposes the following function which uses one of the endpoints and
designed for different scenarios:

- `getStatus`
- `pollStatus`
- `listen`
- `pollOne`

No matter which function you use, the result of a transaction follows the
`ICommandResult` interface.

```TS
interface ICommandResult {
  reqKey: string;
  txId: number | null;
  result:
    | {
        status: 'success';
        data: PactValue;
      }
    | {
        status: 'failure';
        error: object;
      };
  gas: number;
  logs: string | null;
  // for defpact functions
  continuation: null | {
    pactId: PactTransactionHash;
    step: Step;
    stepCount: number;
    executed: boolean | null;
    stepHasRollback: boolean;
    continuation: {
      def: string;
      args: PactValue;
    };
    yield: {
      data: Array<[string, PactValue]>;
      provenance: {
          targetChainId: ChainId;
          moduleHash: string;
      } | null;
    };
  };
  metaData: null | {
    blockHash: string;
    blockTime: number;
    blockHeight: number;
    prevBlockHash: string;
    publicMeta?: IPactCommand['meta']
  };
  events: Array<{
    name: string;
    module: {
      name: string;
      namespace: string | null;
    };
    params: Array<PactValue>;
    moduleHash: string;
  }>;
}
```

#### Client: getStatus

This function calls `/poll` and returns the result of requests.

```TS
const { getStatus } = createClient();

getStatus(transactionDescriptor: TransactionDescriptor[] | ITransactionDescriptor): Promise<{
    [requestKey: IBase64Url]: { [requestKey:string] ICommandResult};
}>
```

| Parameter             | Type                                             | Description                           |
| --------------------- | ------------------------------------------------ | ------------------------------------- |
| transactionDescriptor | TransactionDescriptor \| TransactionDescriptor[] | One or list of requests to be queried |

#### Client: pollStatus

This function calls `/poll` in intervals and returns the result of all requests
when all are ready.

```TS
const { pollStatus } = createClient();

pollStatus(
  transactionDescriptor: TransactionDescriptor[] | ITransactionDescriptor,
  pollOptions: {
    onPoll?: (id: string) => void;
    timeout?: Milliseconds;
    interval?: Milliseconds;
    confirmationDepth?: number;
  }
): IPollRequestPromise<{
    [requestKey: IBase64Url]: { [requestKey:string] ICommandResult};
}>

interface IPollRequestPromise extends Promise {
  [requestKey: IBase64Url]: Promise<ICommandResult>
}
```

| Parameter             | Type                                                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transactionDescriptor | TransactionDescriptor \| TransactionDescriptor[]                                                                | One or list of requests to be queried                                                                                                                                                                                                                                                                                                                                                                     |
| pollOptions           | { onPoll?: (id: string) => void; timeout?: Milliseconds; interval?: Milliseconds; confirmationDepth?: number; } | onPoll: Callback is called when the request is polling; this might be called several times if the request is not ready yet. Timeout: Timeout if the result is not ready (default `180000` // 3 minutes). Interval: Delay between retries (default is `5000` // 5 seconds). ConfirmationDepth: Set the confirmationDepth for getting the response; this overrides the one you set in createClient function |

**Return value:** The return value is a special type of promise. Though you can
just await for the result just like a normal promise - which is the case for
most of the typical use cases - you can still listen for each individual request
via the `requests` property.

##### Examples

Poll the status of a request:

```TS
const result = await pollStatus(request, {});
```

Poll the status of several requests and get the result for each one immediately:

```TS
const resultPromise = pollStatus([firstRequest, secondRequest, thirdRequest]);
// Notify the UI from the result of each request as soon as it's available
resultPromise.requests["first-request-key"].then(res => {UI.notify(res)});
resultPromise.requests["second-request-key"].then(res => {UI.notify(res)});
resultPromise.requests["third-request-key"].then(res => {UI.notify(res)});
// The final result object
const finalResult = await resultPromise;
```

#### Client: listen

`listen` is another function for fetching the result of one request. It uses the
`/listen` endpoint, which is a blocking endpoint. **Note**: If your
network/firewall configuration doesn't allow keeping HTTP connections open for a
long time, then it's better to use `pollOne` which has the same interface but
uses `/poll` under the hood.

```TS
const { listen } = createClient();

listen(transactionDescriptor: TransactionDescriptor[] | ITransactionDescriptor): Promise<ICommandResult>
```

| Parameter             | Type                  | Description                                                       |
| --------------------- | --------------------- | ----------------------------------------------------------------- |
| transactionDescriptor | TransactionDescriptor | The request object including `requestKet`, `networkId`, `chainId` |

#### Client: pollOne

The `pollOne` function fetches the result of only one request via the `/poll`
endpoint.

```TS
const { pollOne } = createClient();

pollOne(transactionDescriptor: TransactionDescriptor[] | ITransactionDescriptor): Promise<ICommandResult>
```

| Parameter             | Type                  | Description                                                       |
| --------------------- | --------------------- | ----------------------------------------------------------------- |
| transactionDescriptor | TransactionDescriptor | The request object including `requestKet`, `networkId`, `chainId` |

### Read Data from Node

Apart from transactions, you can also send read requests to the node. This
mainly utilizes the `/local` endpoint. These kinds of requests return the result
immediately since you don't need to submit data. You can also use these
functions to validate your transaction before calling the `/send` endpoint to
avoid transaction failure, as in some scenarios you need to pay gas even for
failed transactions.

The following functions all utilize the `/local` endpoint:

- `local`
- `dirtyRead`
- `preflight`
- `signatureVerification`
- `runPact`

#### Client: local

The `local` function is the most generic function that utilizes the `/local`
endpoint.

```TS
local(
  transaction: ICommand | IUnsignedCommand,
  options?: { preflight?: boolean; signatureVerification?: boolean; }
): Promise<ICommandResult & { preflightWarnings?: string[] }>;
```

The return type is `ICommandResult` with `preflightWarnings` when it is set to
true.

| Parameter   | Type                                                      | Description                                                                                                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transaction | ICommand \| IUnsignedCommand                              | The signed or unsigned command object                                                                                                                                                                                                                                                                                  |
| option      | { preflight?: boolean; signatureVerification?: boolean; } | preflight: Runs the code in the preflight mode which simulates submitting the transaction so you can also have the gas consumption result (default = `true`). SignatureVerification: Run the signature verification in the node as well; then the transaction should have the transactions as well (default = `true`). |

##### Examples

Use local call to avoid submitting an incorrect transaction:

```TS
// Check if the transaction and signatures are correct
const response = await client.local(signedTx);

if (response.result.status === 'failure') {
  // Throw if the transaction fails to avoid paying gas for a failed transaction
  throw response.result.error;
}
const request = await client.submit(signedTx);
```

Use local call for gas estimation:

```TS
// We don't need to send signatures to check gas estimation;
const response = await client.local(unsignedTx, { preflight:true , signatureVerification: false });

if (response.result.status === 'failure') {
  throw response.result.error;
}

const gasEstimation =  response.gas;
```

#### Client: dirtyRead

Alias for local where both preflight and signatureVerification are false; useful
when your code only includes reading data from the node.

```TS
dirtyRead(transaction: ICommand | IUnsignedCommand): Promise<ICommandResult>;
```

| Parameter   | Type                         | Description                           |
| ----------- | ---------------------------- | ------------------------------------- |
| transaction | ICommand \| IUnsignedCommand | The signed or unsigned command object |

##### Examples

Get account balance

```TS
const tr = Pact.builder
  .execution(Pact.modules.coin['get-balance'](account))
  .setMeta({ chainId: '0' })
  .setNetworkId("mainnet04")
  .createTransaction();

// We don't need to submit a transaction for just reading data,
// so instead we just read the value from the local data of the blockchain node
const res = await dirtyRead(tr);

if (res.result.status === 'failure') {
  throw res.result.error;
}

const balance = res.result.data;
```

#### Client: preflight

Alias for local where preflight is true but signatureVerification is false.

```TS
preflight(transaction: ICommand | IUnsignedCommand): Promise<ICommandResult>;
```

| Parameter   | Type                         | Description                           |
| ----------- | ---------------------------- | ------------------------------------- |
| transaction | ICommand \| IUnsignedCommand | The signed or unsigned command object |

#### Client: signatureVerification

Alias for local where preflight is false but signatureVerification is true.

```TS
signatureVerification(transaction: ICommand | IUnsignedCommand): Promise<ICommandResult & { preflightWarnings?: string[] }>;
```

| Parameter   | Type                         | Description                           |
| ----------- | ---------------------------- | ------------------------------------- |
| transaction | ICommand \| IUnsignedCommand | The signed or unsigned command object |

#### Client: runPact

If you just want to see the result of a pact code and don't want to create a
command object, you can use the `runPact` function. This function creates a
command object internally.

```TS
runPact(code: string, data?: Record<string, unknown>, options?: { chainId: ChainId; networkId: string }): Promise<ICommandResult>;
```

| Parameter | Type                                    | Description                                                    |
| --------- | --------------------------------------- | -------------------------------------------------------------- |
| code      | string                                  | Pact code                                                      |
| data      | Record<string, unknown>                 | Data to be sent with the transaction                           |
| options   | { chainId: ChainId; networkId: string } | ChainId and networkId that you want to send the transaction to |

##### Examples

```TS
const { runPact } = createClient()

const result = await runPact(`(coin.getBalance "alice")`, { }, { networkId:"mainnet01", chainId:"1" })

```

### Request SPV (Simple Payment Verification) Proof

You need SPV proof mainly for cross-chain transactions - but it's not limited to
this, and you can request SPV proof for all kinds of transactions.

There are two functions for this purpose, both of which use the `/spv` endpoint:

- `createSPV`
- `pollCreateSPV`

#### Client: createSPV

Request SPV proof if it's ready.

```TS
createSpv(transactionDescriptor: ITransactionDescriptor, targetChainId: ChainId): Promise<string>;
```

| Parameter             | Type                                                        | Description                                               |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| transactionDescriptor | { requestKey: string; networkId: string; chainId: ChainId } | The transaction for which you want to create an SPV proof |
| targetChainId         | ChainId                                                     | The chain that consumes this proof                        |

#### Client: pollCreateSPV

Poll for the SPV proof and await until it's ready.

```TS
pollCreateSpv(
  transactionDescriptor: ITransactionDescriptor,
  targetChainId: ChainId,
  pollOptions?: { onPoll?: (id: string) => void; timeout?: Milliseconds; interval?: Milliseconds; }
): Promise<string>;
```

| Parameter             | Type                                                                                | Description                                                                                                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transactionDescriptor | { requestKey: string; networkId: string; chainId: ChainId }                         | The transaction for which you want to create an SPV proof                                                                                                                                                                                                                 |
| targetChainId         | ChainId                                                                             | The chain that consumes this proof                                                                                                                                                                                                                                        |
| pollOptions           | { onPoll?: (id: string) => void; timeout?: Milliseconds; interval?: Milliseconds; } | onPoll: Callback is called when the request is polling; this might be called several times if the request is not ready yet. Timeout: Timeout if the result is not ready (default `180000` // 3 minutes). Interval: Delay between retries (default is `5000` // 5 seconds) |

##### Examples

```TS
const request = await submit(crossChainTx)
const response = await pollOne(request)
// create spv proof for the transaction
const spvProof = await pollSpvProof(request)

const continuationTx = Pact.builder.continuation({
  pactId: response.continuation.pactId,
  rollback: false,
  step:1,
  proof: spvProof
}).addMeta({
  chainId: targetChainId,
  // using gas station for paying gas fee
  senderAccount : 'kadena-xchain-gas'
}).createTransaction()

const contRequest = await submit(continuationTx)
const finalResult = await pollOne(contRequest)
```

## Complete and Runnable Examples

Check out [Client Examples](../client-examples/)