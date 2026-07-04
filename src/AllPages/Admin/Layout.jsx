import { Outlet } from "react-router-dom";
import AdminNavbar from "../../Components/Admin/AdminNavbar";
import AdminSidebar from "../../Components/Admin/AdminSidebar";

function Layout(){
    return(
        <>
            <AdminNavbar/>
            <div className="flex relative" >
                <AdminSidebar/>
                <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 
                                h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] 
                                overflow-y-auto overflow-x-hidden min-w-0
                                bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]
                                admin-content" >
                    <Outlet/>
                </div>
            </div>
        </>
    )
}
export default Layout;