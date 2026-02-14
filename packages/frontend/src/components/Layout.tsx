/**
 * @module Layout
 * @description Root layout component used by React Router. Renders the
 * {@link Header} and {@link Footer} around the active route's content
 * via React Router's `<Outlet />`.
 */

import { Outlet } from 'react-router-dom';

import '../css/nav-menu.css';

import Header from './Header';
import Footer from './Footer';


/**
 * Wraps child routes with the shared header and footer chrome.
 *
 * @param props.username - The authenticated user's display name, passed to {@link Header}.
 */
function Layout({ username }: {username: string}) {
  return (
    <>
      <Header username={username}/>
      <Outlet />
      <Footer />
    </>
  );
}

export default Layout;
