import { type NavModelItem } from '@grafana/data';

import { customizePortfolioNav, PORTFOLIO_ADMIN_NODE_ID } from './portfolioNav';

function makeTree(): NavModelItem[] {
  return [
    { id: 'home', text: 'Home', url: '/', icon: 'home-alt' },
    { id: 'bookmarks', text: 'Bookmarks', icon: 'bookmark' },
    { id: 'dashboards/browse', text: 'Dashboards', icon: 'apps' },
    { id: 'explore', text: 'Explore', icon: 'compass' },
    { id: 'drilldown', text: 'Drilldown', icon: 'drilldown' },
    {
      id: 'apps',
      text: 'More apps',
      icon: 'layer-group',
      children: [
        {
          id: PORTFOLIO_ADMIN_NODE_ID,
          text: 'Portfolio Admin',
          url: '/a/portfoliomanagement-portfolioadminv2-app',
          children: [
            { id: 'pa-portfolios', text: 'Portfolios', url: '/a/portfoliomanagement-portfolioadminv2-app/portfolios' },
            { id: 'pa-instruments', text: 'Instruments', url: '/a/portfoliomanagement-portfolioadminv2-app/instruments' },
          ],
        },
        { id: 'plugin-page-grafana-yfinance', text: 'YFinance', url: '/a/yfinance' },
      ],
    },
    {
      id: 'connections',
      text: 'Connections',
      icon: 'adjust-circle',
      children: [
        { id: 'connections-add-new-connection', text: 'Add new connection', url: '/connections/add-new-connection' },
        { id: 'connections-datasources', text: 'Data sources', url: '/connections/datasources' },
      ],
    },
    { id: 'alerting', text: 'Alerting', icon: 'bell' },
    { id: 'cfg', text: 'Administration', icon: 'cog' },
    { id: 'profile', text: 'Profile' },
    { id: 'help', text: 'Help' },
  ];
}

describe('customizePortfolioNav', () => {
  it('removes hidden items including nested children', () => {
    const ids = flattenIds(customizePortfolioNav(makeTree()));
    for (const hidden of ['home', 'bookmarks', 'explore', 'drilldown', 'alerting', 'cfg', 'profile', 'help', 'connections-add-new-connection']) {
      expect(ids).not.toContain(hidden);
    }
    // Data sources child survives
    expect(ids).toContain('connections-datasources');
  });

  it('hoists Portfolio Admin to the top as Home with the home icon and keeps its pages', () => {
    const result = customizePortfolioNav(makeTree());
    expect(result[0].id).toBe(PORTFOLIO_ADMIN_NODE_ID);
    expect(result[0].icon).toBe('home-alt');
    expect(result[0].children?.map((c) => c.id)).toEqual(['pa-portfolios', 'pa-instruments']);
    // It is no longer inside the apps/Plugins section
    const apps = result.find((i) => i.id === 'apps');
    expect(apps?.children?.map((c) => c.id)).toEqual(['plugin-page-grafana-yfinance']);
  });

  it('renames the apps section to Plugins', () => {
    const apps = customizePortfolioNav(makeTree()).find((i) => i.id === 'apps');
    expect(apps?.text).toBe('Plugins');
  });

  it('orders Portfolio Admin, Dashboards, Plugins, Connections', () => {
    const ids = customizePortfolioNav(makeTree()).map((i) => i.id);
    expect(ids).toEqual([PORTFOLIO_ADMIN_NODE_ID, 'dashboards/browse', 'apps', 'connections']);
  });

  it('returns a valid tree when Portfolio Admin is absent', () => {
    const tree: NavModelItem[] = [
      { id: 'dashboards/browse', text: 'Dashboards' },
      { id: 'apps', text: 'More apps', children: [{ id: 'plugin-page-grafana-yfinance', text: 'YFinance' }] },
      { id: 'connections', text: 'Connections', children: [{ id: 'connections-datasources', text: 'Data sources' }] },
    ];
    const result = customizePortfolioNav(tree);
    expect(result.map((i) => i.id)).toEqual(['dashboards/browse', 'apps', 'connections']);
    expect(result.find((i) => i.id === 'apps')?.text).toBe('Plugins');
  });

  it('drops the apps section when Portfolio Admin was its only child', () => {
    const tree: NavModelItem[] = [
      { id: 'dashboards/browse', text: 'Dashboards' },
      { id: 'apps', text: 'More apps', children: [{ id: PORTFOLIO_ADMIN_NODE_ID, text: 'Portfolio Admin', children: [] }] },
    ];
    const result = customizePortfolioNav(tree);
    expect(result[0].id).toBe(PORTFOLIO_ADMIN_NODE_ID);
    expect(result.find((i) => i.id === 'apps')).toBeUndefined();
  });
});

function flattenIds(items: NavModelItem[]): string[] {
  return items.flatMap((i) => [i.id ?? '', ...flattenIds(i.children ?? [])]);
}
