import type { Command } from 'commander';

import { KADENA_DIR } from '../../constants/config.js';
import { KadenaError } from '../../services/service-error.js';
import { createCommand } from '../../utils/createCommand.js';
import { globalOptions } from '../../utils/globalOptions.js';
import { log } from '../../utils/logger.js';
import { networkOptions } from '../networkOptions.js';
import { removeNetwork, writeNetworks } from '../utils/networkHelpers.js';

/**
 * Creates a command to generate wallets.
 * @param {Command} program - The commander program.
 * @param {string} version - The version of the program.
 */
export const manageNetworksCommand: (
  program: Command,
  version: string,
) => void = createCommand(
  'update',
  'Update networks',
  [
    globalOptions.network({ isOptional: false }),
    networkOptions.networkExplorerUrl(),
    networkOptions.networkHost(),
    networkOptions.networkId(),
    networkOptions.networkName(),
  ],
  async (option) => {
    if (KADENA_DIR === null) {
      throw new KadenaError('no_kadena_directory');
    }

    const networkData = await option.network();
    const networkName = await option.networkName();
    const networkId = await option.networkId();
    const networkHost = await option.networkHost();
    const networkExplorerUrl = await option.networkExplorerUrl();

    log.debug('manage-networks', {
      networkExplorerUrl,
      networkHost,
      networkId,
      networkName,
    });

    await writeNetworks(KADENA_DIR, {
      network: networkName.networkName,
      networkId: networkId.networkId,
      networkHost: networkHost.networkHost,
      networkExplorerUrl: networkExplorerUrl.networkExplorerUrl,
    });

    if (networkData.network !== networkName.networkName) {
      await removeNetwork(networkData.networkConfig);
    }

    log.info(
      log.color.green(
        `\nThe network configuration "${networkData.network}" has been updated.\n`,
      ),
    );
  },
);
