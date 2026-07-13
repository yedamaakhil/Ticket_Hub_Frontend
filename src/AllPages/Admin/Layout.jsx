import { Outlet, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import AdminNavbar from "../../Components/Admin/AdminNavbar";
import AdminSidebar from "../../Components/Admin/AdminSidebar";

function Layout() {
    const { user, isLoaded } = useUser();

    // Still loading Clerk session — show spinner
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Not signed in OR not an admin → redirect to home
    if (!user || user.publicMetadata?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <AdminNavbar />
            <div className="flex relative">
                <AdminSidebar />
                <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 
                                h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] 
                                overflow-y-auto overflow-x-hidden min-w-0
                                bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]
                                admin-content">
                    <Outlet />
                </div>
            </div>
        </>
    );
}

export default Layout;