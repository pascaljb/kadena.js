import yaml from 'js-yaml';
import { services } from '../../services/index.js';
import type { IAddAccountConfig } from '../types.js';
import { accountAliasFileSchema, formatZodErrors } from './accountHelpers.js';

export async function writeAccountAlias(
  config: IAddAccountConfig,
  filePath: string,
): Promise<void> {
  const { publicKeysConfig, predicate, accountName, fungible } = config;
  await services.filesystem.ensureDirectoryExists(filePath);
  try {
    const aliasData = {
      name: accountName,
      fungible,
      publicKeys: publicKeysConfig,
      predicate,
    };
    accountAliasFileSchema.parse(aliasData);
    await services.filesystem.writeFile(filePath, yaml.dump(aliasData));
  } catch (error) {
    const errorMessage = formatZodErrors(error);
    throw new Error(`Error writing alias file: ${filePath}\n ${errorMessage}`);
  }
}

export async function writeAccountAliasMinimal(
  config: Pick<
    IAddAccountConfig,
    'publicKeysConfig' | 'predicate' | 'accountName' | 'fungible'
  >,
  filePath: string,
): Promise<void> {
  const { publicKeysConfig, predicate, accountName, fungible } = config;
  await services.filesystem.ensureDirectoryExists(filePath);
  try {
    const aliasData = {
      name: accountName,
      fungible,
      publicKeys: publicKeysConfig,
      predicate,
    };
    accountAliasFileSchema.parse(aliasData);
    await services.filesystem.writeFile(filePath, yaml.dump(aliasData));
  } catch (error) {
    const errorMessage = formatZodErrors(error);
    throw new Error(`Error writing alias file: ${filePath}\n ${errorMessage}`);
  }
}

export async function createAccountConfigFile(
  filePath: string,
  config: IAddAccountConfig,
): Promise<string> {
  if (await services.filesystem.fileExists(filePath)) {
    throw new Error(`The account configuration "${filePath}" already exists.`);
  }

  await writeAccountAlias(config, filePath);

  return filePath;
}
