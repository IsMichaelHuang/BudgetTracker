import "../css/link-tab-container.css";
import { Link } from "react-router-dom";
import CircularProgress from "../components/CircularProgress";
import type { SummaryType } from "../types/summaryType";


interface summaryProps {
  summaryData: SummaryType;
}

function UserPage({ summaryData }: summaryProps) {
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
            to={`/category/${cat.title}/${cat._id}`}
            state={{ 
              userId: summaryData.user._id,
              catId: cat._id,
              charges: summaryData.charges,
              cat
            }}
          >
            <div className="tab">
              <p className="title">{cat.title}</p>
              <div>
                <p className="amount">{cat.amount}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </main>
  );
}
export default UserPage;


