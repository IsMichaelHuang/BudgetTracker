import "../css/link-tab-container.css";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import CircularProgress from "../components/CircularProgress";
import type { SummaryType } from "../types/summaryType";


interface summaryProps {
  summaryData: SummaryType;
}

function UserPage({ summaryData }: summaryProps) {
  const user = useParams();
  const username = user.username;
  const userId = user.userId
  return (
    <main className="main-page">   
      <h1>Total Spent</h1>
      <CircularProgress 
        value={summaryData.user.totalAmount} 
        allotment={summaryData.user.totalAllotment} 
      />

      <div className="spending-list">
        {summaryData.categories.map(cat => (
          <Link 
            key={cat._id} 
            to={`/${username}/${userId}/${cat.title}/${cat._id}`}
          >
            <div className="tab">
              <p className="title">{cat.title}</p>
              <div>
                <p className="amount">{cat.amount}</p>
              </div>
            </div>
          </Link>
        ))}
        <Link 
          to={`/${username}/${userId}/category/new`} 
        > 
          <div className="tab"><p className="title">+ Add New Charge</p></div> 
        </Link>
      </div>

    </main>
  );
}
export default UserPage;


