const MaintenanceMode = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
      <div className="max-w-lg text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-300 text-3xl font-black">
          !
        </div>
        <h1 className="text-3xl font-black tracking-tight">Site Under Maintenance</h1>
        <p className="text-sm text-slate-300">
          We are performing scheduled maintenance. Please check back soon.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMode;
