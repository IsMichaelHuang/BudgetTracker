/**
 * @module UserPage
 * @description Dashboard page showing the user's overall budget summary.
 * Displays a {@link CircularProgress} ring for total spending vs. allotment,
 * a list of category tabs with their amounts, and a link to add a new category.
 */

import "../css/link-tab-container.css";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import CircularProgress from "../components/CircularProgress";
import type { SummaryType } from "../types/summaryType";


/** Props for the {@link UserPage} component. */
interface summaryProps {
  /** The full financial summary data for the authenticated user. */
  summaryData: SummaryType;
}

/**
 * Renders the user's main dashboard with total spending progress and
 * a scrollable list of budget categories.
 *
 * URL params used: `:username`, `:userId`.
 *
 * @param props - {@link summaryProps} containing the user's summary data.
 */
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
