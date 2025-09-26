import React from "react";
import { useThemeStore } from "../store/useThemeStore";

const Header = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();

  return (
    <header className="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white shadow sticky top-0 z-10">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <button
        onClick={toggleDarkMode}
        className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
};

export default Header;
