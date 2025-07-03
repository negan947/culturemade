const Weather = () => {
  return (
    <div className="h-full bg-gradient-to-b from-blue-400 to-blue-600 text-white p-6">
      <div className="text-center mt-16">
        <h1 className="text-3xl font-light mb-2">San Francisco</h1>
        <div className="text-8xl font-thin mb-4">72°</div>
        <p className="text-xl mb-2">Partly Cloudy</p>
        <p className="text-sm opacity-80">H:76° L:65°</p>
      </div>
      
      <div className="mt-12">
        <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-md">
          <h3 className="text-lg font-medium mb-4">Hourly Forecast</h3>
          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-sm">Now</p>
              <p className="text-2xl my-2">☀️</p>
              <p className="text-sm">72°</p>
            </div>
            <div className="text-center">
              <p className="text-sm">2PM</p>
              <p className="text-2xl my-2">⛅</p>
              <p className="text-sm">74°</p>
            </div>
            <div className="text-center">
              <p className="text-sm">3PM</p>
              <p className="text-2xl my-2">⛅</p>
              <p className="text-sm">75°</p>
            </div>
            <div className="text-center">
              <p className="text-sm">4PM</p>
              <p className="text-2xl my-2">🌤️</p>
              <p className="text-sm">73°</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather; 