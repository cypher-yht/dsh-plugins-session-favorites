window.__ModuleLoader__.load({
  id: '@local/session-favorites',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'session-favorites';
    const STORAGE_KEY = 'dsh.session-favorites.v1';
    const PANEL_ID = 'session-favorites';
    const MAX_ITEMS = 200;
    const MENU_WIDTH = 236;
    const MENU_HEIGHT = 168;

    /* ------------------------------------------------------------------ */
    /* Dictionaries                                                        */
    /* ------------------------------------------------------------------ */

    const zh = {
      'panel.title': '收藏',
      'panel.subtitle': '把常看的会话收在这里,随时回到当时的上下文。',
      'panel.count': '{count} 个收藏',
      'panel.hint': '右键侧边栏里的任意会话,可打开更多选项。',
      'panel.loading': '正在加载收藏…',
      'panel.emptyTitle': '还没有收藏的会话',
      'panel.emptyDesc': '在侧边栏里右键一个会话,选择「收藏」;或把鼠标移到会话行上,点右侧的星标。',
      'panel.openLabel': '打开会话:{title}',
      'panel.remove': '取消收藏',
      'panel.removeLabel': '取消收藏:{title}',
      'panel.missing': '不在当前会话列表中',
      'panel.untitled': '未命名会话',
      'panel.running': '运行中',
      'panel.idle': '空闲',
      'row.favorite': '收藏会话',
      'row.unfavorite': '取消收藏',
      'menu.label': '会话选项',
      'menu.favorite': '收藏会话',
      'menu.unfavorite': '取消收藏',
      'menu.open': '打开会话',
      'menu.copyId': '复制会话 ID',
      'menu.copied': '已复制会话 ID',
      'menu.aria': '会话操作菜单'
    };

    const en = {
      'panel.title': 'Favorites',
      'panel.subtitle': 'Keep the sessions you return to close at hand.',
      'panel.count': '{count} favorites',
      'panel.hint': 'Right-click any session in the sidebar for more options.',
      'panel.loading': 'Loading favorites…',
      'panel.emptyTitle': 'No favorites yet',
      'panel.emptyDesc': 'Right-click a session in the sidebar and pick "Favorite", or click the star on a session row.',
      'panel.openLabel': 'Open session: {title}',
      'panel.remove': 'Remove favorite',
      'panel.removeLabel': 'Remove favorite: {title}',
      'panel.missing': 'Not in the current session list',
      'panel.untitled': 'Untitled session',
      'panel.running': 'Running',
      'panel.idle': 'Idle',
      'row.favorite': 'Favorite session',
      'row.unfavorite': 'Remove favorite',
      'menu.label': 'Session options',
      'menu.favorite': 'Favorite session',
      'menu.unfavorite': 'Remove favorite',
      'menu.open': 'Open session',
      'menu.copyId': 'Copy session ID',
      'menu.copied': 'Session ID copied',
      'menu.aria': 'Session action menu'
    };

    function fmt(template, vars) {
      if (typeof template !== 'string') return '';
      return template.replace(/\{(\w+)\}/g, function (match, key) {
        return vars && vars[key] !== undefined ? String(vars[key]) : match;
      });
    }

    function shortId(id) {
      const text = String(id == null ? '' : id);
      return text.length > 18 ? text.slice(0, 8) + '…' + text.slice(-8) : text;
    }

    /* ------------------------------------------------------------------ */
    /* Storage                                                             */
    /* ------------------------------------------------------------------ */

    function readStored() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const list = parsed && Array.isArray(parsed.items) ? parsed.items : [];
        const seen = Object.create(null);
        const out = [];
        for (let index = 0; index < list.length; index += 1) {
          const entry = list[index];
          if (!entry || typeof entry.id !== 'string' || !entry.id || seen[entry.id]) continue;
          seen[entry.id] = true;
          out.push({
            id: entry.id,
            title: typeof entry.title === 'string' ? entry.title : '',
            addedAt: typeof entry.addedAt === 'number' ? entry.addedAt : 0
          });
        }
        return out.slice(0, MAX_ITEMS);
      } catch (error) {
        return [];
      }
    }

    function persistItems(items) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: items }));
      } catch (error) {
        /* Private mode or a blocked storage partition: favorites stay in memory. */
      }
    }

    function copyText(text) {
      try {
        if (!navigator || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') return false;
        const result = navigator.clipboard.writeText(text);
        if (result && typeof result.catch === 'function') result.catch(function () {});
        return true;
      } catch (error) {
        return false;
      }
    }

    /* ------------------------------------------------------------------ */
    /* Store                                                               */
    /* ------------------------------------------------------------------ */

    function createFavoritesStore() {
      let items = readStored();
      let menu = null;
      const listeners = new Set();

      function notify() {
        listeners.forEach(function (listener) {
          try {
            listener();
          } catch (error) {
            /* One listener must not break the rest. */
          }
        });
      }

      return {
        subscribe: function (listener) {
          listeners.add(listener);
          return function () {
            listeners.delete(listener);
          };
        },
        getItems: function () {
          return items;
        },
        getMenu: function () {
          return menu;
        },
        has: function (id) {
          return items.some(function (item) { return item.id === id; });
        },
        toggle: function (id, title) {
          if (!id) return;
          const known = items.some(function (item) { return item.id === id; });
          if (known) {
            items = items.filter(function (item) { return item.id !== id; });
          } else {
            items = [{ id: id, title: title || '', addedAt: Date.now() }].concat(items).slice(0, MAX_ITEMS);
          }
          persistItems(items);
          notify();
        },
        remove: function (id) {
          if (!items.some(function (item) { return item.id === id; })) return;
          items = items.filter(function (item) { return item.id !== id; });
          persistItems(items);
          notify();
        },
        openMenu: function (next) {
          menu = next;
          notify();
        },
        closeMenu: function () {
          if (!menu) return;
          menu = null;
          notify();
        }
      };
    }

    const store = createFavoritesStore();

    function useSnapshot(read) {
      const [value, setValue] = React.useState(read);
      React.useEffect(function () {
        let active = true;
        function sync() {
          if (active) setValue(read());
        }
        sync();
        const unsubscribe = store.subscribe(sync);
        return function () {
          active = false;
          unsubscribe();
        };
      }, []);
      return value;
    }

    /* ------------------------------------------------------------------ */
    /* Shared pieces                                                       */
    /* ------------------------------------------------------------------ */

    function StarIcon(props) {
      const size = props && props.size ? props.size : 16;
      const filled = !!(props && props.filled);
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block', flexShrink: 0 },
        fill: filled ? 'currentColor' : 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, h('path', { d: 'M12 3.4l2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.8l6-.9z' }));
    }

    function OpenIcon(props) {
      const size = props && props.size ? props.size : 16;
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block', flexShrink: 0 },
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      },
        h('path', { d: 'M13.5 5.5H18v4.5' }),
        h('path', { d: 'M17.2 6.8l-6.4 6.4' }),
        h('path', { d: 'M18 14.5v3.2a1.3 1.3 0 0 1-1.3 1.3H6.3A1.3 1.3 0 0 1 5 17.7V7.3A1.3 1.3 0 0 1 6.3 6h3.2' })
      );
    }

    function CopyIcon(props) {
      const size = props && props.size ? props.size : 16;
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block', flexShrink: 0 },
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      },
        h('rect', { x: 9, y: 9, width: 10, height: 10, rx: 2 }),
        h('path', { d: 'M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5' })
      );
    }

    function menuRowStyle(disabled) {
      return {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        padding: '7px 10px',
        border: 'none',
        borderRadius: 7,
        background: 'transparent',
        color: disabled ? 'var(--dsw-alias-label-secondary)' : 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: 13,
        lineHeight: '18px',
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer'
      };
    }

    function hoverOn(event) {
      event.currentTarget.style.background = 'var(--dsw-alias-bg-layer-2)';
    }

    function hoverOff(event) {
      event.currentTarget.style.background = 'transparent';
    }

    /* ------------------------------------------------------------------ */
    /* Session row: star button + row-wide right-click anchor              */
    /* ------------------------------------------------------------------ */

    function SessionFavoriteStar(props) {
      const t = props.t;
      const sessionId = props.sessionId;
      const displayTitle = props.displayTitle || '';
      const items = useSnapshot(store.getItems);
      const favorited = items.some(function (item) { return item.id === sessionId; });
      const anchorRef = React.useRef(null);
      const infoRef = React.useRef({ sessionId: sessionId, displayTitle: displayTitle });
      infoRef.current = { sessionId: sessionId, displayTitle: displayTitle };

      React.useEffect(function () {
        const anchor = anchorRef.current;
        if (!anchor || typeof document === 'undefined') return undefined;

        /* Climb from our cell to the owning Session row. Stop at the scroll
           container (or anything row-taller than a row), so the listener covers
           the whole row without leaking into sibling rows. */
        let row = anchor;
        for (let depth = 0; depth < 8; depth += 1) {
          const parent = row.parentElement;
          if (!parent || parent === document.body || parent === document.documentElement) break;
          let overflowY = '';
          try {
            overflowY = window.getComputedStyle(parent).overflowY || '';
          } catch (error) {
            overflowY = '';
          }
          if (overflowY === 'auto' || overflowY === 'scroll') break;
          let height = 0;
          try {
            height = parent.getBoundingClientRect().height;
          } catch (error) {
            height = 0;
          }
          if (height > 160) break;
          row = parent;
        }

        /* Open on the right button's PRESS, not on release: a Windows
           `contextmenu` fires on mouseup, which feels sluggish. The press also
           swallows the native menu, and the later `contextmenu` for the same
           gesture is only prevented so it never re-opens or flashes. */
        function onMouseDown(event) {
          if (event.button !== 2) return;
          const info = infoRef.current;
          if (!info.sessionId) return;
          event.preventDefault();
          event.stopPropagation();
          store.openMenu({
            sessionId: info.sessionId,
            title: info.displayTitle,
            x: event.clientX,
            y: event.clientY
          });
        }

        function onContextMenu(event) {
          if (!infoRef.current.sessionId) return;
          event.preventDefault();
          event.stopPropagation();
        }

        row.addEventListener('mousedown', onMouseDown);
        row.addEventListener('contextmenu', onContextMenu);
        return function () {
          row.removeEventListener('mousedown', onMouseDown);
          row.removeEventListener('contextmenu', onContextMenu);
        };
      }, []);

      return h('button', {
        ref: anchorRef,
        type: 'button',
        title: favorited ? t('row.unfavorite') : t('row.favorite'),
        'aria-label': favorited ? t('row.unfavorite') : t('row.favorite'),
        'aria-pressed': favorited ? 'true' : 'false',
        onClick: function (event) {
          event.preventDefault();
          event.stopPropagation();
          store.toggle(sessionId, displayTitle);
        },
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          padding: 0,
          border: 'none',
          borderRadius: 6,
          background: 'transparent',
          color: favorited ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-label-secondary)',
          cursor: 'pointer',
          flexShrink: 0,
          font: 'inherit'
        }
      }, h(StarIcon, { size: 15, filled: favorited }));
    }

    /* ------------------------------------------------------------------ */
    /* Context menu (rendered into the shell overlay)                      */
    /* ------------------------------------------------------------------ */

    function SessionOptionsMenu(props) {
      const t = props.t;
      const openSession = props.openSession;
      const menu = useSnapshot(store.getMenu);
      const items = useSnapshot(store.getItems);
      const [copied, setCopied] = React.useState(false);
      const cardRef = React.useRef(null);

      React.useEffect(function () {
        if (!menu) return undefined;
        function closeOnOutsideMouseDown(event) {
          const card = cardRef.current;
          if (card && event.target && card.contains(event.target)) return;
          store.closeMenu();
        }
        function onKeyDown(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            store.closeMenu();
          }
        }
        /* The right button's release raises a `contextmenu` after the press
           already opened this menu; suppress that native menu instead of
           letting it flash over or reopen the panel. */
        function blockNativeContextMenu(event) {
          event.preventDefault();
        }
        function onResize() {
          store.closeMenu();
        }
        window.addEventListener('mousedown', closeOnOutsideMouseDown, true);
        window.addEventListener('contextmenu', blockNativeContextMenu, true);
        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('resize', onResize);
        return function () {
          window.removeEventListener('mousedown', closeOnOutsideMouseDown, true);
          window.removeEventListener('contextmenu', blockNativeContextMenu, true);
          window.removeEventListener('keydown', onKeyDown, true);
          window.removeEventListener('resize', onResize);
        };
      }, [menu]);

      React.useEffect(function () {
        if (!copied) return undefined;
        const timer = setTimeout(function () {
          setCopied(false);
          store.closeMenu();
        }, 900);
        return function () {
          clearTimeout(timer);
        };
      }, [copied]);

      if (!menu) return null;

      const favorited = items.some(function (item) { return item.id === menu.sessionId; });
      const title = menu.title && String(menu.title).trim() ? menu.title : shortId(menu.sessionId);
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
      const left = Math.max(8, Math.min(menu.x, viewportWidth - MENU_WIDTH - 8));
      const top = Math.max(8, Math.min(menu.y, viewportHeight - MENU_HEIGHT - 8));

      const rows = [
        h('button', {
          key: 'favorite',
          type: 'button',
          role: 'menuitem',
          style: menuRowStyle(false),
          onMouseEnter: hoverOn,
          onMouseLeave: hoverOff,
          onClick: function () {
            store.toggle(menu.sessionId, menu.title);
            store.closeMenu();
          }
        }, h(StarIcon, { size: 15, filled: favorited }), h('span', null, favorited ? t('menu.unfavorite') : t('menu.favorite'))),
        h('button', {
          key: 'open',
          type: 'button',
          role: 'menuitem',
          style: menuRowStyle(false),
          onMouseEnter: hoverOn,
          onMouseLeave: hoverOff,
          onClick: function () {
            openSession(menu.sessionId);
          }
        }, h(OpenIcon, { size: 15 }), h('span', null, t('menu.open'))),
        h('button', {
          key: 'copy',
          type: 'button',
          role: 'menuitem',
          style: menuRowStyle(false),
          onMouseEnter: hoverOn,
          onMouseLeave: hoverOff,
          onClick: function () {
            if (!copyText(String(menu.sessionId))) {
              store.closeMenu();
              return;
            }
            setCopied(true);
          }
        }, h(CopyIcon, { size: 15 }), h('span', null, copied ? t('menu.copied') : t('menu.copyId')))
      ];

      return h('div', {
        ref: cardRef,
        role: 'menu',
        'aria-label': t('menu.aria'),
        onContextMenu: function (event) {
          event.preventDefault();
          event.stopPropagation();
        },
        style: {
            position: 'fixed',
            left: left + 'px',
            top: top + 'px',
            width: MENU_WIDTH + 'px',
            zIndex: 9999,
            padding: 6,
            borderRadius: 10,
            border: '1px solid var(--dsw-alias-border-l1)',
            background: 'var(--dsw-alias-bg-overlay)',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            pointerEvents: 'auto'
          }
        },
          h('div', {
            style: {
              padding: '5px 10px 7px',
              marginBottom: 3,
              borderBottom: '1px solid var(--dsw-alias-border-l1)',
              fontSize: 12,
              lineHeight: '16px',
              color: 'var(--dsw-alias-label-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }
          }, title),
          rows
      );
    }

    /* ------------------------------------------------------------------ */
    /* Sidebar panel icon + panel                                          */
    /* ------------------------------------------------------------------ */

    function SessionFavoritesPanelIcon(props) {
      const size = props && typeof props.size === 'number' ? props.size : 20;
      const items = useSnapshot(store.getItems);
      const count = items.length;
      const badge = count > 0
        ? h('span', {
          style: {
            position: 'absolute',
            top: -5,
            right: -7,
            minWidth: 13,
            height: 13,
            padding: '0 3px',
            borderRadius: 7,
            background: 'var(--dsw-alias-brand-primary)',
            color: 'var(--dsw-alias-bg-base)',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: '13px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }
        }, count > 99 ? '99+' : String(count))
        : null;
      return h('span', {
        style: { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
      }, h(StarIcon, { size: size, filled: count > 0 }), badge);
    }

    function SessionFavoritesPanel(props) {
      const t = props.t;
      const openSession = props.openSession;
      const items = useSnapshot(store.getItems);
      const sessions = props.useSessions(function (snapshot) { return snapshot; });

      const byId = (sessions && sessions.byId) || {};
      const phase = sessions ? sessions.phase : 'pending';

      const rows = items.map(function (item) {
        const live = byId[item.id] || null;
        const title = (live && live.title) || item.title || t('panel.untitled');
        const running = !!(live && live.running);
        const missing = !live && phase !== 'pending';
        const statusText = missing
          ? t('panel.missing')
          : running
            ? t('panel.running')
            : t('panel.idle');
        const statusColor = missing
          ? 'var(--dsw-alias-label-secondary)'
          : running
            ? 'var(--dsw-alias-state-success-primary)'
            : 'var(--dsw-alias-state-idle-primary)';
        return h('div', {
          key: item.id,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px 0 20px',
            minHeight: 44
          }
        },
          h('button', {
            type: 'button',
            title: fmt(t('panel.openLabel'), { title: title }),
            'aria-label': fmt(t('panel.openLabel'), { title: title }),
            onClick: function () { openSession(item.id); },
            onMouseEnter: function (event) { event.currentTarget.style.background = 'var(--dsw-alias-bg-layer-2)'; },
            onMouseLeave: function (event) { event.currentTarget.style.background = 'transparent'; },
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 1,
              minWidth: 0,
              padding: '7px 8px',
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              font: 'inherit',
              textAlign: 'left',
              cursor: 'pointer'
            }
          },
            h('span', {
              'aria-hidden': true,
              style: {
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background: statusColor
              }
            }),
            h('span', {
              style: {
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }
            },
              h('span', {
                style: {
                  fontSize: 14,
                  lineHeight: '20px',
                  color: 'var(--dsw-alias-label-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }, title),
              h('span', {
                style: { fontSize: 12, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' }
              }, statusText)
            )
          ),
          h('button', {
            type: 'button',
            title: t('panel.remove'),
            'aria-label': fmt(t('panel.removeLabel'), { title: title }),
            onClick: function () { store.remove(item.id); },
            onMouseEnter: function (event) { event.currentTarget.style.background = 'var(--dsw-alias-bg-layer-2)'; },
            onMouseLeave: function (event) { event.currentTarget.style.background = 'transparent'; },
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              flexShrink: 0,
              padding: 0,
              border: 'none',
              borderRadius: 7,
              background: 'transparent',
              color: 'var(--dsw-alias-state-warn-primary)',
              cursor: 'pointer',
              font: 'inherit'
            }
          }, h(StarIcon, { size: 15, filled: true }))
        );
      });

      const body = phase === 'pending' && items.length > 0
        ? h('div', { style: { padding: 28, textAlign: 'center', fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, t('panel.loading'))
        : items.length === 0
          ? h('div', { style: { padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } },
            h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, h(StarIcon, { size: 28, filled: false })),
            h('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, t('panel.emptyTitle')),
            h('div', { style: { fontSize: 12, lineHeight: '18px', textAlign: 'center', color: 'var(--dsw-alias-label-secondary)' } }, t('panel.emptyDesc')),
            h('div', { style: { marginTop: 4, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, t('panel.hint'))
          )
          : rows;

      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          background: 'var(--dsw-alias-bg-base)'
        }
      },
        h('div', {
          style: {
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--dsw-alias-border-l1)'
          }
        },
          h('div', { style: { fontSize: 18, fontWeight: 600, lineHeight: '24px', color: 'var(--dsw-alias-label-primary)' } }, t('panel.title')),
          h('div', { style: { marginTop: 4, fontSize: 13, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' } }, t('panel.subtitle')),
          h('div', { style: { marginTop: 6, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } },
            phase === 'pending' && items.length === 0
              ? t('panel.hint')
              : fmt(t('panel.count'), { count: items.length }) + ' · ' + t('panel.hint'))
        ),
        h('div', { style: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 0' } }, body)
      );
    }

    /* ------------------------------------------------------------------ */
    /* Entry                                                               */
    /* ------------------------------------------------------------------ */

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(function () {
          return ctx.locale.register(NS, { zh: zh, en: en });
        }, 'session-favorites: dictionaries');
        const t = ctx.locale.bind(NS);

        function openSession(sessionId) {
          store.closeMenu();
          if (!sessionId) return;
          try {
            ctx.uiWorkspace.openSession(sessionId);
          } catch (error) {
            /* A session that just disappeared cannot be opened. */
          }
        }

        ctx.slots.inject('sidebar.workspaces.session.row.action', function () {
          return ctx.slots.register({
            name: 'sidebar.workspaces.session.row.action',
            id: 'session-favorites.star',
            order: 300,
            inject: function () {
              return { t: t };
            }
          }, SessionFavoriteStar);
        });

        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 40,
            label: function () { return t('panel.title'); }
          }, SessionFavoritesPanelIcon);
        });

        ctx.slots.inject('main', function () {
          return ctx.slots.register({
            name: 'main',
            key: PANEL_ID,
            inject: function () {
              return { t: t, openSession: openSession };
            }
          }, SessionFavoritesPanel);
        });

        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register({
            name: 'shell.overlay',
            id: 'session-favorites.menu',
            order: 900,
            inject: function () {
              return { t: t, openSession: openSession };
            }
          }, SessionOptionsMenu);
        });
      }
    };
  }
});
