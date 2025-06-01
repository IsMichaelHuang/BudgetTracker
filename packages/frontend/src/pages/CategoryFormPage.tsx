import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { ChargeType } from '../types/chargeType';


interface CategoryFormProp {
  title: string;
  charge: ChargeType;
}

function CategoryFormPage() {
  const location = useLocation(); 
  const { title, charge } = (location.state as CategoryFormProp);

  const [category, setCategory] = useState<string | null>(null);
  const [data, setDate] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  // Create new charge or editing?
  if (title && charge ) {
    setCategory(charge.categoryId);
    setDate(charge.date);
    setDescription(charge.description);
    setAmount(charge.amount);
  }

  // TODO
  return ();
}
export default CategoryFormPage;

