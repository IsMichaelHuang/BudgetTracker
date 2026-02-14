/**
 * @module NetWorthPage
 * @description Page showing the user's net worth summary.
 * Displays separate sections for assets and liabilities with a net total.
 * Items are shown as clickable tabs linking to the edit form.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { NetWorthType } from "../types/netWorthType";
import { getNetWorth } from "../api/networth";

/** Props for the {@link NetWorthPage} component. */
interface NetWorthPageProps {
  /** The authenticated user's ID. */
  userId: string;
  /** JWT token (unused directly, but mirrors pattern for consistency). */
  token: string | null;
}

/**
 * Renders the net worth dashboard with assets, liabilities, and net total.
 *
 * @param props - {@link NetWorthPageProps}
 */
function NetWorthPage({ userId, token }: NetWorthPageProps) {
  const [items, setItems] = useState<NetWorthType[]>([]);

  useEffect(() => {
    if (userId) {
      getNetWorth(userId).then(setItems);
    }
  }, [userId, token]);

  const assets = items.filter((item) => item.type === "asset");
  const liabilities = items.filter((item) => item.type === "liability");

  const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
  const netTotal = totalAssets - totalLiabilities;

  return (
    <main className="main-page">
      <h1>Net Worth</h1>
      <h2>${netTotal.toFixed(2)}</h2>

      <div className="spending-list">
        <h3>Assets (${totalAssets.toFixed(2)})</h3>
        {assets.map((item) => (
          <Link key={item._id} to={`/net-worth/${item._id}`}>
            <div className="tab">
              <p className="title">{item.name}</p>
              <div>
                <p className="amount">${item.value.toFixed(2)}</p>
              </div>
            </div>
          </Link>
        ))}

        <h3>Liabilities (${totalLiabilities.toFixed(2)})</h3>
        {liabilities.map((item) => (
          <Link key={item._id} to={`/net-worth/${item._id}`}>
            <div className="tab">
              <p className="title">{item.name}</p>
              <div>
                <p className="amount">${item.value.toFixed(2)}</p>
              </div>
            </div>
          </Link>
        ))}

        <Link to="/net-worth/new">
          <div className="tab"><p className="title">+ Add New</p></div>
        </Link>
      </div>
    </main>
  );
}
export default NetWorthPage;
