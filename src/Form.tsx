import React from "react";

interface FormProps {
  onSubmitHandler: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onChangeHandler: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Form: React.FC<FormProps> = ({
  onSubmitHandler,
  onChangeHandler,
}) => {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="name" className="block font-medium mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          onChange={onChangeHandler}
          className="border px-3 py-2 rounded w-full"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          onChange={onChangeHandler}
          className="border px-3 py-2 rounded w-full"
          required
        />
      </div>

      <button
        type="button"
        onClick={onSubmitHandler}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
};
