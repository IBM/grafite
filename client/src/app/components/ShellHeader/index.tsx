import { Header } from '@carbon/react';
import { Theme } from '@carbon/react';
import {
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  SideNav,
  SideNavDivider,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
} from '@carbon/react';
import { Dashboard, Launch, Light, Logout, Moon } from '@carbon/react/icons';
import { useIsMaintainer } from '@hooks/permissionHooks';
import { HEADER_NAME } from '@utils/constants';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Fragment } from 'react';

import { useThemePreference } from '../ThemePreference/ThemePreference';
import {
  NO_SIDENAV,
  TEST_CREATION_PATHS,
  TEST_FEEDBACK_PATH,
  TEST_MANAGER_PATH,
  TEST_MANAGER_PATHS,
} from './constants';
import styles from './ShellHeader.module.scss';

const ShellHeader = () => {
  const { theme, setTheme } = useThemePreference();

  const path = usePathname();

  return (
    <>
      <Theme theme="g100">
        <Header className={styles.wrapper}>
          <HeaderName href="/" prefix="">
            {HEADER_NAME}
          </HeaderName>
          <HeaderGlobalBar>
            <HeaderGlobalAction
              aria-label="Theme"
              onClick={() => (theme === 'white' ? setTheme('g100') : setTheme('white'))}
              tooltipAlignment="end"
            >
              {theme === 'white' && <Light size={20} />}
              {theme !== 'white' && <Moon size={20} />}
            </HeaderGlobalAction>
            <HeaderGlobalAction aria-label="Logout" onClick={() => signOut()} tooltipAlignment="end">
              <Logout size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
          <Theme theme={theme ?? 'white'}>{!NO_SIDENAV.includes(path) && <Sidebar path={path} />}</Theme>
        </Header>
      </Theme>
    </>
  );
};

export default ShellHeader;

const Sidebar = ({ path }: { path: string }) => {
  const isMaintainer = useIsMaintainer();

  return (
    <SideNav isRail aria-label="Side navigation" className={styles.sideNav}>
      <SideNavItems>
        {TEST_CREATION_PATHS.map((route, idx) => (
          <Fragment key={`test-creation-side-menu-${idx}`}>
            <SideNavLink href={route.link} renderIcon={route.icon} title={route.label} isActive={path === route.link}>
              {route.label}
            </SideNavLink>
          </Fragment>
        ))}

        {TEST_FEEDBACK_PATH && (
          <>
            <SideNavDivider />
            <SideNavLink href={TEST_FEEDBACK_PATH.link} title={TEST_FEEDBACK_PATH.label} target="_blank">
              <span className={styles.feedback}>
                <span>{TEST_FEEDBACK_PATH.label}</span> <Launch />
              </span>
            </SideNavLink>
          </>
        )}
        {isMaintainer && (
          <>
            <SideNavDivider />
            <SideNavMenu
              title="Analytics"
              aria-label="Analytics"
              renderIcon={Dashboard}
              defaultExpanded
              isSideNavExpanded
              isActive={path.includes(TEST_MANAGER_PATH)}
              className={path.includes(TEST_MANAGER_PATH) ? styles.sideNavMenuSelected : ''}
            >
              {TEST_MANAGER_PATHS.map((route, idx) => (
                <Fragment key={`test-manager-side-menu-${idx}`}>
                  <SideNavMenuItem href={TEST_MANAGER_PATH + route.link}>{route.label}</SideNavMenuItem>
                </Fragment>
              ))}
            </SideNavMenu>
          </>
        )}
      </SideNavItems>
    </SideNav>
  );
};
