import { MonoArrowOutward } from '@kadena/react-icons';
import { Stack, Text } from '@kadena/react-ui';
import Link from 'next/link';
import type { FC } from 'react';
import React from 'react';
import {
  dataFieldClass,
  linkClass,
  linkIconClass,
  linkWrapperClass,
} from '../styles.css';

interface IProps {
  value: string;
}

interface IOptions {
  appendUrl: string;
}

export const FormatLink = ({ appendUrl }: IOptions): FC<IProps> => {
  const Component: FC<IProps> = ({ value }) => (
    <Stack alignItems="center" className={linkWrapperClass}>
      <Link href={`${appendUrl}/${value}`} className={linkClass}>
        <Text variant="code" className={dataFieldClass}>
          {value}
        </Text>
      </Link>
      <Link href={`${appendUrl}/${value}`} className={value}>
        <MonoArrowOutward className={linkIconClass} />
      </Link>
    </Stack>
  );

  return Component;
};