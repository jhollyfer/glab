import React from "react"

export function App() {
  const [count, setCount] = React.useState(0)

  return (
    <main className='flex justify-center items-center h-screen flex-col gap-4'>
      <h1 className='text-3xl text-sky-600'>GLab Counter</h1>
      <div className="card">
        <button 
         className='bg-sky-600 text-white p-2 cursor-pointer rounded-md'
        onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </main>
  )
}

