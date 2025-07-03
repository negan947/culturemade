const Components = () => {
  return (
    <div className="h-full bg-gray-100 p-6">
      <div className="text-center mt-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">CultureMade</h1>
        <div className="text-6xl mb-6">🎨</div>
        <p className="text-lg text-gray-600 mb-8">
          Authentic Street Culture
        </p>
        
        <div className="space-y-4">
          <button className="w-full bg-black text-white py-4 rounded-xl text-lg font-medium">
            Browse Products
          </button>
          <button className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl text-lg font-medium">
            View Cart
          </button>
          <button className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl text-lg font-medium">
            Account
          </button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Something Raw is Coming...</p>
        </div>
      </div>
    </div>
  );
};

export default Components; 