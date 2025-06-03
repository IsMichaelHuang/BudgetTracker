import "../css/nav-menu.css";
import { Link } from 'react-router-dom';
import DarkModeToggle from "../components/DarkMode";

function Header({ username }: {username: string}) {
    return(
        <header>
            <nav className="top-nav">
                <div className="from-bottom-nav">
                    <h1>{username}</h1>
                    <Link to="/">Home</Link>
                    <Link to="/">Categories</Link>
                    <Link to="/net-worth">Net Worth</Link>
                </div>

                <div className="from-top-nav">
                    {/* <img src="/public/images/bell.png" alt="Notification" /> */}
                    {/* <img src="/public/images/hamburger.png" alt="Menu" /> */}
                    {/* <img src="/public/images/gear.png" alt="Settings" /> */}
                    < DarkModeToggle />
                    <button onClick={() => {
                        localStorage.removeItem("token");
                        window.location.reload();
                    }}>
                        Logout
                    </button>
                </div>
            </nav>
        </header>
    );
}

export default Header;

