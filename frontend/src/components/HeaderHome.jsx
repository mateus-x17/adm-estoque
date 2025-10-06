import { useEffect } from "react";
import { CgLogIn } from "react-icons/cg";
import { HiHome} from "react-icons/hi";
import { FiSun, FiMoon } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";


function HeaderHome() {
    const { darkMode, toggleDarkMode } = useThemeStore();

    const links = [
    { name: "Dashboard", path: "/dashboard", icon: <HiHome size={20} /> },
    { name: "Login", path: "/auth", icon: <CgLogIn size={20} /> },
  ];

    useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <>
      {/* cabeçalho com links */}
      <header className="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-800 transition-all duration-300 ">

        {/* nome sistema */}
        <h2 className="text-lg font-semibold dark:text-white">Dashboard-ADM</h2>

        {/* links */}
        <div className="flex items-center gap-4">    
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                className="flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-700 dark:text-white"
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}

            {/* botão dark mode */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-700 dark:text-white"
            >
              {darkMode ? (
                <FiSun className="h-6 w-6" />
              ) : (
                <FiMoon className="h-6 w-6" />
              )}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
        </div>

      </header>
    </>
  )
}

export default HeaderHome
