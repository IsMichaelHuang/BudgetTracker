import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router';

import type { CategoryType } from '../types/categoryType';
import type { SummaryType } from '../types/summaryType';

import { updateCategory, addCategory, deleteCategory } from '../api/categories';


interface CategoryFormProp {
  summaryData: SummaryType;
  refetch: () => void;
}

function CategoryFormPage({ summaryData, refetch }: CategoryFormProp) {
  const params = useParams();
  const username: string | undefined = params.username;
  const userId: string | undefined = params.userId;
  const categoryId: string | undefined = params.catId;
  const categoryList: CategoryType[] = summaryData.categories;
  const category: CategoryType | undefined = categoryList.find((cat) => cat._id === categoryId);
  const navigate = useNavigate();
  

  // Form state
  const [categoryName, setCategoryName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [allotment, setAllotment] = useState<number | undefined>(undefined);
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

  // Edit existing category
  useEffect(() => {
    if (category) {
      setCategoryName(category.title);
      setAmount(category.amount);
      setAllotment(category.allotment);
    } else {
        setIsCreatingCategory(true);
    }
  }, []);  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Get the Id from new category...
    if (!userId) throw new Error("Error: Unable to find User ID");
    if (!allotment) throw new Error("Error: Need a value for allotment")
    const data: CategoryType = {
      _id: categoryId,
      userId,
      title: categoryName,
      amount,
      allotment
    };

    // Update existing Charge
    if (!isCreatingCategory) {       
      await updateCategory(data);
    } else {
      // Create new charge
      await addCategory(data);
    }  
    navigate(`/${username}/${userId}`);
    refetch();
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault(); 

    if (!categoryId) throw new Error(`Error: Cannot delete Charge without an existing ID`);
    await deleteCategory(categoryId)

    navigate(`/${username}/${userId}`);
    refetch();
  }

  return (
    <main className="spending-list">
      <form onSubmit={handleSubmit}> 
        <div>
            <label htmlFor="charge-name" className="visually-hidden">Category Name:</label>
            <input
                type="text"
                id="charge-name"
                name="charge-name"
                placeholder="New Category Name"
                value={categoryName ?? ""}
                onChange={(e) => setCategoryName(e.target.value)}
            />
        </div> 

        <div>
          <label htmlFor="amount" className="visually-hidden">Amount ($):</label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="0.00"
            readOnly
            tabIndex={-1}
            value={amount}
          />
        </div> 

        <div>
          <label htmlFor="amount" className="visually-hidden">Allotment ($):</label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="0.00"
            required
            value={allotment ?? ""}
            onChange={(e) => setAllotment(parseFloat(e.target.value))}
          />
        </div> 

        <button type="submit">Submit</button>
        {categoryId && <button type="button" onClick={handleDelete}>Delete</button>}
        <button type="button" onClick={() => window.history.back()}>Cancel</button>
      </form>
    </main>
  );
}
export default CategoryFormPage;

