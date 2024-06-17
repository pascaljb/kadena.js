import type { BlockQuery } from '@/__generated__/sdk';
import { useBlockQuery } from '@/__generated__/sdk';
import type { IHookReturnValue } from '..';
import {
  SearchOptionEnum,
  isSearchRequested,
  returnSearchQuery,
} from './utils';

export const useBlockHash = (
  searchQuery: string,
  searchOption: SearchOptionEnum | null,
): IHookReturnValue<BlockQuery> => {
  const { loading, data, error } = useBlockQuery({
    variables: {
      hash: returnSearchQuery(
        searchQuery,
        searchOption,
        SearchOptionEnum.BLOCKHASH,
      ),
    },
    skip:
      !searchQuery ||
      !isSearchRequested(searchOption, SearchOptionEnum.BLOCKHASH),
  });

  return {
    loading,
    data,
    error,
  };
};