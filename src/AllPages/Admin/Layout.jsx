import { Outlet } from "react-router-dom";
import AdminNavbar from "../../Components/Admin/AdminNavbar";
import AdminSidebar from "../../Components/Admin/AdminSidebar";

function Layout(){
    return(
    <>
        <AdminNavbar/>
        <div className="flex" >
            <AdminSidebar/>
            <div className="flex-1 px-3 sm:px-4 py-6 sm:py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden min-w-0" >
                <Outlet/>
            </div>
        </div>
    </>
    )
}
export default Layout;