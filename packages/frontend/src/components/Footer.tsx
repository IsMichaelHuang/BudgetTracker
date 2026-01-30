import "../css/nav-menu.css";
import { Link } from 'react-router-dom';


function Footer(){
    return(
        <footer>
            <nav className="bottom-nav">
                <Link to="/">
                    <img src="public/images/home.png" alt="Home" />
                </Link>

                <Link to="/">
                    <img src="/public/images/pie-chart.png" alt="Categories" />
                </Link>

                <Link to="/net-worth">
                    <img src="/public/images/money.png" alt="Net Worth" />
                </Link>

                <Link to="#">
                    <img src="/public/images/gear.png" alt="Settings" />
                </Link>
            </nav>
        </footer>
    );
}

export default Footer

