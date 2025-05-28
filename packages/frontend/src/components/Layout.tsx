import { Outlet } from 'react-router-dom';

import '../css/nav-menu.css';

import Header from './Header';
import Footer from './Footer';

interface userProp {
  userName: string
}

function Layout({userName}: userProp) {
  return (
    <>
      <Header user={userName}/>
      <Outlet />
      <Footer />
    </>
  );
}

export default Layout;

