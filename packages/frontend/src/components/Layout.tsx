import { Outlet } from 'react-router-dom';

import '../css/nav-menu.css';

import Header from './Header';
import Footer from './Footer';


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

