import type { TConfigOptions } from '../config/configQuestions.js';

/**
 * @const configDefaults
 * Provides the default configurations for current project.
 */
export const configDefaults: TConfigOptions = {
  projectName: 'a-kadena-project',
  network: 'mainnet',
  chainId: 1,
};

export const workPath: string = `${process.cwd()}/.kadena`;
export const projectRootPath: string = `${process.cwd()}`;

export const projectPrefix: string = 'project-';

// key paths
export const KEY_DIR: string = `${process.cwd()}/.kadena/keys`;

// key extensions
export const HDKEY_EXT: string = '.hd.phrase';
export const HDKEY_ENC_EXT: string = '.enc.hd.phrase';
export const PLAINKEY_EXT: string = '.plain.key';