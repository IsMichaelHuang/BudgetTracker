/**
 * @module NetWorthFormPage
 * @description Form page for creating or editing a net worth entry.
 * When a `:nwId` URL param is present, the form pre-populates with existing
 * data for editing; otherwise it renders a blank form for creation.
 * Supports create, update, and delete operations via the net worth API client.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { formatToDate } from '../hooks/useFormatDate';

import type { NetWorthType } from '../types/netWorthType';
import { getNetWorth, addNetWorth, updateNetWorth, deleteNetWorth } from '../api/networth';

/** Props for the {@link NetWorthFormPage} component. */
interface NetWorthFormPageProps {
  /** The authenticated user's ID. */
  userId: string;
  /** Callback to trigger a data re-fetch after a mutation. */
  refetch: () => void;
}

/**
 * Renders a net worth form with name, type, value, description, and date fields.
 * Determines create vs. edit mode based on the `:nwId` URL param.
 * Shows a delete button only when editing an existing entry.
 *
 * @param props - {@link NetWorthFormPageProps}
 */
function NetWorthFormPage({ userId, refetch }: NetWorthFormPageProps) {
  const params = useParams();
  const nwId: string | undefined = params.nwId;

  // Form state
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("asset");
  const [value, setValue] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [, setExisting] = useState<NetWorthType | undefined>(undefined);

  // Load existing entry for edit mode
  useEffect(() => {
    if (nwId && nwId !== "new" && userId) {
      getNetWorth(userId).then((items) => {
        const found = items.find((item) => item._id === nwId);
        if (found) {
          setExisting(found);
          setName(found.name);
          setType(found.type);
          setValue(found.value);
          setDescription(found.description);
          setDate(formatToDate(found.date));
        }
      });
    }
  }, [nwId, userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) throw new Error("Error: Unable to find User ID");
    if (value === undefined) throw new Error("Error: Need a valid value");

    const data: NetWorthType = {
      _id: nwId && nwId !== "new" ? nwId : undefined,
      userId,
      name,
      type,
      value,
      description,
      date
    };

    if (nwId && nwId !== "new") {
      await updateNetWorth(data);
    } else {
      await addNetWorth(data);
    }
    window.history.back();
    refetch();
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();

    if (!nwId) throw new Error("Error: Cannot delete entry without an existing ID");
    await deleteNetWorth(nwId);

    window.history.back();
    refetch();
  }

  return (
    <main className="spending-list">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nw-name" className="visually-hidden">Name:</label>
          <input
            type="text"
            id="nw-name"
            name="nw-name"
            placeholder="Entry Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="nw-type">Type</label>
          <select
            id="nw-type"
            name="nw-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </select>
        </div>
        <div>
          <label htmlFor="nw-value" className="visually-hidden">Value ($):</label>
          <input
            type="number"
            id="nw-value"
            name="nw-value"
            placeholder="0.00"
            required
            value={value ?? ""}
            onChange={(e) => setValue(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="nw-description" className="visually-hidden">Description:</label>
          <input
            type="text"
            id="nw-description"
            name="nw-description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nw-date">Enter Date:</label>
          <input
            type="date"
            id="nw-date"
            name="nw-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit</button>
        {nwId && nwId !== "new" && <button type="button" onClick={handleDelete}>Delete</button>}
        <button type="button" onClick={() => window.history.back()}>Cancel</button>
      </form>
    </main>
  );
}
export default NetWorthFormPage;
