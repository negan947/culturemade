const Calculator = () => {
  return (
    <div className='h-full bg-black text-white flex flex-col justify-end p-4'>
      <div className='text-right text-6xl mb-4 font-light'>0</div>
      <div className='grid grid-cols-4 gap-3'>
        {/* First row */}
        <button className='bg-gray-500 h-16 rounded-full text-2xl font-medium'>
          AC
        </button>
        <button className='bg-gray-500 h-16 rounded-full text-2xl font-medium'>
          ±
        </button>
        <button className='bg-gray-500 h-16 rounded-full text-2xl font-medium'>
          %
        </button>
        <button className='bg-orange-500 h-16 rounded-full text-2xl font-medium'>
          ÷
        </button>

        {/* Second row */}
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          7
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          8
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          9
        </button>
        <button className='bg-orange-500 h-16 rounded-full text-2xl font-medium'>
          ×
        </button>

        {/* Third row */}
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          4
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          5
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          6
        </button>
        <button className='bg-orange-500 h-16 rounded-full text-2xl font-medium'>
          −
        </button>

        {/* Fourth row */}
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          1
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          2
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          3
        </button>
        <button className='bg-orange-500 h-16 rounded-full text-2xl font-medium'>
          +
        </button>

        {/* Fifth row */}
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium col-span-2'>
          0
        </button>
        <button className='bg-gray-800 h-16 rounded-full text-2xl font-medium'>
          .
        </button>
        <button className='bg-orange-500 h-16 rounded-full text-2xl font-medium'>
          =
        </button>
      </div>
    </div>
  );
};

export default Calculator;
