/**
 * @module Header
 * @description Top navigation bar component. Displays the authenticated user's
 * name, navigation links (Home, Categories, Net Worth), a dark-mode toggle,
 * and a logout button that clears the JWT and redirects to the home page.
 */

import "../css/nav-menu.css";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import DarkModeToggle from "../components/DarkMode";

/**
 * Renders the application header with navigation and user controls.
 *
 * @param props.username - The authenticated user's display name.
 */
function Header({ username }: {username: string}) {
    const navigate = useNavigate();
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
                        navigate("/");
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
