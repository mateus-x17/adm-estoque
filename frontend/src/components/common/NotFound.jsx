import React from 'react'

function NotFound() {
  return (
    <div className='flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-r from-purple-800 via-gray-400 to-green-600
    bg-[length:400%_400%] animate-gradientShift '>
      <h1 className='text-4xl md:text-5xl font-bold drop-shadow-lg text-white'>404</h1>
      <h2 className='text-lg md:text-xl mt-4 max-w-2xl px-4 text-white'>Página não encontrada :(</h2>
      
    </div>
  )
}

export default NotFound;
