import React, { useState } from 'react';

interface NetWorthFormPageProps {}

function NetWorthFormPage({}: NetWorthFormPageProps) {
  const [chargeName, setChargeName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle form submission
  };

  return (
    <main className="main-page">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="charge-name" className="visually-hidden">Charge Name:</label>
          <input
            type="text"
            id="charge-name"
            name="charge-name"
            placeholder="Charge Name"
            value={chargeName}
            onChange={e => setChargeName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="amount" className="visually-hidden">Amount ($):</label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="0.00"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}

export default NetWorthFormPage;

