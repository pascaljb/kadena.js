import type { IMenuItem } from '@/Layout';
import type { IMostPopularPage } from '@/MostPopularData';
import { getBlogPosts } from '@/utils/getBlogPosts';
import getMostPopularPages from '@/utils/getMostPopularPages';
import type { IMenuData } from '@kadena/docs-tools';
import {
  checkSubTreeForActive,
  flattenData,
  getMenuData,
  getPathName,
} from '@kadena/docs-tools';
import yaml from './../config.yaml';

export const getHeaderItems = async (): Promise<IMenuItem[]> => {
  const data = await getMenuData();
  const { menu } = yaml;

  return menu.map((item: string) => {
    const found = data.find((d) => d.root === `/${item}`);
    if (!found) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...result } = found;
    return result;
  });
};

export const getAllPages = async (): Promise<IMenuItem[]> => {
  const data = await getMenuData();
  const allPosts = flattenData(data) as IMenuItem[];

  return allPosts;
};

interface IPageConfigProps {
  blogPosts?: string[] | boolean;
  popularPages?: string;
}

interface IPageConfigReturn {
  headerItems: IMenuItem[];
  leftMenuTree: IMenuItem[];
  blogPosts: IMenuData[] | null;
  popularPages: IMostPopularPage[] | null;
}

export const getPageConfig = async ({
  blogPosts,
  popularPages,
}: IPageConfigProps): Promise<IPageConfigReturn> => {
  const blogData = Array.isArray(blogPosts)
    ? await getBlogPosts(blogPosts)
    : blogPosts
    ? await getBlogPosts()
    : null;
  const popularData = popularPages
    ? await getMostPopularPages(popularPages)
    : null;

  const headerItems = await getHeaderItems();

  return {
    headerItems,
    leftMenuTree: await checkSubTreeForActive(getPathName(__filename)),
    blogPosts: blogData,
    popularPages: popularData,
  };
};