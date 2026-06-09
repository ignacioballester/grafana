import { type NavModelItem } from '@grafana/data';

export const PORTFOLIO_ADMIN_PLUGIN_ID = 'core-app';
export const PORTFOLIO_ADMIN_NODE_ID = `plugin-page-${PORTFOLIO_ADMIN_PLUGIN_ID}`;
const APPS_NAV_ID = 'apps';
const HOME_ICON = 'home-alt';

// Removed from the nav tree entirely (recursively), everywhere it's consumed
// (side menu, command palette, breadcrumbs). `profile`/`help` are intentionally
// NOT here — the top bar's user/help menus need those nodes; MegaMenu filters
// them from its own list separately.
const HIDDEN_NAV_IDS = new Set([
  'home',
  'explore',
  'alerting',
  'drilldown',
  'cfg',
  'bookmarks',
  'starred',
  'connections-add-new-connection',
]);

// A nav node with neither text nor url is junk (e.g. a malformed entry that
// surfaces in the command palette as a `kp_<hash>` item). Drop it.
const isJunk = (item: NavModelItem) => !item.text?.trim() && !item.url;

// Top-of-menu order. Ids not listed keep their relative order after these.
const TOP_ORDER = [PORTFOLIO_ADMIN_NODE_ID, 'dashboards/browse', APPS_NAV_ID, 'connections'];

function removeHidden(items: NavModelItem[]): NavModelItem[] {
  return items
    .filter((item) => !HIDDEN_NAV_IDS.has(item.id ?? '') && !isJunk(item))
    .map((item) => (item.children ? { ...item, children: removeHidden(item.children) } : item));
}

// Detach the Portfolio Admin node from wherever it sits (added as a child of the
// `apps` section by default). Returns the node plus the tree without it.
function detachPortfolioAdmin(items: NavModelItem[]): { node?: NavModelItem; rest: NavModelItem[] } {
  let node: NavModelItem | undefined;
  const walk = (list: NavModelItem[]): NavModelItem[] =>
    list.reduce<NavModelItem[]>((acc, item) => {
      if (item.id === PORTFOLIO_ADMIN_NODE_ID) {
        node = item;
        return acc;
      }
      acc.push(item.children ? { ...item, children: walk(item.children) } : item);
      return acc;
    }, []);
  const rest = walk(items);
  return { node, rest };
}

export function customizePortfolioNav(navTree: NavModelItem[]): NavModelItem[] {
  let items = removeHidden(navTree);

  const { node, rest } = detachPortfolioAdmin(items);
  items = node ? [{ ...node, icon: HOME_ICON }, ...rest] : rest;

  // Rename the apps section, and drop it if hoisting emptied it.
  items = items
    .map((item) => (item.id === APPS_NAV_ID ? { ...item, text: 'Plugins' } : item))
    .filter((item) => item.id !== APPS_NAV_ID || (item.children?.length ?? 0) > 0);

  const rank = (item: NavModelItem) => {
    const i = TOP_ORDER.indexOf(item.id ?? '');
    return i === -1 ? TOP_ORDER.length : i;
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
    .map(({ item }) => item);
}
