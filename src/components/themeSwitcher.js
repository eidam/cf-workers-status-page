import { useEffect, useState } from 'react'

const moonIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="h-5 mx-auto"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
)

const sunIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="h-5 mx-auto"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

export default function ThemeSwitcher() {
  const [darkmode, setDark] = useState(localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    setTheme(darkmode ? 'dark' : 'light')
  }, [darkmode])

  const changeTheme = () => {
    setDark(!darkmode)
  }

  const buttonColor = darkmode ? 'bg-gray-700 focus:ring-gray-700' : 'bg-gray-200 focus:ring-gray-200'

  return (
    <button
      className={`${buttonColor} rounded-full h-7 w-7 mr-4 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
      onClick={changeTheme}
    >
      {darkmode ? sunIcon : moonIcon}
    </button>
  )
}
