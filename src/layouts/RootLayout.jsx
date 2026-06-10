
import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/Topbar.jsx";
import { Toaster } from "react-hot-toast";
import WipDeadlineAlert from "../components/WipDeadlineAlert.jsx";
import WipMarquee from "../components/WipMarquee.jsx";

const RootLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed((prev) => !prev);
    };

    return (
        <div className={`app-shell${isSidebarCollapsed ? " is-collapsed" : ""}`}>
            <Sidebar isCollapsed={isSidebarCollapsed} />
            <div className="app-main">
                <WipMarquee />
                <TopBar onToggleSidebar={handleToggleSidebar} />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
            <div className="app-credit">Developed By Team WIX</div>
            <WipDeadlineAlert />
            <Toaster position="bottom-right" reverseOrder={false} />
        </div>
    );
};

export default RootLayout;