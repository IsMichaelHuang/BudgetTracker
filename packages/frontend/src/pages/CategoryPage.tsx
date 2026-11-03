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
import { categorySlug } from '../hooks/useSlugtify';


/** Props for the {@link CategoryPage} component. */
interface CategoryProp {
  /** The full financial summary data for the authenticated user. */
  summaryData: SummaryType;
}

/**
 * Renders a category detail view with its progress ring, an edit button,
 * a list of associated charges, and an "Add New Charge" link.
 *
 * URL params used: `:username`, `:userId`, `:catId` (ObjectId).
 * `:category` is a display slug and is never read.
 *
 * @param props - {@link CategoryProp} containing the user's summary data.
 * @throws {Error} If `catId` is missing from URL params or the category is not found.
 */
function CategoryPage({ summaryData }: CategoryProp) {
  const params = useParams();

  const userId = params.userId;
  const username = params.username;

  const categoryId = params.catId;

  if (!categoryId) throw new Error("Cannot find category")

  // Filter the charges from category id and return the correct objects
  const category: CategoryType | undefined = summaryData.categories.find((cat) => cat._id === categoryId);
  if (!category) throw new Error("Error: Cannot find Category");

  const charges: ChargeType[] = summaryData.charges;
  const categoryCharges: ChargeType[] = charges.filter((cat) => cat.categoryId === categoryId);

  const slug = categorySlug(category.title);

  return (
    <main className="main-page">
      <h1>{category.title}</h1>
      <CircularProgress value={category.amount} allotment={category.allotment} />
      <Link to={`/${username}/${userId}/${categoryId}`} >
        <button>edit</button>
      </Link>

      <div className="spending-list">
        {categoryCharges.map(ch => (
          <Link
            key={ch._id}
            to={`/${username}/${userId}/${slug}/${categoryId}/${ch._id}`}
          >
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
          to={`/${username}/${userId}/${slug}/${categoryId}/new`}
        >
          <div className="tab"><p className="title">+ Add New Charge</p></div>

        </Link>
      </div>
    </main>
  );
}
export default CategoryPage;
