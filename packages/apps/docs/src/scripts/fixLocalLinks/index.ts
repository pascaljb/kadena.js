import { createSlug } from '@/utils/createSlug';
import * as fs from 'fs';
import type {
  Definition,
  Heading,
  Image,
  Link,
  Text,
} from 'mdast-util-from-markdown/lib';
import { toMarkdown } from 'mdast-util-to-markdown';
import { remark } from 'remark';
import type { Root } from 'remark-gfm';
import { getFileExtension } from '../movePages/utils/getFileExtension';
import { loadConfigPages } from '../movePages/utils/loadConfigPages';
import { getLinkHash } from './../movePages';
import type { IPage, IScriptResult } from './../types';
import { getTypes } from './../utils';
import { getCleanedHash } from './utils/getCleanedHash';
import { getFileFromNameOfUrl } from './utils/getFileFromNameOfUrl';
import { getFileNameOfPageFile } from './utils/getFileNameOfPageFile';
import { getUrlNameOfPageFile } from './utils/getUrlNameOfPageFile';
import { getUrlofImageFile } from './utils/getUrlofImageFile';
import { isLocalImageLink, isLocalPageLink } from './utils/isLocalPageLink';
import { splitContentFrontmatter } from './utils/splitContentFrontmatter';

const errors: string[] = [];
const success: string[] = [];

const fixHashLinks = (link: string): string => {
  // check if the link has a hashdeeplink
  const arr = link.split('#');
  if (arr.length < 2) return link;

  const cleanedLink = arr[0];
  const cleanedHashUrl = getCleanedHash(arr[1]);

  // get the page to the hashlink
  const file = getFileFromNameOfUrl(cleanedLink);

  if (!file) return link;

  const fullContent = fs.readFileSync(`./src/docs${file.file}`, 'utf-8');
  const { content } = splitContentFrontmatter(fullContent);

  const md: Root = remark.parse(content);
  const headers = getTypes<Heading>(md, 'heading');

  const foundHeader = headers
    .map((header) => {
      return (header.children[0] as Text).value;
    })
    .find((header) => {
      return cleanedHashUrl === getCleanedHash(createSlug(header));
    });

  if (!foundHeader) {
    errors.push(`${link} deeplink was not found in config`);
  }

  return `${cleanedLink}#${createSlug(foundHeader)}`;
};

const findPageByFile = (
  file: string,
  pages?: IPage[],
  parentTree: IPage[] = [],
): { page?: IPage; parentTree: IPage[] } | undefined => {
  if (!pages) return;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  let found: { page?: IPage; parentTree: IPage[] } | undefined;
  pages.forEach((p) => {
    if (p.file.endsWith(file)) {
      found = { page: p, parentTree };
    } else {
      if (!found) found = findPageByFile(file, p.children, [...parentTree, p]);
    }
  });

  return found;
};

const getUrlofPageFile = (link: string): string => {
  const pages = loadConfigPages();
  const fileHash = getLinkHash(link);

  const cleanLink = link
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(`#${fileHash}`, '');

  const result = findPageByFile(cleanLink, pages);
  if (!result) {
    errors.push(`${link}#${fileHash} not found in the config`);
    return '';
  }

  if (!result.page) return '';

  return `${getUrlNameOfPageFile(result.page, result.parentTree)}${
    fileHash ? `#${fileHash}` : ''
  }`;
};

const fixLinks = async (page: IPage, parentTree: IPage[]): Promise<void> => {
  const extenstion = getFileExtension(page.file);
  if (extenstion !== 'md' && extenstion !== 'mdx') return;

  const contentWithFrontmatter = fs.readFileSync(
    `./src/pages${getFileNameOfPageFile(page, parentTree)}`,
    'utf-8',
  );

  // we need to preserve the frontmatter, because remark conversion doesnt work to well with the frontmatter
  const { frontmatter, content } = splitContentFrontmatter(
    contentWithFrontmatter,
  );

  const md: Root = remark.parse(content);
  const images = getTypes<Image>(md, 'image');
  const links = getTypes<Link>(md, 'link');
  const linkReferences = getTypes<Definition>(md, 'definition');

  images.forEach((image) => {
    if (isLocalImageLink(image)) {
      image.url = getUrlofImageFile(image.url);
    }
  });

  [...links, ...linkReferences].forEach((link) => {
    if (isLocalPageLink(link.url)) {
      link.url = getUrlofPageFile(link.url);
    }

    link.url = fixHashLinks(link.url);
  });

  const newContent = toMarkdown(md);

  fs.writeFileSync(
    `./src/pages${getFileNameOfPageFile(page, parentTree)}`,
    `---
${frontmatter}
---
${newContent}
    `,
    {
      flag: 'w',
    },
  );
};

const crawlPage = (page: IPage, parentTree: IPage[]): void => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fixLinks(page, parentTree);

  if (page.children) {
    page.children.forEach((child) => {
      crawlPage(child, [...parentTree, page]);
    });
  }
};

export const fixLocalLinks = async (): Promise<IScriptResult> => {
  errors.length = 0;
  success.length = 0;
  const pages = loadConfigPages();

  pages.forEach((page) => {
    crawlPage(page, []);
  });

  success.push('Locallinks are fixed');
  return { errors, success };
};