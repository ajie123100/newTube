import { SearchIcon } from "lucide-react";
import React from "react";

export const SearchInput = () => {
  // todo: add search functionality
  return (
    <div className="flex w-full max-w-150">
      <div className="relative w-full">
        <input
          type="text"
          placeholder="search"
          className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"
        />
        {/* todo: add remove search button */}
      </div>
      <button
        className="px-5
        py-2.5
        bg-gray-100
          border 
          border-l-0
          rounded-r-full
           hover:bg-gray-200
            disabled:opacity-50
             disabled:cursor-not-allowed"
        type="submit"
      >
        <SearchIcon className="size-5" />
      </button>
    </div>
  );
};
