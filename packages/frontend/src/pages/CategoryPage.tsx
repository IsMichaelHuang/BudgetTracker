/**
 * @module CategoryPage
 * @description Detail page for a single budget category. Shows the category's
 * spending progress via {@link CircularProgress}, lists all charges filed under
 * it, and provides links to edit the category or add a new charge.
 */

import { useParams } from "react-router";
import { Link } from 'react-router-dom';

// Circular Progress component
import '../css/link-tab-container.css';
import CircularProgress from '../components/CircularProgress';
import type { SummaryType } from "../types/summaryType";
import type { ChargeType } from '../types/chargeType';
import type { CategoryType } from '../types/categoryType';


/** Props for the {@link CategoryPage} component. */
interface CategoryProp {
  /** The full financial summary data for the authenticated user. */
  summaryData: SummaryType;
}

/**
 * Renders a category detail view with its progress ring, an edit button,
 * a list of associated charges, and an "Add New Charge" link.
 *
 * URL params used: `:username`, `:userId`, `:category` (title), `:catId` (ObjectId).
 *
 * @param props - {@link CategoryProp} containing the user's summary data.
 * @throws {Error} If `catId` is missing from URL params or the category is not found.
 */
function CategoryPage({ summaryData }: CategoryProp) {
  const params = useParams();

  const userId = params.userId;
  const username = params.username;

  const categoryId = params.catId;
  const categoryName = params.category;

  if (!categoryId) throw new Error(`Cannot find ${categoryName}`)

  // Filter the charges from category id and return the correct objects
  const category: CategoryType | undefined = summaryData.categories.find((cat) => cat._id === categoryId);
  if (!category) throw new Error("Error: Cannot find Category");

  const charges: ChargeType[] = summaryData.charges;
  const categoryCharges: ChargeType[] = charges.filter((cat) => cat.categoryId === categoryId);

  return (
    <main className="main-page">
      <h1>{categoryName}</h1>
      <CircularProgress value={category.amount} allotment={category.allotment} />
      <Link to={`/${username}/${userId}/${categoryId}`} >
        <button>edit</button>
      </Link>

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link key={ch._id} to={`/${username}/${userId}/${categoryName}/${categoryId}/${ch._id}`} >
            <div className="tab">
              <p className="title">{ch.description}</p>
              <div>
                <p className="date">{ch.date}</p>
                <p className="amount">{ch.amount}</p>
              </div>
            </div>
          </Link>
        ))}
        <Link
          to={`/${username}/${userId}/${categoryName}/${categoryId}/new`}
        >
          <div className="tab"><p className="title">+ Add New Charge</p></div>

        </Link>
      </div>
    </main>
  );
}
export default CategoryPage;
