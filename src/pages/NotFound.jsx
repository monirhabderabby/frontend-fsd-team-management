import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import NotFoundGif from "../assets/404.gif";

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 md:p-20 overflow-hidden">
      <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 animate-fade-in">

        <div className="flex-1 text-center flex flex-col items-center">
          <div className="space-y-8 max-w-lg">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter animate-slide-up [animation-delay:100ms]">
                404
              </h1>
            </div>

            <div className="relative">
              <img
                src={NotFoundGif}
                alt="404 Not Found"
                className="relative w-full max-w-100 md:max-w-137.5 h-auto object-contain"
              />
            </div>

            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed animate-slide-up [animation-delay:200ms]">
              We couldn't locate the specific data node you were attempting to access. The path may have been decommissioned or moved to a new sector.
            </p>

            <div className="pt-4 animate-slide-up [animation-delay:300ms]">
              <Link
                to="/"
                className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-12 py-5 text-sm font-black text-white shadow-2xl shadow-slate-900/30 transition-all hover:scale-105 active:scale-95 group hover:bg-emerald-600"
              >
                <ArrowLeft size={18} className="text-emerald-400 group-hover:text-white transition-colors" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
